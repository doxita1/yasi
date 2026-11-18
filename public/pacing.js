import { getState, updateProfile } from "./sync.js";
import { esc, icon } from "./icons.js";

export function minutesFor(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 5 && n <= 180 ? n : 30;
}
export function division(minutes) {
  const total = minutesFor(minutes);
  const review = Math.min(15, Math.max(2, Math.round(total / 4)));
  return { review, practice: total - review };
}
function body(day, plan) {
  const minutes = minutesFor(getState().profile.dailyMinutes),
    { review, practice } = division(minutes);
  const options = [...new Set([15, 20, 30, 45, 60, minutes])].sort(
    (a, b) => a - b,
  );
  return (
    '<div class="sectionRow"><h2 class="cardTitle">今天的练习和复习</h2><label class="paceControl">每日建议 <select data-pace aria-label="每日建议时长">' +
    options
      .map(
        (n) =>
          '<option value="' +
          n +
          '" ' +
          (n === minutes ? "selected" : "") +
          ">" +
          n +
          " 分钟</option>",
      )
      .join("") +
    '</select></label></div><p class="pageNote">任选一项开始。今天做到哪里，下次从那里继续。</p><div class="pacePaths"><a href="#/quickreview"><span>' +
    icon("review", 17) +
    " 复习约 " +
    review +
    ' 分钟</span><b>回忆词汇与错题 →</b></a><a href="#/' +
    esc(plan.route) +
    '"><span>' +
    icon("clock", 17) +
    " 专项约 " +
    practice +
    " 分钟</span><b>" +
    esc(plan.name) +
    ' →</b></a></div><div class="sectionRow paceFooter"><a class="miniAction" href="#/dictation/' +
    Math.ceil(day / 6) +
    '">单独练本周听写 →</a><a class="miniAction" href="#/settings">自定时长 →</a></div>'
  );
}
export const pacingHtml = (d, p) =>
  '<section class="panel panelBody paceCard" data-pace-day="' +
  d +
  '">' +
  body(d, p) +
  "</section>";
export function bindPacing(container, dayPlan) {
  const apply = (e) => {
    if (!e.target.matches("[data-pace]")) return;
    const n = minutesFor(e.target.value),
      area = e.target.closest("[data-pace-day]"),
      day = Number(area.dataset.paceDay);
    updateProfile({ dailyMinutes: n });
    area.innerHTML = body(day, dayPlan(day));
    area.querySelector("[data-pace]").focus();
  };
  container.addEventListener("change", apply);
  return () => container.removeEventListener("change", apply);
}
