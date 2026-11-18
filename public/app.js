import { icon, esc } from "./icons.js";
import { getDay, weekTitles } from "./curriculum.js";
import {
  getState,
  initSync,
  refreshSync,
  subscribe,
  listDueReviews,
} from "./sync.js";
import { mountPlayer, mountReview, isSharedBlock } from "./player.js";
import { mountSettings } from "./settings.js";
import { resourcePanel } from "./resources.js";
import {
  deskHtml,
  dayPlan,
  mountStudyDay,
  mistakesHtml,
  labReportHtml,
  isDayDone,
  currentStudyDay,
} from "./exam-desk.js";
import { bindPacing, minutesFor } from "./pacing.js";
import { skillsPanel, bindEvidence } from "./progress.js";

const BASE = {
  vocab: ["单词", "words", "vocab"],
  grammar: ["语法", "grammar", "grammar"],
  exam: ["雅思专项", "headphones", "exam"],
  work: ["职场对话", "chat", "work"],
};
const TABS = [
  [
    "学习空间",
    [
      ["home", "home", "学习工作台"],
      ["words", "words", "雅思核心词汇"],
      ["courses", "layers", "全部课程"],
      ["quickreview", "review", "每日复习"],
      ["mistakes", "review", "雅思错题本"],
      ["report", "chart", "学习报告"],
      ["materials", "layers", "资料精练"],
    ],
  ],
  [
    "雅思训练",
    [
      ["reading", "book", "限时阅读"],
      ["listening", "headphones", "听力精练"],
      ["writing", "pen", "写作批改"],
      ["speaking", "mic", "口语考场"],
      ["lexis", "words", "学术搭配"],
      ["dictation", "headphones", "词汇听写"],
      ["accuracy", "grammar", "语法与改写"],
      ["mocks", "flag", "模拟考试"],
    ],
  ],
];
const DAYS = 156;
const state = () => getState();
const curTrack = () => state().profile.track || "undecided";
const section = (name, action = "") =>
  '<div class="sectionTop"><h2>' + name + "</h2>" + action + "</div>";
const link = (path, contents, cls = "") =>
  '<a href="#/' + path + '" class="' + cls + '">' + contents + "</a>";
const btn = (path, text, kind = "", sym = "arrow") =>
  link(path, esc(text) + icon(sym, 15), "btn " + kind);
const glyph = (id) =>
  '<span class="tileIcon ' +
  BASE[id][2] +
  '">' +
  icon(BASE[id][1], 22) +
  "</span>";
const cleanDay = (n) => Math.max(1, Math.min(DAYS, parseInt(n, 10) || 1));
const monthDay = (date, long = false) =>
  new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    ...(long ? { weekday: "long" } : {}),
  }).format(date);
const labelDate = (d) =>
  [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
let attemptRows = [],
  attemptsByBlock = new Map();
function indexAttempts() {
  attemptRows = Object.values(state().attempts).filter(
    (a) =>
      Number.isInteger(a.day) && a.day >= 1 && a.day <= DAYS && BASE[a.blockId],
  );
  attemptsByBlock = new Map();
  for (const a of attemptRows) {
    const key = a.day + "/" + a.blockId;
    if (!attemptsByBlock.has(key)) attemptsByBlock.set(key, []);
    attemptsByBlock.get(key).push(a);
  }
}
const sessionLines = () => attemptRows;
function chooseAttempt(day, id) {
  const possible = (attemptsByBlock.get(day + "/" + id) || []).filter(
    (a) => a.track === curTrack() || isSharedBlock(day, id),
  );
  return possible.sort(
    (a, b) =>
      Number(!!b.completed) - Number(!!a.completed) ||
      String(b.updatedAt || "").localeCompare(a.updatedAt || ""),
  )[0];
}
function incomplete() {
  return sessionLines()
    .filter(
      (a) =>
        (!a.completed || a.activeRepeat) &&
        (a.track === curTrack() || isSharedBlock(a.day, a.blockId)),
    )
    .sort((a, b) => String(b.updatedAt || "").localeCompare(a.updatedAt || ""));
}
function completeBlocks(day) {
  return Object.keys(BASE).filter((k) => chooseAttempt(day, k)?.completed)
    .length;
}
function nextUnit(day) {
  const pending = getDay(day, curTrack()).blocks.find(
    (b) => !chooseAttempt(day, b.id)?.completed,
  );
  return pending?.id || "vocab";
}
function current() {
  const paused = incomplete()[0];
  if (paused)
    return {
      day: paused.day,
      id: paused.blockId,
      paused: true,
      item: (paused.itemIndex || 0) + 1,
    };
  for (let d = 1; d <= DAYS; d++)
    if (completeBlocks(d) < 4)
      return { day: d, id: nextUnit(d), paused: false, item: 1 };
  return { day: DAYS, id: "work", paused: false, item: 1 };
}
function getSummary() {
  const rows = Object.values(state().attempts),
    seen = new Set(
      rows
        .filter((a) => a.completed && a.blockId)
        .map((a) => a.day + ":" + a.blockId),
    );
  const actual = {};
  for (const a of rows)
    for (const [d, s] of Object.entries(a.activity || {}))
      actual[d] = (actual[d] || 0) + (Number(s) || 0);
  return {
    finished: seen.size,
    actual,
    studied: new Set(
      rows.flatMap((a) =>
        Object.keys(a.activity || {}).concat(a.studyDate || []),
      ),
    ).size,
  };
}
function barStatus() {
  const s = state().syncStatus;
  return (
    '<span class="dot ' +
    (["synced", "local"].includes(s) ? "" : "pending") +
    '"></span>' +
    ({
      synced: "进度已同步",
      pending: "等待同步",
      offline: "待联网同步",
      local: "本机保存",
      "storage-error": "存储异常",
    }[s] || "正在同步")
  );
}
function weekStrip(week, sel) {
  return (
    '<div class="weekStrip">' +
    Array.from({ length: 6 }, (_, i) => {
      const d = (week - 1) * 6 + i + 1;
      return link(
        "day/" + d,
        "<span>Day</span><i>" + String(d).padStart(2, "0") + "</i>",
        (d === sel ? "sel " : "") + (isDayDone(d) ? "learned" : ""),
      );
    }).join("") +
    "</div>"
  );
}
const pageHead = (title, desc = "", over = "", extra = "") =>
  '<header class="pageHead"><div>' +
  (over ? '<span class="eyebrow">' + esc(over) + "</span>" : "") +
  "<h1>" +
  esc(title) +
  "</h1>" +
  (desc ? "<p>" + esc(desc) + "</p>" : "") +
  "</div>" +
  extra +
  "</header>";
function taskRow(day, b) {
  const a = chooseAttempt(day, b.id),
    done = !!a?.completed;
  const sub = done
    ? "已完成 · 可再次练习"
    : a
      ? "从第 " + ((a.itemIndex || 0) + 1) + " 题继续"
      : {
          vocab: "发音、搭配与主动回忆",
          grammar: "语境判断与造句",
          exam: "按题型练习与订正",
          work: "情境表达与追问",
        }[b.id];
  return link(
    "learn/" + day + "/" + b.id,
    glyph(b.id) +
      '<span><span class="taskName">' +
      esc(b.title) +
      '</span><span class="taskDesc">' +
      esc(sub) +
      '</span></span><span class="taskEnd"><span>' +
      b.minutes +
      ' 分钟</span><span class="circleArrow">' +
      icon(done ? "check" : "right", 13) +
      "</span></span>",
    "task",
  );
}
function resumePanel() {
  const pending = incomplete().slice(0, 3);
  if (!pending.length) return "";
  return (
    '<section class="panel">' +
    section("未完成的练习") +
    '<div class="taskList">' +
    pending
      .map((a) =>
        taskRow(a.day, {
          ...getDay(a.day, curTrack()).blocks.find((b) => b.id === a.blockId),
          title: "第 " + a.day + " 天 · " + BASE[a.blockId][0],
        }),
      )
      .join("") +
    "</div></section>"
  );
}
const phases = [
  [1, 2, "起点诊断"],
  [3, 8, "打牢基础"],
  [9, 16, "专项提升"],
  [17, 22, "限时训练"],
  [23, 26, "模拟与复测"],
];
function courses(filter) {
  let idx = Number(filter) || 0;
  let show = idx ? phases[idx - 1] : [1, 26, "全部"];
  if (!show) show = [1, 26, "全部"];
  return (
    pageHead(
      "全部课程",
      "26 周 · 156 个学习日。每一天都可提前进入，完成专项后用一道迁移任务订正。",
      "COURSE LIBRARY",
    ) +
    '<div class="filters">' +
    ["全部阶段", ...phases.map((p) => p[2])]
      .map((x, i) =>
        link("courses/" + i, x, "pill " + (idx === i ? "active" : "")),
      )
      .join("") +
    link("mocks", "两轮模拟考试 " + icon("right", 14), "miniAction") +
    '</div><div class="weeksGrid">' +
    weekTitles
      .map((name, i) => {
        const w = i + 1;
        if (w < show[0] || w > show[1]) return "";
        return (
          '<article class="panel weekCard"><div class="sectionRow"><span class="roundNum">WEEK ' +
          String(w).padStart(2, "0") +
          '</span><span class="mutedRow">' +
          phases.find((p) => w >= p[0] && w <= p[1])[2] +
          "</span></div><h3>" +
          esc(name) +
          "</h3>" +
          weekStrip(w, currentStudyDay()) +
          "</article>"
        );
      })
      .join("") +
    "</div>"
  );
}
function subject(id, rawWeek) {
  if (!BASE[id]) return courses();
  const w = Math.min(
    26,
    Math.max(1, Number(rawWeek) || Math.ceil(current().day / 6)),
  );
  return (
    pageHead(BASE[id][0] + "练习", weekTitles[w - 1], "PRACTICE ROOM") +
    '<div class="sectionRow filters"><div class="dateNav">' +
    (w > 1 ? link("subject/" + id + "/" + (w - 1), icon("left", 14)) : "") +
    "<b>第 " +
    w +
    " 周</b>" +
    (w < 26 ? link("subject/" + id + "/" + (w + 1), icon("right", 14)) : "") +
    "</div>" +
    link("courses", "全部学习日 " + icon("right", 14), "miniAction") +
    '</div><section class="panel"><div class="taskList">' +
    Array.from({ length: 6 }, (_, i) => {
      const d = (w - 1) * 6 + i + 1,
        b = getDay(d, curTrack()).blocks.find((x) => x.id === id);
      return taskRow(d, { ...b, title: "第 " + d + " 天 · " + b.title });
    }).join("") +
    "</div></section>"
  );
}
function report() {
  const sum = getSummary(),
    pending = incomplete(),
    days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i - 6);
      return [labelDate(d), sum.actual[labelDate(d)] || 0];
    }),
    max = Math.max(...days.map((a) => a[1]), 60);
  const weeksDone = Object.keys(sum.actual).length;
  return (
    pageHead(
      "学习报告",
      "实际学习日期和课程完成量分别统计。",
      "LEARNING REPORT",
    ) +
    '<div class="dashboard"><div class="column"><section class="panel panelBody"><h2 class="cardTitle">最近七天的学习时长</h2><div class="barGrid">' +
    days
      .map(
        ([d, s]) =>
          "<div><small>" +
          Math.round(s / 60) +
          ' 分</small><i style="height:' +
          Math.max(3, Math.round((s / max) * 57)) +
          'px"></i><span>' +
          esc(d.slice(5)) +
          "</span></div>",
      )
      .join("") +
    "</div></section>" +
    resumePanel() +
    '</div><aside class="column"><section class="panel sideCard"><h2 class="cardTitle">学习记录</h2><div class="ringInfo"><p><b>' +
    sum.finished +
    " / 624</b>已完成基础补练</p><p><b>" +
    pending.length +
    " 项</b>未完成任务</p><p><b>" +
    weeksDone +
    ' 天</b>有活动记录</p></div></section><section class="panel sideCard"><h2 class="cardTitle">阶段模拟</h2><p class="pageNote">两轮独立试题，听、说、读、写分科作答。</p>' +
    btn("mocks", "进入模拟考试", "green") +
    "</section></aside></div>"
  );
}
const route = () =>
  location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
const nav = (path) => {
  location.hash = path.startsWith("#") ? path : "#/" + path.replace(/^\//, "");
};
function shell() {
  const items = TABS.map(
    ([title, tabs]) =>
      '<div class="navGroup"><div class="navCaption">' +
      title +
      "</div>" +
      tabs
        .map(
          ([path, sym, label]) =>
            '<a class="navLink" data-nav="' +
            path +
            '" href="#/' +
            path +
            '">' +
            icon(sym, 18) +
            label +
            "</a>",
        )
        .join("") +
      "</div>",
  ).join("");
  document.querySelector("#shell").innerHTML =
    '<div class="shell"><button class="shade" aria-label="关闭导航"></button><aside class="sidebar">' +
    link(
      "home",
      '<img src="/assets/mark.svg" alt=""><span><strong>拾阶英语</strong><small>IELTS STUDIO</small></span>',
      "brand",
    ) +
    '<nav aria-label="学习导航">' +
    items +
    '</nav><div class="sideFoot"><a class="navLink" data-nav="settings" href="#/settings">' +
    icon("settings", 18) +
    '学习设置</a><div class="mini">' +
    icon("leaf", 15) +
    '我的学习空间</div></div></aside><div class="mainarea"><header class="topbar"><button class="menuToggle" aria-label="展开导航">' +
    icon("menu") +
    '</button><span class="mobileBrand">拾阶英语</span><div class="crumb">' +
    icon("book", 15) +
    " 学习空间 " +
    icon("right", 11) +
    '<b id="crumb"></b></div><div class="timebar"><span class="calendarDate">' +
    monthDay(new Date(), true) +
    "</span>" +
    link("settings", icon("user", 16), "avatar") +
    '</div></header><main class="content" id="main" tabindex="-1"></main></div></div>';
  document.querySelector(".menuToggle").onclick = () =>
    document.querySelector(".shell").classList.toggle("open");
  document.querySelector(".shade").onclick = () =>
    document.querySelector(".shell").classList.remove("open");
}
let dispose = () => {},
  version = 0;
async function render() {
  if (version > 0) {
    const hash = location.hash;
    await refreshSync();
    if (hash !== location.hash) return;
  }
  const run = ++version;
  dispose?.();
  dispose = () => {};
  indexAttempts();
  const [raw, a, b, attemptId] = route(),
    page = raw || "home",
    main = document.querySelector("#main");
  const name =
    {
      home: "学习工作台",
      courses: "全部课程",
      review: "复习本",
      report: "学习报告",
      mocks: "模拟考试",
      settings: "学习设置",
      day: "学习日",
      learn: "课程练习",
      subject: BASE[a]?.[0],
      reading: "阅读训练",
      listening: "听力精练",
      writing: "写作批改",
      speaking: "口语考场",
      words: a === "errors" ? "单词错题本" : "雅思核心词汇",
      quickreview: "每日复习",
      materials: "资料精练",
      dictation: "词汇听写",
      lexis: "学术词汇",
      accuracy: "语法与改写",
      mistakes: "雅思错题本",
    }[page] || "学习工作台";
  document.title = name + " · 拾阶英语";
  document.querySelector("#crumb").textContent = name;
  document.querySelector(".shell").classList.remove("open");
  const selected =
    page === "subject"
      ? "subject/" + a
      : page === "learn"
        ? "subject/" + b
        : page === "day"
          ? "courses"
          : page;
  document.querySelectorAll("[data-nav]").forEach((el) => {
    el.classList.toggle("active", el.dataset.nav === selected);
    if (el.dataset.nav === selected) el.setAttribute("aria-current", "page");
    else el.removeAttribute("aria-current");
  });
  window.scrollTo(0, 0);
  main.replaceChildren();
  main.dataset.route = route().join("/") || "home";
  try {
    const week = Number(a) || undefined;
    if (page === "reading") {
      const { mountReadingRoom } = await import("./reading-room.js");
      if (run === version)
        dispose = mountReadingRoom(main, {
          setId: a,
          question: b,
          attemptId,
          track: curTrack(),
          onNavigate: nav,
        });
      return;
    }
    if (page === "words") {
      const { mountCoreWords } = await import("./core-words.js");
      if (run === version)
        dispose = mountCoreWords(main, { unit: a, view: b, onNavigate: nav });
      return;
    }
    if (page === "quickreview") {
      const { mountQuickReview } = await import("./daily-review.js");
      if (run === version)
        dispose = mountQuickReview(main, {
          minutes: minutesFor(state().profile.dailyMinutes),
        });
      return;
    }
    if (page === "materials") {
      const { mountMaterials } = await import("./materials.js");
      if (run === version)
        dispose = mountMaterials(main, { unit: a, question: b });
      return;
    }
    if (page === "listening" || page === "lexis" || page === "dictation") {
      const { mountInputLab } = await import("./input-lab.js");
      if (run === version)
        dispose = mountInputLab(main, {
          mode: page,
          week,
          question: /^q\d+$/.test(b || "") ? Number(b.slice(1)) - 1 : undefined,
          attemptKey: attemptId ? decodeURIComponent(attemptId) : undefined,
          track: curTrack(),
          onNavigate: nav,
        });
      return;
    }
    if (page === "writing" || page === "speaking") {
      const { mountOutputLab } = await import("./output-lab.js");
      if (run === version)
        dispose = mountOutputLab(main, {
          mode: page,
          week,
          topic: b,
          track: curTrack(),
          onNavigate: nav,
        });
      return;
    }
    if (page === "accuracy") {
      const { mountGrammarRoom } = await import("./advanced-grammar.js");
      if (run === version)
        dispose = mountGrammarRoom(main, { unit: a, onNavigate: nav });
      return;
    }
    if (page === "day") {
      dispose = mountStudyDay(main, cleanDay(a));
      return;
    }
    if (page === "mistakes") {
      main.innerHTML =
        mistakesHtml() +
        '<p><a class="miniAction" href="#/review">打开基础词汇与语法复习本 →</a></p>';
      return;
    }
    if (page === "learn") {
      dispose = mountPlayer(main, {
        day: cleanDay(a),
        blockId: BASE[b] ? b : "vocab",
        track: curTrack(),
        onNavigate: nav,
        onUpdate: () => {},
      });
      return;
    }
    if (page === "review") {
      dispose = mountReview(main, { onNavigate: nav, onUpdate: () => {} });
      return;
    }
    if (page === "settings") {
      dispose = mountSettings(main, { provider: a });
      return;
    }
    if (page === "mocks") {
      let { mountMocks } = await import("./mocks.js");
      if (run === version)
        dispose = mountMocks(main, { onNavigate: nav, track: curTrack() });
      return;
    }
    main.innerHTML =
      page === "courses"
        ? courses(a) + resourcePanel()
        : page === "subject"
          ? subject(a, b) + resourcePanel(a)
          : page === "report"
            ? report()
            : deskHtml();
    if (page === "home") dispose = bindPacing(main, dayPlan);
    if (page === "report") {
      main
        .querySelector(".column")
        ?.insertAdjacentHTML(
          "afterbegin",
          labReportHtml() +
            '<details class="panel panelBody"><summary>基础补练诊断及模拟考记录</summary>' +
            skillsPanel(state(), getDay) +
            "</details>",
        );
      dispose = bindEvidence(main);
    }
  } catch (error) {
    console.error(error);
    main.innerHTML =
      '<section class="panel panelBody"><h2 class="cardTitle">这一页暂时无法载入</h2><p class="pageNote">刷新后可再次打开，已保存的练习会保留。</p>' +
      btn("home", "返回工作台") +
      "</section>";
  }
}
shell();
document.querySelector("#main").innerHTML =
  '<p class="pageNote">正在打开学习工作台…</p>';
await initSync();
window.addEventListener("hashchange", render);
subscribe(() => {
  const tag = document.getElementById("syncStatus");
  if (tag) tag.innerHTML = barStatus();
});
await render();
