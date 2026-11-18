import test from "node:test";
import assert from "node:assert/strict";
import { units } from "../public/material-lessons.js";
import { dayPlan } from "../public/exam-desk.js";
import { cleanAnswer } from "../public/mock-format.js";

test("Every materials workshop has an original case, four usable tasks and a separate production task", () => {
  const ids = new Set(),
    questions = new Set();
  for (const unit of units) {
    assert.match(unit.id, /^[a-z][a-z0-9-]+$/);
    assert.ok(!ids.has(unit.id));
    ids.add(unit.id);
    for (const field of [
      "name",
      "source",
      "text",
      "transfer",
      "words",
      "model",
    ])
      assert.ok(unit[field]?.trim(), unit.id + " " + field);
    assert.ok(unit.text.split(/\s+/).length >= 30);
    assert.equal(unit.tasks.length, 4);
    assert.ok(
      unit.tasks.some((task) => task[3]) && unit.tasks.some((task) => !task[3]),
      unit.id,
    );
    assert.ok(unit.model.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g)?.length >= 6);
    for (const [prompt, accepted, reason, opts] of unit.tasks) {
      assert.ok(prompt.trim() && reason.trim() && accepted.trim());
      assert.ok(!questions.has(prompt));
      questions.add(prompt);
      const answers = accepted.split("|").map(cleanAnswer);
      assert.equal(answers.length, new Set(answers).size);
      if (!opts) continue;
      const options = opts.split("|").map(cleanAnswer);
      assert.equal(new Set(options).size, options.length);
      assert.ok(options.length >= 2);
      assert.equal(
        options.filter((choice) => answers.includes(choice)).length,
        1,
        prompt,
      );
    }
  }
  for (const id of ["evidence", "rates", "clauses", "forms", "scope", "work"])
    assert.ok(ids.has(id));
});

test("The fifth study day of each odd week connects to a real workshop and covers all six cases", () => {
  const seen = new Set();
  for (let w = 1; w <= 26; w += 2) {
    const route = dayPlan((w - 1) * 6 + 5).route;
    assert.ok(route.startsWith("materials/"));
    const unit = units.find((u) => "materials/" + u.id === route);
    assert.ok(unit, route);
    seen.add(unit.id);
  }
  assert.equal(seen.size, units.length);
});

test("The chart workshop distinguishes headcounts, proportions and percentage points", () => {
  const unit = units.find((u) => u.id === "rates");
  const numbers = [...unit.text.matchAll(/\d+%?/g)].map((match) => match[0]);
  for (const value of ["200", "300", "30%", "26%", "20%", "32%"])
    assert.ok(numbers.includes(value));
  const headcount = unit.tasks.find(([p]) => p.includes("How many more"));
  assert.equal(Number(headcount[1]), 300 * 0.26 - 200 * 0.3);
  assert.equal(unit.tasks[0][1], "points");
  assert.ok(unit.tasks[3][1].split("|").includes("share"));
});
