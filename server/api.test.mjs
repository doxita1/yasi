import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { handleApi } from "./api.js";

function fixture() {
  const sql = new DatabaseSync(":memory:");
  sql.exec(readFileSync(new URL("./schema.sql", import.meta.url), "utf8"));
  const objects = new Map();
  const env = {
    DB: {
      prepare(query) {
        const s = sql.prepare(query);
        return {
          bind: (...args) => ({
            run: () => s.run(...args),
            first: () => s.get(...args) ?? null,
            all: () => ({ results: s.all(...args) }),
          }),
        };
      },
      batch(statements) {
        sql.exec("BEGIN");
        try {
          const results = statements.map((s) => s.run());
          sql.exec("COMMIT");
          return results;
        } catch (error) {
          sql.exec("ROLLBACK");
          throw error;
        }
      },
    },
    BUCKET: {
      async put(key, value) {
        objects.set(key, value);
      },
      async get(key) {
        return objects.has(key) ? { body: objects.get(key) } : null;
      },
      async delete(key) {
        objects.delete(key);
      },
    },
    AI_VAULT_KEY: Buffer.alloc(32, 2).toString("base64"),
  };
  function call(
    path,
    method = "GET",
    payload,
    account = "alice",
    extraHeaders = {},
  ) {
    const headers = new Headers(extraHeaders);
    if (account) headers.set("oai-authenticated-user-id", account);
    let body;
    if (payload instanceof Blob) {
      body = payload;
      headers.set("content-type", payload.type);
    } else if (payload !== undefined) {
      body = JSON.stringify(payload);
      headers.set("content-type", "application/json");
    }
    return handleApi(
      new Request("https://learn.example/api/" + path, {
        headers,
        method,
        body,
      }),
      env,
    );
  }
  return { sql, env, objects, call };
}

test("anonymous session, protected data, same-origin writes, account separation", async () => {
  const { call } = fixture();
  assert.deepEqual(await (await call("session", "GET", undefined, "")).json(), {
    authenticated: false,
  });
  assert.equal((await call("state", "GET", undefined, "")).status, 401);
  assert.deepEqual(await (await call("session")).json(), {
    authenticated: true,
    userId: "alice",
  });
  assert.equal(
    (
      await call("progress/a", "PUT", { value: true }, "alice", {
        origin: "https://other.example",
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await call("progress/a", "PUT", { value: true }, "alice", {
        "sec-fetch-site": "cross-site",
      })
    ).status,
    403,
  );
  const attempt = { id: "week:1", skill: "vocabulary", correct: false };
  assert.deepEqual(
    await (await call("attempts", "POST", attempt)).json(),
    attempt,
  );
  assert.deepEqual(
    await (
      await call("attempts", "POST", { ...attempt, correct: true })
    ).json(),
    attempt,
  );
  const progressKey = "item:a/b";
  assert.equal(
    (
      await call("progress/" + encodeURIComponent(progressKey), "PUT", {
        value: { step: 3 },
      })
    ).status,
    200,
  );
  let saved = await (await call("state")).json();
  assert.deepEqual(saved.attempts, [attempt]);
  assert.deepEqual(saved.progress[progressKey], { step: 3 });
  saved = await (await call("state", "GET", undefined, "bob")).json();
  assert.deepEqual(saved.attempts, []);
  assert.deepEqual(saved.progress, {});
});

test("draft updates preserve both concurrent texts and deduplicate a retry", async () => {
  const { call } = fixture();
  const put = (text, revision) =>
    call("drafts/essay", "PUT", { text, revision });
  const first = await (await put("Draft from PC", 0)).json();
  const retry = await (await put("Draft from PC", 0)).json();
  assert.equal(first.revision, 1);
  assert.deepEqual(retry, first);
  assert.equal((await (await put("Final PC version", 1)).json()).revision, 2);
  const stale = await put("Phone version", 1);
  assert.equal(stale.status, 409);
  assert.equal((await stale.json()).current.text, "Final PC version");
  await put("Phone version", 1);
  const state = await (await call("state")).json();
  assert.equal(state.drafts.essay.text, "Final PC version");
  assert.equal(state.drafts.essay.conflicts.length, 1);
  assert.equal(state.drafts.essay.conflicts[0].text, "Phone version");
  await call("drafts/essay", "PUT", {
    text: "Phone version",
    revision: 2,
    resolveConflictId: state.drafts.essay.conflicts[0].id,
  });
  const resolved = (await (await call("state")).json()).drafts.essay;
  assert.equal(resolved.text, "Phone version");
  assert.equal(resolved.conflicts.length, 0);
});

test("independent device checkpoints merge answers and preserve completed tasks", async () => {
  const { call } = fixture();
  const put = (value) => call("progress/attempt.lesson", "PUT", { value });
  await put({
    updatedAt: "2026-01-03",
    answers: {
      0: { submitted: true, correct: true, submittedAt: "2026-01-03" },
    },
    elapsedSeconds: 45,
    completed: true,
    completedAt: "2026-01-03",
    total: 2,
    graded: 2,
  });
  const { value } = await (
    await put({
      updatedAt: "2026-01-04",
      answers: {
        0: { selected: 1 },
        1: { submitted: true, correct: true, submittedAt: "2026-01-02" },
      },
      elapsedSeconds: 20,
    })
  ).json();
  assert.equal(value.completed, true);
  assert.equal(value.correct, 2);
  assert.equal(value.elapsedSeconds, 45);
  assert.equal(value.answers[0].submitted, true);
  assert.equal(value.answers[1].submitted, true);
});

test("audio sync stores immutable user-scoped objects and only serves supported types", async () => {
  const { call, objects } = fixture();
  const spoken = new Blob(["voice memo"], { type: "audio/webm;codecs=opus" });
  assert.equal((await call("audio/lesson", "POST", spoken)).status, 201);
  assert.equal((await call("audio/lesson", "POST", spoken)).status, 200);
  assert.equal(objects.size, 1);
  const reply = await call("audio/lesson");
  assert.equal(reply.headers.get("content-type"), "audio/webm");
  assert.equal(await reply.text(), "voice memo");
  assert.equal(
    (await call("audio/lesson", "GET", undefined, "bob")).status,
    404,
  );
  assert.equal(
    (await call("audio/bad", "POST", new Blob(["bad"], { type: "text/html" })))
      .status,
    415,
  );
  const state = await (await call("state")).json();
  assert.equal(state.audio.length, 1);
  assert.equal(state.audio[0].object_key, undefined);
});

test("both AI providers use encrypted account-scoped keys, preserve settings, and return actual exercise feedback", async (t) => {
  const { call, sql } = fixture();
  const seen = [];
  t.mock.method(globalThis, "fetch", async (url, req) => {
    const data = JSON.parse(req.body);
    seen.push({ url, data, authorization: req.headers.Authorization });
    assert.equal(data.store, false);
    const prompt = data.input.at(-1).content;
    const text = prompt.includes("She go")
      ? "She goes to work on Monday. 第三人称单数加 s。"
      : "Could we move the release to Monday?";
    return Response.json({
      output: [
        {
          type: "message",
          role: "assistant",
          content: [{ type: "output_text", text }],
        },
      ],
    });
  });
  for (const [provider, host] of [
    ["ark", "ark.cn-beijing.volces.com"],
    ["openai", "api.openai.com"],
  ]) {
    const token = "user-test-" + provider;
    const prefs = await (
      await call("ai/settings", "PUT", { provider, apiKey: token })
    ).json();
    assert.equal(prefs.providers[provider].configured, true);
    assert(!JSON.stringify(prefs).includes(token));
    const ciphertext = sql
      .prepare("SELECT secret FROM ai_config WHERE provider=?")
      .get(provider).secret;
    assert(!ciphertext.includes(token));
    const check = await (await call("ai/test", "POST", { provider })).json();
    assert.match(check.text, /She goes/);
    assert.equal(new URL(seen.at(-1).url).host, host);
    assert.equal(seen.at(-1).authorization, "Bearer " + token);
    const feedback = await (
      await call("coach", "POST", {
        provider,
        task: "conversation",
        input: "Our shipment will be late.",
        context: "We work together.",
      })
    ).json();
    assert.match(feedback.text, /Monday/);
    assert.match(seen.at(-1).data.input.at(-1).content, /shipment/);
    const separate = await (
      await call("ai/settings", "GET", undefined, "bob")
    ).json();
    assert.equal(separate.providers[provider].configured, false);
    const switched = await (
      await call("ai/settings", "PUT", {
        provider,
        model: "another-model",
        deepModel: "advanced-review",
      })
    ).json();
    assert.equal(switched.providers[provider].configured, true);
    assert.equal(switched.providers[provider].deepModel, "advanced-review");
    const deep = await (
      await call("coach", "POST", {
        provider,
        task: "writing",
        input: "Our deadline is Monday.",
        depth: "deep",
      })
    ).json();
    assert.equal(deep.model, "advanced-review");
    assert.equal(seen.at(-1).data.model, "advanced-review");
    await call("ai/settings", "PUT", { provider, clearKey: true });
    assert.equal((await call("ai/test", "POST", { provider })).status, 409);
  }
  assert.equal(seen.length, 6);
});

test("invalid input, missing vault and upstream errors are actionable and contain no credentials", async (t) => {
  const { call, env } = fixture();
  assert.equal(
    (await call("coach", "POST", { task: "whatever", input: "a" })).status,
    400,
  );
  assert.equal(
    (await call("progress/x", "PUT", { value: "x".repeat(150000) })).status,
    413,
  );
  const key = env.AI_VAULT_KEY;
  env.AI_VAULT_KEY = "";
  assert.equal(
    (await call("ai/settings", "PUT", { provider: "ark", apiKey: "test-key" }))
      .status,
    503,
  );
  env.AI_VAULT_KEY = key;
  await call("ai/settings", "PUT", { provider: "ark", apiKey: "test-key" });
  t.mock.method(
    globalThis,
    "fetch",
    async () => new Response("test-key", { status: 429 }),
  );
  const response = await call("ai/test", "POST", { provider: "ark" });
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), {
    error: "upstream_limit",
    providerStatus: 429,
    provider: "ark",
    model: "doubao-seed-2-1-lite-260915",
  });
});

test("model diagnostics distinguish billing, permissions, errors, timeouts and a usable correction", async (t) => {
  const { call } = fixture(),
    provider = "openai",
    model = "test-daily",
    deepModel = "test-deep";
  await call("ai/settings", "PUT", {
    provider,
    model,
    deepModel,
    apiKey: "fictional-key-for-test",
  });
  let reply;
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, req) => {
    calls.push(JSON.parse(req.body).model);
    if (reply instanceof Error) throw reply;
    return reply;
  });
  for (const [status, upstream, expected] of [
    [401, "invalid_api_key", "upstream_auth"],
    [403, "permission_denied", "upstream_permission"],
    [403, "unsupported_country_region_territory", "upstream_region"],
    [404, "model_not_found", "upstream_model"],
    [429, "insufficient_quota", "upstream_quota"],
    [429, "rate_limit_exceeded", "upstream_limit"],
    [500, "internal_error", "upstream_service"],
  ]) {
    reply = Response.json(
      {
        error: {
          code: upstream,
          message: "PRIVATE detail fictional-key-for-test",
        },
      },
      { status },
    );
    const response = await call("ai/test", "POST", { provider, depth: "deep" });
    assert.deepEqual(await response.json(), {
      error: expected,
      providerStatus: status,
      provider,
      model: deepModel,
    });
    assert.equal(calls.at(-1), deepModel);
  }
  for (const [error, expected] of [
    [new TypeError("connection reset"), "provider_unreachable"],
    [new DOMException("timeout", "TimeoutError"), "upstream_timeout"],
  ]) {
    reply = error;
    assert.equal(
      (await (await call("ai/test", "POST", { provider })).json()).error,
      expected,
    );
  }
  reply = Response.json({ output_text: "goes" });
  assert.equal(
    (await (await call("ai/test", "POST", { provider })).json()).error,
    "unexpected_test_response",
  );
  reply = Response.json({
    output_text: "She goes to work on Mondays. 主语为第三人称单数。",
  });
  assert.match(
    (await (await call("ai/test", "POST", { provider, depth: "deep" })).json())
      .text,
    /She goes/,
  );
});

test("a misplaced provider credential is rejected before storage or transmission, including legacy encrypted settings", async (t) => {
  const { call, sql, env } = fixture();
  const auth = "sk-proj-fictional-fixture-only";
  const fetcher = t.mock.method(globalThis, "fetch", () => {
    throw Error("unexpected transmission");
  });
  for (const [value, code] of [
    [auth, "provider_key_mismatch"],
    ["example\\", "invalid_api_key"],
    ["example ", "invalid_api_key"],
  ]) {
    const response = await call("ai/settings", "PUT", {
      provider: "ark",
      apiKey: value,
    });
    assert.equal((await response.json()).error, code);
  }
  assert.equal(sql.prepare("SELECT count(*) AS n FROM ai_config").get().n, 0);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await crypto.subtle.importKey(
    "raw",
    Buffer.from(env.AI_VAULT_KEY, "base64"),
    "AES-GCM",
    false,
    ["encrypt"],
  );
  const associated = new TextEncoder().encode(JSON.stringify(["alice", "ark"]));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: associated },
    key,
    new TextEncoder().encode(auth),
  );
  const sealed =
    Buffer.from(iv).toString("base64") +
    "." +
    Buffer.from(ciphertext).toString("base64");
  sql
    .prepare(
      "INSERT INTO ai_config(owner,provider,model,secret) VALUES (?,?,?,?)",
    )
    .run("alice", "ark", "demo-model", sealed);
  assert.equal(
    (await (await call("ai/test", "POST", { provider: "ark" })).json()).error,
    "provider_key_mismatch",
  );
  assert.equal(fetcher.mock.callCount(), 0);
});
test("network diagnostics perform only anonymous fixed model-list GETs and retry a transient connection failure once", async (t) => {
  const { call } = fixture(),
    answers = [];
  const probe = () => call("ai/network", "POST", undefined);
  const traffic = t.mock.method(globalThis, "fetch", async (url, req) => {
    assert.equal(url, "https://api.openai.com/v1/models");
    assert.equal(req.method, "GET");
    assert.deepEqual(
      [...new Headers(req.headers)],
      [["accept", "application/json"]],
    );
    assert.equal(req.body, undefined);
    assert.equal(req.redirect, "error");
    assert.ok(req.signal instanceof AbortSignal);
    const next = answers.shift();
    if (next instanceof Error) throw next;
    return next;
  });
  assert.equal((await call("ai/network", "POST", undefined, "")).status, 401);
  assert.equal(traffic.mock.callCount(), 0);
  answers.push(
    new TypeError("private transport details"),
    Response.json({ error: { code: "missing_api_key" } }, { status: 401 }),
  );
  assert.deepEqual(await (await probe()).json(), {
    provider: "openai",
    providerStatus: 401,
    reachable: true,
  });
  answers.push(
    Response.json(
      {
        error: {
          code: "unsupported_country_region_territory",
          message: "private upstream details",
        },
      },
      { status: 403 },
    ),
  );
  assert.deepEqual(await (await probe()).json(), {
    provider: "openai",
    providerStatus: 403,
    error: "upstream_region",
  });
  answers.push(
    new Response("<html>private gateway details</html>", { status: 403 }),
  );
  assert.deepEqual(await (await probe()).json(), {
    provider: "openai",
    providerStatus: 403,
    error: "probe_gateway",
  });
  answers.push(
    new DOMException("private timeout", "TimeoutError"),
    new DOMException("private timeout", "TimeoutError"),
  );
  assert.deepEqual(await (await probe()).json(), {
    provider: "openai",
    error: "upstream_timeout",
  });
  assert.equal(traffic.mock.callCount(), 6);
});
