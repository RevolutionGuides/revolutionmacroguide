class Pages {
	// ---------- Shared helpers ----------
	static getHeaderOffsetPx() {
		const header = document.getElementById("siteHeader");
		const h = header ? header.getBoundingClientRect().height : 72;
		// Tune this: smaller = scroll "lower" (less gap).
		return Math.round(h + 10);
	}

	static scrollToId(id) {
		const el = document.getElementById(id);
		if (!el) return;

		const y =
			el.getBoundingClientRect().top + window.scrollY - Pages.getHeaderOffsetPx();

		window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
	}

	static async fetchText(path) {
		const res = await fetch(path, { cache: "no-store" });
		if (!res.ok) throw new Error(`Failed fetch: ${path} (${res.status})`);
		return await res.text();
	}

	static normalizeLabelName(name) {
		return String(name || "").trim().toLowerCase();
	}

	static getIssueCategoryLabels(issue) {
		const labels = (issue.labels || []).map((l) =>
			Pages.normalizeLabelName(l.name)
		);

		// Map variations to your chips
		const mapped = new Set();
		for (const l of labels) {
			if (l === "windows" || l === "win") mapped.add("windows");
			if (l === "mac" || l === "macos" || l === "osx") mapped.add("mac");
			if (l === "macro") mapped.add("macro");
			if (l === "pro" || l === "premium") mapped.add("pro");
		}
		return mapped;
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
		const cfg = await (async () => {
			const text = await Pages.fetchText("data/guide-sections.json");
			return JSON.parse(text);
		})();

		const sections = Array.isArray(cfg?.sections) ? cfg.sections : [];

		// Render all guide markdown sections into ONE page with stable IDs
		const htmlParts = [];
		for (const s of sections) {
			const md = await Pages.fetchText(s.file);
			const rendered = window.markdown.render(md, { breaks: false });

			htmlParts.push(`
				<section class="guide-section" id="${s.id}">
					${rendered}
				</section>
			`);
		}

		root.innerHTML = htmlParts.join("\n");

		// Build Quick Jump: ONLY the 6 tabs you want
		Pages.buildDrawerQuickJump();

		// If we navigated here from other pages and stored a pending scroll, do it now.
		const pending = localStorage.getItem("revo_pending_scroll");
		if (pending) {
			localStorage.removeItem("revo_pending_scroll");
			// Let layout settle before scrolling.
			requestAnimationFrame(() => Pages.scrollToId(pending));
		}
	}

	static buildDrawerQuickJump() {
		const nav = document.getElementById("drawerGuideNav");
		if (!nav) return;

		const items = [
			{ id: "gather-tab", label: "Gather" },
			{ id: "collect-tab", label: "Collect" },
			{ id: "planters-tab", label: "Planters" },
			{ id: "status-tab", label: "Status" },
			{ id: "tools-tab", label: "Tools" },
			{ id: "settings-tab", label: "Settings" },
		];

		nav.innerHTML = items
			.map(
				(i) =>
					`<a class="drawer-link" href="#${i.id}" data-scroll-id="${i.id}">${i.label}</a>`
			)
			.join("");
	}

	// ---------- TROUBLESHOOTING ----------
	static async renderTroubleshooting(container) {
		// Links: do NOT add label filters that can break; keep simple.
		const openIssuesUrl = `https://github.com/${githubAPI.siteOwner}/${githubAPI.siteRepo}/issues`;
		const submitFixUrl = `https://github.com/${githubAPI.siteOwner}/${githubAPI.siteRepo}/issues/new?title=&body=${encodeURIComponent(
			"Explain clearly how you solved the issue"
		)}`;

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

					<div id="fixList" class="accordion">
						<div class="loading"><div class="spinner"></div></div>
					</div>
				</div>
			</section>
		`;

		const issues = await githubAPI.getApprovedFixIssues();
		const list = container.querySelector("#fixList");
		if (!issues || !Array.isArray(issues)) {
			list.innerHTML = `<div class="empty">Could not load fixes right now.</div>`;
			return;
		}

		// Keep only real issues (not PRs)
		const fixes = issues.filter((i) => !i.pull_request);

		const state = {
			cat: "all",
			q: "",
		};

		const render = () => {
			const q = state.q.trim().toLowerCase();

			const filtered = fixes.filter((issue) => {
				const cats = Pages.getIssueCategoryLabels(issue);

				const matchesCat = state.cat === "all" ? true : cats.has(state.cat);
				if (!matchesCat) return false;

				if (!q) return true;
				const hay = `${issue.title}\n${issue.body || ""}`.toLowerCase();
				return hay.includes(q);
			});

			if (!filtered.length) {
				list.innerHTML = `<div class="empty">No fixes match your filters.</div>`;
				return;
			}

			list.innerHTML = filtered
				.map((issue, idx) => {
					const cats = Pages.getIssueCategoryLabels(issue);
					const chips = Array.from(cats)
						.map((c) => `<span class="tag">${c}</span>`)
						.join("");

					const body = window.markdown.render(issue.body || "", { breaks: true });

					return `
						<div class="acc-item">
							<button class="acc-head" type="button" data-acc="toggle" aria-expanded="false">
								<div class="acc-left">
									<div class="acc-title">${Pages.escapeHtml(issue.title || "Untitled fix")}</div>
									<div class="acc-meta">
										${chips}
										<span class="muted">#${issue.number}</span>
										<span class="muted">${githubAPI.formatDate(issue.created_at)}</span>
									</div>
								</div>
								<span class="chevron" aria-hidden="true">▾</span>
							</button>

							<div class="acc-body" data-acc="body" hidden>
								<div class="prose">
									${body}
									<div class="acc-actions">
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

					// When opening, ensure the header isn't hidden under sticky header
					if (!expanded) {
						const y =
							btn.getBoundingClientRect().top +
							window.scrollY -
							Pages.getHeaderOffsetPx();
						window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
					}
				});
			});
		};

		// Search input
		const search = container.querySelector("#fixSearch");
		search.addEventListener("input", () => {
			state.q = search.value || "";
			render();
		});

		// Filter chips
		container.querySelectorAll("#fixFilters .chip").forEach((chip) => {
			chip.addEventListener("click", () => {
				container.querySelectorAll("#fixFilters .chip").forEach((c) => {
					c.classList.remove("active");
				});
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

		const root = container.querySelector("#changelogRoot");
		const releases = await githubAPI.getReleases();
		if (!releases || !Array.isArray(releases) || !releases.length) {
			root.innerHTML = `<div class="empty">No releases found.</div>`;
			return;
		}

		root.innerHTML = releases
			.map((r) => {
				const title = Pages.escapeHtml(r.name || r.tag_name || "Release");
				const date = githubAPI.formatDate(r.published_at || r.created_at);
				const body = window.markdown.render(r.body || "", { breaks: true });

				return `
					<section class="release">
						<h2>${title}</h2>
						<p class="muted">${date}</p>
						${body}
						<p>
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

	// ---------- HTML escape ----------
	static escapeHtml(text) {
		return String(text || "")
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}
}
