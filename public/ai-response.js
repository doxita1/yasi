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
  provider_unreachable:
    "学习室服务端未连接到服务商。请检查网络可达性，本机预览和云端使用各自的网络。",
  probe_gateway:
    "收到网关或非 API 响应，尚未确认学习室服务端能访问 OpenAI API。",
  upstream_timeout: "请求模型超时。可稍后重试或选择响应更快的模型。",
  provider_rejected: "服务商未接受请求，请检查所选模型、项目权限及账单。",
  invalid_provider_response: "服务商返回的内容无法解析，请稍后重试。",
  empty_provider_response:
    "服务商返回了响应，但没有可用的正文。请重试或更换模型。",
  unexpected_test_response:
    "已收到模型回复，但示例句缺少预期的主谓一致修正或中文解释。请重试该档模型。",
  service_unavailable: "本站服务端暂不可用，请稍后重试。",
};

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
    (Object.hasOwn(messages, body?.error) ? messages[body.error] : fallback);
  throw Object.assign(new Error(text), { aiMessage: text });
}
