import { headwordTopics } from "./core-headwords.js";
import { dictationCards, dictationVerdict } from "./input-dictation.js";
import { weekTitles } from "./curriculum.js";
import { lexisModules } from "./input-lexis.js";

export const modes = ["meaning", "recall", "audio"];
export const modeLabels = {
  meaning: "语境辨义",
  recall: "闭卷提取",
  audio: "盲听拼写",
};
export const dimensions = {
  meaning: "看得懂",
  recall: "用得出",
  audio: "听得出",
};
export const topics = [],
  bank = [],
  byId = new Map();
const canonical = new Map();
const norm = (t) => t.toLowerCase().trim().replace(/\s+/g, " ");
function append(id, title, kind, focus, terms) {
  const words = [];
  for (const data of terms) {
    let c = canonical.get(norm(data.term));
    if (!c) {
      c = {
        ...data,
        id:
          "w-" +
          data.term
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/-$/, ""),
        topic: id,
        index: bank.length,
        reviewKeys: [],
      };
      if (byId.has(c.id)) throw Error("Duplicate word identifier " + c.id);
      bank.push(c);
      byId.set(c.id, c);
      canonical.set(norm(c.term), c);
    }
    if (!c.reviewKeys.includes(data.reviewKey))
      c.reviewKeys.push(data.reviewKey);
    if (!words.includes(c.id)) words.push(c.id);
  }
  topics.push({ id, title, kind, focus, words });
}
for (const t of headwordTopics)
  append(
    t.id,
    t.title,
    "词头",
    t.focus,
    t.rows.map((w) => ({
      ...w,
      reviewKey: "core:" + w.term,
      url: "/core-audio/" + w.term + ".wav",
    })),
  );
for (const [i, t] of lexisModules.entries())
  append(
    "academic-" + (i + 1),
    t.title,
    "学术搭配",
    t.focus,
    dictationCards(i + 27).map((w, j) => ({ ...w, ...t.terms[j] })),
  );
for (const [i, title] of weekTitles.entries())
  append(
    "week-" + (i + 1),
    title,
    "场景表达",
    "日常生活、学习与职场情境",
    Array.from({ length: 6 }, (_, j) => dictationCards(i + 1, j + 1)).flat(),
  );
export const findTopic = (id) => topics.find((t) => t.id === id);

export async function audioUrl(word) {
  if (word.url) return word.url;
  audioMap ??= fetch("/audio/manifest.json")
    .then((r) => {
      if (!r.ok) throw Error();
      return r.json();
    })
    .catch((e) => {
      audioMap = null;
      throw e;
    });
  const name = (await audioMap)[word.term];
  if (!name) throw Error("audio missing");
  return "/audio/" + name;
}
let audioMap;
export function maskedSentence(word) {
  if (word.gap?.includes("____")) return word.gap;
  const escaped = word.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp("(?<![a-z])" + escaped + "(?![a-z])", "gi");
  return re.test(word.example || "") ? word.example.replace(re, "____") : "";
}
function stateFor(word, review) {
  return word.reviewKeys
    .map((k) => review[k])
    .filter(Boolean)
    .sort((a, b) => String(b.updatedAt || "").localeCompare(a.updatedAt || ""));
}
export function latestReview(word, review) {
  return stateFor(word, review)[0] || {};
}
function legacyMiss(r) {
  if (r.lastQuickGrade === "again") return "recall";
  if (r.lastDictation && !["一次听准", "重听后正确"].includes(r.lastDictation))
    return "audio";
  if (r.labRoute?.startsWith("lexis/") && r.streak === 0) return "meaning";
  if (
    r.blockId === "vocab" &&
    r.streak === 0 &&
    r.tiers &&
    !r.corePractice &&
    !r.lastDictation &&
    !r.lastQuickEvent
  )
    return modes.find((m) => r.tiers[dimensions[m]] === "learning");
}
export function wordStatus(word, review) {
  const rows = stateFor(word, review),
    core = rows.find((r) => r.corePractice)?.corePractice;
  const open = new Set(core?.open || []);
  let ever = Boolean(core?.misses);
  for (const key of word.reviewKeys) {
    const row = review[key];
    if (!row) continue;
    const miss = legacyMiss(row);
    if (!miss) continue;
    ever = true;
    if (!core || core.seenLegacy?.[key] !== legacySignature(row))
      open.add(miss);
  }
  return {
    core,
    open: [...open],
    ever,
    due: rows[0]?.due,
    attempted: core?.total || 0,
  };
}
// Legacy drills keep their last wrong answer even after a different drill is taken.
// Snapshot those markers so a corrected word stays corrected until a new error occurs.
function legacySignature(row) {
  return JSON.stringify([
    legacyMiss(row),
    row.lastQuickEvent,
    row.lastDictation,
    row.lastSpelling,
    row.labAttempt,
    row.labQuestion,
    row.streak,
  ]);
}
export function seenLegacy(word, review, key, next) {
  return Object.fromEntries(
    word.reviewKeys
      .filter((k) => k === key || review[k])
      .map((k) => [k, legacySignature(k === key ? next : review[k])]),
  );
}
export function optionsFor(word, salt) {
  const peers = findTopic(word.topic)
    .words.map((k) => byId.get(k))
    .filter((w) => w.gloss !== word.gloss);
  const shift = (word.index + salt) % peers.length,
    wrong = [];
  for (let j = 0; j < peers.length && wrong.length < 3; j++) {
    const v = peers[(j + shift) % peers.length].gloss;
    if (!wrong.includes(v)) wrong.push(v);
  }
  wrong.splice((word.index + salt) % 4, 0, word.gloss);
  return wrong;
}
const variants = (t) =>
  String(t || "").replace(/\benrollment\b/gi, "enrolment");
export function checkAnswer(word, mode, answer, plays) {
  if (mode === "meaning")
    return {
      right: answer === word.gloss,
      label: answer === word.gloss ? "释义准确" : "语境辨义",
    };
  const result = dictationVerdict(variants(word.term), variants(answer), plays);
  return {
    right: result.right,
    label:
      mode === "audio"
        ? result.type
        : result.right
          ? "提取正确"
          : !answer
            ? "未想起"
            : result.type,
  };
}
export function selectWords(scope, review, limit = 3) {
  let ids;
  if (scope === "errors" || scope === "due") {
    const now = Date.now();
    ids = bank
      .filter((w) => {
        const s = wordStatus(w, review);
        return scope === "errors"
          ? s.open.length
          : s.due && Date.parse(s.due) <= now;
      })
      .sort(
        (a, b) =>
          (Date.parse(wordStatus(a, review).due) || 0) -
          (Date.parse(wordStatus(b, review).due) || 0),
      )
      .map((w) => w.id);
  } else {
    ids = findTopic(scope)?.words || [...(byId.has(scope) ? [scope] : [])];
    ids = [...ids].sort((a, b) => {
      const x = wordStatus(byId.get(a), review),
        y = wordStatus(byId.get(b), review);
      return (
        x.attempted - y.attempted ||
        String(x.core?.at || "").localeCompare(y.core?.at || "")
      );
    });
  }
  return ids.slice(0, limit);
}
export function sequence(scope, ids, review) {
  if (scope === "errors")
    return ids.flatMap((id) =>
      wordStatus(byId.get(id), review).open.map((mode) => ({ id, mode })),
    );
  return modes.flatMap((mode) => ids.map((id) => ({ id, mode })));
}
