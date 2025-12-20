/**
 * GitHub API helper (no auth).
 * Repo for site issues (approved fixes): RevolutionGuides/revolutionmacroguide
 * Repo for releases (macro releases): nosyliam/revolution-macro
 */

class GitHubAPI {
	constructor() {
		this.siteOwner = "RevolutionGuides";
		this.siteRepo = "revolutionmacroguide";

		this.macroOwner = "nosyliam";
		this.macroRepo = "revolution-macro";

		this.base = "https://api.github.com";
	}

	async request(path) {
		const res = await fetch(path, {
			headers: {
				Accept: "application/vnd.github+json",
			},
			cache: "no-store",
		});
		if (!res.ok) {
			const text = await res.text().catch(() => "");
			throw new Error(`GitHub API error ${res.status}: ${text || res.statusText}`);
		}
		return res.json();
	}

	/**
	 * Approved troubleshooting issues in the SITE repo.
	 * You should label fix-issues with: approved + (windows|mac|macos|macro|pro)
	 */
	async getTroubleshootingIssues(requiredLabel = "approved") {
		// Pull open issues only; you can change per_page if you have lots.
		const url =
			`${this.base}/repos/${this.siteOwner}/${this.siteRepo}/issues` +
			`?state=open&per_page=100&labels=${encodeURIComponent(requiredLabel)}`;
		return this.request(url);
	}

	/**
	 * Releases for macro repo (changelog page).
	 */
	async getReleases() {
		const url =
			`${this.base}/repos/${this.macroOwner}/${this.macroRepo}/releases` +
			`?per_page=20`;
		return this.request(url);
	}

	formatDate(iso) {
		try {
			return new Date(iso).toLocaleDateString(undefined, {
				year: "numeric",
				month: "short",
				day: "numeric",
			});
		} catch {
			return "";
		}
	}
}

const githubAPI = new GitHubAPI();

/**
 * IMPORTANT: pages.js expects window.api.listApprovedFixes() and window.api.listReleases()
 * This wrapper preserves your GitHubAPI class while matching the expected interface.
 */
window.api = {
	listApprovedFixes: () => githubAPI.getTroubleshootingIssues("approved"),
	listReleases: () => githubAPI.getReleases(),
};

