// Source texts, questions, translations and examples are original teaching materials.
export function passage(id, title, track, texts, groups, subtitle) {
  let number = 0;
  return {
    id,
    title,
    subtitle,
    track,
    minutes: 20,
    paragraphs: texts.map((text, i) => ({
      label: String.fromCharCode(65 + i),
      text,
    })),
    groups: groups.map((group) => ({
      ...group,
      questions: group.questions.map((row) => {
        const [
          prompt,
          answer,
          paragraph,
          evidence,
          explanation,
          paraphrase,
          alternatives,
          choices,
        ] = row;
        return {
          id: id + "-q" + ++number,
          prompt,
          answer,
          paragraph,
          evidence,
          explanation,
          paraphrase,
          ...(alternatives ? { alternatives } : {}),
          ...(choices ? { choices } : {}),
        };
      }),
    })),
  };
}
export const truth = (questions) => ({
  type: "choice",
  title: "Identifying information",
  instruction:
    "Choose TRUE if the statement agrees with the passage, FALSE if it contradicts the passage, or NOT GIVEN if the passage does not establish it.",
  choices: ["TRUE", "FALSE", "NOT GIVEN"],
  questions,
});
export const locate = (rows, last = "G") => ({
  type: "choice",
  title: "Matching information",
  instruction:
    "Which paragraph contains the following information? You may use any letter more than once.",
  choices: "ABCDEFGH".slice(0, last.charCodeAt(0) - 64).split(""),
  questions: rows.map(([prompt, label, ...detail]) => [
    prompt,
    label,
    label,
    ...detail,
  ]),
});
export const gaps = (questions, maxWords = 2) => ({
  type: "text",
  title: "Sentence completion",
  maxWords,
  instruction:
    "Complete each sentence using " +
    (maxWords === 1
      ? "ONE WORD ONLY"
      : "NO MORE THAN " + (maxWords === 2 ? "TWO" : "THREE") + " WORDS") +
    " from the passage. Spelling and the word limit matter.",
  questions,
});
export const headings = (choices, rows) => ({
  type: "choice",
  title: "Matching headings",
  instruction:
    "Choose the most suitable heading for each indicated paragraph. There are more headings than you need. Use a heading only once.",
  choices,
  questions: rows.map(([paragraph, n, evidence, why, paraphrase]) => [
    "Paragraph " + paragraph,
    choices[n],
    paragraph,
    evidence,
    why,
    paraphrase,
  ]),
});
export const views = (questions) => ({
  type: "choice",
  title: "Identifying the writer's claims",
  instruction:
    "Choose YES if the statement agrees with the writer's claim, NO if it contradicts the claim, or NOT GIVEN if the writer expresses no such position.",
  choices: ["YES", "NO", "NOT GIVEN"],
  questions,
});
export const selectOne = (rows) => ({
  type: "choice",
  title: "Multiple choice",
  instruction: "Choose the ONE answer that best fits the passage.",
  questions: rows.map(
    ([prompt, choices, i, paragraph, evidence, why, paraphrase]) => [
      prompt,
      choices[i],
      paragraph,
      evidence,
      why,
      paraphrase,
      null,
      choices,
    ],
  ),
});
