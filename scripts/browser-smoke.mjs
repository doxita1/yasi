import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { chromium } from "playwright-core";

// Run against an isolated loopback database. The production account is never used by this test.
const temp = await mkdtemp(path.join(os.tmpdir(), "yasi-browser-")),
  port = Number(process.env.YASI_TEST_PORT || 4321),
  base = "http://127.0.0.1:" + port;
const server = spawn(process.execPath, ["scripts/preview.mjs"], {
  env: { ...process.env, PORT: String(port), YASI_PREVIEW_DATA: temp },
  stdio: ["ignore", "pipe", "pipe"],
  windowsHide: true,
});
let procError = "";
server.stderr.on("data", (d) => (procError += d));
const chromiumPath =
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
  ].find((x) => x && existsSync(x));
let browser;
try {
  for (let i = 0; i < 80; i++) {
    try {
      if ((await fetch(base + "/api/session")).ok) break;
    } catch {}
    if (server.exitCode !== null) throw Error(procError);
    await new Promise((r) => setTimeout(r, 200));
  }
  browser = await chromium.launch({
    headless: true,
    ...(chromiumPath ? { executablePath: chromiumPath } : {}),
    args: [
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
    ],
  });
  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    permissions: ["microphone"],
  });
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    permissions: ["microphone"],
  });
  const errors = [];
  for (const ctx of [desktop, mobile]) {
    await ctx.route("**/*", (route) => {
      if (
        route.request().url().startsWith(base) ||
        route.request().url().startsWith("blob:")
      )
        return route.continue();
      return route.abort();
    });
    ctx.on("page", (page) =>
      page.on("pageerror", (e) => errors.push(e.message)),
    );
  }
  const p = await desktop.newPage(),
    m = await mobile.newPage();
  async function flush(page) {
    assert.equal(
      await page.evaluate(
        async () => await (await import("/sync.js")).flushSync(),
      ),
      true,
    );
  }
  async function open(page, hash = "home") {
    await page.goto(base + "/#/" + hash);
    await page.locator("#crumb").waitFor({ state: "attached" });
    await page.waitForFunction(
      (h) =>
        document.querySelector("#main")?.dataset.route === h &&
        !!document.querySelector("#main h1,.ep-wrap,.ep-reviews"),
      hash,
    );
  }
  async function complete(page) {
    for (let i = 0; i < 35; i++) {
      if (await page.locator(".ep-complete").isVisible()) return;
      const next = page.locator("[data-act=next]");
      if (await next.isVisible()) {
        await next.click();
        continue;
      }
      if (await page.locator("[data-opt]").count()) {
        await page.locator("[data-opt]").first().click();
      } else
        await page
          .locator("[data-input]")
          .fill(
            "I can share the first draft by Friday. Could you confirm the time with our team?",
          );
      await page.locator("[data-act=check]").click();
    }
    throw Error("Lesson did not finish");
  }
  await open(p);
  assert.equal(
    await p.getByRole("heading", { name: "雅思备考工作台" }).count(),
    1,
  );
  assert.equal(await p.locator("[data-pace]").inputValue(), "30");
  await p.locator("[data-pace]").selectOption("20");
  assert.match(await p.locator(".pacePaths").innerText(), /复习约 5 分钟/);
  await flush(p);
  await open(m, "day/2");
  assert.equal(await m.locator("[data-pace]").inputValue(), "20");
  await p.locator("[data-pace]").selectOption("30");
  await flush(p);
  const screenshotRoot = process.env.YASI_QA_SHOTS;
  if (screenshotRoot)
    await p.screenshot({
      path: path.join(screenshotRoot, "desktop.png"),
      fullPage: true,
    });
  await open(p, "learn/1/vocab");
  await p.locator("[data-opt]").first().click();
  await p.locator("[data-act=check]").click();
  await p.locator("[data-act=next]").click();
  await flush(p);
  await open(m, "day/2");
  assert.ok((await m.locator(".task").count()) === 4);
  if (screenshotRoot)
    await m.screenshot({
      path: path.join(screenshotRoot, "mobile.png"),
      fullPage: true,
    });
  assert.ok(
    await m.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  );
  await m.locator("#main details summary").click();
  await m.locator('a[href="#/learn/2/work"]').click();
  await m.locator("[data-act=record]").first().click();
  await m.waitForFunction(() =>
    document.querySelector("[data-act=record]")?.textContent.includes("停"),
  );
  await m.waitForTimeout(450);
  await m.locator("[data-act=record]").click();
  await m.waitForFunction(() => !!document.querySelector("[data-clip] audio"));
  await complete(m);
  await flush(m);
  await open(p);
  await p.locator('a.resumeItem[href="#/learn/1/vocab"]').click();
  assert.match(await p.locator(".ep-counter").innerText(), /第 2\s*\//);
  await complete(p);
  await flush(p);
  await open(p, "day/2");
  await p.locator("#main details summary").click();
  assert.match(
    await p.locator('a[href="#/learn/2/work"]').innerText(),
    /已完成/,
  );
  const saved = await p.evaluate(
    async () => await (await fetch("/api/state")).json(),
  );
  assert.equal(saved.audio.length, 1);
  assert.ok(saved.attempts.length >= 2);
  const audioMeta = saved.audio[0];
  assert.ok(
    await p.evaluate(
      async (id) =>
        (await (await fetch("/api/audio/" + encodeURIComponent(id))).blob())
          .size > 0,
      audioMeta.id,
    ),
  );
  await m.goto(base + "/__preview/account/b");
  await m.waitForSelector(".heroActions");
  const b = await m.evaluate(
    async () => await (await fetch("/api/state")).json(),
  );
  assert.equal(b.attempts.length, 0);
  assert.equal(b.audio.length, 0);
  assert.equal(Object.keys(b.drafts).length, 0);
  assert.equal(
    await m.evaluate(
      async (id) =>
        (await fetch("/api/audio/" + encodeURIComponent(id))).status,
      audioMeta.id,
    ),
    404,
  );
  assert.ok(
    await m
      .locator(".heroActions")
      .innerText()
      .then((s) => s.includes("开始限时阅读")),
  );
  await open(p, "settings");
  await p.locator("[name=provider]").waitFor();
  assert.ok(await p.locator("[name=deep]").inputValue());
  await open(p, "courses");
  assert.equal(await p.locator(".weekCard").count(), 26);
  await open(p, "day/156");
  assert.equal(await p.locator(".task").count(), 4);
  await m.goto(base + "/__preview/account/a");
  await m.waitForSelector(".heroActions");
  await open(p, "learn/4/exam");
  await open(m, "learn/4/exam");
  await mobile.setOffline(true);
  await m
    .locator("[data-input]")
    .fill("A mobile draft written independently while offline.");
  await p
    .locator("[data-input]")
    .fill("An independent draft saved from my desktop.");
  await flush(p);
  await mobile.setOffline(false);
  await flush(m);
  await m.locator(".ep-conflict").waitFor();
  assert.match(await m.locator(".ep-conflict").innerText(), /mobile draft/);
  assert.match(await m.locator(".ep-conflict").innerText(), /desktop/);
  await m.locator("[data-act=use-local]").click();
  await flush(m);
  await open(p, "learn/2/exam");
  const mp3 = p.waitForResponse(
    (r) => r.url().includes("/audio/") && r.url().endsWith(".mp3") && r.ok(),
  );
  await p.locator("[data-act=play]").click();
  await mp3;
  await p.waitForFunction(() =>
    /\d\d:\d\d \/ \d\d:\d\d/.test(
      document.querySelector("[data-audio-label]")?.textContent || "",
    ),
  );
  await (await import("./mocks-browser.mjs")).verifyMockFlow(p, base);
  await (
    await import("./exam-level-browser.mjs")
  ).verifyReadingFlow(p, m, base);
  await (await import("./output-browser.mjs")).verifyOutputLabFlow(p, base);
  await (await import("./input-browser-flows.mjs")).smokeInputRoutes(p, base);
  await (await import("./materials-browser.mjs")).verifyMaterialsFlow(p, base);
  await (await import("./ai-settings-browser.mjs")).verifyAiSettings(p, base);
  await (await import("./word-routes-browser.mjs")).verifyWordRoutes(p, base);
  assert.deepEqual(errors, []);
  console.log(
    "PASS · desktop/mobile resume, future day, core practice without AI, microphone upload, decoded lesson audio, two-account isolation, conflict drafts, 26-week library.",
  );
} finally {
  await browser?.close();
  server.kill();
  if (server.exitCode === null)
    await new Promise((resolve) => {
      server.once("exit", resolve);
      setTimeout(resolve, 1800).unref();
    });
  await rm(temp, { recursive: true, force: true }).catch(() => {});
}
