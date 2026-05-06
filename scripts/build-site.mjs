#!/usr/bin/env node

import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const paths = {
  template: path.join(rootDir, "src/index.template.html"),
  siteMeta: path.join(rootDir, "data/site-meta.json"),
  cases: path.join(rootDir, "data/cases.json"),
  css: path.join(rootDir, "assets/site.css"),
  js: path.join(rootDir, "assets/site.js"),
  output: path.join(rootDir, "index.html"),
};

const placeholderNames = [
  "__LANG__",
  "__SITE_TITLE__",
  "__SITE_DESCRIPTION__",
  "__OG_TITLE__",
  "__OG_DESCRIPTION__",
  "__SITE_DATA__",
  "__CSS__",
  "__JS__",
  "__BUILD_TIME__",
  "__WECHAT_VALUE__",
  "__WECHAT_LEAD_COPY__",
];

const requiredPlaceholders = ["__SITE_TITLE__", "__SITE_DATA__", "__CSS__", "__JS__", "__WECHAT_VALUE__"];

const buildInputs = [
  ["data/site-meta.json", paths.siteMeta, "站点元信息 JSON"],
  ["data/cases.json", paths.cases, "案例列表 JSON"],
  ["assets/site.css", paths.css, "页面样式"],
  ["assets/site.js", paths.js, "页面交互脚本"],
];

const args = new Set(process.argv.slice(2));

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

async function main() {
  if (args.has("--validate")) {
    await validateOnly();
    return;
  }

  const html = await buildHtml();
  await writeFile(paths.output, html, "utf8");
  console.log(`Built index.html from data JSON, CSS, and JS (${byteLength(html)} bytes).`);
}

async function validateOnly() {
  const template = await readRequiredFile("src/index.template.html", paths.template);
  validateTemplatePlaceholders(template);

  const missing = await findMissingBuildInputs();
  if (missing.length) {
    console.log("[validate] Template placeholders are present.");
    console.log("[validate] Build inputs are not all present yet; skipped render check.");
    console.log(formatMissingInputs(missing));
    return;
  }

  const html = await buildHtml();
  validateRenderedHtml(html);
  console.log(`[validate] Render check passed (${byteLength(html)} bytes generated in memory).`);
}

async function buildHtml() {
  const missing = await findMissingBuildInputs();
  if (missing.length) {
    throw new Error([
      "Cannot build site: missing required input files.",
      formatMissingInputs(missing),
      "Run the Markdown-to-JSON extraction step first, then retry `npm run build`.",
    ].join("\n"));
  }

  const [template, meta, casesRaw, css, js] = await Promise.all([
    readRequiredFile("src/index.template.html", paths.template),
    readJsonFile("data/site-meta.json", paths.siteMeta),
    readJsonFile("data/cases.json", paths.cases),
    readRequiredFile("assets/site.css", paths.css),
    readRequiredFile("assets/site.js", paths.js),
  ]);

  validateTemplatePlaceholders(template);

  const cases = normalizeCases(casesRaw);
  const buildStamp = pickString(process.env.BUILD_TIME, meta.buildTime, meta.updatedAt, "static");
  const siteData = {
    meta,
    cases,
    generatedAt: buildStamp,
  };

  const title = pickString(meta.title, meta.siteTitle, meta.name, "AI破局大会 · 道法术器拆解档案");
  const description = pickString(
    meta.description,
    meta.summary,
    "从 Markdown 纪要生成的道法术器静态拆解档案。"
  );
  const ogTitle = pickString(meta.ogTitle, meta.openGraph?.title, title);
  const ogDescription = pickString(meta.ogDescription, meta.openGraph?.description, description);
  const language = pickString(meta.lang, meta.language, "zh-CN");
  const wechatValue = pickString(meta.wechat, meta.wechatId, meta.wechatPlaceholder, "未配置微信号");
  const wechatLeadCopy = pickString(
    meta.wechatLeadCopy,
    `微信号：${wechatValue}。后续 Markdown 转换、网页源码和术语道模板，都从这里承接。`
  );

  const html = replacePlaceholders(template, {
    __LANG__: escapeHtml(language),
    __SITE_TITLE__: escapeHtml(title),
    __SITE_DESCRIPTION__: escapeHtml(description),
    __OG_TITLE__: escapeHtml(ogTitle),
    __OG_DESCRIPTION__: escapeHtml(ogDescription),
    __SITE_DATA__: safeJsonForHtml(siteData),
    __CSS__: safeInlineStyle(css),
    __JS__: safeInlineScript(js),
    __BUILD_TIME__: escapeHtml(siteData.generatedAt),
    __WECHAT_VALUE__: escapeHtml(wechatValue),
    __WECHAT_LEAD_COPY__: escapeHtml(wechatLeadCopy),
  });

  validateRenderedHtml(html);
  return html;
}

async function findMissingBuildInputs() {
  const checks = await Promise.all(buildInputs.map(async ([relativePath, absolutePath, label]) => {
    try {
      await access(absolutePath);
      return null;
    } catch {
      return { relativePath, label };
    }
  }));

  return checks.filter(Boolean);
}

async function readRequiredFile(relativePath, absolutePath) {
  try {
    return await readFile(absolutePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`Missing required file: ${relativePath}`);
    }
    throw new Error(`Could not read ${relativePath}: ${error.message}`);
  }
}

async function readJsonFile(relativePath, absolutePath) {
  const content = await readRequiredFile(relativePath, absolutePath);
  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Invalid JSON in ${relativePath}: ${error.message}`);
  }
}

function normalizeCases(casesRaw) {
  const cases = Array.isArray(casesRaw) ? casesRaw : casesRaw?.cases;
  if (!Array.isArray(cases)) {
    throw new Error("Invalid data/cases.json: expected an array or an object with a `cases` array.");
  }

  return cases;
}

function validateTemplatePlaceholders(template) {
  const missing = requiredPlaceholders.filter((placeholder) => !template.includes(placeholder));
  if (missing.length) {
    throw new Error(`Template is missing required placeholder(s): ${missing.join(", ")}`);
  }

  const unknown = findPlaceholders(template).filter((placeholder) => !placeholderNames.includes(placeholder));
  if (unknown.length) {
    throw new Error(`Template contains unknown placeholder(s): ${[...new Set(unknown)].join(", ")}`);
  }
}

function validateRenderedHtml(html) {
  const unresolved = placeholderNames.filter((placeholder) => html.includes(placeholder));
  if (unresolved.length) {
    throw new Error(`Rendered HTML still contains unresolved placeholder(s): ${unresolved.join(", ")}`);
  }
  if (!html.includes("<!doctype html>") || !html.includes('id="site-data"')) {
    throw new Error("Rendered HTML failed basic structure validation.");
  }
}

function replacePlaceholders(template, replacements) {
  return Object.entries(replacements).reduce(
    (html, [placeholder, value]) => html.replaceAll(placeholder, value),
    template
  );
}

function formatMissingInputs(missing) {
  const lines = missing.map(({ relativePath, label }) => `- ${relativePath} (${label})`);
  return ["Missing inputs:", ...lines].join("\n");
}

function pickString(...values) {
  return values.find((value) => typeof value === "string" && value.trim()) ?? "";
}

function safeJsonForHtml(value) {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

function safeInlineScript(value) {
  return String(value).replace(/<\/script/gi, "<\\/script");
}

function safeInlineStyle(value) {
  return String(value).replace(/<\/style/gi, "<\\/style");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function byteLength(value) {
  return Buffer.byteLength(value, "utf8").toLocaleString("en-US");
}

function findPlaceholders(value) {
  return String(value).match(/__[A-Z0-9_]+__/g) ?? [];
}
