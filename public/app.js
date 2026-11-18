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
import { skillsPanel, bindEvidence, diagnosticCTA } from "./progress.js";

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
      ["courses", "layers", "全部课程"],
      ["review", "review", "复习本"],
      ["report", "chart", "学习报告"],
    ],
  ],
  [
    "专项练习",
    [
      ["subject/vocab", "words", "单词学习"],
      ["subject/grammar", "grammar", "语法学习"],
      ["subject/exam", "headphones", "雅思四科"],
      ["subject/work", "chat", "职场对话"],
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
  const rows = sessionLines(),
    seen = new Set(
      rows.filter((a) => a.completed).map((a) => a.day + ":" + a.blockId),
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
        (d === sel ? "sel " : "") + (completeBlocks(d) ? "learned" : ""),
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
function taskPanel(day) {
  const l = getDay(day, curTrack());
  return (
    '<section class="panel">' +
    section(
      "当天练习 <small>4 项</small>",
      link(
        "day/" + day,
        "第 " + day + " 天 " + icon("right", 13),
        "miniAction",
      ),
    ) +
    '<div class="taskList">' +
    l.blocks.map((b) => taskRow(day, b)).join("") +
    "</div></section>"
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
function dash() {
  const diagnostic = diagnosticCTA(state(), getDay);
  const ref = current(),
    day = ref.day,
    w = Math.ceil(day / 6),
    lesson = getDay(day, curTrack()),
    done = completeBlocks(day),
    sum = getSummary(),
    weekDone = Array.from({ length: 6 }, (_, i) =>
      completeBlocks((w - 1) * 6 + i + 1),
    ).reduce((a, b) => a + b, 0);
  const pct = Math.round((weekDone / 24) * 100),
    pf = state().profile;
  const title = ref.paused ? "继续上次的练习" : "开始今天的练习";
  return (
    pageHead(
      "学习工作台",
      "26 周学习计划 · 每周 6 天 · 每天约 60 分钟",
      "STUDY DESK",
      '<span class="syncPill" id="syncStatus">' + barStatus() + "</span>",
    ) +
    '<div class="dashboard"><div class="column"><section class="hero"><img class="heroArt" src="/assets/london.jpg" alt="伦敦钟楼与泰晤士河版画"><div class="heroText"><span class="heroLabel">' +
    icon("book", 13) +
    " 学习日 " +
    String(day).padStart(2, "0") +
    " / 156</span><h2>" +
    esc(lesson.title) +
    "</h2><p>第 " +
    w +
    " 周 · " +
    "4 项练习 · 约 60 分钟" +
    (ref.paused ? " · 第 " + ref.item + " 题" : "") +
    '</p><div class="heroActions">' +
    btn("learn/" + day + "/" + ref.id, title, "green") +
    (day < DAYS ? btn("day/" + (day + 1), "学习下一天", "", "right") : "") +
    "</div></div></section>" +
    taskPanel(day) +
    resumePanel() +
    '<section class="panel">' +
    section(
      "专项入口",
      link("courses", "全部课程 " + icon("right", 13), "miniAction"),
    ) +
    '<div class="gridTools">' +
    Object.entries(BASE)
      .map(([id, [name, sym]]) =>
        link("subject/" + id, icon(sym, 18) + name, "toolTile"),
      )
      .join("") +
    "</div></section></div>" +
    '<aside class="column"><section class="panel sideCard"><div class="sideCardHead"><h2 class="cardTitle">本周进度</h2><span class="roundNum">W' +
    String(w).padStart(2, "0") +
    '</span></div><div class="ringArea"><div class="ring" style="--angle:' +
    pct * 3.6 +
    'deg"><strong>' +
    pct +
    '%</strong></div><div class="ringInfo"><b>' +
    weekDone +
    ' / 24 项</b>本周已完成</div></div><div class="statPair"><div><strong>' +
    sum.studied +
    "</strong><span>已学习天数</span></div><div><strong>" +
    Math.round(Object.values(sum.actual).reduce((a, b) => a + b, 0) / 60) +
    "</strong><span>累计分钟</span></div></div></section>" +
    '<section class="panel sideCard"><div class="sideCardHead"><h2 class="cardTitle">本周学习日</h2>' +
    icon("calendar", 17) +
    "</div>" +
    weekStrip(w, day) +
    '<div class="mutedRow">可任选一天，未完成的课程随时续练。</div></section>' +
    '<section class="panel sideCard goalCard"><div class="sideCardHead"><h2 class="cardTitle">雅思目标</h2>' +
    icon("flag", 18) +
    '</div><div class="goal"><strong>' +
    Number(pf.targetBand).toFixed(1) +
    '</strong><span>总分目标</span></div><div class="sectionRow"><span class="mutedRow">单项至少 ' +
    esc(pf.minBand) +
    "</span>" +
    link("settings", "调整目标 " + icon("right", 13), "miniAction") +
    '</div><div class="goalDetail"><span>' +
    esc(diagnostic.status) +
    '</span><a class="miniAction" href="' +
    esc(diagnostic.href) +
    '">' +
    esc(diagnostic.label) +
    icon("right", 12) +
    "</a></div></section>" +
    '<section class="panel sideCard"><div class="sideCardHead"><h2 class="cardTitle">待复习</h2>' +
    icon("review", 18) +
    '</div><p class="pageNote">今天有 ' +
    listDueReviews().length +
    " 项词汇或语法需要回顾。</p>" +
    link("review", "打开复习本 " + icon("arrow", 14), "miniAction") +
    "</section></aside></div>"
  );
}
function dayPage(n) {
  const d = cleanDay(n),
    l = getDay(d, curTrack()),
    complete = completeBlocks(d);
  return (
    pageHead("第 " + d + " 天 · " + l.title, l.weekTitle, "LEARNING DAY") +
    '<div class="rowSet"><div class="sectionRow"><div class="dateNav">' +
    (d > 1 ? link("day/" + (d - 1), icon("left", 16)) : "") +
    "<span>第 " +
    d +
    " / 156 天</span>" +
    (d < DAYS ? link("day/" + (d + 1), icon("right", 16)) : "") +
    "</div>" +
    btn(
      "learn/" + d + "/" + nextUnit(d),
      complete === 4 ? "再次练习" : "继续这一天",
      "green",
    ) +
    "</div>" +
    taskPanel(d) +
    "</div>"
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
      "26 周 · 156 个学习日。选中任意一天，即可打开它的四项练习。",
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
          weekStrip(w, current().day) +
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
    " / 624</b>已完成课程任务</p><p><b>" +
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
  const [raw, a, b] = route(),
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
      dispose = mountSettings(main);
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
            : page === "day"
              ? dayPage(a)
              : dash();
    if (page === "report") {
      main
        .querySelector(".column")
        ?.insertAdjacentHTML("afterbegin", skillsPanel(state(), getDay));
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
