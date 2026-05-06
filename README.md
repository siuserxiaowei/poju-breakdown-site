# AI破局大会 · 道法术器拆解档案

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
- 业务转译

## 开发

```sh
npm run build
npm run validate
```

数据在 `data/cases.json` 和 `data/site-meta.json`，样式与交互在 `assets/`，模板在 `src/index.template.html`。构建脚本会生成根目录 `index.html`，用于 GitHub Pages 部署。

## 部署

部署方式：GitHub Pages，来源为 `main` 分支根目录。
