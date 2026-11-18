import { getState, updateProfile } from "./sync.js";
import { accountFetch as fetch } from "./account-request.js";
import { esc, icon } from "./icons.js";
import {
  aiResponse,
  aiErrorText,
  isLocalPreview,
  keyInputError,
} from "./ai-response.js";
const providers = {
  ark: {
    name: "火山方舟 · 豆包",
    short: "豆包 Seed 2.1 Lite",
    model: "doubao-seed-2-1-lite-260915",
    deepModel: "doubao-seed-2-1-pro-260915",
    url: "https://ark.cn-beijing.volces.com/api/v3/responses",
    pricing: "https://docs.volcengine.com/docs/ark/model-pricing?lang=zh",
    guide: "https://console.volcengine.com/ark/region:cn-beijing/apiKey",
  },
  openai: {
    name: "OpenAI 官方 GPT",
    short: "GPT-6 Luna",
    model: "gpt-6-luna",
    deepModel: "gpt-6.2-sol",
    url: "https://api.openai.com/v1/responses",
    pricing: "https://developers.openai.com/api/docs/pricing",
    guide: "https://platform.openai.com/api-keys",
  },
};
const opt = (value, label, sel) =>
  '<option value="' +
  esc(value) +
  '" ' +
  (value === sel ? "selected" : "") +
  ">" +
  esc(label) +
  "</option>";
async function request(path, method = "GET", data) {
  const response = await fetch("/api/" + path, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
  });
  return aiResponse(response);
}
export function mountSettings(container, { provider: preferred } = {}) {
  const requested = Object.hasOwn(providers, preferred) ? preferred : null;
  let active = true,
    cfg = null,
    provider = requested || getState().profile.provider || "ark";
  const p = getState().profile,
    bands = Array.from({ length: 13 }, (_, i) => 3 + i / 2),
    presets = [15, 20, 30, 45, 60],
    custom = !presets.includes(p.dailyMinutes);
  container.innerHTML =
    '<header class="pageHead"><div><span class="eyebrow">PREFERENCES</span><h1>学习设置</h1><p>调整学习目标，或为当前账号添加 AI 教练。</p></div></header><div class="settingGrid"><section class="panel panelBody"><h2 class="cardTitle">我的学习目标</h2><form class="goalForm" id="profileForm" style="margin-top:18px"><label>考试方向<select name="track">' +
    [
      ["undecided", "尚未确定 · 先体验两类"],
      ["academic", "A 类 · 学术雅思"],
      ["general", "G 类 · 培训雅思"],
    ]
      .map((x) => opt(...x, p.track))
      .join("") +
    '</select></label><div class="two"><label>目标总分<select name="target">' +
    bands.map((x) => opt(x, x.toFixed(1), p.targetBand)).join("") +
    '</select></label><label>单项最低分<select name="min">' +
    bands.map((x) => opt(x, x.toFixed(1), p.minBand)).join("") +
    '</select></label></div><label>每日建议时长<select name="dailyMinutes" aria-describedby="minutesHelp">' +
    presets.map((n) => opt(n, n + " 分钟", p.dailyMinutes)).join("") +
    opt("custom", "自定时长", custom ? "custom" : "") +
    "</select></label><div data-custom-minutes" +
    (custom ? "" : " hidden") +
    '><label>自定分钟数（5–180）<input type="number" name="customMinutes" min="5" max="180" step="1" inputmode="numeric" value="' +
    esc(p.dailyMinutes) +
    '" required' +
    (custom ? "" : " disabled") +
    '></label></div><small class="pageNote" id="minutesHelp">用来安排当天的练习和复习，可随时调整。</small><button class="btn green">保存学习目标</button><output class="formStatus" aria-live="polite"></output></form><hr style="border:0;border-top:1px solid var(--line);margin:20px 0"><h2 class="cardTitle">账号与访问</h2><p class="pageNote">此学习室采用邀请制，学习记录、录音和 AI 额度按账号隔离。在手机和电脑上使用同一个 ChatGPT 账号即可续练。</p><a class="btn" href="/signout-with-chatgpt?return_to=/" target="_top">退出当前账号</a></section><section class="panel panelBody"><h2 class="cardTitle">' +
    icon("spark", 17) +
    ' AI 教练</h2><p class="pageNote">基础课程随时可练。需要个性化反馈时，选择服务商并添加个人密钥。</p><div id="aiForm"></div></section></div>';
  const form = container.querySelector("#profileForm");
  const minuteSelect = form.elements.dailyMinutes,
    customMinutes = form.elements.customMinutes;
  minuteSelect.onchange = () => {
    const show = minuteSelect.value === "custom";
    customMinutes.disabled = !show;
    form.querySelector("[data-custom-minutes]").hidden = !show;
    if (show) customMinutes.focus();
  };
  form.onsubmit = (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const dailyMinutes = Number(
      f.get(minuteSelect.value === "custom" ? "customMinutes" : "dailyMinutes"),
    );
    if (
      !Number.isInteger(dailyMinutes) ||
      dailyMinutes < 5 ||
      dailyMinutes > 180
    ) {
      form.querySelector("output").textContent =
        "请输入 5 至 180 之间的整数分钟。";
      return;
    }
    if (Number(f.get("min")) > Number(f.get("target"))) {
      form.querySelector("output").textContent =
        "单项下限应小于或等于总分目标。";
      return;
    }
    updateProfile({
      track: f.get("track"),
      targetBand: Number(f.get("target")),
      minBand: Number(f.get("min")),
      dailyMinutes,
    });
    form.querySelector("output").textContent = "学习目标已保存。";
  };
  const node = container.querySelector("#aiForm");
  function paint(note = "") {
    if (!active) return;
    const v = providers[provider],
      stored = cfg?.providers?.[provider];
    const local = isLocalPreview();
    const host = local ? "本机预览" : "云端学习室";
    node.innerHTML =
      '<form class="goalForm"><p class="pageNote">' +
      (local
        ? "本机预览 · 配置保存在这台电脑的本地学习账号中。使用云端学习室时须在云端账号内配置。"
        : "云端学习室 · 配置保存在当前登录账号，可跨设备使用。") +
      "</p><p>当前所选服务商　<b>" +
      esc(v.name) +
      "</b>　" +
      (stored?.configured ? "已保存密钥" : "尚未保存密钥") +
      '</p><label>服务商<select name="provider">' +
      Object.entries(providers)
        .map(([k, v]) => opt(k, v.name, provider))
        .join("") +
      '</select></label><div class="pageNote">日常释义、语法和短对话推荐 ' +
      v.short +
      "。整篇作文和长对话复盘可用" +
      (provider === "ark" ? "豆包 Seed 2.1 Pro" : " GPT-6.2 Sol") +
      '。</div><label>官方接口<input readonly value="' +
      esc(v.url) +
      '"></label><label>日常模型<input name="model" required maxlength="160" value="' +
      esc(stored?.model || v.model) +
      '"></label><label>深度批改模型<input name="deep" required maxlength="160" value="' +
      esc(stored?.deepModel || v.deepModel) +
      '"></label><label>个人 API 密钥<input type="password" name="key" autocomplete="new-password" placeholder="' +
      (stored?.configured
        ? "已配置 · 留空可保留原密钥"
        : "输入密钥，服务端加密保存") +
      '"></label><div hidden><button type="button" class="btn" data-action="switch-openai">改用 OpenAI 官方接口</button></div><div class="pageNote">测试会先保存当前表单，再向所选模型发送一条纠错示例。测试和 AI 练习按服务商的输入、输出用量计费。ChatGPT 订阅与 API 单独计费。<br><a target="_blank" rel="noreferrer" href="' +
      v.guide +
      '">管理官方密钥 ↗</a>　<a target="_blank" rel="noreferrer" href="' +
      v.pricing +
      '">查看价格 ↗</a>' +
      (provider === "openai"
        ? '　<a target="_blank" rel="noreferrer" href="https://platform.openai.com/settings/organization/billing/overview">API 账单 ↗</a>'
        : "") +
      (provider === "openai"
        ? '<p><button type="button" class="btn" data-action="network">检查网络（免密钥）</button> ' +
          host +
          "会匿名访问纠错使用的 <code>POST /v1/responses</code> 接口。无需密钥，不产生模型费用。</p>"
        : "") +
      '</div><div class="inlineBtns"><button class="btn green" type="submit">保存 AI 配置</button><button class="btn" type="button" data-action="test">测试日常模型</button><button class="btn" type="button" data-action="test-deep">测试深度模型</button>' +
      (stored?.configured
        ? '<button class="btn" type="button" data-action="clear">删除密钥</button>'
        : "") +
      '</div><output class="formStatus" aria-live="polite">' +
      esc(note) +
      "</output></form>";
    const f = node.querySelector("form"),
      out = f.querySelector("output");
    f.elements.provider.onchange = () => {
      provider = f.elements.provider.value;
      paint();
    };
    const field = f.elements.key,
      switcher = f.querySelector("[data-action=switch-openai]");
    field.oninput = () => {
      const error = keyInputError(provider, field.value);
      field.setCustomValidity(error);
      switcher.parentElement.hidden = !(
        provider === "ark" && /^sk-(?:proj|svcacct)-/.test(field.value)
      );
      out.textContent = error;
    };
    field.onpaste = (e) => {
      const pasted = e.clipboardData?.getData("text");
      if (pasted && /[\s\\'"`]/.test(pasted)) {
        e.preventDefault();
        field.value = "";
        const message = keyInputError(provider, pasted);
        field.setCustomValidity(message);
        out.textContent = message;
        switcher.parentElement.hidden = true;
      }
    };
    switcher.onclick = () => {
      const entered = field.value;
      provider = "openai";
      paint();
      const next = node.querySelector("[name=key]");
      next.value = entered;
      next.dispatchEvent(new Event("input"));
      next.focus();
    };
    const busy = (b) =>
      f
        .querySelectorAll("input,button,select")
        .forEach((x) => (x.disabled = b));
    async function save() {
      const data = {
        provider,
        model: f.elements.model.value.trim(),
        deepModel: f.elements.deep.value.trim(),
      };
      if (field.value) data.apiKey = field.value;
      cfg = await request("ai/settings", "PUT", data);
      field.value = "";
      updateProfile({ provider });
    }
    f.onsubmit = async (e) => {
      e.preventDefault();
      busy(true);
      try {
        await save();
        paint(
          cfg.providers[provider].configured
            ? "密钥与模型设置已保存。点击对应模型进行一次真实的纠错测试。"
            : "模型设置已保存。当前服务商尚未添加密钥。",
        );
      } catch (e) {
        out.textContent = aiErrorText(e);
      } finally {
        busy(false);
      }
    };
    async function test(depth) {
      if (!f.reportValidity()) return;
      if (!field.value && !cfg?.providers?.[provider]?.configured) {
        out.textContent = "请先在上方填写当前服务商的密钥。";
        return;
      }
      busy(true);
      out.textContent =
        "正在测试" + (depth === "deep" ? "深度" : "日常") + "模型…";
      let note;
      try {
        if (
          field.value ||
          cfg?.provider !== provider ||
          f.elements.model.value.trim() !== stored?.model ||
          f.elements.deep.value.trim() !== stored?.deepModel
        )
          await save();
        const r = await request("ai/test", "POST", { provider, depth });
        note = "纠错测试成功 · " + r.model + "。 " + r.text;
      } catch (e) {
        note = aiErrorText(e);
      } finally {
        busy(false);
      }
      if (!field.value) paint(note);
      else out.textContent = note;
    }
    f.querySelector("[data-action=test]").onclick = () => test("fast");
    f.querySelector("[data-action=test-deep]").onclick = () => test("deep");
    const probe = f.querySelector("[data-action=network]");
    if (probe)
      probe.onclick = async () => {
        busy(true);
        out.textContent = "正在检查" + host + "到 OpenAI 纠错接口的连接…";
        try {
          const r = await request("ai/network", "POST");
          if (r.reachable !== true || !Number.isInteger(r.providerStatus)) {
            out.textContent = "本次检查未能确认网络可达，请稍后再试。";
            return;
          }
          const route = Number.isInteger(r.attempts)
            ? "OpenAI POST /v1/responses"
            : "OpenAI API";
          const retry = r.attempts === 2 ? "，第二次尝试接通" : "";
          const auth =
            r.providerStatus === 401 ? "这是匿名请求的预期响应。" : "";
          out.textContent =
            host +
            "网络可达 · " +
            route +
            " 返回 HTTP " +
            r.providerStatus +
            retry +
            "。" +
            auth +
            "要验证密钥和模型，请选择「测试日常模型」或「测试深度模型」查看实际纠错。";
        } catch (error) {
          out.textContent = aiErrorText(error);
        } finally {
          busy(false);
        }
      };
    const clear = f.querySelector("[data-action=clear]");
    if (clear)
      clear.onclick = async () => {
        busy(true);
        try {
          cfg = await request("ai/settings", "PUT", {
            provider,
            clearKey: true,
          });
          paint("此账号的该服务商密钥已删除。");
        } catch (e) {
          out.textContent = aiErrorText(e);
        } finally {
          busy(false);
        }
      };
  }
  node.textContent = "正在读取当前账号的配置…";
  request("ai/settings")
    .then((r) => {
      cfg = r;
      provider = requested || r.provider || provider;
      paint();
    })
    .catch((e) => paint(aiErrorText(e)));
  return () => {
    active = false;
  };
}
