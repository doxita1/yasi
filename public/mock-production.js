export const writtenTasks = [
  {
    academic: [
      {
        title: "Task 1 · Commuting in Daleport",
        prompt:
          "The table shows the percentage of commuters in the fictional town of Daleport who used each main form of transport in 2010 and 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
        table: [
          ["Main transport", "2010 (%)", "2025 (%)"],
          ["Private car", "55", "39"],
          ["Bus", "22", "26"],
          ["Bicycle", "9", "18"],
          ["Walking", "14", "17"],
        ],
        cues: [
          "Give an overview of the fall in car use and the increases in the other categories.",
          "Compare the largest and smallest changes in percentage points.",
          "Check that a change from 9% to 18% is nine percentage points.",
        ],
      },
      {
        title: "Task 2 · Learning in public spaces",
        prompt:
          "Some people think public libraries should devote more space to classes and group activities. Others believe they should protect quiet areas for individual learning. Discuss both views and give your own opinion.",
        cues: [
          "Explain how a group activity could widen access.",
          "Consider a learner who relies on a quiet place.",
          "Support your own position with a practical example.",
        ],
      },
    ],
    general: [
      {
        title: "Task 1 · An unsuitable meeting room",
        prompt:
          "Your employer booked a room for a training session at a local hotel. On arrival you found that the room was unsuitable. Write a letter to the hotel manager. Describe what you booked, explain the problem and its effect, and say what action you would like the hotel to take. Begin your letter “Dear Sir or Madam,”.",
        cues: [
          "State the booking and the mismatch.",
          "Describe a specific consequence for participants.",
          "Ask for a practical remedy in an appropriate tone.",
        ],
      },
      {
        title: "Task 2 · Work experience",
        prompt:
          "Some people believe a young person learns more by taking a job in their local community than by attending a short course. To what extent do you agree or disagree? Give reasons and examples.",
        cues: [
          "Make your position clear.",
          "Compare the types of learning in both settings.",
          "Explain one specific example in depth.",
        ],
      },
    ],
  },
  {
    academic: [
      {
        title: "Task 1 · Water use in two districts",
        prompt:
          "The table shows average daily water use per household in two fictional districts in 2005 and 2025. Figures are in litres. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
        table: [
          [
            "Household use",
            "Brook 2005",
            "Brook 2025",
            "Hill 2005",
            "Hill 2025",
          ],
          ["Garden", "60", "35", "40", "38"],
          ["Washing", "75", "62", "70", "55"],
          ["Cooking and drinking", "25", "26", "24", "25"],
        ],
        cues: [
          "Identify the overall change in both districts.",
          "Contrast the changes in garden use.",
          "Keep litres and years clear in comparisons.",
        ],
      },
      {
        title: "Task 2 · Measuring public services",
        prompt:
          "Some people believe public services should be judged mainly by the number of people who use them. Others argue that the quality of help given is more important. Discuss both views and give your opinion.",
        cues: [
          "Explain one benefit of measuring numbers.",
          "Give an example in which numbers conceal an important outcome.",
          "State how you would judge a service.",
        ],
      },
    ],
    general: [
      {
        title: "Task 1 · Helping a new colleague",
        prompt:
          "A colleague from another city is joining your team next month and has asked for advice about living near your workplace. Write a letter to this colleague. Describe one suitable area, explain how to travel to work from there, and offer some help for the first week. Begin your letter “Dear Alex,”.",
        cues: [
          "Describe a specific area and why it suits the colleague.",
          "Give a usable travel instruction.",
          "Make an appropriate offer with a concrete time or activity.",
        ],
      },
      {
        title: "Task 2 · Changing working hours",
        prompt:
          "Some people prefer to begin work early and finish early. Others prefer a later start. Should all employers allow workers to choose their starting time? Give reasons for your answer and relevant examples.",
        cues: [
          "Consider a role that allows individual flexibility.",
          "Explain a case in which colleagues depend on one another.",
          "Make the limits of your position clear.",
        ],
      },
    ],
  },
];
export const speakingTasks = [
  [
    {
      title: "Part 1 · Work and daily routines",
      questions: [
        "Do you work or study at the moment?",
        "Which part of your normal day do you enjoy most?",
        "How do you usually organise a busy morning?",
        "Do you like making plans with other people? Why?",
        "Has your journey to work or study changed recently?",
      ],
    },
    {
      title: "Part 2 · A change of plan",
      questions: [
        "Describe a time when you had to change an arrangement with someone. Say what you had arranged, why the change was necessary, how you explained it, and how the other person responded.",
      ],
      follow: "Would you deal with a similar situation differently now?",
    },
    {
      title: "Part 3 · Communicating changes",
      questions: [
        "Why do people sometimes delay telling others about a problem?",
        "When is an email a better way to communicate than a telephone call?",
        "How can managers make it easier for staff to speak honestly about delays?",
        "Do people expect faster replies today than in the past? Why?",
      ],
    },
  ],
  [
    {
      title: "Part 1 · Places and learning",
      questions: [
        "What sort of place do you prefer for studying?",
        "Do you enjoy learning practical skills?",
        "When did you last ask someone for directions?",
        "What is one useful service near your home?",
        "Would you like to change anything about your neighbourhood?",
      ],
    },
    {
      title: "Part 2 · Teaching someone",
      questions: [
        "Describe a practical skill you helped another person learn. Say who the person was, what the skill involved, how you explained it, and what you learned from teaching it.",
      ],
      follow:
        "How did you know that the person could do the task independently?",
    },
    {
      title: "Part 3 · Sharing skills",
      questions: [
        "Why do people find some skills easier to demonstrate than to describe?",
        "How important is formal training for learning a practical job?",
        "Should workplaces give experienced staff time to teach new employees?",
        "How might people check the quality of advice they find online?",
      ],
    },
  ],
];
