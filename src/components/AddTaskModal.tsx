import { useState } from 'react';
import { X } from 'lucide-react';
import type { TaskType, SyncSource } from '../types';

interface AddTaskModalProps {
  onClose: () => void;
  onAdd: (task: {
    title: string;
    description: string;
    type: TaskType;
    exhibit?: string;
    sync_source?: SyncSource;
    sync_config?: Record<string, string>;
  }) => void;
}

const SYNC_SOURCES: { value: SyncSource; label: string; configFields: string[] }[] = [
  { value: 'github_stars', label: 'GitHub Stars', configFields: ['repository'] },
  { value: 'github_contributions', label: 'GitHub Contributions', configFields: ['username'] },
  { value: 'google_scholar', label: 'Google Scholar', configFields: ['profile_id'] },
  { value: 'linkedin', label: 'LinkedIn', configFields: ['profile_url'] },
  { value: 'custom_api', label: 'Custom API', configFields: ['endpoint'] },
];

export function AddTaskModal({ onClose, onAdd }: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [exhibit, setExhibit] = useState('');
  const [type, setType] = useState<TaskType>('manual');
  const [syncSource, setSyncSource] = useState<SyncSource>('github_stars');
  const [syncConfig, setSyncConfig] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAdd({
      title: title.trim(),
      description: description.trim(),
      exhibit: exhibit.trim() || undefined,
      type,
      ...(type === 'sync' && {
        sync_source: syncSource,
        sync_config: syncConfig,
      }),
    });
    onClose();
  };

  const selectedSource = SYNC_SOURCES.find(s => s.value === syncSource);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-md border border-gray-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Add Task</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              placeholder="e.g., Get 1000 GitHub stars"
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none"
                placeholder="Optional details..."
              />
            </div>
            <div className="w-24">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Exhibit
              </label>
              <input
                type="text"
                value={exhibit}
                onChange={(e) => setExhibit(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                placeholder="A-1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Task Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType('manual')}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                  type === 'manual'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                Manual
              </button>
              <button
                type="button"
                onClick={() => setType('sync')}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                  type === 'sync'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                Sync
              </button>
            </div>
          </div>

          {type === 'sync' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Data Source
                </label>
                <select
                  value={syncSource}
                  onChange={(e) => {
                    setSyncSource(e.target.value as SyncSource);
                    setSyncConfig({});
                  }}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                >
                  {SYNC_SOURCES.map((source) => (
                    <option key={source.value} value={source.value}>
                      {source.label}
                    </option>
                  ))}
                </select>
              </div>

              {selectedSource?.configFields.map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-300 mb-1 capitalize">
                    {field.replace(/_/g, ' ')}
                  </label>
                  <input
                    type="text"
                    value={syncConfig[field] || ''}
                    onChange={(e) =>
                      setSyncConfig({ ...syncConfig, [field]: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                    placeholder={`Enter ${field.replace(/_/g, ' ')}`}
                  />
                </div>
              ))}
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 py-2 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
