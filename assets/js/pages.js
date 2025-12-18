/**
 * Page Components (English-only UI)
 * Renders modernized views for guide, troubleshooting, and changelog.
 */

const UI_COPY = {
	links: {
		download: 'https://github.com/nosyliam/revolution-macro/releases/latest',
		repo: 'https://github.com/nosyliam/revolution-macro',
	},
	guide: {
		tag: 'Guide',
		title: 'Revolution Macro, clearly explained.',
		subtitle: 'Install, configure, and optimize the macro without guesswork.',
		ctaPrimary: 'Download macro',
		ctaSecondary: 'View troubleshooting',
		panelTitle: 'Chapters',
	},
	troubleshooting: {
		tag: 'Troubleshooting',
		title: 'Find and apply the fix fast.',
		subtitle:
			'Filter by platform, search keywords, and open the exact walkthrough.',
		searchPlaceholder: 'Search fixes...',
		filters: {
			all: 'All platforms',
			windows: 'Windows',
			mac: 'macOS',
		},
		noResults: 'No fixes found yet. Check back soon.',
	},
	changelog: {
		tag: 'Changelog',
		title: 'Latest releases from GitHub.',
		subtitle: 'See what changed before you update.',
		noReleases: 'No releases published yet.',
	},
};

const PLATFORM_LABELS = {
	windows: 'Windows',
	mac: 'macOS',
	general: 'All platforms',
};

class Pages {
	static async renderGuide(container) {
		container.innerHTML = `
			<div class="page-shell">
				<section class="page-hero">
					<div class="eyebrow">${UI_COPY.guide.tag}</div>
					<h1>${UI_COPY.guide.title}</h1>
					<p class="lead">${UI_COPY.guide.subtitle}</p>
					<div class="hero-actions">
						<a class="btn btn-primary" target="_blank" rel="noopener noreferrer" href="${UI_COPY.links.download}">${UI_COPY.guide.ctaPrimary}</a>
						<a class="btn btn-ghost" href="#/troubleshooting">${UI_COPY.guide.ctaSecondary}</a>
					</div>
				</section>

				<section class="guide-grid">
					<aside class="surface side-panel">
						<div class="panel-head">${UI_COPY.guide.panelTitle}</div>
						<nav id="guideNav" class="guide-nav"></nav>
					</aside>
					<article class="surface guide-article">
						<div id="guideContent" class="prose"></div>
					</article>
				</section>
			</div>
		`;

		await this.loadGuideContent();
	}

	static async loadGuideContent() {
		try {
			const response = await fetch('data/guide-sections.json');
			const sections = await response.json();
			this.guideSections = sections.sections;

			const tocNav = document.getElementById('guideNav');
			let tocHtml = '';

			this.guideSections.forEach((section, idx) => {
				const title = section.titleEn || section.title || `Section ${idx + 1}`;
				tocHtml += `
					<button class="guide-link" data-file="${section.file}" data-scroll="">
						<span class="guide-index">${String(idx + 1).padStart(2, '0')}</span>
						<span class="guide-title">${title}</span>
					</button>
				`;

				if (section.subsections) {
					section.subsections.forEach((sub) => {
						const subTitle = sub.titleEn || sub.title || 'Subsection';
						tocHtml += `
							<button class="guide-link sub" data-file="${section.file}" data-scroll="${subTitle}">
								<span class="guide-index">—</span>
								<span class="guide-title">${subTitle}</span>
							</button>
						`;
					});
				}
			});

			tocNav.innerHTML = tocHtml;

			tocNav.querySelectorAll('.guide-link[data-file]').forEach((link) => {
				link.addEventListener('click', async (e) => {
					e.preventDefault();
					const file = link.getAttribute('data-file');
					const scrollText = (link.getAttribute('data-scroll') || '').trim();
					if (file) {
						await this.loadMarkdownFile(file);
					}
					if (scrollText) {
						this.scrollGuideToHeading(scrollText);
					}
				});
			});

			if (this.guideSections.length > 0) {
				const firstFile = this.guideSections[0].file;
				await this.loadMarkdownFile(firstFile);
			}
		} catch (error) {
			console.error('Error loading guide:', error);
		}
	}

	static scrollGuideToHeading(queryText) {
		const root = document.getElementById('guideContent');
		if (!root) return;
		const q = queryText.toLowerCase();
		const headings = root.querySelectorAll('h2, h3');
		for (const heading of headings) {
			const t = (heading.textContent || '').trim().toLowerCase();
			if (t.includes(q)) {
				heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
				return;
			}
		}
	}

	static async loadMarkdownFile(filepath) {
		try {
			const response = await fetch(filepath);
			const markdown = await response.text();
			this.currentGuideFile = filepath;
			const html = window.markdown?.render
				? window.markdown.render(markdown, { breaks: false })
				: markdown;
			document.getElementById('guideContent').innerHTML = html;
		} catch (error) {
			console.error('Error loading markdown:', error);
		}
	}

	static async renderTroubleshooting(container) {
		container.innerHTML = `
			<div class="page-shell">
				<section class="page-hero">
					<div class="eyebrow">${UI_COPY.troubleshooting.tag}</div>
					<h1>${UI_COPY.troubleshooting.title}</h1>
					<p class="lead">${UI_COPY.troubleshooting.subtitle}</p>
				</section>

				<section class="surface">
					<div class="toolbar">
						<div class="search">
							<span class="search-icon">🔍</span>
							<input
								type="search"
								id="troubleSearch"
								placeholder="${UI_COPY.troubleshooting.searchPlaceholder}"
								aria-label="Search troubleshooting"
							/>
						</div>
						<div class="filter-chips" id="platformFilters">
							<button class="chip active" data-platform="all">${UI_COPY.troubleshooting.filters.all}</button>
							<button class="chip" data-platform="windows">${UI_COPY.troubleshooting.filters.windows}</button>
							<button class="chip" data-platform="mac">${UI_COPY.troubleshooting.filters.mac}</button>
						</div>
					</div>
					<div id="troubleList" class="accordion-list"></div>
				</section>
			</div>
		`;

		await this.loadTroubleshootingData();
		this.setupTroubleshootingListeners();
	}

	static async loadTroubleshootingData() {
		try {
			const issues = await githubAPI.getTroubleshootingIssues('approved');
			this.allTroubleshootingIssues = issues || [];
			this.troubleshootingSearchIndex = this.buildTroubleshootingSearchIndex(
				this.allTroubleshootingIssues
			);

			if (
				!this.allTroubleshootingIssues ||
				this.allTroubleshootingIssues.length === 0
			) {
				document.getElementById('troubleList').innerHTML = `
					<div class="empty-state">
						<div class="empty-icon">📋</div>
						<p>${UI_COPY.troubleshooting.noResults}</p>
					</div>
				`;
				return;
			}

			this.renderTroubleshootingItems(this.allTroubleshootingIssues);
		} catch (error) {
			console.error('Error loading troubleshooting:', error);
		}
	}

	static buildTroubleshootingSearchIndex(issues) {
		return (issues || []).map((issue) => {
			const title = (issue?.title || '').toString();
			const body = (issue?.body || '').toString();
			const labels = (issue?.labels || [])
				.map((l) => l?.name)
				.filter(Boolean)
				.join(' ');
			const text = `${title}\n${labels}\n${body}`;
			return this.normalizeSearchText(this.stripMarkdownToText(text));
		});
	}

	static normalizeSearchText(text) {
		return (text || '').toString().toLowerCase().replace(/\s+/g, ' ').trim();
	}

	static stripMarkdownToText(markdown) {
		let text = (markdown || '').toString();
		text = text.replace(/```[\s\S]*?```/g, ' ');
		text = text.replace(/`[^`]*`/g, ' ');
		text = text.replace(/!\[([^\]]*)\]\([^\)]*\)/g, '$1');
		text = text.replace(/\[([^\]]+)\]\([^\)]*\)/g, '$1');
		text = text.replace(/<[^>]+>/g, ' ');
		text = text.replace(/^\s{0,3}(#{1,6}|>|-|\*|\+|\d+\.)\s+/gm, ' ');
		text = text.replace(/[\u2010-\u2015]/g, '-');
		return text;
	}

	static renderTroubleshootingItems(issues) {
		const accordion = document.getElementById('troubleList');
		let html = '';

		issues.forEach((issue, index) => {
			const labelNames = issue.labels?.map((l) => l.name) || [];
			let platform = 'general';
			if (labelNames.includes('windows')) platform = 'windows';
			else if (labelNames.includes('mac')) platform = 'mac';

			const body = issue.body || 'No description available';
			let displayTitle = issue.title;
			let displayBody = body;

			if (
				issue.title.trim() === '[Fix]' ||
				issue.title.trim().match(/^\[\w+\]$/)
			) {
				const problemMatch = body.match(/###\s+Problem title\s*\n\n([^\n]+)/);
				if (problemMatch) displayTitle = problemMatch[1];
			}

			displayTitle = displayTitle.replace(/^\s*\[\w+\]\s*/, '').trim();

			const htmlImgMatches =
				displayBody.match(/<img[^>]+src=[\"']([^\"']+)[\"'][^>]*>/g) || [];
			const mdImgUrls = Array.from(
				displayBody.matchAll(/!\[[^\]]*\]\(([^)\s]+)(?:\s+\"[^\"]*\")?\)/g)
			).map((m) => m[1]);
			let imagesHtml = '';
			if (htmlImgMatches.length > 0 || mdImgUrls.length > 0) {
				imagesHtml = '<div class="issue-media">';
				htmlImgMatches.forEach((img) => {
					const srcMatch = img.match(/src=[\"']([^\"']+)[\"']/);
					if (srcMatch) {
						imagesHtml += `<div class="media-frame"><img src="${srcMatch[1]}" alt="Issue" /></div>`;
					}
				});
				mdImgUrls.forEach((src) => {
					imagesHtml += `<div class="media-frame"><img src="${src}" alt="Issue" /></div>`;
				});
				imagesHtml += '</div>';
			}

			displayBody = displayBody.replace(/<img[^>]+>/g, '');
			displayBody = displayBody.replace(
				/!\[[^\]]*\]\(([^)\s]+)(?:\s+\"[^\"]*\")?\)/g,
				''
			);

			html += `
				<div class="accordion-card" data-platform="${platform}" data-index="${index}">
					<button class="accordion-head" aria-expanded="false">
						<div class="accordion-meta">
							<span class="pill">${
								PLATFORM_LABELS[platform] || PLATFORM_LABELS.general
							}</span>
							<span class="accordion-title">${displayTitle}</span>
						</div>
						<span class="chevron">▼</span>
					</button>
					<div class="accordion-body">
						${imagesHtml}
						<div class="prose">${
							window.markdown?.render
								? window.markdown.render(displayBody, { breaks: true })
								: displayBody
						}</div>
					</div>
				</div>
			`;
		});

		accordion.innerHTML = html;

		accordion.querySelectorAll('.accordion-card').forEach((item) => {
			const head = item.querySelector('.accordion-head');
			const body = item.querySelector('.accordion-body');
			head.addEventListener('click', () => {
				const open = item.classList.toggle('open');
				head.setAttribute('aria-expanded', open ? 'true' : 'false');
				if (open) {
					body.style.maxHeight = `${body.scrollHeight}px`;
					body.classList.add('open');
				} else {
					body.style.maxHeight = '0px';
					body.classList.remove('open');
				}
			});
			body.style.maxHeight = '0px';
		});
	}

	static setupTroubleshootingListeners() {
		const searchInput = document.getElementById('troubleSearch');
		searchInput.addEventListener('input', () => this.filterTroubleshooting());

		document.querySelectorAll('#platformFilters .chip').forEach((btn) => {
			btn.addEventListener('click', () => {
				document
					.querySelectorAll('#platformFilters .chip')
					.forEach((b) => b.classList.remove('active'));
				btn.classList.add('active');
				this.filterTroubleshooting();
			});
		});
	}

	static filterTroubleshooting() {
		const searchTermRaw = document.getElementById('troubleSearch')?.value || '';
		const searchTerm = this.normalizeSearchText(searchTermRaw);
		const tokens = searchTerm.split(' ').filter(Boolean);
		const platformFilter =
			document.querySelector('#platformFilters .chip.active')?.dataset
				.platform || 'all';

		document.querySelectorAll('.accordion-card').forEach((item) => {
			const platform = item.dataset.platform;
			const index = Number.parseInt(item.dataset.index || '0', 10);
			const haystack =
				this.troubleshootingSearchIndex?.[index] ||
				this.normalizeSearchText(item.textContent);

			const matchesPlatform =
				platformFilter === 'all' || platform === platformFilter;
			const matchesSearch =
				tokens.length === 0 || tokens.every((t) => haystack.includes(t));

			item.style.display = matchesPlatform && matchesSearch ? 'block' : 'none';
		});
	}

	static async renderChangelog(container) {
		container.innerHTML = `
			<div class="page-shell">
				<section class="page-hero">
					<div class="eyebrow">${UI_COPY.changelog.tag}</div>
					<h1>${UI_COPY.changelog.title}</h1>
					<p class="lead">${UI_COPY.changelog.subtitle}</p>
					<div class="hero-actions">
						<a class="btn btn-primary" target="_blank" rel="noopener noreferrer" href="${UI_COPY.links.download}">Download latest</a>
						<a class="btn btn-ghost" target="_blank" rel="noopener noreferrer" href="${UI_COPY.links.repo}">View repository</a>
					</div>
				</section>
				<section id="releasesList" class="release-grid"></section>
			</div>
		`;

		await this.loadChangelogData();
	}

	static async loadChangelogData() {
		try {
			const releases = await githubAPI.getReleases();

			if (!releases || releases.length === 0) {
				document.getElementById('releasesList').innerHTML = `
					<div class="empty-state">
						<div class="empty-icon">📦</div>
						<p>${UI_COPY.changelog.noReleases}</p>
					</div>
				`;
				return;
			}

			this.renderReleases(releases);
		} catch (error) {
			console.error('Error loading changelog:', error);
		}
	}

	static renderReleases(releases) {
		const container = document.getElementById('releasesList');
		let html = '';

		releases.forEach((release) => {
			const formattedDate = githubAPI.formatDate(release.published_at);
			const body = release.body || 'No description available';
			const prereleaseBadge = release.prerelease
				? `<span class="pill pill-soft">Pre-release</span>`
				: '';

			const parsedBody = window.markdown?.render
				? window.markdown.render(body, { breaks: false })
				: body;

			let downloadsHtml = '';
			if (release.assets && release.assets.length > 0) {
				downloadsHtml = '<div class="release-downloads">';
				release.assets.forEach((asset) => {
					const size = githubAPI.formatSize(asset.size);
					downloadsHtml += `
						<a href="${asset.browser_download_url}" class="download-chip" target="_blank" rel="noopener noreferrer">
							<span class="download-name">${asset.name}</span>
							<span class="download-size">${size}</span>
						</a>
					`;
				});
				downloadsHtml += '</div>';
			}

			html += `
				<article class="release-card surface">
					<header class="release-header">
						<div>
							<div class="eyebrow">${formattedDate}</div>
							<h2 class="release-title">${release.name || release.tag_name}</h2>
						</div>
						<div class="release-tags">
							<span class="pill">${release.tag_name}</span>
							${prereleaseBadge}
						</div>
					</header>
					<div class="release-body prose">${parsedBody}</div>
					${downloadsHtml}
				</article>
			`;
		});

		container.innerHTML = html;
	}

	static render404(container) {
		container.innerHTML = `
			<div class="page-shell">
				<section class="surface empty-state">
					<div class="empty-icon">404</div>
					<h1>Page not found</h1>
					<p>The page you're looking for doesn't exist.</p>
					<a href="#/guide" class="btn btn-primary" style="margin-top: 1rem;">Go home</a>
				</section>
			</div>
		`;
	}
}
