import { accountFetch as fetch } from "./account-request.js";
const PREFIX = "yasi-study-v1:";
const listeners = new Set();
let scope = "guest";
let authenticated = false;
let initPromise,
  database,
  syncPromise,
  flushTimer,
  retryTimer,
  store,
  retryDelay = 5000;
const memoryAudio = new Map();
function localDate() {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
function fresh() {
  return {
    profile: {
      track: "undecided",
      targetBand: 7,
      minBand: 6.5,
      dailyMinutes: 30,
      startDate: localDate(),
      provider: "ark",
    },
    attempts: {},
    review: {},
    drafts: {},
    conflicts: [],
    queue: {},
    syncStatus: "local",
    savedAt: "",
  };
}
function localRead(key) {
  try {
    return localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}
function localWrite(key, value) {
  try {
    localStorage.setItem(PREFIX + key, value);
    return true;
  } catch {
    return false;
  }
}
function restoreProfile(defaults, saved) {
  const profile = { ...defaults, ...saved };
  const minutes = Number(profile.dailyMinutes);
  profile.dailyMinutes =
    Number.isInteger(minutes) && minutes >= 5 && minutes <= 180 ? minutes : 30;
  return profile;
}
function restoreState(snapshot) {
  const defaults = fresh();
  return {
    ...defaults,
    ...snapshot,
    profile: restoreProfile(defaults.profile, snapshot?.profile),
  };
}
function readScope(id) {
  try {
    return restoreState(JSON.parse(localRead("state:" + id) || "{}"));
  } catch {
    return fresh();
  }
}
function db() {
  if (!database)
    database = new Promise((resolve) => {
      try {
        const req = indexedDB.open("yasi-study-v1", 1);
        req.onupgradeneeded = () => {
          req.result.createObjectStore("blobs");
          req.result.createObjectStore("accounts");
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = req.onblocked = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  return database;
}
async function idb(bucket, key, value) {
  const handle = await db();
  if (!handle) return undefined;
  return new Promise((resolve) => {
    try {
      const write = value !== undefined;
      const tx = handle.transaction(bucket, write ? "readwrite" : "readonly");
      const req = write
        ? tx.objectStore(bucket).put(value, key)
        : tx.objectStore(bucket).get(key);
      tx.oncomplete = () => resolve(write ? true : req.result);
      tx.onabort = tx.onerror = () => resolve(undefined);
    } catch {
      resolve(undefined);
    }
  });
}
function emit() {
  for (const fn of listeners) {
    try {
      fn(getState());
    } catch (err) {
      console.error(err);
    }
  }
}
function persist() {
  store.savedAt = new Date().toISOString();
  const snapshot = JSON.stringify(store);
  const id = scope;
  const written = localWrite("state:" + id, snapshot);
  void idb("accounts", id, snapshot).then((ok) => {
    if (!ok && !written && scope === id) {
      store.syncStatus = "storage-error";
      emit();
    }
  });
  emit();
}
async function req(path, options = {}) {
  const response = await fetch("/api/" + path, {
    credentials: "same-origin",
    cache: "no-store",
    ...options,
  });
  if (!response.ok) {
    let body;
    try {
      body = await response.json();
    } catch {}
    throw Object.assign(
      new Error(body?.message || body?.error || "HTTP " + response.status),
      { status: response.status, body },
    );
  }
  if (response.status === 204) return {};
  return response.json();
}
const sendJSON = (method, data) => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});
function entry(type, key, value) {
  store.queue[type + "/" + key] = {
    type,
    key,
    value,
    nonce: crypto.randomUUID(),
    at: new Date().toISOString(),
  };
}
function schedule() {
  clearTimeout(flushTimer);
  if (authenticated) flushTimer = setTimeout(() => void flushSync(), 700);
}
function changed() {
  store.syncStatus = authenticated ? "pending" : "local";
  persist();
  schedule();
}
function mergeRemote(remote) {
  const queued = (type, key) => Object.hasOwn(store.queue, type + "/" + key);
  for (const [key, val] of Object.entries(remote.progress || {})) {
    if (queued("progress", key)) continue;
    if (key === "profile") store.profile = restoreProfile(store.profile, val);
    else if (key.startsWith("attempt.")) store.attempts[key.slice(8)] = val;
    else if (key.startsWith("review.")) store.review[key.slice(7)] = val;
  }
  for (const [key, draft] of Object.entries(remote.drafts || {})) {
    if (!queued("draft", key)) store.drafts[key] = { ...draft };
    const unresolved = new Set((draft.conflicts || []).map((c) => c.id));
    store.conflicts = store.conflicts.filter(
      (c) => c.key !== key || unresolved.has(c.id) || queued("draft", key),
    );
    for (const branch of draft.conflicts || []) {
      if (
        !store.conflicts.some((item) => item.id === branch.id) &&
        !store.acknowledged?.includes(branch.id)
      )
        store.conflicts.push({
          id: branch.id,
          key,
          local: branch.text,
          remote: draft.text,
          revision: draft.revision,
        });
    }
  }
}
export function initSync() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    let user;
    try {
      user = await req("session", { signal: AbortSignal.timeout(6000) });
    } catch {}
    authenticated = !!(user?.authenticated && user.userId);
    // A fresh page must confirm the current visitor before opening private local data.
    scope = authenticated ? "account:" + user.userId : "guest";
    store = readScope(scope);
    const archived = await idb("accounts", scope);
    if (archived) {
      try {
        const recovered = JSON.parse(archived);
        if ((recovered.savedAt || "") > (store.savedAt || ""))
          store = restoreState(recovered);
      } catch {}
    }
    store.syncStatus = authenticated
      ? "pending"
      : scope === "guest"
        ? "local"
        : "offline";
    if (authenticated) {
      try {
        mergeRemote(await req("state", { signal: AbortSignal.timeout(7000) }));
        store.syncStatus = "synced";
      } catch {
        store.syncStatus = "offline";
      }
    }
    persist();
    schedule();
    window.addEventListener("online", () => void reconnect());
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && scope !== "guest")
        void reconnect();
    });
    return getState();
  })();
  return initPromise;
}
export async function refreshSync() {
  if (!authenticated) return;
  return reconnect();
}
async function reconnect() {
  try {
    const session = await req("session", { signal: AbortSignal.timeout(3500) });
    const next =
      session?.authenticated && session.userId
        ? "account:" + session.userId
        : "guest";
    if (next !== scope) {
      location.reload();
      return;
    }
    authenticated = !!session.authenticated;
    if (authenticated) {
      if (Object.keys(store.queue).length) await flushSync();
      mergeRemote(await req("state", { signal: AbortSignal.timeout(3500) }));
      store.syncStatus = Object.keys(store.queue).length ? "pending" : "synced";
      persist();
    }
  } catch {
    if (store) {
      store.syncStatus = scope === "guest" ? "local" : "offline";
      emit();
    }
  }
}
export function getState() {
  return store || (store = readScope("guest"));
}
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export function updateProfile(patch) {
  const state = getState();
  state.profile = { ...state.profile, ...patch };
  entry("progress", "profile", state.profile);
  changed();
  return state.profile;
}
export function saveAttempt(key, patch) {
  const prev = getState().attempts[key] || {};
  const today = localDate(),
    delta = Math.max(
      0,
      (patch.elapsedSeconds || 0) - (prev.elapsedSeconds || 0),
    );
  const activity = { ...prev.activity };
  activity[today] = (activity[today] || 0) + delta;
  const val = {
    ...prev,
    ...patch,
    activity,
    updatedAt: new Date().toISOString(),
    studyDate: today,
  };
  store.attempts[key] = val;
  entry("progress", "attempt." + key, val);
  if (val.completed && !prev.completed)
    entry("attempt", key, { ...val, id: key });
  changed();
  return val;
}
export function saveRepeat(key, round) {
  const parent = getState().attempts[key];
  if (!parent || !round?.id) return;
  entry("attempt", "repeat:" + round.id, {
    ...round,
    id: "repeat:" + round.id,
    parent: key,
    day: parent.day,
    track: parent.track,
    blockId: parent.blockId,
    type: "repeat",
  });
  changed();
}
export function saveReview(key, patch) {
  const val = {
    ...getState().review[key],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  store.review[key] = val;
  entry("progress", "review." + key, val);
  changed();
  return val;
}
export function listDueReviews(now = Date.now()) {
  const stamp = +new Date(now);
  return Object.entries(getState().review)
    .filter(([, v]) => !v.due || +new Date(v.due) <= stamp)
    .map(([key, v]) => ({ ...v, key }))
    .sort((a, b) => String(a.due || "").localeCompare(String(b.due || "")));
}
export function saveDraft(key, text, resolveConflictId) {
  const prev = getState().drafts[key] || { revision: 0 };
  const draft = { ...prev, text, updatedAt: new Date().toISOString() };
  store.drafts[key] = draft;
  entry("draft", key, {
    text,
    revision: prev.revision || 0,
    resolveConflictId:
      resolveConflictId || store.queue["draft/" + key]?.value.resolveConflictId,
  });
  changed();
}
export function getDraft(key) {
  return getState().drafts[key]?.text;
}
export function resolveConflict(id, choice) {
  const conflict = getState().conflicts.find((x) => x.id === id);
  if (!conflict) return;
  store.conflicts = store.conflicts.filter((x) => x.id !== id);
  store.acknowledged = [...(store.acknowledged || []), id];
  store.drafts[conflict.key] = {
    text: conflict.remote,
    revision: conflict.revision,
  };
  saveDraft(
    conflict.key,
    choice === "local"
      ? conflict.local
      : choice === "remote"
        ? conflict.remote
        : choice,
    conflict.id,
  );
}
export async function putAudio(key, blob) {
  const id = scope + "|" + key;
  const ok = await idb("blobs", id, blob);
  if (!ok) {
    memoryAudio.set(id, blob);
    if (!authenticated)
      throw new Error("录音暂存在当前页面，浏览器未允许本机持久保存。");
  }
  entry("audio", key, { type: blob.type });
  changed();
  return key;
}
export async function getAudio(key) {
  if (!key) return null;
  const id = scope + "|" + key;
  const cached = (await idb("blobs", id)) || memoryAudio.get(id);
  if (cached) return cached;
  if (!authenticated) return null;
  try {
    const r = await fetch("/api/audio/" + encodeURIComponent(key), {
      credentials: "same-origin",
    });
    if (!r.ok) return null;
    const blob = await r.blob();
    await idb("blobs", id, blob);
    return blob;
  } catch {
    return null;
  }
}
export function flushSync() {
  if (!authenticated) return Promise.resolve(false);
  if (syncPromise) return syncPromise;
  syncPromise = (async () => {
    try {
      // Check the current cookie before sending records queued for a browser account.
      const session = await req("session");
      if (!session.authenticated || "account:" + session.userId !== scope) {
        authenticated = false;
        store.syncStatus = "offline";
        emit();
        return false;
      }
      for (const [queueId, op] of Object.entries(store.queue)) {
        if (store.queue[queueId]?.nonce !== op.nonce) continue;
        const key = encodeURIComponent(op.key);
        try {
          if (op.type === "progress") {
            const saved = await req(
              "progress/" + key,
              sendJSON("PUT", { value: op.value }),
            );
            if (
              op.key.startsWith("attempt.") &&
              store.queue[queueId]?.nonce === op.nonce &&
              saved.value
            )
              store.attempts[op.key.slice(8)] = saved.value;
          }
          if (op.type === "attempt")
            await req("attempts", sendJSON("POST", op.value));
          if (op.type === "draft") {
            const result = await req(
              "drafts/" + key,
              sendJSON("PUT", op.value),
            );
            if (store.drafts[op.key])
              store.drafts[op.key].revision = result.revision;
            if (store.queue[queueId]?.nonce !== op.nonce)
              store.queue[queueId].value.revision = result.revision;
          }
          if (op.type === "audio") {
            const id = scope + "|" + op.key;
            const blob = (await idb("blobs", id)) || memoryAudio.get(id);
            if (!blob) throw new Error("录音等待在原设备重试");
            const response = await fetch("/api/audio/" + key, {
              method: "POST",
              body: blob,
              credentials: "same-origin",
              headers: { "Content-Type": blob.type || "audio/webm" },
            });
            if (!response.ok) throw new Error("录音正在等待同步");
          }
        } catch (err) {
          if (op.type !== "draft" || err.status !== 409) throw err;
          const body = err.body || {},
            cur = body.current || {};
          if (cur.text === op.value.text) {
            store.drafts[op.key].revision = cur.revision;
          } else {
            const conflict = {
              id: body.conflict?.id || crypto.randomUUID(),
              key: op.key,
              local: store.drafts[op.key]?.text ?? op.value.text,
              remote: cur.text || "",
              revision: cur.revision || 0,
            };
            store.conflicts = store.conflicts.filter((x) => x.key !== op.key);
            store.conflicts.push(conflict);
            delete store.queue[queueId];
          }
        }
        if (store.queue[queueId]?.nonce === op.nonce)
          delete store.queue[queueId];
        persist();
      }
      store.syncStatus = Object.keys(store.queue).length ? "pending" : "synced";
      clearTimeout(retryTimer);
      retryDelay = 5000;
      persist();
      if (store.syncStatus === "pending") schedule();
      return true;
    } catch {
      store.syncStatus = "offline";
      persist();
      clearTimeout(retryTimer);
      if (authenticated && Object.keys(store.queue).length) {
        retryTimer = setTimeout(() => void flushSync(), retryDelay);
        retryDelay = Math.min(60000, 2 * retryDelay);
      }
      return false;
    }
  })().finally(() => {
    syncPromise = null;
  });
  return syncPromise;
}
