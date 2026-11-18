// The hosted Sites gateway establishes the identity header. Never forward client-supplied
// identity headers to this worker from a public proxy or an unauthenticated local preview.
const providerConfig = {
  ark: {
    model: "doubao-seed-2-1-lite-260915",
    deepModel: "doubao-seed-2-1-pro-260915",
    url: "https://ark.cn-beijing.volces.com/api/v3/responses",
  },
  openai: {
    model: "gpt-6-luna",
    deepModel: "gpt-6.2-sol",
    url: "https://api.openai.com/v1/responses",
  },
};

const instructions = {
  reading:
    "结合本题英文证据，用中文解释题干改写、干扰项和学习者答案，给出可在下一段文章中复用的判断步骤。若是 Not Given，说明现有信息无法推出哪个结论。",
  vocabulary:
    "用中文解释学习者给出的英文词义、搭配或选词错误，引用学习者原句，给一个职场例句，最后留一个换场景的小题。",
  grammar:
    "用中文指出一个关键语法问题，引用原句，给修正版、简明原因和一个用同规则表达的新任务。注意不要把正确的变体判错。",
  writing:
    "按任务回应、连贯、词汇和语法给简明中文反馈。引用学习者的具体英文表达，给一处有理由的改写，请学习者自己完成第二稿。提供参考意见，避免宣称官方评分。",
  speaking:
    "根据提供的英文转写用中文点评表达清晰度、语法和用词。引用一句原话并给出改说任务。纯文字不反映发音和声学表现。",
  conversation:
    "扮演职场同事，用自然简短的英语回应最新一句并据其中的具体细节提出一个追问，控制在三句以内。",
};

class RequestError extends Error {
  constructor(status, code, details = {}) {
    super(code);
    this.status = status;
    this.details = details;
  }
}
function fail(status, code, details) {
  throw new RequestError(status, code, details);
}
function json(value, status = 200) {
  return Response.json(value, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
function validateKey(value, max = 350) {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.length > max ||
    /[\x00-\x1f\x7f]/.test(value)
  )
    fail(400, "invalid_key");
  return value;
}
async function bytesLimited(request, max) {
  if (Number(request.headers.get("content-length")) > max)
    fail(413, "payload_too_large");
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  let length = 0;
  const chunks = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > max) {
      await reader.cancel().catch(() => {});
      fail(413, "payload_too_large");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}
async function body(request) {
  if (
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  )
    fail(415, "json_required");
  let data;
  const bytes = await bytesLimited(request, 128 * 1024);
  try {
    data = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    fail(400, "invalid_json");
  }
  if (!data || typeof data !== "object" || Array.isArray(data))
    fail(400, "invalid_json");
  return data;
}
const stmt = (db, sql, ...args) => db.prepare(sql).bind(...args);
const rows = async (db, sql, ...args) =>
  (await stmt(db, sql, ...args).all()).results;
const one = (db, sql, ...args) => stmt(db, sql, ...args).first();
const now = () => new Date().toISOString();
function requireMethod(actual, allowed) {
  if (!allowed.includes(actual)) fail(405, "method_not_allowed");
}
function verifyOrigin(request, url) {
  const origin = request.headers.get("origin");
  if (
    (origin && origin !== url.origin) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    fail(403, "cross_origin");
}
function selectProvider(name) {
  if (!Object.hasOwn(providerConfig, name)) fail(400, "unknown_provider");
  return name;
}
async function settings(db, user) {
  const [preferences, selected] = await Promise.all([
    rows(
      db,
      "SELECT provider, model, deep_model, (secret IS NOT NULL) AS configured FROM ai_config WHERE owner = ?",
      user,
    ),
    one(db, "SELECT provider FROM ai_selection WHERE owner = ?", user),
  ]);
  const providers = Object.fromEntries(
    Object.entries(providerConfig).map(([name, defaults]) => [
      name,
      {
        configured: false,
        model: defaults.model,
        deepModel: defaults.deepModel,
      },
    ]),
  );
  for (const pref of preferences) {
    if (Object.hasOwn(providers, pref.provider))
      providers[pref.provider] = {
        model: pref.model,
        deepModel: pref.deep_model || providerConfig[pref.provider].deepModel,
        configured: !!pref.configured,
      };
  }
  return { provider: selected?.provider || "ark", providers };
}
async function getState(db, user) {
  const [progress, attempts, drafts, conflicts, audio, config] =
    await Promise.all([
      rows(db, "SELECT k,value FROM progress WHERE owner = ?", user),
      rows(
        db,
        "SELECT value FROM attempts WHERE owner = ? ORDER BY created_at,id",
        user,
      ),
      rows(
        db,
        "SELECT k,text,revision,updated_at AS updatedAt FROM drafts WHERE owner = ?",
        user,
      ),
      rows(
        db,
        "SELECT k,id,text,base_revision AS baseRevision,updated_at AS updatedAt FROM draft_conflicts WHERE owner = ? ORDER BY updated_at,id",
        user,
      ),
      rows(
        db,
        "SELECT id,type,size,created_at AS createdAt FROM recordings WHERE owner = ? ORDER BY created_at,id",
        user,
      ),
      settings(db, user),
    ]);
  const savedDrafts = Object.create(null);
  for (const { k, ...draft } of drafts)
    savedDrafts[k] = { ...draft, conflicts: [] };
  for (const { k, ...conflict } of conflicts)
    savedDrafts[k]?.conflicts.push(conflict);
  return {
    attempts: attempts.map((row) => JSON.parse(row.value)),
    progress: Object.fromEntries(
      progress.map((row) => [row.k, JSON.parse(row.value)]),
    ),
    drafts: savedDrafts,
    audio,
    settings: config,
  };
}
async function attempt(request, db, user) {
  const data = await body(request);
  validateKey(data.id);
  await stmt(
    db,
    "INSERT INTO attempts(owner,id,value,created_at) VALUES(?,?,?,?) ON CONFLICT(owner,id) DO NOTHING",
    user,
    data.id,
    JSON.stringify(data),
    now(),
  ).run();
  const saved = await one(
    db,
    "SELECT value FROM attempts WHERE owner = ? AND id = ?",
    user,
    data.id,
  );
  return json(JSON.parse(saved.value));
}
function mergeAttempt(previous, incoming) {
  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming))
    fail(400, "invalid_attempt");
  if (!previous) return incoming;
  const incomingLast =
    String(incoming.updatedAt || "") >= String(previous.updatedAt || "");
  const combined = incomingLast
    ? { ...previous, ...incoming }
    : { ...incoming, ...previous };
  function distinctVersions(earlier = [], later = []) {
    const result = new Map();
    for (const row of [...earlier, ...later])
      if (row?.id) result.set(row.id, row);
    return [...result.values()];
  }
  const answers = Object.create(null);
  for (const [index, answer] of Object.entries(previous.answers || {}))
    answers[index] = answer;
  for (const [index, next] of Object.entries(incoming.answers || {})) {
    if (!next || typeof next !== "object") continue;
    const saved = answers[index];
    if (!saved) {
      answers[index] = next;
      continue;
    }
    // A newer pre-submit cursor event from the other device must never erase a submitted answer.
    let preferNext = incomingLast;
    if (!!saved.submitted !== !!next.submitted) preferNext = !!next.submitted;
    else if (
      next.submittedAt &&
      saved.submittedAt &&
      next.submittedAt !== saved.submittedAt
    )
      preferNext = next.submittedAt > saved.submittedAt;
    answers[index] = preferNext ? { ...saved, ...next } : { ...next, ...saved };
    if (saved.history || next.history)
      answers[index].history = distinctVersions(saved.history, next.history);
    if (saved.firstCorrect !== undefined && next.firstCorrect !== undefined) {
      const earlier =
        (saved.history?.[0]?.at || saved.submittedAt || "") <=
        (next.history?.[0]?.at || next.submittedAt || "")
          ? saved
          : next;
      answers[index].firstCorrect = earlier.firstCorrect;
    }
  }
  combined.answers = answers;
  if (previous.retries || incoming.retries)
    combined.retries = distinctVersions(previous.retries, incoming.retries);
  if (
    combined.activeRepeat?.id &&
    combined.retries?.some((row) => row.id === combined.activeRepeat.id)
  )
    combined.activeRepeat = null;
  if (previous.activity || incoming.activity) {
    combined.activity = { ...previous.activity };
    for (const [date, seconds] of Object.entries(incoming.activity || {})) {
      combined.activity[date] = Math.max(
        Number(combined.activity[date]) || 0,
        Number(seconds) || 0,
      );
    }
  }
  combined.elapsedSeconds = Math.max(
    Number(previous.elapsedSeconds) || 0,
    Number(incoming.elapsedSeconds) || 0,
  );
  if (previous.completed || incoming.completed) {
    combined.completed = true;
    combined.completedAt = [previous.completedAt, incoming.completedAt]
      .filter(Boolean)
      .sort()[0];
    combined.correct = Object.values(answers).filter(
      (answer) =>
        answer?.submitted && (answer.firstCorrect ?? answer.correct) === true,
    ).length;
    const finished = incoming.completed ? incoming : previous;
    combined.graded = finished.graded;
    combined.total = finished.total;
  }
  return combined;
}
async function mergeProgress(db, user, key, value) {
  // Conditional update retries make merging two independently submitted items atomic in D1.
  for (let retry = 0; retry < 8; retry++) {
    const current = await one(
      db,
      "SELECT value FROM progress WHERE owner=? AND k=?",
      user,
      key,
    );
    const previous = current ? JSON.parse(current.value) : undefined;
    let merged;
    if (key.startsWith("attempt.")) {
      merged = mergeAttempt(previous, value);
    } else {
      if (!value || typeof value !== "object" || Array.isArray(value))
        fail(400, "invalid_review");
      const incomingLast =
        !previous ||
        String(value.updatedAt || "") >= String(previous.updatedAt || "");
      const [older, newer] = incomingLast
        ? [previous, value]
        : [value, previous];
      merged = {
        ...older,
        ...newer,
        tiers: { ...older?.tiers, ...newer?.tiers },
      };
    }
    const result = await one(
      db,
      "INSERT INTO progress(owner,k,value) VALUES(?,?,?) ON CONFLICT(owner,k) DO UPDATE SET value=excluded.value WHERE progress.value=? RETURNING value",
      user,
      key,
      JSON.stringify(merged),
      current?.value ?? null,
    );
    if (result) return merged;
  }
  fail(503, "retry_sync");
}
async function progress(request, db, user, key) {
  const data = await body(request);
  if (!Object.hasOwn(data, "value")) fail(400, "missing_value");
  if (
    key === "profile" &&
    data.value &&
    Object.hasOwn(data.value, "dailyMinutes")
  ) {
    const minutes = data.value.dailyMinutes;
    if (!Number.isInteger(minutes) || minutes < 5 || minutes > 180)
      fail(400, "invalid_daily_minutes");
  }
  if (key.startsWith("attempt.") || key.startsWith("review."))
    return json({ key, value: await mergeProgress(db, user, key, data.value) });
  await stmt(
    db,
    "INSERT INTO progress(owner,k,value) VALUES(?,?,?) ON CONFLICT(owner,k) DO UPDATE SET value=excluded.value",
    user,
    key,
    JSON.stringify(data.value),
  ).run();
  return json({ key, value: data.value });
}
async function digest(text) {
  const raw = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return Array.from(new Uint8Array(raw), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
async function saveDraft(request, db, user, key) {
  const { text, revision, resolveConflictId } = await body(request);
  if (
    typeof text !== "string" ||
    text.length > 50000 ||
    !Number.isSafeInteger(revision) ||
    revision < 0
  )
    fail(400, "invalid_draft");
  if (resolveConflictId !== undefined) validateKey(resolveConflictId, 64);
  async function acknowledge(saved) {
    if (resolveConflictId) {
      // Never discard a branch when another device has already superseded this choice.
      await stmt(
        db,
        "DELETE FROM draft_conflicts WHERE owner=? AND k=? AND id=? AND EXISTS (SELECT 1 FROM drafts WHERE owner=? AND k=? AND text=? AND revision=?)",
        user,
        key,
        resolveConflictId,
        user,
        key,
        text,
        saved.revision,
      ).run();
    }
    return json(saved);
  }
  const timestamp = now();
  let saved;
  if (revision === 0) {
    saved = await one(
      db,
      "INSERT INTO drafts(owner,k,text,revision,updated_at) VALUES(?,?,?,1,?) ON CONFLICT(owner,k) DO NOTHING RETURNING text,revision,updated_at AS updatedAt",
      user,
      key,
      text,
      timestamp,
    );
  } else {
    saved = await one(
      db,
      "UPDATE drafts SET text=?,revision=revision+1,updated_at=? WHERE owner=? AND k=? AND revision=? RETURNING text,revision,updated_at AS updatedAt",
      text,
      timestamp,
      user,
      key,
      revision,
    );
  }
  if (saved) return acknowledge(saved);
  const current = await one(
    db,
    "SELECT text,revision,updated_at AS updatedAt FROM drafts WHERE owner=? AND k=?",
    user,
    key,
  );
  if (!current) fail(409, "draft_missing");
  if (current.text === text) return acknowledge(current);
  const id = await digest(JSON.stringify([key, revision, text]));
  await stmt(
    db,
    "INSERT INTO draft_conflicts(owner,k,id,text,base_revision,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(owner,k,id) DO NOTHING",
    user,
    key,
    id,
    text,
    revision,
    timestamp,
  ).run();
  const conflict = await one(
    db,
    "SELECT id,text,base_revision AS baseRevision,updated_at AS updatedAt FROM draft_conflicts WHERE owner=? AND k=? AND id=?",
    user,
    key,
    id,
  );
  fail(409, "draft_conflict", { current, conflict });
}
const encode = (bytes) =>
  btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""));
const decode = (text) =>
  Uint8Array.from(atob(text), (char) => char.charCodeAt(0));
async function vault(env) {
  try {
    const bytes = decode(env.AI_VAULT_KEY || "");
    if (bytes.byteLength === 32)
      return await crypto.subtle.importKey("raw", bytes, "AES-GCM", false, [
        "encrypt",
        "decrypt",
      ]);
  } catch {
    /* Controlled error below. */
  }
  fail(503, "vault_unavailable");
}
const associated = (user, provider) =>
  new TextEncoder().encode(JSON.stringify([user, provider]));
async function seal(env, user, provider, value) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await vault(env);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: associated(user, provider) },
    key,
    new TextEncoder().encode(value),
  );
  return encode(iv) + "." + encode(new Uint8Array(ciphertext));
}
async function unseal(env, user, provider, value) {
  const key = await vault(env);
  try {
    const [vector, ciphertext] = value.split(".");
    const clear = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: decode(vector),
        additionalData: associated(user, provider),
      },
      key,
      decode(ciphertext),
    );
    return new TextDecoder().decode(clear);
  } catch {
    fail(503, "credential_unavailable");
  }
}
async function updateSettings(request, env, user) {
  const data = await body(request);
  const provider = selectProvider(data.provider);
  for (const model of [data.model, data.deepModel]) {
    if (
      model !== undefined &&
      (typeof model !== "string" ||
        !/^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,159}$/.test(model))
    )
      fail(400, "invalid_model");
  }
  const updateKey =
    data.clearKey === true || (data.apiKey !== undefined && data.apiKey !== "");
  let secret = null;
  if (updateKey && data.clearKey !== true) {
    validateProviderKey(provider, data.apiKey);
    secret = await seal(env, user, provider, data.apiKey);
  }
  await env.DB.batch([
    stmt(
      env.DB,
      "INSERT INTO ai_config(owner,provider,model,deep_model,secret) VALUES(?,?,?,?,?) ON CONFLICT(owner,provider) DO UPDATE SET model=COALESCE(?,ai_config.model),deep_model=COALESCE(?,ai_config.deep_model),secret=CASE WHEN ? THEN excluded.secret ELSE ai_config.secret END",
      user,
      provider,
      data.model || providerConfig[provider].model,
      data.deepModel || null,
      secret,
      data.model || null,
      data.deepModel || null,
      Number(updateKey),
    ),
    stmt(
      env.DB,
      "INSERT INTO ai_selection(owner,provider) VALUES(?,?) ON CONFLICT(owner) DO UPDATE SET provider=excluded.provider",
      user,
      provider,
    ),
  ]);
  return json(await settings(env.DB, user));
}
function validateProviderKey(provider, key) {
  if (
    typeof key !== "string" ||
    !/^[!-~]{5,4096}$/.test(key) ||
    /[\\'"`]/.test(key)
  )
    fail(400, "invalid_api_key");
  if (provider === "ark" && /^sk-(?:proj|svcacct)-/.test(key))
    fail(400, "provider_key_mismatch");
}

function rejectProvider(status, error, provider, model, details = {}) {
  // Upstream message strings can contain fragments of credentials. Return only our codes.
  const signature = [error?.code, error?.type]
    .filter((part) => typeof part === "string")
    .join(" ")
    .toLowerCase();
  let code;
  if (
    /unsupported_country|country.*not_supported|region.*not_supported/.test(
      signature,
    )
  )
    code = "upstream_region";
  else if (
    /insufficient_quota|billing_hard_limit|insufficient_balance|accountoverdue/.test(
      signature,
    )
  )
    code = "upstream_quota";
  else if (
    /model_not_found|modelnotopen|invalidendpointormodel|modelnotfound|endpointnotfound|model.*(access|permission|not_available)/.test(
      signature,
    ) ||
    status === 404
  )
    code = "upstream_model";
  else if (
    status === 401 ||
    /invalid_api_key|authenticationerror/.test(signature)
  )
    code = "upstream_auth";
  else if (status === 403) code = "upstream_permission";
  else if (status === 429) code = "upstream_limit";
  else if ([400, 422].includes(status)) code = "upstream_request";
  else if (status === 408 || status === 504) code = "upstream_timeout";
  else if (status >= 500) code = "upstream_service";
  else code = "provider_rejected";
  fail(502, code, { providerStatus: status, provider, model, ...details });
}
function transportFailure(error, stage, details) {
  const codes = [
    error,
    error?.cause,
    ...(Array.isArray(error?.cause?.errors) ? error.cause.errors : []),
  ]
    .filter(Boolean)
    .flatMap((item) => [item.name, item.code])
    .filter((item) => typeof item === "string");
  let reason = "network";
  if (
    codes.some((code) =>
      /^(TimeoutError|AbortError|ETIMEDOUT|UND_ERR_(CONNECT|HEADERS|BODY)_TIMEOUT)$/.test(
        code,
      ),
    )
  )
    reason = "timeout";
  else if (
    codes.some((code) => /^(ECONNRESET|EPIPE|UND_ERR_SOCKET)$/.test(code))
  )
    reason = "connection_reset";
  else if (codes.some((code) => /^(ENOTFOUND|EAI_AGAIN)$/.test(code)))
    reason = "dns";
  else if (
    codes.some((code) =>
      /^(ERR_TLS_|ERR_SSL_|CERT_|UNABLE_TO_VERIFY_|UNABLE_TO_GET_ISSUER|DEPTH_ZERO_SELF_SIGNED_CERT|SELF_SIGNED_CERT)/.test(
        code,
      ),
    )
  )
    reason = "tls";
  return new RequestError(
    502,
    reason === "timeout" ? "upstream_timeout" : "provider_unreachable",
    { ...details, stage, reason },
  );
}
async function postToProvider(url, headers, payload, timeoutMs, details) {
  let request;
  try {
    request = new Request(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    throw transportFailure(error, "request_setup", details);
  }
  let response;
  try {
    response = await fetch(request);
  } catch (error) {
    throw transportFailure(error, "response_headers", details);
  }
  if (response.status >= 300 && response.status < 400) {
    response.body?.cancel().catch(() => {});
    fail(502, "upstream_redirect", {
      ...details,
      providerStatus: response.status,
      stage: "response_headers",
      reason: "redirect",
    });
  }
  let text;
  try {
    text = await response.text();
  } catch (error) {
    throw transportFailure(error, "response_body", {
      ...details,
      providerStatus: response.status,
    });
  }
  let content = null;
  try {
    content = JSON.parse(text);
  } catch {
    // Non-JSON gateway responses are classified by the caller using the HTTP status.
  }
  return { response, content };
}
export async function checkOpenAINetwork() {
  const provider = "openai";
  for (let attempts = 1; attempts <= 2; attempts++) {
    let result;
    try {
      result = await postToProvider(
        providerConfig.openai.url,
        { Accept: "application/json", "Content-Type": "application/json" },
        {},
        6000,
        { provider, attempts },
      );
    } catch (error) {
      if (
        attempts === 1 &&
        error.details?.stage !== "request_setup" &&
        ["upstream_timeout", "provider_unreachable"].includes(error.message)
      )
        continue;
      throw error;
    }
    const { response, content } = result;
    const details = { provider, providerStatus: response.status, attempts };
    if (
      /unsupported_country|country.*not_supported|region.*not_supported/i.test(
        content?.error?.code || "",
      )
    )
      fail(502, "upstream_region", details);
    if (
      response.status === 401 &&
      content?.error &&
      typeof content.error === "object"
    )
      return json({ reachable: true, ...details });
    if (!content?.error || response.status === 403 || response.ok)
      fail(502, "probe_gateway", details);
    rejectProvider(response.status, content.error, provider, undefined, {
      attempts,
    });
  }
}
async function coach(request, env, user, testing) {
  const data = await body(request);
  let task = data.task,
    input = data.input;
  if (testing) {
    task = "grammar";
    input =
      "She go to work on Monday. 请用一般现在时纠正主谓一致，先写完整英文修正句，再用中文解释主语和动词形式。";
  }
  if (!Object.hasOwn(instructions, task)) fail(400, "unknown_task");
  if (typeof input !== "string" || !input.trim() || input.length > 30000)
    fail(400, "invalid_input");
  const context = data.context ?? "";
  if (typeof context !== "string" || context.length > 18000)
    fail(400, "invalid_context");
  const pref = data.provider || (await settings(env.DB, user)).provider;
  const provider = selectProvider(pref);
  const stored = await one(
    env.DB,
    "SELECT model,deep_model,secret FROM ai_config WHERE owner=? AND provider=?",
    user,
    provider,
  );
  if (!stored?.secret) fail(409, "provider_not_configured");
  const apiKey = await unseal(env, user, provider, stored.secret);
  validateProviderKey(provider, apiKey);
  const model =
    data.depth === "deep"
      ? stored.deep_model || providerConfig[provider].deepModel
      : stored.model;
  const messages = [
    {
      role: "system",
      content:
        "You are a personal IELTS and workplace English tutor. " +
        instructions[task],
    },
  ];
  if (context)
    messages.push({
      role: "user",
      content: "练习背景或此前对话：\n" + context,
    });
  messages.push({ role: "user", content: input });
  const { response, content: result } = await postToProvider(
    providerConfig[provider].url,
    {
      "Content-Type": "application/json",
      Authorization: "Bearer " + apiKey,
    },
    {
      model,
      input: messages,
      store: false,
      max_output_tokens: testing ? 1800 : 3500,
    },
    55000,
    { provider, model },
  );
  if (!response.ok)
    rejectProvider(response.status, result?.error, provider, model);
  if (!result || typeof result !== "object")
    fail(502, "invalid_provider_response", {
      provider,
      model,
      providerStatus: response.status,
      stage: "response_body",
    });
  const text =
    result?.output_text?.trim?.() ||
    (Array.isArray(result?.output) ? result.output : [])
      .filter((item) => item.type === "message" && item.role === "assistant")
      .flatMap((item) => (Array.isArray(item.content) ? item.content : []))
      .filter(
        (part) => part.type === "output_text" && typeof part.text === "string",
      )
      .map((part) => part.text)
      .join("\n")
      .trim();
  if (result?.status === "failed")
    rejectProvider(response.status, result.error, provider, model);
  if (!text) fail(502, "empty_provider_response", { provider, model });
  if (
    testing &&
    !(
      /\bshe\s+goes\s+to\s+work\b/i.test(text.replace(/[*_`]/g, "")) &&
      /[\u3400-\u9fff]/u.test(text)
    )
  )
    fail(502, "unexpected_test_response", { provider, model });
  return json({ text, provider, model });
}
async function recording(request, env, user, id) {
  if (!env.BUCKET) fail(503, "audio_storage_unavailable");
  const getMetadata = () =>
    one(
      env.DB,
      "SELECT id,type,size,created_at AS createdAt,object_key FROM recordings WHERE owner=? AND id=?",
      user,
      id,
    );
  let existing = await getMetadata();
  if (request.method === "GET") {
    if (!existing) fail(404, "audio_not_found");
    const object = await env.BUCKET.get(existing.object_key);
    if (!object) fail(404, "audio_not_found");
    return new Response(object.body, {
      headers: {
        "Content-Type": existing.type,
        "Content-Length": String(existing.size),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
  if (!existing) {
    const type = request.headers
      .get("content-type")
      ?.split(";")[0]
      .trim()
      .toLowerCase();
    if (
      ![
        "audio/webm",
        "audio/mp4",
        "audio/mpeg",
        "audio/ogg",
        "audio/wav",
        "audio/x-wav",
        "audio/aac",
        "audio/x-m4a",
      ].includes(type)
    )
      fail(415, "unsupported_audio_type");
    const bytes = await bytesLimited(request, 24 * 1024 * 1024);
    if (!bytes.length) fail(400, "empty_audio");
    // A per-upload object key lets concurrent retries safely discard their losing uploads.
    const objectKey =
      "recordings/" + (await digest(user)) + "/" + crypto.randomUUID();
    await env.BUCKET.put(objectKey, bytes, {
      httpMetadata: { contentType: type },
    });
    const inserted = await one(
      env.DB,
      "INSERT INTO recordings(owner,id,type,size,created_at,object_key) VALUES(?,?,?,?,?,?) ON CONFLICT(owner,id) DO NOTHING RETURNING id,type,size,created_at AS createdAt",
      user,
      id,
      type,
      bytes.length,
      now(),
      objectKey,
    );
    if (inserted) return json(inserted, 201);
    await env.BUCKET.delete(objectKey);
    existing = await getMetadata();
  }
  const { object_key, ...metadata } = existing;
  return json(metadata);
}
export async function handleApi(request, env) {
  try {
    const url = new URL(request.url);
    const path = url.pathname,
      method = request.method;
    const user = request.headers.get("oai-authenticated-user-id") || "";
    if (path === "/api/health") {
      requireMethod(method, ["GET"]);
      if (!env.DB || !env.BUCKET || !env.AI_VAULT_KEY)
        fail(503, "service_unavailable");
      await env.DB.prepare("SELECT model,deep_model FROM ai_config LIMIT 0")
        .bind()
        .all();
      await env.BUCKET.head("_health/empty");
      return json({ ready: true });
    }
    if (path === "/api/session") {
      requireMethod(method, ["GET"]);
      return json(
        user ? { authenticated: true, userId: user } : { authenticated: false },
      );
    }
    if (!user) fail(401, "sign_in_required");
    const expectedOwner = request.headers.get("X-Yasi-Account");
    if (expectedOwner && expectedOwner !== user) fail(409, "account_changed");
    if (!["GET", "HEAD"].includes(method)) verifyOrigin(request, url);
    if (!env.DB) fail(503, "database_unavailable");
    if (path === "/api/state") {
      requireMethod(method, ["GET"]);
      return json(await getState(env.DB, user));
    }
    if (path === "/api/attempts") {
      requireMethod(method, ["POST"]);
      return await attempt(request, env.DB, user);
    }
    if (path === "/api/ai/network") {
      requireMethod(method, ["POST"]);
      return await checkOpenAINetwork();
    }
    if (path === "/api/ai/settings") {
      requireMethod(method, ["GET", "PUT"]);
      return method === "GET"
        ? json(await settings(env.DB, user))
        : await updateSettings(request, env, user);
    }
    if (path === "/api/coach" || path === "/api/ai/test") {
      requireMethod(method, ["POST"]);
      return await coach(request, env, user, path === "/api/ai/test");
    }
    const match = /^\/api\/(progress|drafts|audio)\/([^/]+)$/.exec(path);
    if (!match) fail(404, "not_found");
    let key;
    try {
      key = decodeURIComponent(match[2]);
    } catch {
      fail(400, "invalid_key");
    }
    validateKey(key);
    if (match[1] === "audio") {
      requireMethod(method, ["GET", "POST"]);
      return await recording(request, env, user, key);
    }
    requireMethod(method, ["PUT"]);
    if (match[1] === "progress")
      return await progress(request, env.DB, user, key);
    return await saveDraft(request, env.DB, user, key);
  } catch (error) {
    if (error instanceof RequestError)
      return json({ error: error.message, ...error.details }, error.status);
    return json({ error: "service_unavailable" }, 503);
  }
}
