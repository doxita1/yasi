import test from "node:test";
import assert from "node:assert/strict";
import { handleApi } from "../server/api.js";

test("New and legacy profiles restore a valid daily budget without losing existing goals", async () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  let snapshot;
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { getItem: () => snapshot && JSON.stringify(snapshot) },
  });
  try {
    const samples = [
      [undefined, 30],
      [{ track: "academic" }, 30],
      [{ dailyMinutes: 60 }, 60],
      [{ dailyMinutes: 27 }, 27],
      [{ dailyMinutes: "45" }, 45],
      [{ dailyMinutes: -2 }, 30],
    ];
    for (const [i, [profile, expected]] of samples.entries()) {
      snapshot = profile && { profile: { targetBand: 7.5, ...profile } };
      const { getState } = await import("../public/sync.js?studyTimeCase=" + i);
      assert.equal(getState().profile.dailyMinutes, expected);
      assert.equal(getState().profile.targetBand, profile ? 7.5 : 7);
    }
  } finally {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous);
    else delete globalThis.localStorage;
  }
});

test("The profile endpoint accepts integer budgets from five through 180 and preserves older clients", async () => {
  const writes = [];
  const env = {
    DB: {
      prepare: () => ({
        bind: (...args) => ({ run: () => writes.push(args) }),
      }),
    },
  };
  async function put(value) {
    return handleApi(
      new Request("https://study.test/api/progress/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://study.test",
          "oai-authenticated-user-id": "budget-test",
        },
        body: JSON.stringify({ value }),
      }),
      env,
    );
  }
  for (const dailyMinutes of [5, 15, 20, 27, 30, 45, 60, 180]) {
    const response = await put({ dailyMinutes });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).value.dailyMinutes, dailyMinutes);
  }
  assert.equal((await put({ track: "general" })).status, 200);
  const validWrites = writes.length;
  for (const dailyMinutes of [4, 181, null, 29.5, "30"]) {
    const response = await put({ dailyMinutes });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error, "invalid_daily_minutes");
  }
  assert.equal(writes.length, validWrites);
});
