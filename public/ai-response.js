const messages = {
  invalid_model: "请使用该服务商控制台给出的完整模型 ID。",
  invalid_api_key:
    "请从服务商控制台重新复制一整行密钥，去掉空格、换行、引号或反斜线。",
  provider_key_mismatch:
    "这是 OpenAI 项目或服务账号密钥。请改选 OpenAI 官方 GPT，再保存并测试。",
  sign_in_required: "请先使用受邀账号登录学习室，再打开 AI 设置。",
  account_changed:
    "当前登录账号已改变。请刷新页面，在正确账号下重新打开 AI 设置。",
  provider_not_configured:
    "当前账号尚未为这个服务商保存密钥。请前往学习设置添加密钥。",
  vault_unavailable: "本站密钥存储暂不可用，请稍后重试或联系站点所有者。",
  credential_unavailable:
    "本站无法打开已保存的密钥。请重新保存本人服务商密钥。",
  upstream_auth:
    "服务商拒绝了该密钥。请在相应项目内检查密钥是否有效、是否已撤销，然后重新保存。",
  upstream_permission:
    "服务商拒绝当前项目执行此请求。请检查该密钥的 Responses 写入权限和项目的模型权限。",
  upstream_region:
    "服务商不支持本次请求所在的服务地区，请核对服务商的地区可用性。",
  upstream_quota:
    "API 项目额度不足或账单受限。请到服务商的 API 账单页检查余额、付款状态和预算。",
  upstream_limit:
    "服务商返回 429 频率或用量限制。请稍后重试，并检查项目的速率限制及用量。",
  upstream_model:
    "该模型 ID 不存在或当前项目未获访问权。请填写项目可用的模型 ID 后测试该档模型。",
  upstream_request: "服务商拒绝了请求参数。请确认所选模型支持 Responses 接口。",
  upstream_service: "服务商暂时无法处理请求，请稍后重试。",
  provider_unreachable: "学习室服务端与服务商的连接中断。",
  upstream_redirect: "服务商接口返回了跳转，学习室已停止请求。",
  probe_gateway:
    "收到网关或非 API 响应，尚未确认学习室服务端能访问 OpenAI API。",
  upstream_timeout: "等待服务商响应超时。可稍后重试。",
  provider_rejected: "服务商未接受请求，请检查所选模型、项目权限及账单。",
  invalid_provider_response: "服务商返回的内容无法解析，请稍后重试。",
  empty_provider_response:
    "服务商返回了响应，但没有可用的正文。请重试或更换模型。",
  unexpected_test_response:
    "已收到模型回复，但示例句缺少预期的主谓一致修正或中文解释。请重试该档模型。",
  service_unavailable: "本站服务端暂不可用，请稍后重试。",
};

export function isLocalPreview(hostname = globalThis.location?.hostname) {
  return ["localhost", "127.0.0.1", "::1", "[::1]"].includes(hostname);
}

const stages = {
  response_headers: "等待响应头",
  response_body: "读取响应正文",
};

function connectionMessage(body) {
  if (!body) return "";
  const local = isLocalPreview();
  const host = local ? "本机预览" : "云端学习室";
  if (body.stage === "request_setup")
    return (
      host +
      "在准备请求时出错，尚未向服务商发送。" +
      (local
        ? "请检查本机启动器输出和 Node.js 版本。"
        : "请站点所有者检查云端服务的运行日志和运行时版本。")
    );
  const networkAdvice = local
    ? "请检查这台电脑的网络和代理设置，代理变更后重启本机学习室。"
    : "可稍后再试。若持续出现，请站点所有者检查云端服务的出站连接。";
  const reasons = {
    connection_reset: "与服务商的连接被重置。" + networkAdvice,
    dns: "域名解析失败。" + networkAdvice,
    tls: "无法验证或建立加密连接。" + networkAdvice,
    timeout: "等待服务商响应超时。可稍后再试。",
    network: "网络传输失败。" + networkAdvice,
    redirect:
      messages.upstream_redirect +
      (local
        ? "请检查这台电脑的代理是否把 API 请求转向登录页或其他地址。"
        : "请站点所有者检查云端网关是否把 API 请求转向其他地址。"),
  };
  const stage = Object.hasOwn(stages, body.stage) ? stages[body.stage] : "";
  const reason = Object.hasOwn(reasons, body.reason)
    ? reasons[body.reason]
    : "";
  const legacyNetwork = body.error === "provider_unreachable";
  if (
    !reason &&
    !legacyNetwork &&
    !(stage && Object.hasOwn(messages, body.error))
  )
    return "";
  const hint =
    reason || messages[body.error] + (legacyNetwork ? networkAdvice : "");
  return host + (stage ? " · " + stage : "") + "。" + hint;
}

export function aiErrorText(error) {
  return error?.aiMessage || "未能连接学习室服务端，请检查当前网络和登录状态。";
}

export function keyInputError(provider, key) {
  if (!key) return "";
  if (!/^[!-~]{5,4096}$/.test(key) || /[\\'"`]/.test(key))
    return messages.invalid_api_key;
  if (provider === "ark" && /^sk-(?:proj|svcacct)-/.test(key))
    return messages.provider_key_mismatch;
  return "";
}

export async function aiResponse(response) {
  const body = await response.json().catch(() => null);
  if (response.ok && body) return body;
  const label =
    body?.provider === "openai"
      ? "OpenAI"
      : body?.provider === "ark"
        ? "火山方舟"
        : "";
  const context = [
    label,
    body?.model,
    Number.isInteger(body?.providerStatus) ? "HTTP " + body.providerStatus : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const fallback =
    response.status === 401
      ? messages.sign_in_required
      : response.status === 403
        ? "学习室访问被拒绝，请核对登录账号和站点访问权限。"
        : "学习室请求失败（HTTP " +
          response.status +
          "），请检查网络或稍后再试。";
  const text =
    (context ? context + "。 " : "") +
    (connectionMessage(body) ||
      (Object.hasOwn(messages, body?.error) ? messages[body.error] : fallback));
  throw Object.assign(new Error(text), { aiMessage: text });
}
