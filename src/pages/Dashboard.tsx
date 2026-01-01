import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, CheckCircle2, AlertCircle, ArrowRight, Clock, RefreshCw, Award, BarChart3 } from 'lucide-react';
import { useSelectedCriteria, useTasks, useAllGrades } from '../hooks/useData';
import { useGitHubConfig } from '../hooks/useGitHub';
import { EB1A_CRITERIA } from '../types';
import type { CriteriaId, GradeLevel } from '../types';

const GRADE_CONFIG: Record<GradeLevel, { color: string; bgColor: string; label: string; score: number }> = {
  strong: { color: 'text-emerald-400', bgColor: 'bg-emerald-500', label: 'Strong', score: 4 },
  moderate: { color: 'text-blue-400', bgColor: 'bg-blue-500', label: 'Moderate', score: 3 },
  weak: { color: 'text-yellow-400', bgColor: 'bg-yellow-500', label: 'Weak', score: 2 },
  insufficient: { color: 'text-red-400', bgColor: 'bg-red-500', label: 'Insufficient', score: 1 },
};

export function Dashboard() {
  const navigate = useNavigate();
  const { criteria: selectedIds, loading: criteriaLoading } = useSelectedCriteria();
  const { tasks, loading: tasksLoading, reload: reloadTasks } = useTasks();
  const { grades, loading: gradesLoading } = useAllGrades();
  const { repos, isConnected, syncAll } = useGitHubConfig();
  const [syncing, setSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<{ repos: number; tasks: number } | null>(null);
  const hasSyncedRef = useRef(false);

  const selectedCriteria = EB1A_CRITERIA.filter(c => selectedIds.includes(c.id));
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const blockedTasks = tasks.filter(t => t.status === 'blocked').length;

  // Calculate grade statistics
  const getGradeForCriteria = (criteriaId: CriteriaId) => {
    const grade = grades.find(g => g.criteria_id === criteriaId);
    if (!grade || !grade.grades || grade.grades.length === 0) return null;
    // Use average score across all models
    const avgScore = grade.grades.reduce((sum, g) => sum + g.score, 0) / grade.grades.length;
    // Determine grade level from average score
    if (avgScore >= 75) return 'strong' as GradeLevel;
    if (avgScore >= 50) return 'moderate' as GradeLevel;
    if (avgScore >= 25) return 'weak' as GradeLevel;
    return 'insufficient' as GradeLevel;
  };

  const getAverageScore = () => {
    if (grades.length === 0) return null;
    const allScores = grades.flatMap(g => g.grades?.map(mg => mg.score) || []);
    if (allScores.length === 0) return null;
    return Math.round(allScores.reduce((sum, s) => sum + s, 0) / allScores.length);
  };

  const averageScore = getAverageScore();
  const gradedCriteriaCount = grades.filter(g => g.grades && g.grades.length > 0).length;

  // Auto-sync on page load (once per session)
  useEffect(() => {
    const autoSync = async () => {
      if (hasSyncedRef.current || !isConnected || repos.length === 0) return;
      hasSyncedRef.current = true;

      setSyncing(true);
      try {
        const result = await syncAll();
        setLastSyncResult({ repos: result.reposUpdated, tasks: result.tasksCompleted });
        await reloadTasks();
      } catch (error) {
        console.error('Auto-sync failed:', error);
      } finally {
        setSyncing(false);
      }
    };

    if (!criteriaLoading && !tasksLoading) {
      autoSync();
    }
  }, [isConnected, repos.length, syncAll, reloadTasks, criteriaLoading, tasksLoading]);

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const result = await syncAll();
      setLastSyncResult({ repos: result.reposUpdated, tasks: result.tasksCompleted });
      await reloadTasks();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const getTaskStats = (criteriaId: CriteriaId) => {
    const criteriaTasks = tasks.filter(t => t.criteria_id === criteriaId);
    return {
      total: criteriaTasks.length,
      completed: criteriaTasks.filter(t => t.status === 'completed').length,
    };
  };

  if (criteriaLoading || tasksLoading || gradesLoading) {
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
      {/* Sync Status Bar */}
      {isConnected && repos.length > 0 && (
        <div className="mb-6 flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3 border border-gray-700">
          <div className="flex items-center gap-2 text-sm">
            {syncing ? (
              <>
                <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                <span className="text-gray-300">Syncing GitHub data...</span>
              </>
            ) : lastSyncResult ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-gray-400">
                  Synced {lastSyncResult.repos} {lastSyncResult.repos === 1 ? 'repo' : 'repos'}
                  {lastSyncResult.tasks > 0 && ` • ${lastSyncResult.tasks} ${lastSyncResult.tasks === 1 ? 'task' : 'tasks'} completed`}
                </span>
              </>
            ) : (
              <span className="text-gray-400">{repos.length} GitHub {repos.length === 1 ? 'repo' : 'repos'} connected</span>
            )}
          </div>
          <button
            onClick={handleManualSync}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            Sync
          </button>
        </div>
      )}

      {/* Overall Progress Bar */}
      {totalTasks > 0 && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-white">Overall Task Progress</h3>
            <span className="text-sm text-gray-400">
              {completedTasks} of {totalTasks} tasks completed
            </span>
          </div>
          <div className="h-3 bg-gray-700 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
              title={`Completed: ${completedTasks}`}
            />
            <div
              className="h-full bg-yellow-500 transition-all duration-300"
              style={{ width: `${(inProgressTasks / totalTasks) * 100}%` }}
              title={`In Progress: ${inProgressTasks}`}
            />
            <div
              className="h-full bg-red-500 transition-all duration-300"
              style={{ width: `${(blockedTasks / totalTasks) * 100}%` }}
              title={`Blocked: ${blockedTasks}`}
            />
          </div>
          <div className="flex gap-4 mt-2 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-gray-400">Completed ({completedTasks})</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-gray-400">In Progress ({inProgressTasks})</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-gray-400">Blocked ({blockedTasks})</span>
            </span>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
            <Clock className="w-5 h-5 text-yellow-400" />
            <div>
              <p className="text-gray-400 text-sm">In Progress</p>
              <p className="text-2xl font-bold text-white">{inProgressTasks}</p>
              <p className="text-xs text-gray-500">
                {inProgressTasks === 1 ? '1 task' : `${inProgressTasks} tasks`} active
              </p>
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

      {/* Grades Summary */}
      {selectedCriteria.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-400" />
              <h3 className="font-semibold text-white">Evidence Grades</h3>
            </div>
            {averageScore !== null && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Average Score:</span>
                <span className={`text-lg font-bold ${
                  averageScore >= 75 ? 'text-emerald-400' :
                  averageScore >= 50 ? 'text-blue-400' :
                  averageScore >= 25 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {averageScore}/100
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {selectedCriteria.map(c => {
              const gradeLevel = getGradeForCriteria(c.id);
              const config = gradeLevel ? GRADE_CONFIG[gradeLevel] : null;

              return (
                <button
                  key={c.id}
                  onClick={() => navigate(`/criteria/${c.id}`)}
                  className="bg-gray-700/50 rounded-lg p-3 border border-gray-600 hover:border-gray-500 transition-all text-left"
                >
                  <p className="text-xs text-gray-400 truncate mb-1">{c.name}</p>
                  {config ? (
                    <p className={`text-sm font-semibold ${config.color}`}>
                      {config.label}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">Not graded</p>
                  )}
                </button>
              );
            })}
          </div>

          {gradedCriteriaCount === 0 && (
            <p className="text-sm text-gray-500 mt-3 text-center">
              No criteria have been graded yet. Add evidence and run AI grading to see your scores.
            </p>
          )}
        </div>
      )}

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
      <div className="flex flex-wrap gap-3">
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
        <button
          onClick={() => navigate('/stats')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
        >
          <BarChart3 className="w-4 h-4" />
          View Stats
        </button>
      </div>
    </div>
  );
}
