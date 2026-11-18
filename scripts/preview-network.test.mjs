import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import test from "node:test";
import { previewProxyEnv, windowsProxyValues } from "./preview-network.mjs";

test("preview uses explicit proxy and bypass values first and keeps loopback local", () => {
  const system = (name) =>
    ({
      ProxyEnable: "0x1",
      ProxyServer:
        "http=proxy.test:8080;https=https://tls.test:8443;socks=other.test:1080",
      ProxyOverride: "*.internal.test;<local>",
    })[name];
  const a = previewProxyEnv({}, "win32", system);
  assert.equal(a.HTTPS_PROXY, "https://tls.test:8443");
  assert.equal(a.HTTP_PROXY, "http://proxy.test:8080");
  assert.match(a.NO_PROXY, /\*\.internal\.test/);
  assert.match(a.NO_PROXY, /localhost/);
  const b = previewProxyEnv(
    { https_proxy: "http://explicit.test", no_proxy: ".custom.test" },
    "win32",
    () => assert.fail("explicit settings should take priority"),
  );
  assert.equal(b.HTTPS_PROXY, "http://explicit.test");
  assert.equal(b.NO_PROXY, ".custom.test,127.0.0.1,localhost,::1,[::1]");
  assert.equal(
    previewProxyEnv({}, "win32", (name) =>
      name === "ProxyEnable" ? "0x0" : "ignored",
    ),
    null,
  );
  assert.equal(
    previewProxyEnv({ NODE_USE_ENV_PROXY: "0" }, "win32", system),
    null,
  );
  assert.equal(
    previewProxyEnv({}, "linux", () => assert.fail()),
    null,
  );
  assert.deepEqual(windowsProxyValues("socks=socks5://example.test"), {});
});

async function listen(server) {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  return server.address().port;
}

function start(args, env) {
  const inherited = { ...process.env };
  for (const name of Object.keys(inherited)) {
    if (/^(https?_proxy|no_proxy|node_use_env_proxy)$/i.test(name))
      delete inherited[name];
  }
  return spawn(process.execPath, ["scripts/preview.mjs", ...args], {
    env: { ...inherited, ...env },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
}

test(
  "preview network check routes only an unauthenticated official CONNECT to a simulated proxy",
  {
    timeout: 25000,
    skip: !process.allowedNodeEnvironmentFlags.has("--use-env-proxy"),
  },
  async (t) => {
    const proxy = http.createServer();
    const port = await listen(proxy),
      requests = [];
    t.after(() => proxy.close());
    proxy.on("connect", (req, socket) => {
      requests.push({ destination: req.url, auth: req.headers.authorization });
      socket.end(
        "HTTP/1.1 502 Bad Gateway\r\nContent-Length: 0\r\nConnection: close\r\n\r\n",
      );
    });
    const child = start(["--check-openai-network"], {
      HTTPS_PROXY: "http://127.0.0.1:" + port,
    });
    t.after(() => child.kill());
    const [code] = await once(child, "exit");
    assert.equal(code, 1);
    assert.deepEqual(requests, [
      { destination: "api.openai.com:443", auth: undefined },
    ]);
  },
);

test(
  "preview rejects a stale account header on a write and retains account isolation",
  { timeout: 20000 },
  async (t) => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "yasi-account-guard-"));
    const reserve = http.createServer(),
      port = await listen(reserve);
    await new Promise((resolve) => reserve.close(resolve));
    const child = start([], {
      PORT: String(port),
      YASI_PREVIEW_DATA: temp,
      NODE_USE_ENV_PROXY: "0",
    });
    const ended = once(child, "exit");
    t.after(async () => {
      child.kill();
      await ended;
      await rm(temp, { recursive: true, force: true });
    });
    const url = "http://127.0.0.1:" + port;
    let ready = false;
    for (let i = 0; i < 80; i++) {
      try {
        if ((await fetch(url + "/api/health")).ok) {
          ready = true;
          break;
        }
      } catch {}
      await delay(60);
    }
    assert.ok(ready);
    const denied = await fetch(url + "/api/progress/profile", {
      method: "PUT",
      headers: {
        cookie: "yasi-preview=b",
        "x-yasi-account": "preview-a",
        "oai-authenticated-user-id": "preview-a",
        "content-type": "application/json",
      },
      body: JSON.stringify({ value: { dailyMinutes: 30 } }),
    });
    assert.equal(denied.status, 409);
    assert.equal((await denied.json()).error, "account_changed");
    const accepted = await fetch(url + "/api/ai/settings", {
      headers: { cookie: "yasi-preview=b", "x-yasi-account": "preview-b" },
    });
    assert.equal(accepted.status, 200);
  },
);
