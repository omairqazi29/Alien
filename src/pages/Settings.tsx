import { useState } from 'react';
import { Upload, Database } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/database';
import { SEED_TASKS } from '../data/seedTasks';
import type { CriteriaId } from '../types';

export function Settings() {
  const { user } = useAuth();
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImportTasks = async () => {
    if (!user) return;

    setImporting(true);
    setError(null);

    try {
      for (const task of SEED_TASKS) {
        await db.addTask(user.id, {
          criteria_id: task.criteria_id,
          title: task.title,
          description: task.description,
          type: 'manual',
          status: task.status,
          exhibit: task.exhibit,
        });
      }
      setImported(true);
    } catch (err) {
      console.error('Failed to import tasks:', err);
      setError('Failed to import some tasks. They may already exist.');
    } finally {
      setImporting(false);
    }
  };

  // Count tasks per criteria
  const tasksByCriteria = SEED_TASKS.reduce((acc, task) => {
    acc[task.criteria_id] = (acc[task.criteria_id] || 0) + 1;
    return acc;
  }, {} as Record<CriteriaId, number>);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Manage your account and import data.</p>
      </div>

      {/* Import Seed Tasks */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-500/20 rounded-lg">
            <Database className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white mb-1">Import Pre-defined Tasks</h3>
            <p className="text-sm text-gray-400 mb-4">
              Import {SEED_TASKS.length} tasks from your EB-1A preparation spreadsheet.
              This includes tasks for:
            </p>
            <ul className="text-sm text-gray-400 mb-4 space-y-1">
              {Object.entries(tasksByCriteria).map(([criteriaId, count]) => (
                <li key={criteriaId} className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                  {criteriaId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: {count} tasks
                </li>
              ))}
            </ul>

            {imported ? (
              <div className="flex items-center gap-2 text-emerald-400">
                <Upload className="w-4 h-4" />
                Tasks imported successfully! Go to Criteria to see them.
              </div>
            ) : (
              <button
                onClick={handleImportTasks}
                disabled={importing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50"
              >
                {importing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Import Tasks
                  </>
                )}
              </button>
            )}

            {error && (
              <p className="text-sm text-red-400 mt-2">{error}</p>
            )}
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h3 className="font-semibold text-white mb-4">Account</h3>
        <div className="space-y-3">
          <div>
            <span className="text-sm text-gray-400">Email</span>
            <p className="text-white">{user?.email}</p>
          </div>
          <div>
            <span className="text-sm text-gray-400">User ID</span>
            <p className="text-white font-mono text-sm">{user?.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
