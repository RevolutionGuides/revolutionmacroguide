/**
 * GitHub API Integration
 * Fetches releases and issues from GitHub
 */

class GitHubAPI {
	constructor() {
		this.baseUrl = 'https://api.github.com';
		this.cache = {};
		this.cacheTime = 5 * 60 * 1000; // 5 minutes
	}

	async getReleasesUrl(owner = 'nosyliam', repo = 'revolution-macro') {
		return `${this.baseUrl}/repos/${owner}/${repo}/releases?per_page=10`;
	}

	async getIssuesUrl(
		owner = 'RevolutionGuides',
		repo = 'revolutionmacroguide',
		labels = 'approved'
	) {
		return `${this.baseUrl}/repos/${owner}/${repo}/issues?labels=${labels}`;
	}

	async fetch(url, useCache = true) {
		const cacheKey = url;
		const cached = this.cache[cacheKey];

		if (useCache && cached && Date.now() - cached.timestamp < this.cacheTime) {
			return cached.data;
		}

		try {
			const response = await fetch(url);
			if (!response.ok) throw new Error(`API Error: ${response.status}`);
			const data = await response.json();

			if (useCache) {
				this.cache[cacheKey] = { data, timestamp: Date.now() };
			}

			return data;
		} catch (error) {
			console.error('GitHub API Error:', error);
			return null;
		}
	}

	async getReleases() {
		const url = await this.getReleasesUrl();
		return await this.fetch(url);
	}

	async getTroubleshootingIssues(labels = 'approved') {
		// Fetch with approved label, optionally filtered by windows or mac
		let url = `${this.baseUrl}/repos/RevolutionGuides/revolutionmacroguide/issues?labels=${labels}&per_page=50`;
		return await this.fetch(url);
	}

	formatDate(dateString) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	}

	formatSize(bytes) {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
	}
}

const githubAPI = new GitHubAPI();
