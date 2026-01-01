import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Target,
  CheckCircle2,
  Clock,
  XCircle,
  Award,
  FileText,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { useSelectedCriteria, useTasks, useAllGrades } from '../hooks/useData';
import { EB1A_CRITERIA } from '../types';
import type { CriteriaId, GradeLevel, TaskStatus } from '../types';

const GRADE_CONFIG: Record<GradeLevel, { color: string; bgColor: string; label: string; score: number }> = {
  strong: { color: 'text-emerald-400', bgColor: 'bg-emerald-500', label: 'Strong', score: 4 },
  moderate: { color: 'text-blue-400', bgColor: 'bg-blue-500', label: 'Moderate', score: 3 },
  weak: { color: 'text-yellow-400', bgColor: 'bg-yellow-500', label: 'Weak', score: 2 },
  insufficient: { color: 'text-red-400', bgColor: 'bg-red-500', label: 'Insufficient', score: 1 },
};

const STATUS_CONFIG: Record<TaskStatus, { color: string; bgColor: string; label: string; icon: typeof CheckCircle2 }> = {
  completed: { color: 'text-emerald-400', bgColor: 'bg-emerald-500', label: 'Completed', icon: CheckCircle2 },
  in_progress: { color: 'text-yellow-400', bgColor: 'bg-yellow-500', label: 'In Progress', icon: Clock },
  not_started: { color: 'text-gray-400', bgColor: 'bg-gray-500', label: 'Not Started', icon: Target },
  blocked: { color: 'text-red-400', bgColor: 'bg-red-500', label: 'Blocked', icon: XCircle },
};

export function Stats() {
  const navigate = useNavigate();
  const { criteria: selectedIds, loading: criteriaLoading } = useSelectedCriteria();
  const { tasks, loading: tasksLoading } = useTasks();
  const { grades, loading: gradesLoading } = useAllGrades();

  const selectedCriteria = EB1A_CRITERIA.filter(c => selectedIds.includes(c.id));

  // Task statistics
  const totalTasks = tasks.length;
  const tasksByStatus = {
    completed: tasks.filter(t => t.status === 'completed').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    not_started: tasks.filter(t => t.status === 'not_started').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
  };
  const completionRate = totalTasks > 0 ? Math.round((tasksByStatus.completed / totalTasks) * 100) : 0;

  // Task types
  const manualTasks = tasks.filter(t => t.type === 'manual').length;
  const syncTasks = tasks.filter(t => t.type === 'sync').length;

  // Grade statistics
  const getGradeLevel = (score: number): GradeLevel => {
    if (score >= 75) return 'strong';
    if (score >= 50) return 'moderate';
    if (score >= 25) return 'weak';
    return 'insufficient';
  };

  const gradeStats = {
    strong: 0,
    moderate: 0,
    weak: 0,
    insufficient: 0,
    ungraded: selectedCriteria.length,
  };

  const criteriaScores: { id: CriteriaId; name: string; score: number | null; grade: GradeLevel | null }[] = [];

  selectedCriteria.forEach(c => {
    const grade = grades.find(g => g.criteria_id === c.id);
    if (grade && grade.grades && grade.grades.length > 0) {
      const avgScore = Math.round(grade.grades.reduce((sum, g) => sum + g.score, 0) / grade.grades.length);
      const gradeLevel = getGradeLevel(avgScore);
      gradeStats[gradeLevel]++;
      gradeStats.ungraded--;
      criteriaScores.push({ id: c.id, name: c.name, score: avgScore, grade: gradeLevel });
    } else {
      criteriaScores.push({ id: c.id, name: c.name, score: null, grade: null });
    }
  });

  // Sort by score descending (ungraded at end)
  criteriaScores.sort((a, b) => {
    if (a.score === null) return 1;
    if (b.score === null) return -1;
    return b.score - a.score;
  });

  const averageScore = criteriaScores.filter(c => c.score !== null).length > 0
    ? Math.round(criteriaScores.filter(c => c.score !== null).reduce((sum, c) => sum + (c.score || 0), 0) / criteriaScores.filter(c => c.score !== null).length)
    : null;

  // Tasks per criteria
  const tasksPerCriteria = selectedCriteria.map(c => {
    const criteriaTasks = tasks.filter(t => t.criteria_id === c.id);
    return {
      id: c.id,
      name: c.name,
      total: criteriaTasks.length,
      completed: criteriaTasks.filter(t => t.status === 'completed').length,
      inProgress: criteriaTasks.filter(t => t.status === 'in_progress').length,
      blocked: criteriaTasks.filter(t => t.status === 'blocked').length,
    };
  }).sort((a, b) => b.total - a.total);

  // Recent activity (tasks updated in last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentTasks = tasks.filter(t => new Date(t.updated_at) > sevenDaysAgo).length;

  if (criteriaLoading || tasksLoading || gradesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-8 h-8 text-purple-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Statistics</h1>
          <p className="text-gray-400 text-sm">Detailed analytics for your EB-1A petition progress</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-400">Criteria</span>
          </div>
          <p className="text-2xl font-bold text-white">{selectedCriteria.length}</p>
          <p className="text-xs text-gray-500">of 10 selected</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-gray-400">Total Tasks</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalTasks}</p>
          <p className="text-xs text-gray-500">{manualTasks} manual, {syncTasks} synced</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-gray-400">Completion</span>
          </div>
          <p className="text-2xl font-bold text-white">{completionRate}%</p>
          <p className="text-xs text-gray-500">{tasksByStatus.completed} tasks done</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-gray-400">Recent Activity</span>
          </div>
          <p className="text-2xl font-bold text-white">{recentTasks}</p>
          <p className="text-xs text-gray-500">tasks updated (7 days)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Task Status Breakdown */}
        <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">Task Status Breakdown</h2>

          {totalTasks > 0 ? (
            <>
              <div className="h-4 bg-gray-700 rounded-full overflow-hidden flex mb-4">
                {(['completed', 'in_progress', 'not_started', 'blocked'] as TaskStatus[]).map(status => (
                  <div
                    key={status}
                    className={`h-full ${STATUS_CONFIG[status].bgColor} transition-all duration-300`}
                    style={{ width: `${(tasksByStatus[status] / totalTasks) * 100}%` }}
                  />
                ))}
              </div>

              <div className="space-y-3">
                {(['completed', 'in_progress', 'not_started', 'blocked'] as TaskStatus[]).map(status => {
                  const config = STATUS_CONFIG[status];
                  const count = tasksByStatus[status];
                  const percent = Math.round((count / totalTasks) * 100);
                  const Icon = config.icon;

                  return (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${config.color}`} />
                        <span className="text-gray-300">{config.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400">{count} tasks</span>
                        <span className={`text-sm font-medium ${config.color}`}>{percent}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-center py-4">No tasks created yet</p>
          )}
        </div>

        {/* Grade Distribution */}
        <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Grade Distribution</h2>
            {averageScore !== null && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Avg:</span>
                <span className={`text-lg font-bold ${
                  averageScore >= 75 ? 'text-emerald-400' :
                  averageScore >= 50 ? 'text-blue-400' :
                  averageScore >= 25 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {averageScore}
                </span>
              </div>
            )}
          </div>

          {selectedCriteria.length > 0 ? (
            <>
              <div className="grid grid-cols-5 gap-2 mb-4">
                {(['strong', 'moderate', 'weak', 'insufficient'] as GradeLevel[]).map(grade => {
                  const config = GRADE_CONFIG[grade];
                  return (
                    <div key={grade} className="text-center">
                      <div className={`text-2xl font-bold ${config.color}`}>{gradeStats[grade]}</div>
                      <div className="text-xs text-gray-500">{config.label}</div>
                    </div>
                  );
                })}
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-500">{gradeStats.ungraded}</div>
                  <div className="text-xs text-gray-500">Ungraded</div>
                </div>
              </div>

              <div className="space-y-2">
                {criteriaScores.map(c => (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/criteria/${c.id}`)}
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-colors"
                  >
                    <span className="text-sm text-gray-300 truncate">{c.name}</span>
                    {c.score !== null && c.grade ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-600 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${GRADE_CONFIG[c.grade].bgColor}`}
                            style={{ width: `${c.score}%` }}
                          />
                        </div>
                        <span className={`text-sm font-medium ${GRADE_CONFIG[c.grade].color} w-8`}>
                          {c.score}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">Not graded</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-center py-4">No criteria selected yet</p>
          )}
        </div>
      </div>

      {/* Tasks per Criteria */}
      <div className="bg-gray-800 rounded-lg p-5 border border-gray-700 mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Tasks by Criteria</h2>

        {tasksPerCriteria.length > 0 ? (
          <div className="space-y-4">
            {tasksPerCriteria.map(c => {
              const completionPercent = c.total > 0 ? Math.round((c.completed / c.total) * 100) : 0;

              return (
                <button
                  key={c.id}
                  onClick={() => navigate(`/criteria/${c.id}`)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-gray-300 font-medium">{c.name}</span>
                    <span className="text-sm text-gray-400">
                      {c.completed}/{c.total} completed
                    </span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-500"
                      style={{ width: `${completionPercent}%` }}
                    />
                    <div
                      className="h-full bg-yellow-500"
                      style={{ width: `${c.total > 0 ? (c.inProgress / c.total) * 100 : 0}%` }}
                    />
                    <div
                      className="h-full bg-red-500"
                      style={{ width: `${c.total > 0 ? (c.blocked / c.total) * 100 : 0}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No criteria selected yet</p>
        )}
      </div>

      {/* EB-1A Readiness */}
      <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-semibold text-white">EB-1A Readiness</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-gray-700/50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-white mb-1">{selectedCriteria.length}/3</p>
            <p className="text-sm text-gray-400">Criteria selected (min 3 required)</p>
            {selectedCriteria.length >= 3 ? (
              <span className="inline-block mt-2 px-2 py-1 text-xs rounded bg-emerald-500/20 text-emerald-400">
                Requirement met
              </span>
            ) : (
              <span className="inline-block mt-2 px-2 py-1 text-xs rounded bg-yellow-500/20 text-yellow-400">
                {3 - selectedCriteria.length} more needed
              </span>
            )}
          </div>

          <div className="bg-gray-700/50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-white mb-1">{gradeStats.strong + gradeStats.moderate}</p>
            <p className="text-sm text-gray-400">Strong/Moderate grades</p>
            {gradeStats.strong + gradeStats.moderate >= 3 ? (
              <span className="inline-block mt-2 px-2 py-1 text-xs rounded bg-emerald-500/20 text-emerald-400">
                Looking good
              </span>
            ) : gradeStats.ungraded > 0 ? (
              <span className="inline-block mt-2 px-2 py-1 text-xs rounded bg-gray-500/20 text-gray-400">
                {gradeStats.ungraded} ungraded
              </span>
            ) : (
              <span className="inline-block mt-2 px-2 py-1 text-xs rounded bg-yellow-500/20 text-yellow-400">
                Improve evidence
              </span>
            )}
          </div>

          <div className="bg-gray-700/50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-white mb-1">{completionRate}%</p>
            <p className="text-sm text-gray-400">Task completion rate</p>
            {completionRate >= 80 ? (
              <span className="inline-block mt-2 px-2 py-1 text-xs rounded bg-emerald-500/20 text-emerald-400">
                Excellent progress
              </span>
            ) : completionRate >= 50 ? (
              <span className="inline-block mt-2 px-2 py-1 text-xs rounded bg-blue-500/20 text-blue-400">
                Good progress
              </span>
            ) : (
              <span className="inline-block mt-2 px-2 py-1 text-xs rounded bg-yellow-500/20 text-yellow-400">
                Keep going
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => navigate('/criteria')}
          className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          Manage your criteria
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
