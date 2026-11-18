import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, statSync } from "node:fs";
import { getDay, weekTitles } from "../public/curriculum.js";
const manifest = () =>
  JSON.parse(
    readFileSync(
      new URL("../public/audio/manifest.json", import.meta.url),
      "utf8",
    ),
  );
test("all tracks have 156 playable study days with local audio and valid answer keys", () => {
  const audio = manifest(),
    seen = new Set(),
    weeks = new Set();
  assert.equal(weekTitles.length, 26);
  for (const track of ["undecided", "academic", "general"])
    for (let day = 1; day <= 156; day++) {
      const lesson = getDay(day, track);
      weeks.add(lesson.weekTitle);
      assert.ok(lesson.title);
      assert.deepEqual(
        lesson.blocks.map((b) => b.id),
        ["vocab", "grammar", "exam", "work"],
      );
      assert.equal(
        lesson.blocks.reduce((n, b) => n + b.minutes, 0),
        60,
      );
      for (const block of lesson.blocks) {
        assert.ok(block.items.length);
        for (const i of block.items) {
          assert.ok(i.prompt && i.explanation);
          assert.ok(["choice", "write", "speak"].includes(i.kind));
          if (i.kind === "choice") {
            assert.ok(Number.isInteger(i.answer));
            assert.ok(i.options[i.answer]);
            assert.equal(new Set(i.options).size, i.options.length);
          }
          if (i.audioText) {
            assert.ok(
              audio[i.audioText],
              "Missing course audio: " + i.audioText,
            );
            seen.add(audio[i.audioText]);
          }
        }
      }
    }
  assert.equal(weeks.size, 26);
  for (const entry of seen) {
    const name = typeof entry === "string" ? entry : entry.file || entry.url;
    assert.ok(
      statSync(
        new URL(
          "../public/audio/" + name.replace(/^\/audio\//, ""),
          import.meta.url,
        ),
      ).size > 200,
    );
  }
});
test("every day has new target vocabulary and an independently addressable block", () => {
  const sets = Array.from({ length: 156 }, (_, n) =>
    getDay(n + 1)
      .blocks[0].items.filter((i) => i.term)
      .map((i) => i.term),
  );
  assert.ok(new Set(sets.flat()).size >= 800);
  assert.ok(sets.every((s) => new Set(s).size >= 6));
});
