import assert from "node:assert/strict";
import { units } from "../public/material-lessons.js";
import { dayPlan } from "../public/exam-desk.js";

const routeFor = (u) => "materials/" + u.id;
const planDay = (unit) =>
  Array.from({ length: 156 }, (_, i) => i + 1).find(
    (n) => dayPlan(n).route === routeFor(unit),
  );
async function flush(page) {
  assert.equal(
    await page.evaluate(
      async () => await (await import("/sync.js")).flushSync(),
    ),
    true,
  );
}
async function navigate(page, base, route) {
  await page.goto(base + "/#/" + route);
  await page.waitForFunction(
    (route) => document.querySelector("#main")?.dataset.route === route,
    route,
  );
}

export async function verifyMaterialsFlow(p, base) {
  const origin = new URL(base);
  assert.ok(
    ["127.0.0.1", "localhost"].includes(origin.hostname),
    "Use an isolated local preview",
  );
  // Keep the caller's cookies, page and test progress independent of the workshop.
  const browser = p.context().browser();
  const desk = await browser.newContext(),
    phone = await browser.newContext({ viewport: { width: 390, height: 844 } });
  try {
    let owner, unit;
    for (const name of ["b", "a"]) {
      const response = await fetch(origin.origin + "/api/state", {
        headers: { cookie: "yasi-preview=" + name },
      });
      assert.ok(response.ok);
      const { progress } = await response.json();
      const candidates = [
        units.find((u) => u.id === "rates"),
        ...units.filter((u) => u.id !== "rates"),
      ];
      unit = candidates.find(
        (u) =>
          !Object.hasOwn(progress, "attempt.material:" + u.id) &&
          !Object.hasOwn(progress, "attempt.examday:" + planDay(u)),
      );
      if (unit) {
        owner = name;
        break;
      }
    }
    assert.ok(
      owner,
      "No untouched material/day in this QA database. Start a fresh local preview.",
    );
    const url = origin.origin,
      unitRoute = routeFor(unit),
      day = planDay(unit),
      dayRoute = "day/" + day;
    for (const ctx of [desk, phone]) {
      await ctx.addCookies([{ url, name: "yasi-preview", value: owner }]);
      await ctx.route("**/*", (r) =>
        r
          .request()
          .url()
          .startsWith(url + "/")
          ? r.continue()
          : r.abort(),
      );
    }
    const page = await desk.newPage(),
      mobile = await phone.newPage();
    const errors = [];
    for (const pg of [page, mobile])
      pg.on("pageerror", (e) => errors.push(e.message));
    const drafts = (pg) => pg.locator("[data-material-draft]");
    const act = (pg, id) => pg.locator('[data-act="' + id + '"]').first();
    const scratch =
      "This is my private working draft before checking the evidence.";
    const final =
      unit.id === "rates"
        ? "Cycling lost four percentage points even though eighteen more apprentices used bicycles."
        : unit.model +
          " This result depends on the precise scope of the claim.";
    await navigate(page, url, "materials");
    assert.equal(await page.locator(".paperCard").count(), units.length);
    await page.locator('a.paperCard[href="#/' + unitRoute + '"]').click();
    await page.getByRole("heading", { name: unit.name, exact: true }).waitFor();
    assert.equal(
      await page.locator(".materialPassage").textContent(),
      unit.text,
    );
    assert.equal(await page.getByText(unit.model, { exact: true }).count(), 0);
    await act(page, "check").click();
    assert.match(await act(page, "check").innerText(), /先作答/);
    await drafts(page).fill(scratch);
    await act(page, "finish").click();
    assert.match(await page.locator("[data-msg]").innerText(), /先核对/);
    await flush(page);
    await navigate(mobile, url, unitRoute);
    assert.equal(await drafts(mobile).inputValue(), scratch);
    await navigate(page, url, dayRoute);
    const dailyLink = page.locator('a.btn[href="#/' + unitRoute + '"]');
    await dailyLink.waitFor();
    await dailyLink.click();
    await drafts(page).waitFor();

    const wrong = unit.tasks.findIndex((t) => !!t[3]);
    for (const [
      i,
      [prompt, accepted, reason, options],
    ] of unit.tasks.entries()) {
      await page.locator('[data-jump="' + i + '"]').click();
      assert.equal(await page.locator(".materialPrompt").innerText(), prompt);
      const answers = accepted.split("|");
      if (options) {
        const value =
          i === wrong
            ? options.split("|").find((v) => !answers.includes(v))
            : answers[0];
        const radio = page.getByRole("radio", { name: value, exact: true });
        await radio.check();
        assert.equal(await radio.isChecked(), true);
        if (i === wrong) {
          await page.locator('[data-jump="' + ((i + 1) % 4) + '"]').click();
          await page.locator('[data-jump="' + i + '"]').click();
          assert.equal(
            await radio.isChecked(),
            true,
            "An unchecked submission must preserve the chosen radio after navigating",
          );
        }
      } else {
        const value = i === 3 ? answers.at(-1) : answers[0];
        await page.locator("[data-material-answer]").fill(value.toUpperCase());
      }
      await act(page, "check").click();
      const feedback = page.locator(".readSplit .readFeedback");
      assert.ok((await feedback.innerText()).includes(reason));
      assert.match(
        await feedback.locator("b").innerText(),
        i === wrong ? /需要订正/ : /答对/,
      );
      assert.equal(await act(page, "check").count(), 0);
    }
    assert.equal(await page.locator(".numberGrid .answered").count(), 4);
    assert.equal(await page.getByText(unit.model, { exact: true }).count(), 0);
    for (const insufficient of ["one two three", "... ... ... ... ... ..."]) {
      await drafts(page).fill(insufficient);
      await act(page, "finish").click();
      assert.equal(
        await page.getByText(unit.model, { exact: true }).count(),
        0,
      );
      assert.match(await page.locator("[data-msg]").innerText(), /至少\s*6/);
    }
    await drafts(page).fill(final);
    await act(page, "finish").click();
    await page.getByText(unit.model, { exact: true }).waitFor();
    assert.match(
      await page.locator(".taskCard .readFeedback").innerText(),
      /3\s*\/\s*4/,
    );
    await flush(page);
    await navigate(page, url, "mistakes");
    const errorCard = page
      .locator("section.panel")
      .filter({ hasText: unit.tasks[wrong][0] });
    await errorCard.getByRole("link", { name: /回到原题/ }).click();
    assert.equal(
      await page.locator(".materialPrompt").innerText(),
      unit.tasks[wrong][0],
    );
    assert.match(
      await page.locator(".readSplit .readFeedback").innerText(),
      /需要订正/,
    );
    await navigate(page, url, dayRoute);
    await page.getByRole("link", { name: /重看已交专项/ }).waitFor();
    await page
      .locator("[data-plan]")
      .fill(
        "I checked the scope of the evidence before interpreting the change.",
      );
    await page.locator("[data-done]").click();
    assert.match(
      await page.locator("[data-message]").innerText(),
      /专项与复盘均已完成/,
    );
    await flush(page);
    await mobile.goto(url + "/#/" + unitRoute);
    await mobile.reload();
    assert.equal(await drafts(mobile).inputValue(), final);
    assert.match(
      await mobile.locator(".taskCard .readFeedback").innerText(),
      /3\s*\/\s*4/,
    );
    const other = owner === "a" ? "b" : "a";
    const r = await fetch(url + "/api/state", {
      headers: { cookie: "yasi-preview=" + other },
    });
    assert.ok(r.ok);
    const { drafts: otherDrafts } = await r.json();
    assert.notEqual(
      otherDrafts["material:" + unit.id + ":rewrite"]?.text,
      final,
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS · materials catalogue, linked study day, radio recall, correction, gated rewrite, synced private draft",
    );
  } finally {
    await Promise.all([desk.close(), phone.close()]);
  }
}
