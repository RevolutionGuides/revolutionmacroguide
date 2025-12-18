/**
 * Main Application
 * Orchestrates all components
 */

class App {
	constructor() {
		this.initialized = false;
	}

	async init() {
		if (this.initialized) return;

		try {
			router.init();
			this.setupBackToTop();
			this.initialized = true;
		} catch (error) {
			console.error('App initialization error:', error);
		}
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
