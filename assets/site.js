(function () {
  const payload = window.POJU_SITE_DATA || window.SITE_DATA || {};
  const meta = payload.meta || {};
  const cases = Array.isArray(payload.cases) ? payload.cases : [];

  const extractFields = [
    ["guestIdentity", "嘉宾身份"],
    ["realResult", "真实结果"],
    ["keyData", "关键数据"],
    ["coreStory", "核心故事"],
    ["methodFramework", "方法框架"],
    ["tools", "工具清单"],
    ["quote", "金句"],
  ];

  const valueLabels = [
    ["money", "钱"],
    ["relationship", "关系"],
    ["skill", "技能"],
    ["influence", "影响力"],
  ];

  const pillarLabels = [
    ["dao", "道"],
    ["fa", "法"],
    ["shu", "术"],
    ["qi", "器"],
  ];

  const state = {
    activeTheme: "全部",
    query: "",
  };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function asText(value) {
    if (Array.isArray(value)) return value.join("、");
    if (value && typeof value === "object") return JSON.stringify(value);
    return String(value ?? "");
  }

  function scorePair(score, key) {
    const value = score?.[key];
    if (Array.isArray(value)) return { short: value[0] || 0, long: value[1] || 0 };
    return { short: value?.short || 0, long: value?.long || 0 };
  }

  function setText(selector, value) {
    const node = $(selector);
    if (node && value) node.textContent = value;
  }

  function renderMeta() {
    setText("[data-site-brand]", meta.brand || "破局拆解");
    setText("[data-hero-title]", meta.siteTitle || meta.title);
    setText("[data-hero-copy]", meta.subtitle || meta.description);
    setText("[data-wechat-value]", meta.wechat || meta.wechatPlaceholder);
    setText("[data-wechat-pill]", meta.wechat || meta.wechatPlaceholder);

    const leadCopy = $("[data-lead-copy]");
    if (leadCopy) {
      leadCopy.textContent = meta.wechat
        ? "这里是后续Markdown转换、网页源码和术语道模板的承接入口。"
        : "这里先保留引流位。填入准确微信号后，构建脚本会生成可直接托管的静态页。";
    }
  }

  function renderStats() {
    const node = $("[data-stats]");
    if (!node) return;
    const stats = meta.stats || [
      { label: "Source", value: String(cases.length), text: "来自破局拆解文件夹的Markdown" },
      { label: "Extract", value: "7", text: "固定抽取七个关键信息字段" },
      { label: "Score", value: "4×2", text: "四维评分，区分短期和长期" },
      { label: "Core", value: "道法术器", text: "认知、模型、打法、工具" },
    ];
    node.innerHTML = stats.map((item) => `
      <div class="stat">
        <span>${escapeHtml(item.label)}</span>
        <strong>${escapeHtml(item.value)}</strong>
        <p>${escapeHtml(item.text)}</p>
      </div>
    `).join("");
  }

  function renderPipeline() {
    const node = $("[data-pipeline]");
    if (!node) return;
    node.innerHTML = (meta.methodPipeline || []).map((step) => `
      <div class="pipeline-step">
        <b>${escapeHtml(step.id)}</b>
        <div>
          <h3>${escapeHtml(step.title)}</h3>
          <p>${escapeHtml(step.description)}</p>
        </div>
      </div>
    `).join("");
  }

  function renderConnections() {
    const node = $("[data-connections]");
    if (!node) return;
    node.innerHTML = (meta.hiddenConnections || []).map((item, index) => `
      <article class="connection reveal" style="animation-delay:${index * 45}ms">
        <i>${escapeHtml(item.id || String(index + 1).padStart(2, "0"))}</i>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.description)}</p>
      </article>
    `).join("");
  }

  function renderGlobalActions() {
    const node = $("[data-global-actions]");
    if (!node) return;
    node.innerHTML = (meta.globalActions || []).map((item) => `
      <article class="action-card">
        <h3>${escapeHtml(item.label)}</h3>
        <ul>${(item.items || []).map((action) => `<li>${escapeHtml(action)}</li>`).join("")}</ul>
      </article>
    `).join("");
  }

  function renderJinchengSummary() {
    const node = $("[data-view-card]");
    if (!node) return;
    node.innerHTML = `
      <h3>业务转译原则</h3>
      <p>${escapeHtml(meta.jinchengSummary || "把嘉宾内容转成自己的业务语言，再做公开输出和私域承接。")}</p>
    `;
  }

  function themes() {
    return ["全部", ...Array.from(new Set(cases.map((item) => item.theme).filter(Boolean)))];
  }

  function renderFilters() {
    const node = $("[data-filters]");
    if (!node) return;
    node.innerHTML = themes().map((theme) => {
      const count = theme === "全部" ? cases.length : cases.filter((item) => item.theme === theme).length;
      const active = theme === state.activeTheme ? " is-active" : "";
      return `<button class="filter${active}" type="button" data-filter="${escapeHtml(theme)}">${escapeHtml(theme)} · ${count}</button>`;
    }).join("");

    $$(".filter").forEach((button) => {
      button.addEventListener("click", () => {
        state.activeTheme = button.dataset.filter;
        renderFilters();
        renderCases();
      });
    });
  }

  function searchableText(item) {
    return [
      item.title,
      item.theme,
      item.sourceFile,
      item.guestIdentity,
      item.realResult,
      item.keyData,
      item.coreStory,
      item.methodFramework,
      asText(item.tools),
      item.quote,
      item.jinchengView,
      Object.values(item.pillars || {}).join(" "),
      Object.values(item.actionList || {}).join(" "),
    ].join(" ").toLowerCase();
  }

  function matches(item) {
    const themeMatch = state.activeTheme === "全部" || item.theme === state.activeTheme;
    const queryMatch = searchableText(item).includes(state.query.trim().toLowerCase());
    return themeMatch && queryMatch;
  }

  function renderScore(score) {
    return valueLabels.map(([key, label]) => {
      const pair = scorePair(score, key);
      return `
        <div class="score">
          <h4>${escapeHtml(label)}</h4>
          <div class="score-line"><span>短期</span><div class="bar"><i style="--score:${pair.short}"></i></div><b>${pair.short}</b></div>
          <div class="score-line"><span>长期</span><div class="bar"><i style="--score:${pair.long}"></i></div><b>${pair.long}</b></div>
        </div>
      `;
    }).join("");
  }

  function renderExtract(item) {
    return extractFields.map(([key, label]) => {
      const value = key === "tools" ? asText(item.tools) : item[key];
      return `
        <div class="extract-cell">
          <h4>${escapeHtml(label)}</h4>
          <p>${escapeHtml(value)}</p>
        </div>
      `;
    }).join("");
  }

  function renderPillars(item) {
    return pillarLabels.map(([key, label]) => `
      <div class="pillar" data-key="${label}">
        <h4>${escapeHtml(label)}</h4>
        <p>${escapeHtml(item.pillars?.[key])}</p>
      </div>
    `).join("");
  }

  function renderActionList(actionList) {
    if (!actionList || typeof actionList !== "object") return "";
    return `
      <ul>
        <li><b>今天</b>${escapeHtml(actionList.today)}</li>
        <li><b>本周</b>${escapeHtml(actionList.week)}</li>
        <li><b>本月</b>${escapeHtml(actionList.month)}</li>
      </ul>
    `;
  }

  function renderCases() {
    const list = cases.filter(matches);
    const listNode = $("[data-case-list]");
    const emptyNode = $("[data-empty-state]");
    if (!listNode) return;

    if (emptyNode) emptyNode.style.display = list.length ? "none" : "block";
    listNode.innerHTML = list.map((item, index) => `
      <article class="case reveal" style="animation-delay:${Math.min(index, 8) * 35}ms">
        <header class="case-head">
          <div>
            <div class="case-index">
              <b>${escapeHtml(item.id || String(index + 1).padStart(2, "0"))}</b>
              <span>${escapeHtml(item.sourceFile)}</span>
            </div>
            <h3 class="case-title">${escapeHtml(item.title)}</h3>
          </div>
          <div class="case-side">
            <span class="badge">${escapeHtml(item.theme)}</span>
            <span>钱 / 关系 / 技能 / 影响力</span>
          </div>
        </header>

        <section class="worth" aria-label="价值评分">
          ${renderScore(item.valueScore)}
        </section>

        <section class="extract" aria-label="七字段抽取">
          ${renderExtract(item)}
        </section>

        <section class="pillars" aria-label="道法术器">
          ${renderPillars(item)}
        </section>

        <section class="case-bottom">
          <div class="mini-action">
            <h4>行动清单</h4>
            ${renderActionList(item.actionList)}
          </div>
          <div class="jc-view">
            <h4>锦成视角</h4>
            <p>${escapeHtml(item.jinchengView)}</p>
          </div>
        </section>
      </article>
    `).join("");
    installRevealObserver();
  }

  function installSearch() {
    const input = $("#searchInput");
    if (!input) return;
    input.addEventListener("input", (event) => {
      state.query = event.target.value;
      renderCases();
    });
  }

  function installRevealObserver() {
    if (typeof window.IntersectionObserver !== "function") return;
    const observer = new window.IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    $$(".reveal").forEach((node) => observer.observe(node));
  }

  function init() {
    renderMeta();
    renderStats();
    renderPipeline();
    renderConnections();
    renderGlobalActions();
    renderJinchengSummary();
    renderFilters();
    renderCases();
    installSearch();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
