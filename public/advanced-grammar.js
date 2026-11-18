import { esc, icon } from "./icons.js";
import {
  getState,
  saveAttempt,
  saveDraft,
  getDraft,
  saveReview,
} from "./sync.js";
import { cleanAnswer } from "./mock-format.js";
// target structure / context / constrained gap / accepted forms / editing prompt / example revision / why / transfer
export const grammarUnits = [
  [
    "限定结论",
    "Hedging a claim",
    "A pilot involved only 36 volunteers, all of whom chose their own shift. The night group slept less.",
    "The difference ___ be associated with working at night. Supply a modal that expresses possibility.",
    ["may", "might", "could"],
    "The study proves that night work always reduces sleep.",
    "The findings suggest that night work may be associated with shorter sleep among these volunteers.",
    "自选样本和非随机分组限制了因果推断。用 may be associated with 降低断言强度，再指明样本。",
    "Write a cautious two-sentence conclusion about a survey in which cyclists reported better health than drivers.",
  ],
  [
    "比较基数",
    "Comparing proportions",
    "In 2010, 25% of 800 commuters cycled. In 2020, 35% of 500 commuters cycled.",
    "The share of cyclists rose ___ ten percentage points.",
    ["by"],
    "Both the proportion and the number of cyclists increased.",
    "Although the proportion increased by ten percentage points, the number of cyclists fell from 200 to 175.",
    "占比上升不代表人数上升。by 表变化量，to 表终点；注意 percentage points。",
    "Write an overview of a group where participation went from 30% of 1,000 residents to 40% of 600.",
  ],
  [
    "让步与主句",
    "Concession",
    "A city extended library hours. Usage rose, yet most new visitors already used a different branch.",
    "___ the longer hours attracted visitors, the scheme did little to widen access. Use a conjunction.",
    ["although", "though", "while", "whilst"],
    "Despite the opening hours were extended, few new users joined.",
    "Although the opening hours were extended, few new users joined.",
    "although 后接完整句；despite 后接名词或动名词。保留让步与主要发现的先后关系。",
    "Argue for or against a four-day working week while conceding one genuine drawback.",
  ],
  [
    "反事实条件",
    "Counterfactuals",
    "An evaluator collected final scores but forgot to collect baseline scores. The project has ended.",
    "If the team ___ baseline scores, it could have estimated individual improvement.",
    ["had collected", "had recorded", "had measured"],
    "If they would have collected the first scores, the estimate would have been stronger.",
    "If they had collected baseline scores, the estimate would have been stronger.",
    "讨论未发生的过去条件，用 if + had + 过去分词；结果用 would/could have。",
    "Explain how the interpretation of a finished pilot would have changed if a control group had been included.",
  ],
  [
    "定语从句与指代",
    "Reference",
    "Two grant schemes operate in the same district. Only the larger scheme requires independent evaluation.",
    "The larger scheme, ___ requires an external review, costs more to administer.",
    ["which"],
    "The smaller scheme was cheaper than the larger one, which had no evaluation. The writer means the smaller scheme did not require evaluation.",
    "The smaller scheme, which did not require an evaluation, was cheaper to administer.",
    "非限定从句靠近被修饰的成分。改写后消除了 which 的错误指向。",
    "Compare two forms of workplace training and make the referent of each relative clause unambiguous.",
  ],
  [
    "同口径比较",
    "Comparable groups",
    "The salary of a nurse in town A is higher than the salary of a nurse in town B.",
    "The average salary in town A exceeded ___ in town B. Use a pronoun.",
    ["that"],
    "The salaries of senior teachers are higher than junior teachers.",
    "The salaries of senior teachers are higher than those of junior teachers.",
    "比较对象必须同类。that 和 those 可分别代替前述单数/复数名词，避免人与工资相比。",
    "Write a valid comparison of rent levels in two cities and another comparison of their residents.",
  ],
  [
    "主谓一致与中心词",
    "Agreement",
    "A council compares a set of responses from tenants and a series of interviews with landlords.",
    "The proportion of tenants who prefer longer leases ___ increased since 2018.",
    ["has"],
    "A series of interviews with local residents have raised an unexpected concern.",
    "A series of interviews with local residents has raised an unexpected concern.",
    "谓语与中心词 proportion 或 series 一致，不受介词短语中 tenants 或 interviews 影响。",
    "Summarise one changing percentage and one changing number of households using the appropriate verb forms.",
  ],
  [
    "不可数名词与数量",
    "Countability",
    "A researcher needs evidence and advice before she can recommend changes.",
    "We need two ___ of evidence before drawing a conclusion.",
    ["pieces", "items", "lines"],
    "The consultant gave us several useful advices about collecting informations.",
    "The consultant gave us useful advice about collecting information.",
    "advice、information、evidence 通常不可数。需要计数时用 suggestions、pieces of advice 或 sources of information。",
    "Write a short request asking a manager for two suggestions and for information about a new policy.",
  ],
  [
    "分词的逻辑主语",
    "Participial clauses",
    "Analysts corrected for age before comparing the results across regions.",
    "After ___ for age, the analysts repeated the comparison.",
    ["adjusting", "controlling", "correcting"],
    "Having adjusted for age, the results showed a smaller regional gap.",
    "Having adjusted for age, the analysts found a smaller regional gap.",
    "分词短语的执行者应是主句主语。results 自己不能调整年龄因素。",
    "Describe a team cleaning a dataset before reaching a new conclusion. Make the agent explicit.",
  ],
  [
    "范围与否定",
    "Scope of claims",
    "Eight schools installed solar panels, but only three shared output measurements.",
    "___ all participating schools disclosed their measurements. Supply one word.",
    ["not"],
    "None of the schools disclosed data. The intended meaning is that only some failed to do so.",
    "Not all of the schools disclosed data.",
    "not all 表部分否定；none 表全部否定。二者对 True/False/Not Given 有直接影响。",
    "Write two sentences that distinguish an absence of evidence from evidence that an event never occurred.",
  ],
  [
    "过去时与完成时",
    "Time and evidence",
    "A bus trial ended in 2019. A later survey runs from 2023 to the present.",
    "Since 2023, the council ___ feedback from passengers every month.",
    ["has collected", "has gathered", "has recorded", "has been collecting"],
    "In 2019 the pilot has ended, but since 2023 the city surveyed passengers regularly.",
    "The pilot ended in 2019, but the city has surveyed passengers regularly since 2023.",
    "已结束的具体时间用过去时；延续到现在的时间段可用现在完成时。",
    "Report one finished measurement and one trend that continues today using explicit dates.",
  ],
  [
    "平行结构",
    "Parallel structures",
    "The programme is intended to cut costs, improve access and simplify the booking system.",
    "The trial aims to reduce waiting times and ___ access. Supply one verb.",
    ["improve", "increase", "expand", "widen", "facilitate"],
    "The scheme involves training staff, replacing old equipment and to review complaints.",
    "The scheme involves training staff, replacing old equipment and reviewing complaints.",
    "并列项需要同一语法功能。involves 支配三个动名词短语。",
    "Describe three practical measures to improve local public transport in a single parallel sentence.",
  ],
  [
    "因果与条件",
    "Causal language",
    "Electricity use fell after a price increase, during a winter that was also unusually mild.",
    "A mild winter may ___ contributed to the decline.",
    ["have"],
    "The rise in prices caused the entire reduction, since the two events happened at the same time.",
    "Higher prices may have contributed to the reduction, although the mild winter offers another explanation.",
    "在竞争解释存在时区分观察顺序与因果；may have + 过去分词表达对过去的推断。",
    "Explain two possible reasons for a fall in office attendance without asserting either is proven.",
  ],
  [
    "让数据支撑概览",
    "Overview language",
    "Rail use increased steadily from 12% to 32%, while bus and car use each fell slightly.",
    "Rail was the only mode ___ share increased throughout the period.",
    ["whose"],
    "Every transport mode underwent dramatic changes, and rail was very good.",
    "Rail was the only mode whose share rose throughout the period, while the other two modes declined slightly.",
    "概览应说明主要方向与例外，使用 throughout、slightly 等与数据吻合的表达。",
    "Write a two-sentence overview of one rising category and two stable categories without explaining causes.",
  ],
  [
    "限定与非限定信息",
    "Defining groups",
    "Only contractors who operate heavy machinery need an additional licence. Other contractors can start work immediately.",
    "Contractors ___ operate heavy machinery must obtain an additional licence.",
    ["who", "that"],
    "Contractors, who operate heavy machinery, must obtain an additional licence.",
    "Contractors who operate heavy machinery must obtain an additional licence.",
    "去掉逗号后，定语从句只限定操作重型设备的那部分承包商，避免扩大规则范围。",
    "Write one rule for all students and a second rule that applies only to students on placement.",
  ],
  [
    "名词化与可读性",
    "Clear agency",
    "A committee postponed publication because two measurements needed independent checking.",
    "Publication was postponed pending independent ___ of two measurements.",
    ["verification", "confirmation", "validation", "checking"],
    "The implementation of the decision of the postponement of publication was made by members.",
    "The committee postponed publication until two measurements could be independently verified.",
    "名词化有时便于概括，但一串抽象名词会隐藏动作和主体。让主要动作成为谓语。",
    "Turn a vague statement about the implementation of monitoring into a clear sentence naming who does what and why.",
  ],
];
export function mountGrammarRoom(container, { unit, onNavigate } = {}) {
  let ix = Number(unit) - 1;
  if (!Number.isInteger(ix) || ix < 0 || ix >= grammarUnits.length) {
    container.innerHTML =
      '<header class="pageHead"><div><span class="eyebrow">IELTS LANGUAGE ACCURACY</span><h1>语法与论证精度</h1><p>用图表概览、研究结论和议论文改稿检验语法选择。</p></div></header><div class="weeksGrid">' +
      grammarUnits
        .map(
          (x, i) =>
            '<a class="panel paperCard" href="#/accuracy/' +
            (i + 1) +
            '"><span class="roundNum">' +
            esc(x[1]) +
            "</span><h2>" +
            esc(x[0]) +
            "</h2><p>" +
            esc(x[2]) +
            "</p></a>",
        )
        .join("") +
      "</div>";
    return () => {};
  }
  const u = grammarUnits[ix],
    key = "accuracy:" + ix,
    draft = key + ":edit",
    transfer = key + ":transfer";
  let a = getState().attempts[key] || {};
  const save = (patch) => {
    a = saveAttempt(key, {
      ...a,
      labArea: "grammar",
      labTitle: u[0],
      labRoute: "accuracy/" + (ix + 1),
      startedAt: a.startedAt || new Date().toISOString(),
      ...patch,
    });
  };
  function render() {
    container.innerHTML =
      '<a class="miniAction" href="#/accuracy">← 全部语法练习</a><header class="pageHead"><div><span class="eyebrow">' +
      esc(u[1]) +
      "</span><h1>" +
      esc(u[0]) +
      '</h1></div></header><div class="panel panelBody rowSet"><p class="scenarioText" lang="en">' +
      esc(u[2]) +
      '</p><div><span class="roundNum">01　语境填空</span><h3 lang="en">' +
      esc(u[3]) +
      '</h3><label class="field">填写缺失的英语表达<input data-gap value="' +
      esc(a.gap || "") +
      '"></label><button class="btn" data-check>核对表达</button><p class="formStatus" data-result>' +
      esc(
        a.checked
          ? (a.correct ? "答对。" : "请重新检查。") +
              " 可接受表达：" +
              u[4].join(" / ")
          : "",
      ) +
      '</p></div><div><span class="roundNum">02　编辑病句</span><blockquote lang="en">' +
      esc(u[5]) +
      '</blockquote><label class="field">用英文重写，保留原意<textarea data-edit rows="3">' +
      esc(getDraft(draft) || "") +
      "</textarea></label><details " +
      (a.shown ? "open" : "") +
      '><summary>对照一种改法与理由</summary><p lang="en">' +
      esc(u[6]) +
      "</p><p>" +
      esc(u[7]) +
      '</p></details></div><div><span class="roundNum">03　换题运用</span><p lang="en">' +
      esc(u[8]) +
      '</p><label class="field">你的新句子<textarea data-transfer rows="3">' +
      esc(getDraft(transfer) || "") +
      '</textarea></label></div><div class="inlineBtns"><button class="btn green" data-finish>保存本次练习</button><a href="#/accuracy" class="miniAction">全部练习 →</a></div><output data-status class="formStatus">' +
      (a.completed ? "已完成 · 改稿和新句子可继续修改。" : "") +
      "</output></div>";
  }
  function input(e) {
    if (e.target.matches("[data-edit]")) saveDraft(draft, e.target.value);
    else if (e.target.matches("[data-transfer]"))
      saveDraft(transfer, e.target.value);
    else if (e.target.matches("[data-gap]"))
      save({ gap: e.target.value, checked: false });
  }
  function click(e) {
    if (e.target.closest("[data-check]")) {
      const val = container.querySelector("[data-gap]").value;
      const ok = u[4].some((x) => cleanAnswer(x) === cleanAnswer(val));
      save({ gap: val, checked: true, correct: ok });
      if (!ok)
        saveReview("accuracy-" + ix, {
          word: u[0],
          meaning: u[7],
          example: u[6],
          labRoute: "accuracy/" + (ix + 1),
          due: new Date(Date.now() + 86400000).toISOString(),
        });
      render();
    }
    if (e.target.closest("[data-finish]")) {
      if (
        !a.checked ||
        !getDraft(draft)?.trim() ||
        !getDraft(transfer)?.trim()
      ) {
        container.querySelector("[data-status]").textContent =
          "先核对填空，再完成改稿和迁移题。";
        return;
      }
      save({
        completed: true,
        completedAt: a.completedAt || new Date().toISOString(),
      });
      render();
    }
  }
  container.addEventListener("input", input);
  container.addEventListener("click", click);
  if (!a.startedAt) save({});
  render();
  return () => {
    container.removeEventListener("input", input);
    container.removeEventListener("click", click);
  };
}
