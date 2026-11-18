import { execFileSync, fork } from "node:child_process";
import { once } from "node:events";
import path from "node:path";

function registryValue(name) {
  try {
    const reg = path.join(
      process.env.SystemRoot || "C:\\Windows",
      "System32",
      "reg.exe",
    );
    const key =
      "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings";
    const result = execFileSync(reg, ["query", key, "/v", name], {
      encoding: "utf8",
      windowsHide: true,
      timeout: 2000,
      stdio: ["ignore", "pipe", "ignore"],
    });
    return (
      result.match(
        new RegExp("^\\s*" + name + "\\s+REG_\\w+\\s+(.+?)\\s*$", "im"),
      )?.[1] || ""
    );
  } catch {
    return "";
  }
}

// The manual Windows proxy may be shared ("host:port") or per protocol.
// PAC scripts and other proxy protocols are not executed by the local server.
export function windowsProxyValues(server) {
  const values = {};
  for (const part of server
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)) {
    const entry = /^(http|https)=(.+)$/i.exec(part);
    if (!entry && part.includes("=")) continue;
    let value = entry ? entry[2].trim() : part;
    if (!value.includes("://")) value = "http://" + value;
    try {
      const url = new URL(value);
      if (
        !["http:", "https:"].includes(url.protocol) ||
        url.pathname !== "/" ||
        url.search ||
        url.hash
      )
        continue;
      if (!entry || entry[1].toLowerCase() === "http")
        values.HTTP_PROXY = value;
      if (!entry || entry[1].toLowerCase() === "https")
        values.HTTPS_PROXY = value;
    } catch {}
  }
  return values;
}

export function previewProxyEnv(
  env,
  platform = process.platform,
  read = registryValue,
) {
  if (env.NODE_USE_ENV_PROXY === "0") return null;
  const explicit =
    env.https_proxy !== undefined ||
    env.HTTPS_PROXY !== undefined ||
    env.http_proxy !== undefined ||
    env.HTTP_PROXY !== undefined;
  let httpProxy = env.http_proxy ?? env.HTTP_PROXY;
  let httpsProxy = env.https_proxy ?? env.HTTPS_PROXY;
  let bypass = env.no_proxy ?? env.NO_PROXY;
  if (!explicit && platform === "win32" && Number(read("ProxyEnable")) === 1) {
    const system = windowsProxyValues(read("ProxyServer"));
    // This preview only connects to HTTPS providers. A Windows HTTP-only
    // proxy does not apply to those providers.
    if (!system.HTTPS_PROXY) return null;
    httpProxy = system.HTTP_PROXY;
    httpsProxy = system.HTTPS_PROXY;
    bypass ??= read("ProxyOverride")
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s && s !== "<local>")
      .join(",");
  }
  if (!httpsProxy && !httpProxy) return null;
  const exceptions = new Set([
    ...(bypass || "").split(/[\s,]+/).filter(Boolean),
    "127.0.0.1",
    "localhost",
    "::1",
    "[::1]",
  ]);
  const next = { ...env };
  for (const name of [
    "http_proxy",
    "https_proxy",
    "no_proxy",
    "HTTP_PROXY",
    "HTTPS_PROXY",
    "NO_PROXY",
  ])
    delete next[name];
  if (httpProxy) next.HTTP_PROXY = httpProxy;
  if (httpsProxy) next.HTTPS_PROXY = httpsProxy;
  next.NO_PROXY = [...exceptions].join(",");
  return next;
}

// Node 22.21 reads proxy settings during startup. Re-execute only the
// preview, with a private IPC lifetime tied to the launching process.
export async function startProxyChild() {
  if (process.send && process.argv[2] === "--preview-network-ready") {
    process.once("disconnect", () => process.exit(0));
    return null;
  }
  const env = previewProxyEnv(process.env);
  if (!env) return null;
  if (!process.allowedNodeEnvironmentFlags.has("--use-env-proxy")) {
    console.warn(
      "本机已配置代理。Node.js 22.21 或支持 --use-env-proxy 的更新版本可让 AI 请求使用它。",
    );
    return null;
  }
  const child = fork(
    process.argv[1],
    ["--preview-network-ready", ...process.argv.slice(2)],
    {
      env,
      execArgv: [...new Set([...process.execArgv, "--use-env-proxy"])],
      windowsHide: true,
      stdio: ["inherit", "inherit", "inherit", "ipc"],
    },
  );
  const stop = () => child.kill();
  process.once("SIGTERM", stop);
  process.once("SIGINT", stop);
  try {
    const [code] = await once(child, "exit");
    return code ?? 1;
  } finally {
    process.removeListener("SIGTERM", stop);
    process.removeListener("SIGINT", stop);
  }
}
