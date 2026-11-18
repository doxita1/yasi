import { units } from "./material-lessons.js";
import { esc } from "./icons.js";
import {
  getState,
  saveAttempt,
  saveDraft,
  getDraft,
  saveReview,
} from "./sync.js";
import { cleanAnswer } from "./mock-format.js";

const refs = [
  [
    "核心词表（自测、答案）与精准词汇讲义",
    "自测有 13 页，配套答案 21 页。英译中能查出认识的词，却无法测出你能否在录音和作文里认出、拼出和选对它。",
    "先盲听，再选词完成研究结论。",
    "dictation/1",
  ],
  [
    "语法讲义与 34 段语法课",
    "讲义共 44 页。第 4 讲用非谓语扩展句子，第 10 讲处理平行结构，第 12 讲综合拆长句。根目录与课程目录中的讲义内容相同。",
    "先辨出谓语，再把长句改成两句准确的英文。",
    "materials/clauses",
  ],
  [
    "My IELTS 练习网站与 25 段词汇课",
    "现成网站把词条、音频和打字练习连在一起。其口语部分标作待开发，原版书录音也没有覆盖连续听力中的干扰项。",
    "在本站做整段听力，交卷后对照带时间点的原句。",
    "listening/1",
  ],
  [
    "个人错题与大小作文整理",
    "材料有图表概述、地图变化时态和论证展开的笔记。可以据此检查自己混淆的位置与年份。",
    "写一份市场平面图报告，把已经改建的设施和拟建工程分别表述。",
    "writing/0/a-map-market",
  ],
  [
    "作文范文整理与新东方作文套题",
    "范文 PDF 是 11 页图片。抽查的港口地图和利弊议论文可用于分析段落。压缩包有 7 套、每套两道题，配有题面和分析。样文分数缺少独立核验。",
    "限时交一稿，再逐段比较、改写和保存二稿。",
    "writing/1",
  ],
  [
    "2025 年 8 月口语预测",
    "26 页材料中有 Part 1 工作和家乡、Part 2 人物和物品，以及对应的 Part 3 讨论。它记录的是当时的话题。",
    "用原创新题限时说两分钟，再回答先前看不到的追问。",
    "speaking/1",
  ],
  [
    "四科指导与经验合集",
    "阅读指导第 8 页区分作者观点判断；写作指导讨论如何展开利弊。经验汇总中的模板缺少对具体题目和证据的约束。",
    "只根据文章给出的信息区分 NO 与 NOT GIVEN。",
    "materials/scope",
  ],
  [
    "30 天、两个月、三个月和 100 天计划",
    "30 天表安排每天 5–8 小时，两个月表中有每日约 3.5 小时的阶段。照搬进每天约 1 小时的学习日会挤掉订正。",
    "沿用本账户可跳天的 26 周安排，保留阶段复盘。",
    "courses",
  ],
  [
    "用 100 个句子记词与间隔复习表",
    "连贯语境适合练句法和辨义。记过一句话不能直接判定掌握了其中每个词。按真实作答日期复习，也更符合你跳天学习的用法。",
    "做完后到复习本查看按实际表现排期的词。",
    "review",
  ],
];
const link = (route, txt, css = "miniAction") =>
  '<a class="' + css + '" href="#/' + esc(route) + '">' + esc(txt) + " →</a>";
const keyFor = (u) => "material:" + u.id;
export function mountMaterials(el, { unit, question } = {}) {
  const u = units.find((x) => x.id === unit),
    state = getState();
  if (!u) {
    el.innerHTML =
      '<header class="pageHead"><div><span class="eyebrow">RESOURCE WORKSHOP</span><h1>资料精练</h1><p>从已有资料挑出值得练的考点，配上原创题面。选择一组即可动笔。</p></div></header><div class="weeksGrid">' +
      units
        .map((v, i) => {
          const s = state.attempts[keyFor(v)];
          return (
            '<a class="panel paperCard" href="#/materials/' +
            v.id +
            '"><span class="roundNum">专项 ' +
            (i + 1) +
            "</span><h2>" +
            esc(v.name) +
            '</h2><p lang="en">' +
            esc(v.words) +
            "</p><b>" +
            (s?.completed ? "查看订正" : s ? "继续训练" : "4 道题 + 1 次改写") +
            " →</b></a>"
          );
        })
        .join("") +
      '</div><section class="panel panelBody taskCard"><h2 class="cardTitle">哪些资料值得用，怎么用</h2><div class="sourceGrid">' +
      refs
        .map(
          ([title, why, how, r]) =>
            '<details class="sourceItem"><summary>' +
            esc(title) +
            "</summary><p>" +
            esc(why) +
            "</p><p>" +
            esc(how) +
            "</p>" +
            link(r, "打开对应练习") +
            "</details>",
        )
        .join("") +
      "</div></section>";
    return () => {};
  }
  const key = keyFor(u),
    draft = key + ":rewrite";
  let rec = state.attempts[key] || {},
    i = Math.max(0, Math.min(3, rec.itemIndex || 0)),
    message = "";
  if (/^q\d+$/.test(question || ""))
    i = Math.min(3, Math.max(0, Number(question.slice(1)) - 1));
  const save = (patch = {}) =>
    (rec = saveAttempt(key, {
      labArea: "materials",
      labTitle: u.name,
      labRoute: "materials/" + u.id,
      startedAt: rec.startedAt || new Date().toISOString(),
      ...patch,
    }));
  const words = (s) => String(s || "").match(/[a-z]+(?:['’\-][a-z]+)*/gi) || [];
  function render() {
    const [prompt, accept, why, opts] = u.tasks[i],
      record = rec.answers?.[i],
      checked = !!record?.submitted;
    const body = opts
      ? opts
          .split("|")
          .map(
            (o) =>
              '<label class="answerRadio"><input type="radio" name="mat" value="' +
              esc(o) +
              '" ' +
              (record?.text === o ? "checked " : "") +
              (checked ? "disabled" : "") +
              ">" +
              esc(o) +
              "</label>",
          )
          .join("")
      : '<label class="field">填入英文<input data-material-answer value="' +
        esc(record?.text || "") +
        '" ' +
        (checked ? "readonly" : "") +
        ' spellcheck="false" autocomplete="off"></label>';
    const all = u.tasks.every((_, n) => rec.answers?.[n]?.submitted);
    el.innerHTML =
      '<header class="pageHead"><div><a href="#/materials" class="miniAction">← 全部资料精练</a><h1>' +
      esc(u.name) +
      "</h1><p>" +
      esc(u.source) +
      '</p></div></header><div class="readSplit"><section class="panel panelBody"><span class="eyebrow">阅读情境</span><p lang="en" class="materialPassage">' +
      esc(u.text) +
      '</p><p class="pageNote">考点词　' +
      esc(u.words) +
      '</p></section><section class="panel panelBody"><span class="roundNum">QUESTION ' +
      (i + 1) +
      ' / 4</span><h2 class="cardTitle materialPrompt">' +
      esc(prompt) +
      "</h2>" +
      body +
      (checked
        ? '<div class="readFeedback ' +
          (record.correct ? "correct" : "") +
          '"><b>' +
          (record.correct ? "答对" : "需要订正") +
          "</b><p>参考答案　" +
          esc(accept.split("|").join(" / ")) +
          "</p><p>" +
          esc(why) +
          "</p></div>"
        : '<button data-act="check" class="btn green">核对答案</button>') +
      '<div class="numberGrid">' +
      u.tasks
        .map(
          (_, n) =>
            '<button data-jump="' +
            n +
            '" class="' +
            (i === n ? "current " : "") +
            (rec.answers?.[n]?.submitted ? "answered" : "") +
            '">' +
            (n + 1) +
            "</button>",
        )
        .join("") +
      '</div></section></div><section class="panel panelBody taskCard"><h2 class="cardTitle">迁移到自己的表达</h2><p>' +
      esc(u.transfer) +
      '</p><textarea data-material-draft class="planInputs" rows="4" placeholder="写下你的英文表达">' +
      esc(getDraft(draft) || "") +
      '</textarea><p><button class="btn green" data-act="finish">' +
      (rec.completed ? "保存修订" : "提交改写并看参考") +
      '</button></p><p role="status" data-msg>' +
      esc(message) +
      "</p>" +
      (rec.completed
        ? '<div class="readFeedback correct"><b>客观题首次作答　' +
          rec.correct +
          ' / 4</b><p lang="en">' +
          esc(u.model) +
          "</p><p>对照参考表达检查范围、时态和用词。你的改写已按账号保存。</p></div>"
        : "") +
      "</section>";
    if (!all && message) el.querySelector("[data-msg]").textContent = message;
  }
  function change(e) {
    if (e.target.matches("[data-material-draft]"))
      saveDraft(draft, e.target.value);
    else if (
      e.target.matches("[data-material-answer],input[name=mat]") &&
      !rec.answers?.[i]?.submitted
    )
      save({ answers: { ...rec.answers, [i]: { text: e.target.value } } });
  }
  function click(e) {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.jump !== undefined) {
      i = Number(b.dataset.jump);
      save({ itemIndex: i });
      message = "";
      render();
      return;
    }
    if (b.dataset.act === "check") {
      const text = rec.answers?.[i]?.text?.trim();
      if (!text) {
        b.textContent = "请先作答，再核对";
        return;
      }
      const [prompt, answers, why] = u.tasks[i],
        correct = answers
          .split("|")
          .some((a) => cleanAnswer(a) === cleanAnswer(text));
      save({
        itemIndex: i,
        answers: {
          ...rec.answers,
          [i]: {
            text,
            submitted: true,
            correct,
            submittedAt: new Date().toISOString(),
          },
        },
      });
      if (!correct)
        saveReview(key + ":" + i, {
          word: prompt,
          meaning: why,
          example: u.text,
          labRoute: "materials/" + u.id,
          labQuestion: i,
          category: "materials",
          due: new Date(Date.now() + 86400000).toISOString(),
        });
      render();
    }
    if (b.dataset.act === "finish") {
      const solved = u.tasks.every((_, j) => rec.answers?.[j]?.submitted);
      if (!solved || words(getDraft(draft)).length < 6) {
        message = !solved
          ? "请先核对上面的 4 道题。"
          : "请写出一句完整的英文表达（至少 6 个词）。";
        el.querySelector("[data-msg]").textContent = message;
        return;
      }
      save({
        completed: true,
        completedAt: rec.completedAt || new Date().toISOString(),
        correct: u.tasks.filter((_, j) => rec.answers[j].correct).length,
        graded: 4,
      });
      message = "改写已保存。";
      render();
    }
  }
  el.addEventListener("click", click);
  el.addEventListener("input", change);
  if (!rec.startedAt) save();
  render();
  return () => {
    el.removeEventListener("click", click);
    el.removeEventListener("input", change);
  };
}
