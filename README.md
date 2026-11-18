# 拾阶英语 · IELTS Studio

面向六级基础、以雅思 7 分为目标的 26 周个人英语训练室。每周 6 个学习日，按整篇阅读、连续听力、写作和录音组织练习。学习日可提前进入，已作答题目、草稿和录音随账号同步。

## 使用

1. 用受邀的 ChatGPT 账号打开已发布的 Sites 网址。进入「雅思备考工作台」，点「开始限时阅读」即可从整篇诊断的第一题开始。
2. 「学习下一天」和「全部课程」可以提前学。中途退出后，通过「继续上次的练习」或「未完成的练习」返回。
3. 在「学习设置」选择 A/G 方向、总分与单项目标。基础课程和配套合成音频随站发布。两轮独立的原创模拟在「模拟考试」。
4. AI 按账号选配。日常练习推荐豆包 Seed 2.1 Lite 或 GPT-6 Luna，深度作文反馈可选择豆包 Seed 2.1 Pro 或 GPT-6.2 Sol。从「学习设置」选对应服务商，填入本人的密钥。OpenAI 设置入口是 `#/settings/openai`。可分别点击「测试日常模型」与「测试深度模型」，查看对同一英文示例的实际纠错。本机预览和云端按各自账号独立保存密钥。费用归该账号配置的 API 服务商。
5. 「学习报告」区分实际学习日期、累计练习分钟和唯一完成任务数。复习本按实际作答日期安排重练。

每日建议默认 30 分钟，可从工作台直接调整或在设置中输入 5–180 分钟。每日复习提取少量到期词和错题，首次使用从情境词开始。时长用于安排当日练习与复习，完整专项或模考仍可随时进入。

## 专项与资料精练

- 「雅思核心词汇」按 8 个主题精选 96 个独立词头，并与 60 个进阶搭配、936 个课程条目关联，去重后共 1,089 个词和表达。`#/words/start` 直接进入训练，依次练语境辨义、闭卷提取与听音拼写。`#/words/errors` 汇集单词错误，可重练对应维度或查看订正记录。
- 阅读训练室收录 6 篇 Academic 和 2 组 General Training，共 104 道原创题。20 分钟限时，支持划线、笔记、标记、证据定位和历次重做。
- 听力精练含 4 组连续语音和 40 道题。词汇听写覆盖 936 个课程条目与 60 个进阶搭配，支持只重练错词和重听词。
- 写作提供图表、地图、书信和议论文，支持独立两稿。口语按 26 周准备 Part 1、限时 Part 2 和逐次揭示的 Part 3 追问。
- 在「资料精练」里可做基于已有材料选点、重新编写的 6 组短训。每组包含一段情境、4 道客观题和 1 次表达迁移，另附按来源分组的适用性说明和站内练习入口。地图写作的 2014、2025 两张平面图和 2028 规划专门用于区分已发生与拟议中的变化。
- 延伸教材和商业书籍的原文、私人作文以及旧预测卷由资料持有人在本地参阅。所有必做练习及音频随站提供。官方格式、评分与训练产品参照 [IELTS](https://ielts.org/take-a-test/preparation-resources/sample-test-questions)、[IELTS Ready](https://takeielts.britishcouncil.org/prepare/ielts-ready) 和 [IDP 熟悉考试](https://ielts.idp.com/about/ielts-familiarisation-tests)。

## 本地运行

Windows 可双击「打开学习室.cmd」启动本机版本。需要 Node.js 22.13 以上。运行 `npm ci`，然后运行 `npm run dev`，打开终端输出的回环地址。预览使用 SQLite 和本地录音目录，数据与开发用加密密钥位于已忽略的 `.local`。本地预览身份仅在本机回环服务生效。

本机的 AI 请求可使用 Node.js 22.21 起支持的环境代理。启动时优先使用你显式设置的 `HTTPS_PROXY`、`HTTP_PROXY` 和 `NO_PROXY`。Windows 上也会识别当前用户已启用的手动 HTTP/HTTPS 代理。本机练习和存档始终直连回环地址。改变代理后重启本机启动器即可生效。运行 `npm run dev -- --check-openai-network` 可检查到 OpenAI 的网络连接。此检查不发送密钥，正常结果为 HTTP 401；个人密钥和模型另在设置页用「测试纠错」验证。

运行 `npm test` 验证数据隔离、断点、冲突稿及 AI 配置。运行 `npm run test:browser` 进行双浏览器上下文的桌面与移动视口验收。浏览器测试需要本地 Chromium 内核浏览器，可用 `BROWSER_PATH` 指定可执行程序；测试启动独立的回环服务和临时数据库。

## 构建与云端

运行 `npm run build` 生成 Sites Worker、浏览器资源和 D1 迁移。生产从 Sites 网关取得站内稳定账号身份，D1 绑定名为 `DB`，私有 R2 绑定名为 `BUCKET`。后端将录音的对象键关联到当前用户。访问范围在 Sites 的站点访问管理中维护。只有站点所有者指定的受邀账号可以使用云端学习室。

服务端密钥 `AI_VAULT_KEY` 是安全随机生成的 32 字节 Base64 值，用于加密用户提供的模型密钥。通过托管平台的密钥设置配置。发布和后续更新须保留同一把加密密钥。平台网关签发的身份头只适用于该受控托管环境；本地预览自行模拟身份。

## 教材与评估

站内案例、题目、答案和练习由本项目编写。合成音频使用站内原创英文文本。课程库的延伸阅读列出可用性核验和适用场景。雅思样题用于了解真实题型与评分标准，本站练习反馈供自学参考。[IELTS 官方样题](https://ielts.org/take-a-test/preparation-resources/sample-test-questions) · [官方评分](https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail) · [British Council 职场课程](https://learnenglish.britishcouncil.org/free-resources/business/business/magazine/flexible-working) · [British Council 语法](https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/present-perfect)

首页伦敦插画由 ImageGen 根据本项目设计生成，使用淡黄色纸纹、深绿色套色和钟楼河景。
