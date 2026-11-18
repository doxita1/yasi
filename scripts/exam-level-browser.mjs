import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { once } from "node:events";
import { createServer } from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readingSets } from "../public/reading-lab.js";

const set = readingSets[0],
  route = "/#/reading/" + set.id;
const questions = set.groups.flatMap((g) =>
  g.questions.map((q) => ({ ...q, group: g })),
);
const fills = questions
  .map((q, i) => (q.group.type === "text" ? i : -1))
  .filter((i) => i >= 0);
const tooLong = fills[0];
const note = "Scope matters: check what the counter actually records.";
const marked = "A museum door";
const root = fileURLToPath(new URL("../", import.meta.url));

async function withIsolatedPreview(run) {
  const reservation = createServer();
  reservation.listen(0, "127.0.0.1");
  await once(reservation, "listening");
  const port = reservation.address().port;
  await new Promise((resolve) => reservation.close(resolve));
  const directory = await mkdtemp(path.join(os.tmpdir(), "yasi-reading-qa-"));
  const server = spawn(process.execPath, ["scripts/preview.mjs"], {
    cwd: root,
    windowsHide: true,
    env: { ...process.env, PORT: String(port), YASI_PREVIEW_DATA: directory },
    stdio: ["ignore", "ignore", "pipe"],
  });
  let detail = "";
  server.stderr.on("data", (d) => {
    detail += d.toString();
  });
  const closed = once(server, "exit");
  try {
    const base = "http://127.0.0.1:" + port;
    let ready = false;
    for (let i = 0; i < 70; i++) {
      if (server.exitCode !== null) throw Error("Preview stopped: " + detail);
      try {
        ready = (await fetch(base + "/api/session")).ok;
      } catch {}
      if (ready) break;
      await new Promise((resolve) => setTimeout(resolve, 140));
    }
    assert(ready, "Isolated reading preview did not become ready");
    return await run(base);
  } finally {
    if (server.exitCode === null) server.kill();
    await closed;
    const parent = path.dirname(path.resolve(directory)),
      temp = path.resolve(os.tmpdir());
    if (
      parent === temp &&
      path.basename(directory).startsWith("yasi-reading-qa-")
    )
      await rm(directory, {
        recursive: true,
        force: true,
        maxRetries: 4,
        retryDelay: 120,
      });
  }
}

async function flush(page) {
  assert.equal(
    await page.evaluate(
      async () => await (await import("/sync.js")).flushSync(),
    ),
    true,
    "Account sync failed",
  );
}
async function testContexts(browser, mobileBrowser, base) {
  const desktop = await browser.newContext({
    viewport: { width: 1400, height: 920 },
  });
  const mobile = await mobileBrowser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  });
  const errors = [];
  try {
    for (const ctx of [desktop, mobile]) {
      await ctx.addCookies([{ name: "yasi-preview", value: "b", url: base }]);
      await ctx.route("**/*", (r) =>
        r
          .request()
          .url()
          .startsWith(base + "/")
          ? r.continue()
          : r.abort(),
      );
      ctx.on("page", (pg) => pg.on("pageerror", (e) => errors.push(e.message)));
    }
    const p = await desktop.newPage(),
      m = await mobile.newPage();
    p.setDefaultTimeout(10_000);
    m.setDefaultTimeout(10_000);
    const pg = (page) => page.locator(".questionCard");
    const act = (page, id) => page.locator('[data-act="' + id + '"]').first();
    const goQuestion = (page, i) =>
      page.locator('[data-jump="' + i + '"]').click();
    const nthText = (page, i) => page.locator(".numberGrid [data-jump]").nth(i);
    await p.goto(base + "/#/reading");
    await p.locator('[data-filter="general"]').click();
    assert.equal(
      await p.locator(".paperCard").count(),
      readingSets.filter((s) => s.track === "general").length,
    );
    await p.locator('[data-filter="academic"]').click();
    await p.locator('a[href="#/reading/' + set.id + '"]').click();
    await pg(p).waitFor();
    assert.equal(await pg(p).locator("h3").innerText(), questions[0].prompt);
    assert.equal(await p.locator(".numberGrid button").count(), 13);
    assert.equal(await p.locator(".readFeedback").count(), 0);
    await pg(p)
      .getByRole("radio", { name: questions[0].answer, exact: true })
      .check();
    await act(p, "flag").click();
    await pg(p).locator("summary").click();
    await p.locator("[data-note]").fill(note);
    await p.locator('[data-par="A"] p').evaluate((paragraph, phrase) => {
      const node = paragraph.firstChild,
        at = node.textContent.indexOf(phrase);
      if (at < 0) throw Error("Diagnostic highlight text absent");
      const r = document.createRange();
      r.setStart(node, at);
      r.setEnd(node, at + phrase.length);
      const selection = getSelection();
      selection.removeAllRanges();
      selection.addRange(r);
    }, marked);
    await act(p, "highlight").click();
    assert.equal(await p.locator('[data-par="A"] mark').innerText(), marked);
    await goQuestion(p, 1);
    await p.waitForFunction(
      () => document.querySelector("[data-remaining]")?.textContent !== "20:00",
    );
    await act(p, "pause").click();
    await p
      .locator('a[href="#/reading"]')
      .filter({ hasText: "全部阅读" })
      .click();
    await flush(p);

    await m.goto(base + route);
    await pg(m).waitFor();
    assert.equal(
      await pg(m).locator("h3").innerText(),
      questions[1].prompt,
      "Second device should open the pending question",
    );
    assert.equal(await m.locator("[data-count]").innerText(), "1 / 13");
    assert.match(await nthText(m, 0).getAttribute("class"), /flagged/);
    assert.notEqual(await m.locator("[data-remaining]").innerText(), "20:00");
    await goQuestion(m, 0);
    assert.equal(
      await pg(m)
        .getByRole("radio", { name: questions[0].answer, exact: true })
        .isChecked(),
      true,
    );
    assert.equal(await m.locator("[data-note]").inputValue(), note);
    const switchTab = (page, name) =>
      page.locator('.mobileReadTabs [data-tab="' + name + '"]').click();
    await switchTab(m, "passage");
    assert.equal(await m.locator(".readPaper").isVisible(), true);
    assert.equal(await pg(m).isVisible(), false);
    assert.equal(await m.locator('[data-par="A"] mark').innerText(), marked);
    assert.ok(
      await m.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      "Mobile reading should not overflow horizontally",
    );
    await switchTab(m, "questions");
    for (let i = 1; i < questions.length; i++) {
      const q = questions[i];
      await goQuestion(m, i);
      if (q.group.type === "text")
        await m
          .locator("[data-fill]")
          .fill(i === tooLong ? "on " + q.answer : q.answer);
      else
        await pg(m).getByRole("radio", { name: q.answer, exact: true }).check();
    }
    await act(m, "submit").click();
    assert.match(await m.locator(".submitBanner").innerText(), /13 \/ 13/);
    await act(m, "confirm").click();
    assert.match(await m.locator(".sheetResult h2").innerText(), /12 \/ 13/);
    assert.match(
      await m.locator(".readFeedback").innerText(),
      /超过题目限定词数/,
    );
    assert.equal(
      await m.locator(".readFeedback blockquote").innerText(),
      questions[tooLong].evidence,
    );
    await act(m, "locate").click();
    assert.equal(
      await m
        .locator(
          '.readPaper [data-par="' + questions[tooLong].paragraph + '"] mark',
        )
        .filter({ hasText: questions[tooLong].evidence })
        .isVisible(),
      true,
    );
    await flush(m);
    await p.goto(base + "/#/mistakes");
    const mistake = p
      .locator("section.panel")
      .filter({ hasText: questions[tooLong].prompt })
      .getByRole("link", { name: /回到原题/ });
    await mistake.click();
    assert.equal(
      await pg(p).locator("h3").innerText(),
      questions[tooLong].prompt,
    );
    assert.match(
      await p.locator(".readFeedback").innerText(),
      /超过题目限定词数/,
    );
    await act(p, "repeat").click();
    assert.equal(await pg(p).locator("h3").innerText(), questions[0].prompt);
    assert.equal(await p.locator("[data-count]").innerText(), "0 / 13");
    assert.equal(await p.locator(".sheetResult").count(), 0);
    await flush(p);
    const saved = await p.evaluate(
      async () => await (await fetch("/api/state")).json(),
    );
    assert.equal(
      saved.attempts.filter((a) => a.readingSet === set.id).length,
      1,
      "The completed score is archived once",
    );
    const attempts = Object.values(saved.progress).filter(
      (a) => a.readingSet === set.id,
    );
    const previous = attempts.find((a) => a.completed),
      fresh = attempts.find((a) => !a.completed);
    assert.equal(attempts.length, 2);
    assert(previous && fresh);
    assert.equal(previous.correct, 12);
    assert.equal(previous.notes[0], note);
    assert.notEqual(previous.startedAt, fresh.startedAt);
    // The same error link must still resolve to the submitted answer after a fresh attempt exists.
    await p.goto(base + "/#/mistakes");
    await mistake.click();
    assert.equal(
      await pg(p).locator("h3").innerText(),
      questions[tooLong].prompt,
    );
    await p.locator(".readFeedback").waitFor();
    assert.match(
      await p.locator(".readFeedback").innerText(),
      /超过题目限定词数/,
    );
    assert.deepEqual(errors, []);
  } finally {
    await Promise.all([desktop.close(), mobile.close()]);
  }
}

export async function verifyReadingFlow(p, m, base) {
  const url = new URL(base);
  assert(
    ["127.0.0.1", "localhost"].includes(url.hostname),
    "Use a local test preview",
  );
  const browser = p.context().browser(),
    mobileBrowser = m.context().browser();
  const previewState = await fetch(new URL("/api/state", base), {
    headers: { cookie: "yasi-preview=b" },
  });
  assert.ok(previewState.ok);
  const state = await previewState.json(),
    attempts = Object.values(state.progress);
  // A previous run or another smoke scenario may already own this lab. Do not rewrite it.
  if (attempts.some((a) => a.readingSet === set.id))
    await withIsolatedPreview((b) => testContexts(browser, mobileBrowser, b));
  else await testContexts(browser, mobileBrowser, url.origin);
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  const { chromium } = await import("playwright-core");
  const executablePath =
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
      "/usr/bin/google-chrome",
    ].find((p) => p && existsSync(p));
  const browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
  });
  try {
    await withIsolatedPreview((base) => testContexts(browser, browser, base));
    console.log(
      "PASS · reading diagnostic, two-device resume, mobile reader, marking, evidence, word limit, retries and history",
    );
  } finally {
    await browser.close();
  }
}
