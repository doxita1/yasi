// Original timed reading material. Each answer carries its own evidence.
export default [
  {
    title: "Mapping the shade that people actually use",
    text: "A. The fictional town of Hartley owned a map that showed nearly every tree along its main shopping street. Each tree appeared as a neat circle centred on a trunk. To an engineer ordering replacement pavement, the map was perfectly adequate. To a passenger waiting for the number seven bus on a hot afternoon, it was much less useful. A circle on a map says little about which side of a bench receives shade at a given hour. It also says nothing about whether anybody is there to enjoy it.\n\nB. The town's first proposed improvement was to photograph the shopping street at midday. The photographs would capture the outline of each shadow in impressive detail. A landscape student pointed out a difficulty. Some stops were used mainly by schoolchildren in the late afternoon. At noon, the children were indoors and the shadows fell in a different direction. The planners therefore agreed to describe their problem in two stages. Where was the shade, and when were people likely to be waiting? To illustrate the problem, the student laid a pencil on a desk beside a lamp. Turning the lamp through a small angle moved the pencil's shadow completely off a line marked on the paper. Neither the pencil nor the line had shifted. On the street, the outline of a tree on the original map would also remain unchanged while the shade moved from a seat onto the road. The desk experiment was not intended to predict the movement at any particular bus stop. It convinced the group that a single still image, however sharp, could answer only one of its questions.\n\nC. Volunteers selected eight locations with public benches and observed each one for fifteen minutes at a time. They recorded how many people sat down, how long they waited, and whether the occupied part of the bench was shaded. They did not record names or take photographs of passengers. A bench could be occupied by someone reading for pleasure as well as someone waiting for a bus. To keep the record consistent, the team counted both. The intention was to describe use of a public seat, not to reconstruct individual journeys.\n\nD. Early notebooks showed an unexpectedly large difference between two observers at the same location. One observer had counted a person as shaded whenever the person's shoes were out of the sun. The other had judged the position of the person's shoulders. A training meeting selected shoulders as the reference point. On a second trial, with both observers at the same stop, their records were much closer. This improvement did not establish that the observations were perfect. It showed that two people could now apply the definition in much the same way.\n\nE. The most popular seat was outside a chemist. It received less shade by area than a seldom-used seat near a car park. Yet the chemist's seat supplied more shaded minutes in total because many people shared it throughout the day. The team gave this calculation a plain name: occupied shade time. A seat with no users accumulated none, however leafy its surroundings. Some residents worried that this would leave quiet streets at the bottom of every funding list. The planners agreed that present use might itself reflect poor conditions. They would keep a separate list of places where residents wanted a seat but rarely stopped. Consider two imaginary benches. Four people use the first for five shaded minutes each. A single person occupies the second for eighteen shaded minutes. From the perspective of somebody planning seats, twenty and eighteen might look remarkably similar. From the perspective of a passenger who finds the first bench already full, the difference between a short and a long visit matters. The observers therefore retained the individual counts as well as the calculated total. An attractive summary could be printed on a small map; the notebook still contained enough detail to ask a different question if a resident later proposed one.\n\nF. A trial awning was fitted above the chemist's seat. During the following week, occupied shade time rose. The observers refused to attribute the whole increase to the awning. Temporary roadworks had also moved a bus service closer to the chemist. A better test would compare similar stops over a longer period and record any timetable changes. Even with that limitation, the project had altered the town's conversation. Proposed improvements could now be discussed in terms of which passengers would benefit and at what time, rather than how large a circle appeared on a drawing.",
    questions: [
      {
        prompt:
          "The original tree map had a practical use for people repairing the street.",
        answer: "TRUE",
        explanation: "A 段指出它能帮助工程师更换路面。",
        choices: ["TRUE", "FALSE", "NOT GIVEN"],
      },
      {
        prompt:
          "The midday photographs could show how shadows fell after school.",
        answer: "FALSE",
        explanation: "B 段说明午后阴影方向不同。",
        choices: ["TRUE", "FALSE", "NOT GIVEN"],
      },
      {
        prompt: "The new observations included people reading for pleasure.",
        answer: "TRUE",
        explanation: "C 段明确把阅读者同样计入。",
        choices: ["TRUE", "FALSE", "NOT GIVEN"],
      },
      {
        prompt:
          "Each bench had the same number of visitors during the first trial.",
        answer: "NOT GIVEN",
        explanation: "文中没有八处第一次观察的人数对比。",
        choices: ["TRUE", "FALSE", "NOT GIVEN"],
      },
      {
        prompt: "How many sites did the volunteers select?",
        answer: "eight",
        explanation: "C 段开头是 eight locations。",
        alternatives: ["8"],
      },
      {
        prompt: "For how many minutes did one observation last?",
        answer: "fifteen",
        explanation: "C 段记录每次十五分钟。",
        alternatives: ["15"],
      },
      {
        prompt:
          "Which part of the body did observers finally use as a reference?",
        answer: "shoulders",
        explanation: "D 段选 shoulders。",
      },
      {
        prompt: "Which business stood beside the most popular seat?",
        answer: "chemist",
        explanation: "E 段说 outside a chemist。",
        alternatives: ["a chemist", "the chemist"],
      },
      {
        prompt: "What measure combined shade and actual use?",
        answer: "occupied shade time",
        explanation: "E 段为指标所命名。",
      },
      {
        prompt:
          "Match the idea to a paragraph: ensuring different observers use the same rule.",
        answer: "D",
        explanation: "D 段统一鞋或肩的判定口径。",
      },
      {
        prompt:
          "Match the idea to a paragraph: a concern about places with low current demand.",
        answer: "E",
        explanation: "E 段中居民担心冷清街道拿不到经费。",
      },
      {
        prompt: "Which other change complicated the awning trial?",
        answer: "A bus service was moved nearer",
        explanation: "F 段将站点移近归因于临时道路施工。",
        choices: [
          "A shop closed permanently",
          "A bus service was moved nearer",
          "All the trees were cut back",
        ],
      },
      {
        prompt: "What is the main value of the new approach?",
        answer: "It connects shade with the timing of actual use",
        explanation: "项目把空间信息同等待时间与乘客数量结合。",
        choices: [
          "It calculates each passenger's entire route",
          "It connects shade with the timing of actual use",
          "It proves awnings are best everywhere",
        ],
      },
    ],
  },
  {
    title: "The imperfect history inside a paper label",
    text: "A. A drawer in a teaching museum held twelve small clay vessels and thirteen paper labels. The objects had once been displayed together in a market-town exhibition. When the building was evacuated after a water leak, a caretaker packed the vessels in one box and the loose cards in another. Years later, a student cataloguer was asked to reunite each vessel with its description. There appeared to be a spare label. It was tempting simply to discard the one with the least legible handwriting.\n\nB. Instead the cataloguer made two lists. One described physical features: height, colour after firing, handle position and visible damage. The second recorded the statements made by the labels, including uncertain readings of difficult words. Keeping the lists separate prevented a guessed label from influencing the description of an object. A pot could be measured again. A confident but mistaken link in a catalogue might be repeated by later writers until it seemed as reliable as the measurement. The distinction was easier to maintain on paper than during a conversation. A student might look at a vessel and say that it was obviously the water jar described on card four. Once everybody had heard that suggestion, it became difficult to inspect the object without imagining water in it. The team agreed to label working photographs with neutral numbers. When discussing a link, they had to use a number for both the object and the card and explain the reason for connecting the two. The procedure was slow at first. Later it saved time because a disputed suggestion could be found without searching through a page of descriptive prose.\n\nC. Colour looked like an obvious starting point. Three cards mentioned red jars. The word red, however, had no fixed meaning in these descriptions. One writer used it for a warm brown surface that another called orange. A comparison based on colour alone produced several possible matches. Dimensions were more promising until an assistant noticed that an early label gave the outside diameter at the rim while the modern list gave the maximum width at the belly. The numbers could be compared only after the team measured the same feature twice.\n\nD. A plain grey vessel had a distinctive repair: two holes on opposite sides of a crack. A faded label referred to a repair made with cord. Under moderate magnification, the team found fibres deep in one hole. They judged this a stronger connection than colour, though not absolute proof. Other vessels in the collection could once have been repaired in the same way. The catalogue therefore recorded the link as probable and included a note explaining the evidence. It did not replace the old card with a clean modern copy.\n\nE. The spare card was explained by a photograph, but not in the way the students expected. It showed two labels standing in front of one large vessel. Under a magnifying glass, the team could read the first as a description of the object. The second was a correction to the date suggested by the first writer. The two cards had travelled together because the exhibition organiser wanted visitors to see that an earlier interpretation had changed. Throwing the less readable card away would have erased evidence of that decision. The photograph could have been misleading on its own. In a crowded exhibition a visitor might have moved a card temporarily or placed one beside an object in order to photograph it. In this case a line in the organiser's notebook specifically mentioned the decision to show the correction. The notebook did not identify every other card, and the group resisted reading more into it than it could support. They made a copy of the relevant line and attached it to the catalogue entry. The picture established what had been visible; the line in the notebook helped to explain why it had been arranged that way.\n\nF. The project produced eleven firm matches and one probable match. The team did not try to force the last one into the firm category to make the record look tidy. Each entry now keeps three kinds of statement separate: what can be seen on the object, what someone previously wrote about it, and what the present team infers from those sources. A visitor may never read every note. A future researcher with a better photograph or an improved way to identify the fibres can nevertheless see exactly where a conclusion began.",
    questions: [
      {
        prompt: "How many loose paper labels did the drawer contain?",
        answer: "thirteen",
        explanation: "A 段为十二件器物、十三张标签。",
        alternatives: ["13"],
      },
      {
        prompt: "What caused the building to be evacuated?",
        answer: "water leak",
        explanation: "A 段说明是漏水。",
        alternatives: ["a water leak"],
      },
      {
        prompt: "Why were two lists kept?",
        answer: "To stop a possible match biasing the object description",
        explanation: "B 段先把观察和卡片文字分开。",
        choices: [
          "To divide writing by age",
          "To stop a possible match biasing the object description",
          "To prepare two exhibitions",
        ],
      },
      {
        prompt:
          "The team found that every writer used the term red consistently.",
        answer: "FALSE",
        explanation: "C 段不同作者的颜色词含义不同。",
        choices: ["TRUE", "FALSE", "NOT GIVEN"],
      },
      {
        prompt: "The modern width measurement was taken at the rim.",
        answer: "FALSE",
        explanation: "C 段现代测量位于腹部。",
        choices: ["TRUE", "FALSE", "NOT GIVEN"],
      },
      {
        prompt: "The original writers used an identical measuring instrument.",
        answer: "NOT GIVEN",
        explanation: "文中仅比较测量部位。",
        choices: ["TRUE", "FALSE", "NOT GIVEN"],
      },
      {
        prompt: "Which feature of the grey vessel contained fibres?",
        answer: "hole",
        explanation: "D 段在一个修补孔深处找到纤维。",
        alternatives: ["a hole", "one hole"],
      },
      {
        prompt: "How was the greying vessel's label match classified?",
        answer: "probable",
        explanation: "有支持，但未达到确定程度。",
        alternatives: ["a probable match"],
      },
      {
        prompt: "What showed two labels beside one object?",
        answer: "photograph",
        explanation: "E 段通过照片解开多一张卡的谜。",
        alternatives: ["a photograph", "the photograph"],
      },
      {
        prompt: "What information did the second card correct?",
        answer: "date",
        explanation: "它修正第一位写作者给的日期。",
        alternatives: ["the date"],
      },
      {
        prompt:
          "Match the idea to a paragraph: two widths that measure different things.",
        answer: "C",
        explanation: "C 段比较口沿直径与最大腹宽。",
      },
      {
        prompt:
          "Match the idea to a paragraph: giving later investigators a way to reassess findings.",
        answer: "F",
        explanation: "F 段保留证据与推断的区别。",
      },
      {
        prompt: "What is the author's central point?",
        answer: "Documentation should preserve how a conclusion was reached",
        explanation: "全文强调保存观察、既有说法和推断过程。",
        choices: [
          "Handwriting is more reliable than photographs",
          "Documentation should preserve how a conclusion was reached",
          "All uncertain labels should be removed",
        ],
      },
    ],
  },
  {
    title: "When an instruction changes a measurement",
    text: "A. Imagine a study in which forty adults are shown a series of photographs of indoor rooms. A small number of details change between one photograph and the next. Some participants are told to report every change they can remember. Others are told to report only changes they are confident they have seen. At the end of the session the second group reports fewer changes. That result can support several explanations. It is quite possible that the two groups noticed the same things but used different rules when deciding what to say.\n\nB. A fictional research team built a classroom demonstration around this distinction. Each pair of photographs appeared for the same length of time. Half the pairs contained a change and half did not. An empty trial, in which the pictures were identical, was just as important as one in which a chair had moved. If a participant reported a change on an empty trial, the team learned something about that participant's willingness to answer when uncertain. Simply counting the number of correctly reported changes would discard that information. To make this clear to the class, the tutor gave an imaginary example. A participant who always declared that something had changed would receive credit for every changed pair. Taken in isolation, that record would make the participant appear extremely observant. The same person would, however, report a change on every identical pair as well. In a real study, people are unlikely to follow such an extreme rule throughout a session. The example is valuable precisely because it separates the arithmetic from the psychology. A high count of correct reports can be produced without anyone having looked carefully at a single picture.\n\nC. The group given the confident instruction produced fewer incorrect reports on empty trials. It also failed to report more of the changes that really were there. One member of the team described this as an improvement, since the group made fewer false claims. A colleague objected that improvement could not be defined without a purpose. An inspector looking for damage in aircraft parts might accept a number of false alarms to avoid missing a dangerous crack. A librarian checking whether a photograph had been moved between archive boxes might prefer a different balance.\n\nD. The team then reversed the instructions for a second session. Every participant received the instruction that the other group had used. This looked like a decisive test until the tutor asked whether the second photographs were genuinely comparable with the first. If every person saw the easier set second, a gain caused by simpler pictures might be credited to the new instruction. The proposed remedy was to divide participants again so that some started with each set of pictures. The order of the two instructions also needed to be balanced.\n\nE. Another question concerned the meaning of confidence itself. Several volunteers explained that they were confident about a room's general appearance but uncertain about the exact object that had moved. Others described the opposite experience: they clearly remembered a blue cushion but could not place it in a particular room. The word confident compressed these different experiences into one answer. In a later version, participants would give a confidence rating only after stating whether a change had occurred. The team hoped this would make their reporting rule easier to examine. A further possibility was to invite people to explain a small sample of their decisions after the session. The interviewer would point to a particular pair of pictures and ask what the volunteer remembered thinking. This could reveal difficulties with the wording that a numerical rating failed to capture. It also introduced a new problem: a plausible explanation given later might be an account the volunteer had constructed since seeing the picture. The team planned to describe these interviews as a source of possible explanations, and to avoid treating them as a direct recording of a person's thoughts at the moment of judgment.\n\nF. Nothing in the demonstration proves that instructions never affect what a person notices. An instruction to look carefully at doorways could direct attention away from a bookshelf. The narrower conclusion is that a change in the number of reported events, by itself, cannot tell us whether observation or reporting changed. Good designs give an investigator the chance to separate those possibilities. They also make it possible for someone who values different kinds of errors to draw a different practical decision from the same set of observations.",
    questions: [
      {
        prompt: "How many adults appear in the opening imagined study?",
        answer: "forty",
        explanation: "A 段开头为 forty adults。",
        alternatives: ["40"],
      },
      {
        prompt: "An empty trial contained two identical photographs.",
        answer: "TRUE",
        explanation: "B 段直接定义 empty trial。",
        choices: ["TRUE", "FALSE", "NOT GIVEN"],
      },
      {
        prompt: "The team measured eye movement during each trial.",
        answer: "NOT GIVEN",
        explanation: "文中没有眼动测量。",
        choices: ["TRUE", "FALSE", "NOT GIVEN"],
      },
      {
        prompt:
          "The confident instruction reduced incorrect reports on empty trials.",
        answer: "TRUE",
        explanation: "C 段第一句。",
        choices: ["TRUE", "FALSE", "NOT GIVEN"],
      },
      {
        prompt: "It also led to detection of every real change.",
        answer: "FALSE",
        explanation: "C 段说明漏报反而更多。",
        choices: ["TRUE", "FALSE", "NOT GIVEN"],
      },
      {
        prompt:
          "Which object is mentioned as an example of something that moved in a photograph?",
        answer: "chair",
        explanation: "B 段举例 a chair had moved。",
        alternatives: ["a chair"],
      },
      {
        prompt: "What dangerous defect is used in the aircraft example?",
        answer: "crack",
        explanation: "C 段提到 dangerous crack。",
        alternatives: ["a crack", "dangerous crack"],
      },
      {
        prompt:
          "What was potentially wrong with using the second picture set for everyone?",
        answer: "It might have been easier",
        explanation: "D 段指出难易差会与指令效应混淆。",
        choices: [
          "It contained no rooms",
          "It might have been easier",
          "The team had lost it",
        ],
      },
      {
        prompt: "How should the team deal with that difficulty?",
        answer: "Vary the order of the picture sets",
        explanation: "D 段要求让不同人从不同图组开始。",
        choices: [
          "Remove all unchanged pictures",
          "Vary the order of the picture sets",
          "Use only experienced inspectors",
        ],
      },
      {
        prompt:
          "Match the idea to a paragraph: a word that covered different subjective experiences.",
        answer: "E",
        explanation: "E 段讨论 confident 一词压缩不同感受。",
      },
      {
        prompt:
          "Match the idea to a paragraph: choosing between errors depends on practical priorities.",
        answer: "C",
        explanation: "C 段比较两种工作的错报及漏报代价。",
      },
      {
        prompt: "What item did a participant remember as blue?",
        answer: "cushion",
        explanation: "E 段 blue cushion。",
        alternatives: ["a cushion"],
      },
      {
        prompt:
          "When would participants give a confidence rating in a future version?",
        answer: "After reporting whether a change occurred",
        explanation: "E 段最后两句。",
        choices: [
          "Before seeing the photographs",
          "After reporting whether a change occurred",
          "Only after a correct response",
        ],
      },
      {
        prompt: "Which claim does the final paragraph support?",
        answer: "A report count alone leaves two explanations open",
        explanation: "F 段讨论观察变化与作答规则变化。",
        choices: [
          "Instructions can never influence observation",
          "A report count alone leaves two explanations open",
          "All investigators should make the same decision",
        ],
      },
    ],
  },
];
