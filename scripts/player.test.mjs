import assert from "node:assert/strict";
import test from "node:test";
import { getDay } from "../public/curriculum.js";
import { mountPlayer, listDeferredWords } from "../public/player.js";
import { initSync, getState, saveReview } from "../public/sync.js";

// Drive the same event handlers as the player, without requiring a microphone or a browser account.
class TestSurface {
  listeners = new Map();
  innerHTML = "";
  addEventListener(name, fn) {
    this.listeners.set(name, fn);
  }
  removeEventListener(name) {
    this.listeners.delete(name);
  }
  querySelector() {
    return null;
  }
  querySelectorAll() {
    return [];
  }
  contains() {
    return true;
  }
  click(data) {
    const target = {
      dataset: data,
      closest() {
        return this;
      },
      hasAttribute: (key) => key === "data-opt" && "opt" in data,
    };
    this.listeners.get("click")({ target });
  }
  write(value) {
    this.listeners.get("input")({
      target: { value, matches: (sel) => sel === "[data-input]" },
    });
  }
}
test("completed practice can be taken again, resumed and saved without adding another completed task; due words replace new content and stay fixed after refresh", async () => {
  const storage = new Map();
  globalThis.window = new EventTarget();
  globalThis.document = new EventTarget();
  globalThis.localStorage = {
    getItem: (k) => storage.get(k),
    setItem: (k, v) => storage.set(k, v),
  };
  globalThis.fetch = async () => Response.json({ authenticated: false });
  await initSync();
  const surface = new TestSurface(),
    params = { day: 1, blockId: "vocab", track: "undecided" };
  const items = getDay(1, "undecided").blocks.find(
    (b) => b.id === "vocab",
  ).items;
  const step = (i, wrong = false) => {
    const item = items[i];
    if (item.kind === "choice")
      surface.click({
        opt: String(
          wrong ? (item.answer + 1) % item.options.length : item.answer,
        ),
      });
    else surface.write("I can use this expression at a project meeting.");
    surface.click({ act: "check" });
  };
  let dispose = mountPlayer(surface, params);
  try {
    const firstChoice = items.findIndex((q) => q.kind === "choice");
    assert.ok(firstChoice >= 0);
    items.forEach((_, i) => {
      step(i, i === firstChoice);
      if (i === firstChoice) {
        surface.click({ act: "retry-one" });
        step(i);
      }
      surface.click({ act: "next" });
    });
    const key = "undecided:1:vocab";
    const original = getState().attempts[key],
      originalAnswers = structuredClone(original.answers);
    assert.ok(original.completed);
    assert.equal(originalAnswers[firstChoice].history.length, 2);
    assert.equal(originalAnswers[firstChoice].firstCorrect, false);
    assert.match(surface.innerHTML, /再练一轮/);
    surface.click({ act: "retry-block" });
    step(0);
    surface.click({ act: "next" });
    dispose();
    dispose = mountPlayer(surface, params);
    assert.equal(getState().attempts[key].itemIndex, 1);
    assert.equal(
      getState().attempts[key].activeRepeat.answers[0].submitted,
      true,
    );
    for (let i = 1; i < items.length; i++) {
      step(i);
      surface.click({ act: "next" });
    }
    const finished = getState().attempts[key];
    assert.deepEqual(finished.answers, originalAnswers);
    assert.equal(finished.retries.length, 1);
    assert.equal(Object.keys(finished.retries[0].answers).length, items.length);
    assert.equal(
      Object.values(getState().attempts).filter((a) => a.completed).length,
      1,
    );
    assert.ok(getState().queue["attempt/repeat:" + finished.retries[0].id]);
    dispose();
    for (let n = 0; n < 24; n++)
      saveReview("due-" + n, {
        word: "phrase " + n,
        meaning: "释义 " + n,
        blockId: "vocab",
        due: "2000-01-01",
      });
    const nextParams = { ...params, day: 2 };
    dispose = mountPlayer(surface, nextParams);
    const frozen = structuredClone(
      getState().attempts["undecided:2:vocab"].vocabPlan,
    );
    assert.equal(frozen.newLimit, 1);
    assert.equal(Object.keys(frozen.overrides).length, 5);
    assert.equal(listDeferredWords().length, 5);
    for (let n = 0; n < 24; n++) saveReview("due-" + n, { due: "2100-01-01" });
    dispose();
    dispose = mountPlayer(surface, nextParams);
    assert.deepEqual(
      getState().attempts["undecided:2:vocab"].vocabPlan,
      frozen,
    );
  } finally {
    dispose();
  }
});
