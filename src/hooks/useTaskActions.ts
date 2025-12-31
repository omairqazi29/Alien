import { useState, useCallback } from 'react';
import { github } from '../lib/github';
import { useGitHubConfig } from './useGitHub';
import type { Task, TaskStatus } from '../types';

interface TaskUpdates {
  title?: string;
  description?: string;
  exhibit?: string;
  status?: TaskStatus;
  evidence?: string;
  last_synced?: string;
}

interface UseTaskActionsOptions {
  tasks: Task[];
  updateTask: (taskId: string, updates: TaskUpdates) => void;
  deleteTask: (taskId: string) => void;
}

interface SyncResult {
  evidence: string;
  shouldComplete: boolean;
}

export function useTaskActions({ tasks, updateTask, deleteTask }: UseTaskActionsOptions) {
  const { repos } = useGitHubConfig();
  const [syncingTasks, setSyncingTasks] = useState<Set<string>>(new Set());
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Get stars target for a task based on its connected repo
  const getStarsTarget = useCallback((repoFullName?: string): number | undefined => {
    if (!repoFullName) return undefined;
    const repo = repos.find(r => r.full_name === repoFullName);
    return repo?.stars_threshold;
  }, [repos]);

  // Sync a single task and return the result
  const syncTask = useCallback(async (task: Task): Promise<SyncResult> => {
    let evidence = '';
    let shouldComplete = false;

    switch (task.sync_source) {
      case 'github_stars': {
        const repoFullName = task.sync_config?.repository;
        if (repoFullName) {
          const [owner, repo] = repoFullName.split('/');
          const metrics = await github.getRepoMetrics(owner, repo);
          evidence = `Repository has ${metrics.stars.toLocaleString()} stars`;
          const target = getStarsTarget(repoFullName);
          shouldComplete = target ? metrics.stars >= target : false;
        } else {
          evidence = 'No repository configured';
        }
        break;
      }
      case 'github_contributions':
        evidence = 'GitHub contributions (connect in Settings to sync)';
        break;
      case 'google_scholar':
        evidence = 'Google Scholar citations (integration coming soon)';
        break;
      default:
        evidence = 'Data synced successfully';
    }

    return { evidence, shouldComplete };
  }, [getStarsTarget]);

  // Handle sync button click
  const handleSync = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    setSyncingTasks(prev => new Set(prev).add(taskId));

    try {
      const { evidence, shouldComplete } = await syncTask(task);
      const newStatus = shouldComplete ? 'completed' : 'in_progress';

      updateTask(taskId, {
        evidence,
        last_synced: new Date().toISOString(),
        status: newStatus,
      });
    } catch (error) {
      updateTask(taskId, {
        evidence: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        last_synced: new Date().toISOString(),
      });
    } finally {
      setSyncingTasks(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  }, [tasks, syncTask, updateTask]);

  // Handle status change
  const handleStatusChange = useCallback((taskId: string, status: TaskStatus) => {
    updateTask(taskId, { status });
  }, [updateTask]);

  // Handle delete
  const handleDelete = useCallback((taskId: string) => {
    deleteTask(taskId);
  }, [deleteTask]);

  // Handle edit save
  const handleEditSave = useCallback((updates: { title: string; description: string; exhibit?: string }) => {
    if (editingTask) {
      updateTask(editingTask.id, updates);
      setEditingTask(null);
    }
  }, [editingTask, updateTask]);

  // Check if a task is currently syncing
  const isSyncing = useCallback((taskId: string) => {
    return syncingTasks.has(taskId);
  }, [syncingTasks]);

  return {
    // State
    syncingTasks,
    editingTask,
    setEditingTask,

    // Helpers
    getStarsTarget,
    isSyncing,

    // Handlers
    handleSync,
    handleStatusChange,
    handleDelete,
    handleEditSave,
  };
}
