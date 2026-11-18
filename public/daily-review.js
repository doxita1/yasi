import { esc } from "./icons.js";
import { currentStudyDay } from "./exam-desk.js";
import { lexisModules } from "./input-lexis.js";
import { dictationVerdict } from "./input-dictation.js";
import { getState, listDueReviews, saveAttempt, saveReview } from "./sync.js";

const DAY = 86400000;
const iso = () => new Date().toISOString();
export function quickReviewLimit(minutes) {
  const n = Number(minutes);
  return Number.isFinite(n) && n > 0 ? (n <= 20 ? 3 : n <= 40 ? 5 : 8) : 5;
}
function wordCard(card) {
  return (
    !card.problem &&
    (card.blockId === "vocab" ||
      /^input-lexis:|^vocab-w/.test(card.key) ||
      /^(dictation|lexis)\//.test(card.labRoute || ""))
  );
}
function starterCards(day, limit) {
  const week = Math.ceil(day / 6),
    module = lexisModules[(week - 1) % lexisModules.length];
  const shift = Math.floor((week - 1) / lexisModules.length);
  return [1, 3, 8].slice(0, limit === 3 ? 2 : 3).map((i) => {
    const t = module.terms[(i + shift) % module.terms.length];
    return {
      key: "input-lexis:" + t.term,
      word: t.term,
      meaning: t.gloss,
      example: t.example,
      blockId: "vocab",
      topic: module.title,
      week,
      starter: true,
    };
  });
}
function cardSnapshot(card) {
  const {
    key,
    word,
    meaning,
    example,
    category,
    problem,
    labRoute,
    labQuestion,
    labAttempt,
    blockId,
    day,
    topic,
    week,
    starter,
  } = card;
  return {
    key,
    word,
    meaning,
    example,
    category,
    problem,
    labRoute,
    labQuestion,
    labAttempt,
    blockId,
    day,
    topic,
    week,
    starter,
  };
}
function linkToSource(card) {
  const route = String(card.labRoute || "").replace(/^#?\//, "");
  if (route && /^[a-z][a-z0-9-]*(?:\/[A-Za-z0-9%._:-]+)*$/i.test(route)) {
    const suffix =
      Number.isInteger(card.labQuestion) && card.labQuestion >= 0
        ? "/q" +
          (card.labQuestion + 1) +
          (card.labAttempt ? "/" + encodeURIComponent(card.labAttempt) : "")
        : "";
    return "#/" + route + suffix;
  }
  if (
    Number.isInteger(card.day) &&
    card.day >= 1 &&
    card.day <= 156 &&
    ["exam", "work", "grammar", "vocab"].includes(card.blockId)
  )
    return "#/learn/" + card.day + "/" + card.blockId;
  return "";
}
function mask(text, word, required = false) {
  const target = String(word || "").trim();
  if (!target) return "";
  const pieces = target
    .split(/[\s‐‑–—-]+/u)
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(
    "(?<![A-Za-z])" + pieces.join("[\\s‐‑–—-]+") + "(?![A-Za-z])",
    "gi",
  );
  const original = String(text || ""),
    out = original.replace(re, "______");
  // If a sentence cannot be blanked safely, omit the sentence before the learner answers.
  return required && out === original ? "" : out;
}
function dueString(date) {
  return new Date(date).toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function nextReview(value, grade, now) {
  const old = Number(value.quickStreak || 0),
    streak = grade === "again" ? 0 : Math.min(6, old + 1);
  const interval =
    grade === "again"
      ? 10 * 60000
      : (grade === "self" ? [0, 1, 2, 4, 8, 14, 21] : [0, 1, 3, 7, 14, 21, 30])[
          streak
        ] * DAY;
  return { quickStreak: streak, due: new Date(now + interval).toISOString() };
}
function stateTime(ms) {
  return Number.isFinite(Date.parse(ms)) ? Date.parse(ms) : 0;
}
const action = (key, label, green = false) =>
  '<button type="button" data-quick="' +
  key +
  '" class="btn ' +
  (green ? "green" : "") +
  '">' +
  esc(label) +
  "</button>";
function layout(title, sub, body) {
  return (
    '<header class="pageHead"><div><span class="eyebrow">QUICK REVIEW</span><h1>' +
    esc(title) +
    "</h1><p>" +
    esc(sub) +
    '</p></div></header><section class="panel panelBody" style="max-width:780px">' +
    body +
    "</section>"
  );
}
function savedSessions() {
  return Object.entries(getState().attempts || {})
    .filter(([, s]) => s.quickSession && Array.isArray(s.cards))
    .sort((a, b) => stateTime(b[1].updatedAt) - stateTime(a[1].updatedAt));
}
function newlyDue(cap) {
  return listDueReviews()
    .filter(
      (c) =>
        c.key && c.word && !(c.lastQuickEvent && stateTime(c.due) > Date.now()),
    )
    .slice(0, cap)
    .map(cardSnapshot);
}
export function mountQuickReview(container, { minutes } = {}) {
  const cap = quickReviewLimit(
    minutes ?? getState().profile?.dailyMinutes ?? 30,
  );
  let key = null,
    run = null,
    disposed = false,
    resting = false,
    feedback = false,
    seconds = 0,
    lastActive = performance.now();
  const q = (s) => container.querySelector(s);
  function elapsed() {
    const t = performance.now(),
      delta = Math.max(0, Math.min(60, (t - lastActive) / 1000));
    lastActive = t;
    if (!document.hidden && !resting && !run?.completed) seconds += delta;
  }
  function save(p = {}) {
    if (!run || !key) return;
    elapsed();
    run = saveAttempt(key, {
      ...run,
      ...p,
      elapsedSeconds: Math.floor(seconds),
    });
  }
  function setup(cards) {
    const id = crypto.randomUUID();
    key = "quickreview:" + id;
    run = {
      quickSession: true,
      labArea: "quickreview",
      labRoute: "quickreview",
      labTitle: "今日小复习",
      startedAt: iso(),
      completed: false,
      elapsedSeconds: 0,
      budget: cap,
      cards,
      answers: {},
      drafts: {},
      index: 0,
    };
    seconds = 0;
    feedback = false;
    resting = false;
    lastActive = performance.now();
    save();
  }
  function initialise() {
    const pending = savedSessions().find(
      ([, s]) => !s.completed && s.cards.length,
    );
    if (pending) {
      [key, run] = pending;
      seconds = Number(run.elapsedSeconds || 0);
      feedback = !!run.answers?.[run.index]?.submitted;
      return;
    }
    const due = newlyDue(cap);
    if (due.length) {
      setup(due);
      return;
    }
    if (!Object.keys(getState().review || {}).length) {
      setup(starterCards(currentStudyDay(), cap));
      return;
    }
    run = null;
    key = null;
  }
  function card() {
    return run.cards[run.index];
  }
  function response() {
    return run.answers?.[run.index] || {};
  }
  function hint(message) {
    const el = q("[data-quick-note]");
    if (el) el.textContent = message;
  }
  function openEmpty() {
    const future = Object.values(getState().review || {})
      .map((r) => stateTime(r.due))
      .filter((t) => t > Date.now())
      .sort((a, b) => a - b)[0];
    return layout(
      "今日小复习",
      "按真实到期时间取题，每完成一条就保存。",
      '<h2 class="cardTitle">现在没有到期项目</h2><p class="pageNote">' +
        (future
          ? "下一项安排在 " + esc(dueString(future)) + "。"
          : "新做的词汇和错题会加入这里。") +
        '</p><a class="btn" href="#/home">返回学习台</a>',
    );
  }
  function summary() {
    const answers = Object.values(run.answers || {}).filter((a) => a.submitted);
    const words = answers.filter((a) => a.mode === "word"),
      other = answers.filter((a) => a.mode === "reflection");
    return layout(
      run.completed ? "这组复习完成了" : "进度已保存",
      run.completed
        ? "下次复习时间已按每条的实际提交时间安排。"
        : "可以先学到这里，回来时接着原题。",
      '<h2 class="cardTitle">' +
        answers.length +
        " / " +
        run.cards.length +
        ' 项已复习</h2><div class="rowSet">' +
        (words.length
          ? '<p class="pageNote">英文提取 · ' +
            words.filter((a) => a.correct === true).length +
            " / " +
            words.length +
            " 个独立拼写正确</p>"
          : "") +
        (other.length
          ? '<p class="pageNote">错因回忆 · ' +
            other.filter((a) => a.grade === "self").length +
            " / " +
            other.length +
            " 项自评已说清</p>"
          : "") +
        '</div><div style="display:flex;gap:10px;flex-wrap:wrap">' +
        (!run.completed ? action("resume", "继续本组", true) : "") +
        '<a class="btn" href="#/home">返回学习台</a></div>',
    );
  }
  function draw() {
    if (disposed) return;
    if (!run) {
      container.innerHTML = openEmpty();
      return;
    }
    if (run.completed || resting) {
      container.innerHTML = summary();
      return;
    }
    const c = card(),
      isWord = wordCard(c),
      ans = response(),
      draft = run.drafts?.[run.index] || "";
    const reviewed = Object.values(run.answers || {}).filter(
      (a) => a.submitted,
    ).length;
    const source = linkToSource(c);
    let html =
      '<div class="sectionRow"><span class="eyebrow">' +
      (c.starter ? "本周起步词" : "到期复习") +
      " · 第 " +
      (run.index + 1) +
      " / " +
      run.cards.length +
      " 项</span>" +
      action("pause", "先到这里") +
      "</div>";
    if (isWord) {
      const context = mask(c.example, c.word, true),
        gloss = mask(c.meaning, c.word);
      html +=
        '<h2 class="cardTitle">根据意思，写出英文表达</h2><p style="font-size:1.12rem">' +
        esc(gloss || "从情境中回忆对应表达") +
        "</p>" +
        (context
          ? '<blockquote lang="en" style="margin:14px 0;padding:10px 14px;border-left:3px solid var(--line)">' +
            esc(context) +
            "</blockquote>"
          : '<p class="pageNote">' +
            esc(c.topic || "写下这个意思对应的目标词或短语。") +
            "</p>");
    } else {
      html +=
        '<h2 class="cardTitle">回想上次为什么选错</h2><p class="pageNote">' +
        esc(c.category || "专项错题") +
        "</p><p>" +
        esc(c.problem?.prompt || c.word) +
        '</p><p class="pageNote">先写一句依据、被忽略的限制或容易混淆的选项。</p>';
    }
    const revealed =
      feedback || ans.submitted || (!isWord && run.revealedIndex === run.index);
    if (!revealed) {
      html +=
        '<label class="ep-field">' +
        (isWord ? "你的英文答案" : "我的回忆") +
        '<textarea rows="2" data-quick-input maxlength="1600" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="' +
        (isWord ? "Type the expression…" : "先回忆，再对照原来的解析…") +
        '">' +
        esc(draft) +
        '</textarea></label><div class="ep-actions">' +
        action("check", isWord ? "核对答案" : "对照原错因", true) +
        action("unknown", "暂时想不起来") +
        "</div>";
    } else {
      if (isWord) {
        html +=
          '<div class="ep-feedback ' +
          (ans.correct ? "" : "ep-caution") +
          '"><b>' +
          esc(ans.correct ? "拼写正确" : "本次未独立写对") +
          '</b><p>目标表达 <strong lang="en">' +
          esc(c.word) +
          "</strong></p>" +
          (!ans.correct && ans.text
            ? "<p>你的答案：" + esc(ans.text) + "</p>"
            : "") +
          (c.example ? '<p lang="en">' + esc(c.example) + "</p>" : "") +
          "</div>";
      } else {
        html +=
          '<div class="ep-feedback"><b>原题复盘</b><p>' +
          esc(c.meaning || c.problem?.explanation || "") +
          "</p>" +
          (c.example ? '<p lang="en">' + esc(c.example) + "</p>" : "") +
          (draft ? "<p>我的回忆：" + esc(draft) + "</p>" : "") +
          "</div>";
        if (source)
          html +=
            '<p><a class="miniAction" href="' +
            esc(source) +
            '">回到原题查看依据 →</a></p>';
        if (!ans.submitted) {
          html +=
            '<div class="ep-actions">' +
            (draft.trim() ? action("self", "我回忆到了这条依据", true) : "") +
            action("again", "还需要再练") +
            "</div>";
        }
      }
      if (ans.submitted)
        html +=
          '<p class="pageNote">' +
          (!isWord ? "自评已记录 · " : "") +
          "下次复习 " +
          esc(dueString(ans.due)) +
          "</p>" +
          action(
            "next",
            run.index + 1 === run.cards.length ? "完成本组" : "下一项 →",
            true,
          );
    }
    html += '<p role="status" data-quick-note class="pageNote"></p>';
    container.innerHTML = layout(
      "今日小复习",
      "本组 " +
        run.cards.length +
        " 项 · 已完成 " +
        reviewed +
        " 项。可以随时停下。",
      html,
    );
  }
  function commit(grade, text) {
    const c = card(),
      state = getState(),
      stored = state.review?.[c.key] || {},
      event = key + ":" + run.index;
    if (response().submitted) return;
    const when = Date.now(),
      word = wordCard(c);
    const schedule =
      stored.lastQuickEvent === event
        ? { quickStreak: stored.quickStreak, due: stored.due }
        : nextReview(stored, grade, when);
    const answer = {
      mode: word ? "word" : "reflection",
      submitted: true,
      submittedAt: new Date(when).toISOString(),
      text,
      grade,
      due: schedule.due,
    };
    if (word) answer.correct = grade === "hit";
    if (stored.lastQuickEvent !== event) {
      const base = Object.keys(stored).length
        ? {}
        : {
            word: c.word,
            meaning: c.meaning,
            example: c.example || "",
            blockId: c.blockId,
          };
      saveReview(c.key, {
        ...base,
        ...schedule,
        lastQuickEvent: event,
        lastQuickMode: answer.mode,
        lastQuickGrade: grade,
        lastQuickAnswer: text,
        lastReviewedAt: answer.submittedAt,
      });
    }
    save({
      answers: { ...run.answers, [run.index]: answer },
      revealedIndex: null,
    });
    feedback = true;
    draw();
  }
  function click(e) {
    const b = e.target.closest("button[data-quick]");
    if (!b || !container.contains(b) || !run) return;
    const act = b.dataset.quick,
      txt = (run.drafts?.[run.index] || "").trim();
    if (act === "pause") {
      save();
      resting = true;
      draw();
      return;
    }
    if (act === "resume") {
      resting = false;
      lastActive = performance.now();
      draw();
      return;
    }
    if (run.completed) return;
    if (act === "next" && response().submitted) {
      feedback = false;
      if (run.index === run.cards.length - 1)
        save({ completed: true, completedAt: iso(), total: run.cards.length });
      else save({ index: run.index + 1, revealedIndex: null });
      draw();
      q("[data-quick-input]")?.focus();
      return;
    }
    if (response().submitted) return;
    if (act === "check" || act === "unknown") {
      if (act === "check" && !txt) {
        hint("写下你的答案，或点「暂时想不起来」。");
        q("[data-quick-input]")?.focus();
        return;
      }
      if (wordCard(card()))
        commit(
          act === "check" && dictationVerdict(card().word, txt, 1).right
            ? "hit"
            : "again",
          txt,
        );
      else {
        if (act === "unknown" && txt)
          save({ drafts: { ...run.drafts, [run.index]: "" } });
        save({ revealedIndex: run.index });
        feedback = true;
        draw();
      }
    } else if (act === "again" || (act === "self" && txt))
      commit(act === "self" ? "self" : "again", txt);
  }
  function input(e) {
    if (run && !run.completed && e.target.matches("[data-quick-input]"))
      save({ drafts: { ...run.drafts, [run.index]: e.target.value } });
  }
  container.addEventListener("click", click);
  container.addEventListener("input", input);
  initialise();
  draw();
  return () => {
    disposed = true;
    if (run && !run.completed) save();
    container.removeEventListener("click", click);
    container.removeEventListener("input", input);
  };
}
