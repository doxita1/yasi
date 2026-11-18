import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createServer } from "node:net";
import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { quickReviewLimit } from "../public/daily-review.js";

test("short review budget caps", () => {
  assert.deepEqual(
    [15, 20, 25, 30, 40, 45, 60, NaN].map(quickReviewLimit),
    [3, 3, 5, 5, 5, 8, 8, 5],
  );
});
const browserPath =
  process.env.BROWSER_PATH ||
  [
    process.env.PROGRAMFILES &&
      path.join(
        process.env.PROGRAMFILES,
        "Google/Chrome/Application/chrome.exe",
      ),
    process.env["PROGRAMFILES(X86)"] &&
      path.join(
        process.env["PROGRAMFILES(X86)"],
        "Microsoft/Edge/Application/msedge.exe",
      ),
    "/usr/bin/chromium",
  ].find((x) => x && existsSync(x));
test(
  "live quick review route masks targets, grades recall, resumes partial batches, spaces by submission and preserves the original exam attempt",
  { skip: !browserPath, timeout: 50000 },
  async () => {
    const root = fileURLToPath(new URL("../", import.meta.url)),
      dir = await mkdtemp(path.join(os.tmpdir(), "yasi-quickreview-"));
    const probe = createServer();
    await new Promise((ok) => probe.listen(0, "127.0.0.1", ok));
    const port = probe.address().port;
    await new Promise((ok) => probe.close(ok));
    const base = "http://127.0.0.1:" + port;
    const child = spawn(process.execPath, ["scripts/preview.mjs"], {
      cwd: root,
      windowsHide: true,
      stdio: "ignore",
      env: { ...process.env, PORT: String(port), YASI_PREVIEW_DATA: dir },
    });
    let browser;
    try {
      for (let i = 0; i < 50; i++) {
        try {
          if ((await fetch(base + "/api/session")).ok) break;
        } catch {}
        await new Promise((r) => setTimeout(r, 180));
      }
      browser = await chromium.launch({
        executablePath: browserPath,
        headless: true,
      });
      const page = await browser.newPage({
        viewport: { width: 390, height: 844 },
      });
      const open = async (hash) => {
        await page.goto(
          base + "/?view=" + encodeURIComponent(hash) + "#/" + hash,
        );
        await page.waitForFunction(
          (h) => document.querySelector("#main")?.dataset.route === h,
          hash,
        );
      };
      await open("home");
      await page.evaluate(async () => {
        const s = await import("/sync.js");
        s.updateProfile({ dailyMinutes: 30 });
        await s.flushSync();
      });
      await open("quickreview");
      await page.locator("[data-quick-input]").waitFor();
      const read = () =>
        page.evaluate(async () => {
          const s = (await import("/sync.js")).getState();
          const latest = Object.values(s.attempts)
            .filter((a) => a.quickSession)
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
          return { run: latest, review: s.review };
        });
      const start = await read();
      assert.equal(start.run.cards.length, 3);
      assert.equal(Object.keys(start.review).length, 0);
      const first = start.run.cards[0];
      assert.ok(
        !(await page.locator("#main").innerText())
          .toLowerCase()
          .includes(first.word.toLowerCase()),
      );
      await page.locator("[data-quick-input]").fill("deliberately wrong");
      const before = Date.now();
      await page.locator("[data-quick=check]").click();
      await page.getByText("本次未独立写对").waitFor();
      const firstResult = (await read()).review[first.key];
      assert.equal(firstResult.lastQuickMode, "word");
      assert.equal(firstResult.lastQuickGrade, "again");
      assert.ok(
        Date.parse(firstResult.due) >= before + 599000 &&
          Date.parse(firstResult.due) <= Date.now() + 601000,
      );
      await page.locator("[data-quick=next]").click();
      await page.locator("[data-quick-input]").fill("unfinished sentence");
      await page.locator("[data-quick=pause]").click();
      await open("home");
      await open("quickreview");
      await page.locator("[data-quick-input]").waitFor();
      assert.equal(
        await page.locator("[data-quick-input]").inputValue(),
        "unfinished sentence",
      );
      for (let i = 1; i < 3; i++) {
        await page.locator("[data-quick-input]").fill(start.run.cards[i].word);
        await page.locator("[data-quick=check]").click();
        await page.locator("[data-quick=next]").click();
      }
      await page.getByRole("heading", { name: "这组复习完成了" }).waitFor();
      assert.equal((await read()).run.completed, true);
      await open("home");
      await open("quickreview");
      await page.getByRole("heading", { name: "现在没有到期项目" }).waitFor();
      await page.evaluate(async () => {
        const s = await import("/sync.js");
        s.saveReview("case:quick:reading", {
          word: "Did the project recruit a representative sample?",
          meaning:
            "The newsletter reached current riders, so recruitment was biased.",
          example: "Regular riders were more likely to respond.",
          labRoute: "listening/19",
          labQuestion: 3,
          labAttempt: "input:demo:1",
          due: "2000-01-01",
        });
        s.saveAttempt("original-immutable", {
          completed: true,
          answers: { 0: { submitted: true, text: "My original response" } },
        });
        await s.flushSync();
      });
      await open("home");
      await open("quickreview");
      await page.locator("[data-quick-input]").waitFor();
      assert.ok(
        !(await page.locator("#main").innerText()).includes(
          "newsletter reached",
        ),
      );
      await page
        .locator("[data-quick-input]")
        .fill("Recruitment through current members distorts the sample.");
      await page.locator("[data-quick=check]").click();
      assert.match(
        await page.locator(".ep-feedback").innerText(),
        /newsletter reached/,
      );
      assert.equal(
        await page
          .getByRole("link", { name: "回到原题查看依据" })
          .getAttribute("href"),
        "#/listening/19/q4/input%3Ademo%3A1",
      );
      await page.locator("[data-quick=self]").click();
      await page.locator("[data-quick=next]").click();
      const finish = await read();
      assert.equal(
        finish.review["case:quick:reading"].lastQuickMode,
        "reflection",
      );
      assert.equal(finish.run.answers[0].grade, "self");
      assert.equal(
        await page.evaluate(
          async () =>
            (await import("/sync.js")).getState().attempts["original-immutable"]
              .answers[0].text,
        ),
        "My original response",
      );
    } finally {
      await browser?.close();
      if (child.exitCode === null) {
        const exit = new Promise((r) => child.once("exit", r));
        child.kill();
        await exit;
      }
      if (
        path.dirname(path.resolve(dir)) === path.resolve(os.tmpdir()) &&
        path.basename(dir).startsWith("yasi-quickreview-")
      )
        await rm(dir, { recursive: true, force: true });
    }
  },
);
