import { esc, icon } from "./icons.js";
const sources = [
  {
    id: "vocab",
    title: "Flexible working",
    org: "British Council · B1–B2",
    note: "已核验词义匹配、语境填空与带答案讲义。适合在做完站内交接任务后扩展职场词汇。",
    url: "https://learnenglish.britishcouncil.org/free-resources/business/business/magazine/flexible-working",
  },
  {
    id: "grammar",
    title: "Present perfect",
    org: "British Council · B1–B2",
    note: "已核验规则讲解和两组含答案的练习。可用来复查“截至今天的进展”和“昨天完成的工作”有何区别。",
    url: "https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/present-perfect",
  },
  {
    id: "work",
    title: "Agreeing and disagreeing",
    org: "British Council · B1",
    note: "已核验情境逐字稿、跟读与练习入口。适合练礼貌表达异议；用自己的项目期限做一次新的回应。",
    url: "https://learnenglish.britishcouncil.org/free-resources/speaking/b1/agreeing-disagreeing",
  },
  {
    id: "exam",
    title: "Academic sample questions",
    org: "IELTS · A 类样题",
    note: "已核验题型说明、部分逐字稿、答案与考官点评。部分播放器依赖外部服务，可用站内同技能练习替代。",
    url: "https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test",
  },
  {
    id: "exam",
    title: "General Training sample questions",
    org: "IELTS · G 类样题",
    note: "官方按培训类读写分流；用于核对书信任务与生活阅读题型。打开选读不会计入本站学习进度。",
    url: "https://ielts.org/take-a-test/preparation-resources/sample-test-questions/general-training-test",
  },
];
export function resourcePanel(id) {
  return (
    '<section class="panel panelBody" style="margin-top:18px"><details><summary style="cursor:pointer;font-weight:650">延伸教程与适用说明</summary>' +
    sources
      .filter((x) => !id || x.id === id)
      .map(
        (s) =>
          '<article style="margin-top:16px"><span class="roundNum">' +
          esc(s.org) +
          '</span><div><a class="miniAction" href="' +
          s.url +
          '" target="_blank" rel="noreferrer">' +
          esc(s.title) +
          icon("arrow", 14) +
          '</a></div><p class="pageNote">' +
          esc(s.note) +
          "</p></article>",
      )
      .join("") +
    "</details></section>"
  );
}
