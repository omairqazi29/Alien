import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { TaskCard } from '../components/TaskCard';
import { AddTaskModal } from '../components/AddTaskModal';
import { AIGrader } from '../components/AIGrader';
import { EvidenceEditor } from '../components/EvidenceEditor';
import { PolicyGuidance } from '../components/PolicyGuidance';
import { useTasks, useGrade, useEvidence } from '../hooks/useData';
import { useGitHubConfig } from '../hooks/useGitHub';
import { EB1A_CRITERIA } from '../types';
import { github } from '../lib/github';
import type { TaskStatus, CriteriaId, AIGrade } from '../types';

export function CriteriaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tasks, loading: tasksLoading, addTask, updateTask, deleteTask } = useTasks(id as CriteriaId);
  const { grade, setGrade, loading: gradeLoading } = useGrade(id as CriteriaId);
  const { content: initialEvidenceContent, loading: evidenceLoading } = useEvidence(id as CriteriaId);
  const { repos } = useGitHubConfig();
  const [evidenceContent, setEvidenceContent] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [syncingTasks, setSyncingTasks] = useState<Set<string>>(new Set());

  const criteria = EB1A_CRITERIA.find(c => c.id === id);

  // Get stars target for a task based on its connected repo
  const getStarsTarget = (repoFullName?: string): number | undefined => {
    if (!repoFullName) return undefined;
    const repo = repos.find(r => r.full_name === repoFullName);
    return repo?.stars_threshold;
  };

  // Sync evidence content from DB on initial load
  useEffect(() => {
    if (!evidenceLoading && initialEvidenceContent) {
      setEvidenceContent(initialEvidenceContent);
    }
  }, [evidenceLoading, initialEvidenceContent]);

  if (!criteria) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h1 className="text-xl font-bold text-white mb-2">Criteria not found</h1>
          <button
            onClick={() => navigate('/')}
            className="text-emerald-400 hover:text-emerald-300"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (tasksLoading || gradeLoading || evidenceLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleAddTask = (taskData: {
    title: string;
    description: string;
    type: 'manual' | 'sync';
    exhibit?: string;
    sync_source?: any;
    sync_config?: Record<string, string>;
  }) => {
    addTask({
      criteria_id: id as CriteriaId,
      title: taskData.title,
      description: taskData.description,
      type: taskData.type,
      exhibit: taskData.exhibit,
      sync_source: taskData.sync_source,
      sync_config: taskData.sync_config,
      status: 'not_started',
    });
  };

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

    let evidence = '';
    try {
      switch (task.sync_source) {
        case 'github_stars': {
          const repoFullName = task.sync_config?.repository;
          if (repoFullName) {
            const [owner, repo] = repoFullName.split('/');
            const metrics = await github.getRepoMetrics(owner, repo);
            evidence = `Repository has ${metrics.stars.toLocaleString()} stars`;
          } else {
            evidence = 'No repository configured';
          }
          break;
        }
        case 'github_contributions':
          evidence = `GitHub contributions (connect in Settings to sync)`;
          break;
        case 'google_scholar':
          evidence = `Google Scholar citations (integration coming soon)`;
          break;
        default:
          evidence = 'Data synced successfully';
      }
    } catch (error) {
      evidence = `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
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

  const handleGrade = (newGrade: AIGrade) => {
    setGrade(newGrade);
  };

  const completedCount = tasks.filter(t => t.status === 'completed').length;

  return (
    <div>
      {/* Breadcrumb */}
      <button
        onClick={() => navigate('/criteria')}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Criteria
      </button>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{criteria.name}</h1>
        <p className="text-gray-400 mt-1">{criteria.officialTitle}</p>
      </div>

      {/* Policy Guidance */}
      <div className="mb-6">
        <PolicyGuidance criteria={criteria} />
      </div>

      {/* Progress */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400">Progress</span>
          <span className="text-white font-medium">
            {completedCount}/{tasks.length} tasks completed
          </span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: tasks.length > 0 ? `${(completedCount / tasks.length) * 100}%` : '0%' }}
          />
        </div>
      </div>

      {/* Evidence Documentation */}
      <div className="mb-6">
        <EvidenceEditor
          criteriaId={id as CriteriaId}
          criteriaName={criteria.name}
          onSave={setEvidenceContent}
        />
      </div>

      {/* AI Grader */}
      <div className="mb-6">
        <AIGrader
          criteriaId={id as CriteriaId}
          evidenceContent={evidenceContent}
          existingGrade={grade || undefined}
          onGrade={handleGrade}
        />
      </div>

      {/* Tasks */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Tasks & Evidence</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
          <p className="text-gray-400 mb-4">No tasks yet for this criteria</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-emerald-400 hover:text-emerald-300"
          >
            Add your first task
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={(status) => handleStatusChange(task.id, status)}
              onSync={task.type === 'sync' ? () => handleSync(task.id) : undefined}
              onDelete={() => handleDeleteTask(task.id)}
              isSyncing={syncingTasks.has(task.id)}
              starsTarget={getStarsTarget(task.sync_config?.repository)}
            />
          ))}
        </div>
      )}

      <AddTaskModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddTask}
      />
    </div>
  );
}
