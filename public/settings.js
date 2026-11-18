import { getState, updateProfile } from "./sync.js";
import { accountFetch as fetch } from "./account-request.js";
import { esc, icon } from "./icons.js";
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
const msg = {
  invalid_model: "请输入有效的模型 ID。",
  invalid_api_key: "请检查 API 密钥格式。",
  sign_in_required: "请先用受邀账号登录。",
  provider_not_configured: "请先填写该服务商的 API 密钥并保存。",
  key_not_configured: "请先保存该服务商的 API 密钥。",
  vault_unavailable: "服务端密钥暂不可用，当前配置尚未保存。",
  upstream_auth: "服务商未接受此密钥，请检查配置。",
  upstream_limit: "服务商已限流或额度不足。",
};
async function request(path, method = "GET", data) {
  const response = await fetch("/api/" + path, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
  });
  const body = await response.json();
  if (!response.ok)
    throw Error(
      msg[body.error] ||
        "操作未完成（" + (body.error || response.status) + "）。",
    );
  return body;
}
export function mountSettings(container) {
  let active = true,
    cfg = null,
    provider = getState().profile.provider || "ark";
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
    node.innerHTML =
      '<form class="goalForm"><label>服务商<select name="provider">' +
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
      '"></label><div class="pageNote">测试和 AI 练习按服务商的输入、输出用量计费。ChatGPT 订阅与 API 单独计费。<br><a target="_blank" rel="noreferrer" href="' +
      v.guide +
      '">管理官方密钥 ↗</a>　<a target="_blank" rel="noreferrer" href="' +
      v.pricing +
      '">查看价格 ↗</a></div><div class="inlineBtns"><button class="btn green" type="submit">保存 AI 配置</button><button class="btn" type="button" data-action="test">测试纠错</button>' +
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
    const busy = (b) =>
      f
        .querySelectorAll("input,button,select")
        .forEach((x) => (x.disabled = b));
    f.onsubmit = async (e) => {
      e.preventDefault();
      const data = {
        provider,
        model: f.elements.model.value.trim(),
        deepModel: f.elements.deep.value.trim(),
      };
      if (f.elements.key.value.trim())
        data.apiKey = f.elements.key.value.trim();
      busy(true);
      try {
        cfg = await request("ai/settings", "PUT", data);
        updateProfile({ provider });
        paint("配置已保存。");
      } catch (e) {
        out.textContent = e.message;
      } finally {
        busy(false);
      }
    };
    f.querySelector("[data-action=test]").onclick = async () => {
      if (f.elements.key.value) {
        out.textContent = "请先保存新密钥，再测试纠错。";
        return;
      }
      busy(true);
      out.textContent = "正在向服务商发送示例句…";
      try {
        const r = await request("ai/test", "POST", { provider });
        out.textContent = r.text;
      } catch (e) {
        out.textContent = e.message;
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
          out.textContent = e.message;
        } finally {
          busy(false);
        }
      };
  }
  node.textContent = "正在读取当前账号的配置…";
  request("ai/settings")
    .then((r) => {
      cfg = r;
      provider = r.provider || provider;
      paint();
    })
    .catch((e) => paint(e.message));
  return () => {
    active = false;
  };
}
