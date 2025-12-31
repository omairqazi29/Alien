import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TaskCard } from '../components/TaskCard';
import { EditTaskModal } from '../components/EditTaskModal';
import { LoadingSpinner } from '../components/ui';
import { useTasks } from '../hooks/useData';
import { useTaskActions } from '../hooks/useTaskActions';
import { EB1A_CRITERIA } from '../types';
import type { Task, TaskStatus, CriteriaId } from '../types';

export function AllTasks() {
  const navigate = useNavigate();
  const { tasks, loading, updateTask, deleteTask } = useTasks();
  const [filter, setFilter] = useState<'all' | TaskStatus>('all');

  const {
    editingTask,
    setEditingTask,
    getStarsTarget,
    isSyncing,
    handleSync,
    handleStatusChange,
    handleDelete,
    handleEditSave,
  } = useTaskActions({ tasks, updateTask, deleteTask });

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
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">All Tasks</h1>
        <p className="text-gray-400">
          View and manage all your tasks across all criteria.
        </p>
      </div>

      {/* Progress Bar */}
      {tasks.length > 0 && (
        <div className="mb-6 bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-300">Overall Progress</span>
            <span className="text-sm text-gray-400">
              {statusCounts.completed} of {tasks.length} completed
            </span>
          </div>
          <div className="h-3 bg-gray-700 rounded-full overflow-hidden flex">
            {statusCounts.completed > 0 && (
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${(statusCounts.completed / tasks.length) * 100}%` }}
              />
            )}
            {statusCounts.in_progress > 0 && (
              <div
                className="h-full bg-yellow-500 transition-all duration-300"
                style={{ width: `${(statusCounts.in_progress / tasks.length) * 100}%` }}
              />
            )}
          </div>
          <div className="flex gap-4 mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Completed ({statusCounts.completed})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              In Progress ({statusCounts.in_progress})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gray-600" />
              Remaining ({statusCounts.not_started + statusCounts.blocked})
            </span>
          </div>
        </div>
      )}

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
                    onEdit={() => setEditingTask(task)}
                    onDelete={() => handleDelete(task.id)}
                    isSyncing={isSyncing(task.id)}
                    starsTarget={getStarsTarget(task.sync_config?.repository)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <EditTaskModal
        open={!!editingTask}
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onSave={handleEditSave}
      />
    </div>
  );
}
