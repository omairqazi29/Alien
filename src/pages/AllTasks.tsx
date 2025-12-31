import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TaskCard } from '../components/TaskCard';
import { useTasks } from '../hooks/useData';
import { EB1A_CRITERIA } from '../types';
import type { Task, TaskStatus, CriteriaId } from '../types';

export function AllTasks() {
  const navigate = useNavigate();
  const { tasks, loading, updateTask, deleteTask } = useTasks();
  const [filter, setFilter] = useState<'all' | TaskStatus>('all');
  const [syncingTasks, setSyncingTasks] = useState<Set<string>>(new Set());

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    updateTask(taskId, { status });
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
  };

  const handleSync = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    setSyncingTasks(prev => new Set(prev).add(taskId));
    await new Promise(resolve => setTimeout(resolve, 1500));

    let evidence = '';
    switch (task.sync_source) {
      case 'github_stars':
        evidence = `Repository has ${Math.floor(Math.random() * 5000)} stars (simulated)`;
        break;
      case 'github_contributions':
        evidence = `${Math.floor(Math.random() * 2000)} contributions in the last year (simulated)`;
        break;
      case 'google_scholar':
        evidence = `${Math.floor(Math.random() * 500)} citations (simulated)`;
        break;
      default:
        evidence = 'Data synced successfully (simulated)';
    }

    updateTask(taskId, {
      evidence,
      last_synced: new Date().toISOString(),
      status: 'completed',
    });

    setSyncingTasks(prev => {
      const next = new Set(prev);
      next.delete(taskId);
      return next;
    });
  };

  const getCriteriaName = (criteriaId: CriteriaId) => {
    return EB1A_CRITERIA.find(c => c.id === criteriaId)?.name || criteriaId;
  };

  const filteredTasks = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  // Group tasks by criteria
  const groupedTasks = filteredTasks.reduce((acc, task) => {
    if (!acc[task.criteria_id]) {
      acc[task.criteria_id] = [];
    }
    acc[task.criteria_id].push(task);
    return acc;
  }, {} as Record<CriteriaId, Task[]>);

  const statusCounts = {
    all: tasks.length,
    not_started: tasks.filter(t => t.status === 'not_started').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">All Tasks</h1>
        <p className="text-gray-400">
          View and manage all your tasks across all criteria.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['all', 'not_started', 'in_progress', 'completed', 'blocked'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
            }`}
          >
            {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            <span className="ml-1.5 text-xs opacity-75">({statusCounts[status]})</span>
          </button>
        ))}
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
          <p className="text-gray-400 mb-4">No tasks yet</p>
          <button
            onClick={() => navigate('/criteria')}
            className="text-emerald-400 hover:text-emerald-300"
          >
            Select criteria and add tasks
          </button>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
          <p className="text-gray-400">No tasks match this filter</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTasks).map(([criteriaId, criteriaTasks]) => (
            <div key={criteriaId}>
              <button
                onClick={() => navigate(`/criteria/${criteriaId}`)}
                className="text-sm font-medium text-gray-400 hover:text-white mb-3 flex items-center gap-2"
              >
                {getCriteriaName(criteriaId as CriteriaId)}
                <span className="text-xs text-gray-500">({criteriaTasks.length})</span>
              </button>
              <div className="space-y-2">
                {criteriaTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={(status) => handleStatusChange(task.id, status)}
                    onSync={task.type === 'sync' ? () => handleSync(task.id) : undefined}
                    onDelete={() => handleDeleteTask(task.id)}
                    isSyncing={syncingTasks.has(task.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
