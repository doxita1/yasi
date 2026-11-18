import assert from "node:assert/strict";
import { workedExamples } from "../public/output-examples.js";

export async function verifyOutputLabFlow(page, base) {
  const b = (id) => page.locator('[data-ol="' + id + '"]').first();
  await page.goto(base + "/#/writing/11/week-11-chart");
  await page.locator(".ol-table").waitFor();
  assert.match(await page.locator(".ol-table").innerText(), /Enquiries/);
  await b("timer").click();
  assert.match(await page.locator("[data-ol-clock]").innerText(), /写作/);
  const work = workedExamples.chart.paras.map((p) => p[0]).join("\n\n");
  await page.locator("#ol-editor").fill(work);
  await page.locator("#ol-goal").fill("核对单位并补充数据对比");
  await b("second").first().click();
  assert.equal(await page.locator("#ol-editor").inputValue(), work);
  const updated = work + " The gap deserves a comparison across both decades.";
  await page.locator("#ol-editor").fill(updated);
  await page.locator("[data-ol-criterion]").first().check();
  await b("finish").click();
  assert.match(await page.locator("[data-ol-status]").innerText(), /已保存/);
  const entry = await page.evaluate(async () => {
    const s = await import("/sync.js");
    await s.flushSync();
    return s.getState().attempts["lab:writing:11:week-11-chart"];
  });
  assert.equal(entry.completed, true);
  assert.equal(entry.labRoute, "writing/11/week-11-chart");
  assert.equal(entry.labArea, "writing");
  await page.goto(base + "/#/writing/11/week-11-chart");
  assert.equal(await page.locator("#ol-editor").inputValue(), updated);
  await page.locator("[data-ol-topic]").selectOption("week-11-essay");
  assert.equal(await page.locator("#ol-editor").inputValue(), "");
  await page.locator("[data-ol-track]").selectOption("general");
  assert.match(await page.locator(".ol-question").innerText(), /colleague/);
  await page.goto(base + "/#/writing/0/a-map-market");
  await page.locator(".ol-plan").first().waitFor();
  assert.equal(await page.locator(".ol-plan span").count(), 18);
  assert.match(await page.locator(".ol-map").innerText(), /2028 proposal only/);
  await page.goto(base + "/#/speaking/19/s-transfer");
  await page
    .locator("#ol-transcript")
    .fill("I learn by trying a new situation.");
  await b("part:2").click();
  await b("prep").click();
  assert.match(await page.locator("[data-ol-clock]").innerText(), /准备/);
  await b("record").click();
  await page.waitForFunction(() =>
    document
      .querySelector("[data-ol-status]")
      ?.textContent.includes("正在录音"),
  );
  assert.match(await page.locator("[data-ol-clock]").innerText(), /陈述/);
  await page.waitForTimeout(500);
  await b("record").click();
  await page.locator('[data-ol^="replay:"]').click();
  await page.waitForFunction(() =>
    document.querySelector("[data-ol-status]")?.textContent.includes("回听"),
  );
  await b("part:3").click();
  assert.equal(await page.locator(".ol-panel ol li").count(), 0);
  await b("surprise").click();
  await b("surprise").click();
  const shown = await page.locator(".ol-panel ol li").allTextContents();
  assert.equal(new Set(shown).size, 2);
  const answer =
    "Remembering the route is different from deciding what to do when the layout changes.";
  await page.locator("#ol-transcript").fill(answer);
  let payload;
  await page.route("**/api/coach", async (route) => {
    payload = route.request().postDataJSON();
    await route.fulfill({
      json: {
        text: "Your answer distinguishes memory from adaptation. Explain one changed decision.",
        provider: "fixture",
        model: "test-model",
      },
    });
  });
  await b("ai").click();
  await page.getByText(/Your answer distinguishes/).waitFor();
  assert.equal(payload.input, answer);
  assert.equal(payload.task, "speaking");
  assert(
    payload.context.includes(shown[0]) &&
      payload.context.includes("发音无法由转写评定"),
  );
  await page.unroute("**/api/coach");
  await page.locator("[data-ol-criterion]").first().check();
  await b("finish").click();
  assert.match(await page.locator("[data-ol-status]").innerText(), /已保存/);
}
