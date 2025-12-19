/**
 * GitHub API Integration
 * - Releases: nosyliam/revolution-macro
 * - Troubleshooting fixes (Issues): AlgesGT/revolutionmacroguide (change if needed)
 */

class GitHubAPI {
	constructor() {
		this.baseUrl = "https://api.github.com";
		this.cache = {};
		this.cacheTime = 5 * 60 * 1000; // 5 minutes

		// CHANGE THESE IF YOU WANT A DIFFERENT WEBSITE REPO:
		this.siteOwner = "AlgesGT";
		this.siteRepo = "revolutionmacroguide";

		this.macroOwner = "nosyliam";
		this.macroRepo = "revolution-macro";
	}

	_fetchWithCache(url, useCache = true) {
		const cached = this.cache[url];
		if (useCache && cached && Date.now() - cached.timestamp < this.cacheTime) {
			return Promise.resolve(cached.data);
		}

		return fetch(url)
			.then((r) => {
				if (!r.ok) throw new Error(`API Error: ${r.status}`);
				return r.json();
			})
			.then((data) => {
				if (useCache) this.cache[url] = { data, timestamp: Date.now() };
				return data;
			})
			.catch((err) => {
				console.error("GitHub API Error:", err);
				return null;
			});
	}

	getReleases() {
		const url = `${this.baseUrl}/repos/${this.macroOwner}/${this.macroRepo}/releases?per_page=10`;
		return this._fetchWithCache(url);
	}

	/**
	 * Pull approved fixes from WEBSITE repo issues.
	 * Labels expected: approved + one of: windows, mac, macro, pro
	 */
	getApprovedFixIssues() {
		const labels = encodeURIComponent("approved");
		const url = `${this.baseUrl}/repos/${this.siteOwner}/${this.siteRepo}/issues?state=open&labels=${labels}&per_page=100`;
		return this._fetchWithCache(url);
	}

	formatDate(dateString) {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	}
}

const githubAPI = new GitHubAPI();

