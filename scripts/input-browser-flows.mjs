import assert from "node:assert/strict";
import { listeningSets } from "../public/input-listening.js";
import { lexisModules } from "../public/input-lexis.js";
import { lexicalQuestions } from "../public/input-lab.js";

// The caller supplies an isolated local preview, matching the main browser smoke's temporary database.
export async function smokeInputRoutes(page, base) {
  if (!["127.0.0.1", "localhost", "[::1]"].includes(new URL(base).hostname))
    throw Error("Input lab smoke requires a local preview.");
  await page.addInitScript(() => {
    const Native = window.Audio;
    window.Audio = class extends Native {
      constructor(...args) {
        super(...args);
        window.inputSmokeAudio = this;
      }
    };
  });
  const open = async (section) => {
    await page.goto(
      base + "/?input-smoke=" + encodeURIComponent(section) + "#/" + section,
    );
    await page.waitForFunction(
      (route) => document.querySelector("#main")?.dataset.route === route,
      section,
    );
    await page.locator(".il-main").waitFor();
  };
  const begin = async () => {
    if (await page.locator("[data-do=again]").count())
      await page.locator("[data-do=again]").click();
    else if (await page.locator("[data-do=start]").count())
      await page.locator("[data-do=start]").click();
  };
  await open("listening/19");
  await begin();
  const set = listeningSets[2];
  for (let i = 0; i < 10; i++) {
    const q = set.questions[i],
      el = page.locator('[data-answer="' + i + '"]');
    if (q.options) await el.nth(q.options.indexOf(q.answer)).check();
    else await el.fill(i === 4 ? "wrong station" : q.answer);
  }
  const play = page.locator("[data-do=listen]");
  if (await play.count()) {
    await play.click();
    await page.waitForFunction(() => window.inputSmokeAudio?.currentTime > 0.2);
    await page.evaluate(() => {
      const a = window.inputSmokeAudio;
      a.currentTime = a.duration - 0.18;
    });
    await page.getByText("已播放一次").waitFor();
  }
  await page.locator("[data-do=submit]").click();
  await page.getByText("9 / 10", { exact: true }).waitFor();
  await page.goto(base + "/#/mistakes");
  const saved = page.locator('a[href*="listening/19/q5/"]').first();
  await saved.click();
  await page.waitForFunction(
    () => document.activeElement?.getAttribute("data-q") === "4",
  );
  await page.locator('[data-evidence="4"]').click();
  await page.locator('[data-excerpt="4"] blockquote').waitFor();
  await open("lexis/3");
  await begin();
  const questions = await page.evaluate(async () => {
    const s = (await import("/sync.js")).getState();
    const a = Object.values(s.attempts)
      .filter((x) => x.labRoute === "lexis/3" && !x.completed)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    return a?.offset || 0;
  });
  for (const [i, q] of lexicalQuestions(lexisModules[2], questions).entries()) {
    const el = page.locator('[data-answer="' + i + '"]');
    if (q.options) await el.nth(q.options.indexOf(q.answer)).check();
    else await el.fill(q.answer);
  }
  await page
    .locator("[data-writing]")
    .fill(
      "The cumulative impact of seasonal fluctuation should be examined before the habitat is altered.",
    );
  await page.locator("[data-do=submit]").click();
  await page.getByText("10 / 10", { exact: true }).waitFor();
  await open("dictation/27");
  if (await page.locator("[data-dict=start]").count())
    await page.locator("[data-dict=start]").click();
  else if (await page.locator("[data-dict=fresh]").count())
    await page.locator("[data-dict=fresh]").click();
  if (!(await page.locator("[data-spelling]").count()))
    await page.locator("[data-dict=next]").click();
  await page.locator("[data-dict=play]").click();
  await page.waitForFunction(() =>
    /已播放 [1-9]/.test(
      document.querySelector("[data-plays]")?.textContent || "",
    ),
  );
  await page.locator("[data-spelling]").fill("incorrect phrase");
  await page.locator("[data-dict=grade]").click();
  await page.goto(base + "/#/mistakes");
  await page.locator('a[href*="dictation/27/q"]').first().click();
  await page.locator("[data-origin]").waitFor();
  assert.match(await page.locator("[data-origin]").textContent(), /首次拼写/);
}
