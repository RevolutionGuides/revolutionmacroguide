/**
 * Pages
 * Renders Guide / Troubleshooting / Changelog
 */

class Pages {
	static _sectionsCache = null;

	static async loadGuideSections() {
		if (Pages._sectionsCache) return Pages._sectionsCache;

		const res = await fetch("data/guide-sections.json", { cache: "no-cache" });
		if (!res.ok) throw new Error("Failed to load guide-sections.json");
		const json = await res.json();

		const sections = Array.isArray(json.sections) ? json.sections : [];
		Pages._sectionsCache = sections;
		return sections;
	}

	static tabOnlySections(sections) {
		// You said your “6 tabs” must be: gather collect planters status tools settings
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

		// User request: quick jump was scrolling “too high”, so scroll a tiny bit LOWER
		const offset = Math.max(10, headerH + 6);

		const y = window.scrollY + el.getBoundingClientRect().top - offset;
		window.scrollTo({ top: y, behavior: "smooth" });
	}

	static renderDrawerGuideNav(sections) {
		const host = document.getElementById("drawerGuideNav");
		if (!host) return;

		const tabs = Pages.tabOnlySections(sections);

		host.innerHTML = tabs
			.map(
				(s) =>
					`<a class="drawer-link" href="#/guide" data-scroll-id="${s.id}">${Pages.escapeHtml(
						s.titleEn || s.id
					)}</a>`
			)
			.join("");
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
		const res = await fetch(url, { cache: "no-cache" });
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

		// Build drawer nav every time (so it works across tabs)
		Pages.renderDrawerGuideNav(sections);

		// Render markdown in order
		const rendered = [];
		for (const s of sections) {
			try {
				const md = await Pages.fetchText(s.file);
				const html = window.markdown?.render
					? window.markdown.render(md)
					: `<pre>${Pages.escapeHtml(md)}</pre>`;

				// Wrap each section so Quick Jump can target it
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

		// If we navigated here from another tab, scroll after render
		const pending = Pages.consumePendingScrollId();
		if (pending) {
			window.setTimeout(() => Pages.scrollToId(pending), 120);
		}
	}

	// ---------- TROUBLESHOOTING ----------
	static async renderTroubleshooting(container) {
		// Working links:
		// - Open Issues: show open issues in your repo, filtered to approved (optional)
		const openIssuesUrl =
			"https://github.com/RevolutionGuides/revolutionmacroguide/issues?q=is%3Aissue+is%3Aopen";

		// Submit Fix: blank title, body only with your prompt
		const body = encodeURIComponent("Explain clearly how you solved the issue.");
		const submitFixUrl =
			`https://github.com/RevolutionGuides/revolutionmacroguide/issues/new?body=${body}`;

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

		// Ensure drawer has the 6 tabs available even on troubleshooting page
		try {
			const sections = await Pages.loadGuideSections();
			Pages.renderDrawerGuideNav(sections);
		} catch {}

		const list = document.getElementById("fixList");
		const search = document.getElementById("fixSearch");
		const filters = document.getElementById("fixFilters");

		const issues = (await githubAPI.getTroubleshootingIssues("approved")) || [];
		if (!issues.length) {
			list.innerHTML = `<div>No approved fixes found yet.</div>`;
			return;
		}

		const state = { q: "", cat: "all" };

		const getCat = (item) => {
			const labels = (item.labels || []).map((l) => String(l.name || "").toLowerCase());
			if (state.cat === "all") return true;
			return labels.includes(state.cat);
		};

		const getQ = (item) => {
			if (!state.q) return true;
			const hay =
				`${item.title || ""}\n${item.body || ""}`.toLowerCase();
			return hay.includes(state.q.toLowerCase());
		};

		const render = () => {
			const filtered = issues.filter((it) => getCat(it) && getQ(it));

			list.innerHTML = filtered
				.map((it, idx) => {
					const labels = (it.labels || []).map((l) => l.name);
					const labelHtml = labels
						.map((n) => `<span class="pill">${Pages.escapeHtml(n)}</span>`)
						.join("");

					// clickable accordion
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
									${window.markdown?.render ? window.markdown.render(it.body || "") : `<pre>${Pages.escapeHtml(it.body || "")}</pre>`}
									<div style="margin-top:12px;">
										<a class="btn btn-ghost" href="${it.html_url}" target="_blank" rel="noopener noreferrer">Open on GitHub (#${it.number})</a>
									</div>
								</div>
							</div>
						</div>
					`;
				})
				.join("");

			// bind accordion behavior
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
			state.cat = btn.getAttribute("data-cat") || "all";
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

		// Ensure drawer has the 6 tabs available even on changelog page
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
				const html = window.markdown?.render ? window.markdown.render(body) : `<pre>${Pages.escapeHtml(body)}</pre>`;

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



