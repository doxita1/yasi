import { scenarios } from "./lesson-scenarios.js";
import { cases } from "./lesson-cases.js";
import { charts, letters, essays } from "./output-writing.js";
import { marketMap, mapRubric } from "./output-map.js";
import { speakingThemes } from "./output-speaking.js";
import {
  warmups,
  weeklyPositions,
  letterParagraphs,
} from "./output-week-prompts.js";

export const sourceLinks = {
  writing: [
    "IELTS 官方写作任务与评分依据",
    "https://ielts.org/take-a-test/preparation-resources/writing-test-resources",
  ],
  speaking: [
    "IELTS 官方口试流程",
    "https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-speaking",
  ],
  bands: [
    "IELTS 官方评分维度",
    "https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail",
  ],
};
export const criteria = {
  map: mapRubric,
  chart: [
    [
      "任务完成",
      "提炼总体趋势或显著区别，精选数据进行有单位的比较。逐行抄录会掩盖全局。",
    ],
    ["连贯与衔接", "按有共同趋势的类别或有意义的时期分组，每段围绕一条比较。"],
    [
      "词汇资源",
      "区分人数、比例、百分比变化和百分点；选用意义精确的变化动词。",
    ],
    [
      "语法多样性与准确性",
      "比较句、从句与复杂名词短语应帮助表达关系。检查主谓一致、年份对应时态和比较对象。",
    ],
  ],
  letter: [
    [
      "任务完成",
      "写清写信目的，充分展开题目中的三个要点，语气符合收信人与关系。",
    ],
    [
      "连贯与衔接",
      "背景、实际影响和请求按读者处理事情的顺序展开，每段职责清楚。",
    ],
    ["词汇资源", "使用契合场景与礼貌程度的搭配，把笼统评价换成可执行的请求。"],
    [
      "语法多样性与准确性",
      "交代事实时保持时态清楚；用条件句、情态动词和从句准确控制语气。",
    ],
  ],
  essay: [
    [
      "任务回应",
      "回应指令中的每一部分，保持清晰立场。用机制、例证或反例展开关键判断并解释边界。",
    ],
    [
      "连贯与衔接",
      "每段围绕一个中心论点，证据后明确其意义；检查指代是否清楚。",
    ],
    [
      "词汇资源",
      "用准确搭配表达细微区别，删去空泛的高级词；重复必要的术语比错误同义替换更可靠。",
    ],
    [
      "语法多样性与准确性",
      "有目的地结合简单句、条件句和让步结构。检查限定词范围、修饰语和句子边界。",
    ],
  ],
  speaking: [
    [
      "流利度与连贯性",
      "能持续回应，并用细节或原因推进话题。回听停顿是否频繁打断意思，转折是否能跟上。",
    ],
    [
      "词汇资源",
      "能在词一时想不起时换一种方式解释，保持意义具体；留意题材相关的自然搭配。",
    ],
    [
      "语法多样性与准确性",
      "叙事、假设和比较可使用不同结构。回看时间线、复数、主谓一致等细节。",
    ],
    [
      "发音",
      "听原始录音检查关键词重音、意群、节奏和可懂度。只能看到文字时，将本维度记为缺少声音证据。",
    ],
  ],
};
const specificCharts = {
  11: {
    table: [
      ["Activity", "April", "May", "June"],
      ["Completed repairs", 80, 100, 90],
      ["Enquiries", 96, 110, 125],
    ],
    overview:
      "Enquiries rose throughout, while completed repairs peaked in May and then fell. The gap was largest in June (125 enquiries versus 90 repairs).",
  },
  14: {
    table: [
      ["Supplier", "Items (£)", "Delivery (£)", "Storage (£)"],
      ["A", 180, 30, 40],
      ["B", 210, 0, 0],
    ],
    overview:
      "Supplier A has the cheaper goods, yet its additional fees take its total to £250, above Supplier B's £210.",
  },
  18: {
    table: [
      ["Month", "Sent", "Returned"],
      ["1", 100, 64],
      ["2", 120, 90],
      ["3", 125, 100],
    ],
    overview:
      "Both dispatches and returns increased. The return rate rose from 64% to 80%, with returns growing faster than dispatches.",
  },
  19: {
    table: [
      ["Stage", "Solved", "Could not yet solve"],
      ["Before practice", 8, 16],
      ["After one round", 14, 10],
      ["After varied practice", 19, 5],
    ],
    overview:
      "The share solving a new case increased at each stage, from 8 out of 24 to 19 out of 24, while the number unable to solve it fell.",
  },
  20: {
    table: [
      ["Plan", "Repairs (£)", "Room hire (£)", "Refunds (£)"],
      ["A", 800, 220, 150],
      ["B", 930, 80, 0],
    ],
    overview:
      "Plan B has the higher repair bill but the lower total expense (£1,010 versus £1,170), because savings elsewhere exceed the extra repair cost.",
  },
  22: {
    table: [
      ["Alternative to cycling", "Trips", "Share of 80 (%)"],
      ["Car", 34, 42.5],
      ["Walking", 26, 32.5],
      ["Bus", 15, 18.75],
      ["No trip", 5, 6.25],
    ],
    overview:
      "Driving was the largest single alternative (34 of 80), but fewer than half would have driven. The remaining answers included walking, public transport and trips that would not occur.",
  },
  23: {
    table: [
      ["Criterion", "Met", "Did not meet"],
      ["Clear reasoning", 19, 11],
      ["Accurate detail", 24, 6],
      ["Revised decision", 15, 15],
    ],
    overview:
      "Accurate detail was the most widely met criterion (24 of 30), while only half the candidates revised their decision. The same candidate can meet several criteria.",
  },
  24: {
    table: [
      ["Month", "Bookings", "Attendance"],
      ["May", 80, 52],
      ["June", 85, 68],
      ["July", 90, 76],
    ],
    overview:
      "Both bookings and attendance rose. Attendance grew faster, narrowing the gap between the two from 28 in May to 14 in July.",
  },
  25: {
    table: [
      ["Group", "First draft", "Revision", "New task"],
      ["A", 11, 14, 12],
      ["B", 11, 16, 13],
    ],
    overview:
      "Both groups earned their highest mean score on the revision. Group B gained more and remained ahead on the new task, although neither group sustained its peak.",
  },
  26: {
    table: [
      ["Month", "Visitors", "Repairs"],
      ["1", 30, 18],
      ["3", 52, 30],
      ["6", 90, 45],
    ],
    overview:
      "Visitor and repair counts both rose, but visitors tripled while repairs rose by a factor of 2.5. Repair totals alone do not show how many visitors learned a new skill.",
  },
};
function buildChart(week) {
  const [title, ...series] = scenarios[week - 1][3].split(" | ");
  const selected = specificCharts[week];
  let table, overview;
  if (selected) ({ table, overview } = selected);
  else {
    const parsed = series.map((v) => {
      const [, label, a, b] = v.match(/^(.+):\s*(\d+)\s*→\s*(\d+)$/);
      return [label, Number(a), Number(b)];
    });
    const byChange = [...parsed].sort(
      (a, b) => Math.abs(b[2] - b[1]) - Math.abs(a[2] - a[1]),
    );
    const [label, a, b] = byChange[0],
      [second, x, y] = byChange[1];
    const maxFinal = Math.max(...parsed.map((row) => row[2]));
    const leaders = parsed
      .filter((row) => row[2] === maxFinal)
      .map((row) => row[0]);
    table = [
      ["Category", "First observation", "Second observation"],
      ...parsed,
    ];
    overview =
      label +
      " recorded " +
      (Math.abs(byChange[0][2] - byChange[0][1]) ===
      Math.abs(byChange[1][2] - byChange[1][1])
        ? "one of the largest absolute changes"
        : "the largest absolute change") +
      ", moving from " +
      a +
      " to " +
      b +
      ". " +
      leaders.join(" and ") +
      " recorded the highest final figure (" +
      maxFinal +
      "). For comparison, " +
      second +
      " moved from " +
      x +
      " to " +
      y +
      ".";
  }
  return {
    id: "week-" + week + "-chart",
    kind: "chart",
    week,
    title: cases[week - 1].title + " · 数据报告",
    table,
    prompt:
      "The table presents data from a fictional service review: " +
      title +
      ". Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    overview,
    weak: "All the figures changed a lot, which shows that the new policy was successful.",
    issue: "变化幅度可能不同；这份表也无法单独识别原因。",
    strong: overview,
    annotation: "把总括句逐项对照原表，再选第二个指标或时期支撑你的对比。",
    revision: "用一处有单位的比较支持概述；核对你有没有把相关性写成因果关系。",
  };
}
function weekWriting(week, track) {
  const c = cases[week - 1],
    s = scenarios[week - 1];
  const t1 =
    track === "general"
      ? {
          id: "week-" + week + "-letter",
          week,
          kind: "letter",
          title: c.title + " · 情境书信",
          prompt:
            s[4] +
            " Write at least 150 words in an appropriate register. You do not need to include postal addresses.",
          overview:
            "Open with the purpose of your letter and identify the relevant event in your own words.",
          weak: "I have a thing to say and I want you to deal with it.",
          strong: letterParagraphs[week - 1],
          annotation: "将题目要求拆为三个动作，分别用一个具体事实或安排展开。",
          revision: "在二稿标明你补充了哪个要点、如何让读者知道下一步。",
        }
      : buildChart(week);
  const essay = {
    id: "week-" + week + "-essay",
    week,
    kind: "essay",
    title: c.title + " · 议论文",
    prompt:
      s[2] +
      " Present and justify your own position. Consider a plausible alternative and support your argument with reasons and relevant examples. Write at least 250 words.",
    overview: weeklyPositions[week - 1],
    weak: "There are many opinions on this issue and both sides have advantages and disadvantages.",
    strong: weeklyPositions[week - 1],
    annotation:
      "这个立场提出了范围或条件。下一段须说明机制，再用反例测试其适用范围。",
    revision: "找出一句范围过大的判断，为它补上条件和一个具体后果。",
  };
  return [t1, essay];
}
export function writingBank(track, week = 0) {
  const base = [
    ...(track === "general" ? letters : [...charts, marketMap]),
    ...essays,
  ];
  return week >= 1 && week <= 26
    ? [...weekWriting(week, track), ...base]
    : base;
}
export function speakingBank() {
  return speakingThemes.map((s, i) => ({
    ...s,
    kind: "speaking",
    title: cases[i].title,
    warmups: warmups[i],
    topic: cases[i].topic,
  }));
}
export function countWords(text) {
  return (
    String(text || "").match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) || []
  ).length;
}
export function aiContext(item, stage, first = "", revisionGoal = "") {
  const rubric = criteria[item.kind].map((x) => x.join(" — ")).join("\n");
  const prompt = item.cue || item.prompt;
  return [
    "你是雅思练习教练。严格围绕下面的实际题目和所提供的学习者作品点评。",
    prompt,
    item.table ? JSON.stringify(item.table) : "",
    item.maps
      ? "Each plan is a 3-by-3 grid in NW,N,NE,W,C,E,SW,S,SE order: " +
        JSON.stringify(item.maps) +
        " " +
        item.proposal
      : "",
    item.kind === "speaking"
      ? "当前部分：" +
        stage +
        "。以下是学习者手动校对的转述。发音无法由转写评定，流利度中的停顿和节奏也无声学证据。"
      : "当前草稿：" +
        stage +
        "。如有初稿，最后指出二稿哪一处真正改善了论证或信息表达。",
    item.kind === "speaking"
      ? "对文字可观察的维度分别说明；发音维度标记待回听。"
      : "对四个写作维度逐项反馈。",
    rubric,
    "每项尽可能引用一小段学习者原文、说明它对本题的影响，并给一个可以执行的修改。缺少证据就说明。最后给一个独立重练任务。不要报出雅思分数。",
    revisionGoal ? "修改目标：" + revisionGoal : "",
    first ? "首稿（供对照）：" + first.slice(0, 5200) : "",
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 17500);
}
