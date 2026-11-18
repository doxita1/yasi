import { cases } from "./lesson-cases.js";
import { grammar } from "./lesson-grammar.js";
import { extraTerms } from "./lesson-lexicon.js";
import { scenarios } from "./lesson-scenarios.js";
import { weeklyChecks } from "./lesson-checks.js";
import { academicReadings } from "./lesson-academic.js";
import { extraExamples } from "./lesson-examples.js";
import { evidenceLines } from "./lesson-evidence.js";

export const weekTitles = cases.map((unit) => unit.title);
const dayFocus = [
  "读懂任务",
  "听清变化",
  "脱稿应答",
  "写清观点",
  "按题型表达",
  "换场景检验",
];
const block = (id, title, minutes, skill, items) => ({
  id,
  title,
  minutes,
  skill,
  items,
});
const written = (prompt, explanation, extra = {}) => ({
  kind: "write",
  prompt,
  explanation,
  ...extra,
});
const spoken = (prompt, explanation, extra = {}) => ({
  kind: "speak",
  prompt,
  explanation,
  ...extra,
});
function objective(
  prompt,
  correct,
  distractors,
  seed,
  explanation,
  extra = {},
) {
  const options = [...distractors];
  const answer = seed % (options.length + 1);
  options.splice(answer, 0, correct);
  return { kind: "choice", prompt, options, answer, explanation, ...extra };
}
function vocabLesson(unit, w, d) {
  const terms = [
    unit.terms[d],
    ...extraTerms[w][d].map((pair, i) => [...pair, extraExamples[w][d][i]]),
  ];
  const items = terms.map(([word, meaning, example], i) => {
    const near = [terms[(i + 1) % 6], terms[(i + 3) % 6]];
    const dimension =
      i === 3 || i === 4 ? "听得出" : i === 5 ? "用得出" : "看得懂";
    const properties = {
      word,
      term: word,
      meaning,
      audioText: word,
      dimension,
      reviewKey:
        "vocab-w" +
        String(w + 1).padStart(2, "0") +
        "-d" +
        (d + 1) +
        "-n" +
        (i + 1),
    };
    if (example) properties.example = example;
    if (dimension === "听得出") {
      return objective(
        "听录音，选出表达的含义。",
        meaning,
        near.map((x) => x[1]),
        w + d + i,
        "你听到的是 " + word + "，意思是“" + meaning + "”。再听一次并复述。",
        properties,
      );
    }
    if (dimension === "用得出") {
      return written(
        "用英语表达“" +
          meaning +
          "”，再把它用进一句你可能真的会说的话。先尝试，再播放发音核对。",
        "目标表达是 " +
          word +
          "。用自己的完整句说明对象、时间或原因；其他自然、意思相符的表达也可以。",
        properties,
      );
    }
    return objective(
      "读例句。“" + word + "” 在这里表示什么？",
      meaning,
      near.map((x) => x[1]),
      w + d + i,
      word + " 表示“" + meaning + "”。结合例句，换一个人物再说一次。",
      { ...properties, context: example },
    );
  });
  return block(
    "vocab",
    terms[0][0] + " 与 5 个相关表达",
    15,
    "vocabulary",
    items,
  );
}
function grammarLesson(w, d) {
  const g = grammar[w],
    prior = grammar[Math.max(0, w - 1)];
  const c = g.contrasts[d % 2];
  const choose = (contrast, lesson, seed) =>
    objective(
      "根据句意填空。 " + contrast[0],
      contrast[1],
      [contrast[2]],
      seed,
      lesson.rule,
      { example: contrast[0].replace("___", contrast[1]) },
    );
  const production = written(g.task, g.rule, { example: g.model });
  let items;
  if (d === 0) items = [choose(c, g, w), production];
  if (d === 1)
    items = [
      choose(c, g, w + 1),
      written("把下面这句示例换成自己的经历，保留目标语法。", g.rule, {
        context: g.model,
        example: g.model,
      }),
    ];
  if (d === 2)
    items = [
      spoken(g.task, g.rule, { example: g.model }),
      choose(g.contrasts[0], g, w + 2),
    ];
  if (d === 3)
    items = [
      choose(prior.contrasts[1], prior, w + 3),
      written(
        "在这个新场景中写两句：" +
          scenarios[w][1] +
          " 使用本周语法，并注明为什么这样表达。",
        g.rule,
        { example: g.model },
      ),
    ];
  if (d === 4)
    items = [
      written(
        "下面的句子有一处语法问题。写出完整修正版，并解释为什么。",
        g.rule,
        {
          context: c[0].replace("___", c[2]),
          example: c[0].replace("___", c[1]),
        },
      ),
      spoken(g.task, g.rule, { example: g.model }),
    ];
  if (d === 5)
    items = [
      choose(prior.contrasts[0], prior, w + 5),
      written(
        "不看示范，用两三句英语回答。 " +
          scenarios[w][2] +
          " 尝试使用本周语法。",
        g.rule,
        { example: g.model },
      ),
    ];
  return block("grammar", g.title, 10, "grammar", items);
}
const caseQuestion = (question, seed, source) =>
  objective(
    question.prompt,
    question.correct,
    question.distractors,
    seed,
    question.explanation,
    source,
  );
function examLesson(unit, w, d, track) {
  const [challenge, everyday, debate, chart, letter] = scenarios[w];
  const [passage, claim, verdict, evidence] = weeklyChecks[w];
  const [readingEvidence, firstEvidence, secondEvidence] = evidenceLines[w];
  const selected =
    track === "undecided" ? (w % 2 === 0 ? "general" : "academic") : track;
  const sampler = track === "undecided" ? "试听 · " : "";
  if (d === 0 && selected === "academic") {
    const [text, main, correct, a, b, quote, statement, answer, reason] =
      academicReadings[w];
    return block(
      "exam",
      sampler + "Academic 阅读 · 证据与推断",
      20,
      "reading",
      [
        objective(
          main,
          correct,
          [a, b],
          w + 1,
          "根据证据句定位作者的结论，留意比较范围。",
          { context: text, evidence: quote },
        ),
        objective(
          "True / False / Not Given · " + statement,
          answer,
          ["True", "False", "Not Given"].filter((v) => v !== answer),
          w + 2,
          reason,
          { context: text, evidence: reason },
        ),
        written(
          "用自己的英语写两句：作者发现了什么？材料还能或不能证明什么？",
          "第一句说明发现，第二句限定解释范围。引用信息与个人推断要区分。",
          { context: text },
        ),
      ],
    );
  }
  if (d === 0)
    return block(
      "exam",
      sampler + "General Training 阅读 · 定位与证据",
      20,
      "reading",
      [
        caseQuestion(unit.readQ, w, {
          context: unit.reading,
          evidence: readingEvidence,
        }),
        written(
          "从文中找出支持上一题答案的最短句子，再用自己的英语概括。",
          "引用的句子要能支持结论；概括时保留原文的条件、因果或限制。",
          { context: unit.reading, example: unit.readQ.correct },
        ),
        written(
          "用一句话概括这段材料的用途，并写出一个容易误读的细节。",
          "先说明写给谁、解决什么问题，然后指出一个时间、数量或条件。",
          { context: unit.reading },
        ),
      ],
    );
  if (d === 1)
    return block("exam", "听力 · 抓住关键信息", 20, "listening", [
      caseQuestion(unit.listenQ, w + 1, {
        audioText: unit.listening,
        evidence: firstEvidence,
      }),
      caseQuestion(unit.followQ, w + 3, {
        audioText: unit.listening,
        evidence: secondEvidence,
      }),
      written(
        "再听一遍，用两句英语给没有听到留言的人转述最重要的信息。",
        "两项关键信息分别是 " +
          unit.listenQ.correct +
          " 和 " +
          unit.followQ.correct +
          "。请核对有无混淆旧安排和最终安排。",
        { audioText: unit.listening },
      ),
    ]);
  if (d === 2)
    return block("exam", "口语 · 从短答到追问", 20, "speaking", [
      spoken(
        "Part 1 · What experience have you had with " +
          unit.topic +
          "? Give one specific detail.",
        "直接回答问题，再说清一个人物、地点或例子。没有相关经历也可以说明。",
      ),
      spoken(
        "Part 2 · Describe a time when you dealt with a situation related to " +
          unit.topic +
          ". Say where you were, what you needed, what you did and how it ended. 准备 1 分钟，连续讲 1–2 分钟。",
        "检查事件的起因、自己的行动和结果；回听后把一处长停顿改成较清楚的句子。",
      ),
      spoken(
        "Part 3 · " + debate,
        "先表态，再比较两种情况，最后给一个能解释差异的例子。",
      ),
    ]);
  if (d === 3)
    return block("exam", "议论文 · 观点与论据", 20, "writing", [
      written(
        "Task 2 分段练习 · " +
          debate +
          " 用英语列出自己的立场、一个理由和一个反方可能举的例子。",
        "检查理由能否直接支持立场，反例要有具体条件。",
      ),
      written(
        "围绕同一题写 90–130 词主体段。 " + debate,
        "先给论点，再用具体场景解释因果；末句回扣问题。这是分段训练，完整考试作文要求至少 250 词。",
      ),
      written(
        "把刚才段落中一个笼统表达改得更具体，写下改前和改后两句。",
        "保留原意，检查名词、动词搭配以及比较对象是否清楚。",
      ),
    ]);
  if (d === 4 && selected === "academic")
    return block("exam", sampler + "Academic 写作 · 数据概览", 20, "writing", [
      written(
        "读模拟数据，写一两句英文概览，指出整体变化或最大的差异。",
        "先说最显著的趋势或类别差异，概览不必逐项报数。",
        {
          context:
            chart.replaceAll(" | ", "\n") + "\n箭头表示前一阶段 → 后一阶段。",
        },
      ),
      written(
        "用 2–4 句补充至少两项准确比较；有明确单位时写出单位。",
        "区分差值与终点。只描述表中数据能支持的结论。此处练习 Task 1 的概览与细节，完整答案至少 150 词。",
        { context: chart.replaceAll(" | ", "\n") },
      ),
    ]);
  if (d === 4)
    return block(
      "exam",
      sampler + "General Training 写作 · 情境书信",
      20,
      "writing",
      [
        written(
          letter + " 先写称呼、来信目的，并列出需要覆盖的三个要点。",
          "面向收信人选择语气，逐一覆盖题目所给的三项交际目的。",
        ),
        written(
          "Task 1 · " + letter + " 独立写一封至少 150 词的信。",
          "有明确目的、完整要点、合适称呼与结尾；重读并确认收件人知道下一步做什么。",
        ),
      ],
    );
  return block("exam", "周检 · 陌生材料与独立表达", 20, "reading", [
    objective(
      "True / False / Not Given · " + claim,
      verdict,
      ["True", "False", "Not Given"].filter((v) => v !== verdict),
      w,
      evidence,
      { context: passage, evidence },
    ),
    written("用英文为你的判断辩护。若信息不足，明确缺少哪个事实。", evidence, {
      context: passage,
    }),
    spoken(
      "无稿迁移 · " + everyday,
      "先交代目的，回应一个细节，并用一个问题确认对方的理解。",
    ),
  ]);
}
function workLesson(unit, w, d) {
  const [challenge, everyday, debate] = scenarios[w];
  const facts =
    "关键信息：" + unit.listenQ.correct + "；" + unit.followQ.correct + "。";
  const routines = [
    [
      "首次接洽",
      [
        spoken(
          "你刚接手这件事。用英语向同事说明你的身份、想完成什么，并提一个能推动事情的问题。",
          "包含自我介绍、明确目的与一个相关问题。",
          { context: unit.reading },
        ),
        written(
          "把你的口头请求改成不超过 45 词的同事消息。",
          "让同事读完知道要回复哪一件事。",
        ),
      ],
    ],
    [
      "核对与回电",
      [
        spoken("听留言后给对方回电：复述两个细节，并请对方确认。", facts, {
          audioText: unit.listening,
        }),
        written(
          "用一个英文待办项记录谁接手、要做什么。",
          "尽量用具体动作，不要填入材料没说明的时间或姓名。",
        ),
      ],
    ],
    [
      "面对临时追问",
      [
        spoken(
          "你的同事提出了一个新问题。听完先用自己的话确认对方在问什么，再提出办法。",
          "回应新问题本身。不能确定的地方，用一个有针对性的澄清问题补全。",
          { audioText: challenge },
        ),
        spoken(
          "对方希望更具体。请给出两个可行选项，并用问句让对方选择。",
          "两项方案要有实际区别，给对方明确的回答入口。",
          { context: challenge },
        ),
      ],
    ],
    [
      "说明取舍",
      [
        spoken(
          "同事们在讨论下面的问题。用英语给出一个建议、一项好处和一个风险。",
          "明确推荐什么，并承认在哪种情况下可能不适用。",
          { context: debate },
        ),
        written(
          "写一条会后消息，记录你的建议和仍待确认的一点。",
          "把已经知道的事实和需要核实的事情分开写。",
        ),
      ],
    ],
    [
      "落实下一步",
      [
        written(
          "你负责跟进这件事。向相关同事写一封 50–80 词的邮件，说明现状，提出下一步，并请求确认。",
          "写明收件人需要做什么；不要把提议误写为已经批准的决定。",
          { context: unit.reading },
        ),
        spoken(
          "听到下面追问后，用 30–45 秒调整你的建议。",
          "解释是哪条新信息改变了你的处理方式，并确认双方下一步。",
          { audioText: challenge },
        ),
      ],
    ],
    [
      "迁移到日常交流",
      [
        spoken(
          "离开本周工作场景，无稿处理这个生活任务。 " + everyday,
          "说明需求，给出关键细节，向对方追问，并用一句话确认最后的安排。",
        ),
        written(
          "对方没有听懂你刚才的一句话。请写出原句和一个更简单的英文改说法。",
          "用常见词和更短的句子表达同一意思，让对方据此采取行动。",
        ),
      ],
    ],
  ];
  return block("work", routines[d][0], 15, "conversation", routines[d][1]);
}
function trackName(track) {
  const t = String(track).trim().toLowerCase();
  if (["academic", "a", "a类", "学术类"].includes(t)) return "academic";
  if (
    [
      "general",
      "general training",
      "general-training",
      "general_training",
      "g",
      "gt",
      "g类",
      "培训类",
    ].includes(t)
  )
    return "general";
  return "undecided";
}
export function getDay(day, track = "undecided") {
  const n = Number(day);
  if (!Number.isInteger(n) || n < 1 || n > 156) return null;
  const w = Math.floor((n - 1) / 6),
    d = (n - 1) % 6,
    unit = cases[w],
    title = w === 0 && d === 0 ? "项目初见" : unit.title + " · " + dayFocus[d];
  return {
    day: n,
    week: w + 1,
    dayOfWeek: d + 1,
    title,
    weekTitle: unit.title,
    blocks: [
      vocabLesson(unit, w, d),
      grammarLesson(w, d),
      examLesson(unit, w, d, trackName(track)),
      workLesson(unit, w, d),
    ],
  };
}
