import { esc, icon } from "./icons.js";
import { getAudio } from "./sync.js";

const areas = {
  listening: "听力",
  reading: "阅读",
  writing: "写作",
  speaking: "口语",
  vocabulary: "词汇",
  grammar: "语法",
  conversation: "职场交流",
};
const baseline = [
  { skill: "reading", day: 1, id: "exam", required: "提交阅读客观题" },
  { skill: "listening", day: 2, id: "exam", required: "提交听力客观题" },
  { skill: "speaking", day: 3, id: "exam", required: "留下一段口语录音" },
  { skill: "writing", day: 4, id: "exam", required: "提交一段英文写作" },
  {
    skill: "conversation",
    day: 1,
    id: "work",
    required: "完成一次职场口头回应",
  },
];

function collect(store, getDay) {
  const rows = [],
    cache = new Map();
  const activeTrack = store.profile?.track;
  function schedule(day, track) {
    const key = track + "/" + day;
    if (!cache.has(key)) cache.set(key, getDay(day, track));
    return cache.get(key);
  }
  for (const a of Object.values(store.attempts || {})) {
    if (!Number.isInteger(a.day) || a.day < 1 || a.day > 156 || !a.blockId)
      continue;
    const track = a.track || "undecided",
      block = schedule(a.day, track)?.blocks?.find((b) => b.id === a.blockId);
    if (!block) continue;
    if (
      a.blockId === "exam" &&
      ["academic", "general"].includes(activeTrack) &&
      activeTrack !== track
    ) {
      const current = schedule(a.day, activeTrack)?.blocks.find(
        (b) => b.id === "exam",
      );
      if (JSON.stringify(block.items) !== JSON.stringify(current?.items))
        continue;
    }
    const rounds = [
      { answers: a.answers, completedAt: a.completedAt },
      ...(a.retries || []),
      ...(a.activeRepeat ? [a.activeRepeat] : []),
    ];
    rounds.forEach((round, roundIndex) => {
      for (const [i, ans] of Object.entries(round.answers || {})) {
        if (!ans?.submitted) continue;
        const q = a.vocabPlan?.overrides?.[i] || block.items[i];
        if (!q) continue;
        const history = ans.history || [];
        const first = history[0] || ans;
        // Use the date the learner submitted this response. Opening an old lesson never refreshes its evidence.
        const at = first.at || ans.submittedAt || round.completedAt || null;
        if (!Number.isFinite(Date.parse(at))) continue;
        const payload = {
          day: a.day,
          id: a.blockId,
          skill: block.skill,
          kind: q.kind,
          prompt: q.prompt,
          track: a.track,
          index: Number(i),
          roundIndex,
          firstRound: roundIndex === 0,
          at,
          firstRight:
            typeof ans.firstCorrect === "boolean"
              ? ans.firstCorrect
              : ans.correct,
          text: first.text || ans.text || "",
          blob: first.blobKey || ans.blobKey || "",
          turns: (ans.turns || []).filter((t) => t.role === "user").length,
        };
        rows.push(payload);
        for (const h of history.slice(1)) {
          if (!Number.isFinite(Date.parse(h.at))) continue;
          rows.push({
            ...payload,
            at: h.at,
            firstRound: false,
            firstRight: h.correct,
            text: h.text || "",
            blob: h.blobKey || "",
            turns: 0,
          });
        }
      }
    });
  }
  return rows.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}
function hasEvidence(skill, row) {
  if (row.skill !== skill) return false;
  if (skill === "speaking" || skill === "conversation")
    return row.kind === "speak" && !!row.blob;
  if (skill === "writing")
    return row.kind === "write" && /[A-Za-z]/.test(row.text);
  return row.kind === "choice" && typeof row.firstRight === "boolean";
}
function baselineResults(rows) {
  const firstWeek = rows.filter((row) => row.day <= 6);
  return baseline.map((item) => {
    const matching = firstWeek.filter((row) => row.skill === item.skill);
    const samples = matching.filter((row) => hasEvidence(item.skill, row));
    const typed = matching.some(
      (r) => r.kind === "speak" && !r.blob && r.text.trim(),
    );
    return { ...item, done: samples.length > 0, count: samples.length, typed };
  });
}
export function diagnosticCTA(store, getDay) {
  const items = baselineResults(collect(store, getDay)),
    next = items.find((s) => !s.done);
  return {
    label: next ? "继续首周诊断 · " + areas[next.skill] : "查看能力报告",
    href: next ? "#/learn/" + next.day + "/" + next.id : "#/report",
    status:
      items.filter((s) => s.done).length + " / " + items.length + " 项已有基线",
  };
}
const lessonLink = (row) => "#/learn/" + row.day + "/" + row.id;
function fourWeeks(rows, now) {
  const since = new Date(now);
  since.setDate(since.getDate() - 27);
  since.setHours(0, 0, 0, 0);
  return rows.filter(
    (r) => Date.parse(r.at) >= +since && Date.parse(r.at) <= +new Date(now),
  );
}
function summarize(rows) {
  const stats = {};
  for (const row of rows) {
    const key = row.skill;
    const s = (stats[key] ||= {
      name: areas[key] || key,
      skill: key,
      right: 0,
      total: 0,
      expressions: 0,
      spoken: 0,
      textOnly: 0,
      written: 0,
      turns: 0,
      revised: 0,
      last: row,
      miss: null,
    });
    s.last = row;
    if (row.kind === "choice" && typeof row.firstRight === "boolean") {
      if (row.firstRound) {
        s.total++;
        if (row.firstRight) s.right++;
        else s.miss = row;
      }
    } else if (row.kind === "speak" || row.kind === "write") {
      s.expressions++;
      if (row.kind === "speak") {
        if (row.blob) s.spoken++;
        else if (row.text) s.textOnly++;
      }
      if (row.kind === "write" && row.text) s.written++;
      s.turns += row.turns;
    }
    if (!row.firstRound) s.revised++;
  }
  return stats;
}
export function recentSkills(store, getDay, now = new Date()) {
  return Object.values(summarize(fourWeeks(collect(store, getDay), now))).map(
    (v) => ({ ...v, day: v.last.day, blockId: v.last.id }),
  );
}
function statsText(s) {
  const badges = [];
  if (s.total) badges.push("客观题首次答对 " + s.right + " / " + s.total);
  if (s.spoken) badges.push(s.spoken + " 段录音");
  if (s.textOnly) badges.push(s.textOnly + " 次文字代答");
  if (s.written) badges.push(s.written + " 份书面回答");
  if (s.turns) badges.push(s.turns + " 次主动接话");
  if (s.revised) badges.push(s.revised + " 次重练作答");
  return badges.join(" · ") || "已有提交";
}
function guidance(s, minBand) {
  if (!s) return null;
  if (s.kind === "choice" || s.total) {
    if (s.miss)
      return {
        source: s.miss,
        text:
          "有 " +
          (s.total - s.right) +
          " 题首次答错。回到第 " +
          s.miss.day +
          " 天，" +
          (s.skill === "listening"
            ? "先重听原句，再核对数字、转折或改口。"
            : s.skill === "reading"
              ? "圈出支持答案的原句，再检查选项是否扩大了原意。"
              : "解释选项之间的区别，再做一道同类型题。"),
      };
    if (s.total >= 3)
      return {
        source: s.last,
        text:
          "这 " +
          s.total +
          " 道客观题首次均答对。下一次使用陌生材料，检查能否独立完成同类题。",
        route: "#/subject/" + s.last.id,
      };
  }
  if (s.skill === "conversation") {
    if (s.spoken || s.textOnly || s.written)
      return {
        source: s.last,
        text: s.turns
          ? "你已尝试追问或接话。下一次换一个同事角色，先复述对方需求，再确认一个具体行动。"
          : s.spoken
            ? "你已留下口头回应。下次让同事追问一个时间或安排，再用英语澄清。"
            : "已有文字回应。选同一情境录一句不看稿的回答，对照两种表达。",
      };
  } else if (s.skill === "speaking") {
    if (s.spoken)
      return {
        source: s.last,
        text:
          "回听一段已提交录音，标出停顿或未展开的回答，再录一版。按单项目标 " +
          minBand +
          " 的量表复核表达。",
      };
    if (s.textOnly)
      return {
        source: s.last,
        text: "已有文字代答。用同一问题录一次无稿回答，才能比较实际开口时的表现。",
      };
  } else if (s.skill === "writing" && s.written) {
    return {
      source: s.last,
      text: s.revised
        ? "已有书面作答和重练。下一次换题，检查改过的问题是否再次出现。"
        : "已有书面作答。对照单项目标 " +
          minBand +
          " 的写作量表，先改一条论据或一段衔接，再保留修改稿。",
    };
  }
  return null;
}
function sectionRows(keys, stats, minBand) {
  return keys
    .map((key) => {
      const s = stats[key],
        advice = guidance(s, minBand);
      return (
        '<div class="panelBody" style="padding:10px 0;border-top:1px solid var(--line)"><div class="sectionRow"><b>' +
        esc(areas[key]) +
        '</b><span class="mutedRow">' +
        esc(s ? statsText(s) : "暂无近四周作答") +
        "</span></div>" +
        (advice
          ? '<p class="pageNote">' +
            esc(advice.text) +
            '</p><a class="miniAction" href="' +
            esc(advice.route || lessonLink(advice.source)) +
            '">打开对应练习 ' +
            icon("right", 14) +
            "</a>"
          : "") +
        "</div>"
      );
    })
    .join("");
}
function goal(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 1 && n <= 9 ? n.toFixed(1) : fallback;
}
function sampleCard(row, label, id) {
  const date = new Date(row.at).toLocaleDateString("zh-CN", {
    month: "numeric",
    day: "numeric",
  });
  return (
    '<details id="' +
    id +
    '" style="margin:9px 0"><summary>' +
    esc(label + " · " + date + " · 第 " + row.day + " 天") +
    '</summary><p class="pageNote">' +
    esc(row.prompt || "") +
    "</p>" +
    (row.blob
      ? '<button class="btn" type="button" data-report-audio="' +
        esc(row.blob) +
        '">载入我的录音</button><span role="status"></span>'
      : "") +
    (row.text
      ? '<blockquote style="margin:8px 0;white-space:pre-wrap;overflow-wrap:anywhere" lang="en">' +
        esc(row.text) +
        "</blockquote>"
      : "") +
    "</details>"
  );
}
function sampleGroup(rows, filter, label, id) {
  const list = rows.filter(filter);
  if (!list.length) return "";
  const first = list[0],
    last = list.at(-1);
  return (
    sampleCard(first, "首份" + label, id + "-first") +
    (first !== last ? sampleCard(last, "最近" + label, id + "-last") : "")
  );
}
export function skillsPanel(store, getDay, now = new Date()) {
  const all = collect(store, getDay),
    baselineRows = baselineResults(all),
    stats = summarize(fourWeeks(all, now));
  const overall = goal(store.profile?.targetBand, "7.0"),
    minimum = goal(store.profile?.minBand, "6.5");
  const done = baselineRows.filter((d) => d.done).length;
  const samples =
    sampleGroup(
      all,
      (r) => r.kind === "speak" && r.blob,
      "口语录音",
      "record",
    ) +
    sampleGroup(
      all,
      (r) =>
        r.id === "exam" &&
        r.skill === "writing" &&
        r.kind === "write" &&
        /[A-Za-z]/.test(r.text),
      "雅思写作",
      "writing",
    );
  const anchorLinks =
    (samples.includes('id="record-first"')
      ? '<a class="miniAction" href="#record-first" data-report-jump="record-first">首份录音</a> '
      : "") +
    (samples.includes('id="writing-last"')
      ? '<a class="miniAction" href="#writing-last" data-report-jump="writing-last">最近写作</a>'
      : "");
  return (
    '<section class="panel panelBody"><h2 class="cardTitle">首周起点诊断</h2><p class="pageNote">从第 1–6 个学习日的实际作答自动建立起点，已收集 ' +
    done +
    " / 5 项。当前目标为总分 " +
    overall +
    "，单项 " +
    minimum +
    '。</p><div class="rowSet">' +
    baselineRows
      .map(
        (s) =>
          '<div class="sectionRow"><b>' +
          esc(areas[s.skill]) +
          "</b>" +
          (s.done
            ? '<span class="mutedRow">已留样 · ' +
              s.count +
              (s.skill === "listening" || s.skill === "reading"
                ? " 道作答"
                : " 次提交") +
              "</span>"
            : '<a class="miniAction" href="' +
              lessonLink(s) +
              '">' +
              esc(s.typed ? "已有文字，待补录音" : s.required) +
              " " +
              icon("right", 14) +
              "</a>") +
          "</div>",
      )
      .join("") +
    "</div></section>" +
    '<section class="panel panelBody"><h2 class="cardTitle">近四周 · 雅思专项</h2><p class="pageNote">按最近 28 个自然日的实际提交统计。小练习记录正确率和表达样本，正式分数由考试评定。</p>' +
    sectionRows(
      ["listening", "reading", "writing", "speaking"],
      stats,
      minimum,
    ) +
    "</section>" +
    '<section class="panel panelBody"><h2 class="cardTitle">近四周 · 实际交流</h2>' +
    sectionRows(["conversation"], stats, minimum) +
    (stats.vocabulary || stats.grammar
      ? '<h3 class="cardTitle">语言基础</h3>' +
        sectionRows(["vocabulary", "grammar"], stats, minimum)
      : "") +
    "</section>" +
    (samples
      ? '<section class="panel panelBody"><h2 class="cardTitle">我的前后作品</h2><p class="pageNote">按提交时间保留首份与最近一份作品。' +
        anchorLinks +
        "</p>" +
        samples +
        "</section>"
      : "")
  );
}
export function bindEvidence(root) {
  let disposed = false;
  const urls = [];
  const handle = async (e) => {
    const jump = e.target.closest("[data-report-jump]");
    if (jump) {
      e.preventDefault();
      const d = root.querySelector("#" + jump.dataset.reportJump);
      if (d) {
        d.open = true;
        d.scrollIntoView({ block: "center" });
      }
      return;
    }
    const b = e.target.closest("[data-report-audio]");
    if (!b || b.disabled) return;
    b.disabled = true;
    const status = b.nextElementSibling;
    if (status) status.textContent = " 正在载入…";
    try {
      const blob = await getAudio(b.dataset.reportAudio);
      if (disposed) return;
      if (!blob) throw Error("unavailable");
      const audio = document.createElement("audio");
      audio.controls = true;
      audio.style.maxWidth = "100%";
      const url = URL.createObjectURL(blob);
      urls.push(url);
      audio.src = url;
      b.replaceWith(audio);
      if (status) status.textContent = "";
      await audio.play().catch(() => {});
    } catch {
      if (!disposed) {
        b.disabled = false;
        if (status) status.textContent = " 暂未取得录音，可联网后再试。";
      }
    }
  };
  root.addEventListener("click", handle);
  return () => {
    disposed = true;
    root.removeEventListener("click", handle);
    urls.forEach((url) => URL.revokeObjectURL(url));
  };
}
