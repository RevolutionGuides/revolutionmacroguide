/**
 * Router
 * Handles client-side routing
 */

class Router {
	constructor() {
		this.routes = {
			'/': () => Pages.renderGuide(this.container),
			'/guide': () => Pages.renderGuide(this.container),
			'/troubleshooting': () => Pages.renderTroubleshooting(this.container),
			'/changelog': () => Pages.renderChangelog(this.container),
		};

		this.container = document.getElementById('app');
	}

	init() {
		// Default route
		if (!window.location.hash) {
			window.location.hash = '#/guide';
		}

		// Handle initial route
		this.navigate();

		// Handle hash changes
		window.addEventListener('hashchange', () => this.navigate());

		// Handle nav links (hash routes)
		document.querySelectorAll('.nav-link').forEach((link) => {
			link.addEventListener('click', (e) => {
				const href = link.getAttribute('href') || '';
				if (href.startsWith('#/')) {
					e.preventDefault();
					window.location.hash = href;
				}
			});
		});
	}

	getCurrentPath() {
		const raw = window.location.hash || '#/guide';
		const path = raw.startsWith('#') ? raw.slice(1) : raw;
		return path || '/guide';
	}

	async navigate() {
		const path = this.getCurrentPath();
		const route = this.routes[path] || this.routes['/'];

		// Show loading state
		this.container.innerHTML =
			'<div class="loading"><div class="spinner"></div></div>';

		try {
			await route();
		} catch (error) {
			console.error('Route error:', error);
			Pages.render404(this.container);
		}

		this.updateActiveNav(path);
	}

	updateActiveNav(path = this.getCurrentPath()) {
		document.querySelectorAll('.nav-link').forEach((link) => {
			const href = link.getAttribute('href');
			link.classList.remove('active');
			if (href === `#${path}` || (path === '/' && href === '#/guide')) {
				link.classList.add('active');
			}
		});
	}
}

const router = new Router();
