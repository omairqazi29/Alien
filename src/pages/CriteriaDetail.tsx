import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { TaskCard } from '../components/TaskCard';
import { AddTaskModal } from '../components/AddTaskModal';
import { AIGrader } from '../components/AIGrader';
import { storage, generateId } from '../lib/storage';
import { EB1A_CRITERIA } from '../types';
import type { Task, TaskStatus, CriteriaId, AIGrade } from '../types';

export function CriteriaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [syncingTasks, setSyncingTasks] = useState<Set<string>>(new Set());
  const [grade, setGrade] = useState<AIGrade | undefined>();

  const criteria = EB1A_CRITERIA.find(c => c.id === id);

  useEffect(() => {
    if (id) {
      setTasks(storage.getTasksByCriteria(id as CriteriaId));
      setGrade(storage.getGradeByCriteria(id as CriteriaId));
    }
  }, [id]);

  if (!criteria) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
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

  const handleAddTask = (taskData: {
    title: string;
    description: string;
    type: 'manual' | 'sync';
    sync_source?: any;
    sync_config?: Record<string, string>;
  }) => {
    const now = new Date().toISOString();
    const newTask: Task = {
      id: generateId(),
      criteria_id: id as CriteriaId,
      title: taskData.title,
      description: taskData.description,
      type: taskData.type,
      sync_source: taskData.sync_source,
      sync_config: taskData.sync_config,
      status: 'not_started',
      created_at: now,
      updated_at: now,
    };
    storage.addTask(newTask);
    setTasks(prev => [...prev, newTask]);
  };

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    storage.updateTask(taskId, { status });
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, status, updated_at: new Date().toISOString() } : t))
    );
  };

  const handleDeleteTask = (taskId: string) => {
    storage.deleteTask(taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleSync = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    setSyncingTasks(prev => new Set(prev).add(taskId));

    // Simulate API call (replace with real implementation later)
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

    storage.updateTask(taskId, {
      evidence,
      last_synced: new Date().toISOString(),
      status: 'completed',
    });

    setTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? { ...t, evidence, last_synced: new Date().toISOString(), status: 'completed', updated_at: new Date().toISOString() }
          : t
      )
    );

    setSyncingTasks(prev => {
      const next = new Set(prev);
      next.delete(taskId);
      return next;
    });
  };

  const handleGrade = (newGrade: AIGrade) => {
    storage.setGradeByCriteria(newGrade);
    setGrade(newGrade);
  };

  const completedCount = tasks.filter(t => t.status === 'completed').length;

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{criteria.name}</h1>
            <p className="text-gray-400 mt-1">{criteria.description}</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
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

        {/* AI Grader */}
        <div className="mb-6">
          <AIGrader
            criteriaId={id as CriteriaId}
            criteriaName={criteria.name}
            tasks={tasks}
            existingGrade={grade}
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
              />
            ))}
          </div>
        )}

        {showAddModal && (
          <AddTaskModal
            onClose={() => setShowAddModal(false)}
            onAdd={handleAddTask}
          />
        )}
      </main>
    </div>
  );
}
