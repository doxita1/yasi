import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import {
  getMockAudioTexts,
  mockKey,
  mockSections,
  scoreMock,
} from "../public/mocks.js";
import { isCorrect } from "../public/mock-format.js";

test("two complete independent objective papers with playable, bundled listening audio", async () => {
  const manifest = JSON.parse(
    await readFile(
      new URL("../public/audio/manifest.json", import.meta.url),
      "utf8",
    ),
  );
  const tracks = getMockAudioTexts();
  assert.equal(new Set(tracks).size, 8);
  for (const text of tracks) {
    assert(text.split(/\s+/).length > 280);
    const file = manifest[text];
    assert(
      file,
      "Each mock recording must be available before opening the test.",
    );
    assert(
      (await stat(new URL("../public/audio/" + file, import.meta.url))).size >
        10000,
    );
  }
  const titles = new Set();
  for (const round of [0, 1]) {
    const listen = mockSections(round, "listening");
    assert.equal(listen.length, 4);
    assert.deepEqual(
      listen.map((part) => part.questions.length),
      [10, 10, 10, 10],
    );
    for (const track of ["academic", "general"]) {
      const reading = mockSections(round, "reading", track);
      const words = reading.reduce((n, part) => n + part.text.split(/\s+/).length, 0);
      assert(words >= 2150 && words <= 2750);
      assert.deepEqual(
        reading.map((part) => part.questions.length),
        [13, 13, 14],
      );
      for (const part of reading) {
        assert(!titles.has(part.title));
        titles.add(part.title);
      }
      for (const paper of [listen, reading]) {
        const questions = paper.flatMap((p) => p.questions);
        const answers = {};
        for (const [i, q] of questions.entries()) {
          assert(q.prompt && q.answer && q.explanation);
          if (q.choices) assert(q.choices.includes(q.answer));
          assert(!isCorrect(q, ""));
          answers[i] = { text: q.answer.toUpperCase() };
        }
        assert.deepEqual(scoreMock(paper, answers), { correct: 40, total: 40 });
        assert.deepEqual(scoreMock(paper, {}), { correct: 0, total: 40 });
      }
      const written = mockSections(round, "writing", track);
      assert.equal(written.length, 2);
      assert.equal(!!written[0].table, track === "academic");
      assert(written[0].cues.length && written[1].cues.length);
    }
    assert.equal(mockSections(round, "speaking").length, 3);
    assert.equal(
      mockKey(round, "listening", "academic"),
      mockKey(round, "listening", "general"),
    );
    assert.notEqual(
      mockKey(round, "writing", "academic"),
      mockKey(round, "writing", "general"),
    );
  }
});
