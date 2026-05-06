#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const EXPECTED_CASE_COUNT = 24;
const EXTRACT_FIELDS = ["identity", "result", "data", "story", "framework", "tools", "quote"];
const SCORE_FIELDS = ["money", "relation", "skill", "influence"];
const PILLAR_FIELDS = ["dao", "fa", "shu", "qi"];
const ROUTINE_KEYWORDS = [
  "固定套路",
  "嘉宾身份",
  "真实结果",
  "关键数据",
  "核心故事",
  "方法框架",
  "工具清单",
  "金句",
  "钱",
  "关系",
  "技能",
  "影响力",
  "道",
  "法",
  "术",
  "器",
];
const SECTION_CHECKS = [
  { label: "隐藏连接", tokens: ["隐藏连接", "跨内容隐藏连接", "connectionList", "connections"] },
  { label: "行动清单", tokens: ["行动清单", "Action List", "globalActions", "mini-action"] },
  { label: "业务转译", tokens: ["业务转译", "businessTranslation", "jc-view"] },
  { label: "微信引流位", tokens: ["微信", "WeChat", "wechat", "引流位"] },
];
const INDEX_CANDIDATES = ["index.html", "dist/index.html", "build/index.html", "public/index.html"];
const LEAK_RE = /\b(?:TODO|undefined|null)\b/i;

main();

function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  const root = path.resolve(options.root ?? process.cwd());
  const report = createReport();
  const htmlPath = findHtmlPath(root, options.html);
  const html = htmlPath ? fs.readFileSync(htmlPath, "utf8") : "";
  const htmlDir = htmlPath ? path.dirname(htmlPath) : root;

  if (htmlPath) {
    report.pass("index.html exists", path.relative(root, htmlPath) || "index.html");
    validateRoutineKeywords(html, report);
    validateSections(html, report);
    validateVisibleLeaks(html, report);
  } else {
    report.fail("index.html exists", `Expected one of: ${INDEX_CANDIDATES.join(", ")}`);
  }

  const data = loadCases({ root, html, htmlDir, explicitCasesPath: options.cases, report });
  const cases = data.cases;

  if (cases.length === EXPECTED_CASE_COUNT) {
    report.pass("case count", `Found ${cases.length} cases via ${data.source}`);
  } else {
    report.fail("case count", `Expected ${EXPECTED_CASE_COUNT}, found ${cases.length} via ${data.source}`);
  }

  validateCaseShape(cases, report);
  validateCaseLeaks(cases, report);
  printReport(report, { root, htmlPath, dataSource: data.source });

  if (report.failures.length > 0) {
    process.exitCode = 1;
  }
}

function parseArgs(argv) {
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--root") {
      options.root = requireValue(argv, ++index, "--root");
    } else if (arg.startsWith("--root=")) {
      options.root = arg.slice("--root=".length);
    } else if (arg === "--html") {
      options.html = requireValue(argv, ++index, "--html");
    } else if (arg.startsWith("--html=")) {
      options.html = arg.slice("--html=".length);
    } else if (arg === "--cases") {
      options.cases = requireValue(argv, ++index, "--cases");
    } else if (arg.startsWith("--cases=")) {
      options.cases = arg.slice("--cases=".length);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function requireValue(argv, index, flag) {
  const value = argv[index];
  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${flag}`);
  }
  return value;
}

function printHelp() {
  console.log(`Static site QA validator

Usage:
  node scripts/validate-site.mjs [--root .] [--html index.html] [--cases data/cases.json]

Checks:
  - index.html can be found
  - fixed-routine keywords are present
  - 24 cases can be extracted from data/cases.json, inline scripts, or local script files
  - every case has 7 extract fields, 4 value scores, and 4 pillars
  - hidden connections, action list, business translation, and WeChat lead are present
  - visible page text and case data do not leak TODO/undefined/null
`);
}

function findHtmlPath(root, explicitHtmlPath) {
  if (explicitHtmlPath) {
    const candidate = path.resolve(root, explicitHtmlPath);
    return fs.existsSync(candidate) ? candidate : "";
  }

  for (const candidate of INDEX_CANDIDATES) {
    const fullPath = path.join(root, candidate);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  return "";
}

function loadCases({ root, html, htmlDir, explicitCasesPath, report }) {
  let fallback = null;

  for (const loader of [loadJsonCases, loadScriptCases, loadLiteralCases]) {
    const result = loader({ root, html, htmlDir, explicitCasesPath, report });
    if (result.cases.length > 0) {
      if (isCompleteCaseSet(result.cases)) {
        report.pass("case source", result.source);
        return result;
      }

      fallback ??= result;
    }
  }

  if (fallback) {
    report.pass("case source", fallback.source);
    return fallback;
  }

  return { cases: [], source: "no case source found" };
}

function loadJsonCases({ root, htmlDir, explicitCasesPath, report }) {
  const candidates = unique([
    explicitCasesPath ? path.resolve(root, explicitCasesPath) : "",
    path.join(root, "data/cases.json"),
    path.join(htmlDir, "data/cases.json"),
    path.join(root, "dist/data/cases.json"),
    path.join(root, "build/data/cases.json"),
  ].filter(Boolean));

  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) {
      continue;
    }

    try {
      const raw = JSON.parse(fs.readFileSync(candidate, "utf8"));
      const cases = normalizeCases(findCasesArray(raw));
      if (cases.length > 0) {
        return { cases, source: path.relative(root, candidate) };
      }
    } catch (error) {
      report.fail("case source", `Could not parse ${path.relative(root, candidate)}: ${error.message}`);
    }
  }

  return { cases: [], source: "data/cases.json" };
}

function loadScriptCases({ html, htmlDir, report }) {
  const scripts = collectScripts(html, htmlDir);
  if (scripts.length === 0) {
    return { cases: [], source: "inline/local scripts" };
  }

  try {
    const extracted = evaluateScriptsForCases(scripts);
    const cases = normalizeCases(extracted.cases);
    if (cases.length > 0) {
      return { cases, source: extracted.source };
    }
  } catch (error) {
    report.warn("case source", `Script evaluation fallback needed: ${error.message}`);
  }

  return { cases: [], source: "inline/local scripts" };
}

function loadLiteralCases({ html, report }) {
  try {
    const rows = evaluateLiteral(extractAssignmentLiteral(html, "cases"));
    const themeScore = evaluateLiteral(extractAssignmentLiteral(html, "themeScore"));
    const pillarByTheme = evaluateLiteral(extractAssignmentLiteral(html, "pillarByTheme"));
    const cases = normalizeCases(rows).map((item) => ({
      ...item,
      score: item.score ?? themeScore?.[item.theme],
      pillars: item.pillars ?? pillarByTheme?.[item.theme],
    }));

    if (cases.length > 0) {
      return { cases, source: "inline literal fallback" };
    }
  } catch (error) {
    report.warn("case source", `Literal fallback unavailable: ${error.message}`);
  }

  return { cases: [], source: "inline literal fallback" };
}

function collectScripts(html, htmlDir) {
  const scripts = [];
  const scriptRe = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = scriptRe.exec(html)) !== null) {
    const attrs = match[1] ?? "";
    const inlineCode = match[2] ?? "";
    const src = getAttr(attrs, "src");

    if (src) {
      const srcPath = src.split(/[?#]/)[0];
      if (/^(?:https?:)?\/\//i.test(srcPath) || srcPath.startsWith("data:")) {
        continue;
      }

      const fullPath = path.resolve(htmlDir, decodeHtml(srcPath));
      if (fs.existsSync(fullPath)) {
        scripts.push({ code: fs.readFileSync(fullPath, "utf8"), source: path.relative(htmlDir, fullPath) });
      }
    } else if (inlineCode.trim()) {
      scripts.push({ code: inlineCode, source: "inline script" });
    }
  }

  return scripts;
}

function evaluateScriptsForCases(scripts) {
  const sandbox = createBrowserLikeSandbox();
  const code = scripts.map((item) => item.code).join("\n;\n");
  const source = scripts.map((item) => item.source).join(", ") || "inline/local scripts";
  const probe = `
    ;globalThis.__qaExtract = {
      cases: typeof cases !== "undefined"
        ? cases
        : (globalThis.cases || globalThis.__CASES__ || globalThis.CASES || globalThis.siteCases),
      fields: typeof fields !== "undefined" ? fields : globalThis.fields,
      valueLabels: typeof valueLabels !== "undefined" ? valueLabels : globalThis.valueLabels,
      connections: typeof connections !== "undefined" ? connections : globalThis.connections,
      globalActions: typeof globalActions !== "undefined" ? globalActions : globalThis.globalActions
    };
  `;

  vm.runInNewContext(`${code}\n${probe}`, sandbox, { timeout: 1500, displayErrors: false });
  return { cases: sandbox.__qaExtract?.cases ?? [], source };
}

function createBrowserLikeSandbox() {
  const elements = new Map();

  const createElement = (id = "") => {
    const element = {
      id,
      dataset: {},
      style: {},
      classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
      children: [],
      value: "",
      checked: false,
      addEventListener() {},
      appendChild(child) { this.children.push(child); return child; },
      removeChild(child) { this.children = this.children.filter((item) => item !== child); return child; },
      setAttribute(name, value) { this[name] = value; },
      getAttribute(name) { return this[name]; },
      querySelector() { return createElement(); },
      querySelectorAll() { return []; },
      focus() {},
    };

    Object.defineProperty(element, "innerHTML", {
      get() { return this._innerHTML ?? ""; },
      set(value) { this._innerHTML = String(value); },
    });
    Object.defineProperty(element, "textContent", {
      get() { return this._textContent ?? ""; },
      set(value) { this._textContent = String(value); },
    });

    return element;
  };

  const getElementById = (id) => {
    if (!elements.has(id)) {
      elements.set(id, createElement(id));
    }
    return elements.get(id);
  };

  const document = {
    body: createElement("body"),
    documentElement: createElement("html"),
    createElement,
    getElementById,
    querySelector() { return createElement(); },
    querySelectorAll() { return []; },
    addEventListener(type, callback) {
      if (type === "DOMContentLoaded" && typeof callback === "function") {
        callback();
      }
    },
  };

  const sandbox = {
    console,
    document,
    window: {},
    navigator: { userAgent: "qa-validator" },
    location: { href: "http://localhost/", hash: "", pathname: "/" },
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    requestAnimationFrame(callback) { return setTimeout(callback, 0); },
    cancelAnimationFrame(id) { clearTimeout(id); },
    fetch() { throw new Error("Network fetch is disabled in validate-site.mjs"); },
  };

  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  return sandbox;
}

function extractAssignmentLiteral(source, name) {
  const pattern = new RegExp(`(?:const|let|var)\\s+${escapeRegExp(name)}\\s*=\\s*`, "m");
  const match = pattern.exec(source);
  if (!match) {
    throw new Error(`Could not find ${name} assignment`);
  }

  const start = match.index + match[0].length;
  if (source[start] !== "[" && source[start] !== "{") {
    throw new Error(`${name} is not assigned to an array/object literal`);
  }

  return readBalancedLiteral(source, start);
}

function readBalancedLiteral(source, start) {
  const stack = [source[start] === "[" ? "]" : "}"];
  let quote = "";
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = start + 1; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (lineComment) {
      lineComment = char !== "\n";
      continue;
    }

    if (blockComment) {
      if (char === "*" && next === "/") {
        blockComment = false;
        index += 1;
      }
      continue;
    }

    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = "";
      continue;
    }

    if (char === "/" && next === "/") {
      lineComment = true;
      index += 1;
      continue;
    }

    if (char === "/" && next === "*") {
      blockComment = true;
      index += 1;
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === "[" || char === "{") {
      stack.push(char === "[" ? "]" : "}");
    } else if (char === "]" || char === "}") {
      const expected = stack.pop();
      if (char !== expected) {
        throw new Error(`Unbalanced literal near offset ${index}`);
      }
      if (stack.length === 0) {
        return source.slice(start, index + 1);
      }
    }
  }

  throw new Error("Unterminated literal");
}

function evaluateLiteral(literal) {
  return vm.runInNewContext(`(${literal})`, {}, { timeout: 1000 });
}

function findCasesArray(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value.cases)) return value.cases;
  if (value.data && Array.isArray(value.data.cases)) return value.data.cases;

  for (const child of Object.values(value)) {
    const found = findCasesArray(child);
    if (found.length > 0) return found;
  }

  return [];
}

function normalizeCases(rawCases) {
  if (!Array.isArray(rawCases)) return [];

  return rawCases.map((item) => {
    if (Array.isArray(item)) {
      const [theme, title, source, identity, result, data, story, framework, tools, quote] = item;
      return { theme, title, source, identity, result, data, story, framework, tools, quote };
    }

    if (item && typeof item === "object") return normalizeCaseObject(item);
    return { value: item };
  });
}

function normalizeCaseObject(item) {
  const normalized = { ...item };
  const read = (...keys) => {
    for (const key of keys) {
      if (hasText(item[key])) return item[key];
    }
    return undefined;
  };

  normalized.identity ??= read("guestIdentity", "speakerIdentity", "嘉宾身份");
  normalized.result ??= read("realResult", "outcome", "真实结果");
  normalized.data ??= read("keyData", "metrics", "关键数据");
  normalized.story ??= read("coreStory", "核心故事");
  normalized.framework ??= read("methodFramework", "方法框架");
  normalized.tools ??= read("toolList", "工具清单");
  normalized.quote ??= read("goldenQuote", "金句");
  normalized.score = normalizeScoreObject(item.score ?? item.scores ?? item.valueScore ?? item.valueScores);
  normalized.pillars = normalizePillarsObject(item.pillars ?? item.pillar ?? item.daoFaShuQi ?? item);

  return normalized;
}

function normalizeScoreObject(score) {
  if (!score || typeof score !== "object") return score;

  return {
    money: normalizeScorePair(score.money ?? score["钱"]),
    relation: normalizeScorePair(score.relation ?? score.relationship ?? score["关系"]),
    skill: normalizeScorePair(score.skill ?? score["技能"]),
    influence: normalizeScorePair(score.influence ?? score["影响力"]),
  };
}

function normalizeScorePair(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return value;

  const short = value.short ?? value.shortTerm ?? value["短期"];
  const long = value.long ?? value.longTerm ?? value["长期"];
  return [short, long];
}

function normalizePillarsObject(pillars) {
  if (!pillars || typeof pillars !== "object") return pillars;

  return {
    dao: pillars.dao ?? pillars["道"],
    fa: pillars.fa ?? pillars["法"],
    shu: pillars.shu ?? pillars["术"],
    qi: pillars.qi ?? pillars["器"],
  };
}

function validateRoutineKeywords(html, report) {
  const missing = ROUTINE_KEYWORDS.filter((keyword) => !html.includes(keyword));
  if (missing.length === 0) {
    report.pass("fixed-routine keywords", `${ROUTINE_KEYWORDS.length} keywords present`);
  } else {
    report.fail("fixed-routine keywords", `Missing: ${missing.join(", ")}`);
  }
}

function validateSections(html, report) {
  for (const check of SECTION_CHECKS) {
    if (check.tokens.some((token) => html.includes(token))) {
      report.pass(`${check.label} section`, "present");
    } else {
      report.fail(`${check.label} section`, `Missing any of: ${check.tokens.join(", ")}`);
    }
  }
}

function validateVisibleLeaks(html, report) {
  const visibleText = stripHtmlForVisibleText(html);
  const match = visibleText.match(LEAK_RE);
  if (match) {
    report.fail("visible leak scan", `Found "${match[0]}" in visible page text`);
  } else {
    report.pass("visible leak scan", "No visible TODO/undefined/null");
  }
}

function isCompleteCaseSet(cases) {
  return (
    cases.length === EXPECTED_CASE_COUNT &&
    cases.every((item) => (
      EXTRACT_FIELDS.every((field) => hasText(item[field])) &&
      SCORE_FIELDS.every((field) => {
        const score = item.score?.[field];
        return Array.isArray(score) && score.length === 2 && score.every(isScoreValue);
      }) &&
      PILLAR_FIELDS.every((field) => hasText(item.pillars?.[field]))
    ))
  );
}

function validateCaseShape(cases, report) {
  if (cases.length === 0) {
    report.fail("case shape", "No cases available to validate");
    return;
  }

  const fieldProblems = [];
  const scoreProblems = [];
  const pillarProblems = [];

  cases.forEach((item, index) => {
    const label = caseLabel(item, index);

    for (const field of EXTRACT_FIELDS) {
      if (!hasText(item[field])) fieldProblems.push(`${label}: missing ${field}`);
    }

    for (const field of SCORE_FIELDS) {
      const score = item.score?.[field];
      if (!Array.isArray(score) || score.length !== 2 || !score.every(isScoreValue)) {
        scoreProblems.push(`${label}: invalid score.${field}`);
      }
    }

    for (const field of PILLAR_FIELDS) {
      if (!hasText(item.pillars?.[field])) pillarProblems.push(`${label}: missing pillars.${field}`);
    }
  });

  reportResult(report, "7 extract fields per case", fieldProblems, EXTRACT_FIELDS.join(", "));
  reportResult(report, "4 value scores per case", scoreProblems, SCORE_FIELDS.join(", "));
  reportResult(report, "4 pillars per case", pillarProblems, PILLAR_FIELDS.join(", "));
}

function validateCaseLeaks(cases, report) {
  const leaks = [];

  cases.forEach((item, index) => {
    walkValue(item, caseLabel(item, index), (label, value) => {
      if (value === undefined || value === null) {
        leaks.push(`${label}: ${String(value)}`);
      } else if (typeof value === "string" && LEAK_RE.test(value)) {
        leaks.push(`${label}: "${value.match(LEAK_RE)[0]}"`);
      }
    });
  });

  reportResult(report, "case data leak scan", leaks, "No TODO/undefined/null in case data");
}

function reportResult(report, label, problems, okDetail) {
  if (problems.length === 0) {
    report.pass(label, okDetail);
  } else {
    report.fail(label, summarizeProblems(problems));
  }
}

function walkValue(value, label, visitor, seen = new Set()) {
  visitor(label, value);
  if (!value || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);

  if (Array.isArray(value)) {
    value.forEach((item, index) => walkValue(item, `${label}[${index}]`, visitor, seen));
  } else {
    Object.entries(value).forEach(([key, child]) => walkValue(child, `${label}.${key}`, visitor, seen));
  }
}

function hasText(value) {
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.some((item) => hasText(item));
  return false;
}

function isScoreValue(value) {
  return Number.isFinite(value) && value >= 1 && value <= 5;
}

function caseLabel(item, index) {
  return `case ${String(index + 1).padStart(2, "0")}${item?.title ? ` (${item.title})` : ""}`;
}

function summarizeProblems(problems) {
  const shown = problems.slice(0, 8);
  const suffix = problems.length > shown.length ? `; +${problems.length - shown.length} more` : "";
  return `${shown.join("; ")}${suffix}`;
}

function stripHtmlForVisibleText(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getAttr(attrs, name) {
  const pattern = new RegExp(`${escapeRegExp(name)}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
  const match = pattern.exec(attrs);
  return match ? decodeHtml(match[1] ?? match[2] ?? match[3] ?? "") : "";
}

function decodeHtml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#039;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function unique(values) {
  return [...new Set(values)];
}

function createReport() {
  return {
    entries: [],
    failures: [],
    pass(label, detail) {
      this.entries.push({ level: "PASS", label, detail });
    },
    warn(label, detail) {
      this.entries.push({ level: "WARN", label, detail });
    },
    fail(label, detail) {
      const entry = { level: "FAIL", label, detail };
      this.entries.push(entry);
      this.failures.push(entry);
    },
  };
}

function printReport(report, context) {
  console.log("Static site QA validation");
  console.log(`Root: ${context.root}`);
  console.log(`HTML: ${context.htmlPath ? path.relative(context.root, context.htmlPath) : "not found"}`);
  console.log(`Cases: ${context.dataSource}`);
  console.log("");

  for (const entry of report.entries) {
    console.log(`[${entry.level}] ${entry.label} - ${entry.detail}`);
  }

  console.log("");

  if (report.failures.length > 0) {
    console.log(`Result: FAIL (${report.failures.length} failing check(s))`);
  } else {
    const warnings = report.entries.filter((entry) => entry.level === "WARN").length;
    const warningText = warnings > 0 ? `, ${warnings} warning(s)` : "";
    console.log(`Result: PASS (${report.entries.length} checks${warningText})`);
  }
}
