import { useNavigate } from 'react-router-dom';
import { Target, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { useSelectedCriteria, useTasks } from '../hooks/useData';
import { EB1A_CRITERIA } from '../types';
import type { CriteriaId } from '../types';

export function Dashboard() {
  const navigate = useNavigate();
  const { criteria: selectedIds, loading: criteriaLoading } = useSelectedCriteria();
  const { tasks, loading: tasksLoading } = useTasks();

  const selectedCriteria = EB1A_CRITERIA.filter(c => selectedIds.includes(c.id));
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;

  const getTaskStats = (criteriaId: CriteriaId) => {
    const criteriaTasks = tasks.filter(t => t.criteria_id === criteriaId);
    return {
      total: criteriaTasks.length,
      completed: criteriaTasks.filter(t => t.status === 'completed').length,
    };
  };

  if (criteriaLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show onboarding if no criteria selected
  if (selectedCriteria.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="p-4 bg-emerald-500/20 rounded-full mb-6">
          <Target className="w-12 h-12 text-emerald-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Welcome to The Alien Project</h1>
        <p className="text-gray-400 max-w-md mb-8">
          Start by selecting at least one EB-1A criterion you want to focus on.
          You'll need to meet 3 out of 10 criteria to qualify.
        </p>
        <button
          onClick={() => navigate('/criteria')}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors font-medium"
        >
          Select Criteria
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-gray-400 text-sm">Criteria Selected</p>
              <p className="text-2xl font-bold text-white">{selectedCriteria.length} / 10</p>
              <p className="text-xs text-gray-500">Need 3+ for EB-1A</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-gray-400 text-sm">Tasks Completed</p>
              <p className="text-2xl font-bold text-white">{completedTasks} / {totalTasks}</p>
              <p className="text-xs text-gray-500">
                {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% complete
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <AlertCircle className={`w-5 h-5 ${selectedCriteria.length >= 3 ? 'text-emerald-400' : 'text-yellow-400'}`} />
            <div>
              <p className="text-gray-400 text-sm">Status</p>
              <p className="text-2xl font-bold text-white">
                {selectedCriteria.length >= 3 ? 'On Track' : 'Need More'}
              </p>
              <p className="text-xs text-gray-500">
                {selectedCriteria.length >= 3 ? 'Meeting minimum criteria' : `Select ${3 - selectedCriteria.length} more criteria`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Criteria Progress */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Your Focus Areas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedCriteria.map(c => {
            const stats = getTaskStats(c.id);
            const progress = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

            return (
              <button
                key={c.id}
                onClick={() => navigate(`/criteria/${c.id}`)}
                className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-emerald-500/50 transition-all text-left"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-white">{c.name}</h3>
                  <span className="text-sm text-gray-400">{stats.completed}/{stats.total} tasks</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => navigate('/criteria')}
          className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
        >
          Manage Criteria
        </button>
        <button
          onClick={() => navigate('/tasks')}
          className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
        >
          View All Tasks
        </button>
      </div>
    </div>
  );
}
