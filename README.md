# 拾阶英语 · IELTS Studio

面向六级基础的 26 周个人英语训练室。每周 6 个学习日，每天可以任选词汇、语法、雅思专项或职场交流。学习日可提前进入，已作答题目、草稿和录音随账号同步。

## 使用

1. 用受邀的 ChatGPT 账号打开已发布的 Sites 网址。进入「学习工作台」，点「开始今天的练习」即可答题。
2. 「学习下一天」和「全部课程」可以提前学。中途退出后，通过「继续上次的练习」或「未完成的练习」返回。
3. 在「学习设置」选择 A/G 方向、总分与单项目标。基础课程和配套合成音频随站发布。两轮独立的原创模拟在「模拟考试」。
4. AI 按账号选配。日常练习推荐豆包 Seed 2.1 Lite 或 GPT-6 Luna，深度作文反馈可选择豆包 Seed 2.1 Pro 或 GPT-6.2 Sol。填写本人服务商密钥后先保存，再点「测试纠错」。费用归该账号配置的 API 服务商。
5. 「学习报告」区分实际学习日期、累计练习分钟和唯一完成任务数。复习本按实际作答日期安排重练。

## 本地运行

需要 Node.js 22.13 以上。运行 `npm ci`，然后运行 `npm run dev`，打开终端输出的回环地址。预览使用 SQLite 和本地录音目录，数据与开发用加密密钥位于已忽略的 `.local`。本地预览身份仅在本机回环服务生效。

运行 `npm test` 验证数据隔离、断点、冲突稿及 AI 配置。运行 `npm run test:browser` 进行双浏览器上下文的桌面与移动视口验收。浏览器测试需要本地 Chromium 内核浏览器，可用 `BROWSER_PATH` 指定可执行程序；测试启动独立的回环服务和临时数据库。

## 构建与云端

运行 `npm run build` 生成 Sites Worker、浏览器资源和 D1 迁移。生产从 Sites 网关取得站内稳定账号身份，D1 绑定名为 `DB`，私有 R2 绑定名为 `BUCKET`。后端将录音的对象键关联到当前用户。访问范围在 Sites 的站点访问管理中维护。只有站点所有者指定的受邀账号可以使用云端学习室。

服务端密钥 `AI_VAULT_KEY` 是安全随机生成的 32 字节 Base64 值，用于加密用户提供的模型密钥。通过托管平台的密钥设置配置。发布和后续更新须保留同一把加密密钥。平台网关签发的身份头只适用于该受控托管环境；本地预览自行模拟身份。

## 教材与评估

站内案例、题目、答案和练习由本项目编写。合成音频使用站内原创英文文本。课程库的延伸阅读列出可用性核验和适用场景。雅思样题用于了解真实题型与评分标准，本站练习反馈供自学参考。[IELTS 官方样题](https://ielts.org/take-a-test/preparation-resources/sample-test-questions) · [官方评分](https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail) · [British Council 职场课程](https://learnenglish.britishcouncil.org/free-resources/business/business/magazine/flexible-working) · [British Council 语法](https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/present-perfect)

首页伦敦插画由 ImageGen 根据本项目设计生成，使用淡黄色纸纹、深绿色套色和钟楼河景。
