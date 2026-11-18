import { readingSets } from "./reading-lab.js";
import { esc, icon } from "./icons.js";
import { getState, saveAttempt, saveReview } from "./sync.js";
import { cleanAnswer } from "./mock-format.js";
import { accountFetch } from "./account-request.js";

const allQuestions = (set) =>
  set.groups.flatMap((g) => g.questions.map((q) => ({ ...q, group: g })));
const secondsText = (n) =>
  String(Math.floor(n / 60)).padStart(2, "0") +
  ":" +
  String(n % 60).padStart(2, "0");
const wordCount = (v) =>
  String(v || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
const timestamp = () => new Date().toISOString();
const recordList = (set) =>
  Object.entries(getState().attempts)
    .filter(([, a]) => a.readingSet === set.id)
    .sort((a, b) => String(b[1].startedAt).localeCompare(a[1].startedAt));
function maxWords(group) {
  if (group.maxWords) return group.maxWords;
  const label = group.instruction.toUpperCase();
  return /ONE WORD/.test(label)
    ? 1
    : /TWO WORDS/.test(label)
      ? 2
      : /THREE WORDS/.test(label)
        ? 3
        : Infinity;
}
export function evaluateReading(question, value) {
  const learner = cleanAnswer(value);
  if (!learner) return { correct: false, reason: "未作答" };
  if (
    question.group.type === "text" &&
    wordCount(String(value).replace(/\s*-\s*/g, "-")) > maxWords(question.group)
  )
    return { correct: false, reason: "超过题目限定词数" };
  const correct = [question.answer, ...(question.alternatives || [])].some(
    (v) => cleanAnswer(v) === learner,
  );
  return {
    correct,
    reason: correct
      ? "答对"
      : question.group.type === "text"
        ? "选词或拼写需要复查"
        : "判断与原文证据不一致",
  };
}
function marked(text, parts) {
  const ranges = [];
  for (const part of new Set(parts.filter(Boolean))) {
    let start = text.indexOf(part);
    if (start !== -1) ranges.push([start, start + part.length]);
  }
  ranges.sort((a, b) => a[0] - b[0]);
  let cursor = 0,
    html = "";
  for (const [s, e] of ranges) {
    if (s < cursor) continue;
    html +=
      esc(text.slice(cursor, s)) + "<mark>" + esc(text.slice(s, e)) + "</mark>";
    cursor = e;
  }
  return html + esc(text.slice(cursor));
}
function stageTags(set) {
  return set.groups.map((g) => g.title).join(" / ");
}
export function firstReading(track) {
  const filtered = readingSets.filter(
    (s) => s.track === (track === "general" ? "general" : "academic"),
  );
  return (
    filtered.find((s) => !recordList(s).some(([, r]) => r.completed)) ||
    filtered[0] ||
    readingSets[0]
  );
}
export function mountReadingRoom(
  container,
  { setId, question, attemptId, track, onNavigate },
) {
  let set = readingSets.find((s) => s.id === setId);
  if (!set) {
    let filter = track === "general" ? "general" : "academic";
    const render = () => {
      container.innerHTML =
        '<header class="pageHead"><div><span class="eyebrow">IELTS READING</span><h1>阅读训练</h1><p>整篇限时作答。交卷后按题型复盘，可直接跳回证据段。</p></div></header><div class="filters">' +
        ["academic", "general"]
          .map(
            (k) =>
              '<button class="pill ' +
              (k === filter ? "active" : "") +
              '" data-filter="' +
              k +
              '">' +
              (k === "general" ? "G 类培训" : "A 类学术") +
              "</button>",
          )
          .join("") +
        '</div><div class="weeksGrid">' +
        readingSets
          .filter((s) => s.track === filter)
          .map((s) => {
            const n = allQuestions(s).length,
              h = recordList(s)[0]?.[1];
            return (
              '<a class="panel paperCard" href="#/reading/' +
              esc(s.id) +
              '"><span class="roundNum">' +
              (s.track === "general"
                ? "GENERAL TRAINING"
                : "ACADEMIC READING") +
              "</span><h2>" +
              esc(s.title) +
              "</h2><p>" +
              esc(s.subtitle || stageTags(s)) +
              '</p><div class="sectionRow"><span class="mutedRow">' +
              s.minutes +
              " 分钟 · " +
              n +
              " 题</span><b>" +
              esc(h ? (h.completed ? "看解析" : "继续作答") : "开始练习") +
              " →</b></div></a>"
            );
          })
          .join("") +
        "</div>";
    };
    const click = (e) => {
      const k = e.target.closest("[data-filter]")?.dataset.filter;
      if (k) {
        filter = k;
        render();
      }
    };
    container.addEventListener("click", click);
    render();
    return () => container.removeEventListener("click", click);
  }
  const qs = allQuestions(set),
    total = qs.length,
    route = "reading/" + set.id;
  const records = recordList(set);
  let chosen;
  try {
    chosen = decodeURIComponent(attemptId || "");
  } catch {}
  let entry = records.find(([k]) => k === chosen) || records[0],
    key = entry?.[0] || "reading:" + set.id + ":1",
    a = entry?.[1] || {},
    index = Math.min(total - 1, a.itemIndex || 0),
    paused = !!a.completed,
    tab = "questions",
    selectedEvidence = "",
    lastTick = Date.now(),
    remainder = 0,
    elapsed = a.elapsedSeconds || 0,
    disposed = false,
    confirmSubmit = false;
  if (/^q\d+$/.test(question || ""))
    index = Math.min(total - 1, Math.max(0, Number(question.slice(1)) - 1));
  if (a.completed) selectedEvidence = qs[index].evidence;
  const by = (sel) => container.querySelector(sel);
  function save(patch = {}) {
    a = saveAttempt(key, {
      ...a,
      readingSet: set.id,
      labRoute: route,
      labTitle: set.title,
      labArea: "reading",
      startedAt: a.startedAt || timestamp(),
      track: set.track,
      elapsedSeconds: elapsed,
      itemIndex: index,
      ...patch,
    });
  }
  const value = (i) => a.answers?.[i]?.text || "";
  const answered = () => qs.filter((_, i) => value(i).trim()).length;
  function tick() {
    const t = Date.now();
    if (!paused && !document.hidden && !a.completed) {
      const ms = t - lastTick + remainder;
      elapsed += Math.floor(ms / 1000);
      remainder = ms % 1000;
    }
    lastTick = t;
    const el = by("[data-remaining]");
    if (el)
      el.textContent = secondsText(Math.max(0, set.minutes * 60 - elapsed));
    if (!a.completed && elapsed >= set.minutes * 60) finish();
  }
  function answer(n, text) {
    save({ answers: { ...a.answers, [n]: { text, editedAt: timestamp() } } });
    const b = by('[data-jump="' + n + '"]');
    if (b) b.classList.toggle("answered", !!text.trim());
    const count = by("[data-count]");
    if (count) count.textContent = answered() + " / " + total;
  }
  function finish() {
    if (a.completed) return;
    const checks = qs.map((q, i) => evaluateReading(q, value(i)));
    const results = Object.fromEntries(
      qs.map((q, i) => [
        i,
        {
          ...a.answers?.[i],
          text: value(i),
          submitted: true,
          submittedAt: timestamp(),
          correct: checks[i].correct,
        },
      ]),
    );
    save({
      answers: results,
      completed: true,
      completedAt: timestamp(),
      correct: checks.filter((r) => r.correct).length,
      total,
      graded: total,
    });
    for (const [i, q] of qs.entries())
      if (!checks[i].correct)
        saveReview("reading-" + key + "-" + i, {
          word: q.prompt,
          meaning: q.explanation,
          example: q.evidence,
          labRoute: route,
          labQuestion: i,
          labAttempt: key,
          category: "reading",
          day: null,
          due: new Date(Date.now() + 86400000).toISOString(),
        });
    paused = true;
    confirmSubmit = false;
    index = Math.max(
      0,
      checks.findIndex((r) => !r.correct),
    );
    selectedEvidence = qs[index].evidence;
    render();
  }
  function passage() {
    return (
      '<section class="readPaper panel"><div class="readTop"><b>阅读原文</b><span>' +
      set.paragraphs.reduce((n, p) => n + wordCount(p.text), 0) +
      ' 词</span></div><div class="readArticle" data-passage><span class="roundNum">' +
      (set.track === "general" ? "GENERAL TRAINING" : "ACADEMIC READING") +
      '</span><h2 lang="en">' +
      esc(set.title) +
      "</h2>" +
      set.paragraphs
        .map(
          (p) =>
            '<div class="paragraph" data-par="' +
            esc(p.label) +
            '"><b>' +
            esc(p.label) +
            '</b><p lang="en">' +
            marked(p.text, [
              ...(a.marks?.[p.label] || []),
              ...(a.completed && p.label === qs[index].paragraph
                ? [selectedEvidence]
                : []),
            ]) +
            "</p></div>",
        )
        .join("") +
      '</div><div class="readActions"><button class="pill" data-act="highlight">标记所选文字</button><button class="pill" data-act="clear">清除标记</button></div></section>'
    );
  }
  function reviewSummary() {
    if (!a.completed) return "";
    return (
      '<div class="panel sheetResult"><div><span class="eyebrow">PASSAGE RESULT</span><h2>' +
      a.correct +
      " / " +
      total +
      ' <small>答对</small></h2><span class="mutedRow">用时 ' +
      secondsText(elapsed) +
      " · 本篇原始分</span></div><div>" +
      set.groups
        .map((g) => {
          const indices = qs.flatMap((q, i) => (q.group === g ? [i] : []));
          return (
            '<div class="sectionRow"><span>' +
            esc(g.title) +
            "</span><b>" +
            indices.filter((i) => a.answers[i].correct).length +
            " / " +
            indices.length +
            "</b></div>"
          );
        })
        .join("") +
      "</div></div>"
    );
  }
  function questionPanel() {
    const q = qs[index],
      g = q.group;
    const opts = q.choices || g.choices;
    const field = opts?.length
      ? '<div class="ep-options">' +
        opts
          .map(
            (s) =>
              '<label class="answerRadio"><input type="radio" name="answer" value="' +
              esc(s) +
              '" ' +
              (value(index) === s ? "checked " : "") +
              (a.completed ? "disabled" : "") +
              "><span>" +
              esc(s) +
              "</span></label>",
          )
          .join("") +
        "</div>"
      : '<label class="field">你的答案<input data-fill autocomplete="off" spellcheck="false" lang="en" value="' +
        esc(value(index)) +
        '" ' +
        (a.completed ? "readonly" : "") +
        "></label>";
    const check = a.completed ? evaluateReading(q, value(index)) : null;
    const feedback = check
      ? '<div class="readFeedback ' +
        (check.correct ? "correct" : "") +
        '"><strong>' +
        esc(check.reason) +
        "</strong><p>你的答案　<b>" +
        esc(value(index) || "未作答") +
        "</b><br>参考答案　<b>" +
        esc(q.answer) +
        '</b></p><blockquote lang="en">' +
        esc(q.evidence) +
        '</blockquote><button class="miniAction" data-act="locate">定位原文 · ' +
        esc(q.paragraph) +
        " 段 →</button><p>" +
        esc(q.explanation) +
        "</p>" +
        (q.paraphrase
          ? '<p class="translationPair"><b>同义替换</b> ' +
            esc(q.paraphrase) +
            "</p>"
          : "") +
        '<button data-act="ask-coach" class="pill">向 AI 追问这道题</button><p class="formStatus" data-coach></p></div>'
      : "";
    return (
      '<section class="panel questionCard"><div class="readTop"><b>' +
      esc(g.title) +
      '</b><button class="pill ' +
      (a.flagged?.[index] ? "active" : "") +
      '" data-act="flag">' +
      (a.flagged?.[index] ? "已标记" : "标记本题") +
      '</button></div><div class="questionBody"><p class="instructions" lang="en">' +
      esc(g.instruction) +
      '</p><span class="roundNum">QUESTION ' +
      String(index + 1).padStart(2, "0") +
      '</span><h3 lang="en">' +
      esc(q.prompt) +
      "</h3>" +
      field +
      feedback +
      '<div class="sectionRow readActions"><button class="btn" data-act="prev" ' +
      (index ? "" : "disabled") +
      '>上一题</button><button class="btn green" data-act="' +
      (index === total - 1 && !a.completed ? "submit" : "next") +
      '" ' +
      (index === total - 1 && a.completed ? "disabled" : "") +
      ">" +
      (index === total - 1 && !a.completed ? "交卷复盘" : "下一题 →") +
      "</button></div><details " +
      (a.notes?.[index] ? "open" : "") +
      '><summary>本题笔记</summary><textarea data-note rows="2" placeholder="记下你定位到的关键词或疑问">' +
      esc(a.notes?.[index] || "") +
      "</textarea></details></div></section>"
    );
  }
  function render() {
    if (disposed) return;
    const panel = by("[data-passage]"),
      scroll = panel?.scrollTop || 0;
    container.innerHTML =
      '<div class="sectionRow"><a class="miniAction" href="#/reading">← 全部阅读</a><div class="inlineBtns"><b data-remaining>' +
      secondsText(Math.max(0, set.minutes * 60 - elapsed)) +
      "</b>" +
      (a.completed
        ? '<button class="pill" data-act="repeat">重新计时练习</button>'
        : '<button class="pill" data-act="pause">' +
          (paused ? "继续计时" : "暂停") +
          '</button><button class="btn green" data-act="submit">交卷</button>') +
      '</div></div><header class="pageHead readerHeading"><div><span class="eyebrow">IELTS ' +
      (set.track === "general" ? "GENERAL" : "ACADEMIC") +
      " · READING</span><h1>" +
      esc(set.title) +
      "</h1><p>" +
      esc(set.subtitle || "阅读文章并完成题目") +
      " · " +
      total +
      " 题 · " +
      set.minutes +
      " 分钟</p></div></header>" +
      reviewSummary() +
      (confirmSubmit
        ? '<div class="submitBanner">已答 ' +
          answered() +
          " / " +
          total +
          ' 题，空题将计为未答。<button class="btn green" data-act="confirm">确认交卷</button><button class="pill" data-act="cancel">继续检查</button></div>'
        : "") +
      '<div class="mobileReadTabs"><button class="pill ' +
      (tab === "passage" ? "active" : "") +
      '" data-tab="passage">阅读原文</button><button class="pill ' +
      (tab === "questions" ? "active" : "") +
      '" data-tab="questions">答题与解析</button></div><div class="readSplit" data-tab="' +
      tab +
      '">' +
      passage() +
      '<div class="readSide">' +
      questionPanel() +
      '<section class="panel numberPanel"><div class="sectionRow"><b>答题卡</b><span class="mutedRow" data-count>' +
      answered() +
      " / " +
      total +
      '</span></div><div class="numberGrid">' +
      qs
        .map(
          (q, i) =>
            '<button aria-label="第 ' +
            (i + 1) +
            ' 题" data-jump="' +
            i +
            '" class="' +
            (i === index ? "current " : "") +
            (value(i) ? "answered " : "") +
            (a.completed && !a.answers[i].correct ? "miss " : "") +
            (a.flagged?.[i] ? "flagged" : "") +
            '">' +
            (i + 1) +
            "</button>",
        )
        .join("") +
      "</div>" +
      (a.completed
        ? '<button class="miniAction" data-act="wrong">下一道错题 →</button>'
        : "") +
      '</section></div></div><p class="pageNote">原创练习 · <a target="_blank" rel="noreferrer" href="https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-reading">官方题型说明 ↗</a></p>';
    if (by("[data-passage]")) by("[data-passage]").scrollTop = scroll;
  }
  function select(i) {
    index = Math.max(0, Math.min(total - 1, i));
    selectedEvidence = a.completed ? qs[index].evidence : "";
    save();
    render();
  }
  async function click(e) {
    const el = e.target.closest("button");
    if (!el) return;
    if (el.dataset.jump !== undefined) {
      select(Number(el.dataset.jump));
      return;
    }
    if (el.dataset.tab) {
      tab = el.dataset.tab;
      render();
      return;
    }
    switch (el.dataset.act) {
      case "pause":
        tick();
        paused = !paused;
        save();
        render();
        break;
      case "prev":
        select(index - 1);
        break;
      case "next":
        select(index + 1);
        break;
      case "flag":
        save({ flagged: { ...a.flagged, [index]: !a.flagged?.[index] } });
        render();
        break;
      case "submit":
        confirmSubmit = true;
        render();
        by(".submitBanner")?.scrollIntoView({ block: "nearest" });
        break;
      case "cancel":
        confirmSubmit = false;
        render();
        break;
      case "confirm":
        finish();
        break;
      case "locate": {
        tab = "passage";
        selectedEvidence = qs[index].evidence;
        render();
        const p = [...container.querySelectorAll("[data-par]")].find(
          (el) => el.dataset.par === qs[index].paragraph,
        );
        p?.scrollIntoView({ block: "nearest", behavior: "smooth" });
        break;
      }
      case "highlight": {
        const sel = window.getSelection();
        const para = sel?.anchorNode?.parentElement?.closest("[data-par]"),
          part = sel?.toString().trim().slice(0, 800);
        if (
          !para ||
          !container.contains(para) ||
          !part ||
          !para.textContent.includes(part)
        ) {
          el.textContent = "请先在一个段落内选中文字";
          return;
        }
        const k = para.dataset.par;
        save({
          marks: {
            ...a.marks,
            [k]: [...new Set([...(a.marks?.[k] || []), part])].slice(-25),
          },
        });
        sel.removeAllRanges();
        render();
        break;
      }
      case "clear":
        save({ marks: {} });
        render();
        break;
      case "wrong": {
        const misses = qs.map((_, i) => i).filter((i) => !a.answers[i].correct);
        if (misses.length) select(misses.find((i) => i > index) ?? misses[0]);
        else el.textContent = "本篇全部答对";
        break;
      }
      case "repeat": {
        key = "reading:" + set.id + ":" + crypto.randomUUID();
        history.replaceState(null, "", "#/" + route);
        a = {};
        index = 0;
        elapsed = 0;
        remainder = 0;
        paused = false;
        selectedEvidence = "";
        lastTick = Date.now();
        save();
        render();
        break;
      }
      case "ask-coach": {
        const output = by("[data-coach]");
        el.disabled = true;
        output.textContent = "正在获取反馈…";
        try {
          const q = qs[index],
            r = await accountFetch("/api/coach", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                task: "reading",
                input: "My answer: " + value(index),
                context: [q.prompt, q.answer, q.evidence, q.explanation].join(
                  "\n",
                ),
              }),
            });
          if (!r.ok) throw Error();
          output.textContent = (await r.json()).text;
        } catch {
          output.textContent =
            "尚未收到 AI 反馈。可直接使用上方证据与解析，或前往学习设置配置教练。";
        } finally {
          el.disabled = false;
        }
        break;
      }
    }
  }
  function input(e) {
    if (
      e.target.matches("[data-fill]") ||
      e.target.matches("input[type=radio]")
    ) {
      if (!a.completed) answer(index, e.target.value);
    } else if (e.target.matches("[data-note]"))
      save({ notes: { ...a.notes, [index]: e.target.value } });
  }
  const timer = setInterval(() => {
    tick();
    if (!a.completed && !paused && elapsed % 10 === 0) save();
  }, 1000);
  const away = () => {
    if (!a.completed) save();
  };
  const visible = () => {
    lastTick = Date.now();
    if (document.hidden) away();
  };
  const keepSelection = (e) => {
    if (e.target.closest("[data-act=highlight]")) e.preventDefault();
  };
  container.addEventListener("mousedown", keepSelection);
  document.addEventListener("visibilitychange", visible);
  window.addEventListener("pagehide", away);
  container.addEventListener("click", click);
  container.addEventListener("input", input);
  if (!a.startedAt) save();
  render();
  return () => {
    away();
    disposed = true;
    clearInterval(timer);
    container.removeEventListener("click", click);
    container.removeEventListener("input", input);
    container.removeEventListener("mousedown", keepSelection);
    document.removeEventListener("visibilitychange", visible);
    window.removeEventListener("pagehide", away);
  };
}
