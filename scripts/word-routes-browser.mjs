import assert from "node:assert/strict";
import { withIsolatedPreview } from "./exam-level-browser.mjs";

// Always run the writing portion against a new database, even when the caller
// already has a loopback preview open in another browser tab.
export async function verifyWordRoutes(page, base) {
  assert.ok(["127.0.0.1", "localhost"].includes(new URL(base).hostname));
  await withIsolatedPreview(async (url) => {
    const context = await page.context().browser().newContext();
    try {
      const browserErrors = [];
      await context.route("**/*", (r) =>
        r
          .request()
          .url()
          .startsWith(url + "/")
          ? r.continue()
          : r.abort(),
      );
      const tab = await context.newPage();
      tab.on("pageerror", (error) => browserErrors.push(error.message));
      await tab.goto(url + "/#/home");
      const home = tab.locator(".homeWords");
      await home.getByRole("heading", { name: "雅思核心词汇" }).waitFor();
      assert.ok(await home.getByRole("link", { name: /开始练词/ }).isVisible());
      assert.ok(
        await home.getByRole("link", { name: /单词错题本/ }).isVisible(),
      );
      await tab.locator('[data-nav="words"]').click();
      await tab
        .getByRole("heading", { name: "雅思核心词汇", exact: true })
        .waitFor();
      await tab.locator('[data-nav="home"]').click();
      await home.getByRole("link", { name: /单词错题本/ }).click();
      await tab.getByText("目前没有待订正的单词。", { exact: false }).waitFor();
      await tab.locator('[data-nav="home"]').click();
      await home.getByRole("link", { name: /开始练词/ }).click();
      const question = tab.locator(".cw-question");
      await question.locator("[data-answer]").first().waitFor();
      const route = new URL(tab.url()).hash;
      assert.match(route, /^#\/words\/.+\/train$/);
      const { term, gloss } = await tab.evaluate(async () => {
        const { getState } = await import("/sync.js");
        const { byId } = await import("/core-word-bank.js");
        const run = Object.values(getState().attempts).find(
          (a) => a.coreWordRun,
        );
        const word = byId.get(run.questions[0].id);
        return { term: word.term, gloss: word.gloss };
      });
      const choices = question.locator("[data-answer]");
      const labels = await choices.allTextContents();
      const incorrect = labels.findIndex((text) => text !== gloss);
      assert.notEqual(incorrect, -1);
      await choices.nth(incorrect).click();
      await question
        .locator(".readFeedback")
        .getByText(/需要订正/)
        .waitFor();
      await question.locator("[data-cw=next]").click();
      const step = tab.locator("#main .pageHead p");
      assert.match(await step.innerText(), /第\s*2\s*\//);
      assert.ok(
        await tab.evaluate(
          async () => await (await import("/sync.js")).flushSync(),
        ),
      );
      await tab.reload();
      await question.locator("[data-answer]").first().waitFor();
      assert.match(await step.innerText(), /第\s*2\s*\//);
      await tab.locator('#main a[href="#/words/errors"]').click();
      const row = tab
        .locator(".cw-entry")
        .filter({ has: tab.getByText(term, { exact: true }) });
      await row.waitFor();
      assert.ok((await row.innerText()).includes(labels[incorrect]));
      await tab.goto(url + "/__preview/account/b");
      await home.getByRole("link", { name: /单词错题本/ }).click();
      await tab.getByText("目前没有待订正的单词。", { exact: false }).waitFor();
      assert.equal(await tab.locator(".cw-entry").count(), 0);
      await tab.goto(url + "/__preview/account/a");
      await home.getByRole("link", { name: /单词错题本/ }).click();
      await row.waitFor();
      await tab.locator('[data-nav="home"]').click();
      await home.getByRole("link", { name: /开始练词/ }).click();
      await question.locator("[data-answer]").first().waitFor();
      assert.equal(new URL(tab.url()).hash, route);
      assert.match(await step.innerText(), /第\s*2\s*\//);
      assert.deepEqual(browserErrors, []);
      console.log(
        "PASS · dashboard and navigation word routes, saved wrong answer, reload/resume, A/B word-book isolation",
      );
    } finally {
      await context.close();
    }
  });
}
