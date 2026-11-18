import test from "node:test";
import assert from "node:assert/strict";
import {
  writingBank,
  speakingBank,
  criteria,
  aiContext,
  countWords,
} from "../public/output-content.js";
import { workedExamples } from "../public/output-examples.js";
import { labKey } from "../public/output-lab.js";
import { marketMap, mapExample } from "../public/output-map.js";

test("six essay topics, four charts and four letters support full-length work", () => {
  const academic = writingBank("academic"),
    general = writingBank("general");
  assert.equal(academic.filter((t) => t.kind === "chart").length, 4);
  assert.equal(general.filter((t) => t.kind === "letter").length, 4);
  assert.equal(academic.filter((t) => t.kind === "essay").length, 6);
  assert(academic.includes(marketMap));
  assert.equal(marketMap.maps.length, 2);
  assert(marketMap.maps.every((plan) => plan.cells.length === 9));
  assert.equal(marketMap.maps[0].cells[4], marketMap.maps[1].cells[4]);
  assert(aiContext(marketMap, "二稿").includes("2028 proposal only"));
  assert(countWords(mapExample.paras.map((row) => row[0]).join(" ")) >= 150);
  for (const item of [...academic, ...general]) {
    assert(
      item.prompt.length > 75 && item.strong.length > 105 && item.revision,
    );
    assert.equal(criteria[item.kind].length, 4);
    if (item.table)
      assert(
        item.table.slice(1).reduce((n, row) => n + row.slice(1).length, 0) >= 6,
      );
  }
  for (const [kind, target] of [
    ["essay", 250],
    ["letter", 150],
    ["chart", 150],
  ]) {
    const response = workedExamples[kind].paras.map((p) => p[0]).join(" ");
    assert(countWords(response) >= target);
  }
});
test("every week has an individual chart, letter, essay and timed three-part oral prompt", () => {
  const speaking = speakingBank(),
    questions = new Set(),
    letters = new Set(),
    charts = new Set(),
    essays = new Set();
  assert.equal(speaking.length, 26);
  for (let i = 1; i <= 26; i++) {
    const [chart, essay] = writingBank("academic", i),
      [letter] = writingBank("general", i),
      oral = speaking[i - 1];
    charts.add(chart.id);
    letters.add(letter.strong);
    essays.add(essay.prompt);
    assert(
      chart.table
        .slice(1)
        .flat()
        .filter((x) => typeof x === "number").length >= 6,
    );
    assert(
      oral.warmups.length >= 2 &&
        oral.bullets.length === 4 &&
        oral.follow.length === 3,
    );
    oral.follow.forEach((q) => questions.add(q));
    const context = aiContext(
      chart,
      "第二稿",
      "My first draft.",
      "Fix the percentage-point comparison",
    );
    assert(
      context.includes(JSON.stringify(chart.table)) &&
        context.includes("My first draft.") &&
        context.includes("percentage-point"),
    );
    assert(aiContext(oral, "Part 2").includes("发音无法由转写评定"));
  }
  assert.equal(charts.size, 26);
  assert.equal(letters.size, 26);
  assert.equal(essays.size, 26);
  assert.equal(questions.size, 78);
  assert.notEqual(
    labKey("writing", "a-library", 1),
    labKey("writing", "a-library", 2),
  );
});
