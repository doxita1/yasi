// Every prompt, script and answer in these practice sets is original to this site.
export function cleanAnswer(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[-–—]/g, " ")
    .replace(/[.,!?;:]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
export function isCorrect(question, value) {
  const accepted = [question.answer, ...(question.alternatives || [])].map(
    cleanAnswer,
  );
  return accepted.includes(cleanAnswer(value));
}
