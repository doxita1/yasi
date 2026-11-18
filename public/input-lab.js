import { listeningSets } from "./input-listening.js";
import { lexisModules } from "./input-lexis.js";
import {
  getState,
  saveAttempt,
  saveReview,
  saveDraft,
  getDraft,
} from "./sync.js";
import { esc } from "./icons.js";
import { mountDictation } from "./input-dictation.js";

const isAudio = (mode) => mode === "listening";
const button = (id, text, primary = false) =>
  '<button type="button" class="il-btn ' +
  (primary ? "il-primary" : "") +
  '" data-do="' +
  id +
  '">' +
  esc(text) +
  "</button>";
const norm = (x) =>
  String(x ?? "")
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/[.,;:!?]+$/, "")
    .replace(/\s+/g, " ");
const stamp = () => new Date().toISOString();
const duration = (s) =>
  Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");
export function gradeInput(q, submitted) {
  const answer = norm(submitted);
  if (!answer) return false;
  if (q.limit && answer.split(" ").length > q.limit) return false;
  return [q.answer, ...(q.alternatives || [])].some((v) => norm(v) === answer);
}
export function lexicalQuestions(module, offset = 0) {
  return module.terms.map((t, i) => {
    switch ((i + offset) % 3) {
      case 0: {
        const a = module.terms[(i + 3) % 10],
          b = module.terms[(i + 7) % 10],
          opts = [a.term, b.term];
        opts.splice((i + 1) % 3, 0, t.term);
        return {
          kind: "choice",
          name: "释义改写",
          prompt: t.definition,
          options: opts,
          answer: t.term,
          word: t,
        };
      }
      case 1:
        return {
          kind: "gap",
          name: "词形与搭配",
          prompt: t.gap,
          clue: "词根提示 · " + t.stem,
          answer: t.answer,
          word: t,
        };
      default:
        return {
          kind: "gap",
          name: "闭卷提取",
          prompt: "写出本单元中表达「" + t.gloss + "」的英文词或搭配。",
          clue: "语境 · " + t.gap,
          answer: t.answer,
          word: t,
        };
    }
  });
}
function ensureCSS() {
  if (!document.querySelector("link[data-input-lab]")) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/input-lab.css";
    link.dataset.inputLab = "1";
    document.head.append(link);
  }
}
function dueDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
function safeWeek(week, max) {
  const n = Number(week);
  return Number.isSafeInteger(n) && n > 0 ? (n - 1) % max : null;
}
const radio = (q, i, value, readonly) =>
  '<div class="il-options">' +
  q.options
    .map(
      (opt, j) =>
        '<label><input type="radio" name="input-' +
        i +
        '" data-answer="' +
        i +
        '" value="' +
        esc(opt) +
        '" ' +
        (value === opt ? "checked " : "") +
        (readonly ? "disabled" : "") +
        "><span><b>" +
        String.fromCharCode(65 + j) +
        "</b> " +
        esc(opt) +
        "</span></label>",
    )
    .join("") +
  "</div>";
function describe(q, i, value, results, mode) {
  const grade = gradeInput(q, value);
  const type =
    q.name ||
    { gap: "笔记填空", choice: "单项选择", match: "匹配陈述" }[q.kind];
  return (
    '<section class="il-q" data-q="' +
    i +
    '"><div class="il-index">' +
    String(i + 1).padStart(2, "0") +
    '</div><div class="il-question"><small>' +
    esc(type) +
    (q.limit
      ? " · NO MORE THAN " + (q.limit === 1 ? "ONE WORD" : "TWO WORDS")
      : "") +
    "</small><h3>" +
    esc(q.prompt) +
    "</h3>" +
    (q.clue ? '<p class="il-clue">' + esc(q.clue) + "</p>" : "") +
    (q.options
      ? radio(q, i, value, results)
      : '<input class="il-answer" lang="en" data-answer="' +
        i +
        '" aria-label="第 ' +
        (i + 1) +
        ' 题答案" placeholder="Type your answer" autocomplete="off" spellcheck="false" maxlength="240" value="' +
        esc(value || "") +
        '" ' +
        (results ? "readonly" : "") +
        ">") +
    (results
      ? '<div class="il-feedback ' +
        (grade ? "il-correct" : "il-missed") +
        '"><b>' +
        (grade ? "✓ 答对" : "需要复习") +
        "</b> · " +
        esc(q.answer) +
        "<p>" +
        esc(q.explanation || q.word?.nuance || "") +
        "</p>" +
        (isAudio(mode)
          ? '<button type="button" class="il-inline" data-evidence="' +
            i +
            '">▶ 重听原句，查看依据</button><div data-excerpt="' +
            i +
            '"></div>'
          : '<p lang="en">' + esc(q.word.example) + "</p>") +
        "</div>"
      : "") +
    "</div></section>"
  );
}
function essayPrompt(module) {
  return (
    '<div class="il-writing"><h3>迁移到自己的表达</h3><p>' +
    esc(module.transfer) +
    " 至少用两个本单元表达，写 2–3 句英文。</p></div>"
  );
}
function activeRecords(mode, idx) {
  return Object.entries(getState().attempts || {})
    .filter(([, a]) => a.labMode === mode && a.labIndex === idx)
    .sort((a, b) =>
      String(b[1].updatedAt).localeCompare(String(a[1].updatedAt)),
    );
}
let marksPromise;
function marks() {
  return (marksPromise ||= fetch("/input-audio/marks.json")
    .then((r) => {
      if (!r.ok) throw Error("timing unavailable");
      return r.json();
    })
    .catch((e) => {
      marksPromise = null;
      throw e;
    }));
}
export function mountInputLab(
  container,
  { mode = "listening", week, set, question, attemptKey, onNavigate } = {},
) {
  ensureCSS();
  if (mode === "dictation")
    return mountDictation(container, {
      week: week ?? set,
      question,
      attemptKey,
      onNavigate,
    });
  const audioMode = isAudio(mode),
    library = audioMode ? listeningSets : lexisModules;
  const routeWeek = Number(week ?? set) || 1;
  let idx = safeWeek(set ?? week, library.length),
    key = null,
    run = null,
    questions = [],
    audio = null,
    releaseAt = 0,
    segmentEnd = null,
    playing = false,
    stopped = false,
    playingPending = false;
  let clipPromise = null,
    clipURL = null;
  const query = (s) => container.querySelector(s);
  const path = (cut) =>
    onNavigate ? onNavigate(cut) : (location.hash = "#" + cut);
  const packageAt = () => library[idx];
  function stopMedia() {
    releaseAt++;
    if (audio) {
      audio.pause();
      audio.onended = null;
      audio.onerror = null;
      audio.ontimeupdate = null;
      audio = null;
    }
    playing = false;
    playingPending = false;
    segmentEnd = null;
  }
  function persist(patch) {
    if (!run || !key) return;
    run = saveAttempt(key, { ...run, ...patch });
  }
  function getQuestions() {
    questions = audioMode
      ? packageAt().questions
      : lexicalQuestions(packageAt(), run?.offset || 0);
  }
  function fresh() {
    stopMedia();
    const id = crypto.randomUUID(),
      prior = activeRecords(mode, idx);
    key = "input:" + mode + ":" + idx + ":" + id;
    run = {
      labArea: mode,
      labMode: mode,
      labIndex: idx,
      labWeek: routeWeek,
      labRoute: mode + "/" + routeWeek,
      labTitle: packageAt().title,
      startedAt: stamp(),
      labAnswers: {},
      completed: false,
      elapsedSeconds: 0,
      position: 0,
      heard: false,
      offset: prior.filter(([, r]) => r.completed).length % 3,
    };
    getQuestions();
    persist({});
    draw();
  }
  function open() {
    stopMedia();
    const runs = activeRecords(mode, idx).filter(
        ([, r]) => r.labRoute === mode + "/" + routeWeek,
      ),
      latest = runs.find(([k]) => k === attemptKey) || runs[0];
    if (latest) {
      [key, run] = latest;
      getQuestions();
    } else {
      key = null;
      run = null;
      getQuestions();
    }
    draw();
    if (
      Number.isInteger(question) &&
      question >= 0 &&
      question < questions.length &&
      run?.completed
    ) {
      const item = query('[data-q="' + question + '"]');
      if (item) {
        item.tabIndex = -1;
        item.focus({ preventScroll: true });
        item.scrollIntoView({ block: "center" });
      }
    }
  }
  function head(title, kicker, subtitle) {
    return (
      '<header class="il-header"><span class="il-kicker">' +
      esc(kicker) +
      "</span><h1>" +
      esc(title) +
      "</h1>" +
      (subtitle ? "<p>" + esc(subtitle) + "</p>" : "") +
      "</header>"
    );
  }
  function sources() {
    return audioMode
      ? '<footer class="il-notes">本站原创仿题，按 IELTS Listening 的题型与答词限制练习。录音为英、美英语合成语音。<a href="https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test" target="_blank" rel="noreferrer">对照官方样题 ↗</a> · <a href="/input-audio/CREDITS.md" target="_blank" rel="noreferrer">Piper 语音来源 ↗</a></footer>'
      : '<footer class="il-notes">本区面向 Band 7 备考者，练习搭配精度、改写和主动运用。词汇测验不折算雅思分数。<a href="https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail" target="_blank" rel="noreferrer">官方评分说明 ↗</a></footer>';
  }
  function list() {
    return (
      head(
        audioMode ? "雅思听力精练" : "学术词汇精练",
        audioMode ? "LISTENING PRACTICE" : "ACADEMIC LEXIS",
        audioMode
          ? "第一遍按考试节奏只听一次。提交后逐题重听，找出改口、限定和干扰信息。"
          : "从英文改写认词，到无选项补全和写作运用。每次重练会轮换提取方式。",
      ) +
      '<div class="il-grid">' +
      library
        .map((s, n) => {
          const r = activeRecords(mode, n)[0]?.[1];
          return (
            '<button class="il-tile" type="button" data-set="' +
            n +
            '"><span class="il-kicker">' +
            (audioMode ? "PART " + s.part : "主题 " + (n + 1)) +
            "</span><h2>" +
            esc(s.title) +
            "</h2><p>" +
            esc(s.subtitle || s.focus) +
            "</p><span>" +
            (r?.completed
              ? "查看上次练习"
              : r
                ? "继续未完成练习"
                : audioMode
                  ? "10 道原创新题"
                  : "10 个核心表达") +
            " →</span></button>"
          );
        })
        .join("") +
      "</div>" +
      sources()
    );
  }
  function termDeck(s) {
    return (
      '<details class="il-deck"><summary>学习本组表达 · 词义、搭配和原创例句</summary>' +
      s.terms
        .map(
          (t) =>
            "<article><b>" +
            esc(t.term) +
            "</b> · " +
            esc(t.gloss) +
            "<p>" +
            esc(t.nuance) +
            '</p><p lang="en">' +
            esc(t.example) +
            "</p></article>",
        )
        .join("") +
      "</details>"
    );
  }
  function textTranscript(s) {
    return (
      '<details class="il-deck"><summary>完整录音文本</summary>' +
      s.turns
        .map(
          ([speaker, text]) =>
            "<article><b>" +
            esc(speaker) +
            '</b><p lang="en">' +
            esc(text) +
            "</p></article>",
        )
        .join("") +
      "</details>"
    );
  }
  function draw() {
    if (stopped) return;
    if (idx === null) {
      container.innerHTML = '<main class="il-main">' + list() + "</main>";
      return;
    }
    const s = packageAt();
    const home =
      '<button type="button" class="il-inline" data-do="catalog">← ' +
      (audioMode ? "全部听力练习" : "全部词汇主题") +
      "</button>";
    const heading = head(
      s.title,
      audioMode
        ? "IELTS LISTENING / PART " + s.part
        : "ACADEMIC LEXIS / " + String(idx + 1).padStart(2, "0"),
      s.subtitle || s.focus,
    );
    if (!run) {
      container.innerHTML =
        '<main class="il-main">' +
        home +
        heading +
        '<div class="il-intro"><b>' +
        (audioMode ? "10 道听力题" : "10 项闭卷提取 + 英文输出") +
        "</b><p>" +
        (audioMode
          ? "先阅读问题，再开始录音。考试模式可暂停，不能回拖或重听。提交后可反复听原句。"
          : "可先浏览词义和例句。开始后收起资料，完成选择、词形补全和主动回忆。") +
        "</p>" +
        button("start", "开始练习", true) +
        "</div>" +
        (!audioMode ? termDeck(s) : "") +
        sources() +
        "</main>";
      return;
    }
    const finished = !!run.completed;
    const nDone = Object.values(run.labAnswers || {}).filter((v) =>
      String(v || "").trim(),
    ).length;
    const score = questions.filter((q, i) =>
      gradeInput(q, run.labAnswers[i]),
    ).length;
    const examBar = audioMode
      ? '<div class="il-audio"><div><b>' +
        esc(finished ? "听力复盘" : "考试模式 · 1×") +
        "</b><p data-clock>" +
        duration(run.position || 0) +
        (run.heard ? " · 本轮听完" : "") +
        "</p></div>" +
        (finished
          ? button("listen", "▶ 重听整段")
          : run.heard
            ? "<span>已播放一次</span>"
            : button(
                "listen",
                (run.position || 0) > 0 ? "▶ 继续播放" : "▶ 开始播放",
                true,
              )) +
        "</div>"
      : "";
    const writing = audioMode
      ? ""
      : essayPrompt(s) +
        '<textarea class="il-answer" data-writing rows="4" maxlength="4500" placeholder="Write your own response…" ' +
        (finished ? "readonly" : "") +
        ">" +
        esc(getDraft(key + ":output") ?? run.writing ?? "") +
        "</textarea>" +
        (finished
          ? '<small class="il-clue">已保存书面样本。可对照参考句检查搭配和语气。</small><details class="il-deck"><summary>一份原创示范 · 检查两个搭配怎样服务于论证</summary><p lang="en">' +
            esc(s.productionExample) +
            "</p></details>"
          : "");
    container.innerHTML =
      '<main class="il-main">' +
      home +
      heading +
      (finished
        ? '<section class="il-result"><div><b>' +
          score +
          " / 10</b><p>本次客观题首次作答</p></div>" +
          button("again", "新开一轮练习") +
          "</section>"
        : "") +
      examBar +
      '<p class="il-count" data-count>' +
      nDone +
      " / " +
      questions.length +
      " 已填写</p>" +
      questions
        .map((q, i) => describe(q, i, run.labAnswers[i], finished, mode))
        .join("") +
      writing +
      '<p class="il-message" data-status role="status"></p>' +
      (!finished
        ? button("submit", "提交并查看解析", true)
        : audioMode
          ? textTranscript(s)
          : termDeck(s)) +
      sources() +
      "</main>";
  }
  function status(note) {
    const el = query("[data-status]");
    if (el) el.textContent = note;
  }
  function audioButtons() {
    const ctrl = query('[data-do="listen"]');
    if (ctrl)
      ctrl.textContent = playing
        ? "Ⅱ 暂停"
        : run?.completed
          ? "▶ 重听整段"
          : "▶ 继续播放";
  }
  async function startAudio(offset = 0, end = null) {
    stopMedia();
    const token = releaseAt;
    playingPending = true;
    // A local blob remains seekable when an HTTP host does not implement byte ranges.
    if (!clipPromise)
      clipPromise = fetch("/input-audio/" + packageAt().id + ".mp3")
        .then(async (r) => {
          if (!r.ok) throw Error("missing audio");
          const blob = await r.blob();
          if (stopped) throw Error("disposed");
          clipURL = URL.createObjectURL(blob);
          return clipURL;
        })
        .catch((error) => {
          clipPromise = null;
          throw error;
        });
    let src;
    try {
      src = await clipPromise;
    } catch {
      playingPending = false;
      status("录音未能载入。请检查网络后重试。");
      return;
    }
    if (token !== releaseAt || stopped) return;
    const el = new Audio(src);
    audio = el;
    playingPending = true;
    segmentEnd = end;
    el.preload = "auto";
    el.playbackRate = 1;
    const fail = () => {
      if (token !== releaseAt || stopped) return;
      playingPending = false;
      playing = false;
      status("音频未能播放。请检查网络后点击重试；本次作答已保留。");
      audioButtons();
    };
    el.onerror = fail;
    el.addEventListener(
      "loadedmetadata",
      () => {
        if (token === releaseAt)
          el.currentTime = Math.max(
            0,
            Math.min(
              offset,
              Number.isFinite(el.duration) ? el.duration - 0.1 : offset,
            ),
          );
      },
      { once: true },
    );
    let lastSave = offset;
    el.ontimeupdate = () => {
      if (stopped || token !== releaseAt) return;
      const t = el.currentTime;
      const clock = query("[data-clock]");
      if (clock)
        clock.textContent =
          duration(t) +
          " / " +
          (Number.isFinite(el.duration) ? duration(el.duration) : "…");
      if (!run.completed && t - lastSave >= 2) {
        lastSave = t;
        persist({ position: t });
      }
      if (segmentEnd != null && t >= segmentEnd) {
        stopMedia();
        audioButtons();
      }
    };
    el.onended = () => {
      if (token !== releaseAt || stopped) return;
      playing = false;
      playingPending = false;
      if (!run.completed) {
        persist({ position: el.duration, heard: true });
        draw();
      } else audioButtons();
    };
    el.play()
      .then(() => {
        if (token === releaseAt) {
          playing = true;
          playingPending = false;
          audioButtons();
          status("");
        }
      })
      .catch(fail);
  }
  async function evidence(i) {
    if (!run?.completed || !audioMode) return;
    const s = packageAt(),
      q = questions[i],
      pair = s.turns[q.turn],
      target = query('[data-excerpt="' + i + '"]');
    if (target)
      target.innerHTML =
        "<blockquote><b>" +
        esc(pair[0]) +
        '</b><p lang="en">' +
        esc(pair[1]) +
        "</p></blockquote>";
    const token = releaseAt;
    try {
      const data = (await marks())[s.id];
      if (!stopped && token === releaseAt)
        startAudio(data.marks[q.turn], data.marks[q.turn + 1] ?? data.duration);
    } catch {
      status("原句文本已显示。音频定位暂时不可用，可重听整段。");
    }
  }
  function finish() {
    const missing = questions.findIndex(
      (_, i) => !String(run.labAnswers[i] || "").trim(),
    );
    if (missing >= 0) {
      status("第 " + (missing + 1) + " 题还没有作答。");
      query('[data-answer="' + missing + '"]')?.focus();
      return;
    }
    if (audioMode && !run.heard) {
      status("请先完成本轮录音，再提交答案。");
      query('[data-do="listen"]')?.focus();
      return;
    }
    const written = audioMode ? "" : (getDraft(key + ":output") || "").trim();
    if (!audioMode && !/[a-z]/i.test(written)) {
      status("请写下自己的英文表达，再提交本组练习。");
      query("[data-writing]")?.focus();
      return;
    }
    stopMedia();
    const score = questions.filter((q, i) =>
      gradeInput(q, run.labAnswers[i]),
    ).length;
    persist({
      completed: true,
      completedAt: stamp(),
      correct: score,
      graded: 10,
      total: 10,
      writing: written,
    });
    if (audioMode)
      questions.forEach((q, i) => {
        const value = run.labAnswers[i];
        if (gradeInput(q, value)) return;
        const category =
          q.limit && norm(value).split(" ").length > q.limit
            ? "答词超限"
            : q.kind === "gap"
              ? "听力笔记填空"
              : q.kind === "match"
                ? "听力信息匹配"
                : "听力选择与干扰项";
        saveReview("input-listen:" + packageAt().id + ":" + i, {
          labRoute: run.labRoute,
          labQuestion: i,
          labAttempt: key,
          labTitle: run.labTitle,
          category,
          word: packageAt().title + " · 第 " + (i + 1) + " 题",
          meaning:
            "你的答案：" +
            value +
            "。正确答案：" +
            q.answer +
            "。" +
            q.explanation,
          example: packageAt().turns[q.turn][1],
          blockId: "exam",
          tiers: { 掌握: "learning" },
          due: dueDate(1),
          problem: {
            kind: "choice",
            prompt: q.prompt,
            explanation: q.explanation,
            options: q.options || [q.answer, value],
            answer: q.options ? q.options.indexOf(q.answer) : 0,
          },
        });
      });
    if (!audioMode)
      questions.forEach((q, i) => {
        const t = q.word,
          correct = gradeInput(q, run.labAnswers[i]),
          id = "input-lexis:" + t.term;
        const prev = getState().review[id] || {},
          streak = correct ? Math.min(5, (prev.streak || 0) + 1) : 0;
        saveReview(id, {
          word: t.term,
          meaning: t.gloss,
          example: t.example,
          blockId: "vocab",
          streak,
          tiers: {
            ...prev.tiers,
            看得懂: correct ? "practised" : "learning",
            用得出: prev.tiers?.["用得出"] || "learning",
          },
          due: dueDate(correct ? [1, 2, 4, 8, 15, 30][streak] : 1),
          labTitle: packageAt().title,
          ...(!correct
            ? {
                category: q.name,
                labRoute: run.labRoute,
                labQuestion: i,
                labAttempt: key,
              }
            : {}),
        });
      });
    draw();
    container.scrollIntoView({ block: "start" });
  }
  function answer(e) {
    if (!run || run.completed) return;
    const el = e.target;
    if (el.matches("[data-writing]")) {
      saveDraft(key + ":output", el.value);
      return;
    }
    if (!el.matches("[data-answer]")) return;
    const i = Number(el.dataset.answer);
    persist({ labAnswers: { ...run.labAnswers, [i]: el.value } });
    const n = Object.values(run.labAnswers).filter((v) =>
        String(v || "").trim(),
      ).length,
      c = query("[data-count]");
    if (c) c.textContent = n + " / " + questions.length + " 已填写";
  }
  function click(e) {
    const b = e.target.closest("button");
    if (!b || !container.contains(b)) return;
    if (b.dataset.set !== undefined) {
      path("/" + mode + "/" + (Number(b.dataset.set) + 1));
      return;
    }
    if (b.dataset.evidence !== undefined) {
      void evidence(Number(b.dataset.evidence));
      return;
    }
    switch (b.dataset.do) {
      case "catalog":
        path("/" + mode);
        break;
      case "start":
      case "again":
        fresh();
        break;
      case "submit":
        finish();
        break;
      case "listen":
        if (playingPending) return;
        if (playing) {
          if (!run.completed)
            persist({ position: audio?.currentTime || run.position });
          stopMedia();
          audioButtons();
          break;
        }
        if (!run.completed && run.heard) return;
        startAudio(run.completed ? 0 : run.position || 0);
        break;
    }
  }
  function suspend() {
    if (audio && run && !run.completed)
      persist({ position: audio.currentTime || run.position });
    stopMedia();
    audioButtons();
  }
  container.addEventListener("input", answer);
  container.addEventListener("click", click);
  window.addEventListener("pagehide", suspend);
  if (idx === null) draw();
  else open();
  return () => {
    suspend();
    stopped = true;
    if (clipURL) URL.revokeObjectURL(clipURL);
    container.removeEventListener("input", answer);
    container.removeEventListener("click", click);
    window.removeEventListener("pagehide", suspend);
  };
}
