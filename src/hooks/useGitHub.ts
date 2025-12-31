import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/database';
import { github } from '../lib/github';
import type { GitHubRepoConfig } from '../types';
import type { GitHubRepo } from '../lib/github';

export function useGitHubConfig() {
  const { user } = useAuth();
  const [username, setUsername] = useState<string | null>(null);
  const [repos, setRepos] = useState<GitHubRepoConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const config = await db.getGitHubConfig(user.id);
      setUsername(config.username);
      setRepos(config.repos);
    } catch (err) {
      console.error('Failed to load GitHub config:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const saveUsername = useCallback(async (newUsername: string) => {
    if (!user) return;
    await db.setGitHubUsername(user.id, newUsername);
    setUsername(newUsername);
  }, [user]);

  const addRepo = useCallback(
    async (repo: GitHubRepo) => {
      if (!user) return;

      const newRepo: GitHubRepoConfig = {
        id: repo.id,
        full_name: repo.full_name,
        name: repo.name,
        stars_threshold: 100,
        current_stars: repo.stargazers_count,
        last_synced: new Date().toISOString(),
      };

      const updatedRepos = [...repos, newRepo];
      await db.setGitHubRepos(user.id, updatedRepos);
      setRepos(updatedRepos);
    },
    [user, repos]
  );

  const removeRepo = useCallback(
    async (repoId: number) => {
      if (!user) return;
      const updatedRepos = repos.filter((r) => r.id !== repoId);
      await db.setGitHubRepos(user.id, updatedRepos);
      setRepos(updatedRepos);
    },
    [user, repos]
  );

  const updateThreshold = useCallback(
    async (repoId: number, threshold: number) => {
      if (!user) return;
      const updatedRepos = repos.map((r) =>
        r.id === repoId ? { ...r, stars_threshold: threshold } : r
      );
      await db.setGitHubRepos(user.id, updatedRepos);
      setRepos(updatedRepos);
    },
    [user, repos]
  );

  const syncAll = useCallback(async () => {
    if (!user || !username) return { reposUpdated: 0, tasksCompleted: 0 };

    let totalTasksCompleted = 0;

    for (const repo of repos) {
      const [owner, repoName] = repo.full_name.split('/');
      const metrics = await github.getRepoMetrics(owner, repoName);
      await db.updateRepoMetrics(user.id, repo.full_name, metrics.stars);

      if (repo.stars_threshold && repo.stars_threshold > 0) {
        const result = await db.autoCompleteRepoTasks(
          user.id,
          repo.full_name,
          metrics.stars,
          repo.stars_threshold
        );
        totalTasksCompleted += result.updated;
      }
    }

    await load();
    return { reposUpdated: repos.length, tasksCompleted: totalTasksCompleted };
  }, [user, username, repos, load]);

  const isConnected = !!username;

  return {
    username,
    repos,
    loading,
    isConnected,
    addRepo,
    removeRepo,
    updateThreshold,
    syncAll,
    saveUsername,
    reload: load,
  };
}

export function useAvailableRepos(connectedRepos: GitHubRepoConfig[], username: string | null) {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!username) return;

    setLoading(true);
    setError(null);

    try {
      const allRepos = await github.getUserRepos(username);
      setRepos(allRepos.filter((r) => !connectedRepos.some((cr) => cr.id === r.id)));
    } catch (err) {
      setError('Failed to load GitHub repositories. Check that the username is correct.');
      console.error('Failed to load repos:', err);
    } finally {
      setLoading(false);
    }
  }, [username, connectedRepos]);

  const removeFromAvailable = useCallback((repoId: number) => {
    setRepos((prev) => prev.filter((r) => r.id !== repoId));
  }, []);

  return { repos, loading, error, load, removeFromAvailable };
}
