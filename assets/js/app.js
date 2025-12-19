/**
 * Main Application
 * Orchestrates all components + drawer behavior
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
		const toggleBtn = document.getElementById("drawerToggle");
		const drawer = document.getElementById("drawer");
		const overlay = document.getElementById("drawerOverlay");
		const closeBtn = document.getElementById("drawerClose");
		const topBtn = document.getElementById("drawerTopBtn");

		if (!toggleBtn || !drawer || !overlay || !closeBtn) return;

		const open = () => {
			overlay.hidden = false;
			drawer.hidden = false;

			requestAnimationFrame(() => drawer.classList.add("open"));

			toggleBtn.setAttribute("aria-expanded", "true");
			document.body.style.overflow = "hidden";
		};

		const close = () => {
			drawer.classList.remove("open");
			toggleBtn.setAttribute("aria-expanded", "false");
			document.body.style.overflow = "";

			window.setTimeout(() => {
				drawer.hidden = true;
				overlay.hidden = true;
			}, 200);
		};

		// Toggle
		toggleBtn.addEventListener("click", () => {
			const expanded = toggleBtn.getAttribute("aria-expanded") === "true";
			if (expanded) close();
			else open();
		});

		closeBtn.addEventListener("click", close);
		overlay.addEventListener("click", close);

		window.addEventListener("keydown", (e) => {
			if (e.key === "Escape") close();
		});

		// optional “Top” button inside drawer
		if (topBtn) {
			topBtn.addEventListener("click", () => {
				close();
				window.scrollTo({ top: 0, behavior: "smooth" });
			});
		}

		/**
		 * IMPORTANT:
		 * - Drawer link behavior:
		 *   - Works from any page.
		 *   - If you click a guide tab from Troubleshooting/Changelog, it routes to Guide then scrolls.
		 */
		document.addEventListener("click", (e) => {
			const link = e.target?.closest?.("[data-scroll-id]");
			if (!link) return;

			e.preventDefault();
			const id = link.getAttribute("data-scroll-id");
			if (!id) return;

			close();

			const path = router.getCurrentPath();
			if (path !== "/guide") {
				localStorage.setItem("revo_pending_scroll", id);
				window.location.hash = "#/guide";
				return;
			}

			Pages.scrollToId(id);
		});

		// Close drawer whenever route changes (cleaner UX on mobile)
		window.addEventListener("hashchange", () => {
			if (toggleBtn.getAttribute("aria-expanded") === "true") close();
		});
	}
}

const app = new App();

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", () => app.init());
} else {
	app.init();
}
