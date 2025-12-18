/* assets/js/pages.js
 * Renders Guide / Troubleshooting / Changelog
 * - Guide loads markdown sections from data/guide-sections.json into ONE continuous page
 * - Drawer Quick Jump works from ANY route (auto navigates to #/guide then scrolls)
 * - Troubleshooting pulls fixes from GitHub issues on YOUR WEBSITE REPO
 */

class Pages {
  static pendingScrollIdKey = "__revo_pending_scroll_id";
  static guideSectionsCache = null;

  // ====== CONFIG (CHANGE THIS IF YOUR REPO CHANGES) ======
  static CONFIG = {
    // Your WEBSITE repo (the repo that hosts the guide site + issues for fixes)
    websiteRepo: "https://github.com/AlgesGT/revolutionmacroguide",
    // If you want to fetch troubleshooting fixes from the SAME repo issues:
    troubleshootingRepoOwner: "AlgesGT",
    troubleshootingRepoName: "revolutionmacroguide",

    // Optional: only show issues that have this label (recommended)
    requiredFixLabel: "approved",

    // Issue body text for "Submit Fix"
    submitFixBody: "Explain clearly how you solved the issue",
  };

  // ---------- Utilities ----------
  static setPendingScrollId(id) {
    try { sessionStorage.setItem(Pages.pendingScrollIdKey, id); } catch {}
  }

  static consumePendingScrollId() {
    try {
      const id = sessionStorage.getItem(Pages.pendingScrollIdKey);
      if (id) sessionStorage.removeItem(Pages.pendingScrollIdKey);
      return id || null;
    } catch {
      return null;
    }
  }

  static escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  static headerOffsetPx(extra = 16) {
    const header = document.querySelector(".site-header");
    const h = header ? header.getBoundingClientRect().height : 84;
    return Math.round(h + extra);
  }

  // Scroll to element id with header offset correction
  static scrollToId(id) {
    const el = document.getElementById(id);
    if (!el) return false;

    el.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      window.scrollBy({ top: -Pages.headerOffsetPx(10), left: 0, behavior: "smooth" });
    }, 70);

    return true;
  }

  // Called by drawer from ANY page: go to guide then scroll
  static async goToGuideAndScroll(id) {
    const hash = window.location.hash || "#/guide";
    if (hash.startsWith("#/guide") || hash === "#/" || hash === "#") {
      Pages.scrollToId(id);
      return;
    }
    Pages.setPendingScrollId(id);
    window.location.hash = "#/guide";
  }

  static async fetchText(path) {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch: ${path} (${res.status})`);
    return await res.text();
  }

  static async fetchJson(path) {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch JSON: ${path} (${res.status})`);
    return await res.json();
  }

  static async getGuideSections() {
    if (Pages.guideSectionsCache) return Pages.guideSectionsCache;
    const sectionsJson = await Pages.fetchJson("data/guide-sections.json");
    const sections = Array.isArray(sectionsJson?.sections) ? sectionsJson.sections : [];
    Pages.guideSectionsCache = sections;
    return sections;
  }

  // ---------- Guide ----------
  static async renderGuide(container) {
    container.innerHTML = `
      <section class="container page-shell page-enter">
        <div class="page-hero">
          <div class="eyebrow">GUIDE</div>
          <h1>Revolution Macro, clearly explained.</h1>
          <p class="lead">Install, configure, and optimize the macro without guesswork.</p>
          <div class="hero-actions" style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap;">
            <a class="btn btn-primary" target="_blank" rel="noopener noreferrer"
               href="https://github.com/nosyliam/revolution-macro/releases/latest">Download macro</a>
            <a class="btn btn-ghost" href="#/troubleshooting">View troubleshooting</a>
          </div>
        </div>

        <div class="surface guide-grid single">
          <div class="prose" id="guideRoot">
            <div class="loading"><div class="spinner"></div></div>
          </div>
        </div>
      </section>
    `;

    const guideRoot = document.getElementById("guideRoot");

    let sections = [];
    try {
      sections = await Pages.getGuideSections();
    } catch (e) {
      console.error(e);
      guideRoot.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⚠️</div>
          <div>Could not load <code>data/guide-sections.json</code>.</div>
        </div>
      `;
      return;
    }

    // Render ALL markdowns into ONE continuous guide
    let html = "";
    for (const s of sections) {
      try {
        const md = await Pages.fetchText(s.file);
        const rendered = window.markdown?.render
          ? window.markdown.render(md)
          : `<pre>${Pages.escapeHtml(md)}</pre>`;

        html += `
          <section class="guide-section" id="${Pages.escapeHtml(s.id)}">
            ${rendered}
          </section>
        `;
      } catch (e) {
        console.error(e);
        html += `
          <section class="guide-section" id="${Pages.escapeHtml(s.id)}">
            <div class="empty-state">
              <div class="empty-icon">⚠️</div>
              <div>Could not load <code>${Pages.escapeHtml(s.file)}</code>.</div>
            </div>
          </section>
        `;
      }
    }

    guideRoot.innerHTML = html || `
      <div class="empty-state">
        <div class="empty-icon">📄</div>
        <div>No guide sections found.</div>
      </div>
    `;

    // Ensure drawer nav is populated (your 6 tabs)
    Pages.renderDrawerGuideNav(sections);

    // If we came from another page via quickjump, scroll now
    const pending = Pages.consumePendingScrollId();
    if (pending) window.setTimeout(() => Pages.scrollToId(pending), 140);
  }

  // Build drawer quickjump = EXACTLY your 6 tabs
  static renderDrawerGuideNav(sections) {
    const host = document.getElementById("drawerGuideNav");
    if (!host) return;

    const wanted = [
      "gather-tab",
      "collect-tab",
      "planters-tab",
      "status-tab",
      "tools-tab",
      "settings-tab",
    ];

    const byId = new Map(sections.map((s) => [String(s.id || ""), s]));
    const quick = wanted.map((id) => byId.get(id)).filter(Boolean);

    host.innerHTML = quick.map((s, idx) => {
      const title = s.titleEn || s.id;
      return `
        <button class="guide-link" type="button" data-jump-id="${Pages.escapeHtml(s.id)}">
          <span class="guide-index">${idx + 1}</span>
          <span class="guide-text">${Pages.escapeHtml(title)}</span>
        </button>
      `;
    }).join("");

    host.querySelectorAll("[data-jump-id]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-jump-id");
        if (!id) return;
        document.dispatchEvent(new CustomEvent("revo:drawer-close"));
        await Pages.goToGuideAndScroll(id);
      });
    });
  }

  // ---------- Troubleshooting ----------
  static async renderTroubleshooting(container) {
    const repoUrl = Pages.CONFIG.websiteRepo;
    const openIssuesUrl = `${repoUrl}/issues`; // NO pre-filled query
    const submitFixUrl = Pages.buildSubmitFixUrl(); // blank title + body helper text

    container.innerHTML = `
      <section class="container page-shell page-enter">
        <div class="page-hero">
          <div class="eyebrow">TROUBLESHOOTING</div>
          <h1>Find and apply the fix fast.</h1>
          <p class="lead">Filter by category, search keywords, and open the exact walkthrough.</p>

          <div class="hero-actions" style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap;">
            <a class="btn btn-ghost" href="${openIssuesUrl}" target="_blank" rel="noopener noreferrer">Open Issues</a>
            <a class="btn btn-primary" href="${submitFixUrl}" target="_blank" rel="noopener noreferrer">Submit Fix</a>
          </div>
        </div>

        <div class="surface">
          <div class="toolbar">
            <div class="search">
              <span class="search-icon">🔍</span>
              <input id="fixSearch" type="search" placeholder="Search fixes..." autocomplete="off" />
            </div>
            <div class="filter-chips" id="fixFilters">
              <button class="chip active" data-cat="all" type="button">All</button>
              <button class="chip" data-cat="windows" type="button">Windows</button>
              <button class="chip" data-cat="mac" type="button">macOS</button>
              <button class="chip" data-cat="macro" type="button">Macro</button>
              <button class="chip" data-cat="pro" type="button">Pro</button>
            </div>
          </div>

          <div class="accordion" id="fixList" style="margin-top:14px;">
            <div class="loading"><div class="spinner"></div></div>
          </div>
        </div>
      </section>
    `;

    const listEl = document.getElementById("fixList");
    const searchEl = document.getElementById("fixSearch");
    const chipsEl = document.getElementById("fixFilters");

    let activeCat = "all";
    let searchQ = "";

    const issues = await Pages.fetchFixIssuesSafe();
    const items = Pages.normalizeIssuesToFixItems(issues);

    const render = () => {
      const q = searchQ.trim().toLowerCase();

      const filtered = items.filter((it) => {
        const catOk = activeCat === "all" ? true : it.category === activeCat;
        if (!catOk) return false;

        if (!q) return true;
        return (it.title || "").toLowerCase().includes(q) || (it.bodyText || "").toLowerCase().includes(q);
      });

      if (!filtered.length) {
        listEl.innerHTML = `<div class="empty-state"><div class="empty-icon">🔎</div><div>No fixes found.</div></div>`;
        return;
      }

      listEl.innerHTML = filtered.map((it) => Pages.renderFixAccordionItem(it)).join("");

      // bind accordion behavior
      listEl.querySelectorAll("[data-acc='btn']").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id");
          const body = listEl.querySelector(`[data-acc='body'][data-id='${CSS.escape(id)}']`);
          const chev = btn.querySelector(".chevron");
          if (!body) return;

          const open = body.classList.toggle("open");
          if (chev) chev.style.transform = open ? "rotate(180deg)" : "rotate(0deg)";
        });
      });
    };

    chipsEl.querySelectorAll(".chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        chipsEl.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        activeCat = chip.getAttribute("data-cat") || "all";
        render();
      });
    });

    searchEl.addEventListener("input", () => {
      searchQ = searchEl.value || "";
      render();
    });

    render();
  }

  static renderFixAccordionItem(it) {
    const safeTitle = Pages.escapeHtml(it.title || "Untitled fix");
    const safeBody = it.bodyHtml || `<p>${Pages.escapeHtml(it.bodyText || "")}</p>`;
    const badge = it.badge ? `<span class="pill">${Pages.escapeHtml(it.badge)}</span>` : "";

    return `
      <div class="acc-item">
        <button class="acc-btn" type="button" data-acc="btn" data-id="${Pages.escapeHtml(it.id)}">
          <div class="acc-left">
            ${badge}
            <div class="acc-title">${safeTitle}</div>
          </div>
          <span class="chevron" aria-hidden="true">▾</span>
        </button>

        <div class="acc-body" data-acc="body" data-id="${Pages.escapeHtml(it.id)}">
          <div class="prose">
            ${safeBody}
            <div style="margin-top:12px;">
              <a class="btn btn-ghost" href="${Pages.escapeHtml(it.html_url)}" target="_blank" rel="noopener noreferrer">
                Open on GitHub (#${Pages.escapeHtml(it.number)})
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  static async fetchFixIssuesSafe() {
    const { troubleshootingRepoOwner: owner, troubleshootingRepoName: repo } = Pages.CONFIG;

    const base = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues`;
    const params = new URLSearchParams({
      state: "open",
      per_page: "100",
    });

    // optional label filter (recommended), but safe if label doesn’t exist
    const label = (Pages.CONFIG.requiredFixLabel || "").trim();
    if (label) params.set("labels", label);

    const url = `${base}?${params.toString()}`;

    try {
      const res = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
      if (!res.ok) throw new Error(`GitHub API failed: ${res.status}`);
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  // Convert GitHub issues -> your filter categories
  static normalizeIssuesToFixItems(issues) {
    const out = [];
    for (const issue of issues) {
      if (!issue || issue.pull_request) continue;

      const labels = (issue.labels || []).map((l) => String(l?.name || "").toLowerCase());
      const category =
        labels.includes("windows") ? "windows" :
        labels.includes("mac") || labels.includes("macos") ? "mac" :
        labels.includes("macro") ? "macro" :
        labels.includes("pro") ? "pro" :
        "all";

      const badge =
        category === "windows" ? "Windows" :
        category === "mac" ? "macOS" :
        category === "macro" ? "Macro" :
        category === "pro" ? "Pro" :
        "General";

      const bodyText = String(issue.body || "").trim();
      const bodyHtml = window.markdown?.render ? window.markdown.render(bodyText) : Pages.escapeHtml(bodyText);

      out.push({
        id: String(issue.id),
        number: issue.number,
        title: issue.title || "",
        bodyText,
        bodyHtml,
        html_url: issue.html_url,
        category,
        badge,
      });
    }
    return out;
  }

  // Build “Submit Fix” so title is blank and body contains ONLY your sentence
  static buildSubmitFixUrl() {
    const repoUrl = Pages.CONFIG.websiteRepo;
    const body = Pages.CONFIG.submitFixBody || "Explain clearly how you solved the issue";

    const params = new URLSearchParams({
      title: "",
      body,
    });

    // If you later add a template, you can also do: params.set("template","submit-fix.yml")
    return `${repoUrl}/issues/new?${params.toString()}`;
  }

  // ---------- Changelog ----------
  static async renderChangelog(container) {
    container.innerHTML = `
      <section class="container page-shell page-enter">
        <div class="page-hero">
          <div class="eyebrow">CHANGELOG</div>
          <h1>Latest releases from GitHub.</h1>
          <p class="lead">See what changed before you update.</p>
        </div>

        <div class="surface" id="releaseList">
          <div class="loading"><div class="spinner"></div></div>
        </div>
      </section>
    `;

    const list = document.getElementById("releaseList");
    try {
      // Keep your existing release source; change if you want it elsewhere
      const res = await fetch("https://api.github.com/repos/nosyliam/revolution-macro/releases", {
        headers: { Accept: "application/vnd.github+json" },
      });
      if (!res.ok) throw new Error(`Release API failed: ${res.status}`);
      const data = await res.json();
      const releases = Array.isArray(data) ? data : [];

      if (!releases.length) {
        list.innerHTML = `<div class="empty-state"><div class="empty-icon">📦</div><div>No releases published yet.</div></div>`;
        return;
      }

      list.innerHTML = releases.slice(0, 15).map((r) => {
        const name = Pages.escapeHtml(r.name || r.tag_name || "Release");
        const tag = Pages.escapeHtml(r.tag_name || "");
        const url = Pages.escapeHtml(r.html_url || "#");
        const md = String(r.body || "");
        const body = window.markdown?.render ? window.markdown.render(md) : `<pre>${Pages.escapeHtml(md)}</pre>`;
        const date = r.published_at ? new Date(r.published_at).toLocaleString() : "";

        return `
          <div class="release-card">
            <div class="release-head">
              <div class="release-title">${name}</div>
              <div class="release-meta">${tag} ${date ? `• ${Pages.escapeHtml(date)}` : ""}</div>
              <div style="margin-top:10px;">
                <a class="btn btn-ghost" href="${url}" target="_blank" rel="noopener noreferrer">Open on GitHub</a>
              </div>
            </div>
            <div class="prose">${body}</div>
          </div>
        `;
      }).join("");
    } catch (e) {
      console.error(e);
      list.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div>Could not load releases.</div></div>`;
    }
  }

  // ---------- 404 ----------
  static render404(container) {
    container.innerHTML = `
      <section class="container page-shell page-enter">
        <div class="empty-state">
          <div class="empty-icon">404</div>
          <div>Page not found.</div>
          <div style="margin-top:12px;">
            <a class="btn btn-primary" href="#/guide">Go to Guide</a>
          </div>
        </div>
      </section>
    `;
  }
}


