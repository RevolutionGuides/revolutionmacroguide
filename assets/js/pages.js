/**
 * Pages
 * - Guide: loads all markdown sections listed in data/guide-sections.json
 * - Quick Jump: shows exactly 6 tabs (gather/collect/planters/status/tools/settings)
 * - Troubleshooting: loads GitHub issues (label: approved) and filters by category labels
 * - Changelog: loads GitHub releases
 */

class Pages {
	static pendingScrollKey = '__revo_pending_scroll_id__';

	// ---------- helpers ----------
	static setPendingScroll(id) {
		try { sessionStorage.setItem(Pages.pendingScrollKey, id); } catch {}
	}
	static consumePendingScroll() {
		try {
			const id = sessionStorage.getItem(Pages.pendingScrollKey);
			if (id) sessionStorage.removeItem(Pages.pendingScrollKey);
			return id || null;
		} catch {
			return null;
		}
	}

	static headerOffsetPx() {
		// slightly smaller than before -> scroll lands a bit LOWER
		const header = document.querySelector('.site-header');
		const h = header ? header.getBoundingClientRect().height : 70;
		return Math.round(h + 10);
	}

	static scrollToId(id) {
		const el = document.getElementById(id);
		if (!el) return false;

		el.scrollIntoView({ behavior: 'smooth', block: 'start' });

		// nudge up slightly (LESS than before)
		window.setTimeout(() => {
			window.scrollBy({ top: -Pages.headerOffsetPx(), left: 0, behavior: 'smooth' });
		}, 60);

		return true;
	}

	static async goToGuideAndScroll(id) {
		const hash = window.location.hash || '#/guide';
		if (hash === '#/guide' || hash === '#/' || hash === '#') {
			Pages.scrollToId(id);
			return;
		}
		Pages.setPendingScroll(id);
		window.location.hash = '#/guide';
	}

	static async fetchJson(path) {
		const res = await fetch(path, { cache: 'no-store' });
		if (!res.ok) throw new Error(`Failed JSON: ${path} (${res.status})`);
		return await res.json();
	}

	static async fetchText(path) {
		const res = await fetch(path, { cache: 'no-store' });
		if (!res.ok) throw new Error(`Failed text: ${path} (${res.status})`);
		return await res.text();
	}

	static escapeHtml(text) {
		return String(text)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	// ---------- Drawer Quick Jump ----------
	static renderDrawerGuideNav(sections) {
		const host = document.getElementById('drawerGuideNav');
		if (!host) return;

		// EXACTLY the 6 tabs you want:
		const wanted = [
			'gather-tab',
			'collect-tab',
			'planters-tab',
			'status-tab',
			'tools-tab',
			'settings-tab',
		];

		const byId = new Map((sections || []).map((s) => [String(s.id || ''), s]));
		const quick = wanted.map((id) => byId.get(id)).filter(Boolean);

		host.innerHTML = quick
			.map((s, i) => {
				const title = s.titleEn || s.id;
				return `
					<button class="guide-link" type="button" data-jump-id="${Pages.escapeHtml(s.id)}">
						<span class="guide-index">${i + 1}</span>
						<span class="guide-text">${Pages.escapeHtml(title)}</span>
					</button>
				`;
			})
			.join('');

		// Click works from any route; if not on guide, route then scroll.
		host.querySelectorAll('[data-jump-id]').forEach((btn) => {
			btn.addEventListener('click', async () => {
				const id = btn.getAttribute('data-jump-id');
				if (!id) return;
				document.dispatchEvent(new CustomEvent('revo:drawer-close'));
				await Pages.goToGuideAndScroll(id);
			});
		});
	}

	// ---------- Guide ----------
	static async renderGuide(container) {
		container.innerHTML = `
			<section class="container page-shell page-enter">
				<div class="page-hero">
					<div class="eyebrow">GUIDE</div>
					<h1>Revolution Macro Guide</h1>
					<p class="lead">All sections load from your markdown files.</p>
				</div>

				<div class="surface guide-grid single">
					<div class="prose" id="guideRoot">
						<div class="loading"><div class="spinner"></div></div>
					</div>
				</div>
			</section>
		`;

		const guideRoot = document.getElementById('guideRoot');

		let sectionsJson;
		try {
			sectionsJson = await Pages.fetchJson('data/guide-sections.json');
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

		const sections = Array.isArray(sectionsJson?.sections) ? sectionsJson.sections : [];

		// build continuous page
		let html = '';
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

		// populate quick jump
		Pages.renderDrawerGuideNav(sections);

		// if we came here from another route and need to scroll
		const pending = Pages.consumePendingScroll();
		if (pending) {
			window.setTimeout(() => Pages.scrollToId(pending), 130);
		}
	}

	// ---------- Troubleshooting ----------
	static async renderTroubleshooting(container) {
		// Open issues: plain, no forced search text
		const openIssuesUrl =
			'https://github.com/RevolutionGuides/revolutionmacroguide/issues';

		// Submit fix: blank title, body prompt only
		const submitFixUrl =
			'https://github.com/RevolutionGuides/revolutionmacroguide/issues/new' +
			'?body=' +
			encodeURIComponent('Explain clearly how you solved the issue.');

		container.innerHTML = `
			<section class="container page-shell page-enter">
				<div class="page-hero">
					<div class="eyebrow">TROUBLESHOOTING</div>
					<h1>Fix it fast.</h1>
					<p class="lead">Pulled from approved GitHub issues.</p>

					<div class="hero-actions">
						<a class="btn btn-ghost" href="${openIssuesUrl}" target="_blank" rel="noopener noreferrer">Open Issues</a>
						<a class="btn btn-primary" href="${submitFixUrl}" target="_blank" rel="noopener noreferrer">Submit Fix</a>
					</div>
				</div>

				<div class="surface">
					<div class="toolbar">
						<div class="search">
							<span class="search-icon">🔎</span>
							<input id="fixSearch" type="text" placeholder="Search fixes..." autocomplete="off" />
						</div>

						<div class="filter-chips" id="fixFilters">
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
				</div>
			</section>
		`;

		const list = document.getElementById('fixList');
		const input = document.getElementById('fixSearch');
		const filters = document.getElementById('fixFilters');

		let activeCat = 'all';
		let query = '';

		const issues = (await githubAPI.getTroubleshootingIssues('approved')) || [];

		const normalized = issues
			.filter((i) => !i.pull_request)
			.map((i) => {
				const title = i.title || '';
				const body = i.body || '';
				const labels = (i.labels || []).map((l) => String(l.name || '').toLowerCase());

				// category detection: keep macro + pro
				let cat = 'macro';
				if (labels.includes('windows')) cat = 'windows';
				else if (labels.includes('macos') || labels.includes('mac')) cat = 'macos';
				else if (labels.includes('pro')) cat = 'pro';
				else if (labels.includes('macro')) cat = 'macro';

				return { title, body, labels, category: cat, html_url: i.html_url, number: i.number };
			});

		const matches = (item) => {
			const okCat = activeCat === 'all' ? true : item.category === activeCat;
			if (!okCat) return false;

			if (!query) return true;
			const q = query.toLowerCase();
			return (
				item.title.toLowerCase().includes(q) ||
				item.body.toLowerCase().includes(q) ||
				item.labels.some((l) => l.includes(q))
			);
		};

		const catLabel = (cat) => {
			if (cat === 'windows') return 'Windows';
			if (cat === 'macos') return 'macOS';
			if (cat === 'pro') return 'Pro';
			return 'Macro';
		};

		const render = () => {
			const items = normalized.filter(matches);

			if (!items.length) {
				list.innerHTML = `
					<div class="empty-state">
						<div class="empty-icon">🧩</div>
						<div>No fixes match your filters.</div>
					</div>
				`;
				return;
			}

			list.innerHTML = items
				.map((item) => {
					const rendered = window.markdown?.render
						? window.markdown.render(item.body)
						: `<pre>${Pages.escapeHtml(item.body)}</pre>`;

					return `
						<div class="accordion-card" data-acc="card">
							<button class="accordion-head" type="button" data-acc="toggle" aria-expanded="false">
								<div class="accordion-meta">
									<span class="pill">${catLabel(item.category)}</span>
									<span class="accordion-title">${Pages.escapeHtml(item.title)}</span>
								</div>
								<span class="chevron">▼</span>
							</button>

							<div class="accordion-body" data-acc="body" style="max-height:0px;">
								<div class="prose">
									${rendered}
									<div style="margin-top:12px;">
										<a class="btn btn-ghost" href="${item.html_url}" target="_blank" rel="noopener noreferrer">
											Open on GitHub (#${item.number})
										</a>
									</div>
								</div>
							</div>
						</div>
					`;
				})
				.join('');

			list.querySelectorAll('[data-acc="toggle"]').forEach((btn) => {
				btn.addEventListener('click', () => {
					const card = btn.closest('[data-acc="card"]');
					const body = card?.querySelector('[data-acc="body"]');
					if (!card || !body) return;

					const isOpen = card.classList.toggle('open');
					btn.setAttribute('aria-expanded', String(isOpen));

					if (isOpen) body.style.maxHeight = body.scrollHeight + 28 + 'px';
					else body.style.maxHeight = '0px';
				});
			});
		};

		filters.querySelectorAll('.chip').forEach((btn) => {
			btn.addEventListener('click', () => {
				filters.querySelectorAll('.chip').forEach((b) => b.classList.remove('active'));
				btn.classList.add('active');
				activeCat = btn.getAttribute('data-cat') || 'all';
				render();
			});
		});

		input.addEventListener('input', () => {
			query = input.value || '';
			render();
		});

		render();
	}

	// ---------- Changelog ----------
	static async renderChangelog(container) {
		container.innerHTML = `
			<section class="container page-shell page-enter">
				<div class="page-hero">
					<div class="eyebrow">CHANGELOG</div>
					<h1>Latest releases</h1>
					<p class="lead">Live fetched from GitHub releases.</p>
				</div>

				<div class="surface" id="changelogRoot">
					<div class="loading"><div class="spinner"></div></div>
				</div>
			</section>
		`;

		const root = document.getElementById('changelogRoot');
		const releases = (await githubAPI.getReleases()) || [];

		if (!releases.length) {
			root.innerHTML = `
				<div class="empty-state">
					<div class="empty-icon">📦</div>
					<div>No releases found.</div>
				</div>
			`;
			return;
		}

		root.innerHTML = releases
			.map((r) => {
				const name = r.name || r.tag_name || 'Release';
				const date = r.published_at ? githubAPI.formatDate(r.published_at) : '';
				const body = r.body || '';
				const rendered = window.markdown?.render
					? window.markdown.render(body)
					: `<pre>${Pages.escapeHtml(body)}</pre>`;

				return `
					<div class="accordion-card open" style="margin-bottom:12px;">
						<div class="accordion-head" style="cursor:default;">
							<div class="accordion-meta">
								<span class="pill">Release</span>
								<span class="accordion-title">${Pages.escapeHtml(name)}</span>
								<span class="changelog-date">${Pages.escapeHtml(date)}</span>
							</div>
							<a class="btn btn-ghost" href="${r.html_url}" target="_blank" rel="noopener noreferrer">GitHub</a>
						</div>

						<div class="accordion-body" style="max-height:none;">
							<div class="prose" style="padding:14px 16px 16px;">
								${rendered}
							</div>
						</div>
					</div>
				`;
			})
			.join('');
	}

	static render404(container) {
		container.innerHTML = `
			<section class="container page-shell page-enter">
				<div class="page-hero">
					<div class="eyebrow">404</div>
					<h1>Page not found.</h1>
					<p class="lead">Use the navigation to get back.</p>
				</div>
			</section>
		`;
	}
}

window.Pages = Pages;

