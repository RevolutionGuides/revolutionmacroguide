/* assets/js/app.js
 * App bootstrap: router init, drawer open/close, back-to-top, and drawer nav preload.
 */

(function () {
  function qs(sel) { return document.querySelector(sel); }

  const drawer = qs("#drawer");
  const overlay = qs("#drawerOverlay");
  const toggle = qs("#drawerToggle");
  const closeBtn = qs("#drawerClose");
  const topBtn = qs("#drawerTopBtn");
  const backToTop = qs("#backToTopBtn");

  function setDrawerOpen(open) {
    if (!drawer || !overlay || !toggle) return;

    toggle.setAttribute("aria-expanded", open ? "true" : "false");

    if (open) {
      drawer.hidden = false;
      overlay.hidden = false;
      // next frame for transitions
      requestAnimationFrame(() => {
        drawer.classList.add("open");
        overlay.classList.add("open");
      });
    } else {
      drawer.classList.remove("open");
      overlay.classList.remove("open");
      // wait for transition
      window.setTimeout(() => {
        drawer.hidden = true;
        overlay.hidden = true;
      }, 200);
    }
  }

  function closeDrawer() { setDrawerOpen(false); }
  function openDrawer() { setDrawerOpen(true); }

  // Drawer event wiring
  if (toggle) toggle.addEventListener("click", () => openDrawer());
  if (closeBtn) closeBtn.addEventListener("click", () => closeDrawer());
  if (overlay) overlay.addEventListener("click", () => closeDrawer());

  // Allow Pages to close drawer via event
  document.addEventListener("revo:drawer-close", () => closeDrawer());

  // ESC closes drawer
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });

  // Drawer "Top" button
  if (topBtn) {
    topBtn.addEventListener("click", () => {
      closeDrawer();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Back to top floating button
  function syncBackToTop() {
    if (!backToTop) return;
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    backToTop.classList.toggle("show", y > 420);
  }
  window.addEventListener("scroll", syncBackToTop, { passive: true });
  syncBackToTop();

  if (backToTop) {
    backToTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Preload guide-sections.json so drawer has the 6 tabs even before visiting Guide
  (async () => {
    try {
      const sections = await Pages.getGuideSections();
      Pages.renderDrawerGuideNav(sections);
    } catch (e) {
      // If guide-sections.json fails, drawer stays empty; Guide page will show the error card.
      console.error(e);
    }
  })();

  // Start router (your router.js already creates `router`)
  if (window.router && typeof window.router.init === "function") {
    window.router.init();
  } else if (typeof router !== "undefined" && router?.init) {
    router.init();
  }
})();




