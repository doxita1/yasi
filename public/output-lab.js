import { aiResponse, aiErrorText } from "./ai-response.js";
import { esc } from "./icons.js";
import {
  getState,
  saveAttempt,
  saveDraft,
  getDraft,
  resolveConflict,
  putAudio,
  getAudio,
} from "./sync.js";
import { accountFetch } from "./account-request.js";
import {
  writingBank,
  speakingBank,
  criteria,
  sourceLinks,
  countWords,
  aiContext,
} from "./output-content.js";
import { workedExamples } from "./output-examples.js";
import { mapExample } from "./output-map.js";

const ids = {
  map: "Academic Task 1 · 地图",
  chart: "Academic Task 1",
  letter: "General Training Task 1",
  essay: "Task 2",
  speaking: "Speaking",
};
const time = (n) =>
  String(Math.floor(n / 60)).padStart(2, "0") +
  ":" +
  String(n % 60).padStart(2, "0");
const para = (s) =>
  String(s || "")
    .split(/\n+/)
    .map((v) => "<p>" + esc(v) + "</p>")
    .join("");
const btn = (action, text, active = false) =>
  '<button type="button" class="ol-button ' +
  (active ? "ol-emphasis" : "") +
  '" data-ol="' +
  action +
  '">' +
  esc(text) +
  "</button>";
const source = (entry) =>
  '<a target="_blank" rel="noreferrer" href="' +
  entry[1] +
  '">' +
  esc(entry[0]) +
  " ↗</a>";
const iso = () => new Date().toISOString();
const stageLabel = {
  1: "Part 1 · 个人访谈",
  2: "Part 2 · 个人陈述",
  3: "Part 3 · 抽象讨论",
};
const fieldLabel = {
  first: "限时初稿",
  second: "修改稿",
  goal: "本次修改目标",
  notes: "准备提纲",
  transcript: "我的转述",
};
export const labKey = (mode, id, contextWeek = 0) =>
  ["lab", mode, contextWeek, id].join(":");
export function mountOutputLab(
  container,
  { mode = "writing", track = "undecided", week = 0, topic, onNavigate } = {},
) {
  const speaking = mode === "speaking",
    weekNo =
      Number.isInteger(Number(week)) && week >= 1 && week <= 26
        ? Number(week)
        : 0;
  let selectedTrack = track === "general" ? "general" : "academic";
  if (
    !speaking &&
    typeof topic === "string" &&
    (topic.startsWith("g-") || topic.endsWith("-letter"))
  )
    selectedTrack = "general";
  if (
    !speaking &&
    typeof topic === "string" &&
    (topic.startsWith("a-") || topic.endsWith("-chart"))
  )
    selectedTrack = "academic";
  const bank = () =>
    speaking ? speakingBank() : writingBank(selectedTrack, weekNo);
  const attempts = getState().attempts;
  const latest = Object.values(attempts)
    .filter(
      (a) =>
        a.outputMode === mode &&
        a.contextWeek === weekNo &&
        bank().some((b) => b.id === a.topicId),
    )
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))[0];
  let item =
    bank().find((t) => t.id === topic) ||
    bank().find((t) => t.id === latest?.topicId) ||
    (speaking && weekNo ? bank()[weekNo - 1] : bank()[0]);
  let key,
    record,
    stage,
    draft,
    timer,
    debounce,
    disposed = false,
    epoch = 0,
    notice = "",
    media = null,
    stream = null,
    playing = null,
    clipURL = null,
    recordingPromise = null,
    waitingMic = false,
    dictation = null,
    ai = null;
  const find = (s) => container.querySelector(s);
  const selText = (k) => getDraft(key + ":" + k) || "";
  const draftId = () => (speaking ? "speech-" + stage : draft);
  const min = () => (item.kind === "essay" ? 250 : 150);
  function load() {
    key = labKey(mode, item.id, weekNo);
    record = getState().attempts[key] || {};
    stage = record.stage || 1;
    draft = record.draft || "first";
    notice = "";
  }
  function persist(fields = {}) {
    const route = mode + "/" + weekNo + "/" + item.id;
    record = saveAttempt(key, {
      outputMode: mode,
      labArea: mode,
      contextWeek: weekNo,
      week: weekNo,
      topicId: item.id,
      labRoute: route,
      stage,
      draft,
      ...fields,
    });
  }
  function msg(s) {
    notice = s;
    const e = find("[data-ol-status]");
    if (e) e.textContent = s;
  }
  function flush() {
    clearTimeout(debounce);
    const text = find("[data-ol-input]");
    if (!text) return;
    const tag = text.dataset.olInput,
      from = selText(tag);
    if (from !== text.value) {
      saveDraft(key + ":" + tag, text.value);
      persist();
    }
  }
  function flushAll() {
    flush();
    for (const t of container.querySelectorAll("[data-ol-aux]"))
      if (selText(t.dataset.olAux) !== t.value)
        saveDraft(key + ":" + t.dataset.olAux, t.value);
  }
  function resetSound() {
    if (playing) {
      playing.pause();
      playing = null;
    }
    if (clipURL) {
      URL.revokeObjectURL(clipURL);
      clipURL = null;
    }
  }
  function timerStart(seconds, label) {
    persist({
      timer: { end: Date.now() + seconds * 1000, label, started: Date.now() },
    });
    paintTimer();
  }
  function paintTimer() {
    const slot = find("[data-ol-clock]");
    if (!slot) return;
    const t = record.timer,
      left = t ? Math.max(0, Math.ceil((t.end - Date.now()) / 1000)) : null;
    slot.textContent =
      left === null
        ? speaking
          ? stage === 2
            ? "01:00 / 02:00"
            : "未开始"
          : time((item.kind === "essay" ? 40 : 20) * 60)
        : t.label + " " + time(left);
    if (t && left === 0 && !t.expired) {
      persist({ timer: { ...t, expired: true } });
      if (t.label === "陈述" && media?.state === "recording") media.stop();
      flushAll();
      msg(
        t.label === "准备"
          ? "准备结束。请开始两分钟陈述。"
          : "计时结束。当前内容已保留，可继续复盘。",
      );
    }
  }
  function durationStage() {
    return stage === 2 ? 120 : stage === 1 ? 240 : 300;
  }
  function stopRecognition() {
    if (dictation) {
      dictation.onresult = null;
      dictation.onend = null;
      try {
        dictation.abort();
      } catch {}
      dictation = null;
    }
  }
  async function stopCapture() {
    if (media?.state === "recording") media.stop();
    if (recordingPromise) await recordingPromise;
  }
  function stopRemote() {
    if (ai) {
      ai.abort();
      ai = null;
    }
    stopRecognition();
    resetSound();
  }
  function adopt(value) {
    item = value;
    load();
    epoch++;
    render();
    persist();
  }
  function comparison() {
    const outcome = speaking ? item.strong : item.strong;
    const issue =
      item.issue ||
      (speaking
        ? "回答给出笼统感受，却没有把当时的难点和结果讲清楚。"
        : "表态或请求笼统，读者看不到理由或下一步。");
    const weak =
      item.weak ||
      "It was a nice experience. I learned a lot and it was very useful.";
    const annotation = item.annotation || "检查英文细节与题目要求的对应关系。";
    const overview = speaking
      ? ""
      : '<div class="ol-example"><h4>' +
        (["chart", "map"].includes(item.kind)
          ? "可核对的概述"
          : item.kind === "letter"
            ? "一种开篇"
            : "一种可辩护的立场") +
        '</h4><p lang="en">' +
        esc(item.overview) +
        "</p></div>";
    return (
      '<details class="ol-details"><summary>看本题的表达对比与讲评</summary>' +
      overview +
      '<div class="ol-dual"><article><h4>展开不足</h4><p lang="en">' +
      esc(weak) +
      "</p><p>" +
      esc(issue) +
      '</p></article><article><h4>有依据的展开</h4><p lang="en">' +
      esc(outcome) +
      "</p><p>" +
      esc(annotation) +
      "</p></article></div></details>"
    );
  }
  function worked() {
    const x = item.kind === "map" ? mapExample : workedExamples[item.kind];
    return (
      '<details class="ol-details"><summary>' +
      esc(x.title) +
      "</summary>" +
      x.paras
        .map(
          ([p, n]) =>
            '<div class="ol-example"><div lang="en">' +
            para(p) +
            "</div><small>" +
            esc(n) +
            "</small></div>",
        )
        .join("") +
      "</details>"
    );
  }
  function rubric() {
    const checks = record.checks || {};
    return (
      '<section class="ol-panel"><h2>逐项复核</h2><p class="ol-muted">每项勾选表示你已用本次作品核对该维度。达到哪一分仍需要独立评定。</p>' +
      criteria[item.kind]
        .map(
          ([name, explanation], i) =>
            '<label class="ol-check"><input type="checkbox" data-ol-criterion="' +
            i +
            '" ' +
            (checks[i] ? "checked" : "") +
            "><span><b>" +
            esc(name) +
            "</b><small>" +
            esc(explanation) +
            "</small></span></label>",
        )
        .join("") +
      "</section>"
    );
  }
  function conflictUI(tag) {
    const conflict = getState().conflicts.find(
      (x) => x.key === key + ":" + tag,
    );
    if (!conflict) return "";
    return (
      '<div class="ol-conflict"><h3>两台设备保留了不同文本</h3><div class="ol-dual"><div>' +
      para(conflict.local) +
      btn("conflict:local", "采用本机版本") +
      "</div><div>" +
      para(conflict.remote) +
      btn("conflict:remote", "采用另一版本") +
      "</div></div></div>"
    );
  }
  function head() {
    const list = bank(),
      base = weekNo ? "第 " + weekNo + " 周 · " : "";
    const options = list
      .map(
        (t) =>
          '<option value="' +
          esc(t.id) +
          '" ' +
          (t.id === item.id ? "selected" : "") +
          ">" +
          esc((!speaking ? ids[t.kind] + " · " : "") + t.title) +
          "</option>",
      )
      .join("");
    const trackSwitch = speaking
      ? ""
      : '<label>Task 1 类型<select data-ol-track><option value="academic" ' +
        (selectedTrack === "academic" ? "selected" : "") +
        '>A 类图表</option><option value="general" ' +
        (selectedTrack === "general" ? "selected" : "") +
        ">G 类书信</option></select></label>";
    return (
      '<header class="ol-head"><div><p class="ol-label">' +
      base +
      (speaking ? "口语专项" : "写作专项") +
      "</p><h1>" +
      (speaking ? "雅思口语训练室" : "雅思写作训练室") +
      "</h1><p>" +
      (speaking
        ? "日常访谈、两分钟长回答，再用没有提前展示的问题检验你的理由。"
        : "在一篇完整作答里练习概括、比较和论证，保留原稿，再根据证据改写。") +
      '</p></div><div class="ol-selects">' +
      trackSwitch +
      "<label>训练题目<select data-ol-topic>" +
      options +
      "</select></label></div></header>"
    );
  }
  function writing() {
    const txt = selText(draft),
      first = selText("first"),
      second = selText("second"),
      goal = selText("goal"),
      kind = item.kind;
    const spatial = item.maps
      ? '<figure class="ol-map"><figcaption>↑ North　·　West ←　→ East</figcaption><div class="ol-dual">' +
        item.maps
          .map(
            (map) =>
              "<div><h4>" +
              esc(map.year) +
              '</h4><div class="ol-plan" aria-label="从西北角开始逐行排列的九个位置">' +
              map.cells
                .map((v) => '<span lang="en">' + esc(v) + "</span>")
                .join("") +
              "</div></div>",
          )
          .join("") +
        '</div><p lang="en">' +
        esc(item.proposal) +
        "</p></figure>"
      : "";
    const tbl = item.table
      ? '<div class="ol-table"><table><caption>题目数据 · 原创示例</caption>' +
        item.table
          .map(
            (r, j) =>
              "<tr>" +
              r
                .map((c) =>
                  j
                    ? "<td>" + esc(String(c)) + "</td>"
                    : '<th scope="col">' + esc(String(c)) + "</th>",
                )
                .join("") +
              "</tr>",
          )
          .join("") +
        "</table></div>"
      : spatial;
    const directive =
      kind === "chart" && !item.id.startsWith("week-")
        ? "Summarise the information by selecting and reporting the main features, and make comparisons where relevant."
        : "";
    return (
      '<div class="ol-columns"><div class="ol-stack"><section class="ol-panel"><div class="ol-label">' +
      ids[kind] +
      " · " +
      min() +
      " 词起</div><h2>" +
      esc(item.title) +
      '</h2><div class="ol-question" lang="en">' +
      para(item.prompt + " " + directive) +
      "</div>" +
      tbl +
      "</section>" +
      comparison() +
      worked() +
      rubric() +
      '</div><div class="ol-stack"><section class="ol-panel"><div class="ol-actions">' +
      btn("first", "限时初稿", draft === "first") +
      btn("second", "第二稿", draft === "second") +
      '</div><div class="ol-clockrow"><span data-ol-clock></span>' +
      btn(
        "timer",
        record.timer && !record.timer.expired
          ? "查看计时"
          : "开始 " + (kind === "essay" ? 40 : 20) + " 分钟计时",
      ) +
      "</div>" +
      conflictUI(draft) +
      '<label for="ol-editor">' +
      esc(fieldLabel[draft]) +
      '</label><textarea id="ol-editor" lang="en" rows="12" data-ol-input="' +
      draft +
      '" placeholder="Write your answer in English.">' +
      esc(txt) +
      '</textarea><div class="ol-sub"><span data-ol-words>' +
      countWords(txt) +
      " / " +
      min() +
      ' 词</span><span>自动保存</span></div><label for="ol-goal">二稿主要改进什么</label><textarea id="ol-goal" rows="2" data-ol-aux="goal" placeholder="' +
      esc(item.revision) +
      '">' +
      esc(goal) +
      '</textarea><div class="ol-actions">' +
      btn("second", "带入初稿，开始修改") +
      btn("ai", "用 AI 按四维点评") +
      '</div></section><details class="ol-details" ' +
      (draft === "second" ? "open" : "") +
      '><summary>逐稿对照</summary><div class="ol-dual"><article><h4>初稿 · ' +
      countWords(first) +
      ' 词</h4><div data-ol-first class="ol-copy" lang="en">' +
      para(first || "尚未保存") +
      "</div></article><article><h4>二稿 · " +
      countWords(second) +
      ' 词</h4><div data-ol-second class="ol-copy" lang="en">' +
      para(second || "尚未开始") +
      "</div></article></div></details>" +
      feedback() +
      btn("finish", "保存本次修订结果", true) +
      "</div></div>"
    );
  }
  function feedback() {
    const data = record.feedback?.[draftId()];
    return data
      ? '<section class="ol-panel"><h3>AI 参考反馈</h3><div class="ol-copy">' +
          para(data.text) +
          "</div><small>" +
          esc(data.provider || "") +
          " · " +
          esc(data.model || "") +
          "</small></section>"
      : "";
  }
  function speakingView() {
    const q =
      stage === 1
        ? item.warmups
        : stage === 2
          ? [item.cue, ...item.bullets]
          : [];
    const followIds = record.followIds || [],
      shown = followIds.map((i) => item.follow[i]).filter(Boolean);
    const currentTakes = (record.takes || []).filter((t) => t.stage === stage);
    const tag = "speech-" + stage;
    return (
      '<div class="ol-actions ol-parts">' +
      [1, 2, 3]
        .map((i) => btn("part:" + i, stageLabel[i], stage === i))
        .join("") +
      '</div><div class="ol-columns"><div class="ol-stack"><section class="ol-panel"><p class="ol-label">' +
      stageLabel[stage] +
      "</p><h2>" +
      esc(item.title) +
      "</h2>" +
      (stage === 3
        ? '<p>每次揭示一道新问题。先给直接判断，再考虑对方提出的条件。</p><ol lang="en">' +
          shown.map((v) => "<li>" + esc(v) + "</li>").join("") +
          "</ol>" +
          btn(
            "surprise",
            shown.length === 3 ? "已展示本组追问" : "揭示一条临场追问",
            true,
          )
        : '<div class="ol-question" lang="en"><ol>' +
          q.map((v) => "<li>" + esc(v) + "</li>").join("") +
          "</ol></div>") +
      (stage === 2
        ? '<label for="ol-notes">准备卡 · 关键词、转折与结果</label><textarea id="ol-notes" rows="3" data-ol-aux="notes">' +
          esc(selText("notes")) +
          "</textarea>"
        : "") +
      "</section>" +
      comparison() +
      worked() +
      rubric() +
      '</div><div class="ol-stack"><section class="ol-panel"><h2>录下回答，再听一次</h2><div class="ol-clockrow"><span data-ol-clock></span>' +
      (stage === 2 ? btn("prep", "开始 1 分钟准备") : "") +
      btn("solo", stage === 2 ? "开始 2 分钟陈述" : "开始本部分计时") +
      '</div><div class="ol-actions">' +
      btn(
        "record",
        media?.state === "recording" ? "停止并保存录音" : "录音作答",
        true,
      ) +
      '</div><p class="ol-muted">可直接录音或输入你说过的内容。两分钟陈述倒计时结束时，正在进行的录音会自动保存。</p><div class="ol-clips">' +
      currentTakes
        .map(
          (t, i) =>
            "<div>" +
            btn(
              "replay:" + t.id,
              "回听第 " + (i + 1) + " 次 · " + time(t.seconds),
            ) +
            "</div>",
        )
        .join("") +
      "</div>" +
      conflictUI(tag) +
      '<label for="ol-transcript">本部分的英文转述</label><textarea id="ol-transcript" lang="en" rows="7" data-ol-input="' +
      tag +
      '" placeholder="回听录音后写出自己的原话，保留原来的错误。">' +
      esc(selText(tag)) +
      '</textarea><div class="ol-actions">' +
      btn("dictate", dictation ? "结束听写" : "浏览器语音听写（可选）") +
      btn("ai", "用 AI 点评转述") +
      '</div><p class="ol-muted">听写使用浏览器提供的语音服务，可能联网。文字反馈可检查内容、用词和语法；发音请听原录音。</p></section>' +
      feedback() +
      btn("finish", "保存本次口试复盘", true) +
      "</div></div>"
    );
  }
  function render() {
    if (disposed) return;
    container.innerHTML =
      '<div class="ol-root">' +
      head() +
      '<p data-ol-status role="status">' +
      esc(notice) +
      "</p>" +
      (speaking ? speakingView() : writing()) +
      '<footer class="ol-sources">' +
      source(sourceLinks[mode]) +
      " · " +
      source(sourceLinks.bands) +
      " · 本站题目和示例均为原创练习。</footer></div>";
    paintTimer();
  }
  function listenText() {
    if (dictation) {
      stopRecognition();
      msg("听写已结束。");
      render();
      return;
    }
    const C = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!C) {
      msg("此浏览器没有听写接口。录音回听和手动转述仍可使用。");
      return;
    }
    const recognizer = new C(),
      e = epoch;
    recognizer.lang = "en-GB";
    recognizer.interimResults = false;
    recognizer.continuous = true;
    recognizer.onresult = (ev) => {
      if (disposed || epoch !== e) return;
      const box = find("[data-ol-input]");
      if (!box) return;
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        if (ev.results[i].isFinal)
          box.value = (box.value + " " + ev.results[i][0].transcript).trim();
      }
      flush();
    };
    recognizer.onerror = () =>
      msg("浏览器听写暂不可用。可保留原录音并手动转述。");
    recognizer.onend = () => {
      if (dictation === recognizer) {
        dictation = null;
        const b = find('[data-ol="dictate"]');
        if (b) b.textContent = "浏览器语音听写（可选）";
      }
    };
    try {
      recognizer.start();
      dictation = recognizer;
      msg("正在听写英文。");
      const b = find('[data-ol="dictate"]');
      if (b) b.textContent = "结束听写";
    } catch {
      msg("无法开始听写，请手动输入。");
    }
  }
  async function capture() {
    if (media?.state === "recording") {
      await stopCapture();
      if (!disposed) render();
      return;
    }
    if (waitingMic || recordingPromise) return;
    const serial = epoch,
      target = key,
      targetStage = stage;
    let acquired;
    waitingMic = true;
    try {
      if (!navigator.mediaDevices || !window.MediaRecorder) throw Error();
      acquired = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (disposed || epoch !== serial) {
        acquired.getTracks().forEach((t) => t.stop());
        return;
      }
      stopRecognition();
      resetSound();
      const device = new MediaRecorder(acquired),
        chunks = [],
        started = Date.now();
      let resolve;
      recordingPromise = new Promise((r) => {
        resolve = r;
      });
      media = device;
      stream = acquired;
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
          const id = crypto.randomUUID(),
            blobKey = target + ":take:" + id;
          await putAudio(blobKey, blob);
          const current = getState().attempts[target] || {};
          const next = saveAttempt(target, {
            takes: [
              ...(current.takes || []),
              {
                id,
                blobKey,
                seconds: Math.max(1, Math.round((Date.now() - started) / 1000)),
                stage: targetStage,
                at: iso(),
              },
            ],
          });
          if (target === key) record = next;
          if (!disposed && epoch === serial) {
            notice = "本次录音已保存，可与下一次录音对比。";
          }
        } catch {
          if (!disposed) msg("录音未能保存。请重试或输入本段转述。");
        } finally {
          if (media === device) {
            media = null;
            stream = null;
            recordingPromise = null;
          }
          resolve();
          if (!disposed && epoch === serial) {
            flushAll();
            render();
          }
        }
      };
      device.start();
      if (
        stage === 2 &&
        (!record.timer || record.timer.label !== "陈述" || record.timer.expired)
      )
        timerStart(120, "陈述");
      flushAll();
      render();
      msg("正在录音。");
    } catch {
      acquired?.getTracks().forEach((t) => t.stop());
      msg("当前无法使用麦克风。可用计时器练口述，并手动输入转述。");
    } finally {
      waitingMic = false;
    }
  }
  async function play(id) {
    const serial = epoch,
      t = (record.takes || []).find((x) => x.id === id);
    if (!t) return;
    resetSound();
    const b = await getAudio(t.blobKey);
    if (disposed || serial !== epoch) return;
    if (!b) {
      msg("录音尚未同步到这台设备。");
      return;
    }
    clipURL = URL.createObjectURL(b);
    playing = new Audio(clipURL);
    try {
      await playing.play();
      msg("正在回听录音。");
    } catch {
      msg("本机无法播放这段音频。");
    }
  }
  async function askCoach() {
    if (ai) return;
    flushAll();
    const tag = draftId(),
      txt = selText(tag);
    if (countWords(txt) < 3) {
      msg("先写下自己的英文作答，再请求针对本次作品的反馈。");
      return;
    }
    const serial = epoch,
      task = speaking ? "speaking" : "writing",
      controller = new AbortController();
    ai = controller;
    const questionBundle = speaking
      ? [
          ...item.warmups,
          item.cue,
          ...item.bullets,
          ...(record.followIds || []).map((i) => item.follow[i]),
        ].join("\n")
      : "";
    const frame = aiContext(
      item,
      speaking ? stageLabel[stage] : fieldLabel[draft],
      !speaking && draft === "second" ? selText("first") : "",
      selText("goal"),
    );
    msg("正在向所选服务商提交本次题面和作答。");
    try {
      const r = await accountFetch("/api/coach", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task,
          depth: "deep",
          input: txt.slice(0, 30000),
          context: (frame + "\n" + questionBundle).slice(0, 18000),
        }),
        signal: controller.signal,
      });
      const data = await aiResponse(r);
      if (disposed || epoch !== serial) return;
      if (!data.text) throw Error();
      persist({
        feedback: {
          ...record.feedback,
          [tag]: {
            text: data.text,
            model: data.model,
            provider: data.provider,
            at: iso(),
          },
        },
      });
      flushAll();
      notice = "已收到参考反馈。";
      render();
    } catch (error) {
      if (!disposed && epoch === serial) msg(aiErrorText(error));
    } finally {
      if (ai === controller) ai = null;
    }
  }
  function complete() {
    flushAll();
    if (speaking) {
      const missing = [1, 2, 3].filter(
        (i) =>
          !selText("speech-" + i).trim() &&
          !(record.takes || []).some((t) => t.stage === i),
      );
      if (missing.length) {
        msg(
          "请为 Part " +
            missing.join("、") +
            " 留下一段录音或转述，再完成整场复盘。",
        );
        return;
      }
      if (!(record.followIds || []).length) {
        msg("请在 Part 3 揭示一道新问题，再回应它。");
        return;
      }
    } else {
      if (
        countWords(selText("first")) < min() ||
        countWords(selText("second")) < min()
      ) {
        msg(
          "两稿均须达到本题的 " + min() + " 词练习目标。当前文字已自动保存。",
        );
        return;
      }
      if (
        !selText("goal").trim() ||
        selText("first").trim() === selText("second").trim()
      ) {
        msg("请写下一个修改目标，并在第二稿落实一处实质修改。");
        return;
      }
    }
    if (Object.values(record.checks || {}).every((b) => !b)) {
      msg("请先按一项或多项评分维度核对自己的作品。");
      return;
    }
    persist({ completed: true, completedAt: record.completedAt || iso() });
    msg("本次练习和复盘已保存。");
  }
  async function click(e) {
    const b = e.target.closest("[data-ol]");
    if (!b) return;
    const id = b.dataset.ol;
    if (id === "record") return capture();
    if (id.startsWith("replay:")) return play(id.slice(7));
    if (id === "dictate") return listenText();
    if (id === "ai") return askCoach();
    if (id === "finish") return complete();
    if (id === "timer") {
      if (record.timer && !record.timer.expired) {
        msg("计时器已在运行。");
        return;
      }
      timerStart((item.kind === "essay" ? 40 : 20) * 60, "写作");
      return;
    }
    if (id === "prep" || id === "solo") {
      timerStart(
        id === "prep" ? 60 : durationStage(),
        id === "prep" ? "准备" : stage === 2 ? "陈述" : "口述",
      );
      return;
    }
    if (id === "surprise") {
      const seen = record.followIds || [],
        left = [0, 1, 2].filter((i) => !seen.includes(i));
      if (!left.length) {
        msg("本话题的三道追问均已显示。");
        return;
      }
      flushAll();
      const i =
        left[crypto.getRandomValues(new Uint32Array(1))[0] % left.length];
      persist({ followIds: [...seen, i] });
      render();
      return;
    }
    if (id === "first" || id === "second") {
      flushAll();
      stopRemote();
      epoch++;
      if (
        id === "second" &&
        getDraft(key + ":second") === undefined &&
        selText("first").trim()
      )
        saveDraft(key + ":second", selText("first"));
      draft = id;
      persist();
      render();
      return;
    }
    if (id.startsWith("part:")) {
      flushAll();
      await stopCapture();
      if (disposed) return;
      stopRemote();
      epoch++;
      stage = Number(id.slice(5));
      persist({ timer: null });
      render();
      return;
    }
    if (id.startsWith("conflict:")) {
      flushAll();
      const cf = getState().conflicts.find(
        (x) => x.key === key + ":" + draftId(),
      );
      if (cf) resolveConflict(cf.id, id.slice(9));
      render();
    }
  }
  async function change(e) {
    const t = e.target;
    if (t.matches("[data-ol-criterion]")) {
      persist({
        checks: { ...record.checks, [t.dataset.olCriterion]: t.checked },
      });
      return;
    }
    if (t.matches("[data-ol-topic],[data-ol-track]")) {
      flushAll();
      await stopCapture();
      if (disposed) return;
      stopRemote();
      epoch++;
      if (t.matches("[data-ol-track]")) {
        selectedTrack = t.value;
        adopt(bank()[0]);
      } else {
        const next = bank().find((x) => x.id === t.value);
        if (next) adopt(next);
      }
    }
  }
  function input(e) {
    if (!e.target.matches("[data-ol-input],[data-ol-aux]")) return;
    clearTimeout(debounce);
    debounce = setTimeout(flushAll, 240);
    const box = e.target;
    if (box.matches("[data-ol-input]") && !speaking) {
      const word = find("[data-ol-words]");
      if (word)
        word.textContent = countWords(box.value) + " / " + min() + " 词";
      const preview = find(
        draft === "first" ? "[data-ol-first]" : "[data-ol-second]",
      );
      if (preview) preview.textContent = box.value;
    }
  }
  const vis = () => {
    if (document.hidden) flushAll();
    else paintTimer();
  };
  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = "/output-lab.css";
  document.head.append(style);
  container.addEventListener("click", click);
  container.addEventListener("change", change);
  container.addEventListener("input", input);
  window.addEventListener("pagehide", flushAll);
  document.addEventListener("visibilitychange", vis);
  load();
  render();
  persist();
  timer = setInterval(paintTimer, 300);
  return () => {
    flushAll();
    disposed = true;
    epoch++;
    clearInterval(timer);
    clearTimeout(debounce);
    stopRemote();
    void stopCapture();
    stream?.getTracks().forEach((t) => t.stop());
    container.removeEventListener("click", click);
    container.removeEventListener("change", change);
    container.removeEventListener("input", input);
    window.removeEventListener("pagehide", flushAll);
    document.removeEventListener("visibilitychange", vis);
    style.remove();
  };
}
