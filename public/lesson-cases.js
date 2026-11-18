// Original case files. A listening update deliberately changes or adds to the written brief.
// Each question stores the correct answer first, then two distractors and a Chinese explanation.
const q = (prompt, correct, wrong1, wrong2, explanation) => ({
  prompt,
  correct,
  distractors: [wrong1, wrong2],
  explanation,
});
function unit(
  title,
  topic,
  reading,
  listening,
  readQ,
  listenQ,
  followQ,
  terms,
) {
  return {
    title,
    topic,
    reading,
    listening,
    readQ,
    listenQ,
    followQ,
    terms: terms.split("\n").map((line) => line.split("|")),
  };
}
export const cases = [
  unit(
    "项目初见",
    "joining a new team",
    "Welcome to the Riverside design team. Your first morning starts with a tour at nine. Meet at the blue desk inside the main entrance. Bring a photo ID so Mia can print your visitor badge. Your laptop will already be on the second floor. If the train is late, send Mia a text. Reception staff can show you the way, but they cannot change the tour time.",
    "Hi, this is Mia. A quick update for tomorrow. I said the blue desk in my email, but the builders have closed that entrance. Meet me outside the small café opposite the station. The tour still starts at nine. You only need your photo ID. I'll bring the paperwork.",
    q(
      "Why should a new starter bring photo ID?",
      "To get a visitor badge",
      "To collect a laptop",
      "To pay for the tour",
      "目的是办理访客证。",
    ),
    q(
      "Where should you meet Mia now?",
      "Outside the café",
      "At the blue desk",
      "On the second floor",
      "邮件里的蓝色服务台是旧地点，电话改成了咖啡店外。",
    ),
    q(
      "What will Mia bring?",
      "The paperwork",
      "Your ID",
      "A laptop",
      "末句由 Mia 负责带文件。",
    ),
    `introduce yourself|介绍自己|Could you introduce yourself to the new team?
report to|向……汇报|I report to the design manager.
check in|签到登记|Please check in before the tour starts.
visitor badge|访客证|Wear your visitor badge near the entrance.
get in touch|取得联系|I'll get in touch when the train arrives.
confirm the time|确认时间|Let's confirm the time before we leave.`,
  ),
  unit(
    "约时间与改约",
    "rescheduling a visit",
    "A delivery driver can visit the repair shop on Wednesday or Friday. On Wednesday the workshop is open but the loading bay is closed for cleaning. On Friday both are open until noon. Large boxes must go through the loading bay. Small envelopes can be left at the front counter. The shop asks visitors to book by email because its phone number is changing.",
    "Hello, it's Rosa from the repair shop. I suggested Friday at eleven, but the driver has a medical appointment then. Can we make it half past nine on Friday instead? He has two large boxes. Please meet him at the loading bay, not at the front counter.",
    q(
      "Which delivery can the shop accept on Wednesday?",
      "A small envelope",
      "A large box",
      "Furniture for the workshop",
      "大箱子必须走装货区，周三该区域关闭。",
    ),
    q(
      "What time does Rosa now suggest?",
      "9:30 on Friday",
      "11:00 on Friday",
      "9:30 on Wednesday",
      "十一点与司机的预约冲突。",
    ),
    q(
      "What is the driver bringing?",
      "Two large boxes",
      "A small envelope",
      "Two chairs",
      "听到 two large boxes 后要选装货区域。",
    ),
    `book a slot|预订时段|Can I book a slot for Friday morning?
move it back|把时间推迟|The driver is late, so let's move it back an hour.
bring it forward|把时间提前|Could we bring it forward from eleven to ten?
be available|有空|Will you be available after lunch?
loading bay|装卸区|The van is waiting in the loading bay.
at short notice|临时，很短时间内|Thanks for coming at short notice.`,
  ),
  unit(
    "问路与交通",
    "getting to a venue",
    "The evening class is at Hill Library. From the railway station, follow Garden Road to the bridge. The library entrance is on the right just before the bridge. The door beyond the bridge belongs to the sports centre. Bus passengers should get off at Market Square. There is no parking outside the library after six, but cyclists may leave their bikes in the courtyard.",
    "This is a travel update from Dan. The number twelve bus normally stops at Market Square. Tonight it will drop passengers at River Street because of the fair. It's a five-minute walk from there. Cyclists can still use the courtyard. The evening class begins at seven as usual.",
    q(
      "Which place is beyond the bridge?",
      "The sports centre",
      "The library entrance",
      "The railway station",
      "图书馆入口在桥前，过桥后的门属于体育中心。",
    ),
    q(
      "Which bus stop is in use tonight?",
      "River Street",
      "Market Square",
      "Garden Road",
      "normally 后是平时站点，tonight 后是临时站点。",
    ),
    q(
      "How long is the walk from the temporary stop?",
      "Five minutes",
      "Twelve minutes",
      "Seven minutes",
      "twelve 是公交车号，seven 是上课时间。",
    ),
    `get off|下车|I get off the bus near the library.
across from|在……对面|The ticket office is across from the bank.
within walking distance|在步行范围内|The hall is within walking distance of my flat.
temporary stop|临时站点|Look for the yellow sign at the temporary stop.
take a detour|绕行|We need to take a detour around the fair.
miss the connection|错过接驳班次|If the train is late, we might miss the connection.`,
  ),
  unit(
    "听清客户需求",
    "handling a customer request",
    "There are two ways to return a shop order. Unopened goods can be taken to any branch with the original receipt. An item that arrived damaged should stay in its packaging. The customer should send two photos before arranging collection. The shop pays the collection fee for damage reported within seven days. A customer who simply changes their mind pays for postage.",
    "Hi, I'm Oscar. My new lamp works, but the shade has a crack. I don't want a refund. Could you send just a new shade? I've already taken the two pictures. I can be home on Thursday afternoon, but please call me before sending a driver.",
    q(
      "Who pays to collect goods damaged on arrival if reported on day two?",
      "The shop",
      "The customer",
      "The branch manager personally",
      "七天内申报到货损坏，由商家承担取件费。",
    ),
    q(
      "What would Oscar like?",
      "A replacement shade",
      "A full refund",
      "A different lamp",
      "灯工作正常，坏的是灯罩。",
    ),
    q(
      "What should the shop do before dispatching a driver?",
      "Call Oscar",
      "Ask for a receipt again",
      "Visit on Thursday morning",
      "时间信息是周四下午，但附加要求是先打电话。",
    ),
    `request a refund|申请退款|You can request a refund through the sales team.
replacement part|替换零件|The technician will post a replacement part.
proof of purchase|购买凭证|Please keep your proof of purchase until the repair is complete.
arrange collection|安排取件|Can we arrange collection for tomorrow?
at no extra cost|无须额外付费|We can provide a new cable at no extra cost.
follow up on|跟进|I am calling to follow up on my request.`,
  ),
  unit(
    "描述学习与工作经历",
    "explaining your experience",
    "The evening workshop pairs volunteers with new readers. Experience in a school is welcome but optional. Every volunteer must attend a short introduction about privacy, including volunteers who have taught before. After that, each pair chooses a weekly meeting time. The library lends books for free. Volunteers who wish to buy their own books can ask the organiser for a list.",
    "Hi, I'm Grace, one of the volunteers. I used to teach at a primary school, so I first thought I could skip the introduction. I checked with the library and it is compulsory for me too. My reader and I have agreed to meet on Mondays, not Tuesdays, after the introduction.",
    q(
      "Which condition applies to all volunteers?",
      "Attending the privacy introduction",
      "Buying their own books",
      "Having taught in a school",
      "正文明确用 every volunteer，包括有教学经验的人。",
    ),
    q(
      "Why did Grace originally expect to skip the introduction?",
      "She had taught before",
      "She had paid for it",
      "She owned the books",
      "她起初把教学经验误当作豁免条件。",
    ),
    q(
      "Which day did her pair choose?",
      "Monday",
      "Tuesday",
      "Sunday",
      "听清 Mondays, not Tuesdays 的修正。",
    ),
    `gain experience|积累经验|I hope to gain experience by helping new readers.
take responsibility for|负责|I take responsibility for the weekly timetable.
work independently|独立工作|After training, volunteers can work independently.
previous role|以前的岗位|In my previous role I helped children choose books.
transferable skill|可迁移技能|Listening carefully is a transferable skill.
learn on the job|在工作中学习|New assistants learn on the job with a partner.`,
  ),
  unit(
    "交接任务与截止时间",
    "handing over a task",
    "The night shift checks the fridges and writes down their temperatures. If a reading is high, check again after ten minutes. Move the food only if the second reading is also high. The morning team orders supplies. During a public holiday the night team may order milk, but it must leave a note explaining how much it ordered. Both shifts use the same logbook.",
    "Evening, this is Kiran. Fridge B was warm at eight, so I checked it again ten minutes later. The second reading was normal. I've left the food where it was. We're short of milk. As tomorrow is a public holiday, I've ordered six bottles and recorded the quantity in the book.",
    q(
      "When should the night team move the food?",
      "After two high readings",
      "After the first high reading",
      "When the morning team arrives",
      "必须复测后仍然偏高。",
    ),
    q(
      "What did Kiran decide about the food?",
      "To leave it in the fridge",
      "To move it to another fridge",
      "To throw it away",
      "复查正常，因此没有移动。",
    ),
    q(
      "How much milk did Kiran order?",
      "Six bottles",
      "Eight bottles",
      "Ten bottles",
      "八点和十分钟都与冰箱检查有关。",
    ),
    `cover a shift|替人值班|Could you cover a shift for me next Friday?
hand over a task|交接任务|Please hand over a task before you leave.
meet a deadline|按期完成|We moved the inspection to meet a deadline.
run low on|快要用完|We often run low on labels at weekends.
keep a record|保留记录|We keep a record of every temperature check.
outstanding issue|尚未处理的问题|There is one outstanding issue with the new freezer.`,
  ),
  unit(
    "租房与比较方案",
    "choosing somewhere to live",
    "Oak House costs less per month than the flats at Pine Court. Oak tenants pay their own heating bills and must bring a desk. Pine includes heating and furniture. Oak is a shorter cycle ride to campus. Only Pine accepts contracts shorter than six months. Both buildings require a deposit, which the owner returns if the tenant leaves the room in good condition.",
    "Hi Jo, it's Ben. I was leaning towards Oak because I can cycle to campus. Then the office confirmed my placement ends in four months. I booked a viewing at Pine instead. It's on Saturday at two. They've asked me to bring ID; the deposit isn't due at the viewing.",
    q(
      "Which building suits someone requiring a four-month contract?",
      "Pine Court",
      "Oak House",
      "Either building",
      "只有 Pine 接受不足六个月的合同。",
    ),
    q(
      "Why did Ben change his preference?",
      "His placement has a short end date",
      "He cannot ride a bicycle",
      "Oak requires ID",
      "改变决定的是合同期限。",
    ),
    q(
      "What must Ben bring to the viewing?",
      "ID",
      "The deposit",
      "A desk",
      "押金在看房时还不需要交。",
    ),
    `pay a deposit|付押金|We need to pay a deposit before moving in.
utility bill|水电等公用事业账单|The rent does not include the utility bill.
fully furnished|配齐家具的|I want a fully furnished flat for the summer.
short-term lease|短期租约|A short-term lease suits my placement.
within budget|在预算之内|This room is within budget even with heating.
view a property|看房|Could I view a property before signing anything?`,
  ),
  unit(
    "会中澄清与确认",
    "clarifying a decision",
    "A museum team has funds for one improvement this month. The guide team wants a new map. The front desk would prefer signs because visitors repeatedly ask about the lockers. No decision will be made until staff count questions for a week. Each shift records the subject of a question, not the visitor’s name. The director will read a summary on Friday.",
    "Jamal here. A quick clarification about the count. I said to write down every question, but the director wants only questions about finding things. Leave out ticket prices. If one family asks about both toilets and lockers, record two entries. Send totals to me by Thursday evening, ahead of Friday's summary.",
    q(
      "Why has the museum delayed its choice?",
      "To collect evidence from visitors’ questions",
      "To raise the ticket price",
      "To hire a director",
      "要先统计，再决定改地图还是标牌。",
    ),
    q(
      "Which question belongs in the count?",
      "Where are the lockers?",
      "How much is admission?",
      "Can I buy a season ticket?",
      "只记录位置类问询。",
    ),
    q(
      "When should staff submit their totals?",
      "Thursday evening",
      "Friday evening",
      "Friday morning",
      "周五是主任阅读汇总的日期。",
    ),
    `ask for clarification|请求说明|I need to ask for clarification before I record the figures.
make a distinction|作出区分|Let's make a distinction between requests and complaints.
take minutes|记录会议纪要|I will take minutes while you chair the meeting.
raise a question|提出问题|May I raise a question about the lockers?
reach an agreement|达成协议|We hope to reach an agreement before Friday.
sum up|总结|Can you sum up what the team decided?`,
  ),
  unit(
    "解释流程与顺序",
    "explaining how something works",
    "In the community tool library, a borrower reserves an item online. A volunteer then inspects it and places it in a numbered locker. Only after that inspection does the system send a collection code. If the borrower misses the two-day collection window, the reservation expires. Late collection is different from a late return. A late return may prevent the next borrower from collecting a reserved tool.",
    "It's Asha at the tool library. Your drill has passed its inspection. Your message said locker thirty; the right number is thirteen. The code itself hasn't changed. Please collect it by five tomorrow. The drill must come back with its charger, even if you haven't used it.",
    q(
      "What triggers the collection code?",
      "Completion of the inspection",
      "An online search",
      "The tool being returned late",
      "要等志愿者检查物品后才发送取件码。",
    ),
    q(
      "Which locker contains the drill?",
      "13",
      "30",
      "15",
      "听辨 thirteen 与 thirty，并注意更正。",
    ),
    q(
      "Which accessory must be returned?",
      "The charger",
      "A spare drill",
      "A lock",
      "充电器即使没使用也要一并归还。",
    ),
    `carry out a check|执行检查|We carry out a check before each loan.
place an order|下单|You can place an order on the library website.
collection point|领取点|The collection point closes at five.
in advance|提前|Reserve heavy tools in advance.
return in person|亲自归还|Please return in person if the cover is damaged.
expire automatically|自动失效|Unused codes expire automatically after two days.`,
  ),
  unit(
    "投诉、道歉与解决",
    "resolving a service problem",
    "A shared office promises a quiet room to anyone with a confirmed booking. Yesterday a booking system error assigned the same room to two teams. One team chose another building and paid its own taxi fare. Managers can refund a documented transport expense. They can also give the affected team one free hour. They cannot reimburse time lost in traffic.",
    "Hello, this is Mei in accounts. Thanks for sending the taxi receipt. We can repay the fare, but the picture cuts off the total. Please send a clearer photo by Monday. You can use the free hour this month or next. You don't have to make that booking today.",
    q(
      "Which loss can the office reimburse?",
      "A documented taxi fare",
      "Time spent in traffic",
      "An estimated missed sale",
      "文本明确要求可证明的交通费。",
    ),
    q(
      "Why is a second photo needed?",
      "The total is missing",
      "The taxi company is unknown",
      "The date is wrong",
      "现有照片裁掉了总金额。",
    ),
    q(
      "When can the team use the free hour?",
      "This month or next",
      "Today only",
      "After Monday only",
      "截止日只约束补传照片。",
    ),
    `resolve a complaint|处理投诉|We need a clear record to resolve a complaint.
accept responsibility|承担责任|The office will accept responsibility for the booking error.
supporting document|证明文件|Please attach a supporting document to the claim.
make up for|弥补|The free hour should make up for the inconvenience.
claim an expense|报销一笔开支|You can claim an expense through accounts.
offer an alternative|提供另一种选择|Could you offer an alternative if the room is full?`,
  ),
  unit(
    "汇报数字与趋势",
    "reporting changes in numbers",
    "In April a bicycle workshop repaired 80 bikes, compared with 100 in May. June brought only 90 repairs, although enquiries reached their highest level that month. The figures count completed jobs, not appointments. A mechanic was away for two weeks in June. The report notes that this may have reduced capacity; it does not show that local demand fell.",
    "Here's Leo with a correction to the repair figures. May's total of one hundred is right. In June we finished ninety jobs, not nineteen. Ten further bikes were booked but were still in the queue on the last day. Please leave those ten out of the completed-repairs column.",
    q(
      "What is supported by the workshop records?",
      "Repairs peaked in May",
      "Demand definitely fell in June",
      "Bookings and repairs were identical",
      "只统计完成量，6 月咨询量还达到最高。",
    ),
    q(
      "How many repairs were completed in June?",
      "90",
      "19",
      "100",
      "注意 ninety 和 nineteen，且排队中的车辆不计入。",
    ),
    q(
      "What do the ten additional bikes represent?",
      "Booked jobs still waiting",
      "Completed jobs in May",
      "Customers who cancelled",
      "它们还在队列里。",
    ),
    `rise from|从……上升|Repairs rise from eighty to a hundred in the example.
fall by|下降了……|Sales may fall by ten units next month.
reach a peak|达到峰值|Enquiries usually reach a peak before summer.
remain stable|保持稳定|Staffing levels should remain stable this year.
account for|占……比例|Small repairs account for half of our bookings.
overall trend|总体趋势|One unusual week can hide the overall trend.`,
  ),
  unit(
    "表达原因与后果",
    "explaining causes cautiously",
    "A factory introduced a longer lunch break in March. Fewer errors were reported during April than in February. During the same period, the factory also replaced a faulty measuring tool and hired an experienced supervisor. The safety officer welcomes the change but says the records cannot identify a single cause. She suggests observing two teams using the same tools while recording break lengths.",
    "Nora from the safety office here. We won't change anyone's break for this study. I first mentioned daily interviews, but staff said that would interrupt production. Use the existing weekly error records. Write down any change in the tools as well; otherwise the comparison may be misleading.",
    q(
      "Why is the reason for the fall in errors uncertain?",
      "Several conditions changed together",
      "No errors were counted",
      "Employees refused every interview",
      "午休、工具和主管同时变化。",
    ),
    q(
      "Which evidence will Nora use?",
      "Existing weekly error records",
      "Daily staff interviews",
      "Individual break experiments",
      "原计划的每日访谈被取消。",
    ),
    q(
      "What other change should be logged?",
      "Changes in tools",
      "Names of staff at lunch",
      "Travel times",
      "工具变化会影响不同团队的可比性。",
    ),
    `contribute to|促成|Clearer labels may contribute to safer work.
lead to|导致|A missing measurement can lead to a bad decision.
rule out|排除|The manager cannot rule out a fault in the tool.
be linked to|与……有关联|The drop may be linked to better training.
possible explanation|可能的解释|A shorter queue is one possible explanation.
draw a conclusion|得出结论|We need more observations to draw a conclusion.`,
  ),
  unit(
    "观点、例证与让步",
    "supporting a position",
    "A training centre plans to record some evening lessons. Several students support the idea because they work changing shifts. Others worry that classmates may stop attending discussions in person. The centre proposes a small trial. Recordings will contain only the tutor’s explanation, followed by a summary of the activity. Student voices will be left out. Participants can submit comments anonymously after three weeks.",
    "I'm Ellis, one of the evening tutors. A few students asked if the recording would include their questions. It won't. I will restate the topic in my own words. We had planned a five-week trial, but we now have three weeks before the room closes for decoration.",
    q(
      "What is the purpose of leaving student voices out?",
      "To keep students’ spoken contributions off the recording",
      "To remove the tutor’s explanation",
      "To replace the live discussion",
      "安排只保留教师讲述，保护学生发言。",
    ),
    q(
      "What will Ellis do when a student asks something?",
      "Restate the topic",
      "Play back the student’s voice",
      "Stop the entire trial",
      "教师会用自己的话概括。",
    ),
    q(
      "How long will the trial last?",
      "Three weeks",
      "Five weeks",
      "One evening",
      "装修时间使试行从五周缩为三周。",
    ),
    `support a claim|支持一个主张|A clear example can support a claim about training.
raise a concern|提出担忧|Students may raise a concern without giving their names.
in practice|在实际中|The plan sounds simple, but how will it work in practice?
to some extent|在一定程度上|Recordings help to some extent when a shift changes.
give an example|举例|Could you give an example from last week's lesson?
take into account|考虑到|We need to take into account the needs of shift workers.`,
  ),
  unit(
    "协商价格与取舍",
    "negotiating a purchase",
    "A café needs new reusable cups. One supplier offers a discount if the café orders at least 200, but the cupboard holds only 120. Another supplier will deliver 100 now and 100 next month. Its price per cup is higher, although delivery is free. The café has enough cash for either contract. The manager wants staff to compare storage needs as well as the price on the invoice.",
    "Hi, it's Ana at North Glass. We can split the delivery as discussed. I originally offered green cups in both batches, but only the first hundred will be green. The second batch will be blue unless you can wait until June. There is still no delivery charge.",
    q(
      "Which obstacle affects the discounted order?",
      "Limited storage space",
      "A shortage of cash",
      "A delivery charge",
      "橱柜容量只有 120，折扣起订量却是 200。",
    ),
    q(
      "Which colour will the second batch normally be?",
      "Blue",
      "Green",
      "White",
      "绿色第二批要等到六月。",
    ),
    q(
      "Which term has stayed the same?",
      "Free delivery",
      "One delivery date",
      "Both batches being green",
      "最后一句确认运费不变。",
    ),
    `bulk order|大宗订单|A bulk order would fill our entire cupboard.
unit price|单价|The unit price includes packaging.
split the delivery|分批配送|Can you split the delivery between our two sites?
make a concession|作出让步|We could make a concession on colour.
minimum quantity|最低数量|The minimum quantity is printed beside the price.
value for money|物有所值|A smaller order may offer better value for money.`,
  ),
  unit(
    "看懂调查与偏差",
    "interpreting survey evidence",
    "A bus operator put a survey link on the back of monthly passes. Of the people who replied, most asked for earlier buses. A councillor argued that the result showed what all residents wanted. An analyst pointed out that occasional riders, people without a pass and people who never used the bus had few opportunities to respond. She suggested speaking to residents at the market before changing the timetable.",
    "This is Sam from the survey team. We're still going to the market on Saturday. Our first idea was to question people next to the bus stop. Instead, set up inside the main entrance, where shoppers arriving on foot will also pass. Count refusals, but don't ask anyone who refuses for their name.",
    q(
      "What is the analyst questioning?",
      "How well respondents represent all residents",
      "Whether passes exist",
      "Whether early buses can run",
      "样本集中在月票用户，不能直接代表其他居民。",
    ),
    q(
      "Where should the team set up?",
      "Inside the main market entrance",
      "Beside the bus stop",
      "At the ticket office",
      "主要入口能接触更多出行方式不同的人。",
    ),
    q(
      "What should be recorded about refusals?",
      "Their total number",
      "People’s names",
      "Reasons in every case",
      "只计数，不追问姓名。",
    ),
    `representative sample|有代表性的样本|We need a representative sample before changing the service.
response rate|回复率|The response rate was lower on weekdays.
be likely to|很可能|Regular passengers are likely to notice the poster.
take part in|参与|Would you like to take part in a short survey?
collect evidence|收集证据|Let's collect evidence before changing the route.
survey finding|调查结果|One survey finding needs further investigation.`,
  ),
  unit(
    "识别风险与优先级",
    "prioritising maintenance",
    "At a community theatre, a loose handrail and a faded stage curtain were reported on the same day. The curtain is visible to every audience member, but the handrail is used by visitors on the stairs. The caretaker can close that staircase while an engineer checks the rail. Painting the curtain would require a separate contractor. The maintenance policy gives priority to hazards that could cause injury.",
    "It's Priya at the theatre. The west stairs have been closed. I first said we'd direct people through the staff corridor, but boxes are blocking it. Please guide them to the lift near the ticket office. We expect the engineer after lunch, though the stairs will stay closed until she approves them.",
    q(
      "Which job has higher priority under the policy?",
      "Checking the handrail",
      "Painting the curtain",
      "Ordering extra seats",
      "受伤风险决定优先顺序。",
    ),
    q(
      "Which alternative route should visitors use?",
      "The lift near the ticket office",
      "The staff corridor",
      "The west stairs",
      "走廊被箱子堵住了。",
    ),
    q(
      "When can the stairs reopen?",
      "After the engineer approves them",
      "At lunchtime automatically",
      "As soon as the staff move boxes",
      "工程师到达与批准开放是两个不同的时间点。",
    ),
    `pose a risk|带来风险|Wet steps pose a risk to visitors.
take precautions|采取预防措施|We must take precautions before the hall opens.
urgent repair|紧急维修|The loose rail needs an urgent repair.
restrict access|限制进入|Please restrict access to the west stairs.
keep clear of|远离|Visitors should keep clear of the work area.
give priority to|优先考虑|The budget should give priority to safety.`,
  ),
  unit(
    "跨文化反馈",
    "giving useful feedback",
    "A software team reviews draft instructions in pairs. The writer reads the first comment privately, then meets the reviewer to discuss it. Reviewers describe one point where a reader might get lost and demonstrate a possible revision. The writer can take a different approach if it solves the same problem. Simply counting the number of comments gives little information about the quality of a review.",
    "Hi, this is Tomas. My comment on the setup guide was about the order of the steps, not about your English. I tried the instructions on a new laptop and had to go back a page to find the login details. Could we move those details nearer the start? I'm free after three for a short call.",
    q(
      "When can a writer choose a different revision?",
      "When it solves the same reader problem",
      "Only after deleting every comment",
      "Only before speaking to a reviewer",
      "重点是解决读者的问题，具体改法可不同。",
    ),
    q(
      "What caused Tomas difficulty?",
      "The order of information",
      "The writer’s English",
      "A broken laptop",
      "需要返回上一页找登录信息，是顺序问题。",
    ),
    q(
      "What does Tomas propose?",
      "Moving login details earlier",
      "Replacing the laptop",
      "Cancelling the review",
      "建议前移信息。",
    ),
    `constructive feedback|建设性反馈|Readers can offer constructive feedback on the draft.
point out|指出|Could you point out the first confusing step?
make a revision|作出修改|I'll make a revision before the next review.
be open to|愿意接受|I'm open to a different explanation.
put yourself in someone's shoes|设身处地|Try to put yourself in someone's shoes before replying.
clear up a misunderstanding|消除误会|The call helped clear up a misunderstanding.`,
  ),
  unit(
    "预算与环境影响",
    "comparing environmental choices",
    "A grocery shop compared paper bags with a returnable crate for local deliveries. A single crate cost more to manufacture and occupied more space in the van. A crate could, however, complete many journeys. The shop counted how often each returned. Customers who forgot a crate could hand it back on the next delivery. The pilot report says the comparison depends on return rates and van space, as well as the price of each container.",
    "This is Isla from deliveries. The pilot log used to record only crates handed back on the doorstep. From Monday, include crates returned to the shop counter too. Count each crate just once using its number. A late return still counts. Don't count a customer's promise to return one as an actual return.",
    q(
      "Which information matters when comparing bags and crates?",
      "How often crates are returned",
      "The colour of the van",
      "The design of the shop sign",
      "重复使用次数会影响不同容器的比较。",
    ),
    q(
      "What new event belongs in the log?",
      "A crate returned at the shop counter",
      "A promise to bring a crate back",
      "A bag given away",
      "从周一起增加店内归还记录。",
    ),
    q(
      "How should staff avoid counting a return twice?",
      "Use the crate number",
      "Use the driver’s name",
      "Ignore all late returns",
      "按周转箱的唯一编号记录。",
    ),
    `reduce waste|减少浪费|Returning containers can reduce waste.
running cost|运营成本|Each extra trip adds to the running cost.
environmental impact|环境影响|The team will compare the environmental impact of both options.
break even|收支平衡|The scheme may break even during its second year.
in the long run|从长远来看|Repairs can save money in the long run.
weigh the benefits|权衡好处|We need to weigh the benefits against the extra journeys.`,
  ),
  unit(
    "培训与技能迁移",
    "evaluating a training programme",
    "New receptionists at a sports centre practiced difficult conversations using role cards. In the practice room each customer said exactly what was on the card. During the first real week, customers often changed the subject or left details unstated. Staff who had memorised a fixed reply sometimes missed the request. The trainer kept the useful phrases but added a second round in which the customer could change one important detail.",
    "Hello from Pat, the trainer. On Friday you'll try the exercise again. We won't score you on repeating the sample reply. Listen for the changed detail and ask a relevant follow-up. Your partner will mark whether the booking problem was solved. Please swap roles after four minutes, even if you haven't finished the conversation.",
    q(
      "Why did the trainer change the second round?",
      "Real customers could give unexpected information",
      "Role cards were too expensive",
      "Customers refused to book",
      "背固定回答应付不了对话变化。",
    ),
    q(
      "What will partners mark?",
      "Whether the booking problem was solved",
      "Whether the sample reply was copied",
      "How fast the first sentence was spoken",
      "评价依据是沟通任务是否解决。",
    ),
    q(
      "When should partners change roles?",
      "After four minutes",
      "Only after solving the problem",
      "At the end of Friday",
      "达到四分钟就交换，即便还未完成。",
    ),
    `put into practice|付诸实践|I want to put into practice what I learned today.
make progress|取得进步|We make progress when feedback is specific.
handle a situation|应对一种情况|Could you handle a situation like this at reception?
identify a need|识别需求|A careful question can identify a need.
adapt to change|适应变化|Role play helps learners adapt to change.
evaluate performance|评价表现|We evaluate performance using a new situation.`,
  ),
  unit(
    "在压力下做决定",
    "choosing under constraints",
    "A small concert hall must repair an air vent before its autumn season. Contractor A can finish the physical work in two days, but the ventilation inspector is unavailable until the following Friday. The hall cannot reopen before the inspection. Contractor B needs four days and can arrange an inspection on the final afternoon. A charges less for the work itself. B includes a temporary fan for rehearsals in a neighbouring room. The manager compares the expected total cost, including room hire and refunds for cancelled events. Two bookings can be moved at no charge if the hall gives a week of notice. A third is a charity concert with printed tickets and cannot easily move. The committee requests a calendar of actual opening dates before it votes.",
    "It's Hannah at the hall. One detail for the calendar: the charity concert is on the fourteenth, not the fortieth, of course. The organisers can move the rehearsal to Wednesday, but the public performance has to stay on Friday. Before agreeing to either contractor, get the inspector's availability in writing. A verbal promise won't protect our bookings.",
    q(
      "Why does the committee request opening dates?",
      "A shorter repair need not mean an earlier reopening",
      "Both contractors offer free room hire",
      "The charity concert has been cancelled",
      "能否复业还受检查日期制约。",
    ),
    q(
      "Which event can change day?",
      "The rehearsal",
      "The public performance",
      "The inspection appointment",
      "彩排可改，正式演出要保留周五。",
    ),
    q(
      "What confirmation does Hannah want?",
      "Written inspector availability",
      "A verbal promise",
      "Printed rehearsal tickets",
      "需要书面确认检查档期。",
    ),
    `allow for|把……考虑进去|Our calendar must allow for the final inspection.
meet a requirement|满足要求|The temporary fan does not meet a requirement for reopening.
cost estimate|成本估算|This cost estimate includes refunds.
at stake|受到影响，处于风险中|Several bookings are at stake this week.
contingency plan|应急方案|Please prepare a contingency plan for the rehearsal.
make an informed decision|作出知情决定|The committee needs dates to make an informed decision.`,
  ),
  unit(
    "对照不同来源",
    "reconciling two accounts",
    "An online announcement says a new footpath is open all week. The printed park leaflet, dated two months earlier, says it closes on Wednesdays. A resident treated this difference as a mistake. The ranger explains that both notices described the position when they were written. Weekly closures ended after work on a drain was completed. However, gardeners can still close a short section when a tree is unsafe. Such closures are shown on a board at the park gate. The online announcement describes the normal schedule; the board gives information for that particular day. The park will add a note about the board to the next leaflet. It does not intend to promise that every metre of the path will always be open.",
    "Ranger Alex speaking. Today the gate board shows a closure near the pond. Walkers can reach the playground by the upper path. Yesterday we suggested the lower path, but rain has made that route slippery. We'll check the tree again at noon; please don't tell visitors the footpath will definitely reopen at that time.",
    q(
      "How does the gate board differ from the online notice?",
      "It reports conditions on a particular day",
      "It lists all future weekly closures",
      "It contains the oldest information",
      "网站给常规安排，现场板给实际当日情况。",
    ),
    q(
      "Which path should walkers use today?",
      "The upper path",
      "The lower path",
      "The closed pond section",
      "雨后下方小路太滑。",
    ),
    q(
      "What does noon refer to?",
      "Another check on the tree",
      "A guaranteed reopening",
      "The end of the rain",
      "复查不等于确定重开。",
    ),
    `cross-check|交叉核实|Please cross-check the leaflet against today's notice.
up to date|最新的|Is the information on this board up to date?
apparent contradiction|表面上的矛盾|The dates explain the apparent contradiction.
apply to|适用于|The closure will apply to a short section.
reliable source|可靠来源|The gate board is a reliable source for today's route.
subject to change|可能变更|The reopening time is subject to change.`,
  ),
  unit(
    "讲清证据与局限",
    "presenting a reasoned recommendation",
    "A neighbourhood group ran a trial in which people could borrow a cargo bicycle for local errands. Thirty households joined. Each already owned a secure place to park a bicycle and had volunteered after reading an article about cycling. At the end of the month most said that they had used the car less often. A newspaper wanted to report that giving every household access to a cargo bicycle would cut traffic across the city. The project leader advised caution. Some journeys might have been made on foot without the bicycle. Other households might lack safe storage. A second trial will invite households through a random selection of addresses and offer shared parking. Participants will record what they would otherwise have used for each journey. These changes may improve the evidence, although they cannot ensure that every invited household agrees to take part.",
    "Leila here. For the second trial, interviewers should ask about the alternative for each individual journey. A general question about owning a car won't do. We thought about offering free helmets as a reward, but that might mainly attract regular cyclists. Everyone invited will instead receive the same small shopping voucher, even if they decline the bicycle trial.",
    q(
      "Why record the alternative for each journey?",
      "To estimate which trips actually replaced a car journey",
      "To calculate bicycle repair costs",
      "To identify who owns two cars",
      "若原本步行，使用自行车不会减少一次开车。",
    ),
    q(
      "Why was the helmet reward dropped?",
      "It might attract mostly regular cyclists",
      "Helmets cannot be bought locally",
      "Participants already owned cars",
      "头盔的吸引力可能让样本偏向骑行者。",
    ),
    q(
      "Who will receive a shopping voucher?",
      "All those invited",
      "Only people who borrow a bicycle",
      "Only interviewers",
      "邀请到的人即使拒绝参与也能获得。",
    ),
    `put forward|提出|The leader will put forward a second trial.
limited evidence|有限证据|We have limited evidence about occasional riders.
make an assumption|作出假设|We should not make an assumption about every journey.
alternative explanation|其他可能的解释|Weather offers an alternative explanation for the rise.
justify a decision|证明决定合理|These observations help justify a decision.
recommend a trial|建议试行|I would recommend a trial before a wider launch.`,
  ),
  unit(
    "面试与即时追问",
    "answering an unexpected question",
    "A recruitment panel used to ask every candidate to describe the most difficult project they had managed. The question produced confident answers, but candidates often repeated a story they had prepared. The panel now gives everyone the same short case. It asks which piece of information they would seek first and then supplies a new fact that may alter their choice. Interviewers make separate notes before sharing a score. A polished answer can still be useful if it explains a decision. However, the panel does not award extra marks for unusual vocabulary or for agreeing with its own preferred approach. It looks for a clear account of the trade-off and a willingness to revise an assumption when the evidence changes. Candidates may ask for a term to be explained before replying.",
    "Hi, I'm Felix from recruitment. You may bring a pen, but the case will be supplied in the interview room. There are two minutes to read it silently. The five minutes shown in the original email cover the discussion, not the preparation. If a term is unclear, ask the panel; that request doesn't use up your reading time.",
    q(
      "Why do interviewers introduce a new fact?",
      "To see how a candidate revises a decision",
      "To test memory for a prepared story",
      "To make all candidates agree",
      "关注能否随证据变化调整判断。",
    ),
    q(
      "How much silent reading time is allowed?",
      "Two minutes",
      "Five minutes",
      "Seven minutes",
      "五分钟是讨论，不是读题。",
    ),
    q(
      "What happens if a candidate asks about a term?",
      "The request does not reduce reading time",
      "A mark is deducted",
      "The case must be replaced",
      "可以请求解释，且不会扣读题时间。",
    ),
    `relevant experience|相关经验|Please describe one piece of relevant experience.
think on your feet|临场应变|Unexpected questions help you think on your feet.
clarify a term|澄清一个术语|May I clarify a term before suggesting a solution?
revise an assumption|修正假设|I had to revise an assumption after the call.
make a case for|论证支持……|Can you make a case for keeping the old system?
weigh up|权衡|I would weigh up the risks before I answered.`,
  ),
  unit(
    "写出有分寸的建议",
    "writing for different audiences",
    "A visitor centre is preparing two messages about a trial booking fee. A report for the council should state how many people booked and how many actually attended. A notice at the entrance should tell visitors what they must pay and when the money is returned. The manager rejects a draft notice saying that the trial has reduced missed visits. Attendance has risen since the fee began, but the same period included the school holiday and a new exhibition. The figures alone cannot separate the effect of the fee from the effect of those changes. The council report can describe the rise and list the possible explanations. The entrance notice needs a practical example of a booking that qualifies for a refund. Visitors who cancel before noon on the previous day get all their money back. A late cancellation qualifies only if another visitor takes the place.",
    "Sofia from the visitor centre here. A guest asked whether cancelling at one on the previous afternoon guarantees a refund. It doesn't, because our cutoff is noon. We can refund a late cancellation if the place is filled. Please give that answer at the desk, and refer disputed cases to me rather than promising a special exception.",
    q(
      "Why was the first entrance notice rejected?",
      "It treated a rise in attendance as proof of a cause",
      "It failed to list every visitor",
      "It used the wrong entrance",
      "同期有其他变化，数据不足以证明因果。",
    ),
    q(
      "When is a late cancellation refundable?",
      "When another visitor takes the place",
      "Whenever the visitor phones",
      "Only on a school holiday",
      "截止时间之后需有人补位。",
    ),
    q(
      "What should staff do with a disputed case?",
      "Refer it to Sofia",
      "Promise a special refund",
      "Cancel the whole exhibition",
      "争议需转给主管。",
    ),
    `qualify for|符合……条件|Which bookings qualify for a full refund?
state clearly|清楚说明|Please state clearly when the deposit is returned.
avoid ambiguity|避免歧义|An example can help us avoid ambiguity.
in response to|作为对……的回应|The notice was revised in response to visitor questions.
set out|阐述，列出|The report will set out the evidence.
on condition that|条件是|We can transfer the booking on condition that a seat is free.`,
  ),
  unit(
    "限时整合与复盘",
    "reviewing a timed trial",
    "A college tested two ways of marking practice essays. One group received detailed comments on a finished essay. A second group received shorter comments but also had time to revise the essay during class. At the end, the revised essays from the second group earned higher marks. The result looked encouraging, but it did not tell the college whether those students would perform better on a new topic without help. The coordinator therefore added a fresh task a week later. All learners received the same time and nobody saw the earlier feedback during the task. Two teachers marked the work independently without knowing which group a writer had joined. The college still faced a practical question. The revision activity took class time that could have been spent practising listening. A decision about next term had to consider both any gain in writing and the cost of giving up another activity.",
    "This is Dina with instructions for the fresh task. You have forty minutes to write about a new issue. Leave last week's comments in your bag. Two teachers will mark each answer independently. We expected to give results on Tuesday, but you'll get them on Thursday because the teachers need to compare cases where their marks differ.",
    q(
      "Why did the college add a fresh task?",
      "To see whether improvement transfers to a new topic",
      "To let students copy their revisions",
      "To reduce the time for writing",
      "原成绩出自已获反馈的作品，需检查能否迁移。",
    ),
    q(
      "What may writers consult during the fresh task?",
      "The new task instructions",
      "Their earlier comments",
      "Their marked revision",
      "明确要把上周意见留在包里。",
    ),
    q(
      "Why will results arrive on Thursday?",
      "Teachers must compare differing marks",
      "The tasks have been lost",
      "Writers have extra editing time",
      "改期是由于需要处理评分分歧。",
    ),
    `work under pressure|在压力下工作|I can work under pressure if I plan the first step.
allocate time|分配时间|Allocate time for a final check.
spot a pattern|发现规律|A second draft helped me spot a pattern in my errors.
under time constraints|在时间受限的情况下|I find it harder to plan under time constraints.
independent assessment|独立评估|A second marker provides an independent assessment.
set a target|设定目标|I will set a target for my next timed essay.`,
  ),
  unit(
    "独立沟通与最终检验",
    "planning a handover that lasts",
    "A six-month community project is closing. Volunteers set up a weekly repair table and recorded every completed repair. Their final report lists a higher total in the last month than in the first. Over the same period the table moved from a small room to a covered market with many more visitors. The report should describe the change without assuming it proves that each volunteer became faster. A new team wants to continue the service. It asks for more than a list of successful repairs: it needs to know which requests were refused, why spare parts sometimes ran out, and which room remains available in winter. The outgoing coordinator proposes giving the new team a sample booking problem to solve using only the written handover. If the new volunteers cannot find the answer, they can mark the exact missing detail. The exercise will show whether the documents are usable after their authors leave.",
    "Hi, this is Mo from the incoming team. We tested the handover yesterday. The instructions told us how to order a spare tyre, but not who could approve the cost. Please add the role responsible, not just someone's first name. We also tried the contact number for winter bookings. It worked, so that part can stay as it is.",
    q(
      "What does the practice booking problem test?",
      "Whether the new team can act using the documents alone",
      "How quickly the old team repairs tyres",
      "Which market is most profitable",
      "重点是新团队能否仅靠交接文档执行任务。",
    ),
    q(
      "Which fact was missing from the handover?",
      "Who can approve a cost",
      "How to order a spare tyre",
      "The winter booking phone number",
      "原文已有订购步骤和可用电话。",
    ),
    q(
      "How should the missing person be identified?",
      "By their role",
      "By a first name only",
      "By their home address",
      "岗位比个人名字更适合长期交接。",
    ),
    `hand over responsibility|移交责任|We need to hand over responsibility before winter.
measure progress|衡量进步|A fresh task helps measure progress.
seek clarification|寻求澄清|I would seek clarification before approving a cost.
maintain a record|维护记录|Please maintain a record of requests we cannot accept.
follow through|把事情落实|Who will follow through after the meeting?
next step|下一步|The next step is to test the revised guide.`,
  ),
];
