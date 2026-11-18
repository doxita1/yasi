import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { chromium } from "playwright-core";
import { listeningSets } from "../public/input-listening.js";
import { lexisModules } from "../public/input-lexis.js";
import { gradeInput, lexicalQuestions } from "../public/input-lab.js";
import { dictationCards, dictationVerdict } from "../public/input-dictation.js";
const publicRoot = fileURLToPath(new URL("../public/", import.meta.url));
test("four distinct complete listening sets and 60 reusable lexical targets have answer evidence and real encoded clips", async () => {
  assert.equal(listeningSets.length, 4);
  assert.equal(
    new Set(lexisModules.flatMap((p) => p.terms.map((t) => t.term))).size,
    60,
  );
  const marks = JSON.parse(
    await readFile(path.join(publicRoot, "input-audio/marks.json")),
  );
  for (const set of listeningSets) {
    assert.equal(set.questions.length, 10);
    assert.equal(marks[set.id].marks.length, set.turns.length);
    assert.ok(marks[set.id].duration > 120);
    assert.ok(
      (await stat(path.join(publicRoot, "input-audio", set.id + ".mp3"))).size >
        600000,
    );
    for (const q of set.questions) {
      assert.ok(set.turns[q.turn]);
      assert.ok(q.explanation);
      assert.ok(gradeInput(q, q.answer.toUpperCase()));
      if (q.limit) {
        assert.ok(
          set.turns[q.turn][1].toLowerCase().includes(q.answer.toLowerCase()),
        );
        assert.equal(gradeInput(q, "the extra " + q.answer), false);
      } else assert.ok(q.options.includes(q.answer));
    }
  }
  for (const module of lexisModules) {
    assert.ok(module.productionExample.length > 90);
    for (const t of module.terms) {
      assert.ok(t.example.includes(t.answer));
      assert.ok(t.nuance && t.gloss && t.definition && t.stem);
    }
  }
  const manifest = JSON.parse(
    await readFile(path.join(publicRoot, "audio/manifest.json")),
  );
  let count = 0;
  for (let w = 1; w <= 32; w++)
    for (let day = 1; day <= (w > 26 ? 1 : 6); day++)
      for (const card of dictationCards(w, day)) {
        const file = card.url
          ? path.join(publicRoot, card.url)
          : path.join(publicRoot, "audio", manifest[card.term]);
        assert.ok((await stat(file)).size > 500);
        count++;
      }
  assert.equal(count, 996);
  assert.equal(
    dictationVerdict("transferable skills", "transferable skill", 1).type,
    "漏写复数",
  );
  assert.equal(
    dictationVerdict("allocate resources", "allocate resource", 2).replayed,
    true,
  );
  assert.equal(
    dictationVerdict("policy compliance", "policy complience", 1).type,
    "拼写或词形",
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
  ].find((p) => p && existsSync(p));
test(
  "real browser plays locked test audio, resumes on refresh, reviews evidence, completes vocabulary and transfers a revision card",
  { skip: !browserPath, timeout: 55000 },
  async () => {
    // Isolate the test from production accounts. Audio, curriculum modules and player are served without alteration.
    const fixture =
      '<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><main id="app"></main><script type="module">import {mountInputLab} from "/input-lab.js";import {initSync} from "/sync.js";await initSync();const p=new URLSearchParams(location.search);mountInputLab(document.querySelector("main"),{mode:p.get("mode"),week:p.get("week")});</script></body></html>';
    const server = createServer(async (req, res) => {
      const url = new URL(req.url, "http://local.invalid");
      if (url.pathname === "/") {
        res.end(fixture);
        return;
      }
      if (url.pathname === "/api/session") {
        res.setHeader("Content-Type", "application/json");
        res.end('{"authenticated":false}');
        return;
      }
      const file = path.resolve(publicRoot, "." + url.pathname);
      if (!file.startsWith(path.resolve(publicRoot) + path.sep)) {
        res.writeHead(403).end();
        return;
      }
      try {
        const bytes = await readFile(file);
        res.setHeader(
          "Content-Type",
          {
            ".js": "text/javascript",
            ".json": "application/json",
            ".css": "text/css",
            ".mp3": "audio/mpeg",
          }[path.extname(file)] || "text/plain",
        );
        res.end(bytes);
      } catch {
        res.writeHead(404).end();
      }
    });
    await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
    const base = "http://127.0.0.1:" + server.address().port;
    let browser;
    try {
      browser = await chromium.launch({
        executablePath: browserPath,
        headless: true,
      });
      const p = await browser.newPage({
        viewport: { width: 390, height: 844 },
      });
      // Listen to real browser media events; speeding the test by seeking uses no learner-facing control.
      await p.addInitScript(() => {
        const Native = window.Audio;
        window.Audio = class extends Native {
          constructor(...args) {
            super(...args);
            window.lastAudio = this;
          }
        };
      });
      await p.goto(base + "/?mode=listening&week=19");
      await p.locator("[data-do=start]").click();
      assert.equal(await p.locator("[data-q]").count(), 10);
      assert.equal(await p.locator("audio[controls]").count(), 0);
      assert.equal(await p.locator("[data-evidence]").count(), 0);
      await p.locator("[data-do=listen]").click();
      await p.waitForFunction(() => window.lastAudio?.currentTime > 0.45);
      await p.locator("[data-do=listen]").click();
      await p.reload();
      await p.locator("[data-do=listen]").click();
      await p.waitForFunction(() => window.lastAudio?.currentTime > 0.5);
      await p.evaluate(() => {
        window.lastAudio.currentTime = window.lastAudio.duration - 0.16;
      });
      await p.getByText("已播放一次").waitFor();
      const set = listeningSets[2];
      for (let i = 0; i < 10; i++) {
        const q = set.questions[i],
          el = p.locator('[data-answer="' + i + '"]');
        if (q.options) {
          await el.nth(q.options.indexOf(q.answer)).check();
        } else {
          await el.fill(i === 4 ? "the extra " + q.answer : q.answer);
        }
      }
      await p.locator("[data-do=submit]").click();
      await p.getByText("9 / 10", { exact: true }).waitFor();
      await p.locator('[data-evidence="4"]').click();
      await p.locator('[data-excerpt="4"] blockquote').waitFor();
      const desired = JSON.parse(
        await readFile(path.join(publicRoot, "input-audio/marks.json")),
      ).commuter.marks[set.questions[4].turn];
      await p.waitForFunction(
        (expected) =>
          window.lastAudio?.currentTime >= expected && !window.lastAudio.paused,
        desired,
      );
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1,
        ),
        true,
      );
      await p.goto(base + "/?mode=lexis&week=7");
      await p.locator("[data-do=start]").click();
      const qs = lexicalQuestions(lexisModules[0]);
      for (let i = 0; i < 10; i++) {
        const q = qs[i],
          el = p.locator('[data-answer="' + i + '"]');
        if (q.options) await el.nth(q.options.indexOf(q.answer)).check();
        else await el.fill(i === 1 ? "wrong" : q.answer);
      }
      await p
        .locator("[data-writing]")
        .fill(
          "The confounding variable deserves attention. A tentative conclusion would be more appropriate.",
        );
      await p.locator("[data-do=submit]").click();
      await p.getByText("9 / 10", { exact: true }).waitFor();
      const result = await p.evaluate(async () => {
        const s = (await import("/sync.js")).getState();
        return {
          count: Object.keys(s.review).length,
          lexicalCount: Object.keys(s.review).filter((k) =>
            k.startsWith("input-lexis:"),
          ).length,
          listeningMistakes: Object.values(s.review)
            .filter((v) => v.labRoute === "listening/19")
            .map((v) => [v.category, v.labQuestion]),
          review: s.review["input-lexis:selection bias"],
          labs: Object.values(s.attempts).map((a) => [
            a.labArea,
            a.labRoute,
            a.completed,
          ]),
        };
      });
      assert.equal(result.count, 11);
      assert.equal(result.lexicalCount, 10);
      assert.deepEqual(result.listeningMistakes, [["答词超限", 4]]);
      assert.equal(result.review.tiers["看得懂"], "learning");
      assert.ok(result.review.due);
      assert.deepEqual(result.labs, [
        ["listening", "listening/19", true],
        ["lexis", "lexis/7", true],
      ]);
      await p.reload();
      await p.getByText("9 / 10", { exact: true }).waitFor();
      await p.locator("[data-do=again]").click();
      assert.equal(await p.locator(".il-result").count(), 0);
      await p.goto(base + "/?mode=dictation&week=27");
      await p.locator("[data-dict=start]").click();
      assert.equal(
        await p.getByText("confounding variable", { exact: true }).count(),
        0,
      );
      await p.locator("[data-dict=play]").click();
      await p.getByText("已播放 1 次").waitFor();
      await p.locator("[data-dict=play]").click();
      await p.getByText("已播放 2 次").waitFor();
      await p.locator("[data-spelling]").fill("confoundng variable");
      await p.locator("[data-dict=grade]").click();
      await p.getByText("拼写或词形", { exact: true }).waitFor();
      await p.locator("[data-correction]").fill("confounding variable");
      await p.locator("[data-dict=correct]").click();
      await p.getByText(/订正正确/).waitFor();
      await p.locator("[data-dict=next]").click();
      await p.reload();
      await p.getByText("第 2 / 10 项").waitFor();
      const recorded = await p.evaluate(async () => {
        const state = (await import("/sync.js")).getState();
        const a = Object.values(state.attempts).find(
          (x) => x.labArea === "dictation",
        );
        return {
          first: a.words[0],
          card: state.review["input-lexis:confounding variable"],
        };
      });
      assert.equal(recorded.first.plays, 2);
      assert.equal(recorded.first.correction, "confounding variable");
      assert.equal(recorded.first.right, false);
      assert.equal(recorded.card.tiers["听得出"], "learning");
    } finally {
      await browser?.close();
      await new Promise((ok) => server.close(ok));
    }
  },
);
