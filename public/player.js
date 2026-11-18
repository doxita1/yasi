import { getDay } from "./curriculum.js";
import { accountFetch as fetch } from "./account-request.js";
import {
  getState,
  subscribe,
  saveAttempt,
  saveRepeat,
  saveReview,
  listDueReviews,
  saveDraft,
  getDraft,
  putAudio,
  getAudio,
  resolveConflict,
  flushSync,
} from "./sync.js";

const levels = ["看得懂", "听得出", "用得出"];
const label = {
  vocab: "词汇",
  grammar: "语法",
  exam: "雅思专项",
  work: "职场沟通",
};
const skills = {
  listening: "听力",
  reading: "阅读",
  writing: "写作",
  speaking: "口语",
  vocabulary: "词汇",
  grammar: "语法",
  conversation: "交流",
};
let audioManifest;
const textValue = (v) => (v == null ? "" : String(v));
const safe = (v) =>
  textValue(v).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const lines = (v) => safe(v).replace(/\n/g, "<br>");
function clock(seconds) {
  return (
    String(Math.floor(seconds / 60)).padStart(2, "0") +
    ":" +
    String(seconds % 60).padStart(2, "0")
  );
}
const nowISO = () => new Date().toISOString();
const button = (action, title, style = "") =>
  '<button type="button" data-act="' +
  action +
  '" class="ep-btn ' +
  style +
  '">' +
  title +
  "</button>";
function sourceSection(item) {
  if (!item.context || item.audioText === item.context) return "";
  return (
    '<section class="ep-source"><span class="ep-kicker">阅读材料</span><p lang="en">' +
    lines(item.context) +
    "</p></section>"
  );
}
async function audioSource(text) {
  if (!text) return null;
  if (!audioManifest)
    audioManifest = fetch("/audio/manifest.json")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .catch(() => {
        audioManifest = null;
        return {};
      });
  const record = (await audioManifest)[text];
  const path =
    typeof record === "string" ? record : record?.url || record?.file;
  return path ? (path.startsWith("/") ? path : "/audio/" + path) : null;
}
function englishVoice(text, done) {
  if (!("speechSynthesis" in window)) return false;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-GB";
  utterance.rate = 0.93;
  const voices = window.speechSynthesis.getVoices();
  const voice =
    voices.find((v) => v.lang.startsWith("en-GB")) ||
    voices.find((v) => v.lang.startsWith("en"));
  if (voice) utterance.voice = voice;
  utterance.onend = utterance.onerror = done;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  return true;
}
function nextDue(days) {
  const t = new Date();
  t.setDate(t.getDate() + days);
  t.setHours(0, 0, 0, 0);
  return t.toISOString();
}
function updatedWord(key, item, correct, blockId, day, track) {
  if (!key) return;
  const level = levels.includes(item.dimension)
    ? item.dimension
    : { recognition: "看得懂", listening: "听得出", production: "用得出" }[
        item.dimension
      ] ||
      (item.kind !== "choice"
        ? "用得出"
        : item.audioText
          ? "听得出"
          : "看得懂");
  const prev = getState().review[key] || {};
  const tiers = { ...prev.tiers, [level]: correct ? "practised" : "learning" };
  const streak = correct ? Math.min(5, (prev.streak || 0) + 1) : 0;
  saveReview(key, {
    word:
      item.word ||
      item.term ||
      (!/:/.test(String(key)) ? key : null) ||
      item.audioText ||
      item.prompt,
    meaning: item.meaning || prev.meaning || item.explanation || "",
    example: item.example || prev.example || "",
    tiers,
    streak,
    due: nextDue(correct ? [1, 1, 3, 7, 14, 30][streak] : 1),
    day,
    blockId,
    track,
  });
}
function statusText(state) {
  return (
    {
      synced: "已同步到账号",
      pending: "已存本机 · 等待同步",
      offline: "已存本机 · 可重试同步",
      local: "已保存在此浏览器",
      "storage-error": "浏览器未能持久保存",
    }[state.syncStatus] || "已保存"
  );
}
const sharedExam = new Map();
export function isSharedBlock(day, blockId) {
  if (blockId !== "exam") return true;
  if (!sharedExam.has(day)) {
    const sets = ["academic", "general", "undecided"].map((track) =>
      getDay(Number(day), track).blocks.find((b) => b.id === "exam"),
    );
    sharedExam.set(
      day,
      sets.every(
        (b) => b && JSON.stringify(b.items) === JSON.stringify(sets[0].items),
      ),
    );
  }
  return sharedExam.get(day);
}
function reviewItem(original, word, all) {
  const mode = original.dimension || "看得懂",
    target = word.word;
  const alternatives = [
    ...new Set(
      all.map((w) => w.meaning).filter((x) => x && x !== word.meaning),
    ),
  ].slice(0, 3);
  const common = {
    ...original,
    word: target,
    term: target,
    meaning: word.meaning,
    reviewKey: word.key,
    dimension: mode,
    audioText: target,
    context: "",
    example: word.example || "",
    explanation: "复习表达「" + target + "」：" + word.meaning + "。",
  };
  if (mode === "用得出" || alternatives.length === 0)
    return {
      ...common,
      kind: "write",
      audioText: "",
      prompt: "用英语写一句话，表达「" + word.meaning + "」。",
    };
  const options = alternatives.slice(),
    answer = target.length % (options.length + 1);
  options.splice(answer, 0, word.meaning);
  return {
    ...common,
    kind: "choice",
    prompt:
      mode === "听得出"
        ? "听录音，选择词语的意思。"
        : "“" + target + "” 是什么意思？",
    options,
    answer,
  };
}
function adaptVocabulary(items) {
  const due = listDueReviews().filter(
    (w) => w.blockId === "vocab" && w.word && w.meaning,
  );
  const limit = due.length >= 24 ? 1 : due.length >= 12 ? 3 : 6;
  const overrides = {};
  for (let i = limit; i < Math.min(6, items.length); i++) {
    overrides[i] = reviewItem(items[i], due[i - limit], due);
  }
  const deferred = Object.keys(overrides).map((i) => {
    const q = items[i];
    return {
      key: q.reviewKey,
      word: q.word || q.term,
      meaning: q.meaning,
      example: q.example || "",
      tiers: {},
      blockId: "vocab",
    };
  });
  return { overrides, newLimit: limit, backlog: due.length, deferred };
}
export function listDeferredWords() {
  const state = getState(),
    waiting = new Map();
  for (const a of Object.values(state.attempts)) {
    for (const w of a.vocabPlan?.deferred || []) {
      if (!Object.hasOwn(state.review, w.key))
        waiting.set(w.key, { ...w, day: a.day, track: a.track });
    }
  }
  return [...waiting.values()];
}

export function mountPlayer(
  container,
  { day, blockId, track = "undecided", onNavigate, onUpdate } = {},
) {
  const lesson = getDay(Number(day), track),
    block = lesson?.blocks?.find((b) => b.id === blockId);
  if (!block?.items?.length) {
    container.innerHTML =
      '<div class="ep-empty">这节练习暂时无法打开。<a href="#/home">返回今日学习</a></div>';
    return () => {};
  }
  const shared = isSharedBlock(day, blockId);
  const oldShared =
    shared &&
    Object.entries(getState().attempts).find(
      ([, v]) => v.day === Number(day) && v.blockId === blockId,
    );
  const storeTrack = shared ? oldShared?.[1].track || "undecided" : track;
  const key = oldShared?.[0] || storeTrack + ":" + day + ":" + blockId;
  let a = {
    day: Number(day),
    track: storeTrack,
    blockId,
    itemIndex: 0,
    answers: {},
    elapsedSeconds: 0,
    ...getState().attempts[key],
  };
  const vocabPlan =
    blockId === "vocab"
      ? a.vocabPlan ||
        (a.startedAt
          ? { overrides: {}, newLimit: 6 }
          : adaptVocabulary(block.items))
      : null;
  const items = block.items.map((q, i) => vocabPlan?.overrides[i] || q);
  let index = Math.min(Math.max(0, a.itemIndex || 0), items.length - 1);
  let disposed = false,
    done = !!a.completed && !a.activeRepeat,
    running = !done,
    elapsed = a.elapsedSeconds || 0;
  let media = null,
    stream = null,
    recorder = null,
    clipUrl = null,
    capturePending = false,
    isPlaying = false;
  let pass = 0,
    coachCancel = null,
    busyCoach = false,
    speechMessage = "",
    recordedAt = 0,
    recordPending = null,
    lastTick = Date.now(),
    retryChoice = null;
  const nav = (path) => {
    if (onNavigate) onNavigate(path);
    else location.hash = "#" + path;
  };
  const select = (sel) => container.querySelector(sel);
  const response = () => {
    const saved = (a.activeRepeat?.answers || a.answers)?.[index] || {};
    return retryChoice?.index === index
      ? {
          ...saved,
          submitted: false,
          selected: retryChoice.selected,
          correct: null,
        }
      : saved;
  };
  const item = () => items[index];
  const draftKey = () =>
    key + ":" + index + (a.activeRepeat ? ":" + a.activeRepeat.id : "");
  function persist(patch = {}) {
    const latest = getState().attempts[key];
    if (latest) {
      const merged = { ...latest.answers, ...a.answers };
      for (const [i, ans] of Object.entries(latest.answers || {})) {
        const here = merged[i] || {};
        if (
          (ans.submitted && !here.submitted) ||
          (ans.editedAt || ans.submittedAt || "") >
            (here.editedAt || here.submittedAt || "")
        )
          merged[i] = ans;
      }
      if (patch.answers) {
        const changed = Object.entries(patch.answers).filter(
          ([i, v]) => a.answers?.[i] !== v,
        );
        patch.answers = Object.assign(merged, Object.fromEntries(changed));
      }
      a = {
        ...latest,
        ...a,
        answers: merged,
        completed: !!(a.completed || latest.completed),
      };
      elapsed = Math.max(elapsed, latest.elapsedSeconds || 0);
    }
    a = saveAttempt(key, {
      ...a,
      ...patch,
      elapsedSeconds: elapsed,
      itemIndex: index,
    });
  }
  function record(bits, idx = index) {
    if (a.activeRepeat) {
      const round = a.activeRepeat;
      persist({
        activeRepeat: {
          ...round,
          answers: {
            ...round.answers,
            [idx]: { ...round.answers[idx], ...bits, editedAt: nowISO() },
          },
        },
      });
      return;
    }
    const answers = {
      ...a.answers,
      [idx]: { ...a.answers?.[idx], ...bits, editedAt: nowISO() },
    };
    persist({ answers });
  }
  function msg(text) {
    speechMessage = text;
    const el = select("[data-message]");
    if (el) el.textContent = text;
  }
  function stopAudio(remember = true) {
    if (media) {
      if (remember && Number.isFinite(media.currentTime))
        record({ audioPosition: media.currentTime });
      media.pause();
      media.onended = media.onerror = media.ontimeupdate = null;
      media = null;
    }
    if (isPlaying && window.speechSynthesis) window.speechSynthesis.cancel();
    isPlaying = false;
  }
  function releaseClip() {
    if (clipUrl) {
      URL.revokeObjectURL(clipUrl);
      clipUrl = null;
    }
  }
  function finishCapture() {
    if (recorder?.state === "recording") recorder.stop();
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
  }
  const resetMedia = () => {
    pass++;
    stopAudio(false);
    finishCapture();
    releaseClip();
    coachCancel?.abort();
    busyCoach = false;
    speechMessage = "";
    retryChoice = null;
  };
  function finish() {
    const answers = a.activeRepeat?.answers || a.answers;
    const answered = items.map((_, idx) => answers[idx]);
    if (answered.some((ans) => !ans?.submitted)) {
      index = answered.findIndex((ans) => !ans?.submitted);
      render();
      return;
    }
    done = true;
    running = false;
    resetMedia();
    const score = answered.filter(
      (ans) => (ans.firstCorrect ?? ans.correct) === true,
    ).length;
    if (a.activeRepeat) {
      const round = {
        ...a.activeRepeat,
        completedAt: nowISO(),
        correct: score,
        total: items.length,
      };
      persist({
        activeRepeat: null,
        retries: [...(a.retries || []).filter((r) => r.id !== round.id), round],
      });
      saveRepeat(key, round);
    } else
      persist({
        completed: true,
        completedAt: a.completedAt || nowISO(),
        correct: score,
        graded: items.filter((it) => it.kind === "choice").length,
        total: items.length,
      });
    onUpdate?.(getState());
    render();
  }
  function updateClock() {
    const t = Date.now(),
      delta = Math.min(5, Math.floor((t - lastTick) / 1000));
    if (delta > 0) {
      lastTick = t;
      if (running && !done && !document.hidden) elapsed += delta;
    }
    const el = select("[data-time]");
    if (el) el.textContent = clock(elapsed);
    const recEl = select("[data-rec-time]");
    if (recEl && recorder?.state === "recording")
      recEl.textContent = clock(
        Math.max(0, Math.floor((t - recordedAt) / 1000)),
      );
  }
  const timer = setInterval(updateClock, 1000);
  const checkpoint = setInterval(() => {
    if (running && !done && !document.hidden) persist();
  }, 15000);
  function leave() {
    if (!done) {
      stopAudio(true);
      persist();
    }
    finishCapture();
  }
  const hidden = () => {
    if (document.hidden) leave();
    lastTick = Date.now();
  };
  window.addEventListener("pagehide", leave);
  document.addEventListener("visibilitychange", hidden);
  function header() {
    return (
      '<div class="ep-top"><button type="button" class="ep-link" data-act="back">← 第 ' +
      safe(day) +
      ' 天</button><span class="ep-save" data-status>' +
      statusText(getState()) +
      "</span></div>"
    );
  }
  function conflictSection() {
    const cf = getState().conflicts.find((c) => c.key === draftKey());
    if (!cf) return "";
    return (
      '<section class="ep-conflict"><strong>这份草稿有两个版本</strong><p>在两台设备上分别修改过。请选择继续编辑的版本。</p><div class="ep-pair"><div><b>此设备</b><p>' +
      lines(cf.local) +
      "</p></div><div><b>另一设备</b><p>" +
      lines(cf.remote) +
      "</p></div></div>" +
      button("use-local", "保留此设备版本") +
      button("use-remote", "使用另一设备版本") +
      "</section>"
    );
  }
  function threadUI(ans) {
    if (!ans.coach || blockId !== "work" || item().kind !== "speak") return "";
    const transcript = (ans.turns || [])
      .map(
        (t) =>
          '<div class="ep-turn"><b>' +
          (t.role === "user" ? "我" : "同事") +
          "</b><p>" +
          lines(t.text) +
          "</p></div>",
      )
      .join("");
    return (
      '<div class="ep-turns">' +
      transcript +
      '<label class="ep-field">继续回应这位同事<textarea data-reply lang="en" maxlength="3000" placeholder="Reply in English…">' +
      safe(getDraft(draftKey() + ":reply") || "") +
      "</textarea></label>" +
      button("reply", "发送英文回应", "ep-small") +
      "</div>"
    );
  }
  function render() {
    if (disposed) return;
    const q = item(),
      ans = response(),
      chosen = ans.selected,
      checked = !!ans.submitted;
    const skill =
      skills[block.skill] || block.skill || label[blockId] || "专项练习";
    if (done) {
      const last = a.retries?.at(-1);
      container.innerHTML =
        '<main class="ep-wrap">' +
        header() +
        '<section class="ep-complete"><span class="ep-mark">✓</span><div class="ep-kicker">第 ' +
        safe(day) +
        " 天 · " +
        safe(label[blockId]) +
        "</div><h1>这节练习完成了</h1><p>" +
        safe(block.title) +
        '</p><div class="ep-stats"><div><b>' +
        items.length +
        "</b>已完成题目</div><div><b>" +
        clock(elapsed) +
        "</b>累计用时</div><div><b>" +
        (a.graded
          ? (last?.correct ?? a.correct) + " / " + a.graded
          : "已留样") +
        "</b>" +
        (a.graded ? "本轮客观题答对" : "表达练习") +
        "</div></div>" +
        (last
          ? "<p>已完成 " +
            a.retries.length +
            " 轮重练；首次作答保留在回看中。</p>"
          : "") +
        '<div class="ep-actions">' +
        button("back", "查看今日安排", "ep-primary") +
        button("retry-block", "再练一轮") +
        button("inspect", "回看首次作答") +
        "</div></section></main>";
      return;
    }
    const kind = q.kind || "choice";
    const type =
      { choice: "选择题", speak: "口头表达", write: "书面表达" }[kind] ||
      "练习";
    const draft = getDraft(draftKey()) ?? ans.text ?? "";
    const progress = Math.round(((index + 1) * 100) / items.length);
    const choiceMarkup = (q.options || [])
      .map((opt, n) => {
        const selected = chosen === n;
        const klass = checked
          ? n === q.answer
            ? " ep-correct"
            : selected
              ? " ep-wrong"
              : ""
          : selected
            ? " ep-selected"
            : "";
        return (
          '<button type="button" class="ep-option' +
          klass +
          '" data-opt="' +
          n +
          '" aria-pressed="' +
          selected +
          '" ' +
          (checked ? "disabled" : "") +
          "><span>" +
          String.fromCharCode(65 + n) +
          '</span><strong lang="en">' +
          safe(opt) +
          "</strong>" +
          (checked && n === q.answer ? " <i>✓</i>" : "") +
          "</button>"
        );
      })
      .join("");
    const audio = q.audioText
      ? '<section class="ep-listen"><span class="ep-round">♪</span><div><b>听英文材料</b><span data-audio-label>' +
        ((ans.audioPosition || 0) > 1
          ? "可从 " + clock(Math.floor(ans.audioPosition)) + " 继续"
          : "课程合成音频 · 可回放") +
        "</span></div>" +
        button("play", "▶ 播放", "ep-small") +
        button("restart", "从头", "ep-text") +
        "</section>"
      : "";
    const input =
      (kind === "speak"
        ? '<div class="ep-rec"><span class="ep-round">◉</span><div><b>录下你的回答</b><small>可回听、重录，或在下方输入回答。</small></div>' +
          button("record", "开始录音", "ep-small") +
          "</div><div data-clip></div>"
        : "") +
      '<label class="ep-field">' +
      (kind === "speak" ? "回答文字或录音转写" : "你的英文回答") +
      '<textarea data-input lang="en" placeholder="' +
      (kind === "speak"
        ? "写下刚才说的内容，或直接用英文回答…"
        : "Write your response here…") +
      '">' +
      safe(draft) +
      '</textarea></label><div class="ep-input-foot"><span data-wordcount>' +
      draft.trim().split(/\s+/).filter(Boolean).length +
      " 词</span><span>输入时自动保存</span></div>";
    const remarks = checked
      ? '<section class="ep-feedback ' +
        (ans.correct === false ? "ep-caution" : "") +
        '" aria-live="polite"><b>' +
        (kind === "choice"
          ? ans.correct
            ? "✓ 答对了"
            : "需要再看一眼"
          : "✓ 已保存这次表达") +
        "</b><p>" +
        lines(q.explanation || "对照示范，选一个地方改进后再试一次。") +
        "</p>" +
        (q.evidence ? "<small>依据 · " + lines(q.evidence) + "</small>" : "") +
        (q.example
          ? '<details><summary>查看表达示例</summary><p lang="en">' +
            lines(q.example) +
            "</p></details>"
          : "") +
        (q.audioText
          ? '<details><summary>查看听力原文</summary><p lang="en">' +
            lines(q.audioText) +
            "</p></details>"
          : "") +
        "</section>"
      : "";
    const coachButton = kind === "choice" ? "问教练为什么" : "获取 AI 教练反馈";
    container.innerHTML =
      '<main class="ep-wrap">' +
      header() +
      '<div class="ep-heading"><div><span class="ep-kicker">' +
      safe(skill) +
      " · " +
      safe(type) +
      "</span><h1>" +
      safe(block.title) +
      '</h1></div><button type="button" class="ep-clock" data-act="pause" aria-label="' +
      (running ? "暂停计时" : "恢复计时") +
      '">' +
      (running ? "Ⅱ" : "▶") +
      " <time data-time>" +
      clock(elapsed) +
      '</time></button></div><div class="ep-progress"><span style="width:' +
      progress +
      '%"></span></div><div class="ep-counter">第 ' +
      (index + 1) +
      " / " +
      items.length +
      " 题 <span>建议 " +
      safe(block.minutes) +
      ' 分钟</span></div><article class="ep-card">' +
      sourceSection(q) +
      audio +
      '<h2 lang="en">' +
      lines(q.prompt) +
      "</h2>" +
      (kind === "choice"
        ? '<div class="ep-options">' + choiceMarkup + "</div>"
        : input) +
      '<div class="ep-message" data-message role="status">' +
      safe(speechMessage) +
      "</div>" +
      remarks +
      "<div data-conflicts>" +
      conflictSection() +
      '</div><div class="ep-actions">' +
      (checked
        ? button(
            "next",
            index === items.length - 1 ? "完成本节 ✓" : "下一题 →",
            "ep-primary",
          ) + button("coach", coachButton)
        : button(
            "check",
            kind === "choice" ? "核对答案" : "提交这次表达",
            "ep-primary",
          )) +
      (index > 0 ? button("prev", "上一题", "ep-text") : "") +
      '</div><section class="ep-coach" data-coach ' +
      (ans.coach ? "" : "hidden") +
      ">" +
      lines(ans.coach || "") +
      '</section></article><div class="ep-bottom"><span>第 ' +
      safe(day) +
      " 天 · " +
      safe(label[blockId]) +
      "</span>" +
      button("sync", "同步进度", "ep-text") +
      "</div></main>";
    if (vocabPlan?.newLimit < 6) {
      select(".ep-counter")?.insertAdjacentHTML(
        "afterend",
        '<p class="ep-adapt">本节 ' +
          vocabPlan.newLimit +
          " 个新词，" +
          (6 - vocabPlan.newLimit) +
          " 个到期词。其余新词保存在复习本的「待补学」中。</p>",
      );
    }
    if (checked && kind === "choice" && ans.correct === false) {
      select(".ep-actions")?.insertAdjacentHTML(
        "beforeend",
        button("retry-one", "重练本题", "ep-text"),
      );
    }
    if (kind === "speak" && blockId === "work") {
      const coachBtn = select('[data-act="coach"]');
      if (coachBtn)
        coachBtn.textContent = ans.coach ? "重新开始对话" : "和 AI 同事对练";
      select("[data-coach]")?.insertAdjacentHTML("beforeend", threadUI(ans));
    }
    if (kind === "speak" && ans.blobKey) void showClip(ans.blobKey, pass);
  }
  async function showClip(id, token) {
    const blob = await getAudio(id);
    if (disposed || token !== pass || !select("[data-clip]")) return;
    releaseClip();
    const el = select("[data-clip]");
    if (blob) {
      clipUrl = URL.createObjectURL(blob);
      el.innerHTML =
        '<div class="ep-playback"><span>我的录音</span><audio controls preload="metadata"></audio></div>';
      el.querySelector("audio").src = clipUrl;
    } else {
      el.innerHTML = "<small>这段录音尚未下载，可联网后重新打开。</small>";
    }
  }
  async function play(restart) {
    const token = pass,
      q = item();
    if (media && !restart && !media.paused) {
      stopAudio(true);
      const b = select('[data-act="play"]');
      if (b) b.textContent = "▶ 继续";
      return;
    }
    stopAudio(false);
    if (restart) record({ audioPosition: 0 });
    const url = await audioSource(q.audioText);
    if (disposed || pass !== token) return;
    const badge = select("[data-audio-label]"),
      b = select('[data-act="play"]');
    const fallback = () => {
      if (disposed || pass !== token) return;
      isPlaying = true;
      const ok = englishVoice(q.audioText, () => {
        if (pass === token && b) b.textContent = "▶ 重听";
      });
      if (b) b.textContent = ok ? "播放中" : "▶ 播放";
      if (badge) badge.textContent = ok ? "设备合成发音" : "此设备无法播放语音";
      if (!ok) msg("暂时无法播放。可展开听力原文学习。");
      if (!ok && !container.querySelector("[data-fallback-text]")) {
        const k = document.createElement("details");
        k.dataset.fallbackText = "yes";
        k.innerHTML =
          '<summary>查看听力原文</summary><p lang="en">' +
          lines(q.audioText) +
          "</p>";
        select(".ep-listen")?.after(k);
      }
    };
    if (!url) {
      fallback();
      return;
    }
    media = new Audio(url);
    const audio = media;
    audio.addEventListener(
      "loadedmetadata",
      () => {
        if (pass !== token) return;
        try {
          audio.currentTime = Math.min(
            restart ? 0 : response().audioPosition || 0,
            Math.max(0, audio.duration - 0.3),
          );
        } catch {}
      },
      { once: true },
    );
    let lastSaved = 0;
    audio.ontimeupdate = () => {
      if (pass !== token) return;
      if (badge)
        badge.textContent =
          clock(Math.floor(audio.currentTime)) +
          " / " +
          (Number.isFinite(audio.duration)
            ? clock(Math.floor(audio.duration))
            : "…");
      if (audio.currentTime - lastSaved >= 5) {
        lastSaved = audio.currentTime;
        record({ audioPosition: audio.currentTime });
      }
    };
    audio.onended = () => {
      if (pass === token) {
        record({ audioPosition: 0 });
        if (b) b.textContent = "▶ 重听";
      }
    };
    try {
      await audio.play();
      if (pass === token && b) b.textContent = "Ⅱ 暂停";
    } catch {
      if (pass === token) {
        media = null;
        fallback();
      }
    }
  }
  function captureError(e) {
    msg(
      e?.name === "NotAllowedError"
        ? "麦克风权限未开启。允许麦克风后可重试，也可以输入英文回答。"
        : "录音暂时不可用，可检查麦克风或输入回答。",
    );
  }
  async function capture() {
    if (recorder?.state === "recording") {
      finishCapture();
      return;
    }
    if (capturePending) return;
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      captureError();
      return;
    }
    const token = pass,
      idx = index;
    capturePending = true;
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (disposed || pass !== token) {
        s.getTracks().forEach((t) => t.stop());
        return;
      }
      stopAudio(true);
      stream = s;
      const supported = [
        "audio/webm;codecs=opus",
        "audio/mp4",
        "audio/ogg;codecs=opus",
      ].find((t) => MediaRecorder.isTypeSupported(t));
      const rec = new MediaRecorder(
        s,
        supported ? { mimeType: supported } : undefined,
      );
      recorder = rec;
      const chunks = [];
      recordedAt = Date.now();
      rec.ondataavailable = (e) => {
        if (e.data?.size) chunks.push(e.data);
      };
      rec.onerror = () => captureError();
      rec.onstop = async () => {
        const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
        s.getTracks().forEach((t) => t.stop());
        if (recorder === rec) recorder = null;
        if (!blob.size) {
          if (!disposed) msg("未采集到声音，请重新录音。");
          return;
        }
        const id = crypto.randomUUID();
        const saving = putAudio(id, blob);
        recordPending = saving;
        try {
          await saving;
          if (recordPending === saving) recordPending = null;
          record({ blobKey: id, recorded: true }, idx);
          if (!disposed && token === pass) {
            render();
            msg("录音已保存，可以回听。");
          }
        } catch (err) {
          recordPending = null;
          record({ blobKey: id, recorded: true }, idx);
          if (!disposed && token === pass) {
            render();
            msg(err.message);
          }
        }
      };
      rec.start(500);
      const el = select('[data-act="record"]');
      if (el) el.innerHTML = "■ 停止 <span data-rec-time>00:00</span>";
    } catch (err) {
      stream?.getTracks().forEach((t) => t.stop());
      stream = null;
      captureError(err);
    } finally {
      capturePending = false;
    }
  }
  async function coach(reply = false) {
    if (busyCoach) return;
    const q = item(),
      ans = response(),
      initial =
        q.kind === "choice"
          ? q.options?.[ans.selected] || ""
          : getDraft(draftKey()) || ans.text || "";
    const input = reply
      ? (select("[data-reply]")?.value || "").trim()
      : initial;
    if (!input) {
      msg("先补上实际说出的英文，教练可以针对文字给建议。");
      return;
    }
    const pane = select("[data-coach]");
    if (!pane) return;
    const token = pass,
      ctrl = new AbortController();
    coachCancel = ctrl;
    busyCoach = true;
    pane.hidden = false;
    if (!reply) pane.textContent = "教练正在阅读你的作答…";
    else msg("正在等待同事回应…");
    const timerId = setTimeout(() => ctrl.abort(), 60000);
    try {
      const task =
        q.kind === "write"
          ? "writing"
          : q.kind === "speak"
            ? blockId === "work"
              ? "conversation"
              : "speaking"
            : blockId === "grammar"
              ? "grammar"
              : "vocabulary";
      const history = reply
        ? [
            initial,
            ans.coach,
            ...(ans.turns || []).slice(-10).map((t) => t.role + ": " + t.text),
          ].join("\n")
        : "";
      const context = [q.prompt, q.context, q.audioText, q.explanation, history]
        .filter(Boolean)
        .join("\n")
        .slice(-17900);
      const r = await fetch("/api/coach", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({
          task,
          input,
          context,
          depth:
            context.length + input.length > 2000 || task === "writing"
              ? "deep"
              : "fast",
        }),
      });
      const result = await r.json().catch(() => ({}));
      if (!r.ok)
        throw Object.assign(
          new Error(result.message || result.error || String(r.status)),
          { status: r.status },
        );
      if (disposed || pass !== token) return;
      const feedback = result.text;
      if (!feedback) throw new Error("教练没有返回可读反馈。");
      if (reply) {
        record({
          turns: [
            ...(ans.turns || []),
            { role: "user", text: input },
            { role: "assistant", text: feedback },
          ],
        });
        saveDraft(draftKey() + ":reply", "");
      } else record({ coach: feedback, turns: [] });
      msg("");
      render();
    } catch (err) {
      if (!disposed && token === pass) {
        const note =
          err.status === 401
            ? "登录后可以使用 AI 教练。"
            : [400, 409, 503, 403].includes(err.status)
              ? "教练暂不可用。请在模型设置中确认密钥和模型，或先参考本题解析。"
              : "本次反馈未能返回。你的作答已保存，可以重试。";
        if (reply) msg(note);
        else pane.textContent = note;
      }
    } finally {
      clearTimeout(timerId);
      busyCoach = false;
    }
  }
  function submit() {
    const q = item(),
      ans = response(),
      draft = getDraft(draftKey()) ?? ans.text ?? "";
    if (recorder?.state === "recording") {
      finishCapture();
      msg("正在保存录音，请稍后提交。");
      return;
    }
    if (recordPending || capturePending) {
      msg("正在保存录音，请稍后提交。");
      return;
    }
    if (q.kind === "choice" && !Number.isInteger(ans.selected)) {
      msg("先选一个答案。");
      return;
    }
    if (q.kind !== "choice" && !draft.trim() && !ans.blobKey) {
      msg("先录下或写下你的英文回答。");
      return;
    }
    const correct = q.kind === "choice" ? ans.selected === q.answer : null;
    retryChoice = null;
    const at = nowISO(),
      submission = {
        id: crypto.randomUUID(),
        at,
        selected: ans.selected,
        text: draft,
        correct,
        blobKey: ans.blobKey,
      };
    record({
      selected: ans.selected,
      text: draft,
      correct,
      firstCorrect: ans.firstCorrect ?? correct,
      submitted: true,
      submittedAt: at,
      history: [...(ans.history || []), submission],
    });
    if (!ans.submitted && q.reviewKey && blockId === "vocab")
      updatedWord(
        q.reviewKey,
        q,
        correct === true,
        blockId,
        Number(day),
        track,
      );
    if (q.kind === "choice" && blockId !== "vocab" && correct === false) {
      const reviewKey = q.reviewKey || "error:" + key + ":" + index;
      saveReview(reviewKey, {
        word: q.prompt,
        meaning: label[blockId] + " · " + block.title,
        problem: q,
        day: Number(day),
        track,
        blockId,
        due: nextDue(1),
        streak: 0,
        tiers: { 掌握: "learning" },
      });
    }
    stopAudio(false);
    render();
  }
  function goto(n) {
    if (n < 0 || n >= items.length) return;
    stopAudio(true);
    resetMedia();
    index = n;
    persist();
    render();
  }
  function onClick(e) {
    const target = e.target.closest("button");
    if (!target || !container.contains(target)) return;
    if (target.hasAttribute("data-opt")) {
      if (response().submitted) return;
      const chosen = Number(target.dataset.opt);
      if (retryChoice?.index === index) retryChoice.selected = chosen;
      else record({ selected: chosen });
      for (const b of container.querySelectorAll("[data-opt]")) {
        const selected = b === target;
        b.classList.toggle("ep-selected", selected);
        b.setAttribute("aria-pressed", selected);
      }
      msg("");
      return;
    }
    switch (target.dataset.act) {
      case "back":
        nav("/day/" + day);
        break;
      case "pause":
        updateClock();
        running = !running;
        persist();
        target.innerHTML =
          (running ? "Ⅱ" : "▶") +
          " <time data-time>" +
          clock(elapsed) +
          "</time>";
        target.setAttribute("aria-label", running ? "暂停计时" : "恢复计时");
        break;
      case "play":
        void play(false);
        break;
      case "restart":
        void play(true);
        break;
      case "record":
        void capture();
        break;
      case "coach":
        void coach();
        break;
      case "reply":
        void coach(true);
        break;
      case "retry-one":
        retryChoice = { index, selected: null };
        render();
        break;
      case "retry-block":
        resetMedia();
        index = 0;
        done = false;
        running = true;
        lastTick = Date.now();
        persist({
          activeRepeat: {
            id: crypto.randomUUID(),
            startedAt: nowISO(),
            answers: {},
          },
        });
        render();
        break;
      case "next":
        if (index === items.length - 1) finish();
        else goto(index + 1);
        break;
      case "prev":
        goto(index - 1);
        break;
      case "check":
        submit();
        break;
      case "inspect":
        done = false;
        running = false;
        index = 0;
        render();
        break;
      case "use-local":
      case "use-remote": {
        const c = getState().conflicts.find((x) => x.key === draftKey());
        if (c)
          resolveConflict(
            c.id,
            target.dataset.act === "use-local" ? "local" : "remote",
          );
        render();
        break;
      }
      case "sync":
        void flushSync().then((ok) =>
          msg(ok ? "已同步。" : "当前保存在此浏览器，联网并登录后可同步。"),
        );
        break;
    }
  }
  function onInput(e) {
    if (e.target.matches("[data-reply]")) {
      saveDraft(draftKey() + ":reply", e.target.value);
      return;
    }
    if (!e.target.matches("[data-input]")) return;
    const text = e.target.value;
    saveDraft(draftKey(), text);
    const tally = select("[data-wordcount]");
    if (tally)
      tally.textContent =
        text.trim().split(/\s+/).filter(Boolean).length + " 词";
    if (response().submitted) {
      record({ text });
    }
  }
  container.addEventListener("click", onClick);
  container.addEventListener("input", onInput);
  let lastConflicts = "";
  const unsub = subscribe((state) => {
    const el = select("[data-status]");
    if (el) el.textContent = statusText(state);
    const identity = state.conflicts.map((c) => c.id).join("|");
    if (identity !== lastConflicts) {
      lastConflicts = identity;
      const dest = select("[data-conflicts]");
      if (dest) dest.innerHTML = conflictSection();
    }
  });
  if (!a.startedAt)
    persist({ startedAt: nowISO(), ...(vocabPlan ? { vocabPlan } : {}) });
  render();
  return () => {
    if (disposed) return;
    stopAudio(true);
    disposed = true;
    pass++;
    finishCapture();
    releaseClip();
    coachCancel?.abort();
    if (!done) persist();
    unsub();
    clearInterval(timer);
    clearInterval(checkpoint);
    window.removeEventListener("pagehide", leave);
    document.removeEventListener("visibilitychange", hidden);
    container.removeEventListener("click", onClick);
    container.removeEventListener("input", onInput);
  };
}

export function mountReview(container, { onNavigate, onUpdate } = {}) {
  let filter = "due",
    target = null,
    tier = "看得懂",
    revealed = false,
    typed = "",
    query = "",
    disposed = false,
    player = null,
    playId = 0,
    reviewSelection = null;
  function entries() {
    if (filter === "deferred") return listDeferredWords();
    return filter === "due"
      ? listDueReviews().filter((x) => !x.labRoute)
      : Object.entries(getState().review)
          .filter(([, x]) => !x.labRoute)
          .map(([key, v]) => ({ ...v, key }))
          .sort((a, b) =>
            String(a.due || "").localeCompare(String(b.due || "")),
          );
  }
  const findTarget = () =>
    getState().review[target] ||
    listDeferredWords().find((v) => v.key === target);
  function drawContent() {
    if (disposed) return;
    const words = entries().filter(
      (w) =>
        !query ||
        [w.word, w.meaning].some((v) =>
          String(v || "")
            .toLowerCase()
            .includes(query.toLowerCase()),
        ),
    );
    const total = Object.values(getState().review).filter(
        (x) => !x.labRoute,
      ).length,
      due = listDueReviews().filter((x) => !x.labRoute).length;
    if (target) {
      const w = findTarget();
      if (!w) {
        target = null;
        draw();
        return;
      }
      if (w.problem) {
        const q = w.problem;
        container.innerHTML =
          '<main class="ep-wrap"><button data-act="return" class="ep-link">← 返回复习本</button><div class="ep-heading"><div class="ep-kicker">第 ' +
          safe(w.day) +
          " 天 · " +
          safe(label[w.blockId]) +
          '</div></div><section class="ep-card">' +
          sourceSection(q) +
          (q.audioText ? button("hear", "▶ 听题", "ep-small") : "") +
          "<h2>" +
          lines(q.prompt) +
          '</h2><div class="ep-options">' +
          q.options
            .map(
              (o, i) =>
                '<button type="button" class="ep-option ' +
                (revealed && i === q.answer
                  ? "ep-correct"
                  : reviewSelection === i
                    ? "ep-selected"
                    : "") +
                '" data-review-opt="' +
                i +
                '" ' +
                (revealed ? "disabled" : "") +
                "><span>" +
                String.fromCharCode(65 + i) +
                "</span><strong>" +
                safe(o) +
                "</strong></button>",
            )
            .join("") +
          '</div><p data-message class="ep-message" role="status"></p>' +
          (revealed
            ? '<div class="ep-feedback"><b>' +
              (reviewSelection === q.answer ? "这次答对了" : "再看一下依据") +
              "</b><p>" +
              lines(q.explanation) +
              '</p></div><div class="ep-actions">' +
              button("finish-error", "保存复习结果", "ep-primary") +
              "</div>"
            : '<div class="ep-actions">' +
              button("grade-error", "核对错题", "ep-primary") +
              "</div>") +
          "</section></main>";
        return;
      }
      const audition = tier === "听得出",
        production = tier === "用得出";
      const focus = audition
        ? "听后说出含义"
        : production
          ? w.meaning || "用本轮短语造句"
          : w.word;
      container.innerHTML =
        '<main class="ep-wrap">' +
        '<button data-act="return" class="ep-link">← 返回词库</button><div class="ep-heading"><div><span class="ep-kicker">间隔复习</span><h1>词汇回想</h1></div></div>' +
        '<section class="ep-card"><div class="ep-segments">' +
        levels
          .map(
            (l) =>
              '<button type="button" data-tier="' +
              l +
              '" aria-pressed="' +
              (tier === l) +
              '">' +
              l +
              "</button>",
          )
          .join("") +
        "</div>" +
        "<h2>" +
        safe(focus) +
        '</h2><p class="ep-muted">' +
        (audition
          ? "不看拼写，先听词组，再回忆意思。"
          : production
            ? "用这个词或短语写一句完整的工作场景英文。"
            : "先回想中文意思，再对照释义。") +
        "</p>" +
        (audition ? button("hear", "▶ 听发音", "ep-small") : "") +
        '<label class="ep-field">我的回答<textarea data-review-input placeholder="' +
        (production ? "Write a sentence…" : "输入你记得的意思…") +
        '">' +
        safe(typed) +
        "</textarea></label>" +
        '<div role="status" class="ep-message" data-message></div>' +
        (revealed
          ? '<div class="ep-feedback"><b>' +
            safe(w.word) +
            "</b><p>" +
            safe(w.meaning || "") +
            "</p>" +
            (w.example ? '<p lang="en">' + safe(w.example) + "</p>" : "") +
            '</div><div class="ep-actions">' +
            button("remember", "独立答出", "ep-primary") +
            button("again", "需要再练") +
            "</div>"
          : '<div class="ep-actions">' +
            button("reveal", "对照答案", "ep-primary") +
            "</div>") +
        "</section></main>";
      return;
    }
    container.innerHTML =
      '<main class="ep-wrap ep-library"><div class="ep-heading"><div><span class="ep-kicker">REVIEW NOTEBOOK</span><h1>我的复习本</h1><p class="ep-muted">复习到期词汇，重新挑战做错的题。</p></div></div><section class="ep-card"><div class="ep-list-head"><div class="ep-segments"><button type="button" data-filter="due" aria-pressed="' +
      (filter === "due") +
      '">到期复习 ' +
      due +
      '</button><button type="button" data-filter="all" aria-pressed="' +
      (filter === "all") +
      '">全部项目 ' +
      total +
      '</button></div><input class="ep-search" aria-label="搜索复习词" placeholder="搜索词语或错题" data-search value="' +
      safe(query) +
      '"></div><div class="ep-wordlist">' +
      (words.length
        ? words
            .map((w) => {
              const mastered = Object.entries(w.tiers || {})
                .filter(([, v]) => v === "practised")
                .map(([l]) => l);
              const next =
                w.due && Number.isFinite(Date.parse(w.due))
                  ? new Date(w.due).toLocaleDateString("zh-CN", {
                      month: "short",
                      day: "numeric",
                    })
                  : "今天";
              return (
                '<button class="ep-word" type="button" data-key="' +
                safe(w.key) +
                '"><span><strong lang="en">' +
                safe(w.word) +
                "</strong><small>" +
                safe(w.meaning || "") +
                '</small></span><span class="ep-word-meta">' +
                safe(mastered.join(" · ") || "待练习") +
                "<small>" +
                safe(next) +
                " 复习 →</small></span></button>"
              );
            })
            .join("")
        : '<div class="ep-empty"><span class="ep-mark">✓</span><h2>' +
          (query
            ? "没有匹配的词语"
            : total
              ? "今天的到期词已复习完"
              : "你的复习题会收在这里") +
          "</h2><p>" +
          (query
            ? "换一个英文短语或中文关键词。"
            : total
              ? "也可以切换到全部项目，提前练习。"
              : "完成词汇练习或答错专项题目后，可以在这里复习。") +
          "</p>" +
          (!query ? button("home", "回到今日学习", "ep-small") : "") +
          "</div>") +
      "</div></section></main>";
  }
  function stop() {
    playId++;
    player?.pause();
    player = null;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }
  function draw() {
    drawContent();
    if (disposed || target) return;
    const deferred = listDeferredWords();
    if (deferred.length || filter === "deferred") {
      container
        .querySelector(".ep-list-head .ep-segments")
        ?.insertAdjacentHTML(
          "beforeend",
          '<button type="button" data-filter="deferred" aria-pressed="' +
            (filter === "deferred") +
            '">待补学 ' +
            deferred.length +
            "</button>",
        );
    }
  }
  async function hear() {
    const w = findTarget(),
      text = w?.problem?.audioText || w?.word;
    if (!text) return;
    stop();
    const id = playId,
      url = await audioSource(text);
    if (disposed || id !== playId) return;
    const t = container.querySelector("[data-message]");
    const fallback = () => {
      const ok = englishVoice(text, () => {});
      if (t)
        t.textContent = ok
          ? "正在用设备英语语音朗读。"
          : "设备暂时没有英语语音。";
    };
    if (url) {
      player = new Audio(url);
      try {
        await player.play();
      } catch {
        if (id === playId) fallback();
      }
    } else fallback();
  }
  function click(e) {
    const b = e.target.closest("button");
    if (!b || !container.contains(b)) return;
    if (b.dataset.filter) {
      filter = b.dataset.filter;
      draw();
      return;
    }
    if (b.dataset.key) {
      target = b.dataset.key;
      const w = findTarget();
      tier =
        levels.find((l) => w?.tiers?.[l] !== "practised") ||
        levels[(w.streak || 0) % 3];
      typed = "";
      revealed = false;
      reviewSelection = null;
      draw();
      return;
    }
    if (b.hasAttribute("data-review-opt")) {
      reviewSelection = Number(b.dataset.reviewOpt);
      draw();
      return;
    }
    if (b.dataset.tier) {
      stop();
      tier = b.dataset.tier;
      typed = "";
      revealed = false;
      draw();
      return;
    }
    switch (b.dataset.act) {
      case "return":
        stop();
        target = null;
        draw();
        break;
      case "home":
        if (onNavigate) onNavigate("/home");
        else location.hash = "#/home";
        break;
      case "hear":
        void hear();
        break;
      case "grade-error":
        if (reviewSelection === null) {
          container.querySelector("[data-message]").textContent =
            "先选一个答案。";
        } else {
          revealed = true;
          draw();
        }
        break;
      case "finish-error": {
        const w = getState().review[target],
          correct = reviewSelection === w.problem.answer,
          streak = correct ? Math.min(5, (w.streak || 0) + 1) : 0;
        saveReview(target, {
          streak,
          tiers: { 掌握: correct ? "practised" : "learning" },
          due: nextDue(correct ? [1, 3, 7, 14, 21, 30][streak] : 1),
          lastReviewedAt: nowISO(),
        });
        stop();
        target = null;
        onUpdate?.(getState());
        draw();
        break;
      }
      case "reveal":
        revealed = true;
        draw();
        break;
      case "remember":
      case "again": {
        const correct = b.dataset.act === "remember",
          w = findTarget();
        if (correct && !typed.trim()) {
          container.querySelector("[data-message]").textContent =
            "先写下自己的回答，再记录复习结果。";
          break;
        }
        const streak = correct ? Math.min(5, (w.streak || 0) + 1) : 0;
        saveReview(target, {
          ...w,
          tiers: { ...w.tiers, [tier]: correct ? "practised" : "learning" },
          streak,
          due: nextDue(correct ? [1, 1, 3, 7, 14, 30][streak] : 1),
          lastAnswer: typed,
          lastReviewedAt: nowISO(),
        });
        stop();
        target = null;
        onUpdate?.(getState());
        draw();
        break;
      }
    }
  }
  function input(e) {
    if (e.target.matches("[data-review-input]")) typed = e.target.value;
    if (e.target.matches("[data-search]")) {
      query = e.target.value;
      const before = e.target.selectionStart;
      draw();
      const after = container.querySelector("[data-search]");
      after?.focus();
      after?.setSelectionRange(before, before);
    }
  }
  container.addEventListener("click", click);
  container.addEventListener("input", input);
  draw();
  return () => {
    disposed = true;
    stop();
    container.removeEventListener("click", click);
    container.removeEventListener("input", input);
  };
}
