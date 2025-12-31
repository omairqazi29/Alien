// GitHub API helper functions

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  language: string | null;
  created_at: string;
  updated_at: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  public_repos: number;
  followers: number;
  following: number;
}

export interface RepoMetrics {
  stars: number;
  forks: number;
  watchers: number;
  contributors?: number;
}

class GitHubAPI {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async fetch<T>(endpoint: string): Promise<T> {
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`https://api.github.com${endpoint}`, { headers });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getUser(): Promise<GitHubUser> {
    return this.fetch<GitHubUser>('/user');
  }

  async getUserRepos(username?: string): Promise<GitHubRepo[]> {
    if (username) {
      return this.fetch<GitHubRepo[]>(`/users/${username}/repos?sort=updated&per_page=100`);
    }
    return this.fetch<GitHubRepo[]>('/user/repos?sort=updated&per_page=100');
  }

  async getRepo(owner: string, repo: string): Promise<GitHubRepo> {
    return this.fetch<GitHubRepo>(`/repos/${owner}/${repo}`);
  }

  async getRepoMetrics(owner: string, repo: string): Promise<RepoMetrics> {
    const repoData = await this.getRepo(owner, repo);

    // Try to get contributor count (may fail for large repos)
    let contributors = 0;
    try {
      const contribResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=1`,
        {
          headers: this.token ? { 'Authorization': `Bearer ${this.token}` } : {},
        }
      );
      // GitHub returns Link header with total count
      const linkHeader = contribResponse.headers.get('Link');
      if (linkHeader) {
        const match = linkHeader.match(/page=(\d+)>; rel="last"/);
        if (match) {
          contributors = parseInt(match[1], 10);
        }
      } else {
        const contribs = await contribResponse.json();
        contributors = Array.isArray(contribs) ? contribs.length : 0;
      }
    } catch {
      // Ignore contributor count errors
    }

    return {
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      watchers: repoData.watchers_count,
      contributors,
    };
  }
}

export const github = new GitHubAPI();
