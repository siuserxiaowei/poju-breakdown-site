# AI破局大会 · 道法术器拆解档案

<!-- SIUSER-REPO-GUIDE:START -->
## Repository Guide

### What This Repository Does

破局案例拆解站：沉淀商业案例、增长策略和复盘分析。

English summary: Case breakdown site for business examples, growth strategy, and review analysis.

### Online Entry Points

- GitHub repository: https://github.com/siuserxiaowei/poju-breakdown-site
- Live / GitHub Pages: https://siuserxiaowei.github.io/poju-breakdown-site/
- Default branch: `main`
- Primary language: `HTML`

### How To Read / Learn This Repository

1. 先读本 README，确认项目目标、在线入口和本地运行方式。
2. 打开上方 Live / GitHub Pages 链接，先从最终效果理解项目。
3. 查看 `package.json` 的 scripts，确认开发、构建和预览命令。
4. 如果要修改内容，先小范围改动，再运行本 README 中的验证命令。

### Clone This Repository

```bash
git clone https://github.com/siuserxiaowei/poju-breakdown-site.git
cd poju-breakdown-site
```

### Run Or View Locally

```bash
npm install
npm run build
```

### Repository Map

| Path | Purpose |
| --- | --- |
| `README.md` | 项目入口说明，先读这里。 |
| `package.json` | Node/前端项目配置和常用脚本。 |
| `index.html` | 静态站首页或页面入口。 |
| `src/` | 主要源码目录。 |
| `docs/` | 文档或 GitHub Pages 输出目录。 |
| `data/` | 数据、索引或结构化内容。 |
| `assets/` | 图片、样式、字体或页面资源。 |
| `scripts/` | 构建、同步、生成或维护脚本。 |

### Maintenance Notes

- Keep this README in sync when the project purpose, live link, or run commands change.
- Prefer small, focused commits when changing code, data, or generated pages.
- Run the relevant build or validation command before publishing changes.
- If this is a generated/static archive, update the source data first, then regenerate the public files.

### Privacy And Safety

- Do not commit API keys, tokens, passwords, cookies, private URLs, or internal account data.
- Keep private source material out of public GitHub Pages output unless it has been explicitly cleared for publication.
- When in doubt, run a quick secret scan such as `rg -n "token|secret|password|access_key|authorization"` before pushing.
<!-- SIUSER-REPO-GUIDE:END -->

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
