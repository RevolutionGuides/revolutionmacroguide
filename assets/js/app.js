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
			this.setupDrawer();
			this.initialized = true;
		} catch (error) {
			console.error("App initialization error:", error);
		}
	}

	setupBackToTop() {
		const backToTopBtn = document.getElementById("backToTopBtn");
		if (!backToTopBtn) return;

		const toggle = () => {
			backToTopBtn.classList.toggle("visible", window.scrollY > 320);
		};

		window.addEventListener("scroll", toggle);
		backToTopBtn.addEventListener("click", () => {
			window.scrollTo({ top: 0, behavior: "smooth" });
		});
		toggle();
	}

	setupDrawer() {
		const menuBtn = document.getElementById("menuBtn");
		const drawer = document.getElementById("mobileDrawer");
		const backdrop = document.getElementById("drawerBackdrop");
		const closeBtn = document.getElementById("drawerCloseBtn");

		if (!menuBtn || !drawer || !backdrop) return;

		const open = () => {
			drawer.classList.add("open");
			drawer.setAttribute("aria-hidden", "false");
			backdrop.hidden = false;
			menuBtn.setAttribute("aria-expanded", "true");
			document.body.classList.add("no-scroll");
		};

		const close = () => {
			drawer.classList.remove("open");
			drawer.setAttribute("aria-hidden", "true");
			backdrop.hidden = true;
			menuBtn.setAttribute("aria-expanded", "false");
			document.body.classList.remove("no-scroll");
		};

		menuBtn.addEventListener("click", () => {
			if (drawer.classList.contains("open")) close();
			else open();
		});

		backdrop.addEventListener("click", close);
		if (closeBtn) closeBtn.addEventListener("click", close);

		// Close on ESC
		window.addEventListener("keydown", (e) => {
			if (e.key === "Escape" && drawer.classList.contains("open")) close();
		});

		// Close drawer on route change (hashchange)
		window.addEventListener("hashchange", close);

		// Allow Pages.js to close drawer without importing App
		document.addEventListener("revo:drawer-close", close);
	}
}

const app = new App();

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", () => app.init());
} else {
	app.init();
}

