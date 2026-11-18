import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  bank,
  topics,
  findTopic,
  byId,
  optionsFor,
  maskedSentence,
  wordStatus,
  checkAnswer,
  sequence,
  selectWords,
  seenLegacy,
} from "../public/core-word-bank.js";

test("96 scored headwords and both existing pronunciation libraries resolve to distinct playable word entries", () => {
  const base = fileURLToPath(new URL("../public/", import.meta.url)),
    manifest = JSON.parse(readFileSync(path.join(base, "audio/manifest.json")));
  const head = topics.filter((t) => t.kind === "词头"),
    phrases = topics.filter((t) => t.kind === "场景表达"),
    collocations = topics.filter((t) => t.kind === "学术搭配");
  assert.equal(head.length, 8);
  assert.equal(head.flatMap((t) => t.words).length, 96);
  assert.equal(phrases.flatMap((t) => t.words).length, 936);
  assert.equal(collocations.flatMap((t) => t.words).length, 60);
  assert.equal(
    new Set(bank.map((w) => w.term.toLowerCase())).size,
    bank.length,
  );
  assert.equal(bank.length, 1089);
  assert.equal(byId.size, bank.length);
  for (const w of bank) {
    assert.ok(w.reviewKeys.length && w.example && w.gloss, w.term);
    const file = w.url
      ? path.join(base, w.url)
      : path.join(base, "audio", manifest[w.term]);
    assert.ok(statSync(file).size > 1100, w.term);
    const choices = optionsFor(w, 39);
    assert.equal(choices.length, 4, w.term);
    assert.ok(choices.includes(w.gloss));
    assert.equal(new Set(choices).size, 4);
  }
  for (const id of head.flatMap((t) => t.words)) {
    const w = byId.get(id);
    assert.ok(w.collocation && w.pos);
    assert.ok(maskedSentence(w).includes("____"));
    const bytes = readFileSync(path.join(base, w.url));
    assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
    assert.equal(bytes.toString("ascii", 8, 12), "WAVE");
  }
});
test("active recall, close spelling distinctions, due times and missing dimensions drive selection", () => {
  const sample = byId.get(findTopic("evidence").words[0]),
    ids = selectWords("evidence", {});
  assert.equal(ids.length, 3);
  assert.equal(sequence("evidence", ids, {}).length, 9);
  assert.equal(sequence("errors", ids, {}).length, 0);
  assert.equal(checkAnswer(sample, "recall", " EVIDENCE  ", 0).right, true);
  assert.equal(checkAnswer(sample, "recall", "evident", 0).right, false);
  const enrol = bank.find((w) => w.term === "enrolment");
  assert.equal(checkAnswer(enrol, "audio", "enrollment", 1).right, true);
  const row = {
    word: sample.term,
    meaning: sample.gloss,
    blockId: "vocab",
    due: "2020-01-01T00:00:00Z",
    corePractice: {
      at: "2020-01-01T00:00:00Z",
      total: 1,
      misses: 1,
      open: ["audio"],
    },
  };
  const reviews = { [sample.reviewKey]: row };
  assert.deepEqual(selectWords("errors", reviews), [sample.id]);
  assert.deepEqual(selectWords("due", reviews), [sample.id]);
  assert.deepEqual(sequence("errors", [sample.id], reviews), [
    { id: sample.id, mode: "audio" },
  ]);
  row.due = "2099-02-01T00:00:00Z";
  assert.deepEqual(selectWords("due", reviews), []);
  assert.ok(!selectWords("evidence", reviews).includes(sample.id));
});
test("a legacy dictation miss can be corrected without losing its history or reopening it on the next render", () => {
  const w = bank.find((w) => w.reviewKey.startsWith("vocab-")),
    key = w.reviewKey;
  const row = {
    lastDictation: "漏写复数",
    lastSpelling: "old response",
    blockId: "vocab",
    updatedAt: "2026-01-02T00:00:00Z",
  };
  const reviews = { [key]: row };
  assert.deepEqual(wordStatus(w, reviews).open, ["audio"]);
  row.corePractice = {
    at: "2026-01-03T00:00:00Z",
    total: 1,
    misses: 1,
    open: [],
    event: "first",
  };
  row.corePractice.seenLegacy = seenLegacy(w, reviews, key, row);
  row.updatedAt = "2026-01-03T00:00:00.001Z";
  assert.deepEqual(wordStatus(w, reviews).open, []);
  assert.equal(wordStatus(w, reviews).ever, true);
  row.lastSpelling = "another spelling";
  row.updatedAt = "2026-01-05T00:00:00Z";
  assert.deepEqual(wordStatus(w, reviews).open, ["audio"]);
});
