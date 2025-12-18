/**
 * Pages
 * Renders Guide (from data/guide-sections.json + md files),
 * Troubleshooting (from GitHub Issues), and Changelog (from releases).
 */

class Pages {
	// -----------------------------
	// Utilities
	// -----------------------------

	static escapeHtml(s) {
		return String(s ?? '')
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	static setRouteTitle(title) {
		document.title = title ? `${title} · Revolution Macro Guide` : 'Revolution Macro Guide';
	}

	static scrollToId(id) {
		const el = document.getElementById(id);
		if (!el) return;
		el.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	static closeDrawerIfOpen() {
		if (typeof window.__revo_closeDrawer === 'function') {
			window.__revo_closeDrawer();
		}
	}

	// -----------------------------
	// GUIDE
	// -----------------------------

	static async loadGuideSections() {
		const res = await fetch('data/guide-sections.json', { cache: 'no-store' });
		if (!res.ok) throw new Error(`Failed to load guide-sections.json (${res.status})`);
		const json = await res.json();
		return Array.isArray(json?.sections) ? json.sections : [];
	}

	static buildQuickJumpButtons(sections) {
		// User requirement: exactly 6 quick-jump buttons relying on IDs.
		// We will point to the six tab sections by their IDs in guide-sections.json:
		// gather-tab, collect-tab, planters-tab, status-tab, tools-tab, settings-tab
		const wanted = [
			{ id: 'gather-tab', label: 'Gather Tab (1)' },
			{ id: 'collect-tab', label: 'Collect Tab (2)' },
			{ id: 'planters-tab', label: 'Planters Tab (3)' },
			{ id: 'status-tab', label: 'Status Tab (4)' },
			{ id: 'tools-tab', label: 'Tools Tab (5)' },
			{ id: 'settings-tab', label: 'Settings Tab (6)' },
		];

		// Only include those that exist in JSON
		const existingIds = new Set(sections.map((s) => s.id));
		const finalButtons = wanted.filter((b) => existingIds.has(b.id));

		return `
			<div class="drawer-section">
				<div class="drawer-label">Quick Jump</div>
				<div class="drawer-nav">
					${finalButtons
						.map(
							(b) => `
						<button type="button" class="guide-link" data-jump="${Pages.escapeHtml(
							b.id
						)}">
							<span class="guide-index">→</span>
							<span class="guide-title">${Pages.escapeHtml(b.label)}</span>
						</button>
					`
						)
						.join('')}
					<button type="button" class="guide-link" data-jump="top">
						<span class="guide-index">↑</span>
						<span class="guide-title">Top</span>
					</button>
				</div>
			</div>
		`;
	}

	static async renderGuide(container) {
		Pages.setRouteTitle('Guide');

		const sections = await Pages.loadGuideSections();

		// Render page shell immediately
		container.innerHTML = `
			<div class="page-shell">
				<section class="page-hero">
					<div class="eyebrow">Macro Guide</div>
					<h1>Revolution Macro Guide</h1>
					<p class="lead">Browse the guide sections below. Use the menu (top-left) for Quick Jump.</p>
				</section>

				<section class="surface guide-grid single">
					<article class="guide-article prose" id="guideContent">
						<div class="loading"><div class="spinner"></div></div>
					</article>
				</section>
			</div>
		`;

		// Populate drawer quick jump
		const drawerNav = document.getElementById('drawerGuideNav');
		if (drawerNav) {
			drawerNav.innerHTML = Pages.buildQuickJumpButtons(sections);

			// Event delegation for quick jump buttons
			drawerNav.onclick = (e) => {
				const btn = e.target.closest('button[data-jump]');
				if (!btn) return;

				const target = btn.getAttribute('data-jump');
				Pages.closeDrawerIfOpen();

				if (target === 'top') {
					window.scrollTo({ top: 0, behavior: 'smooth' });
					return;
				}

				// Jump to wrapper section id (we create those below)
				Pages.scrollToId(target);
			};
		}

		// Fetch all markdown files in order and build ONE guide HTML
		const guideEl = document.getElementById('guideContent');
		if (!guideEl) return;

		const pieces = [];

		for (const section of sections) {
			if (!section?.file || !section?.id) continue;

			const r = await fetch(section.file, { cache: 'no-store' });
			if (!r.ok) {
				pieces.push(
					`<section id="${Pages.escapeHtml(section.id)}">
						<h2>${Pages.escapeHtml(section.titleEn || section.id)}</h2>
						<p><em>Failed to load:</em> ${Pages.escapeHtml(section.file)}</p>
					</section>`
				);
				continue;
			}

			const md = await r.text();
			const html = window.markdown?.render ? window.markdown.render(md) : `<pre>${Pages.escapeHtml(md)}</pre>`;

			// IMPORTANT: We do NOT rewrite guide wording.
			// We only wrap each section with an ID so quick-jump can scroll reliably.
			pieces.push(`<section id="${Pages.escapeHtml(section.id)}">${html}</section>`);
		}

		guideEl.innerHTML = pieces.join('\n\n');
	}

	// -----------------------------
	// TROUBLESHOOTING (GitHub Issues)
	// -----------------------------

	static issueCategoryFromLabels(labels = []) {
		const names = labels.map((l) => String(l?.name || '').toLowerCase());
		if (names.includes('windows')) return 'windows';
		if (names.includes('mac') || names.includes('macos')) return 'macos';
		if (names.includes('macro')) return 'macro';
		if (names.includes('pro')) return 'pro';
		return 'other';
	}

	static issueCategoryLabel(cat) {
		if (cat === 'windows') return 'Windows';
		if (cat === 'macos') return 'macOS';
		if (cat === 'macro') return 'Macro';
		if (cat === 'pro') return 'Pro';
		return 'Other';
	}

	static async renderTroubleshooting(container) {
		Pages.setRouteTitle('Troubleshooting');

		container.innerHTML = `
			<div class="page-shell">
				<section class="page-hero">
					<div class="eyebrow">Troubleshooting</div>
					<h1>Find and apply the fix fast.</h1>
					<p class="lead">Filter by category, search keywords, and open the exact walkthrough.</p>
				</section>

				<section class="surface">
					<div class="toolbar">
						<div class="search">
							<span class="search-icon">🔍</span>
							<input id="fixSearch" type="search" placeholder="Search fixes..." autocomplete="off" />
						</div>

						<div class="filter-chips" id="fixChips">
							<button class="chip active" data-cat="all" type="button">All</button>
							<button class="chip" data-cat="windows" type="button">Windows</button>
							<button class="chip" data-cat="macos" type="button">macOS</button>
							<button class="chip" data-cat="macro" type="button">Macro</button>
							<button class="chip" data-cat="pro" type="button">Pro</button>
						</div>
					</div>

					<div id="fixList" class="accordion-list">
						<div class="loading"><div class="spinner"></div></div>
					</div>
				</section>
			</div>
		`;

		// Pull approved issues
		const issues = await githubAPI.getTroubleshootingIssues('approved');
		const listEl = document.getElementById('fixList');
		if (!listEl) return;

		if (!Array.isArray(issues) || issues.length === 0) {
			listEl.innerHTML = `
				<div class="empty-state">
					<div class="empty-icon">🛠️</div>
					<h2>No fixes found</h2>
					<p>There are no approved troubleshooting issues available right now.</p>
				</div>
			`;
			return;
		}

		// Normalize + filter out PRs (GitHub returns PRs in issues API)
		const normalized = issues
			.filter((i) => !i?.pull_request)
			.map((i) => {
				const cat = Pages.issueCategoryFromLabels(i.labels || []);
				return {
					id: i.id,
					number: i.number,
					title: i.title || '(Untitled)',
					body: i.body || '',
					html_url: i.html_url || '',
					labels: i.labels || [],
					category: cat,
					updated_at: i.updated_at,
				};
			});

		// Render function
		const renderList = (activeCat, query) => {
			const q = String(query || '').trim().toLowerCase();

			const filtered = normalized.filter((item) => {
				const catOk = activeCat === 'all' ? true : item.category === activeCat;
				if (!catOk) return false;

				if (!q) return true;

				return (
					item.title.toLowerCase().includes(q) ||
					item.body.toLowerCase().includes(q) ||
					Pages.issueCategoryLabel(item.category).toLowerCase().includes(q)
				);
			});

			if (filtered.length === 0) {
				listEl.innerHTML = `
					<div class="empty-state">
						<div class="empty-icon">🔎</div>
						<h2>No matches</h2>
						<p>Try a different category or search term.</p>
					</div>
				`;
				return;
			}

			listEl.innerHTML = filtered
				.map((item) => {
					const pill = Pages.issueCategoryLabel(item.category);
					const bodyHtml = window.markdown?.render
						? window.markdown.render(item.body, { breaks: true })
						: `<pre>${Pages.escapeHtml(item.body)}</pre>`;

					return `
						<div class="accordion-card" data-acc="${Pages.escapeHtml(item.number)}">
							<button class="accordion-head" type="button">
								<div class="accordion-meta">
									<span class="pill">${Pages.escapeHtml(pill)}</span>
									<span class="accordion-title">${Pages.escapeHtml(item.title)}</span>
								</div>
								<span class="chevron">▼</span>
							</button>

							<div class="accordion-body">
								<div class="prose">
									${bodyHtml}
									<p style="margin-top:10px;opacity:.85;">
										<a href="${Pages.escapeHtml(item.html_url)}" target="_blank" rel="noopener noreferrer">
											View on GitHub (#${Pages.escapeHtml(item.number)})
										</a>
									</p>
								</div>
							</div>
						</div>
					`;
				})
				.join('');

			// Make accordion clickable (event delegation)
			listEl.onclick = (e) => {
				const head = e.target.closest('.accordion-head');
				if (!head) return;

				const card = head.closest('.accordion-card');
				if (!card) return;

				const body = card.querySelector('.accordion-body');
				if (!body) return;

				const isOpen = card.classList.contains('open');

				// close all
				listEl.querySelectorAll('.accordion-card.open').forEach((c) => {
					if (c === card) return;
					c.classList.remove('open');
					const b = c.querySelector('.accordion-body');
					if (b) b.style.maxHeight = '0px';
				});

				// toggle current
				if (isOpen) {
					card.classList.remove('open');
					body.style.maxHeight = '0px';
				} else {
					card.classList.add('open');
					body.style.maxHeight = body.scrollHeight + 'px';
				}
			};

			// Ensure maxHeight is correct if images load after open
			listEl.querySelectorAll('img').forEach((img) => {
				img.addEventListener('load', () => {
					const openCard = img.closest('.accordion-card.open');
					if (!openCard) return;
					const openBody = openCard.querySelector('.accordion-body');
					if (openBody) openBody.style.maxHeight = openBody.scrollHeight + 'px';
				});
			});
		};

		// Chip + Search wiring
		let activeCat = 'all';
		let query = '';

		const chipsEl = document.getElementById('fixChips');
		const searchEl = document.getElementById('fixSearch');

		if (chipsEl) {
			chipsEl.onclick = (e) => {
				const btn = e.target.closest('button[data-cat]');
				if (!btn) return;

				chipsEl.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
				btn.classList.add('active');

				activeCat = btn.getAttribute('data-cat') || 'all';
				renderList(activeCat, query);
			};
		}

		if (searchEl) {
			searchEl.addEventListener('input', () => {
				query = searchEl.value || '';
				renderList(activeCat, query);
			});
		}

		// Initial render
		renderList(activeCat, query);
	}

	// -----------------------------
	// CHANGELOG (Releases)
	// -----------------------------

	static async renderChangelog(container) {
		Pages.setRouteTitle('Changelog');

		container.innerHTML = `
			<div class="page-shell">
				<section class="page-hero">
					<div class="eyebrow">Changelog</div>
					<h1>Latest releases</h1>
					<p class="lead">Pulled from the official Revolution Macro releases.</p>
				</section>

				<section class="release-grid" id="releaseGrid">
					<div class="loading"><div class="spinner"></div></div>
				</section>
			</div>
		`;

		const releases = await githubAPI.getReleases();
		const grid = document.getElementById('releaseGrid');
		if (!grid) return;

		if (!Array.isArray(releases) || releases.length === 0) {
			grid.innerHTML = `
				<div class="empty-state">
					<div class="empty-icon">📦</div>
					<h2>No releases found</h2>
					<p>Could not load releases from GitHub.</p>
				</div>
			`;
			return;
		}

		grid.innerHTML = releases
			.map((r) => {
				const name = r.name || r.tag_name || 'Release';
				const date = r.published_at ? githubAPI.formatDate(r.published_at) : '';
				const body = r.body ? window.markdown.render(r.body, { breaks: true }) : '';
				const assets = Array.isArray(r.assets) ? r.assets : [];

				return `
					<article class="surface release-card">
						<div class="release-header">
							<div>
								<div class="pill">${Pages.escapeHtml(date)}</div>
								<div class="release-title">${Pages.escapeHtml(name)}</div>
							</div>
							<div class="release-tags">
								<a class="download-chip" href="${Pages.escapeHtml(r.html_url)}" target="_blank" rel="noopener noreferrer">
									View on GitHub
								</a>
							</div>
						</div>
						<div class="release-body prose">${body}</div>

						${
							assets.length
								? `<div class="release-downloads">
									${assets
										.slice(0, 8)
										.map((a) => {
											return `<a class="download-chip" href="${Pages.escapeHtml(
												a.browser_download_url
											)}" target="_blank" rel="noopener noreferrer">
												<span class="download-name">${Pages.escapeHtml(a.name)}</span>
												<span class="download-size">${Pages.escapeHtml(
													githubAPI.formatSize(a.size)
												)}</span>
											</a>`;
										})
										.join('')}
								</div>`
								: ''
						}
					</article>
				`;
			})
			.join('');
	}

	// -----------------------------
	// 404
	// -----------------------------

	static render404(container) {
		Pages.setRouteTitle('Not found');
		container.innerHTML = `
			<div class="page-shell">
				<div class="empty-state">
					<div class="empty-icon">❓</div>
					<h2>Page not found</h2>
					<p>That route does not exist.</p>
				</div>
			</div>
		`;
	}
}

window.Pages = Pages;


