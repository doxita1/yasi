import assert from "node:assert/strict";
import test from "node:test";
import { readingSets } from "../public/reading-lab.js";
import { evaluateReading } from "../public/reading-room.js";
import { mockSections } from "../public/mocks.js";

const words = (text) => text.trim().split(/\s+/);
const flatten = (set) =>
  set.groups.flatMap((group) =>
    group.questions.map((question) => ({ ...question, group })),
  );

test("Reading diagnostic and practice passages remain independent of the full papers", () => {
  const mockTexts = ["academic", "general"].flatMap((track) =>
    [0, 1].flatMap((round) =>
      mockSections(round, "reading", track).map((s) => s.text ?? s.passage),
    ),
  );
  const sections = new Set();
  assert.equal(readingSets[0].id, "ac-01-beyond-the-counter");
  assert.ok(readingSets.filter((s) => s.track === "academic").length >= 6);
  assert.ok(readingSets.filter((s) => s.track === "general").length >= 2);
  for (const s of readingSets) {
    assert.equal(s.minutes, 20);
    assert.ok(!sections.has(s.id));
    sections.add(s.id);
    assert.equal(flatten(s).length, 13, s.title);
    const length = words(s.paragraphs.map((p) => p.text).join(" ")).length;
    if (s.track === "academic")
      assert.ok(
        length >= 650 && length <= 850,
        s.title + " should contain a full-length original passage",
      );
    else
      assert.ok(
        length >= 400,
        s.title + " should offer substantial General Training material",
      );
    assert.equal(
      new Set(s.paragraphs.map((p) => p.label)).size,
      s.paragraphs.length,
    );
    for (const p of s.paragraphs) {
      const opening = words(p.text).slice(0, 16).join(" ");
      assert.ok(
        !mockTexts.some((t) => typeof t === "string" && t.includes(opening)),
        s.title + " repeats a mock passage",
      );
    }
  }
});

test("Each reading response has complete feedback and an exact highlight in its source paragraph", () => {
  const ids = new Set(),
    passages = new Set(),
    formats = new Set();
  for (const set of readingSets) {
    for (const paragraph of set.paragraphs) {
      assert.ok(!passages.has(paragraph.text));
      passages.add(paragraph.text);
    }
    for (const q of flatten(set)) {
      assert.ok(!ids.has(q.id));
      ids.add(q.id);
      formats.add(q.group.title);
      const paragraph = set.paragraphs.find((p) => p.label === q.paragraph);
      assert.ok(
        paragraph?.text.includes(q.evidence),
        q.id + " unavailable evidence",
      );
      assert.ok(
        q.evidence.length >= 10 && q.explanation.trim() && q.paraphrase.trim(),
      );
      assert.ok(q.prompt.trim() && q.group.instruction.trim());
      assert.equal(evaluateReading(q, q.answer).correct, true, q.id);
      for (const alternative of q.alternatives || [])
        assert.equal(evaluateReading(q, alternative).correct, true, q.id);
      if (q.group.type === "text") {
        assert.ok(
          paragraph.text.toLowerCase().includes(q.answer.toLowerCase()),
        );
        assert.ok(words(q.answer).length <= q.group.maxWords);
        const tooLong = [...Array(q.group.maxWords + 1)]
          .map(() => "additional")
          .join(" ");
        assert.deepEqual(evaluateReading(q, tooLong), {
          correct: false,
          reason: "超过题目限定词数",
        });
      } else {
        const options = q.choices || q.group.choices;
        assert.ok(options.includes(q.answer));
        assert.equal(options.length, new Set(options).size);
        for (const wrong of options.filter((o) => o !== q.answer))
          assert.equal(evaluateReading(q, wrong).correct, false);
      }
      assert.equal(evaluateReading(q, "   ").correct, false);
    }
  }
  for (const format of [
    "Identifying information",
    "Matching information",
    "Matching headings",
    "Sentence completion",
    "Multiple choice",
  ])
    assert.ok(formats.has(format), format);
});

test("Text entry accepts case and listed spelling variants; excessive words and different meanings are errors", () => {
  const first = flatten(readingSets[0]),
    q = first.find((q) => q.alternatives?.length);
  assert.equal(evaluateReading(q, "  ORGANIZED   VISITS  ").correct, true);
  assert.equal(evaluateReading(q, "visitors").correct, false);
  assert.equal(
    evaluateReading(q, "all organised visits").reason,
    "超过题目限定词数",
  );
  assert.equal(evaluateReading(first[0], "NOT GIVEN").correct, false);
});
