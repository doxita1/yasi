// Original passages, questions, explanations and model rewrites. The word-list page references
// let learners who own the accompanying materials find the corresponding vocabulary.
export const units = [
  {
    id: "evidence",
    name: "证据、推断与研究结论",
    source: "核心词表自测，第 3、6、7、9 页；阅读指导，第 8 页",
    words: "assume · evidence · infer · outcome",
    text: "For twelve weeks, nurses at one of two comparable clinics sent appointment reminders. Missed appointments declined at both clinics, including the one that sent no reminders. The researchers therefore withheld a judgement about the messages until they could account for a new bus service that began in the same month.",
    tasks: [
      [
        "从文本中填一个词。The team _____ a judgement because another change could explain the fall.",
        "withheld",
        "withheld a judgement 表示暂缓下结论。观察发生了，因果归属还不能确定。",
      ],
      [
        "The reminders had no effect on attendance.",
        "NOT GIVEN",
        "未能证明有效，也不能据此证明无效。",
        "TRUE|FALSE|NOT GIVEN",
      ],
      [
        "补全同义改写。To draw a conclusion from observations is to _____ it.",
        "infer",
        "infer 是读者根据证据推断，imply 是话语或现象暗示。",
      ],
      [
        "Which detail matters most to the causal claim?",
        "The untreated clinic also improved.",
        "两组在同一时期都改善，使共同的外部变化成为另一种解释。",
        "The nurses sent messages.|The untreated clinic also improved.|The study lasted twelve weeks.",
      ],
    ],
    transfer: "用 although 和一个表示不确定性的动词，给诊所写一句研究结论。",
    model:
      "Although attendance improved, the new bus service may have contributed to the change at both clinics.",
  },
  {
    id: "rates",
    name: "比例、百分点与图表概述",
    source: "核心词表自测，第 9–11 页；大小作文整理中的图表概述",
    words: "percentage · proportion · ratio · shift",
    text: "A college recorded how 200 apprentices travelled in 2018 and how 300 travelled in 2023. Cycling accounted for 30% in the first survey and 26% in the second. Bus travel rose from 20% to 32%, while all other modes together fell from 50% to 42%.",
    tasks: [
      [
        "Cycling declined by four percentage _____.",
        "points",
        "30% 到 26% 相差 4 个百分点。若问相对降幅，分母是原来的 30%。",
      ],
      [
        "How many more apprentices cycled in 2023? Write a number.",
        "18",
        "2018 年是 200 × 30% = 60 人。2023 年是 300 × 26% = 78 人。",
      ],
      [
        "Which overview is supported?",
        "Bus travel overtook cycling.",
        "两年中骑行与公交的相对次序互换。表格没有提供所有方式的通勤时长。",
        "All modes attracted fewer travellers.|Bus travel overtook cycling.|Bus trips became shorter.",
      ],
      [
        "The _____ of apprentices cycling fell even as the number rose.",
        "proportion|percentage|share",
        "这里要表示占全体学徒的份额，不能写不带分母的 total。",
      ],
    ],
    transfer: "写两句 Task 1 概述，一句讲次序变化，一句区分骑车人数与占比。",
    model:
      "Bus travel overtook cycling over the period. Although cycling represented a smaller share in 2023, the number of apprentices who cycled rose from 60 to 78.",
  },
  {
    id: "clauses",
    name: "拆出长句主干与指代范围",
    source: "语法讲义，第 4 讲（第 14 页）及第 12 讲（第 41 页）",
    words: "indicate · scope · restrict · significant",
    text: "The decline in delays observed on the routes that received additional vehicles, although statistically significant, did not establish whether services running after midnight had improved. These services had been excluded because their passenger numbers fluctuated sharply.",
    tasks: [
      [
        "第一句的主语中心词是什么？填原文一个词。",
        "decline",
        "in delays 是修饰 decline 的介词短语，observed… 也只是限定这一下降。",
      ],
      [
        "哪组词是主句的谓语？",
        "did not establish",
        "received 有自己的从句主语 routes；observed 在这里修饰 decline。",
        "received additional vehicles|did not establish|running after midnight",
      ],
      [
        "第二句的 These services 指什么？",
        "Services operating after midnight",
        "指向前一句紧邻的夜间服务，不包括所有获得车辆的线路。",
        "All routes in the study|Routes with additional vehicles|Services operating after midnight",
      ],
      [
        "There is enough evidence to determine whether night-time delays fell.",
        "FALSE",
        "夜间服务被排除，第一句直接限定了这项观察结果的范围。",
        "TRUE|FALSE|NOT GIVEN",
      ],
    ],
    transfer: "把原文第一句拆成两句简洁英文，保留统计显著和适用范围两个信息。",
    model:
      "Delays declined significantly on the studied routes that received extra vehicles. The finding did not cover late-night services.",
  },
  {
    id: "forms",
    name: "相近单词、词性与学术搭配",
    source: "核心词表自测，第 7、9、10 页；精准词汇单元词表，第 15 页",
    words: "principal · principle · objective · distinct",
    text: "A council had two objectives when it opened a repair centre. Its principal aim was to reduce household waste. A secondary aim was to train apprentices. Its guiding principle was that residents should be able to repair a product regardless of where they bought it.",
    tasks: [
      [
        "Fill the gap. Waste reduction was the _____ objective.",
        "principal",
        "principal 作形容词表示主要的，与后面的 objective 搭配。",
      ],
      [
        "Fill the gap. Equal access was a guiding _____.",
        "principle",
        "principle 是可数名词，指指导行动的原则。",
      ],
      [
        "Which paraphrase keeps the order of priorities?",
        "Training was an additional objective.",
        "secondary 指目标优先级在后，没有否定培训这个目标。",
        "Training replaced waste reduction.|Training was an additional objective.|Training began before waste reduction.",
      ],
      [
        "Supply the adjective from distinguish. The two aims are _____.",
        "distinct|distinguishable",
        "清晰可区分用 distinct 或 distinguishable。distinctive 强调某事物有识别特征。",
      ],
    ],
    transfer:
      "为一个你熟悉的工作项目写两句，分别用 principal objective 和 guiding principle。",
    model:
      "Our principal objective is to shorten the handover. Our guiding principle is that colleagues on the next shift should be able to trace every change.",
  },
  {
    id: "scope",
    name: "转折、量词与作者立场",
    source: "阅读指导，第 8 页；语法讲义，第 10 讲（第 32 页）",
    words: "nevertheless · sufficient · restrict · infer",
    text: "Some museums operate free evening sessions. This arrangement removes an entrance charge, but it does little for visitors who cannot travel after dark. Nevertheless, abandoning the sessions would deprive shift workers of an option. The sensible next step is to test a daytime alternative alongside them.",
    tasks: [
      [
        "The writer wants free evening sessions to be discontinued.",
        "NO",
        "作者明确反对取消，希望在保留晚场的同时测试日间场次。",
        "YES|NO|NOT GIVEN",
      ],
      [
        "The writer thinks most visitors are shift workers.",
        "NOT GIVEN",
        "提到一个群体受益，不足以判断该群体是否超过半数。",
        "YES|NO|NOT GIVEN",
      ],
      [
        "Which connector marks the change from a limitation to a reason for retention? One word.",
        "nevertheless",
        "上一句谈夜间交通局限，下一句转到保留晚场的好处。",
      ],
      [
        "A daytime alternative is recommended as a _____ rather than a replacement.",
        "supplement|complement",
        "alongside 表示并行测试，supplement 或 complement 都保留这层含义。",
      ],
    ],
    transfer:
      "用一个让步句为职场提出类似建议，把一项政策的局限和保留理由说清楚。",
    model:
      "Although recorded meetings cannot answer questions, keeping them would help colleagues working in other time zones.",
  },
  {
    id: "work",
    name: "职场通知的澄清与复述",
    source: "学习指导－听力的定位与更正思路；核心词表自测，第 4、7、11 页",
    words: "confirm · indicate · revise · schedule",
    text: "Coordinator: I said the survey would close on Thursday, but the contractor needs another day to upload the final figures. We will still meet on Friday morning to review the preliminary totals. Please hold the public announcement until Monday, after I have checked the revised file.",
    tasks: [
      [
        "When is the meeting? Write TWO WORDS.",
        "Friday morning",
        "would close on Thursday 说的是原定截止时间，still meet 才是开会的信号。",
      ],
      [
        "Which figures will the group review at the meeting? One word.",
        "preliminary",
        "会议用 preliminary totals，即初步合计。final figures 在前一句，属于承包商上传任务。",
      ],
      [
        "When is the public announcement planned? One word.",
        "Monday",
        "hold … until Monday 是要求暂缓公告，不能把时间误记成 Friday。",
      ],
      [
        "Which reply confirms the next action precisely?",
        "I will wait for your check before releasing the figures.",
        "答复同时保留了负责核对的人和先后顺序。",
        "I will publish the meeting notes on Thursday.|I will wait for your check before releasing the figures.|I will cancel the Friday review.",
      ],
    ],
    transfer:
      "假设你负责对外公告，用英语回两句，先复述时间，再确认发布的前提。",
    model:
      "We will review the preliminary figures on Friday morning. I will hold the announcement until Monday and wait for your confirmation before publishing it.",
  },
];
