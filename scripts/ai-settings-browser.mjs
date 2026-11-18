import assert from "node:assert/strict";

// The main smoke suite supplies its isolated local preview and browser context.
export async function verifyAiSettings(page, base) {
  assert.ok(
    ["127.0.0.1", "localhost", "[::1]"].includes(new URL(base).hostname),
  );
  const settings = {
    provider: "ark",
    providers: {
      ark: {
        configured: false,
        model: "ark-fixture",
        deepModel: "ark-deep-fixture",
      },
      openai: {
        configured: false,
        model: "openai-fixture",
        deepModel: "openai-deep-fixture",
      },
    },
  };
  const calls = [];
  const pattern = "**/api/ai/**";
  const output = page.locator("#aiForm output");
  await page.route(pattern, async (route) => {
    const req = route.request(),
      path = new URL(req.url()).pathname;
    let status = 200,
      body = settings;
    if (path === "/api/ai/network") {
      assert.equal(req.postData(), null);
      body = { reachable: true, providerStatus: 401 };
    } else if (req.method() !== "GET") {
      const data = req.postDataJSON(),
        provider = data.provider;
      calls.push({ path, provider, depth: data.depth });
      if (path === "/api/ai/settings") {
        settings.provider = provider;
        settings.providers[provider] = {
          model: data.model,
          deepModel: data.deepModel,
          configured: true,
        };
      } else if (path === "/api/ai/test") {
        if (data.depth === "deep") {
          status = 502;
          body = {
            error: "upstream_quota",
            provider,
            providerStatus: 429,
            model: settings.providers[provider].deepModel,
          };
        } else
          body = {
            model: settings.providers[provider].model,
            text: "She goes to work on Monday. 第三人称单数。",
          };
      } else throw Error("unexpected AI request path");
    }
    await route.fulfill({ status, json: body });
  });
  try {
    await page.goto(base + "/#/settings/openai");
    await page.waitForFunction(
      () =>
        document.querySelector("#aiForm [name=provider]")?.value === "openai",
    );
    assert.equal(calls.length, 0);
    await page.locator("[data-action=network]").click();
    await page.waitForFunction(() =>
      document
        .querySelector("#aiForm output")
        ?.textContent.includes("网络可达"),
    );
    assert.match(await output.innerText(), /401/);
    await page.goto(base + "/#/settings");
    await page.waitForFunction(
      () => document.querySelector("#aiForm [name=provider]")?.value === "ark",
    );
    const field = page.locator("#aiForm [name=key]");
    await field.waitFor();
    assert.match(await page.locator("#aiForm").innerText(), /本机预览/);
    assert.equal(
      await page.locator("[data-action=switch-openai]").isVisible(),
      false,
    );
    await field.fill("sk-proj-fictional-browser-fixture");
    assert.match(await output.innerText(), /OpenAI/);
    await page.locator("[data-action=test]").click();
    assert.equal(calls.length, 0);
    await page.locator("[data-action=switch-openai]").click();
    assert.equal(await page.locator("[name=provider]").inputValue(), "openai");
    await page.locator("[name=model]").fill("chosen-test-model");
    await page.locator("[data-action=test]").click();
    await page.waitForFunction(() =>
      document
        .querySelector("#aiForm output")
        ?.textContent.includes("纠错测试成功"),
    );
    assert.match(await output.innerText(), /chosen-test-model/);
    assert.equal(await field.inputValue(), "");
    assert.deepEqual(
      calls.map((c) => c.provider),
      ["openai", "openai"],
    );
    await page.locator("[data-action=test-deep]").click();
    await page.waitForFunction(() =>
      document
        .querySelector("#aiForm output")
        ?.textContent.includes("额度不足"),
    );
    assert.match(await output.innerText(), /openai-deep-fixture/);
    assert.equal(calls.at(-1).depth, "deep");
    await field.fill("fictional-invalid-key\\");
    assert.match(await output.innerText(), /反斜线/);
  } finally {
    await page.unroute(pattern);
  }
}
