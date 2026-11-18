import { getDay, weekTitles } from "./curriculum.js";
import { lexisModules } from "./input-lexis.js";
import { getState, saveAttempt, saveReview } from "./sync.js";
import { esc } from "./icons.js";

function normalize(text) {
  return String(text || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[‐‑–—]/g, "-")
    .replace(/[.,!?;:]+$/, "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(
      /\b(organisation|organise|prioritise|analyse|recognise|behaviour|neighbourhood|centre|colour)\b/g,
      (t) =>
        ({
          organisation: "organization",
          organise: "organize",
          prioritise: "prioritize",
          analyse: "analyze",
          recognise: "recognize",
          behaviour: "behavior",
          neighbourhood: "neighborhood",
          centre: "center",
          colour: "color",
        })[t],
    );
}
const irregular = {
  people: "person",
  children: "child",
  criteria: "criterion",
  indices: "index",
  analyses: "analysis",
  phenomena: "phenomenon",
  feet: "foot",
  men: "man",
  women: "woman",
  studies: "study",
};
function singular(w) {
  if (irregular[w]) return irregular[w];
  if (/ies$/.test(w)) return w.slice(0, -3) + "y";
  if (/(?:sh|ch|s|x|z)es$/.test(w)) return w.slice(0, -2);
  if (/s$/.test(w) && !/(?:ss|us|is|ics|ness)$/.test(w)) return w.slice(0, -1);
  return null;
}
export function dictationVerdict(expected, input, plays) {
  const response = normalize(input),
    term = normalize(expected),
    a = response.split(" "),
    b = term.split(" ");
  if (!response) return { right: false, type: "未听出", replayed: plays > 1 };
  if (response === term)
    return {
      right: true,
      type: plays > 1 ? "重听后正确" : "一次听准",
      replayed: plays > 1,
    };
  const diff = b.map((w, i) => [w, a[i]]).filter(([w, v]) => w !== v);
  const plural =
    a.length === b.length &&
    diff.length === 1 &&
    singular(diff[0][0]) === diff[0][1];
  return {
    right: false,
    type: plural
      ? "漏写复数"
      : a.length !== b.length
        ? "漏词或多词"
        : "拼写或词形",
    replayed: plays > 1,
  };
}
export function dictationCards(week, day = 1) {
  if (week >= 27 && week <= 32)
    return lexisModules[week - 27].terms.map((t, i) => ({
      term: t.term,
      gloss: t.gloss,
      example: t.example,
      reviewKey: "input-lexis:" + t.term,
      url: "/input-audio/word-" + (week - 27) + "-" + i + ".mp3",
    }));
  if (!Number.isInteger(week) || week < 1 || week > 26 || day < 1 || day > 6)
    return [];
  return getDay((week - 1) * 6 + day, "undecided")
    .blocks.find((b) => b.id === "vocab")
    .items.map((q) => ({
      term: q.word || q.term,
      gloss: q.meaning,
      example: q.example,
      reviewKey: q.reviewKey,
    }));
}
const btn = (id, label, primary = false) =>
  '<button type="button" data-dict="' +
  id +
  '" class="il-btn ' +
  (primary ? "il-primary" : "") +
  '">' +
  esc(label) +
  "</button>";
const date = () => new Date().toISOString();
let vocabAudio;
async function pathFor(card) {
  if (card.url) return card.url;
  vocabAudio ||= fetch("/audio/manifest.json")
    .then((r) => {
      if (!r.ok) throw Error("missing");
      return r.json();
    })
    .catch((e) => {
      vocabAudio = null;
      throw e;
    });
  const file = (await vocabAudio)[card.term];
  if (!file) throw Error("missing");
  return "/audio/" + file;
}
export function mountDictation(
  container,
  { week, question, attemptKey, onNavigate } = {},
) {
  const w = Number(week),
    scoped = Number.isInteger(w) && w >= 1 && w <= 32,
    advanced = w >= 27;
  let day = 1,
    run = null,
    key = null,
    cards = [],
    player = null,
    pending = false,
    ended = false,
    token = 0,
    inspect = Number.isInteger(question) ? question : null;
  const q = (s) => container.querySelector(s);
  const goto = (path) =>
    onNavigate ? onNavigate(path) : (location.hash = "#" + path);
  const title = !scoped
    ? "盲听拼写"
    : advanced
      ? lexisModules[w - 27].title
      : weekTitles[w - 1];
  const slots = () =>
    Object.entries(getState().attempts || {})
      .filter(([, a]) => a.labArea === "dictation" && a.labWeek === w)
      .sort((a, b) =>
        String(b[1].updatedAt).localeCompare(String(a[1].updatedAt)),
      );
  function stop() {
    token++;
    pending = false;
    if (player) {
      player.pause();
      player = null;
    }
  }
  function save(p) {
    if (run && key) run = saveAttempt(key, { ...run, ...p });
  }
  function msg(text) {
    const el = q("[data-note]");
    if (el) el.textContent = text;
  }
  function start(onlyWrong = false) {
    stop();
    inspect = null;
    const all = dictationCards(w, day);
    const selection = onlyWrong
      ? run.sequence.filter(
          (i) => !run.words[i]?.right || run.words[i]?.replayed,
        )
      : all.map((_, i) => i);
    if (!selection.length) return;
    key = "dictation:" + w + ":" + day + ":" + crypto.randomUUID();
    cards = all;
    run = {
      labArea: "dictation",
      labWeek: w,
      labDay: day,
      labRoute: "dictation/" + w,
      labTitle: title + " · 听拼" + (advanced ? "" : " D" + day),
      completed: false,
      startedAt: date(),
      sequence: selection,
      words: {},
      listenCounts: {},
      pos: 0,
      currentInput: "",
      elapsedSeconds: 0,
    };
    save({});
    draw();
  }
  function loadDay(n, requested = null) {
    stop();
    day = n;
    cards = dictationCards(w, day);
    const choices = slots().filter(([, r]) => r.labDay === n),
      current = choices.find(([k]) => k === requested) || choices[0];
    [key, run] = current || [null, null];
    draw();
  }
  function catalog() {
    const weeks = weekTitles
      .map(
        (s, i) =>
          '<option value="' +
          (i + 1) +
          '">第 ' +
          (i + 1) +
          " 周 · " +
          esc(s) +
          "</option>",
      )
      .join("");
    return (
      '<header class="il-header"><span class="il-kicker">LISTEN & SPELL</span><h1>盲听拼写</h1><p>先听、再打字。单独记录是否一次听准、是否漏写复数，以及哪些词需要再听。</p></header>' +
      '<div class="il-grid"><section class="il-intro"><h2>跟课听拼</h2><p>26 周，每周 6 组、每组 6 项。音频取自本站 936 个原创课程词汇和表达。</p><label>选择课程周 <select data-week>' +
      weeks +
      "</select></label> " +
      btn("open-week", "练这一周", true) +
      "</section>" +
      '<section class="il-intro"><h2>学术搭配听拼</h2><p>6 个主题，各 10 个搭配。英国和美国两种合成英语语音交替朗读。</p><label>选择主题 <select data-advanced>' +
      lexisModules
        .map(
          (m, i) =>
            '<option value="' + (27 + i) + '">' + esc(m.title) + "</option>",
        )
        .join("") +
      "</select></label> " +
      btn("open-advanced", "练进阶词", true) +
      "</section></div>"
    );
  }
  function summary() {
    const rows = run.sequence.map((i) => [i, run.words[i]]);
    const first = rows.filter(([, r]) => r?.right && !r.replayed).length,
      repeat = rows.filter(([, r]) => r?.right && r.replayed).length;
    return (
      '<section class="il-result"><div><b>' +
      first +
      " / " +
      rows.length +
      "</b><p>一次听准 · 重听后正确 " +
      repeat +
      " 项</p></div>" +
      btn("fresh", "重练本组") +
      "</section>" +
      '<div class="il-deck">' +
      rows
        .map(
          ([i, r]) =>
            "<article><b>" +
            esc(cards[i].term) +
            "</b> · " +
            esc(r.type) +
            " · 播放 " +
            r.plays +
            " 次" +
            (!r.right
              ? "<p>你的拼写：" +
                esc(r.input || "未作答") +
                "；正确：" +
                esc(cards[i].term) +
                "</p>"
              : "") +
            "</article>",
        )
        .join("") +
      "</div>" +
      (rows.some(([, r]) => !r.right || r.replayed)
        ? btn("wrong", "只练错词和重听词", true)
        : "")
    );
  }
  function draw() {
    if (ended) return;
    if (!scoped) {
      container.innerHTML = '<main class="il-main">' + catalog() + "</main>";
      return;
    }
    const tabs = advanced
      ? ""
      : '<nav class="il-daybar" aria-label="本周的听拼组">' +
        Array.from(
          { length: 6 },
          (_, i) =>
            '<button class="il-btn ' +
            (day === i + 1 ? "il-primary" : "") +
            '" data-day="' +
            (i + 1) +
            '">第 ' +
            (i + 1) +
            " 组</button>",
        ).join("") +
        "</nav>";
    const heading =
      '<button class="il-inline" data-dict="catalog">← 全部听拼</button><header class="il-header"><span class="il-kicker">' +
      (advanced ? "ACADEMIC DICTATION" : "WEEK " + w + " / DICTATION") +
      "</span><h1>" +
      esc(title) +
      "</h1><p>不看词表听写。首次答案保留，可重听、订正并单独复习错词。</p></header>" +
      tabs;
    let body = "";
    if (!run)
      body =
        '<section class="il-intro"><b>本组 ' +
        cards.length +
        " 项</b><p>听到音频后完整输入英文。常见英美拼写可接受，留意复数及短语中的小词。</p>" +
        btn("start", "开始盲听", true) +
        "</section>";
    else if (run.completed) body = summary();
    else {
      const i = run.sequence[run.pos],
        card = cards[i],
        r = run.words[i],
        count = run.listenCounts[i] || 0;
      body =
        '<p class="il-count">第 ' +
        (run.pos + 1) +
        " / " +
        run.sequence.length +
        ' 项</p><section class="il-intro"><h2>听音写词</h2><div class="il-audio"><span data-plays>已播放 ' +
        count +
        " 次</span>" +
        btn("play", count ? "▶ 再听一次" : "▶ 播放词音") +
        "</div>" +
        (r
          ? '<div class="il-feedback ' +
            (r.right ? "il-correct" : "il-missed") +
            '"><b>' +
            esc(r.type) +
            "</b> · " +
            esc(card.term) +
            "<p>" +
            esc(card.gloss) +
            "</p>" +
            (!r.right
              ? "<p>首次拼写：" + esc(r.input || "未听出") + "</p>"
              : "") +
            (card.example ? '<p lang="en">' + esc(card.example) + "</p>" : "") +
            "</div>" +
            (!r.right
              ? '<label>订正拼写<input class="il-answer" data-correction autocomplete="off" spellcheck="false" placeholder="重新完整输入正确表达" value="' +
                esc(r.correction || "") +
                '"></label>' +
                btn("correct", "核对订正")
              : "") +
            btn(
              "next",
              run.pos === run.sequence.length - 1
                ? "完成并查看记录"
                : "下一项 →",
              true,
            )
          : '<label>你的拼写<input class="il-answer" lang="en" data-spelling maxlength="200" placeholder="Type what you hear" autocomplete="off" autocapitalize="off" spellcheck="false" value="' +
            esc(run.currentInput || "") +
            '"></label><div class="il-daybar">' +
            btn("grade", "核对拼写", true) +
            btn("pass", "没听出来") +
            "</div>") +
        '<p role="status" data-note class="il-message"></p></section>';
    }
    const seen = inspect !== null && run?.words?.[inspect],
      word = seen && cards[inspect];
    const source = word
      ? '<section class="il-intro" data-origin="' +
        inspect +
        '"><span class="il-kicker">错词原题 · 第 ' +
        (inspect + 1) +
        " 项</span><h2>" +
        esc(word.term) +
        "</h2><p>首次拼写：" +
        esc(seen.input || "未听出") +
        " · " +
        esc(seen.type) +
        " · 播放 " +
        seen.plays +
        " 次</p><p>" +
        esc(word.gloss) +
        "</p>" +
        (word.example ? '<p lang="en">' + esc(word.example) + "</p>" : "") +
        btn("source-voice", "▶ 重听原词") +
        btn("close-source", "收起原题") +
        "</section>"
      : "";
    container.innerHTML =
      '<main class="il-main">' + heading + source + body + "</main>";
  }
  async function play(source = null) {
    if (pending || !run || (run.completed && source === null)) return;
    stop();
    const id = token;
    pending = true;
    const i = source ?? run.sequence[run.pos];
    try {
      const src = await pathFor(cards[i]);
      if (token !== id || ended) return;
      player = new Audio(src);
      await player.play();
      if (token !== id || ended) return;
      if (source !== null) return;
      const counts = {
        ...run.listenCounts,
        [i]: (run.listenCounts[i] || 0) + 1,
      };
      save({ listenCounts: counts });
      const p = q("[data-plays]");
      if (p) p.textContent = "已播放 " + counts[i] + " 次";
      const b = q("[data-dict=play]");
      if (b) b.textContent = "▶ 再听一次";
      msg("");
    } catch {
      if (!ended) msg("音频未能播放。请检查网络后重试。");
    } finally {
      if (token === id) pending = false;
    }
  }
  function grade(pass) {
    const i = run.sequence[run.pos],
      card = cards[i],
      input = pass ? "" : run.currentInput || "",
      plays = run.listenCounts[i] || 0;
    if (plays === 0) {
      msg("请先播放本项音频。");
      return;
    }
    if (!pass && !input.trim()) {
      msg("请输入听到的词；不确定时可选择「没听出来」。");
      return;
    }
    const result = {
      ...dictationVerdict(card.term, input, plays),
      input,
      plays,
      at: date(),
    };
    save({ words: { ...run.words, [i]: result } });
    const prev = getState().review[card.reviewKey] || {},
      days = result.right && !result.replayed ? 3 : 1;
    const due = new Date();
    due.setDate(due.getDate() + days);
    due.setHours(0, 0, 0, 0);
    saveReview(card.reviewKey, {
      word: card.term,
      meaning: card.gloss,
      example: card.example || prev.example || "",
      blockId: "vocab",
      tiers: {
        ...prev.tiers,
        听得出: result.right && !result.replayed ? "practised" : "learning",
      },
      lastDictation: result.type,
      lastSpelling: input,
      due: due.toISOString(),
      ...(!result.right || result.replayed
        ? {
            category: result.type,
            labRoute: run.labRoute,
            labQuestion: i,
            labAttempt: key,
            labTitle: run.labTitle,
          }
        : {}),
      ...(!result.right && !card.example
        ? { example: "首次填写 " + (input || "（未听出）") + " → " + card.term }
        : {}),
    });
    draw();
  }
  function click(e) {
    const b = e.target.closest("button");
    if (!b || !container.contains(b)) return;
    if (b.dataset.day) {
      inspect = null;
      loadDay(Number(b.dataset.day));
      return;
    }
    switch (b.dataset.dict) {
      case "catalog":
        goto("/dictation");
        break;
      case "open-week":
        goto("/dictation/" + q("[data-week]").value);
        break;
      case "open-advanced":
        goto("/dictation/" + q("[data-advanced]").value);
        break;
      case "start":
      case "fresh":
        start();
        break;
      case "wrong":
        start(true);
        break;
      case "source-voice":
        void play(inspect);
        break;
      case "close-source":
        inspect = null;
        draw();
        break;
      case "play":
        void play();
        break;
      case "grade":
        grade(false);
        break;
      case "pass":
        grade(true);
        break;
      case "correct": {
        const i = run.sequence[run.pos],
          v = q("[data-correction]").value;
        if (normalize(v) === normalize(cards[i].term)) {
          save({
            words: {
              ...run.words,
              [i]: { ...run.words[i], correction: v, correctedAt: date() },
            },
          });
          msg("订正正确。首次拼写仍保留在复习记录中。");
        } else msg("和上方正确表达核对一下字母、空格与词尾。");
        break;
      }
      case "next":
        stop();
        if (run.pos === run.sequence.length - 1) {
          const correct = Object.values(run.words).filter(
            (r) => r.right,
          ).length;
          save({
            completed: true,
            completedAt: date(),
            correct,
            total: run.sequence.length,
            graded: run.sequence.length,
            currentInput: "",
          });
        } else save({ pos: run.pos + 1, currentInput: "" });
        draw();
        break;
    }
  }
  function input(e) {
    if (e.target.matches("[data-spelling]"))
      save({ currentInput: e.target.value });
  }
  function enter(e) {
    if (
      e.key === "Enter" &&
      !e.isComposing &&
      e.target.matches("[data-spelling]")
    ) {
      e.preventDefault();
      grade(false);
    }
  }
  container.addEventListener("click", click);
  container.addEventListener("input", input);
  container.addEventListener("keydown", enter);
  if (scoped) {
    const match = slots().find(([k]) => k === attemptKey);
    loadDay(
      advanced
        ? 1
        : match?.[1].labDay ||
            slots().find(([, a]) => !a.completed)?.[1].labDay ||
            1,
      attemptKey,
    );
    const focus = q("[data-origin]");
    if (focus) {
      focus.tabIndex = -1;
      focus.focus({ preventScroll: true });
    }
  } else draw();
  return () => {
    stop();
    ended = true;
    container.removeEventListener("click", click);
    container.removeEventListener("input", input);
    container.removeEventListener("keydown", enter);
  };
}
