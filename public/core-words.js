import {
  bank,
  byId,
  topics,
  findTopic,
  modes,
  modeLabels,
  dimensions,
  wordStatus,
  latestReview,
  optionsFor,
  checkAnswer,
  maskedSentence,
  selectWords,
  sequence,
  audioUrl,
  seenLegacy,
} from "./core-word-bank.js";
import { getState, saveAttempt, saveReview } from "./sync.js";
import { accountFetch } from "./account-request.js";
import { aiResponse, aiErrorText } from "./ai-response.js";
import { esc, icon } from "./icons.js";

const title = "雅思核心词汇";
const day = 86400000;
const routeFor = (scope) =>
  scope.startsWith("w-") ? "words/card/" + scope : "words/" + scope + "/train";
const routeLink = (route, text, cls = "btn") =>
  '<a class="' + cls + '" href="#/' + esc(route) + '">' + esc(text) + "</a>";
const records = () =>
  Object.entries(getState().attempts || {})
    .filter(([, a]) => a.coreWordRun)
    .sort((a, b) => String(b[1].updatedAt).localeCompare(a[1].updatedAt));
const pageHead = (over, name, sub) =>
  '<header class="pageHead"><div><span class="eyebrow">' +
  esc(over) +
  "</span><h1>" +
  esc(name) +
  "</h1><p>" +
  esc(sub) +
  "</p></div></header>";
const button = (action, label, cls = "btn") =>
  '<button type="button" class="' +
  cls +
  '" data-cw="' +
  action +
  '">' +
  esc(label) +
  "</button>";
const getReview = () => getState().review || {};
function routeName(scope) {
  return (
    findTopic(scope)?.title ||
    { errors: "单词错题重练", due: "到期词复习" }[scope] ||
    byId.get(scope)?.term ||
    title
  );
}
function suggestedScope() {
  const last = records().find(([, a]) => !a.completed);
  if (last) return last[1].scope;
  const review = getReview();
  return (
    topics.find(
      (t) =>
        t.kind === "词头" &&
        t.words.some((id) => !wordStatus(byId.get(id), review).attempted),
    ) || topics[0]
  ).id;
}
export function mountCoreWords(
  container,
  { unit = "", view = "", onNavigate } = {},
) {
  if (!document.querySelector("link[data-core-words]")) {
    const style = document.createElement("link");
    style.rel = "stylesheet";
    style.href = "/core-words.css";
    style.dataset.coreWords = "";
    document.head.append(style);
  }
  const navigate = (route) => {
    if (onNavigate) onNavigate("/" + route);
    else location.hash = "#/" + route;
  };
  if (unit === "start") {
    navigate(routeFor(suggestedScope()));
    return () => {};
  }
  let active = true,
    audio = null,
    audioTicket = 0,
    query = "",
    listLimit = 24,
    catalogueTab = "词头",
    errorFilter = "open";
  const scope = unit === "card" ? view : unit;
  const training =
    (unit === "card" && byId.has(view)) ||
    (view === "train" &&
      (!!findTopic(unit) || ["errors", "due"].includes(unit)));
  let attemptKey,
    run,
    working = false;
  const q = (s) => container.querySelector(s);
  function stop() {
    audioTicket++;
    if (audio) {
      audio.pause();
      audio = null;
    }
  }
  function persist(patch) {
    run = saveAttempt(attemptKey, { ...run, ...patch });
  }
  function start() {
    const review = getReview(),
      ids = selectWords(scope, review);
    const questions = sequence(scope, ids, review);
    if (!questions.length) {
      run = null;
      return;
    }
    attemptKey = "core-word-run:" + crypto.randomUUID();
    run = {
      coreWordRun: true,
      labArea: "words",
      scope,
      labRoute: routeFor(scope),
      labTitle: "词汇 · " + routeName(scope),
      startedAt: new Date().toISOString(),
      seed: Math.floor(Math.random() * 101),
      ids,
      questions,
      index: 0,
      answers: {},
      typed: "",
      plays: 0,
      completed: false,
    };
    persist({});
  }
  function home() {
    const recordsHere = records(),
      review = getReview(),
      paused = recordsHere.find(([, a]) => !a.completed),
      due = selectWords("due", review, bank.length).length,
      errors = selectWords("errors", review, bank.length).length;
    const next = paused ? paused[1].scope : suggestedScope();
    container.innerHTML =
      pageHead(
        "VOCABULARY STUDIO",
        title,
        "先用核心词头打基础，再进入学术搭配和生活场景。",
      ) +
      '<div class="cw-home"><section class="panel panelBody cw-feature"><span class="eyebrow">每组最多 3 个词</span><h2>' +
      esc(routeName(next)) +
      "</h2><p>" +
      (paused
        ? "上次停在第 " + (paused[1].index + 1) + " 项，继续时保留刚才的作答。"
        : "读句辨义，遮住英文主动回忆，再听录音拼出同一组词。") +
      "</p>" +
      routeLink(
        "words/start",
        paused ? "继续上次练词" : "开始练词",
        "btn green",
      ) +
      '</section><div class="cw-shortcuts"><a class="panel panelBody" href="#/words/errors">' +
      icon("review", 19) +
      "<b>单词错题本</b><small>待订正 " +
      errors +
      ' 词</small></a><a class="panel panelBody" href="#/words/due/train">' +
      icon("clock", 19) +
      "<b>到期复习</b><small>今天到期 " +
      due +
      ' 词</small></a></div></div><section class="panel panelBody cw-topics"><div class="sectionRow"><h2 class="cardTitle">按话题练词</h2>' +
      routeLink("words/all", "查找全部词条", "miniAction") +
      '</div><p class="pageNote">96 个词头按读图、研究、环境等常见任务选编。另收录课程中的 936 个场景词与表达、60 个学术词与搭配，合并同形词后共 ' +
      bank.length +
      ' 条。此为本站教学选词。</p><div class="cw-tabs">' +
      ["词头", "学术搭配", "场景表达"]
        .map(
          (t) =>
            '<button class="pill ' +
            (catalogueTab === t ? "active" : "") +
            '" data-category="' +
            t +
            '">' +
            t +
            "</button>",
        )
        .join("") +
      '</div><div class="cw-grid">' +
      topics
        .filter((t) => t.kind === catalogueTab)
        .map((t) => {
          const examples = t.words
            .slice(0, 3)
            .map((k) => byId.get(k).term)
            .join(" · ");
          const done = t.words.filter(
            (k) => wordStatus(byId.get(k), review).attempted,
          ).length;
          return (
            '<a class="cw-topic" href="#/' +
            routeFor(t.id) +
            '"><b>' +
            esc(t.title) +
            '</b><span lang="en">' +
            esc(examples) +
            "</span><small>" +
            done +
            " / " +
            t.words.length +
            " 已练 →</small></a>"
          );
        })
        .join("") +
      "</div></section>";
  }
  function errorEntry(w, s) {
    const r = latestReview(w, getReview()),
      failure = s.core?.lastMiss;
    return (
      '<article class="cw-entry"><div><strong lang="en">' +
      esc(w.term) +
      "</strong><span>" +
      esc(w.gloss) +
      "</span><small>" +
      esc(
        s.open.length
          ? "待订正 · " + s.open.map((m) => modeLabels[m]).join("、")
          : "已订正",
      ) +
      "</small></div><p>" +
      esc(
        failure
          ? "上次错答　" + (failure.input || "未想起") + "　·　" + failure.label
          : r.lastDictation || r.category || "课程复习记录",
      ) +
      "</p>" +
      routeLink("words/card/" + w.id, "单独重练", "miniAction") +
      "</article>"
    );
  }
  function catalogue() {
    const errors = unit === "errors",
      review = getReview(),
      needle = query.trim().toLowerCase();
    let eligible = bank.map((w) => ({
      w,
      s: errors ? wordStatus(w, review) : null,
    }));
    if (errors)
      eligible = eligible.filter(({ s }) =>
        errorFilter === "past" ? s.ever && !s.open.length : s.open.length,
      );
    if (needle)
      eligible = eligible.filter(
        ({ w }) => w.term.includes(needle) || w.gloss.includes(needle),
      );
    const list = eligible
      .slice(0, listLimit)
      .map(({ w, s }) =>
        errors
          ? errorEntry(w, s)
          : '<article class="cw-entry"><div><strong lang="en">' +
            esc(w.term) +
            "</strong><span>" +
            esc(w.gloss) +
            "</span></div><small>" +
            esc(findTopic(w.topic).title) +
            "</small>" +
            routeLink("words/card/" + w.id, "练这个词", "miniAction") +
            "</article>",
      )
      .join("");
    const results = q("[data-list]");
    results.innerHTML =
      '<p class="pageNote">共 ' +
      eligible.length +
      " 条</p>" +
      (list ||
        "<p>" +
          esc(
            errors
              ? errorFilter === "open"
                ? "目前没有待订正的单词。答错后，这里会保留错因与复习入口。"
                : "目前没有已订正的历史错词。"
              : "试试另一组中文或英文关键词。",
          ) +
          "</p>") +
      (eligible.length > listLimit ? button("more", "再显示 24 条") : "");
  }
  function openCatalogue() {
    const errors = unit === "errors";
    container.innerHTML =
      pageHead(
        "WORD BANK",
        errors ? "单词错题本" : "词库检索",
        errors
          ? "这里汇总词汇训练、听写和课程里可识别的词汇错误。"
          : "输入英文或中文释义，找到一个词就可以马上练。",
      ) +
      '<div class="cw-bar">' +
      routeLink("words", "← 核心词汇", "miniAction") +
      (errors
        ? routeLink("words/errors/train", "开始重练待订正词", "btn green")
        : "") +
      '</div><section class="panel panelBody">' +
      (errors
        ? '<div class="cw-tabs">' +
          ["open", "past"]
            .map(
              (t) =>
                '<button class="pill ' +
                (errorFilter === t ? "active" : "") +
                '" data-filter="' +
                t +
                '">' +
                (t === "open" ? "待订正" : "已订正记录") +
                "</button>",
            )
            .join("") +
          "</div>"
        : "") +
      '<label class="cw-search">查找词条<input type="search" placeholder="英文或中文" data-search value="' +
      esc(query) +
      '"></label><div data-list></div></section>';
    catalogue();
  }
  function trainingPanel() {
    if (!run) {
      container.innerHTML =
        pageHead(
          "WORD PRACTICE",
          routeName(scope),
          scope === "due"
            ? "当前没有到期词条。新练的词会按实际作答时间加入复习。"
            : "目前没有待订正的词条。",
        ) + routeLink("words", "选择一个话题", "btn green");
      return;
    }
    if (run.completed) {
      container.innerHTML =
        pageHead("WORD PRACTICE", "本组完成", routeName(scope)) +
        '<section class="panel panelBody cw-result"><span class="eyebrow">首次作答</span><h2>' +
        run.correct +
        " / " +
        run.graded +
        '</h2><div class="cw-tabs">' +
        modes
          .map((m) => {
            const entries = Object.values(run.answers).filter(
              (a) => a.mode === m,
            );
            return entries.length
              ? '<span class="pill">' +
                  modeLabels[m] +
                  " " +
                  entries.filter((a) => a.right).length +
                  "/" +
                  entries.length +
                  "</span>"
              : "";
          })
          .join("") +
        "</div>" +
        run.ids
          .map((id) => {
            const w = byId.get(id);
            return "<p><b>" + esc(w.term) + "</b>　" + esc(w.gloss) + "</p>";
          })
          .join("") +
        '<div class="cw-bar">' +
        button("another", "再练一组", "btn green") +
        routeLink("words/errors", "查看单词错题本") +
        routeLink("words", "全部话题", "miniAction") +
        "</div></section>";
      return;
    }
    const step = run.questions[run.index],
      w = byId.get(step.id),
      a = run.answers[run.index],
      m = step.mode;
    let field = "";
    if (m === "meaning")
      field =
        '<p lang="en" class="cw-example">' +
        esc(w.example) +
        '</p><p>句中 <b lang="en">' +
        esc(w.term) +
        '</b> 表示什么意思？</p><div class="cw-choices">' +
        optionsFor(w, run.seed)
          .map(
            (o) =>
              '<button type="button" data-answer="' +
              esc(o) +
              '" ' +
              (a ? "disabled" : "") +
              ' class="' +
              (a && o === w.gloss ? "matched" : "") +
              '">' +
              esc(o) +
              "</button>",
          )
          .join("") +
        "</div>";
    else {
      field =
        m === "audio"
          ? "<p>听录音，输入你听到的英文单词或搭配。</p>" +
            button(
              "listen",
              run.plays
                ? "▶ 再听一次（已播 " + run.plays + " 次）"
                : "▶ 播放录音",
            )
          : '<p class="cw-gloss">' +
            esc(w.gloss) +
            "</p>" +
            (maskedSentence(w)
              ? '<p lang="en" class="cw-example">' +
                esc(maskedSentence(w)) +
                "</p>"
              : "") +
            '<p class="pageNote">写出本组学习的英文表达。</p>';
      field +=
        '<form data-form><label class="cw-search">你的答案<input data-typed lang="en" autocomplete="off" autocapitalize="off" spellcheck="false" value="' +
        esc(a ? a.input : run.typed || "") +
        '" ' +
        (a ? "readonly" : "") +
        "></label>" +
        (a
          ? ""
          : '<div class="cw-bar"><button type="submit" class="btn green">核对答案</button>' +
            button(
              "skip",
              m === "audio" ? "没听出来" : "没想起来",
              "miniAction",
            ) +
            "</div>") +
        "</form>";
    }
    const guide = w.nuance || w.collocation || w.example;
    const feedback = a
      ? '<section class="readFeedback ' +
        (a.right ? "correct" : "") +
        '"><strong>' +
        esc(a.right ? "答对了" : "需要订正 · " + a.label) +
        "</strong><p>你的答案　" +
        esc(a.input || "未答出") +
        '<br>目标表达　<b lang="en">' +
        esc(w.term) +
        "</b>　" +
        esc(w.pos || "") +
        " " +
        esc(w.gloss) +
        "</p><p>" +
        esc(guide) +
        "</p>" +
        (guide !== w.example ? '<p lang="en">' + esc(w.example) + "</p>" : "") +
        '<div class="cw-bar">' +
        button(
          "next",
          run.index === run.questions.length - 1 ? "看本组结果" : "下一题 →",
          "btn green",
        ) +
        button("listen", "▶ 听发音") +
        button("coach", "AI 讲解这个词", "miniAction") +
        '</div><p class="cw-ai" data-coach aria-live="polite"></p></section>'
      : "";
    container.innerHTML =
      '<div class="cw-bar">' +
      routeLink("words", "← 核心词汇", "miniAction") +
      routeLink("words/errors", "单词错题本", "miniAction") +
      "</div>" +
      pageHead(
        "WORD PRACTICE",
        modeLabels[m],
        routeName(scope) +
          " · 第 " +
          (run.index + 1) +
          " / " +
          run.questions.length +
          " 项",
      ) +
      '<section class="panel panelBody cw-question">' +
      field +
      feedback +
      '<p data-notice role="status" class="pageNote"></p></section>';
  }
  function submit(answer) {
    if (working || run.answers[run.index]) return;
    const { id, mode } = run.questions[run.index],
      w = byId.get(id);
    if (mode === "audio" && !run.plays) {
      q("[data-notice]").textContent = "请先播放这道题的录音。";
      return;
    }
    working = true;
    try {
      const { right, label } = checkAnswer(w, mode, answer, run.plays),
        at = new Date().toISOString(),
        event = attemptKey + ":" + run.index;
      const review = getReview(),
        key = w.reviewKey,
        prev = review[key] || {},
        s = wordStatus(w, review),
        c = s.core || {},
        open = new Set(s.open);
      const lastMiss = right ? c.lastMiss : { at, mode, input: answer, label };
      if (right) open.delete(mode);
      else open.add(mode);
      const misses = (c.misses || Number(s.ever)) + (right ? 0 : 1),
        streak = right && !open.size ? Math.min(6, (c.streak || 0) + 1) : 0;
      const due = new Date(
        Date.now() +
          (open.size ? 10 * 60000 : day * [1, 1, 3, 7, 14, 21, 30][streak]),
      ).toISOString();
      const result = {
        id,
        mode,
        input: answer,
        right,
        label,
        plays: run.plays,
        at,
      };
      const patch = {
        word: w.term,
        meaning: w.gloss,
        example: w.example,
        blockId: "vocab",
        due,
        tiers: {
          ...prev.tiers,
          [dimensions[mode]]: right ? "practised" : "learning",
        },
        corePractice: {
          at,
          event,
          total: (c.total || 0) + 1,
          misses,
          open: [...open],
          lastMiss,
          streak,
          skills: { ...c.skills, [mode]: { right, at } },
        },
        ...(!right
          ? {
              labRoute: "words/card/" + id,
              labQuestion: null,
              labAttempt: null,
              labTitle: w.term,
              category: label,
            }
          : {}),
      };
      patch.corePractice.seenLegacy = seenLegacy(w, review, key, {
        ...prev,
        ...patch,
      });
      saveReview(key, patch);
      persist({
        answers: { ...run.answers, [run.index]: result },
        typed: answer,
      });
      trainingPanel();
    } finally {
      working = false;
    }
  }
  async function play() {
    const { id } = run.questions[run.index];
    stop();
    const t = audioTicket;
    try {
      const url = await audioUrl(byId.get(id));
      if (!active || t !== audioTicket) return;
      audio = new Audio(url);
      await audio.play();
      if (active && t === audioTicket && !run.answers[run.index]) {
        persist({ plays: (run.plays || 0) + 1 });
        const b = q("[data-cw=listen]");
        if (b) b.textContent = "▶ 再听一次（已播 " + run.plays + " 次）";
      }
    } catch {
      if (active && t === audioTicket)
        q("[data-notice]").textContent = "录音暂时未能播放，请重试。";
    }
  }
  async function coach(b) {
    const feedback = q("[data-coach]"),
      a = run.answers[run.index];
    if (!feedback || !a) return;
    const w = byId.get(a.id);
    b.disabled = true;
    feedback.textContent = "正在获取讲解…";
    try {
      const data = await aiResponse(
        await accountFetch("/api/coach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            task: "vocabulary",
            input: a.input || "我没想起这个词。",
            context:
              "Target: " +
              w.term +
              " (" +
              w.gloss +
              "). Exercise: " +
              modeLabels[a.mode] +
              ". Sentence: " +
              w.example +
              ". Learner outcome: " +
              a.label +
              ". Explain this word and give one new practice question.",
          }),
        }),
      );
      feedback.textContent = data.text || "服务商返回空内容，请重试。";
    } catch (e) {
      feedback.textContent = aiErrorText(e);
    } finally {
      b.disabled = false;
    }
  }
  function click(e) {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.category) {
      catalogueTab = b.dataset.category;
      home();
      return;
    }
    if (b.dataset.filter) {
      errorFilter = b.dataset.filter;
      listLimit = 24;
      openCatalogue();
      return;
    }
    if (b.dataset.answer !== undefined) {
      submit(b.dataset.answer);
      return;
    }
    switch (b.dataset.cw) {
      case "more":
        listLimit += 24;
        catalogue();
        break;
      case "listen":
        void play();
        break;
      case "coach":
        void coach(b);
        break;
      case "skip":
        submit("");
        break;
      case "next": {
        stop();
        if (!run.answers[run.index]) break;
        if (run.index + 1 === run.questions.length) {
          persist({
            completed: true,
            completedAt: new Date().toISOString(),
            correct: Object.values(run.answers).filter((x) => x.right).length,
            graded: run.questions.length,
          });
        } else persist({ index: run.index + 1, plays: 0, typed: "" });
        trainingPanel();
        break;
      }
      case "another":
        stop();
        start();
        trainingPanel();
        break;
    }
  }
  function typing(e) {
    if (e.target.matches("[data-search]")) {
      query = e.target.value;
      listLimit = 24;
      catalogue();
    } else if (e.target.matches("[data-typed]") && !run.answers[run.index])
      persist({ typed: e.target.value });
  }
  function form(e) {
    if (!e.target.matches("[data-form]")) return;
    e.preventDefault();
    if (!run.typed?.trim()) {
      q("[data-notice]").textContent = "先输入英文，或选择下方的未答出按钮。";
      return;
    }
    submit(run.typed.trim());
  }
  container.addEventListener("input", typing);
  container.addEventListener("click", click);
  container.addEventListener("submit", form);
  if (training) {
    const item = records().find(([, r]) => r.scope === scope && !r.completed);
    if (item) [attemptKey, run] = item;
    else start();
    trainingPanel();
  } else if (["errors", "all"].includes(unit)) openCatalogue();
  else home();
  return () => {
    active = false;
    stop();
    container.removeEventListener("input", typing);
    container.removeEventListener("click", click);
    container.removeEventListener("submit", form);
  };
}
