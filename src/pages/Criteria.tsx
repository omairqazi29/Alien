import { useNavigate } from 'react-router-dom';
import { Check, ChevronRight } from 'lucide-react';
import { useSelectedCriteria, useTasks } from '../hooks/useData';
import { EB1A_CRITERIA } from '../types';
import type { CriteriaId } from '../types';

export function Criteria() {
  const navigate = useNavigate();
  const { criteria: selectedIds, setCriteria: setSelectedIds, loading: criteriaLoading } = useSelectedCriteria();
  const { tasks, loading: tasksLoading } = useTasks();

  const toggleCriteria = (id: CriteriaId) => {
    const newSelected = selectedIds.includes(id)
      ? selectedIds.filter(c => c !== id)
      : [...selectedIds, id];
    setSelectedIds(newSelected);
  };

  const getTaskStats = (criteriaId: CriteriaId) => {
    const criteriaTasks = tasks.filter(t => t.criteria_id === criteriaId);
    return {
      total: criteriaTasks.length,
      completed: criteriaTasks.filter(t => t.status === 'completed').length,
    };
  };

  const selectedCount = selectedIds.length;

  if (criteriaLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">EB-1A Criteria</h1>
        <p className="text-gray-400">
          Select the criteria you're targeting. You need to meet at least 3 out of 10.
          <span className={`ml-2 font-medium ${selectedCount >= 3 ? 'text-emerald-400' : 'text-yellow-400'}`}>
            ({selectedCount}/10 selected)
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EB1A_CRITERIA.map(c => {
          const isSelected = selectedIds.includes(c.id);
          const stats = getTaskStats(c.id);
          const progress = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

          return (
            <div
              key={c.id}
              className={`relative p-4 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-gray-700 bg-gray-800 hover:border-gray-600'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleCriteria(c.id)}
                  className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                    isSelected
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'border-gray-500 hover:border-emerald-400'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </button>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white">{c.name}</h3>
                  <p className="text-sm text-gray-400 mt-1 line-clamp-2">{c.officialTitle}</p>

                  {isSelected && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                        <span>{stats.completed}/{stats.total} tasks</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {isSelected && (
                  <button
                    onClick={() => navigate(`/criteria/${c.id}`)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
