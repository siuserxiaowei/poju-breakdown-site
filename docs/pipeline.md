# Markdown 生成流水线

这个站点的长期目标是：用户丢进一批 Markdown 会议纪要后，自动产出结构化 `data/*.json`，再由 `scripts/build-site.mjs` 生成可直接托管到 GitHub Pages 的根目录 `index.html`。

## 当前构建入口

```bash
npm run validate
npm run build
```

`npm run build` 会读取以下文件，并把 CSS、数据和 JS 全部内联进 `index.html`，因此部署时不依赖服务端：

- `data/site-meta.json`：站点级元信息和页面区块配置。
- `data/cases.json`：案例列表 JSON，可以是数组，也可以是 `{ "cases": [...] }`。
- `assets/site.css`：页面样式。
- `assets/site.js`：读取 `window.SITE_DATA` 后渲染筛选、卡片和页面区块。
- `src/index.template.html`：GitHub Pages 静态模板。

如果 `data/site-meta.json` 或 `data/cases.json` 尚未生成，构建脚本会列出缺失输入并退出，提示先执行 Markdown 到 JSON 的抽取步骤。`npm run validate` 不会写 `index.html`；当输入未合并时，它只校验模板占位符并列出缺失文件，等输入齐全后会做一次内存渲染检查。

## 建议的数据契约

`data/site-meta.json` 用来承载站点级内容，至少建议包含：

```json
{
  "title": "AI破局大会 · 道法术器拆解档案",
  "description": "24份AI破局会议纪要，按固定套路重新拆解。",
  "lang": "zh-CN",
  "hero": {
    "kicker": "Dao · Fa · Shu · Qi",
    "title": "AI破局大会<br><span>道法术器拆解档案</span>",
    "copy": "页面导语"
  },
  "pipeline": [],
  "connections": [],
  "globalActions": [],
  "stats": [],
  "wechat": {
    "label": "siuserxiaowei"
  }
}
```

`data/cases.json` 负责每篇 Markdown 的结构化结果。建议每条案例保留这些字段：

```json
{
  "theme": "AI编程出海",
  "title": "案例标题",
  "source": "原始 Markdown 文件名.md",
  "identity": "嘉宾身份",
  "result": "真实结果",
  "data": "关键数据",
  "story": "核心故事",
  "framework": "方法框架",
  "tools": "工具清单",
  "quote": "金句",
  "score": {
    "money": [4, 5],
    "relation": [3, 4],
    "skill": [5, 5],
    "influence": [4, 5]
  },
  "pillars": {
    "dao": "道：底层认知",
    "fa": "法：迁移模型",
    "shu": "术：具体打法",
    "qi": "器：工具系统"
  },
  "action": "今天/本周可以执行的动作",
  "xiaoweiView": "小伟视角"
}
```

## Markdown 到 JSON

后续自动化可以按三段走：

1. 收集 Markdown：把原始纪要放入约定目录，例如 `content/raw/*.md`，文件名保留为 `source`。
2. 抽取字段：用 LLM 或脚本按固定提示词抽出七字段、评分、道法术器、行动清单和小伟视角，写入临时 JSON。
3. 合并校验：统一去重、排序、补默认值，输出 `data/cases.json`；同时根据案例数量、主题集合和大会主线生成或更新 `data/site-meta.json`。

建议给抽取步骤加 JSON Schema 校验，避免后续页面脚本处理空字段、错误评分或缺少 `pillars`。对十几份 Markdown 的批量输入，可以逐篇生成临时文件，再在最后合并，这样某一篇失败时不会污染已经抽取成功的数据。

## CI 与发布

GitHub Actions 可以使用同一套命令：

```bash
npm run validate
npm run build
```

当内容 worker 产出 `data/*.json`、前端 worker 产出 `assets/site.css` 和 `assets/site.js` 后，构建 worker 只需要运行 `npm run build`。生成的 `index.html` 位于仓库根目录，配合现有 `.nojekyll` 可直接发布到 GitHub Pages。

下一步可以补一个 `scripts/extract-cases.mjs`：读取 Markdown 目录、调用抽取器、写入 `data/cases.json`，并在本地和 CI 中复用同一份数据契约。
