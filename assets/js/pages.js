/**
 * Pages
 * Renders Guide / Troubleshooting / Changelog
 */

class Pages {
	// ====== CONFIG ======
	static GUIDE_SECTIONS_JSON = "data/guide-sections.json";

	// This is YOUR WEBSITE REPO for submitting fixes + opening issues:
	static TROUBLE_REPO_OWNER = "RevolutionGuides";
	static TROUBLE_REPO_NAME = "revolutionmacroguide";

	// Releases repo (macro):
	static RELEASES_REPO_OWNER = "nosyliam";
	static RELEASES_REPO_NAME = "revolution-macro";

	// 6 tab quick jumps (what you asked for)
	static TAB_IDS = [
		"gather-tab",
		"collect-tab",
		"planters-tab",
		"status-tab",
		"tools-tab",
		"settings-tab",
	];

	// ====== HELPERS ======
	static async _fetchJSON(url) {
		const res = await fetch(url, { cache: "no-cache" });
		if (!res.ok) throw new Error(`Failed to load JSON: ${url} (${res.status})`);
		return await res.json();
	}

	static async _fetchText(url) {
		const res = await fetch(url, { cache: "no-cache" });
		if (!res.ok) throw new Error(`Failed to load text: ${url} (${res.status})`);
		return await res.text();
	}

	static _escapeHtml(str) {
		return String(str ?? "")
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}

	static _normalizeLabel(labelName) {
		return String(labelName || "").trim().toLowerCase();
	}

	static _headerOffsetPx() {
		// uses CSS var --headerH if present
		const root = getComputedStyle(document.documentElement);
		const raw = root.getPropertyValue("--headerH").trim();
		const n = Number(String(raw || "").replace("px", "").trim());
		return Number.isFinite(n) && n > 0 ? n : 64;
	}

	static scrollToId(id) {
		const el = document.getElementById(id);
		if (!el) return;

		// "scroll a bit higher so I can see I got there" -> offset slightly MORE than header
		const headerOffset = this._headerOffsetPx() + 14;

		const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
		window.scrollTo({ top, behavior: "smooth" });
	}

	static _setDrawerLinks(sections) {
		const nav = document.getElementById("drawerGuideNav");
		if (!nav) return;

		// Build ONLY the 6 tabs, in your required order:
		const map = new Map(sections.map((s) => [s.id, s]));
		const tabs = this.TAB_IDS.map((id) => map.get(id)).filter(Boolean);

		nav.innerHTML = tabs
			.map(
				(s) => `
				<a class="drawer-link" href="#"
					data-scroll-id="${this._escapeHtml(s.id)}">
					${this._escapeHtml(s.titleEn || s.id)}
				</a>
			`
			)
			.join("");
	}

	// ====== 404 ======
	static render404(container) {
		container.innerHTML = `
			<section class="container page-shell">
				<div class="page-hero">
					<div class="eyebrow">NOT FOUND</div>
					<h1>That page doesn’t exist.</h1>
					<p class="lead">Use the navigation to get back on track.</p>
				</div>
			</section>
		`;
	}

	// ====== GUIDE ======
	static async renderGuide(container) {
		const sectionsJson = await this._fetchJSON(this.GUIDE_SECTIONS_JSON);
		const sections = Array.isArray(sectionsJson?.sections) ? sectionsJson.sections : [];

		// Fill drawer links (6 tabs)
		this._setDrawerLinks(sections);

		// Fetch + render all markdown sections
		const blocks = [];
		for (const s of sections) {
			try {
				const md = await this._fetchText(s.file);
				const rendered = window.markdown?.render ? window.markdown.render(md) : `<pre>${this._escapeHtml(md)}</pre>`;

				blocks.push(`
					<section class="doc-section" id="${this._escapeHtml(s.id)}">
						<div class="doc-section-head">
							<h2 class="doc-title">${this._escapeHtml(s.titleEn || s.id)}</h2>
						</div>
						<div class="doc-content prose">
							${rendered}
						</div>
					</section>
				`);
			} catch (e) {
				console.error("Guide section load failed:", s?.file, e);
				blocks.push(`
					<section class="doc-section" id="${this._escapeHtml(s.id)}">
						<div class="doc-section-head">
							<h2 class="doc-title">${this._escapeHtml(s.titleEn || s.id)}</h2>
						</div>
						<div class="doc-content prose">
							<div class="callout callout-warn">
								Could not load <code>${this._escapeHtml(s.file)}</code>.
							</div>
						</div>
					</section>
				`);
			}
		}

		container.innerHTML = `
			<section class="container page-shell page-enter">
				<div class="page-hero">
					<div class="eyebrow">GUIDE</div>
					<h1>Revolution Macro Guide</h1>
					<p class="lead">Install, configure, and optimize the macro without guesswork.</p>
				</div>

				<div class="surface">
					${blocks.join("")}
				</div>
			</section>
		`;

		// If a quickjump was clicked from another page, app.js stores it here
		const pending = localStorage.getItem("revo_pending_scroll");
		if (pending) {
			localStorage.removeItem("revo_pending_scroll");
			// wait one frame so layout is ready
			requestAnimationFrame(() => Pages.scrollToId(pending));
		}
	}

	// ====== TROUBLESHOOTING ======
	static _buildOpenIssuesUrl() {
		// IMPORTANT: Your label is "approved" (not "troubleshooting")
		// This opens the issues list WITHOUT auto-filling the GitHub search box with weird stuff.
		// It will filter to open + approved fixes.
		const q = encodeURIComponent("is:issue is:open label:approved");
		return `https://github.com/${this.TROUBLE_REPO_OWNER}/${this.TROUBLE_REPO_NAME}/issues?q=${q}`;
	}

	static _buildSubmitFixUrl() {
		// Blank title, and body prompt only (what you asked for)
		const body = encodeURIComponent("Explain clearly how you solved the issue.\n\nSteps:\n1.\n2.\n3.\n\n(Optional) Screenshots / links:\n- ");
		// You can add labels=approved here IF you want, but it may confuse contributors.
		return `https://github.com/${this.TROUBLE_REPO_OWNER}/${this.TROUBLE_REPO_NAME}/issues/new?body=${body}`;
	}

	static _renderIssueBadges(labels = []) {
		const safe = Array.isArray(labels) ? labels : [];
		return safe
			.map((l) => {
				const name = this._escapeHtml(l?.name || "");
				const norm = this._normalizeLabel(l?.name);
				const cls =
					norm === "windows"
						? "badge badge-win"
						: norm === "macos" || norm === "mac"
						? "badge badge-mac"
						: norm === "macro"
						? "badge badge-macro"
						: norm === "pro"
						? "badge badge-pro"
						: norm === "approved"
						? "badge badge-approved"
						: "badge";

				return `<span class="${cls}">${name}</span>`;
			})
			.join("");
	}

	static async renderTroubleshooting(container) {
		// Pull all approved issues (each issue also has extra labels like windows/macro/etc)
		const issues = (await githubAPI.getTroubleshootingIssues({
			owner: this.TROUBLE_REPO_OWNER,
			repo: this.TROUBLE_REPO_NAME,
			labels: ["approved"],
		})) || [];

		// Filter out PRs (GitHub issues endpoint returns PRs too)
		const fixes = issues.filter((it) => !it.pull_request);

		const openIssuesUrl = this._buildOpenIssuesUrl();
		const submitFixUrl = this._buildSubmitFixUrl();

		container.innerHTML = `
			<section class="container page-shell page-enter">
				<div class="page-hero">
					<div class="eyebrow">TROUBLESHOOTING</div>
					<h1>Find and apply the fix fast.</h1>
					<p class="lead">Search by category and open the exact walkthrough.</p>

					<div class="hero-actions">
						<a class="btn btn-ghost" href="${openIssuesUrl}" target="_blank" rel="noopener noreferrer">Open Issues</a>
						<a class="btn btn-primary" href="${submitFixUrl}" target="_blank" rel="noopener noreferrer">Submit Fix</a>
					</div>
				</div>

				<div class="surface">
					<div class="toolbar">
						<div class="search">
							<span class="search-icon" aria-hidden="true">⌕</span>
							<input id="fixSearch" type="text" placeholder="Search fixes..." autocomplete="off" />
						</div>

						<div class="filter-chips" id="fixFilters" role="tablist" aria-label="Fix categories">
							<button class="chip active" data-cat="all" type="button">All</button>
							<button class="chip" data-cat="windows" type="button">Windows</button>
							<button class="chip" data-cat="macos" type="button">macOS</button>
							<button class="chip" data-cat="macro" type="button">Macro</button>
							<button class="chip" data-cat="pro" type="button">Pro</button>
						</div>
					</div>

					<div id="fixList" class="accordion" aria-label="Fix list">
						${fixes.map((it, idx) => {
							const title = this._escapeHtml(it.title || "Untitled fix");
							const bodyMd = it.body || "";
							const rendered = window.markdown?.render ? window.markdown.render(bodyMd, { breaks: true }) : `<pre>${this._escapeHtml(bodyMd)}</pre>`;
							const labels = Array.isArray(it.labels) ? it.labels : [];
							const labelNames = labels.map((l) => this._normalizeLabel(l?.name));
							const cats = new Set(labelNames);
							// approved is not a category filter; keep it out of filtering
							cats.delete("approved");

							return `
								<div class="acc-item" data-title="${this._escapeHtml(title).toLowerCase()}" data-cats="${this._escapeHtml([...cats].join(" "))}">
									<button class="acc-head" type="button" aria-expanded="false" aria-controls="acc-body-${idx}">
										<div class="acc-left">
											<div class="acc-badges">${this._renderIssueBadges(labels)}</div>
											<div class="acc-title">${title}</div>
										</div>
										<span class="chevron" aria-hidden="true">⌄</span>
									</button>

									<div class="acc-body" id="acc-body-${idx}" hidden>
										<div class="prose">
											${rendered}
											<div class="acc-actions">
												<a class="btn btn-ghost" href="${it.html_url}" target="_blank" rel="noopener noreferrer">
													Open on GitHub (#${it.number})
												</a>
											</div>
										</div>
									</div>
								</div>
							`;
						}).join("")}
					</div>

					<div id="fixEmpty" class="empty" hidden>No fixes match your filters.</div>
				</div>
			</section>
		`;

		// Interactions
		const search = document.getElementById("fixSearch");
		const filterWrap = document.getElementById("fixFilters");
		const list = document.getElementById("fixList");
		const empty = document.getElementById("fixEmpty");

		let activeCat = "all";

		const applyFilters = () => {
			const q = (search?.value || "").trim().toLowerCase();
			const items = Array.from(list?.querySelectorAll(".acc-item") || []);

			let visibleCount = 0;

			for (const item of items) {
				const t = item.getAttribute("data-title") || "";
				const cats = item.getAttribute("data-cats") || "";

				const matchText = !q || t.includes(q);
				const matchCat = activeCat === "all" || cats.split(/\s+/).includes(activeCat);

				const show = matchText && matchCat;
				item.style.display = show ? "" : "none";
				if (show) visibleCount++;
			}

			if (empty) empty.hidden = visibleCount !== 0;
		};

		filterWrap?.addEventListener("click", (e) => {
			const btn = e.target?.closest?.(".chip");
			if (!btn) return;

			filterWrap.querySelectorAll(".chip").forEach((b) => b.classList.remove("active"));
			btn.classList.add("active");
			activeCat = btn.getAttribute("data-cat") || "all";

			applyFilters();
		});

		search?.addEventListener("input", applyFilters);

		// Accordion toggles
		list?.addEventListener("click", (e) => {
			const head = e.target?.closest?.(".acc-head");
			if (!head) return;

			const item = head.closest(".acc-item");
			if (!item) return;

			const body = item.querySelector(".acc-body");
			const expanded = head.getAttribute("aria-expanded") === "true";

			head.setAttribute("aria-expanded", expanded ? "false" : "true");
			if (body) body.hidden = expanded;
		});

		applyFilters();
	}

	// ====== CHANGELOG ======
	static async renderChangelog(container) {
		const releases = (await githubAPI.getReleases(this.RELEASES_REPO_OWNER, this.RELEASES_REPO_NAME)) || [];

		container.innerHTML = `
			<section class="container page-shell page-enter">
				<div class="page-hero">
					<div class="eyebrow">CHANGELOG</div>
					<h1>What’s new.</h1>
					<p class="lead">Recent releases and update notes.</p>
				</div>

				<div class="surface">
					<div class="release-list">
						${releases.map((r) => {
							const name = this._escapeHtml(r.name || r.tag_name || "Release");
							const date = githubAPI.formatDate(r.published_at);
							const body = r.body || "";
							const rendered = window.markdown?.render ? window.markdown.render(body, { breaks: true }) : `<pre>${this._escapeHtml(body)}</pre>`;
							const url = r.html_url;

							return `
								<article class="release">
									<div class="release-head">
										<h2 class="release-title">${name}</h2>
										<div class="release-meta">
											<span class="muted">${this._escapeHtml(date)}</span>
											<a class="btn btn-ghost btn-sm" href="${url}" target="_blank" rel="noopener noreferrer">Open on GitHub</a>
										</div>
									</div>
									<div class="prose">
										${rendered}
									</div>
								</article>
							`;
						}).join("")}
					</div>
				</div>
			</section>
		`;
	}
}

