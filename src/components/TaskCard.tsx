import { Check, RefreshCw, Trash2, Circle, Clock, AlertCircle } from 'lucide-react';
import type { Task, TaskStatus } from '../types';

interface TaskCardProps {
  task: Task;
  onStatusChange: (status: TaskStatus) => void;
  onSync?: () => void;
  onDelete: () => void;
  isSyncing?: boolean;
  starsTarget?: number;
}

const statusConfig: Record<TaskStatus, { icon: React.ElementType; color: string; bg: string }> = {
  not_started: { icon: Circle, color: 'text-gray-400', bg: 'bg-gray-400' },
  in_progress: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-400' },
  completed: { icon: Check, color: 'text-emerald-400', bg: 'bg-emerald-400' },
  blocked: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-400' },
};

export function TaskCard({ task, onStatusChange, onSync, onDelete, isSyncing, starsTarget }: TaskCardProps) {
  const config = statusConfig[task.status];
  const StatusIcon = config.icon;

  // Parse stars from evidence if it's a GitHub stars task
  const parseStarsFromEvidence = (): number | null => {
    if (!task.evidence || task.sync_source !== 'github_stars') return null;
    const match = task.evidence.match(/has ([\d,]+) stars/);
    if (match) {
      return parseInt(match[1].replace(/,/g, ''), 10);
    }
    return null;
  };

  const currentStars = parseStarsFromEvidence();
  const showStarsProgress = currentStars !== null && starsTarget && starsTarget > 0;
  const starsProgress = showStarsProgress ? Math.min((currentStars / starsTarget) * 100, 100) : 0;

  const cycleStatus = () => {
    const statuses: TaskStatus[] = ['not_started', 'in_progress', 'completed', 'blocked'];
    const currentIndex = statuses.indexOf(task.status);
    const nextIndex = (currentIndex + 1) % statuses.length;
    onStatusChange(statuses[nextIndex]);
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="flex items-start gap-3">
        <button
          onClick={cycleStatus}
          className={`mt-0.5 p-1 rounded-full ${config.color} hover:bg-gray-700 transition-colors`}
          title="Click to change status"
        >
          <StatusIcon className="w-4 h-4" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {task.exhibit && (
              <span className="px-1.5 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded font-mono">
                {task.exhibit}
              </span>
            )}
            <h4 className="font-medium text-white truncate">{task.title}</h4>
            {task.type === 'sync' && (
              <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded-full">
                sync
              </span>
            )}
          </div>
          {task.description && (
            <p className="text-sm text-gray-400 mt-1">{task.description}</p>
          )}
          {task.evidence && (
            <div className="mt-2 p-2 bg-gray-900 rounded text-xs text-gray-300">
              <span className="text-gray-500">Evidence: </span>
              {task.evidence}
              {showStarsProgress && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">{currentStars?.toLocaleString()} / {starsTarget.toLocaleString()} stars</span>
                    <span className={starsProgress >= 100 ? 'text-emerald-400' : 'text-gray-400'}>
                      {Math.round(starsProgress)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${starsProgress >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                      style={{ width: `${starsProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          {task.last_synced && (
            <p className="text-xs text-gray-500 mt-2">
              Last synced: {new Date(task.last_synced).toLocaleString()}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1">
          {task.type === 'sync' && onSync && (
            <button
              onClick={onSync}
              disabled={isSyncing}
              className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              title="Sync data"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
          )}
          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
            title="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
