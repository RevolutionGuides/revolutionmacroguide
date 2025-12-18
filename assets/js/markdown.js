/**
 * Markdown Rendering
 * Uses marked (GFM) + DOMPurify when available.
 */

(function () {
	function hasMarked() {
		return (
			typeof window !== 'undefined' &&
			typeof window.marked?.parse === 'function'
		);
	}

	function hasPurify() {
		return (
			typeof window !== 'undefined' &&
			typeof window.DOMPurify?.sanitize === 'function'
		);
	}

	function escapeHtml(text) {
		return String(text)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	function configureMarkedOnce() {
		if (!hasMarked()) return;
		if (window.__revo_marked_configured) return;
		window.__revo_marked_configured = true;

		window.marked.setOptions({
			gfm: true,
			breaks: false,
			headerIds: false,
			mangle: false,
		});
	}

	/**
	 * Render markdown to safe HTML.
	 * @param {string} markdown
	 * @param {{breaks?: boolean}} [options]
	 */
	function render(markdown, options) {
		const md = markdown == null ? '' : String(markdown);
		configureMarkedOnce();

		if (!hasMarked()) {
			return `<pre>${escapeHtml(md)}</pre>`;
		}

		let html = window.marked.parse(md, {
			gfm: true,
			breaks: Boolean(options?.breaks),
			headerIds: false,
			mangle: false,
		});

		// Wrap tables for horizontal scrolling on small screens.
		html = html
			.replace(/<table(\b[^>]*)>/g, '<div class="table-wrap"><table$1>')
			.replace(/<\/table>/g, '</table></div>');

		if (!hasPurify()) return html;

		return window.DOMPurify.sanitize(html, {
			USE_PROFILES: { html: true },
			ADD_TAGS: ['table', 'thead', 'tbody', 'tr', 'th', 'td'],
			ADD_ATTR: ['target', 'rel'],
		});
	}

	window.markdown = { render };
})();
