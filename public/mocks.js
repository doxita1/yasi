import { esc } from "./icons.js";
import {
  getState,
  saveAttempt,
  saveDraft,
  getDraft,
  getAudio,
  putAudio,
  resolveConflict,
} from "./sync.js";
import { accountFetch } from "./account-request.js";
import { isCorrect } from "./mock-format.js";
import { listeningScripts, getMockAudioTexts } from "./mock-listening.js";
import { listeningQuestions } from "./mock-listening-questions.js";
import academicOne from "./mock-reading-a1.js";
import academicTwo from "./mock-reading-a2.js";
import generalOne from "./mock-reading-g1.js";
import generalTwo from "./mock-reading-g2.js";
import { writtenTasks, speakingTasks } from "./mock-production.js";

export { getMockAudioTexts };
const readingSets = {
  academic: [academicOne, academicTwo],
  general: [generalOne, generalTwo],
};
const skills = {
  listening: { title: "听力", minutes: 30, note: "4 段原创录音 · 40 题" },
  reading: { title: "阅读", minutes: 60, note: "3 组原文 · 40 题" },
  writing: {
    title: "写作",
    minutes: 60,
    note: "Task 1 与 Task 2 · 150 / 250 词起",
  },
  speaking: { title: "口语", minutes: 14, note: "3 部分 · 含 1 分钟准备" },
};
const readingTrack = (value) => (value === "general" ? "general" : "academic");
const trackLabel = (value) =>
  readingTrack(value) === "academic"
    ? "A 类 Academic"
    : "G 类 General Training";
const timeText = (sec) =>
  String(Math.floor(sec / 60)).padStart(2, "0") +
  ":" +
  String(sec % 60).padStart(2, "0");
export function mockSections(round, skill, track = "academic") {
  if (round !== 0 && round !== 1) throw new Error("Unknown mock paper");
  if (skill === "reading") return readingSets[readingTrack(track)][round];
  if (skill === "writing") return writtenTasks[round][readingTrack(track)];
  if (skill === "speaking") return speakingTasks[round];
  if (skill !== "listening") throw new Error("Unknown mock section");
  return Array.from({ length: 4 }, (_, i) => {
    const index = round * 4 + i,
      [title, text] = listeningScripts[index];
    return { title, text, questions: listeningQuestions[index] };
  });
}
export function mockKey(round, skill, track) {
  return [
    "mock",
    round + 1,
    ["reading", "writing"].includes(skill) ? readingTrack(track) : "shared",
    skill,
  ].join(":");
}
export function scoreMock(sections, answers) {
  let correct = 0,
    n = 0;
  for (const section of sections) {
    for (const question of section.questions) {
      if (isCorrect(question, answers[n]?.text)) correct++;
      n++;
    }
  }
  return { correct, total: n };
}
let audioIndex;
const words = (text) =>
  (
    String(text || "")
      .trim()
      .match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) || []
  ).length;

export function mountMocks(container, { onNavigate, track } = {}) {
  let chosenTrack = readingTrack(track),
    round = 0,
    skill,
    part = 0,
    runKey,
    sections = [],
    attempt = {},
    reviewing = false,
    ended = false,
    disposed = false;
  let tick,
    saveTimer,
    activeAudio,
    recorder,
    mediaStream,
    recorderPromise,
    stopWait,
    pendingMic = false,
    objectURL,
    generation = 0;
  let textNote = "",
    checking = false,
    coachController;
  const find = (selector) => container.querySelector(selector);
  const button = (id, label, primary = false) =>
    '<button type="button" class="btn ' +
    (primary ? "green" : "") +
    '" data-mock="' +
    id +
    '">' +
    esc(label) +
    "</button>";
  const remaining = () =>
    Math.max(0, Math.ceil((attempt.deadline - Date.now()) / 1000));
  const objective = () => ["listening", "reading"].includes(skill);
  const writtenKey = (index) => runKey + ":task:" + index;
  const draftText = (index) =>
    getDraft(writtenKey(index)) ?? attempt.answers?.[index]?.text ?? "";
  const title = () => "第 " + (round + 1) + " 套 · " + skills[skill].title;
  const persist = (patch) => {
    attempt = saveAttempt(runKey, { ...attempt, ...patch });
  };
  const numberOffset = () =>
    sections.slice(0, part).reduce((n, s) => n + s.questions.length, 0);
  function announce(message) {
    textNote = message;
    const area = find("[data-notice]");
    if (area) area.textContent = message;
  }
  function stopPlayback() {
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.onended = activeAudio.onerror = null;
      activeAudio = null;
    }
    if (objectURL) {
      URL.revokeObjectURL(objectURL);
      objectURL = null;
    }
  }
  function flushInputs() {
    clearTimeout(saveTimer);
    if (!skill || ended || reviewing) return;
    const fields = [...container.querySelectorAll("[data-answer]")];
    if (!fields.length) return;
    const answers = { ...attempt.answers };
    let changed = false;
    for (const field of fields) {
      const i = field.dataset.answer;
      if (answers[i]?.text === field.value) continue;
      changed = true;
      answers[i] = {
        ...answers[i],
        text: field.value,
        submitted: !!field.value.trim(),
        submittedAt: new Date().toISOString(),
      };
      if (skill === "writing") saveDraft(writtenKey(i), field.value);
    }
    if (changed) persist({ answers });
  }
  async function stopCapture() {
    if (recorder?.state === "recording") recorder.stop();
    if (recorderPromise) await recorderPromise;
    for (const t of mediaStream?.getTracks() || []) t.stop();
    recorder = null;
    mediaStream = null;
  }
  function exitView() {
    clearInterval(tick);
    clearTimeout(saveTimer);
    generation++;
    stopPlayback();
    coachController?.abort();
    coachController = null;
    checking = false;
  }
  function home() {
    exitView();
    skill = null;
    textNote = "";
    const options = [
      ["academic", "A 类 Academic"],
      ["general", "G 类 General Training"],
    ]
      .map(
        ([v, t]) =>
          '<option value="' +
          v +
          '" ' +
          (v === chosenTrack ? "selected" : "") +
          ">" +
          t +
          "</option>",
      )
      .join("");
    const cards = [0, 1]
      .map((i) => {
        const rows = Object.entries(skills)
          .map(([s, details]) => {
            const old = getState().attempts[mockKey(i, s, chosenTrack)];
            const label = old?.completed
              ? "查看结果"
              : old?.deadline
                ? "继续本场"
                : "开始" + details.title;
            const tag = old?.completed
              ? old.graded
                ? " · " + old.correct + " / " + old.graded
                : " · 已留样"
              : "";
            return (
              '<div class="mock-row"><div><strong>' +
              details.title +
              "</strong><p>" +
              details.note +
              " · " +
              details.minutes +
              " 分钟" +
              esc(tag) +
              "</p></div>" +
              button("begin:" + i + ":" + s, label) +
              "</div>"
            );
          })
          .join("");
        return (
          '<section class="panel panelBody"><h2 class="cardTitle">第 ' +
          (i + 1) +
          " 套阶段模拟</h2>" +
          rows +
          "</section>"
        );
      })
      .join("");
    container.innerHTML =
      '<div class="pageHead"><div><h1>模拟考试</h1><p>两套原创练习可分科进行。进入一科即开始倒计时，离开页面仍然计时。</p></div></div><div class="mock-controls"><label>读写试卷　<select data-track>' +
      options +
      '</select></label></div><div class="mock-grid">' +
      cards +
      '</div><p class="pageNote">听说两科共用，读写按所选类型切换。客观题报告原始答对数，作文与口语按量表复盘。</p>';
  }
  function open(i, s) {
    exitView();
    round = i;
    skill = s;
    sections = mockSections(round, skill, chosenTrack);
    runKey = mockKey(round, skill, chosenTrack);
    attempt = { answers: {}, ...getState().attempts[runKey] };
    if (!attempt.deadline) {
      const date = new Date();
      persist({
        round: round + 1,
        skill,
        track: chosenTrack,
        startedAt: date.toISOString(),
        deadline: date.getTime() + skills[skill].minutes * 60000,
        part: 0,
        mock: true,
      });
    }
    part = Math.max(0, Math.min(attempt.part || 0, sections.length - 1));
    ended = !!attempt.completed;
    reviewing = ended;
    textNote = "";
    if (!ended && !remaining()) {
      void finish(true);
      return;
    }
    render();
    tick = setInterval(() => {
      if (disposed || ended || !skill) return;
      const seconds = remaining(),
        clock = find("[data-clock]");
      if (clock) clock.textContent = timeText(seconds);
      if (!seconds) void finish(true);
    }, 500);
  }
  async function finish(timedOut = false) {
    if (ended || !skill) return;
    flushInputs();
    ended = true;
    clearInterval(tick);
    stopPlayback();
    await stopCapture();
    if (disposed || !skill) return;
    const score = objective() ? scoreMock(sections, attempt.answers) : null;
    const answers = { ...attempt.answers };
    if (score) {
      const questions = sections.flatMap((section) => section.questions);
      for (const [i, answer] of Object.entries(answers))
        if (questions[i])
          answers[i] = {
            ...answer,
            correct: isCorrect(questions[i], answer.text),
          };
    }
    persist({
      answers,
      completed: true,
      completedAt: new Date().toISOString(),
      elapsedSeconds: Math.min(
        skills[skill].minutes * 60,
        Math.max(
          0,
          Math.round((Date.now() - Date.parse(attempt.startedAt)) / 1000),
        ),
      ),
      correct: score?.correct ?? null,
      graded: score?.total ?? 0,
      submittedBy: timedOut ? "timer" : "learner",
    });
    reviewing = true;
    part = 0;
    textNote = timedOut ? "时间已到，本场作答已保存。" : "本场作答已提交。";
    render();
  }
  function objectiveHtml() {
    const sec = sections[part],
      start = numberOffset();
    let material;
    if (skill === "listening") {
      material =
        '<div class="mock-material"><h3>' +
        esc(sec.title) +
        "</h3>" +
        button(
          "listen",
          reviewing
            ? "回听录音"
            : attempt["played" + part]
              ? "本段已播放"
              : "播放本段录音",
          true,
        ) +
        (reviewing
          ? '<details><summary>查看听力原文</summary><div lang="en">' +
            sec.text
              .split("\n\n")
              .map((p) => "<p>" + esc(p) + "</p>")
              .join("") +
            "</div></details>"
          : '<p class="pageNote">正式练习每段播放一次。音频加载失败可以重试。</p>') +
        "</div>";
    } else {
      material =
        '<article class="mock-material" lang="en"><h3>' +
        esc(sec.title) +
        "</h3>" +
        sec.text
          .split("\n\n")
          .map((p) => "<p>" + esc(p) + "</p>")
          .join("") +
        "</article>";
    }
    const qs = sec.questions
      .map((q, j) => {
        const index = start + j,
          text = attempt.answers?.[index]?.text || "";
        const control = q.choices?.length
          ? '<select aria-label="Question ' +
            (index + 1) +
            '" data-answer="' +
            index +
            '"><option value="">选择答案</option>' +
            q.choices
              .map(
                (k) =>
                  "<option " +
                  (k === text ? "selected" : "") +
                  ' value="' +
                  esc(k) +
                  '">' +
                  esc(k) +
                  "</option>",
              )
              .join("") +
            "</select>"
          : '<input aria-label="Question ' +
            (index + 1) +
            '" data-answer="' +
            index +
            '" maxlength="200" autocomplete="off" value="' +
            esc(text) +
            '">';
        const feedback = reviewing
          ? '<div class="mock-feedback"><b>' +
            (isCorrect(q, text) ? "正确" : "订正") +
            "</b> · 你的答案：" +
            esc(text || "未作答") +
            "<br>参考答案：" +
            esc(q.answer) +
            "<br>" +
            esc(q.explanation) +
            "</div>"
          : control;
        return (
          '<div class="mock-q"><p lang="en"><b>' +
          (index + 1) +
          ".</b> " +
          esc(q.prompt) +
          "</p>" +
          feedback +
          "</div>"
        );
      })
      .join("");
    return (
      '<div class="mock-work">' +
      material +
      '<section class="mock-questions"><h3>Questions ' +
      (start + 1) +
      "–" +
      (start + sec.questions.length) +
      '</h3><p class="pageNote">填空请用英文填写简短答案，可输入数字或时间。</p>' +
      qs +
      "</section></div>"
    );
  }
  function writingHtml() {
    const t = sections[part],
      text = draftText(part);
    const conflict = getState().conflicts.find(
      (c) => c.key === writtenKey(part),
    );
    const conflictUi =
      !reviewing && conflict
        ? '<section class="mock-feedback"><b>两台设备各有一份草稿</b><p>' +
          esc(conflict.local) +
          "</p>" +
          button("resolve:local", "采用这份草稿") +
          "<p>" +
          esc(conflict.remote) +
          "</p>" +
          button("resolve:remote", "采用另一份草稿") +
          "</section>"
        : "";
    const table = t.table
      ? '<div class="mock-table"><table>' +
        t.table
          .map(
            (row, r) =>
              "<tr>" +
              row
                .map((cell) =>
                  r
                    ? "<td>" + esc(cell) + "</td>"
                    : "<th>" + esc(cell) + "</th>",
                )
                .join("") +
              "</tr>",
          )
          .join("") +
        "</table></div>"
      : "";
    const review = reviewing
      ? '<p class="mock-manuscript" lang="en">' +
        esc(text || "未作答") +
        "</p><h3>改稿时核对</h3><ul>" +
        t.cues.map((c) => "<li>" + esc(c) + "</li>").join("") +
        "</ul>" +
        button("coach", "让已配置的 AI 深度批改") +
        '<div class="mock-manuscript" data-coach></div>'
      : '<label>英文作答<textarea data-answer="' +
        part +
        '" rows="12" maxlength="40000" lang="en">' +
        esc(text) +
        "</textarea></label>";
    return (
      '<section class="mock-material"><h3>' +
      esc(t.title) +
      '</h3><p lang="en">' +
      esc(t.prompt) +
      "</p>" +
      table +
      '<p class="pageNote">建议 ' +
      (part ? "40 分钟，至少 250 词" : "20 分钟，至少 150 词") +
      "。Task 2 占较高权重。</p>" +
      conflictUi +
      review +
      '<p class="pageNote" data-words>当前 ' +
      words(text) +
      " 词</p></section>"
    );
  }
  function speakingHtml() {
    const s = sections[part],
      ans = attempt.answers?.[part] || {};
    const prep =
      part === 1
        ? '<p class="pageNote">先准备 1 分钟，再连续说 1–2 分钟，最后回答简短追问。</p>'
        : "";
    const progress =
      part === 1 && attempt.prepEnd && Date.now() < attempt.prepEnd
        ? '<p class="pageNote">准备结束时间 ' +
          new Date(attempt.prepEnd).toLocaleTimeString() +
          "</p>"
        : "";
    let controls = reviewing
      ? ""
      : button(
          "record",
          recorder?.state === "recording" ? "停止并保存录音" : "录下本部分回答",
          true,
        );
    if (ans.blobKey) controls += button("replay", "回听我的录音");
    if (part === 1 && !reviewing)
      controls += button("prepare", "开始 1 分钟准备");
    return (
      '<section class="mock-material"><h3>' +
      esc(s.title) +
      "</h3>" +
      prep +
      progress +
      '<ol lang="en">' +
      s.questions.map((q) => "<li>" + esc(q) + "</li>").join("") +
      "</ol>" +
      (s.follow
        ? '<p lang="en"><b>Follow-up</b> · ' + esc(s.follow) + "</p>"
        : "") +
      '<div class="mock-controls">' +
      controls +
      "</div>" +
      (reviewing
        ? '<p class="mock-manuscript">' +
          esc(ans.text || "未写转述") +
          '</p><p class="pageNote">回听时核对连贯性、词汇、语法和发音清晰度。没有录音时，发音维度标为暂缺。</p>'
        : '<label>转述或练习笔记（可选）<textarea data-answer="' +
          part +
          '" maxlength="20000" rows="4">' +
          esc(ans.text || "") +
          "</textarea></label>") +
      "</section>"
    );
  }
  function render() {
    if (disposed || !skill) return;
    const tabs = sections
      .map(
        (_, i) =>
          '<button type="button" aria-pressed="' +
          (i === part) +
          '" class="btn ' +
          (i === part ? "green" : "") +
          '" data-mock="part:' +
          i +
          '">' +
          (skill === "writing" ? "Task " : "Part ") +
          (i + 1) +
          "</button>",
      )
      .join("");
    const results = reviewing
      ? '<p class="mock-result">' +
        (objective()
          ? "客观题答对 " +
            attempt.correct +
            " / " +
            attempt.graded +
            "。逐题核对依据。"
          : "已保存本场作答，可以逐项回看。") +
        "</p>"
      : "";
    container.innerHTML =
      '<div class="mock-controls">' +
      button("home", "← 模考首页") +
      "<span>" +
      (reviewing
        ? "已提交"
        : "剩余 <strong data-clock>" + timeText(remaining()) + "</strong>") +
      '</span></div><header class="pageHead"><div><h1>' +
      esc(title()) +
      "</h1><p>" +
      skills[skill].note +
      " · " +
      (["listening", "speaking"].includes(skill)
        ? "A/G 通用"
        : trackLabel(chosenTrack)) +
      "</p></div></header>" +
      results +
      '<div class="mock-controls">' +
      tabs +
      '</div><p role="status" data-notice>' +
      esc(textNote) +
      "</p>" +
      (objective()
        ? objectiveHtml()
        : skill === "writing"
          ? writingHtml()
          : speakingHtml()) +
      '<div class="mock-controls">' +
      (part + 1 < sections.length
        ? button("part:" + (part + 1), "下一部分", true)
        : "") +
      (reviewing ? button("home", "返回模考首页") : button("submit", "交卷")) +
      "</div>";
  }
  async function listen() {
    if (!reviewing && attempt["played" + part]) {
      announce("本场已播放本段，交卷后可回听。");
      return;
    }
    const serial = generation,
      currentPart = part;
    stopPlayback();
    try {
      if (!audioIndex)
        audioIndex = fetch("/audio/manifest.json")
          .then((r) => {
            if (!r.ok) throw Error();
            return r.json();
          })
          .catch((e) => {
            audioIndex = null;
            throw e;
          });
      const index = await audioIndex;
      if (disposed || serial !== generation || part !== currentPart) return;
      const file = index[sections[part].text];
      if (!file) throw Error();
      const media = new Audio(file.startsWith("/") ? file : "/audio/" + file);
      activeAudio = media;
      media.onerror = () => {
        if (activeAudio === media) {
          if (!ended) persist({ ["played" + currentPart]: false });
          announce("录音加载失败，请重新播放。");
        }
      };
      media.onended = () => announce("本段播放完毕。");
      await media.play();
      if (
        disposed ||
        serial !== generation ||
        part !== currentPart ||
        activeAudio !== media
      ) {
        media.pause();
        return;
      }
      if (!reviewing) persist({ ["played" + part]: true });
      announce("正在播放本段录音。");
    } catch {
      announce("无法播放此段音频。请检查音量和网络后重试。");
    }
  }
  async function capture() {
    if (recorder?.state === "recording") {
      await stopCapture();
      if (!disposed) render();
      return;
    }
    if (pendingMic) return;
    pendingMic = true;
    const serial = generation,
      key = runKey,
      index = part;
    let acquired;
    try {
      acquired = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (disposed || ended || serial !== generation) {
        acquired.getTracks().forEach((t) => t.stop());
        return;
      }
      const device = new MediaRecorder(acquired),
        chunks = [];
      mediaStream = acquired;
      recorder = device;
      recorderPromise = new Promise((r) => {
        stopWait = r;
      });
      const resolve = stopWait;
      device.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      device.onstop = async () => {
        acquired.getTracks().forEach((t) => t.stop());
        try {
          const blob = new Blob(chunks, {
            type: device.mimeType || "audio/webm",
          });
          if (!blob.size) throw Error();
          const blobKey = key + ":" + index + ":" + crypto.randomUUID();
          await putAudio(blobKey, blob);
          const a = getState().attempts[key] || attempt;
          const answers = {
            ...a.answers,
            [index]: {
              ...a.answers?.[index],
              blobKey,
              submitted: true,
              submittedAt: new Date().toISOString(),
            },
          };
          const saved = saveAttempt(key, { ...a, answers });
          if (key === runKey) {
            attempt = saved;
            announce("录音已保存。");
          }
        } catch {
          if (!disposed) announce("设备未能保存录音，请重试或使用文字转述。");
        } finally {
          if (recorder === device) {
            recorder = null;
            mediaStream = null;
            recorderPromise = null;
          }
          resolve();
        }
      };
      device.start();
      render();
      announce("正在录音。");
    } catch {
      acquired?.getTracks().forEach((t) => t.stop());
      announce("无法使用麦克风，可在本题输入转述并继续。");
    } finally {
      pendingMic = false;
    }
  }
  async function replay() {
    const serial = generation,
      blob = await getAudio(attempt.answers?.[part]?.blobKey);
    if (disposed || serial !== generation) return;
    if (!blob) {
      announce("录音仍在同步或本设备无法读取。");
      return;
    }
    stopPlayback();
    objectURL = URL.createObjectURL(blob);
    activeAudio = new Audio(objectURL);
    try {
      await activeAudio.play();
      announce("正在回听你的录音。");
    } catch {
      announce("当前设备无法播放这段录音。");
    }
  }
  async function scoreWriting() {
    if (checking) return;
    const input = draftText(part);
    if (!input.trim()) {
      announce("本题未提交作文。");
      return;
    }
    checking = true;
    coachController = new AbortController();
    const serial = generation;
    announce("正在请求所选服务商的深度反馈。");
    try {
      const r = await accountFetch("/api/coach", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "writing",
          depth: "deep",
          context: sections[part].prompt,
          input,
        }),
        signal: coachController.signal,
      });
      const result = await r.json();
      if (disposed || serial !== generation) return;
      if (!r.ok || !result.text) throw Error();
      find("[data-coach]").textContent = result.text;
      announce("AI 参考反馈已返回。");
    } catch {
      if (!disposed && serial === generation)
        announce(
          "尚未获得反馈。请检查 AI 设置；你仍可用题目下方的要点自行改稿。",
        );
    } finally {
      if (serial === generation) checking = false;
    }
  }
  async function click(e) {
    const id = e.target.closest("[data-mock]")?.dataset.mock;
    if (!id) return;
    if (id.startsWith("begin:")) {
      const [, r, s] = id.split(":");
      open(Number(r), s);
      return;
    }
    if (id === "listen") return listen();
    if (id === "replay") return replay();
    if (id === "record") return capture();
    if (id === "coach") return scoreWriting();
    if (id.startsWith("resolve:")) {
      const conflict = getState().conflicts.find(
        (c) => c.key === writtenKey(part),
      );
      if (!conflict) return;
      clearTimeout(saveTimer);
      resolveConflict(conflict.id, id.split(":")[1]);
      const text = draftText(part);
      persist({
        answers: {
          ...attempt.answers,
          [part]: {
            text,
            submitted: !!text.trim(),
            submittedAt: new Date().toISOString(),
          },
        },
      });
      render();
      return;
    }
    if (id === "prepare") {
      persist({ prepEnd: Date.now() + 60000 });
      render();
      return;
    }
    if (id === "submit") {
      flushInputs();
      const count = Object.keys(attempt.answers || {}).length;
      announce("已记录 " + count + " 份作答。交卷后可查看答案。");
      find('[data-mock="submit"]').outerHTML = button(
        "confirm",
        "确认交卷",
        true,
      );
      return;
    }
    if (id === "confirm") return finish(false);
    if (id === "home" || id.startsWith("part:")) {
      flushInputs();
      await stopCapture();
      if (disposed) return;
      generation++;
      stopPlayback();
      coachController?.abort();
      checking = false;
      if (id === "home") return home();
      part = Number(id.split(":")[1]);
      if (!ended) persist({ part });
      textNote = "";
      render();
    }
  }
  function change(e) {
    if (e.target.matches("[data-track]")) {
      chosenTrack = readingTrack(e.target.value);
      home();
    } else if (e.target.matches("select[data-answer]")) flushInputs();
  }
  function input(e) {
    if (!e.target.matches("[data-answer]")) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flushInputs, 280);
    const n = find("[data-words]");
    if (n) n.textContent = "当前 " + words(e.target.value) + " 词";
  }
  const hidden = () => {
    if (document.hidden) flushInputs();
  };
  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = "/mock.css";
  document.head.append(style);
  container.addEventListener("click", click);
  container.addEventListener("input", input);
  container.addEventListener("change", change);
  window.addEventListener("pagehide", flushInputs);
  document.addEventListener("visibilitychange", hidden);
  home();
  return () => {
    flushInputs();
    disposed = true;
    exitView();
    void stopCapture();
    container.removeEventListener("click", click);
    container.removeEventListener("input", input);
    container.removeEventListener("change", change);
    window.removeEventListener("pagehide", flushInputs);
    document.removeEventListener("visibilitychange", hidden);
    style.remove();
  };
}
