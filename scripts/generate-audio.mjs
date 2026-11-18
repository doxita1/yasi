// Windows build helper. Set FFMPEG_PATH or put FFmpeg (with libmp3lame) on PATH.
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  stat,
  rm,
  rename,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { cases } from "../public/lesson-cases.js";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const directory = path.resolve(scriptDir, "../public/audio");
const texts = new Set();
const add = (text) => {
  if (typeof text === "string" && text.trim()) texts.add(text);
};
const seed = process.argv.includes("--seed");
if (seed) {
  for (const c of cases) {
    add(c.listening);
    for (const t of c.terms) add(t[0]);
  }
  try {
    const { extraTerms } = await import("../public/lesson-lexicon.js");
    for (const week of extraTerms)
      for (const day of week) for (const [term] of day) add(term);
  } catch (err) {
    if (err.code !== "ERR_MODULE_NOT_FOUND") throw err;
  }
  try {
    const { scenarios } = await import("../public/lesson-scenarios.js");
    for (const row of scenarios) add(row[0]);
  } catch (err) {
    if (err.code !== "ERR_MODULE_NOT_FOUND") throw err;
  }
  try {
    const { getMockAudioTexts } = await import("../public/mock-listening.js");
    for (const text of getMockAudioTexts()) add(text);
  } catch (err) {
    if (err.code !== "ERR_MODULE_NOT_FOUND") throw err;
  }
} else {
  const { getDay } = await import("../public/curriculum.js");
  const { getMockAudioTexts } = await import("../public/mock-listening.js");
  for (const track of ["academic", "general", "undecided"]) {
    for (let n = 1; n <= 156; n++) {
      const day = getDay(n, track);
      for (const block of day.blocks)
        for (const i of block.items) {
          add(i.audioText);
          if (i.reviewKey) add(i.word || i.term);
        }
    }
  }
  for (const t of getMockAudioTexts()) add(t);
}
const manifest = Object.fromEntries(
  [...texts]
    .sort()
    .map((t) => [
      t,
      createHash("sha256").update(t).digest("hex").slice(0, 22) + ".mp3",
    ]),
);
async function usable(file) {
  try {
    const name = path.join(directory, file);
    const info = await stat(name);
    if (info.size <= 250) return false;
    const bytes = await readFile(name);
    return (
      bytes.subarray(0, 3).toString() === "ID3" ||
      (bytes[0] === 255 && (bytes[1] & 224) === 224)
    );
  } catch {
    return false;
  }
}
const jobs = [];
for (const [text, file] of Object.entries(manifest)) {
  if (!(await usable(file))) jobs.push({ text, file });
}
if (process.argv.includes("--verify")) {
  if (jobs.length) throw Error(jobs.length + " missing or invalid MP3 clips");
  const actual = JSON.parse(
    await readFile(path.join(directory, "manifest.json"), "utf8"),
  );
  for (const [t, f] of Object.entries(manifest))
    if (actual[t] !== f) throw Error("Incorrect manifest for " + f);
  console.log(
    "Verified " +
      texts.size +
      " deduplicated sources and playable MP3 headers.",
  );
  process.exit(0);
}
await mkdir(directory, { recursive: true });
const scratch = await mkdtemp(path.join(tmpdir(), "yasi-speech-"));
const concurrency = 4;
const chunks = Array.from({ length: concurrency }, () => []);
jobs.forEach((j, i) => chunks[i % concurrency].push(j));
async function generate(group, id) {
  if (!group.length) return;
  const batch = path.join(scratch, "batch-" + id + ".json");
  await writeFile(batch, "\ufeff" + JSON.stringify(group));
  await new Promise((resolve, reject) => {
    const child = spawn(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        path.join(scriptDir, "generate-audio.ps1"),
        "-Batch",
        batch,
        "-OutputDir",
        directory,
        "-FFmpeg",
        process.env.FFMPEG_PATH || "ffmpeg",
      ],
      { windowsHide: true, stdio: "inherit" },
    );
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0
        ? resolve()
        : reject(Error("Speech worker " + id + " exited " + code)),
    );
  });
}
try {
  const results = await Promise.allSettled(chunks.map(generate));
  const failure = results.find((r) => r.status === "rejected");
  if (failure) throw failure.reason;
  for (const name of Object.values(manifest))
    if (!(await usable(name))) throw Error("Audio validation failed: " + name);
  let all = manifest;
  if (seed) {
    try {
      const previous = JSON.parse(
        await readFile(path.join(directory, "manifest.json"), "utf8"),
      );
      all = { ...previous, ...manifest };
    } catch {}
  }
  const filename = path.join(directory, "manifest.json");
  const prepared = filename + "." + process.pid + ".tmp";
  await writeFile(prepared, JSON.stringify(all));
  await rename(prepared, filename);
  console.log(
    "Created " +
      jobs.length +
      " MP3 files; " +
      Object.keys(all).length +
      " entries in manifest.",
  );
} finally {
  const target = path.resolve(scratch);
  if (
    path.dirname(target) === path.resolve(tmpdir()) &&
    path.basename(target).startsWith("yasi-speech-")
  ) {
    await rm(target, { recursive: true, force: true });
  }
}
