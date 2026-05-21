# AI破局大会 · 道法术器拆解档案

<!-- SIUSER-SEO-INTRO:START -->

## 项目介绍 / Project Introduction

**中文介绍**：破局案例拆解站，把商业案例、增长路径、产品策略和内容打法整理成可阅读的网页。

**English**: A breakdown site for business cases, growth paths, product strategy, and content playbooks in a readable web format.

**SEO 关键词 / SEO Keywords**: business breakdown, growth strategy, case study, content strategy, 商业拆解

<!-- SIUSER-SEO-INTRO:END -->


独立静态站：把 `破局拆解` 文件夹中的 24 份 Markdown 会议纪要，整理成统一的“术语道 / 道法术器”讲解网页。

每份稿件固定包含：

- 嘉宾身份
- 真实结果
- 关键数据
- 核心故事
- 方法框架
- 工具清单
- 金句
- 钱 / 关系 / 技能 / 影响力的短期与长期评分
- 道、法、术、器
- 今天 / 本周 / 本月行动清单
- 小伟视角

## 开发

```sh
npm run build
npm run validate
```

数据在 `data/cases.json` 和 `data/site-meta.json`，样式与交互在 `assets/`，模板在 `src/index.template.html`。构建脚本会生成根目录 `index.html`，用于 GitHub Pages 部署。

## 部署

部署方式：GitHub Pages，来源为 `main` 分支根目录。

<!-- SIUSER-CONTACT:START -->

## 联系我 / Contact

想交流 AI 工具、内容自动化、SEO、私域增长或项目合作，可以扫码加我微信。

For collaboration on AI tools, content automation, SEO, private-domain growth, or product experiments, scan the WeChat QR code below.

<img src="https://raw.githubusercontent.com/siuserxiaowei/siuserxiaowei/main/assets/contact/wechat-qrcode.jpg" width="180" alt="WeChat QR code / 微信二维码" />

**关键词 / Keywords**: business breakdown, growth strategy, case study, content strategy, AI tools, AI automation, GitHub Pages, SEO

<!-- SIUSER-CONTACT:END -->
