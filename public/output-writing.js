export const charts = [
  {
    id: "a-transport-shares",
    title: "跨河通勤方式",
    prompt:
      "The table shows the main way commuters crossed the river in the fictional city of Lenton in three years. Figures are percentages of all cross-river commuters.",
    kind: "chart",
    table: [
      ["Main mode", "2005 (%)", "2015 (%)", "2025 (%)"],
      ["Car", "58", "49", "38"],
      ["Bus", "24", "26", "25"],
      ["Rail", "12", "18", "27"],
      ["Bicycle", "6", "7", "10"],
    ],
    overview:
      "Cars remained the most common single mode, although their share fell by 20 percentage points. Rail overtook buses between 2015 and 2025, whereas the bus share finished close to its starting level.",
    weak: "Cars were 58 and then they were 49. The number of trains went up a lot.",
    issue:
      "单位是通勤者比例，不能用列车数量来描述。首句应抓住仍居首位与份额下降同时成立。",
    strong:
      "The car share fell from 58% to 38%, more than twice the decline recorded in the first decade alone. By contrast, rail more than doubled its share, reaching 27% in 2025 and narrowly exceeding the 25% recorded for buses.",
    annotation: "用首尾值刻画下降总幅度，并用最后一年成对数据支持排名变化。",
    revision:
      "汽车 20 个百分点降幅如何表达？检查百分比与百分点，并说明哪两个类别交换了名次。",
  },
  {
    id: "a-library-visits",
    title: "图书馆分馆客流",
    prompt:
      "The table gives the average number of weekday visits to four library branches in the fictional city of Wrenford in 2010, 2018 and 2025.",
    kind: "chart",
    table: [
      ["Branch", "2010 visits", "2018 visits", "2025 visits"],
      ["Central", "920", "860", "790"],
      ["North", "330", "410", "540"],
      ["East", "280", "290", "300"],
      ["West", "180", "340", "520"],
    ],
    overview:
      "Central remained the busiest branch despite a decline. All three other branches gained visitors, with West recording the largest absolute increase and approaching North by 2025.",
    weak: "The libraries were popular because the government made people read more.",
    issue: "表中没有政府行为或读书原因。选择可由数字直接验证的总体特征。",
    strong:
      "West gained 340 weekday visits on average, almost matching North's final figure of 540. East, in comparison, ended just 20 visits above its starting point.",
    annotation: "把增幅最大与变化最小放在同段，再核对 520 与 540 的差距。",
    revision: "用两个分馆对比增幅，分别标出平均日访问量和增加量。",
  },
  {
    id: "a-training-budgets",
    title: "培训经费分配",
    prompt:
      "The table shows how a company divided its annual staff training budget among four purposes. All figures are percentages of the budget for that year.",
    kind: "chart",
    table: [
      ["Purpose", "2012 (%)", "2018 (%)", "2024 (%)"],
      ["Induction", "34", "27", "21"],
      ["Technical skills", "30", "35", "38"],
      ["Management", "25", "24", "23"],
      ["Safety", "11", "14", "18"],
    ],
    overview:
      "The largest share moved from induction to technical skills. Safety still received the smallest share in 2024, even though its allocation rose steadily.",
    weak: "The company spent more money on safety because it had dangerous accidents.",
    issue: "只有预算占比，无法判断支出的绝对金额，也没有事故资料。",
    strong:
      "Technical training rose by eight percentage points, while induction lost thirteen. These opposite movements reversed their ranking: technical skills took 38% in the final year, compared with 21% for induction.",
    annotation: "利用反向变化解释排名，并列出最后一年比例印证。",
    revision: "划掉涉及总预算或事故的推测，补上一个反向变化对比。",
  },
  {
    id: "a-clinic-waits",
    title: "诊所等待时间",
    prompt:
      "The table compares median waiting times, in days, for four services at a fictional clinic before and after a booking-system change. It also gives the target for each service.",
    kind: "chart",
    table: [
      ["Service", "2020 median (days)", "2025 median (days)", "Target (days)"],
      ["General consultation", "8", "5", "5"],
      ["Physiotherapy", "24", "15", "14"],
      ["Eye examination", "17", "12", "14"],
      ["Hearing test", "14", "16", "14"],
    ],
    overview:
      "Median waits fell for three services, with physiotherapy registering the largest reduction. In 2025 only general consultations and eye examinations met their respective targets.",
    weak: "The system worked perfectly because almost everyone waited less time.",
    issue: "中位数不说明每位患者情况，达标也不是普遍现象。",
    strong:
      "Physiotherapy cut its median wait from 24 days to 15, yet remained one day above target. Eye examinations improved by a smaller margin of five days and nevertheless finished two days inside their target.",
    annotation: "同时比较降幅与达标，避免把降幅最大写成最终表现最佳。",
    revision: "指出哪个服务等待变长，再用目标列核对你的概述。",
  },
];
export const letters = [
  {
    id: "g-refund",
    title: "正式投诉与补救",
    prompt:
      "You paid for a weekend course in digital photography. The advertised outdoor session was cancelled and no replacement was provided. Write a letter to the course organiser. Describe what you booked, explain how the cancellation affected you, and request a suitable remedy. Begin your letter ‘Dear Sir or Madam,’.",
    kind: "letter",
    overview:
      "I am writing about the landscape photography course held on 14 May. I enrolled specifically for the outdoor session because I wanted feedback on using my camera in changing light.",
    weak: "You are a terrible company. This problem is very bad.",
    strong:
      "The classroom talk was helpful, but it did not give me the supervised practice advertised in your programme. Could you offer me a place on the next field session, or refund the portion of the fee covering that component?",
    annotation:
      "承认已获得的服务，然后明确未履行的承诺、实际影响与两种可行补救，语气礼貌而坚定。",
    revision: "检查三个要点、补救请求是否可执行，以及称呼与信末是否匹配。",
  },
  {
    id: "g-handover",
    title: "向经理申请交接",
    prompt:
      "A family commitment means you cannot attend a client meeting next week. Write a letter to your manager. State which meeting you will miss, explain the effect on the team, and propose a handover plan. Begin your letter ‘Dear Ms Carter,’.",
    kind: "letter",
    overview:
      "I am writing about Tuesday's review with Trent Design. I need to accompany my father to an appointment that morning, so I will be unable to present the revised cost estimates.",
    weak: "I am absent. Please find someone to do everything.",
    strong:
      "I can brief Amira on the two disputed figures on Monday and send her the annotated spreadsheet. If the client asks about delivery dates, I will be available by phone from noon.",
    annotation: "将交接落实到人、材料与时间，保持给熟悉上级写信的半正式语域。",
    revision: "检查对团队的影响是否写清，替代安排是否能执行。",
  },
  {
    id: "g-visitor",
    title: "写给朋友的邀请信",
    prompt:
      "A friend will stay in your city for one night before an early train. Write to your friend. Offer somewhere to stay, explain the simplest route to your home, and suggest something to do that evening. Begin your letter ‘Dear Jo,’.",
    kind: "letter",
    overview:
      "You’re very welcome to use my spare room on Thursday. Since your train leaves before seven, staying with me will save you a long trip across town in the morning.",
    weak: "I hereby inform you that accommodation is available at my residence.",
    strong:
      "Take the tram marked Hill Street from the station and get off at the second stop. If you're hungry after the journey, we could try the noodle place downstairs and still get you home in time for an early night.",
    annotation: "路线包含线路与下车位置，晚间建议回应次日早车；语言亲近自然。",
    revision: "把行政式名词化表达改成对朋友说话的语气。",
  },
  {
    id: "g-facility",
    title: "建议改善公共设施",
    prompt:
      "Your local sports centre is changing its opening hours. Write to the centre manager. Explain how you use the centre, describe one difficulty the proposed hours would cause, and suggest a change that could suit other users too. Begin your letter ‘Dear Sir or Madam,’.",
    kind: "letter",
    overview:
      "I swim at the centre before my hospital shifts three mornings a week. Under the proposed timetable the pool would open at eight, just as I am expected on the ward.",
    weak: "Everyone wants the old system and nobody likes this plan.",
    strong:
      "Would it be possible to retain a 6.30 opening on two weekdays and trial the later start on the others? Recording attendance during a four-week trial would show whether the early sessions serve enough users to justify staffing them.",
    annotation:
      "不要代所有人发言。提出可检验的折中，并说明其对其他轮班人员的用处。",
    revision: "明确你的使用习惯、实际困难及惠及其他人的替代方案。",
  },
];
export const essays = [
  {
    id: "e-efficiency",
    title: "公共服务效率",
    prompt:
      "Some people argue that public services should be assessed mainly by how quickly they help people. Others believe the quality of the outcome is more important. Discuss both views and give your own opinion.",
    kind: "essay",
    overview:
      "A short wait is valuable when delay itself causes harm, but measuring speed in isolation can reward services for moving problems elsewhere.",
    weak: "Fast services are good because speed is important. Quality is also important for everyone.",
    strong:
      "Consider a housing advice desk. Closing a case at the first meeting would shorten handling time, yet a tenant who leaves without understanding the appeal procedure may return a week later. Counting resolved cases alongside waiting time would give a fairer picture of the service.",
    annotation:
      "先提供场景和速度指标的诱因，再解释租户返场如何削弱指标。把例子连接回题目中的双方评价。",
    revision: "检查是否公平解释了为什么速度有价值，以及你认为质量优先的边界。",
  },
  {
    id: "e-employer-training",
    title: "雇主与培训责任",
    prompt:
      "Some people think employers should pay for all the training their staff need. Others believe employees should pay for courses that develop their careers. Discuss both views and give your opinion.",
    kind: "essay",
    overview:
      "The strongest case for employer funding arises when a firm requires a specific skill; the case is less clear for a qualification an employee can take anywhere.",
    weak: "Employers have money and staff do not have enough money, so employers should pay for all courses.",
    strong:
      "A warehouse that introduces a new inventory system benefits directly when every employee learns the same procedure. Charging staff for that course would shift the cost of a business decision onto people with little choice. A portable qualification chosen by one employee presents a different case.",
    annotation: "把强制的企业专用技能与个人可转移资质区分开，为立场划界。",
    revision: "第二段能否给员工自费一方一个真正成立的条件？",
  },
  {
    id: "e-commute-pricing",
    title: "城市交通收费",
    prompt:
      "In some cities drivers are charged to enter busy areas during the working day. Do the advantages of this policy outweigh the disadvantages? Give reasons for your answer and include relevant examples.",
    kind: "essay",
    overview:
      "A charge can reduce avoidable car journeys, but its benefits depend on whether people who must travel have a realistic alternative.",
    weak: "This policy has many advantages and disadvantages. Traffic is a global issue in today's world.",
    strong:
      "A city that uses part of the revenue to extend early bus services changes the choice available to shift workers. Without that service, a charge may simply raise the cost of getting to work for the people least able to change their hours.",
    annotation: "说明收费如何影响不同人群，用配套条件解释你的权衡。",
    revision: "指出哪个利或弊更重，并交代何时结论会变化。",
  },
  {
    id: "e-short-week",
    title: "缩短工作周",
    prompt:
      "Some organisations are moving to a four-day working week while keeping salaries the same. To what extent do you agree or disagree that all employers should adopt this policy?",
    kind: "essay",
    overview:
      "I support trials where work can be reorganised, but a universal requirement would treat coverage-based and project-based roles as if they were identical.",
    weak: "Workers like holidays and happy workers always do more work.",
    strong:
      "An engineering team might recover a day's capacity by removing repeated approval meetings. A night-care service, however, must still provide a trained person at each bedside. Unless staffing increases, the same policy can reduce coverage even when individual workers feel more rested.",
    annotation: "用两个工作机制不同的场景说明 all 这一限定词为何关键。",
    revision: "替换 always 等绝对判断；明确哪些岗位适用、哪些需要额外条件。",
  },
  {
    id: "e-repair",
    title: "维修与换新",
    prompt:
      "More household goods are replaced instead of repaired. Why does this happen, and what measures could encourage people to repair usable goods?",
    kind: "essay",
    overview:
      "Replacement becomes rational when the price and uncertainty of repair exceed the cost of buying a predictable replacement.",
    weak: "People are lazy and the government should educate everyone.",
    strong:
      "A repairer who cannot obtain a small switch may have to replace an entire control unit. Requiring suppliers to sell common components separately would tackle that cost directly. A general advertising campaign would do little for the customer facing the same expensive quotation.",
    annotation: "原因与措施一一对应，用可替换部件解释价格机制。",
    revision: "检查至少一条原因和一项措施之间有清楚的因果桥梁。",
  },
  {
    id: "e-online-teaching",
    title: "远程课程与实践",
    prompt:
      "Universities should deliver more of their teaching online, even if students spend less time on campus. To what extent do you agree or disagree? Support your answer with reasons and examples.",
    kind: "essay",
    overview:
      "Online delivery can improve access to lectures, but the right balance depends on the type of feedback a student needs.",
    weak: "The Internet is convenient and technology is developing very quickly.",
    strong:
      "A recorded statistics lecture allows a student to replay the explanation of a test. By contrast, a nursing tutor may need to correct a hand position immediately during a procedure. The useful dividing line is the need for direct observation, rather than the age of the technology.",
    annotation: "用反馈方式作为划分标准，例子为论点服务。",
    revision: "给一个课程能上线、另一环节仍需要线下的可验证理由。",
  },
];
