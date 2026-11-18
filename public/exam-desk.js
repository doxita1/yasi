import { pacingHtml, bindPacing } from "./pacing.js";
import { icon, esc } from "./icons.js";
import { getDay, weekTitles } from "./curriculum.js";
import { readingSets } from "./reading-lab.js";
import { grammarUnits } from "./advanced-grammar.js";
import { scenarios } from "./lesson-scenarios.js";
import { getState, saveAttempt, saveDraft, getDraft } from "./sync.js";
const WEEKS = 26,
  LIMIT = 156;
const now = () => new Date().toISOString();
const sortRecent = (a, b) =>
  String(b.updatedAt || b.startedAt || "").localeCompare(
    a.updatedAt || a.startedAt || "",
  );
const attempts = () => Object.values(getState().attempts || {});
const siteTrack = () =>
  getState().profile.track === "general" ? "general" : "academic";
const actions = [
  ["reading", "book", "阅读", "整篇计时 · 判断、匹配、限词填空", "exam"],
  [
    "listening",
    "headphones",
    "听力",
    "一次播放 · 信息更正、干扰项与听写",
    "vocab",
  ],
  ["writing", "pen", "写作", "Task 1 / 2 · 限时初稿、量表与二稿", "grammar"],
  ["speaking", "mic", "口语", "Part 1–3 · 录音、临场追问与回听", "work"],
];
const aLink = (route, txt, css = "") =>
  '<a href="#/' + esc(route) + '" class="' + css + '">' + txt + "</a>";
const button = (route, label, main = false) =>
  aLink(
    route,
    esc(label) + " " + icon("arrow", 15),
    "btn " + (main ? "green" : ""),
  );
const fmt = (v) => String(v).padStart(2, "0");
const routeOf = (a) => String(a.labRoute || "").replace(/^#?\//, "");
export function dayPlan(n) {
  const day = Math.max(1, Math.min(LIMIT, Number(n) || 1)),
    w = Math.ceil(day / 6),
    i = (day - 1) % 6,
    topic = weekTitles[w - 1],
    scenario = scenarios[w - 1],
    isGT = siteTrack() === "general",
    setList = readingSets.filter((s) => s.track === siteTrack());
  const passage =
    setList[(w - 1) % Math.max(1, setList.length)] || readingSets[0];
  const ac = grammarUnits[(w - 1) % grammarUnits.length];
  const options = [
    [
      "限时阅读与证据定位",
      "reading/" + passage.id,
      passage.title,
      "做完整篇并交卷。选一道判断题，写出题干与原文的同义表达，再解释最容易误选的答案。",
    ],
    [
      "听力精练与干扰项",
      "listening/" + w,
      "Part 2–4 · 精确听辨",
      "做完限词填空和选择题，再写下两个“先提出、后否定或修正”的信息及最终答案。",
    ],
    [
      "真实口语与抽象追问",
      "speaking/" + w,
      "Speaking · Part 1 / 2 / 3",
      "保存一轮录音。针对这一周的话题，用英语概括自己的观点，再写一个可能使你改变看法的反例。",
    ],
    [
      "限时写作与二稿",
      "writing/" + w,
      "Writing · " + (isGT ? "General Training" : "Academic"),
      "完成写作任务并保留两稿。摘录你主动改过的一句话，用中文说明这次改动解决了哪个问题。",
    ],
    [
      "学术表达与准确性",
      w % 2
        ? "materials/" +
          ["evidence", "rates", "clauses", "forms", "scope", "work"][
            Math.floor((w - 1) / 2) % 6
          ]
        : "accuracy/" + (((w - 1) % grammarUnits.length) + 1),
      w % 2 ? "资料精练 · 在上下文中辨义和改写" : ac[0],
      "完成句子纠错，把目标结构用于本周议题：" + scenario[2],
    ],
    [
      w >= 23 ? "阶段模拟与复盘" : "综合复测与迁移",
      w >= 23 ? "mocks" : "lexis/" + w,
      w >= 23 ? "完整模拟 · 按分科安排" : "搭配、改写与工作场景",
      "完成一项限时练习后，用两到三句英文回答：" +
        scenario[2] +
        " 加入一个具体条件或例外。",
    ],
  ];
  const [name, route, sub, transfer] = options[i];
  return { day, w, i, topic, name, route, sub, transfer };
}
const actualDate = () => {
  const d = new Date();
  return [d.getFullYear(), fmt(d.getMonth() + 1), fmt(d.getDate())].join("-");
};
function sessionName(a) {
  return (
    a.labTitle ||
    (a.blockId
      ? "第 " +
        a.day +
        " 天 · " +
        ({ vocab: "单词", grammar: "语法", exam: "雅思专项", work: "职场沟通" }[
          a.blockId
        ] || a.blockId)
      : "学习任务")
  );
}
function resumeList() {
  return attempts()
    .filter(
      (a) =>
        !a.completed && (a.labRoute || (a.day && a.blockId)) && !a.planTransfer,
    )
    .sort(sortRecent);
}
function sectionCompleted(p) {
  return attempts().some(
    (a) =>
      a.completed &&
      !a.planTransfer &&
      (routeOf(a) === p.route ||
        routeOf(a).startsWith(p.route + "/") ||
        (p.route === "mocks" && a.mock)),
  );
}
export function isDayDone(n) {
  const entry = getState().attempts["examday:" + n];
  return (
    !!entry &&
    (entry.completed || (entry.transferDone && sectionCompleted(dayPlan(n))))
  );
}
export function currentStudyDay() {
  return (
    Array.from({ length: LIMIT }, (_, i) => i + 1).find((i) => !isDayDone(i)) ||
    LIMIT
  );
}
export function deskHtml() {
  const store = getState(),
    skills = attempts().filter((a) => a.labRoute && !a.planTransfer),
    done = skills.filter((a) => a.completed),
    pending = resumeList(),
    recent = pending.find((a) => a.labRoute);
  const first =
    readingSets.find(
      (s) =>
        s.track === siteTrack() &&
        !skills.some((x) => x.readingSet === s.id && x.completed),
    ) ||
    readingSets.find((s) => s.track === siteTrack()) ||
    readingSets[0];
  const startRoute = recent
    ? routeOf(recent) || "learn/" + recent.day + "/" + recent.blockId
    : "reading/" + first.id;
  const day = currentStudyDay(),
    w = Math.ceil(day / 6),
    cases = Object.values(store.review || {}).filter((x) => x.labRoute);
  const currentLabel = recent ? "继续上次的练习" : "开始限时阅读";
  const correct = done.filter(
    (a) =>
      Number.isFinite(a.correct) && Number.isFinite(a.graded) && a.graded > 0,
  );
  const graded = correct.reduce((s, a) => s + a.graded, 0),
    right = correct.reduce((s, a) => s + a.correct, 0);
  const sync =
    {
      synced: "进度已同步",
      pending: "等待同步",
      offline: "待联网同步",
      local: "本机保存",
    }[store.syncStatus] || "正在同步";
  return (
    '<header class="pageHead"><div><span class="eyebrow">IELTS STUDY DESK</span><h1>雅思备考工作台</h1><p>目标总分 ' +
    esc(store.profile.targetBand) +
    " · 单项 " +
    esc(store.profile.minBand) +
    ' · 26 周学习计划</p></div><span class="syncPill" id="syncStatus"><i class="dot"></i>' +
    sync +
    '</span></header><div class="dashboard"><div class="column"><section class="hero trainingHero"><img class="heroArt" src="/assets/london.jpg" alt="伦敦钟楼版画"><div class="heroText"><span class="heroLabel">' +
    icon(recent ? "clock" : "book", 13) +
    " " +
    (recent
      ? "上次停在这里"
      : (siteTrack() === "general" ? "GENERAL TRAINING" : "ACADEMIC") +
        " · READING") +
    "</span><h2>" +
    esc(recent ? sessionName(recent) : "20 分钟阅读诊断") +
    '</h2><p class="topicLine">' +
    esc(recent ? "Resume your practice" : first.title) +
    "</p><p>" +
    esc(
      recent
        ? "作答与标记已保存，可接着完成。"
        : first.paragraphs.reduce((n, p) => n + p.text.split(/\s+/).length, 0) +
            " 词原文 · " +
            first.groups.reduce((n, g) => n + g.questions.length, 0) +
            " 道题 · 逐题证据解析",
    ) +
    '</p><div class="heroActions">' +
    button(startRoute, currentLabel, true) +
    button("day/" + Math.min(day + 1, LIMIT), "学习下一天") +
    "</div></div></section>" +
    pacingHtml(day, dayPlan(day)) +
    '<div><div class="sectionRow" style="margin-bottom:12px"><h2 class="cardTitle">雅思四科训练</h2>' +
    aLink("mocks", "进入整卷模考 " + icon("right", 14), "miniAction") +
    '</div><div class="skillShelf">' +
    actions
      .map(([r, s, name, detail, tint]) =>
        aLink(
          r,
          '<span class="sectionRow"><span class="tileIcon ' +
            tint +
            '">' +
            icon(s, 19) +
            "</span>" +
            icon("right", 14) +
            "</span><h3>" +
            name +
            "</h3><p>" +
            detail +
            "</p>",
          "skillPath panel",
        ),
      )
      .join("") +
    '</div></div><section class="panel panelBody"><div class="sectionRow"><h2 class="cardTitle">本学习日安排</h2>' +
    aLink("courses", "全部课程 " + icon("right", 13), "miniAction") +
    '</div><p class="pageNote">第 ' +
    day +
    " 天 · " +
    dayPlan(day).name +
    '。进入当天计划查看专项与迁移任务。</p><div class="paperOptions">' +
    button("day/" + day, "打开学习日") +
    button("lexis", "学术词汇") +
    button("accuracy", "语法与改写") +
    button("materials", "资料精练") +
    '</div></section></div><aside class="column"><section class="panel sideCard"><div class="sideCardHead"><h2 class="cardTitle">我的备考记录</h2>' +
    icon("chart", 18) +
    '</div><div class="labStats"><span><b>' +
    done.length +
    "</b><small>已交专项</small></span><span><b>" +
    (graded ? Math.round((right / graded) * 100) + "%" : "—") +
    "</b><small>专项客观题正确率</small></span></div>" +
    aLink("report", "查看学习报告 " + icon("arrow", 14), "miniAction") +
    '</section><section class="panel sideCard"><div class="sideCardHead"><h2 class="cardTitle">本周学习日</h2><span class="roundNum">W' +
    fmt(w) +
    '</span></div><div class="weekStrip">' +
    Array.from({ length: 6 }, (_, i) => {
      const n = (w - 1) * 6 + i + 1;
      return aLink(
        "day/" + n,
        "<span>Day</span><i>" + fmt(n) + "</i>",
        (n === day ? "sel " : "") + (isDayDone(n) ? "learned" : ""),
      );
    }).join("") +
    '</div><span class="mutedRow">提前学习和回补都保留进度。</span></section><section class="panel sideCard goalCard"><div class="sideCardHead"><h2 class="cardTitle">错题与薄弱点</h2>' +
    icon("target", 18) +
    '</div><p class="pageNote">' +
    (cases.length
      ? "已收录 " + cases.length + " 条待复盘的考点。"
      : "在读听练习中交卷后，对照证据复盘错题。") +
    "</p>" +
    aLink("mistakes", "进入雅思错题本 " + icon("arrow", 14), "miniAction") +
    "</section>" +
    (pending.length
      ? '<section class="panel sideCard"><h2 class="cardTitle">未完成的练习</h2>' +
        pending
          .slice(0, 4)
          .map((a) =>
            aLink(
              routeOf(a) || "learn/" + a.day + "/" + a.blockId,
              esc(sessionName(a)) + " →",
              "resumeItem",
            ),
          )
          .join("") +
        "</section>"
      : "") +
    "</aside></div>"
  );
}
export function mountStudyDay(container, n) {
  const p = dayPlan(n),
    key = "examday:" + p.day,
    topicKey = key + ":response",
    state = getState(),
    a = state.attempts[key] || {},
    d = getDay(p.day, state.profile.track),
    date = actualDate();
  const existing = () => sectionCompleted(p);
  const extraDone = (id) =>
    attempts().some((a) => a.day === p.day && a.blockId === id && a.completed);
  container.innerHTML =
    '<header class="pageHead"><div><span class="eyebrow">WEEK ' +
    fmt(p.w) +
    " / DAY " +
    fmt(p.day) +
    "</span><h1>" +
    esc(p.name) +
    "</h1><p>本周迁移话题 · " +
    esc(p.topic) +
    '</p></div></header><div class="sectionRow"><div class="dateNav">' +
    (p.day > 1 ? aLink("day/" + (p.day - 1), icon("left", 14)) : "") +
    "<b>第 " +
    p.day +
    " / 156 天</b>" +
    (p.day < LIMIT ? aLink("day/" + (p.day + 1), icon("right", 14)) : "") +
    "</div>" +
    aLink("courses", "全部课程 →", "miniAction") +
    "</div>" +
    pacingHtml(p.day, p) +
    '<section class="panel panelBody taskCard"><span class="eyebrow">01 · 专项训练</span><h2>' +
    esc(p.sub) +
    '</h2><p class="pageNote">按自己有空的时间练，可以分几天完成。重遇同一资料时，复核上一次的错误与证据。</p>' +
    button(p.route, existing() ? "重看已交专项" : "进入" + p.name, true) +
    '</section><section class="panel panelBody taskCard"><span class="eyebrow">02 · 迁移与订正</span><h2>把今天的考点用一次</h2><p>' +
    esc(p.transfer) +
    '</p><textarea data-plan rows="4" class="planInputs" placeholder="写下证据、订正或自己的表达">' +
    esc(getDraft(topicKey) || "") +
    '</textarea><div class="sectionRow"><small class="mutedRow">输入时自动保存</small><button data-done class="btn green">完成今日复盘</button></div><p class="formStatus" data-message>' +
    (isDayDone(p.day)
      ? "专项与复盘均已完成。"
      : a.transferDone
        ? "复盘已保存，完成专项后计入学习日。"
        : "") +
    '</p></section><section class="panel panelBody"><details><summary>词汇、语法与职场基础补练</summary><div class="taskList">' +
    d.blocks
      .map((b) =>
        aLink(
          "learn/" + p.day + "/" + b.id,
          '<span class="taskName">' +
            esc(b.title) +
            '</span><span class="taskEnd">' +
            (extraDone(b.id) ? "已完成 · " : "") +
            b.minutes +
            " 分钟 " +
            icon("right", 14) +
            "</span>",
          "task",
        ),
      )
      .join("") +
    "</div></details></section>";
  const txt = container.querySelector("[data-plan]"),
    msg = container.querySelector("[data-message]");
  txt.addEventListener("input", () => saveDraft(topicKey, txt.value));
  container.querySelector("[data-done]").onclick = () => {
    if (!txt.value.trim()) {
      msg.textContent = "先写下本次订正或迁移回答。";
      return;
    }
    saveAttempt(key, {
      ...a,
      day: p.day,
      labTitle: p.name,
      labRoute: "day/" + p.day,
      planTransfer: true,
      transferDone: true,
      completed: existing(),
      completedAt: existing() ? a.completedAt || now() : null,
      linkedSectionCompleted: existing(),
      studyDate: date,
    });
    msg.textContent = existing()
      ? "专项与复盘均已完成。"
      : "复盘已保存，完成专项后计入学习日。";
  };
  return bindPacing(container, dayPlan);
}
export function mistakesHtml() {
  const store = getState(),
    items = Object.entries(store.review || {})
      .filter(([, a]) => a.labRoute)
      .sort((a, b) =>
        String(b[1].updatedAt || "").localeCompare(a[1].updatedAt || ""),
      );
  return (
    '<header class="pageHead"><div><span class="eyebrow">ERROR LOG</span><h1>雅思错题本</h1><p>回到原题检查证据，再用新题验证同一个考点。</p></div></header>' +
    (items.length
      ? '<div class="rowSet">' +
        items
          .map(
            ([k, a]) =>
              '<section class="panel panelBody"><b>' +
              esc(a.word || a.labTitle || "专项错题") +
              '</b><p class="pageNote">' +
              esc(a.meaning || "") +
              "</p>" +
              (a.example
                ? '<blockquote lang="en">' + esc(a.example) + "</blockquote>"
                : "") +
              aLink(
                routeOf(a) +
                  (Number.isInteger(a.labQuestion)
                    ? "/q" +
                      (a.labQuestion + 1) +
                      (a.labAttempt
                        ? "/" + encodeURIComponent(a.labAttempt)
                        : "")
                    : ""),
                "回到原题 " + icon("right", 14),
                "miniAction",
              ) +
              "</section>",
          )
          .join("") +
        "</div>"
      : '<section class="panel panelBody"><h2 class="cardTitle">还没有已记录的错题</h2><p class="pageNote">先做一篇限时阅读，交卷后错题会出现在这里。</p>' +
        button("reading", "选择阅读材料", true) +
        "</section>")
  );
}
export function labReportHtml() {
  const all = attempts()
    .filter((a) => a.labRoute && !a.planTransfer)
    .sort(sortRecent);
  const month = all.filter(
    (a) =>
      Date.now() - Date.parse(a.completedAt || a.updatedAt) < 28 * 86400000,
  );
  const card = actions
    .map(([path, , name]) => {
      const done = month.filter(
        (a) => routeOf(a).split("/")[0] === path && a.completed,
      );
      const n = done.reduce(
          (s, a) => s + (Number.isFinite(a.graded) ? a.graded : 0),
          0,
        ),
        right = done.reduce(
          (s, a) => s + (Number.isFinite(a.correct) ? a.correct : 0),
          0,
        );
      return aLink(
        path,
        "<b>" +
          name +
          "</b><small>" +
          (done.length
            ? done.length +
              " 次提交" +
              (n
                ? " · " + right + "/" + n + " 答对"
                : " · 可查看表达与修订记录")
            : "尚缺已交样本 · 进入训练") +
          "</small>",
        "resumeItem",
      );
    })
    .join("");
  return (
    '<section class="panel panelBody"><h2 class="cardTitle">最近四周 · 四科表现</h2>' +
    card +
    '</section><section class="panel panelBody"><h2 class="cardTitle">雅思专项记录</h2>' +
    (all.length
      ? all
          .slice(0, 20)
          .map((a) =>
            aLink(
              routeOf(a),
              "<b>" +
                esc(sessionName(a)) +
                "</b><small>" +
                esc(a.completed ? "已完成" : "进行中") +
                (typeof a.correct === "number" && a.graded
                  ? " · 客观题 " + a.correct + " / " + a.graded
                  : "") +
                "</small>",
              "resumeItem",
            ),
          )
          .join("")
      : '<p class="pageNote">首次限时作答后会记录材料、用时与提交结果。阅读单篇原始分不折算成雅思总分。</p>') +
    "</section>"
  );
}
