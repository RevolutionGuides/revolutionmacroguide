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

		Pages.renderDrawerGuideNav(sections);

		const htmlParts = [];
		for (const s of sections) {
			const md = await Pages.fetchText(s.file);
			const rendered = window.markdown?.render
				? window.markdown.render(md, { breaks: true })
				: md;

			// Wrap each section with a real anchor ID (so quickjump works)
			htmlParts.push(`
				<section class="guide-section" id="${Pages.escapeHtml(s.id)}">
					
					${rendered}
				</section>
			`);
		}

		root.innerHTML = htmlParts.join("\n");

		// If drawer nav / quickjump clicked before guide loaded, honor it
		const pending = localStorage.getItem("revo_pending_scroll");
		if (pending) {
			localStorage.removeItem("revo_pending_scroll");
			setTimeout(() => Pages.scrollToId(pending), 150);
		}

		// Drawer guide quickjump
		const drawer = document.getElementById("drawerGuideNav");
		if (drawer) {
			drawer.querySelectorAll("[data-scroll-id]").forEach((btn) => {
				btn.addEventListener("click", () => {
					const id = btn.getAttribute("data-scroll-id");
					if (!id) return;
					if (window.innerWidth <= 820) {
						document.body.classList.remove("drawer-open");
					}
					Pages.scrollToId(id);
				});
			});
		}
	}

	// ---------- TROUBLESHOOTING ----------
	static async renderTroubleshooting(container) {
		const openIssuesUrl = "https://github.com/RevolutionGuides/revolutionmacroguide/issues";
		const submitFixUrl = "https://github.com/RevolutionGuides/revolutionmacroguide/issues/new";

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
							<span class="search-icon">🔎</span>
							<input id="fixSearch" type="text" placeholder="Search fixes..." />
						</div>

						<div class="filter-chips" id="fixFilters">
							<button class="chip active" data-cat="all">All</button>
							<button class="chip" data-cat="windows">Windows</button>
							<button class="chip" data-cat="mac">macOS</button>
							<button class="chip" data-cat="macro">Macro</button>
							<button class="chip" data-cat="pro">Pro</button>
						</div>
					</div>

					<div id="fixList" class="accordion-list">
						<div class="loading"><div class="spinner"></div></div>
					</div>
				</div>
			</section>
		`;

		// hydrate drawer nav guide quickjump (reuse guide sections)
		try {
			const sections = await Pages.loadGuideSections();
			Pages.renderDrawerGuideNav(sections);

			const drawer = document.getElementById("drawerGuideNav");
			if (drawer) {
				drawer.querySelectorAll("[data-scroll-id]").forEach((btn) => {
					btn.addEventListener("click", () => {
						const id = btn.getAttribute("data-scroll-id");
						if (!id) return;
						localStorage.setItem("revo_pending_scroll", id);
						location.hash = "#/guide";
					});
				});
			}
		} catch (e) {}

		const listEl = document.getElementById("fixList");
		const searchEl = document.getElementById("fixSearch");
		const filtersEl = document.getElementById("fixFilters");

		let allIssues = [];
		let activeCat = "all";
		let query = "";

		const render = () => {
			const q = query.trim().toLowerCase();

			const filtered = allIssues.filter((it) => {
				const cats = it._cats;
				const okCat = activeCat === "all" ? true : cats.has(activeCat);
				if (!okCat) return false;
				if (!q) return true;
				return (
					it.title.toLowerCase().includes(q) ||
					(it.body || "").toLowerCase().includes(q)
				);
			});

			if (!filtered.length) {
				listEl.innerHTML = `<div class="empty">No approved fixes match your filters.</div>`;
				return;
			}

			listEl.innerHTML = filtered
				.map((it) => {
					const labelBadges = (it.labels || [])
						.map((l) => Pages.normalizeLabel(l.name))
						.filter((n) => n && n !== "approved")
						.slice(0, 6)
						.map((n) => `<span class="badge">${Pages.escapeHtml(n)}</span>`)
						.join("");

					const safeTitle = Pages.escapeHtml(it.title);
					const bodyHtml = window.markdown?.render
						? window.markdown.render(it.body || "", { breaks: true })
						: Pages.escapeHtml(it.body || "").replaceAll("\n", "<br>");

					return `
						<details class="accordion">
							<summary>
								<div class="acc-title">${safeTitle}</div>
								<div class="acc-meta">${labelBadges}</div>
							</summary>
							<div class="acc-body prose">${bodyHtml}</div>
						</details>
					`;
				})
				.join("");
		};

		const setActiveChip = (cat) => {
			activeCat = cat;
			filtersEl.querySelectorAll(".chip").forEach((b) => {
				b.classList.toggle("active", b.dataset.cat === cat);
			});
			render();
		};

		searchEl.addEventListener("input", () => {
			query = searchEl.value || "";
			render();
		});

		filtersEl.querySelectorAll(".chip").forEach((b) => {
			b.addEventListener("click", () => setActiveChip(b.dataset.cat));
		});

		try {
			const issues = await window.api.listApprovedFixes();
			allIssues = (issues || []).map((it) => ({ ...it, _cats: Pages.issueCats(it) }));
			render();
		} catch (e) {
			listEl.innerHTML = `<div class="error">Failed to load fixes. Try again later.</div>`;
		}
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

		// hydrate drawer nav guide quickjump (reuse guide sections)
		try {
			const sections = await Pages.loadGuideSections();
			Pages.renderDrawerGuideNav(sections);

			const drawer = document.getElementById("drawerGuideNav");
			if (drawer) {
				drawer.querySelectorAll("[data-scroll-id]").forEach((btn) => {
					btn.addEventListener("click", () => {
						const id = btn.getAttribute("data-scroll-id");
						if (!id) return;
						localStorage.setItem("revo_pending_scroll", id);
						location.hash = "#/guide";
					});
				});
			}
		} catch (e) {}

		const root = document.getElementById("changelogRoot");
		if (!root) return;

		try {
			const rels = await window.api.listReleases();
			if (!rels.length) {
				root.innerHTML = `<div class="empty">No releases found.</div>`;
				return;
			}

			root.innerHTML = rels
				.map((r) => {
					const name = Pages.escapeHtml(r.name || r.tag_name || "Release");
					const date = r.published_at ? new Date(r.published_at).toLocaleString() : "";
					const bodyHtml = window.markdown?.render
						? window.markdown.render(r.body || "", { breaks: true })
						: Pages.escapeHtml(r.body || "").replaceAll("\n", "<br>");

					return `
						<article class="release">
							<header class="release-head">
								<h2>${name}</h2>
								<div class="release-meta">${Pages.escapeHtml(date)}</div>
							</header>
							<div class="prose">${bodyHtml}</div>
						</article>
					`;
				})
				.join("\n");
		} catch (e) {
			root.innerHTML = `<div class="error">Failed to load changelog. Try again later.</div>`;
		}
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

window.Pages = Pages;
