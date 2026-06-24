# AI破局大会 · 道法术器拆解档案

<!-- SIUSER-REPO-GUIDE:START -->
## 项目介绍 / Project Introduction

### 中文
破局案例拆解站：沉淀商业案例、增长策略和复盘分析。

### English
Case breakdown site for business examples, growth strategy, and review analysis.

## 使用方式 / Usage

### 中文
1. 先克隆仓库并安装 Node 依赖。
2. 根据 `package.json` 中的 scripts 启动开发、构建或测试命令。
3. 如果有在线入口，先对照线上页面理解最终效果，再回到源码修改。

### English
1. Clone the repository and install the Node dependencies.
2. Use the scripts in `package.json` for development, build, or tests.
3. If a live link exists, review the deployed page first, then make source changes.

## 入口与元信息 / Entry Points & Metadata

- GitHub 仓库 / Repository: https://github.com/siuserxiaowei/poju-breakdown-site
- Live / 在线入口：https://siuserxiaowei.github.io/poju-breakdown-site/
- 默认分支 / Default branch: `main`
- 主要语言 / Primary language: `HTML`
- 可见性 / Visibility: `public`
- 仓库类型 / Repository type: `source`

## 本地运行 / Local Run

```bash
git clone https://github.com/siuserxiaowei/poju-breakdown-site.git
cd poju-breakdown-site
npm install
npm run build
```

## 仓库结构 / Repository Map

| 路径 / Path | 中文说明 | English |
| --- | --- | --- |
| `README.md` | 项目入口说明，先读这里。 | Main project entry point and orientation. |
| `package.json` | Node/前端项目配置、依赖和脚本。 | Node/frontend dependencies and scripts. |
| `index.html` | 静态站首页或页面入口。 | Static-site homepage or entry page. |
| `src` | 主要源码目录。 | Main source-code directory. |
| `assets` | 图片、样式、数据等资源。 | Images, styles, data, and other assets. |
| `docs` | 文档或 GitHub Pages 输出目录。 | Documentation or GitHub Pages output. |
| `data` | 数据、索引或结构化内容。 | Data, indexes, or structured content. |
| `scripts` | 构建、同步、生成或维护脚本。 | Build, sync, generation, or maintenance scripts. |
| `.nojekyll` | 项目文件或目录。 | Project file or directory. |

## 维护备注 / Maintenance Notes

- 中文：当项目目标、在线入口、运行命令或目录结构变化时，同步更新本说明。
- English: Keep this guide updated when the project purpose, live link, run commands, or structure changes.
- 中文：修改代码、数据或生成页面后，优先运行相关构建、测试或校验命令。
- English: After changing code, data, or generated pages, run the relevant build, test, or validation command.

## 安全与隐私 / Safety & Privacy

- 中文：不要提交 API key、token、密码、cookie、私有链接或内部账号资料。
- English: Do not commit API keys, tokens, passwords, cookies, private URLs, or internal account data.
- 中文：公开 GitHub Pages 前，确认资料已脱敏并允许公开。
- English: Before publishing GitHub Pages output, confirm the material is redacted and cleared for public release.
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
