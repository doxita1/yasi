// Original IELTS-style exercises. "turn" indexes the spoken evidence; alternatives include only equivalent answers.
const gap = (prompt, answer, limit, turn, explanation, alternatives = []) => ({
  kind: "gap",
  prompt,
  answer,
  limit,
  turn,
  explanation,
  alternatives,
});
const mc = (prompt, options, answer, turn, explanation) => ({
  kind: "choice",
  prompt,
  options,
  answer: options[answer],
  turn,
  explanation,
});
const match = (prompt, options, index, turn, explanation) => ({
  ...mc(prompt, options, index, turn, explanation),
  kind: "match",
});
const purpose = [
  "reduces disturbance",
  "protects volunteers",
  "maintains reliable records",
  "replaces an old building",
];
const design = [
  "kept unchanged",
  "modified after a pilot",
  "dropped from the investigation",
];
const factors = [
  "expense",
  "inconsistent definitions",
  "participant behaviour",
  "short observation window",
  "selection bias",
];
const set = (id, part, title, subtitle, turns, questions) => ({
  id,
  part,
  title,
  subtitle,
  turns,
  questions,
});
export const listeningSets = [
  set(
    "estuary",
    2,
    "河口保护区的新志愿者",
    "听出临时改动、路线限制与各项规定的真正目的。",
    [
      [
        "Guide",
        "Welcome to Haversham Estuary. I usually give this briefing by the ticket office, but since the refurbishment began we have been meeting in the education studio. A little later we will walk down to the reserve itself. If the fire alarm sounds while we are here, by the way, go straight out to the bicycle shelter. That is our assembly point; the car park on the old plan is being used by construction vehicles.",
      ],
      [
        "Guide",
        "You probably noticed the wide wooden boardwalk beside the entrance. It was originally paid for out of the access budget, so people assume it was put there for wheelchair users. In fact that stretch of path was already accessible. Its real purpose is to stop people drifting onto the salt marsh and disturbing nesting birds. Only the raised section beyond it is closed when the tide comes in.",
      ],
      [
        "Guide",
        "There is a separate rule for the hide. We do want someone to check it after the last visitor leaves. Years ago you signed a sheet to say it was empty. Now work in pairs, even if you know the building well. People have slipped on those steps, so it is your own safety we have in mind. For the same reason, the first-aid bag is kept by the entrance to the hide, not where we store the binoculars.",
      ],
      [
        "Guide",
        "When you are on a counting shift, write down where you stood before you start counting. A bird seen from one muddy corner might also be visible from the next one. Without the location, our totals can be ridiculously high. This little entry on your sheet lets the researchers spot a possible duplicate. We ask for a grid reference rather than the local place name, which different volunteers spell in different ways.",
      ],
      [
        "Guide",
        "People often ask what they should bring for the monthly survey. There will be maps and pencils waiting for you, and plenty of spare jackets. What the centre cannot lend you is a torch. Please bring one, even on a bright morning. We look underneath the landing stage, and it can be quite dark in there.",
      ],
      [
        "Guide",
        "We used to finish at noon. That made it almost impossible to observe the second flock that feeds when the water drops, so the survey will now run until half past one. You need not stay for lunch. If you live some distance away and want the minibus back, tell the coordinator before Friday, not when you arrive on Saturday.",
      ],
      [
        "Guide",
        "For your first three shifts you are welcome to shadow any experienced volunteer except the person at the information desk. Visitors assume anyone behind that desk can answer questions about tides, and a wrong answer can have consequences. After the third shift, arrange a short review with the volunteer coordinator. Please bring your field notebook, not the printed handbook. The coordinator wants to talk about what you actually noticed.",
      ],
      [
        "Guide",
        "Finally, keep your visitor badge clipped to your jacket today. Next month you may see a staff pass advertised in the newsletter. That is for paid employees; volunteers will continue using the same badge. If it goes missing, report it to reception before you leave.",
      ],
    ],
    [
      gap(
        "The emergency assembly point is the _____.",
        "bicycle shelter",
        2,
        0,
        "旧图上的停车场已被施工车辆占用；ticket office 是旧集合地点。",
      ),
      match(
        "The wooden boardwalk",
        purpose,
        0,
        1,
        "无障碍经费是资金来源；实际目的是保护筑巢鸟类。",
      ),
      match(
        "The two-person hide check",
        purpose,
        1,
        2,
        "两人同行针对湿滑台阶和人员安全。",
      ),
      match(
        "Recording the observation position",
        purpose,
        2,
        3,
        "同一只鸟可能从不同角度被重复记录。",
      ),
      gap(
        "Record a _____ instead of the local place name.",
        "grid reference",
        2,
        3,
        "地点名称拼法不一；表格需要统一的坐标编号。",
      ),
      gap(
        "Each survey volunteer must bring a _____.",
        "torch",
        1,
        4,
        "地图、铅笔和外套可借。即使天亮也须自备照明。",
      ),
      mc(
        "Why has the survey been extended?",
        [
          "To include a later feeding period",
          "To provide a longer lunch break",
          "To make the minibus cheaper",
        ],
        0,
        5,
        "延时与退潮后的第二群鸟有关，午饭和班车是另外两件事。",
      ),
      gap(
        "Request a minibus place before _____.",
        "Friday",
        1,
        5,
        "Saturday 是活动当天，提前告知的截止点是 Friday 之前。",
      ),
      mc(
        "Why are beginners kept away from the information desk?",
        [
          "They need more practice selling tickets",
          "Giving inaccurate advice could be dangerous",
          "There is too little desk space",
        ],
        1,
        6,
        "访客会误以为新人能准确解答潮汐问题。",
      ),
      gap(
        "Bring a _____ to the post-shadowing review.",
        "field notebook",
        2,
        6,
        "handbook 被明确排除，负责人要了解实际观察。",
      ),
    ],
  ),
  set(
    "canopy",
    3,
    "实地抽样为什么失真",
    "学生用一项校园树荫调查讨论抽样、混杂变量与预测。",
    [
      [
        "Leah",
        "Our proposal says we are comparing the cooling effect of trees in the two courtyards. I still think the central square is the convenient control. We can get to it in three minutes.",
      ],
      [
        "Owen",
        "Convenient, yes, but the science block throws a shadow over it by mid-afternoon. A low reading there could be caused by the building rather than the trees. The sports yard has no high buildings around it. It faces the same direction as the garden, too. Shall we use the sports yard as the control, then?",
      ],
      [
        "Leah",
        "All right. I recorded a temperature every ten minutes in the pilot. Our lecturer suggested every five, which sounded more precise. When I checked the log, though, moving the sensor and waiting for it to settle took nearly six minutes. So ten minutes is the interval we can actually repeat.",
      ],
      [
        "Owen",
        "And the sensor height? We originally put it at roughly waist level. That was fine until somebody taller took a turn. After the trial we fixed a mark on each pole, one metre above the paving. The mark matters more than the exact height because everyone now measures at the same level.",
      ],
      [
        "Leah",
        "What about the photographs? I had planned to estimate leaf cover from them. Even with the same camera, a patch of white cloud can look like a gap in the canopy. We cannot separate cloud from empty sky consistently. I would leave photographs out altogether and describe the canopy in our discussion instead.",
      ],
      [
        "Owen",
        "Agreed. We should keep the wind reading, though. You suggested doubling the number of readings, but we used the same sheltered position and the results barely varied. The pilot gives us no reason to change that part of the method.",
      ],
      [
        "Leah",
        "I have been thinking about the questionnaire as well. If we stop the first twenty people coming out of the library, we mostly reach students who work indoors. I do not mind having a small sample so much as having the wrong sort of sample. We should approach every fifth person at the crossing, whichever direction they are going.",
      ],
      [
        "Owen",
        "That should help. Instead of asking whether a place feels comfortable, could we ask people to choose between two photographs? Actually, we have just agreed not to rely on photographs. Better to ask for a number on a comfort scale. We can print the two ends on a card, so a seven means much the same thing to everyone.",
      ],
      [
        "Leah",
        "For the presentation, shall we show average temperatures in a table? A single average will hide the hour when the two sites start to diverge. I would use a line graph, with both sites on the same axes. The table of raw measurements can go in the appendix.",
      ],
      [
        "Owen",
        "One last point: say our garden really is cooler. We must not claim that planting trees will produce the same reduction in every part of the city. We observed two sites over a short period. We can identify a local association, but we have no experiment that establishes a general causal effect.",
      ],
    ],
    [
      gap(
        "The students select the _____ as their control site.",
        "sports yard",
        2,
        1,
        "central square 虽然方便，但建筑阴影会混淆结果。",
      ),
      mc(
        "Why do they reject a five-minute interval?",
        [
          "The lecturer advised against it",
          "The equipment cannot be repositioned and settled in time",
          "The temperature never changes that quickly",
        ],
        1,
        2,
        "五分钟是教师建议；试测显示设备准备要接近六分钟。",
      ),
      match(
        "Height of the temperature sensor",
        design,
        1,
        3,
        "试测发现不同人腰部高度不一致，随后在杆上做了固定标记。",
      ),
      match(
        "Estimating leaf cover from photographs",
        design,
        2,
        4,
        "无法稳定区分白云与树冠空隙，因此弃用照片。",
      ),
      match(
        "Wind measurement procedure",
        design,
        0,
        5,
        "提到加倍但未采用；现有数据的变化很小。",
      ),
      mc(
        "What concerns Leah most about recruiting outside the library?",
        [
          "Too few volunteers will agree",
          "It overrepresents a particular group of students",
          "People may give dishonest answers",
        ],
        1,
        6,
        "关键是样本偏向室内学习者，而非数量小。",
      ),
      gap(
        "At the crossing they will approach every _____ person.",
        "fifth",
        1,
        6,
        "抽取的是每第五人，包含两个行进方向。",
        ["5th"],
      ),
      gap(
        "Participants will give a number on a _____.",
        "comfort scale",
        2,
        7,
        "照片比较仅是短暂设想，最后决定使用舒适度量表。",
      ),
      gap(
        "Both sites will be shown together on a _____.",
        "line graph",
        2,
        8,
        "原始表格会放附录，主要展示用线图看分化时点。",
      ),
      mc(
        "Which conclusion is justified?",
        [
          "New planting will cool any urban site",
          "The sample establishes a universal cause",
          "The two local sites showed an association",
        ],
        2,
        9,
        "两个场地、短观察期支持局部联系，不能证明普遍因果。",
      ),
    ],
  ),
  set(
    "commuter",
    3,
    "通勤调查中的证据与偏差",
    "区分参与者行为、定义差异、招募偏差及研究者的最后决定。",
    [
      [
        "Mina",
        "I thought we could introduce the report by saying cheaper fares persuaded commuters to switch to the new tram. The passenger count rose the same week that the discount started.",
      ],
      [
        "Daniel",
        "It did, but the eastbound bridge was closed for repairs that week as well. Some drivers had very little choice. We could say the two events coincided, but we cannot tell which one did the persuading. Let us make that limitation explicit in the opening paragraph.",
      ],
      [
        "Mina",
        "For the travel diaries, the problem only became obvious when I looked at the comments. Once people started writing down every trip, a few combined errands that they would normally make separately. Our method seems to have changed the behaviour we were trying to describe.",
      ],
      [
        "Daniel",
        "The ticket data had a different difficulty. It counted a transfer between two tram lines as two journeys, whereas the diary counted it as one. Neither count is necessarily wrong. Until we agree what a journey is, comparing the numbers is meaningless.",
      ],
      [
        "Mina",
        "And the website survey? The form was open all month, so I would not call timing the central problem. The link appeared in the tram operator’s newsletter, which meant existing tram users were far more likely to see it than regular drivers.",
      ],
      [
        "Daniel",
        "Our tutor said that recruiting at the petrol station might help. I went there on Tuesday, and the manager was willing, provided we did not interrupt customers while they were paying. So we can put a sign by the exit. Offering a free ticket for the tram would attract a very particular sort of person; we decided on a supermarket voucher instead.",
      ],
      [
        "Mina",
        "On the question about delays, I wrote typical travel time, but typical could mean the quickest trip somebody remembers. Ask for the most recent weekday trip. We exclude weekends because the reduced timetable is a different service. We can ask about unusual delays in a separate box.",
      ],
      [
        "Daniel",
        "Good. There is another problem with our cost figure. We included the overnight parking charge, which hardly anyone in the sample actually pays, and left out the walk from the car park. Remove the charge. We can report walking time separately, without turning it into a money value.",
      ],
      [
        "Mina",
        "How shall we compare neighbourhoods? A map would look impressive. But for a street with only two respondents, a reader could almost identify them. Use district totals, even though that sacrifices geographical detail. In an academic report that feels like the more responsible choice.",
      ],
      [
        "Daniel",
        "As for the written conclusion, our pilot was intended to check whether people could complete the questions. We did not set it up to forecast passenger numbers. If the revised questionnaire works, the transport office might fund a larger study next term. For now, send the office a methods note rather than a forecast.",
      ],
    ],
    [
      mc(
        "Why will the opening claim be qualified?",
        [
          "The discount started later than reported",
          "Bridge repairs offer another explanation",
          "Passengers gave contradictory fares",
        ],
        1,
        1,
        "票价优惠与东行桥封闭同时发生，客流变化有另一解释。",
      ),
      match(
        "Travel diaries",
        factors,
        2,
        2,
        "记日记让人主动合并行程，属于测量改变行为。",
      ),
      match(
        "Ticket counts compared with diaries",
        factors,
        1,
        3,
        "两种数据对换乘算一趟还是两趟有不同定义。",
      ),
      match(
        "Newsletter recruitment",
        factors,
        4,
        4,
        "链接主要触达已有乘客，产生招募偏差。",
      ),
      gap(
        "The petrol station will display a sign by the _____.",
        "exit",
        1,
        5,
        "经理允许招募，但顾客付款时不能被打扰。",
      ),
      gap(
        "The chosen incentive is a _____.",
        "supermarket voucher",
        2,
        5,
        "免费电车票会吸引特定人群，因此未采用。",
      ),
      gap(
        "Record the most recent _____ trip.",
        "weekday",
        1,
        6,
        "原议的 typical 被换成最近工作日；周末班次不同。",
      ),
      mc(
        "How will walking time be treated?",
        [
          "It will be excluded with overnight parking",
          "It will be converted into a cash cost",
          "It will be reported as a separate measure",
        ],
        2,
        7,
        "只删除停车费；步行时间会单列，不折算为钱。",
      ),
      gap(
        "For privacy, the map data will be aggregated into _____.",
        "district totals",
        2,
        8,
        "小街道仅两名受访者，公开过细数据可能暴露身份。",
      ),
      gap(
        "The transport office should initially receive a _____.",
        "methods note",
        2,
        9,
        "试点检验问卷能否顺利填写，无法支持客流预测。",
      ),
    ],
  ),
  set(
    "conservation",
    4,
    "纸本文物如何悄然变色",
    "从一段专业讲座捕捉材料机理、控制条件及研究结论的边界。",
    [
      [
        "Lecturer",
        "When a museum paper turns brown, visitors tend to blame its age. Age tells us how long reactions have had to occur, not what sets them off. Consider two sheets printed in the same year. The expensive one might still be pale, while a cheap newspaper has become brittle. In much nineteenth-century newsprint the difference comes down to lignin, a substance retained when wood is ground mechanically.",
      ],
      [
        "Lecturer",
        "Cellulose gives a sheet much of its strength. Lignin, by contrast, can react with oxygen and form coloured compounds. The process becomes visible first on exposed edges. Early conservators sometimes treated that edge darkening as evidence that an entire book was equally damaged. Open the volume, however, and the inner margin may tell a quite different story.",
      ],
      [
        "Lecturer",
        "To investigate light exposure, our laboratory cut strips from the same sheet. Some went beneath a lamp, while others went into a dark box. We did not rely on a second sheet as a control, even from the same manufacturer: its original composition could be slightly different. The box was kept beside the lamp so that temperature, at least, remained comparable.",
      ],
      [
        "Lecturer",
        "At first we used a colour chart and asked observers to select the closest shade. On cloudy afternoons different people gave quite different judgements. The instrument that replaced the chart was a reflectance meter. It records how much incident light comes back from the surface, providing a numerical reading that can be repeated without asking someone to name a colour.",
      ],
      [
        "Lecturer",
        "What surprised us was the effect of putting the sheets back into darkness. Some of the colour change was lost within a few hours. It would be tempting to call that recovery, but the strength test showed no comparable improvement. A paler appearance is therefore a poor guide to the mechanical condition of a sheet.",
      ],
      [
        "Lecturer",
        "Museums commonly regulate the brightness of individual lamps. We also need to consider how long the object remains under them. Exposure depends on duration as well as intensity. Halving the light level while doubling the display period is unlikely to bring the benefit a curator expects. The figure we monitor is the cumulative dose across the entire exhibition.",
      ],
      [
        "Lecturer",
        "Humidity complicates the picture again. A sudden rise lets fibres absorb water and expand. If a watercolour is stuck firmly to a rigid board, the sheet cannot expand evenly. The resulting stress may cause a tear. Our mount therefore uses paper hinges. They hold the work in place but allow a small amount of movement.",
      ],
      [
        "Lecturer",
        "One might now propose rotating vulnerable works between display and storage. Rotation can reduce exposure for any single sheet, but it does not reverse damage already done. For especially fragile items we exhibit a facsimile and keep the original available for supervised study. Printing another copy is relatively easy; presenting it without a label would be misleading.",
      ],
      [
        "Lecturer",
        "Finally, do not read our measurements as a universal timetable for replacing every paper object. We tested one paper under controlled conditions. A prudent next step is to test several paper types with the same method. Only then can we see which findings transfer, and which depend on the preparation of the original sheet.",
      ],
    ],
    [
      gap(
        "Ground-wood newsprint typically retains _____.",
        "lignin",
        1,
        0,
        "此处要求写保留下来的物质，不是下一段所说的纤维素。",
      ),
      gap(
        "Darkening can initially be seen on the _____.",
        "exposed edges",
        2,
        1,
        "inner margin 是书内侧的对照情况，非最先可见处。",
      ),
      mc(
        "Why were strips from a single sheet used?",
        [
          "To avoid variation in the starting material",
          "To increase the number of manufacturers",
          "To make the light level identical",
        ],
        0,
        2,
        "同一厂家不同纸张也可能成分不同。",
      ),
      gap(
        "The dark box was positioned to control _____.",
        "temperature",
        1,
        2,
        "箱子控制光照；摆在灯旁是为保持温度可比。",
      ),
      gap(
        "A _____ replaced judgements using a colour chart.",
        "reflectance meter",
        2,
        3,
        "该仪器测反射回来的光，给出可重复数值。",
      ),
      mc(
        "What did the strength test establish?",
        [
          "Darkness restored the internal fibres",
          "An improvement in colour did not imply greater strength",
          "Colour change was always permanent",
        ],
        1,
        4,
        "褪去部分颜色后强度没有同步恢复。",
      ),
      gap(
        "The figure monitored throughout an exhibition is the _____.",
        "cumulative dose",
        2,
        5,
        "累计光照量同时取决于亮度和时长。",
      ),
      gap(
        "A flexible mount uses _____.",
        "paper hinges",
        2,
        6,
        "刚性板限制纸张膨胀；纸铰链允许微小活动。",
      ),
      gap(
        "The museum displays a _____ for particularly fragile works.",
        "facsimile",
        1,
        7,
        "展厅使用复制品，原件保留给监督下的研究。",
      ),
      mc(
        "Which next step does the lecturer support?",
        [
          "Replacing all objects on a fixed timetable",
          "Changing lamp type before repeating the original test",
          "Repeating the procedure on other types of paper",
        ],
        2,
        8,
        "结论仅来自一种纸，下一步检验能否迁移至其他纸种。",
      ),
    ],
  ),
];
