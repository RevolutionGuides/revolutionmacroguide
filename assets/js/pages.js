/**
 * Pages
 * Renders Guide / Troubleshooting / Changelog
 */

class Pages {
	static _sectionsCache = null;

	// ---- CONFIG (your repos + labels) ----
	static GUIDE_REPO_OWNER = "RevolutionGuides";
	static GUIDE_REPO_NAME = "revolutionmacroguide";

	// These must match your actual label names in GitHub (case-insensitive in our filter)
	static LABELS = {
		APPROVED: "approved",
		WINDOWS: "windows",
		MAC: "mac",
		MACOS: "macos", // optional if you use "macos" instead of "mac"
		MACRO: "macro",
		PRO: "pro",
	};

	static async loadGuideSections() {
		if (Pages._sectionsCache) return Pages._sectionsCache;

		const res = await fetch("data/guide-sections.json", { cache: "no-cache" });
		if (!res.ok) throw new Error("Failed to load guide-sections.json");
		const json = await res.json();

		const sections = Array.isArray(json.sections) ? json.sections : [];
		Pages._sectionsCache = sections;
		return sections;
	}

	/**
	 * You said the quick-jump “tabs” must be exactly:
	 * gather, collect, planters, status, tools, settings
	 */
	static tabOnlySections(sections) {
		const allow = new Set([
			"gather-tab",
			"collect-tab",
			"planters-tab",
			"status-tab",
			"tools-tab",
			"settings-tab",
		]);

		return sections.filter((s) => allow.has(s.id));
	}

	static consumePendingScrollId() {
		const id = localStorage.getItem("revo_pending_scroll");
		if (!id) return null;
		localStorage.removeItem("revo_pending_scroll");
		return id;
	}

	static scrollToId(id) {
		const el = document.getElementById(id);
		if (!el) return;

		const header = document.querySelector(".site-header");
		const headerH = header ? header.getBoundingClientRect().height : 0;

		/**
		 * You asked: “scroll a bit higher so I can actually see I got there”
		 * That means we want the target heading slightly BELOW the header,
		 * not tucked under it.
		 */
		const offset = Math.max(16, headerH + 18);

		const y = window.scrollY + el.getBoundingClientRect().top - offset;
		window.scrollTo({ top: y, behavior: "smooth" });
	}

	static renderDrawerGuideNav(sections) {
		const host = document.getElementById("drawerGuideNav");
		if (!host) return;

		const tabs = Pages.tabOnlySections(sections);

		// Drawer includes: navigation pages + the 6 guide tabs
		host.innerHTML = `
			<div class="drawer-block">
				<div class="drawer-label">Pages</div>
				<div class="drawer-links">
					<a class="drawer-link" href="#/guide">Guide</a>
					<a class="drawer-link" href="#/troubleshooting">Troubleshooting</a>
					<a class="drawer-link" href="#/changelog">Changelog</a>
				</div>
			</div>

			<div class="drawer-block" style="margin-top:14px;">
				<div class="drawer-label">Guide Tabs</div>
				<div class="drawer-links">
					${tabs
						.map(
							(s) => `
						<a class="drawer-link" href="#/guide" data-scroll-id="${Pages.escapeHtml(
							s.id
						)}">
							${Pages.escapeHtml(s.titleEn || s.id)}
						</a>
					`
						)
						.join("")}
				</div>
			</div>
		`;
	}

	static escapeHtml(text) {
		return String(text)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}

	static async fetchText(url) {
		/**
		 * Fixes GitHub Pages “base path” issues.
		 * Using new URL() makes relative paths resolve correctly even on /repo-name/.
		 */
		const abs = new URL(url, window.location.href).toString();
		const res = await fetch(abs, { cache: "no-cache" });
		if (!res.ok) throw new Error(`Failed to fetch: ${url}`);
		return await res.text();
	}

	// ---------- GUIDE ----------
	static async renderGuide(container) {
		container.innerHTML = `
			<section class="container page-shell page-enter">
				<div class="page-hero">
					<div class="eyebrow">GUIDE</div>
					<h1>Revolution Macro, clearly explained.</h1>
					<p class="lead">Install, configure, and optimize the macro without guesswork.</p>
				</div>

				<div class="surface">
					<div class="prose" id="guideRoot">
						<div class="loading"><div class="spinner"></div></div>
					</div>
				</div>
			</section>
		`;

		const guideRoot = document.getElementById("guideRoot");

		let sections;
		try {
			sections = await Pages.loadGuideSections();
		} catch (e) {
			console.error(e);
			guideRoot.innerHTML = `<div>Failed to load guide sections.</div>`;
			return;
		}

		// Always refresh drawer contents so it works across all pages
		Pages.renderDrawerGuideNav(sections);

		const rendered = [];
		for (const s of sections) {
			try {
				const md = await Pages.fetchText(s.file);
				const html = window.markdown?.render
					? window.markdown.render(md)
					: `<pre>${Pages.escapeHtml(md)}</pre>`;

				rendered.push(`
					<section class="guide-section" id="${Pages.escapeHtml(s.id)}">
						${html}
					</section>
				`);
			} catch (e) {
				console.error(e);
				rendered.push(`
					<section class="guide-section" id="${Pages.escapeHtml(s.id)}">
						<h2>${Pages.escapeHtml(s.titleEn || s.id)}</h2>
						<p>Failed to load: ${Pages.escapeHtml(s.file)}</p>
					</section>
				`);
			}
		}

		guideRoot.innerHTML = rendered.join("");

		const pending = Pages.consumePendingScrollId();
		if (pending) {
			// Wait a beat so layout settles
			window.setTimeout(() => Pages.scrollToId(pending), 120);
		}
	}

	// ---------- TROUBLESHOOTING ----------
	static async renderTroubleshooting(container) {
		/**
		 * You asked:
		 * - “Open Issues” should NOT auto-fill anything (no broken label query)
		 * - “Submit Fix” should open a new issue with BLANK title and ONLY the body prompt
		 */
		const baseRepo = `https://github.com/${Pages.GUIDE_REPO_OWNER}/${Pages.GUIDE_REPO_NAME}`;

		const openIssuesUrl = `${baseRepo}/issues`; // no query, no prefill

		const body = encodeURIComponent("Explain clearly how you solved the issue.");
		const submitFixUrl = `${baseRepo}/issues/new?title=&body=${body}`;

		container.innerHTML = `
			<section class="container page-shell page-enter">
				<div class="page-hero">
					<div class="eyebrow">TROUBLESHOOTING</div>
					<h1>Find and apply the fix fast.</h1>
					<p class="lead">Filter by category, search keywords, and open the exact walkthrough.</p>

					<div style="margin-top:14px; display:flex; gap:10px; flex-wrap:wrap;">
						<a class="btn btn-ghost" href="${openIssuesUrl}" target="_blank" rel="noopener noreferrer">Open Issues</a>
						<a class="btn btn-primary" href="${submitFixUrl}" target="_blank" rel="noopener noreferrer">Submit Fix</a>
					</div>
				</div>

				<div class="surface">
					<div class="prose">
						<div class="toolbar">
							<div class="search">
								<input id="fixSearch" type="text" placeholder="Search fixes..." autocomplete="off" />
							</div>

							<div class="filter-chips" id="fixFilters">
								<button class="chip active" data-cat="all" type="button">All</button>
								<button class="chip" data-cat="windows" type="button">Windows</button>
								<button class="chip" data-cat="mac" type="button">macOS</button>
								<button class="chip" data-cat="macro" type="button">Macro</button>
								<button class="chip" data-cat="pro" type="button">Pro</button>
							</div>
						</div>

						<div id="fixList">
							<div class="loading"><div class="spinner"></div></div>
						</div>
					</div>
				</div>
			</section>
		`;

		// Keep drawer populated on this page
		try {
			const sections = await Pages.loadGuideSections();
			Pages.renderDrawerGuideNav(sections);
		} catch {}

		const list = document.getElementById("fixList");
		const search = document.getElementById("fixSearch");
		const filters = document.getElementById("fixFilters");

		// Only approved fixes pulled from GitHub issues
		const issues = (await githubAPI.getTroubleshootingIssues(Pages.LABELS.APPROVED)) || [];
		if (!issues.length) {
			list.innerHTML = `<div>No approved fixes found yet.</div>`;
			return;
		}

		const state = { q: "", cat: "all" };

		const normalizeLabels = (item) =>
			(item.labels || []).map((l) => String(l.name || "").trim().toLowerCase());

		const matchesCategory = (item) => {
			if (state.cat === "all") return true;

			const labels = normalizeLabels(item);

			// Support either "mac" or "macos" depending on what you use
			if (state.cat === "mac") {
				return labels.includes(Pages.LABELS.MAC) || labels.includes(Pages.LABELS.MACOS);
			}

			return labels.includes(state.cat);
		};

		const matchesQuery = (item) => {
			if (!state.q) return true;
			const hay = `${item.title || ""}\n${item.body || ""}`.toLowerCase();
			return hay.includes(state.q.toLowerCase());
		};

		const render = () => {
			const filtered = issues.filter((it) => matchesCategory(it) && matchesQuery(it));

			list.innerHTML = filtered
				.map((it) => {
					const labels = normalizeLabels(it);
					const labelHtml = labels
						.map((n) => `<span class="pill">${Pages.escapeHtml(n)}</span>`)
						.join("");

					return `
						<div class="acc" data-acc="root">
							<button class="acc-head" type="button" aria-expanded="false" data-acc="toggle">
								<div class="acc-left">
									${labelHtml}
									<div class="acc-title">${Pages.escapeHtml(it.title || "Fix")}</div>
								</div>
								<div class="chev">▼</div>
							</button>

							<div class="acc-body" data-acc="body" hidden>
								<div class="acc-inner">
									${
										window.markdown?.render
											? window.markdown.render(it.body || "")
											: `<pre>${Pages.escapeHtml(it.body || "")}</pre>`
									}
									<div style="margin-top:12px;">
										<a class="btn btn-ghost" href="${it.html_url}" target="_blank" rel="noopener noreferrer">
											Open on GitHub (#${it.number})
										</a>
									</div>
								</div>
							</div>
						</div>
					`;
				})
				.join("");

			// Accordion click behavior
			list.querySelectorAll('[data-acc="toggle"]').forEach((btn) => {
				btn.addEventListener("click", () => {
					const root = btn.closest('[data-acc="root"]');
					const body = root.querySelector('[data-acc="body"]');
					const expanded = btn.getAttribute("aria-expanded") === "true";

					btn.setAttribute("aria-expanded", String(!expanded));
					body.hidden = expanded;
				});
			});
		};

		search.addEventListener("input", (e) => {
			state.q = e.target.value || "";
			render();
		});

		filters.addEventListener("click", (e) => {
			const btn = e.target.closest("button[data-cat]");
			if (!btn) return;

			filters.querySelectorAll(".chip").forEach((b) => b.classList.remove("active"));
			btn.classList.add("active");
			state.cat = (btn.getAttribute("data-cat") || "all").toLowerCase();
			render();
		});

		render();
	}

	// ---------- CHANGELOG ----------
	static async renderChangelog(container) {
		container.innerHTML = `
			<section class="container page-shell page-enter">
				<div class="page-hero">
					<div class="eyebrow">CHANGELOG</div>
					<h1>Latest releases</h1>
					<p class="lead">Pulled live from GitHub releases.</p>
				</div>

				<div class="surface">
					<div class="prose" id="changelogRoot">
						<div class="loading"><div class="spinner"></div></div>
					</div>
				</div>
			</section>
		`;

		// Keep drawer populated on this page
		try {
			const sections = await Pages.loadGuideSections();
			Pages.renderDrawerGuideNav(sections);
		} catch {}

		const root = document.getElementById("changelogRoot");
		const releases = (await githubAPI.getReleases()) || [];

		if (!releases.length) {
			root.innerHTML = `<div>No releases found.</div>`;
			return;
		}

		root.innerHTML = releases
			.map((r) => {
				const name = Pages.escapeHtml(r.name || r.tag_name || "Release");
				const when = githubAPI.formatDate(r.published_at || r.created_at);
				const body = r.body || "";
				const html = window.markdown?.render
					? window.markdown.render(body)
					: `<pre>${Pages.escapeHtml(body)}</pre>`;

				return `
					<div class="acc">
						<div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-end;">
							<h2 style="margin:0;">${name}</h2>
							<div style="color: rgba(235,242,255,.6); font-weight:700;">${when}</div>
						</div>
						<div style="margin-top:10px;">${html}</div>
						<div style="margin-top:12px;">
							<a class="btn btn-ghost" href="${r.html_url}" target="_blank" rel="noopener noreferrer">View on GitHub</a>
						</div>
					</div>
				`;
			})
			.join("");
	}

	// ---------- 404 ----------
	static render404(container) {
		container.innerHTML = `
			<section class="container page-shell page-enter">
				<div class="page-hero">
					<div class="eyebrow">404</div>
					<h1>Page not found</h1>
					<p class="lead">Use the navigation above to continue.</p>
				</div>
			</section>
		`;
	}
}





