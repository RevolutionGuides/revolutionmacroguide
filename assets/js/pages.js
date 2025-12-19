/**
 * Pages (English-only)
 * - Guide: loads markdown sections from data/guide-sections.json
 * - Troubleshooting: lists approved issues from site repo, filter/search, accordion
 * - Changelog: lists GitHub releases from macro repo
 */

class Pages {
	// ---------- Shared ----------
	static escapeHtml(s) {
		return String(s ?? "")
			.replaceAll("&", "&amp;")
			.replaceAll("<", "&lt;")
			.replaceAll(">", "&gt;")
			.replaceAll('"', "&quot;")
			.replaceAll("'", "&#039;");
	}

	static async fetchText(path) {
		const res = await fetch(path, { cache: "no-store" });
		if (!res.ok) throw new Error(`Failed to fetch ${path} (${res.status})`);
		return res.text();
	}

	static getHeaderOffsetPx() {
		const header = document.getElementById("siteHeader");
		const h = header ? header.getBoundingClientRect().height : 72;
		// You asked: quickjump scrolls too high -> make offset smaller (lands lower).
		return Math.round(h + 6);
	}

	static scrollToId(id) {
		const el = document.getElementById(id);
		if (!el) return;
		const y = el.getBoundingClientRect().top + window.scrollY - Pages.getHeaderOffsetPx();
		window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
	}

	static normalizeLabel(name) {
		return String(name || "").trim().toLowerCase();
	}

	static issueCats(issue) {
		const labels = (issue.labels || []).map((l) => Pages.normalizeLabel(l.name));

		const cats = new Set();
		for (const l of labels) {
			if (l === "windows" || l === "win") cats.add("windows");
			if (l === "mac" || l === "macos" || l === "osx") cats.add("mac");
			if (l === "macro") cats.add("macro");
			if (l === "pro" || l === "premium") cats.add("pro");
		}
		// Default bucket if nothing matched
		if (cats.size === 0) cats.add("macro");
		return cats;
	}

	static renderDrawerGuideNav(sections) {
		const mount = document.getElementById("drawerGuideNav");
		if (!mount) return;

		// Only your 6 macro tabs should be here:
		// Gather, Collect, Planters, Status, Tools, Settings
		const wanted = new Set([
			"gather-tab",
			"collect-tab",
			"planters-tab",
			"status-tab",
			"tools-tab",
			"settings-tab",
		]);

		const items = (sections || []).filter((s) => wanted.has(s.id));

		mount.innerHTML = items
			.map((s) => {
				return `<button class="drawer-link" type="button" data-scroll-id="${Pages.escapeHtml(
					s.id
				)}">${Pages.escapeHtml(s.titleEn || s.title || s.id)}</button>`;
			})
			.join("");
	}

	static async loadGuideSections() {
		const text = await Pages.fetchText("data/guide-sections.json");
		const json = JSON.parse(text);
		return Array.isArray(json.sections) ? json.sections : [];
	}

	// ---------- GUIDE ----------
	static async renderGuide(container) {
		container.innerHTML = `
			<section class="container page-shell page-enter">
				<div class="page-hero">
					<div class="eyebrow">GUIDE</div>
					<h1>Revolution Macro, clearly explained.</h1>
					<p class="lead">Install, configure, and optimize the macro without guesswork.</p>
					<div class="hero-actions">
						<a class="btn btn-primary" target="_blank" rel="noopener noreferrer"
							href="https://github.com/nosyliam/revolution-macro/releases/latest">Download macro</a>
						<a class="btn btn-ghost" href="#/troubleshooting">View troubleshooting</a>
					</div>
				</div>

				<div class="surface">
					<div class="prose" id="guideRoot">
						<div class="loading"><div class="spinner"></div></div>
					</div>
				</div>
			</section>
		`;

		const root = container.querySelector("#guideRoot");
		const sections = await Pages.loadGuideSections();

		// Ensure drawer quickjump exists on guide too
		Pages.renderDrawerGuideNav(sections);

		// Load and render all markdown sections into one long page with anchor IDs
		const htmlParts = [];
		for (const s of sections) {
			const md = await Pages.fetchText(s.file);
			const rendered = window.markdown?.render
				? window.markdown.render(md, { breaks: true })
				: md;

			// Wrap each section with a real anchor ID (so quickjump works)
			const title = Pages.escapeHtml(s.titleEn || s.title || "");
			htmlParts.push(`
				<section class="guide-section" id="${Pages.escapeHtml(s.id)}">
					${title ? `<h2>${title}</h2>` : ""}
					${rendered}
				</section>
			`);
		}

		root.innerHTML = htmlParts.join("\n");

		// If we came from troubleshooting -> guide quickjump
		const pending = localStorage.getItem("revo_pending_scroll");
		if (pending) {
			localStorage.removeItem("revo_pending_scroll");
			window.setTimeout(() => Pages.scrollToId(pending), 120);
		}
	}

	// ---------- TROUBLESHOOTING ----------
	static async renderTroubleshooting(container) {
		// DO NOT prefill garbage searches. Keep it clean.
		const openIssuesUrl =
			"https://github.com/RevolutionGuides/revolutionmacroguide/issues";

		// Blank title, only your instruction in body.
		const submitFixUrl =
			"https://github.com/RevolutionGuides/revolutionmacroguide/issues/new?template=troubleshooting.yml" +
			`?body=${encodeURIComponent("Explain clearly how you solved the issue.")}`;

		container.innerHTML = `
			<section class="container page-shell page-enter">
				<div class="page-hero">
					<div class="eyebrow">TROUBLESHOOTING</div>
					<h1>Find and apply the fix fast.</h1>
					<p class="lead">Filter by category, search keywords, and open the exact walkthrough.</p>

					<div class="hero-actions">
						<a class="btn btn-ghost" href="${openIssuesUrl}" target="_blank" rel="noopener noreferrer">Open Issues</a>
						<a class="btn btn-primary" href="${submitFixUrl}" target="_blank" rel="noopener noreferrer">Submit Fix</a>
					</div>
				</div>

				<div class="surface">
					<div class="toolbar">
						<div class="search">
							<span class="search-icon" aria-hidden="true">🔎</span>
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

					<div id="fixList" class="accordion-list">
						<div class="loading"><div class="spinner"></div></div>
					</div>
				</div>
			</section>
		`;

		// Always fill the 6-tab quickjump in drawer, even on this page
		try {
			const sections = await Pages.loadGuideSections();
			Pages.renderDrawerGuideNav(sections);
		} catch {}

		const list = container.querySelector("#fixList");
		const search = container.querySelector("#fixSearch");
		const filters = container.querySelector("#fixFilters");

		let issues = [];
		try {
			issues = (await githubAPI.getTroubleshootingIssues("approved")) || [];
		} catch (e) {
			list.innerHTML = `<div class="empty">Could not load fixes right now.</div>`;
			return;
		}

		// Skip PRs
		issues = issues.filter((i) => !i.pull_request);

		const state = { q: "", cat: "all" };

		const render = () => {
			const q = state.q.trim().toLowerCase();

			const filtered = issues.filter((issue) => {
				const cats = Pages.issueCats(issue);

				const matchesCat = state.cat === "all" ? true : cats.has(state.cat);
				if (!matchesCat) return false;

				if (!q) return true;
				const hay = `${issue.title}\n${issue.body || ""}\n${(issue.labels || [])
					.map((l) => l.name)
					.join(" ")}`.toLowerCase();

				return hay.includes(q);
			});

			if (!filtered.length) {
				list.innerHTML = `<div class="empty">No fixes match your filters.</div>`;
				return;
			}

			list.innerHTML = filtered
				.map((issue) => {
					const cats = Pages.issueCats(issue);
					const tags = Array.from(cats)
						.map((c) => `<span class="tag">${Pages.escapeHtml(c)}</span>`)
						.join("");

					const rendered = window.markdown?.render
						? window.markdown.render(issue.body || "", { breaks: true })
						: Pages.escapeHtml(issue.body || "");

					const safe = window.DOMPurify ? DOMPurify.sanitize(rendered) : rendered;

					return `
						<div class="acc-item">
							<button class="acc-head" type="button" data-acc="toggle" aria-expanded="false">
								<div class="acc-left">
									<div class="acc-title">${Pages.escapeHtml(issue.title || "Untitled fix")}</div>
									<div class="acc-meta">
										${tags}
										<span class="muted">#${issue.number}</span>
										<span class="muted">${githubAPI.formatDate(issue.created_at)}</span>
									</div>
								</div>
								<span class="chevron" aria-hidden="true">⌄</span>
							</button>

							<div class="acc-body" data-acc="body" hidden>
								<div class="prose">
									${safe}
									<div style="margin-top:12px;">
										<a class="btn btn-ghost" href="${issue.html_url}" target="_blank" rel="noopener noreferrer">
											Open on GitHub (#${issue.number})
										</a>
									</div>
								</div>
							</div>
						</div>
					`;
				})
				.join("");

			// Accordion behavior
			list.querySelectorAll('[data-acc="toggle"]').forEach((btn) => {
				btn.addEventListener("click", () => {
					const body = btn.parentElement.querySelector('[data-acc="body"]');
					const expanded = btn.getAttribute("aria-expanded") === "true";
					btn.setAttribute("aria-expanded", expanded ? "false" : "true");
					body.hidden = expanded;

					// When opening, scroll a bit higher so you can SEE you landed there
					if (!expanded) {
						const y =
							btn.getBoundingClientRect().top +
							window.scrollY -
							Pages.getHeaderOffsetPx() -
							10;
						window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
					}
				});
			});
		};

		search.addEventListener("input", () => {
			state.q = search.value || "";
			render();
		});

		filters.querySelectorAll(".chip").forEach((chip) => {
			chip.addEventListener("click", () => {
				filters.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
				chip.classList.add("active");
				state.cat = chip.getAttribute("data-cat") || "all";
				render();
			});
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

		// Fill drawer quickjump here too
		try {
			const sections = await Pages.loadGuideSections();
			Pages.renderDrawerGuideNav(sections);
		} catch {}

		const root = container.querySelector("#changelogRoot");

		let releases = [];
		try {
			releases = await githubAPI.getReleases();
		} catch (e) {
			root.innerHTML = `<div class="empty">Could not load releases right now.</div>`;
			return;
		}

		if (!Array.isArray(releases) || releases.length === 0) {
			root.innerHTML = `<div class="empty">No releases found.</div>`;
			return;
		}

		root.innerHTML = releases
			.map((r) => {
				const title = Pages.escapeHtml(r.name || r.tag_name || "Release");
				const date = githubAPI.formatDate(r.published_at || r.created_at);
				const body = window.markdown?.render
					? window.markdown.render(r.body || "", { breaks: true })
					: Pages.escapeHtml(r.body || "");
				const safe = window.DOMPurify ? DOMPurify.sanitize(body) : body;

				return `
					<section class="release">
						<h2>${title}</h2>
						<p class="muted">${date}</p>
						${safe}
						<p style="margin-top:12px;">
							<a class="btn btn-ghost" href="${r.html_url}" target="_blank" rel="noopener noreferrer">
								View on GitHub
							</a>
						</p>
						<hr />
					</section>
				`;
			})
			.join("");
	}

	static render404(container) {
		container.innerHTML = `
			<section class="container page-shell page-enter">
				<div class="page-hero">
					<div class="eyebrow">404</div>
					<h1>Page not found</h1>
					<p class="lead">That route doesn’t exist.</p>
					<div class="hero-actions">
						<a class="btn btn-primary" href="#/guide">Go to Guide</a>
					</div>
				</div>
			</section>
		`;
	}
}
