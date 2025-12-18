/**
 * Main Application
 * - Router init
 * - Back-to-top
 * - Drawer (Quick Jump) open/close works on ALL routes
 * - Pre-loads guide sections to populate Quick Jump immediately
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

			// Populate drawer ASAP (so hamburger works even before visiting Guide)
			try {
				const res = await fetch("data/guide-sections.json", { cache: "no-store" });
				if (res.ok) {
					const json = await res.json();
					const sections = Array.isArray(json?.sections) ? json.sections : [];
					Pages.renderDrawerGuideNav(sections);
				}
			} catch (e) {
				// no hard fail
				console.warn("Could not pre-load guide sections:", e);
			}

			this.initialized = true;
		} catch (error) {
			console.error("App initialization error:", error);
		}
	}

	setupDrawer() {
		const toggleBtn = document.getElementById("drawerToggle");
		const closeBtn = document.getElementById("drawerClose");
		const overlay = document.getElementById("drawerOverlay");
		const drawer = document.getElementById("drawer");
		const topBtn = document.getElementById("drawerTopBtn");

		if (!toggleBtn || !closeBtn || !overlay || !drawer) return;

		const open = () => {
			drawer.hidden = false;
			overlay.hidden = false;
			requestAnimationFrame(() => {
				drawer.classList.add("open");
				overlay.classList.add("open");
				toggleBtn.setAttribute("aria-expanded", "true");
			});
		};

		const close = () => {
			drawer.classList.remove("open");
			overlay.classList.remove("open");
			toggleBtn.setAttribute("aria-expanded", "false");
			window.setTimeout(() => {
				drawer.hidden = true;
				overlay.hidden = true;
			}, 180);
		};

		toggleBtn.addEventListener("click", () => {
			const isOpen = toggleBtn.getAttribute("aria-expanded") === "true";
			isOpen ? close() : open();
		});

		closeBtn.addEventListener("click", close);
		overlay.addEventListener("click", close);

		document.addEventListener("keydown", (e) => {
			if (e.key === "Escape") close();
		});

		document.addEventListener("revo:drawer-close", close);

		if (topBtn) {
			topBtn.addEventListener("click", () => {
				close();
				window.scrollTo({ top: 0, behavior: "smooth" });
			});
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
}

const app = new App();

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", () => app.init());
} else {
	app.init();
}


