import assert from "node:assert/strict";

// Use an empty preview account. Runtime, database, and media permissions are owned by the caller.
export async function verifyMockFlow(page, base) {
  const action = (id) => page.locator('[data-mock="' + id + '"]').first();
  await page.goto(base + "/#/mocks");
  await action("begin:0:listening").click();
  await action("listen").click();
  await page.waitForFunction(() =>
    document.querySelector("[data-notice]")?.textContent.includes("正在播放"),
  );
  await page.locator('[data-answer="0"]').fill("Park");
  await action("part:1").click();
  await action("home").click();
  await action("begin:0:listening").click();
  await action("part:0").click();
  assert.equal(await page.locator('[data-answer="0"]').inputValue(), "Park");
  await action("submit").click();
  await action("confirm").click();
  await page.getByText("客观题答对 1 / 40。逐题核对依据。").waitFor();
  await action("home").click();
  await page.locator("[data-track]").selectOption("general");
  await action("begin:1:writing").click();
  await page
    .getByRole("heading", { name: "Task 1 · Helping a new colleague" })
    .waitFor();
  await page
    .locator("textarea")
    .fill("Dear Alex, the buses in my district run every fifteen minutes.");
  await action("part:1").click();
  await page
    .locator("textarea")
    .fill("Flexible working hours can make travel easier for employees.");
  await action("part:0").click();
  assert.match(await page.locator("textarea").inputValue(), /Dear Alex/);
  await action("home").click();
  await action("begin:0:speaking").click();
  await action("record").click();
  await page.waitForFunction(() =>
    document.querySelector("[data-notice]")?.textContent.includes("正在录音"),
  );
  await page.waitForTimeout(500);
  await action("record").click();
  await action("replay").click();
  await page.waitForFunction(() =>
    document.querySelector("[data-notice]")?.textContent.includes("正在回听"),
  );
  await action("home").click();
  await page.locator("[data-track]").selectOption("academic");
  await action("begin:1:reading").click();
  await page
    .getByRole("heading", { name: "Listening to a moving river" })
    .waitFor();
  await page.locator('[data-answer="0"]').fill("six");
  await action("part:1").click();
  await action("home").click();
  await page.evaluate(async () => {
    const { getState, saveAttempt } = await import("/sync.js");
    const key = "mock:2:academic:reading";
    saveAttempt(key, { ...getState().attempts[key], deadline: Date.now() - 1 });
  });
  await action("begin:1:reading").click();
  await page.getByText("客观题答对 1 / 40。逐题核对依据。").waitFor();
  assert.equal(
    await page.locator("[data-notice]").textContent(),
    "时间已到，本场作答已保存。",
  );
}
