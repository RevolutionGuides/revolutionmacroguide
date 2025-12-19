/**
 * GitHub API Integration
 * Fetches releases and troubleshooting issues from GitHub
 */

class GitHubAPI {
	constructor() {
		this.baseUrl = "https://api.github.com";
		this.cache = {};
		this.cacheTime = 5 * 60 * 1000; // 5 minutes
	}

	_buildUrl(path, params = {}) {
		const url = new URL(`${this.baseUrl}${path}`);
		Object.entries(params).forEach(([k, v]) => {
			if (v === undefined || v === null || v === "") return;
			url.searchParams.set(k, String(v));
		});
		return url.toString();
	}

	async fetch(url, useCache = true) {
		const cacheKey = url;
		const cached = this.cache[cacheKey];

		if (useCache && cached && Date.now() - cached.timestamp < this.cacheTime) {
			return cached.data;
		}

		try {
			const response = await fetch(url, {
				headers: {
					Accept: "application/vnd.github+json",
				},
			});

			if (!response.ok) throw new Error(`API Error: ${response.status}`);
			const data = await response.json();

			if (useCache) {
				this.cache[cacheKey] = { data, timestamp: Date.now() };
			}

			return data;
		} catch (error) {
			console.error("GitHub API Error:", error);
			return null;
		}
	}

	getReleasesUrl(owner = "nosyliam", repo = "revolution-macro") {
		return this._buildUrl(`/repos/${owner}/${repo}/releases`, {
			per_page: 10,
		});
	}

	getIssuesUrl(owner, repo, labelsCsv = "approved") {
		// labelsCsv example: "approved,windows"
		return this._buildUrl(`/repos/${owner}/${repo}/issues`, {
			labels: labelsCsv,
			state: "open",
			per_page: 100,
		});
	}

	async getReleases(owner = "nosyliam", repo = "revolution-macro") {
		return await this.fetch(this.getReleasesUrl(owner, repo));
	}

	async getTroubleshootingIssues({
		owner = "RevolutionGuides",
		repo = "revolutionmacroguide",
		labels = ["approved"], // IMPORTANT: your repo uses approved/windows/macos/macro/pro
	} = {}) {
		const labelsCsv = Array.isArray(labels) ? labels.join(",") : String(labels || "");
		const url = this.getIssuesUrl(owner, repo, labelsCsv);
		return await this.fetch(url);
	}

	formatDate(dateString) {
		try {
			return new Date(dateString).toLocaleDateString("en-US", {
				year: "numeric",
				month: "short",
				day: "numeric",
			});
		} catch {
			return dateString || "";
		}
	}
}

const githubAPI = new GitHubAPI();


