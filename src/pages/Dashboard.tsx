import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Target, CheckCircle2, AlertCircle } from 'lucide-react';
import { CriteriaCard } from '../components/CriteriaCard';
import { storage } from '../lib/storage';
import { EB1A_CRITERIA } from '../types';
import type { Criteria, CriteriaId, Task } from '../types';

export function Dashboard() {
  const navigate = useNavigate();
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const selectedIds = storage.getSelectedCriteria();
    const allTasks = storage.getTasks();

    setCriteria(
      EB1A_CRITERIA.map(c => ({
        ...c,
        selected: selectedIds.includes(c.id),
      }))
    );
    setTasks(allTasks);
  }, []);

  const toggleCriteria = (id: CriteriaId) => {
    setCriteria(prev => {
      const updated = prev.map(c =>
        c.id === id ? { ...c, selected: !c.selected } : c
      );
      const selectedIds = updated.filter(c => c.selected).map(c => c.id);
      storage.setSelectedCriteria(selectedIds);
      return updated;
    });
  };

  const selectedCriteria = criteria.filter(c => c.selected);
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;

  const getTaskStats = (criteriaId: CriteriaId) => {
    const criteriaTasks = tasks.filter(t => t.criteria_id === criteriaId);
    return {
      total: criteriaTasks.length,
      completed: criteriaTasks.filter(t => t.status === 'completed').length,
    };
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Rocket className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">The Alien Project</h1>
              <p className="text-gray-400">EB-1A Preparation Dashboard</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
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

        {/* Criteria Selection */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-2">EB-1A Criteria</h2>
          <p className="text-gray-400 mb-4">
            Select the criteria you're targeting. You need to meet at least 3 out of 10.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {criteria.map(c => {
            const stats = getTaskStats(c.id);
            return (
              <CriteriaCard
                key={c.id}
                criteria={c}
                onToggle={() => toggleCriteria(c.id)}
                onSelect={() => navigate(`/criteria/${c.id}`)}
                taskCount={stats.total}
                completedCount={stats.completed}
              />
            );
          })}
        </div>
      </main>
    </div>
  );
}
