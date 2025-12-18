/**
 * Main Application
 * - Router init
 * - Back-to-top
 * - Drawer (Quick Jump): open/close, overlay, ESC
 * - Preload guide sections to populate quick-jump immediately
 */

class App {
	constructor() {
		this.initialized = false;
	}

	async init() {
		if (this.initialized) return;

		try {
			this.setupDrawer();
			router.init();
			this.setupBackToTop();

			// Preload sections so hamburger menu has links immediately
			try {
				const res = await fetch('data/guide-sections.json', { cache: 'no-store' });
				if (res.ok) {
					const json = await res.json();
					const sections = Array.isArray(json?.sections) ? json.sections : [];
					if (window.Pages?.renderDrawerGuideNav) {
						window.Pages.renderDrawerGuideNav(sections);
					}
				}
			} catch (e) {
				console.warn('Quick Jump preload failed:', e);
			}

			this.initialized = true;
		} catch (error) {
			console.error('App initialization error:', error);
		}
	}

	setupDrawer() {
		const toggleBtn = document.getElementById('drawerToggle');
		const closeBtn = document.getElementById('drawerClose');
		const overlay = document.getElementById('drawerOverlay');
		const drawer = document.getElementById('drawer');
		const topBtn = document.getElementById('drawerTopBtn');

		if (!toggleBtn || !overlay || !drawer) return;

		const open = () => {
			overlay.hidden = false;
			drawer.hidden = false;

			// next tick so transitions apply
			requestAnimationFrame(() => {
				overlay.classList.add('open');
				drawer.classList.add('open');
				toggleBtn.setAttribute('aria-expanded', 'true');
				overlay.setAttribute('aria-hidden', 'false');
				drawer.setAttribute('aria-hidden', 'false');
			});
		};

		const close = () => {
			overlay.classList.remove('open');
			drawer.classList.remove('open');
			toggleBtn.setAttribute('aria-expanded', 'false');
			overlay.setAttribute('aria-hidden', 'true');
			drawer.setAttribute('aria-hidden', 'true');

			// hide after transition
			window.setTimeout(() => {
				overlay.hidden = true;
				drawer.hidden = true;
			}, 180);
		};

		toggleBtn.addEventListener('click', () => {
			const isOpen = toggleBtn.getAttribute('aria-expanded') === 'true';
			isOpen ? close() : open();
		});

		overlay.addEventListener('click', close);
		closeBtn?.addEventListener('click', close);

		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') close();
		});

		// allow Router to close drawer on navigation
		document.addEventListener('revo:drawer-close', close);

		topBtn?.addEventListener('click', () => {
			close();
			window.scrollTo({ top: 0, behavior: 'smooth' });
		});
	}

	setupBackToTop() {
		const backToTopBtn = document.getElementById('backToTopBtn');
		if (!backToTopBtn) return;

		const toggle = () => {
			backToTopBtn.classList.toggle('visible', window.scrollY > 320);
		};

		window.addEventListener('scroll', toggle);
		backToTopBtn.addEventListener('click', () => {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		});
		toggle();
	}
}

const app = new App();

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', () => app.init());
} else {
	app.init();
}



