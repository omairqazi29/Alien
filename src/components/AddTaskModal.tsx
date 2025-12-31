import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/database';
import { Modal, Button, Input, Select } from './ui';
import { cn } from '../utils/cn';
import type { TaskType, SyncSource, GitHubRepoConfig } from '../types';

interface AddTaskModalProps {
  open: boolean;
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

// Toggle button for task type selection
function TypeToggle({
  type,
  onChange,
}: {
  type: TaskType;
  onChange: (type: TaskType) => void;
}) {
  const options: { value: TaskType; label: string; activeClass: string }[] = [
    { value: 'manual', label: 'Manual', activeClass: 'border-emerald-500 bg-emerald-500/10 text-emerald-400' },
    { value: 'sync', label: 'Sync', activeClass: 'border-blue-500 bg-blue-500/10 text-blue-400' },
  ];

  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex-1 py-2 px-4 rounded-lg border-2 transition-all',
            type === opt.value ? opt.activeClass : 'border-gray-700 text-gray-400 hover:border-gray-600'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function AddTaskModal({ open, onClose, onAdd }: AddTaskModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [exhibit, setExhibit] = useState('');
  const [type, setType] = useState<TaskType>('manual');
  const [syncSource, setSyncSource] = useState<SyncSource>('github_stars');
  const [syncConfig, setSyncConfig] = useState<Record<string, string>>({});
  const [connectedRepos, setConnectedRepos] = useState<GitHubRepoConfig[]>([]);

  // Load connected GitHub repos
  useEffect(() => {
    async function loadRepos() {
      if (!user) return;
      const config = await db.getGitHubConfig(user.id);
      setConnectedRepos(config.repos);
    }
    loadRepos();
  }, [user]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setTitle('');
      setDescription('');
      setExhibit('');
      setType('manual');
      setSyncSource('github_stars');
      setSyncConfig({});
    }
  }, [open]);

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

  const selectedSource = SYNC_SOURCES.find((s) => s.value === syncSource);

  const syncSourceOptions = SYNC_SOURCES.map((s) => ({ value: s.value, label: s.label }));

  const repoOptions = connectedRepos.map((repo) => ({
    value: repo.full_name,
    label: `${repo.name} (${repo.current_stars || 0} ★ / ${repo.stars_threshold || 0} target)`,
  }));

  return (
    <Modal open={open} onClose={onClose} title="Add Task">
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <Input
          label="Title *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Get 1000 GitHub stars"
          autoFocus
        />

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none"
              placeholder="Optional details..."
            />
          </div>
          <div className="w-24">
            <Input
              label="Exhibit"
              value={exhibit}
              onChange={(e) => setExhibit(e.target.value)}
              placeholder="A-1"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Task Type</label>
          <TypeToggle type={type} onChange={setType} />
        </div>

        {type === 'sync' && (
          <>
            <Select
              label="Data Source"
              value={syncSource}
              onChange={(e) => {
                setSyncSource(e.target.value as SyncSource);
                setSyncConfig({});
              }}
              options={syncSourceOptions}
            />

            {selectedSource?.configFields.map((field) => (
              <div key={field}>
                {field === 'repository' && syncSource === 'github_stars' && connectedRepos.length > 0 ? (
                  <Select
                    label={field.replace(/_/g, ' ')}
                    value={syncConfig[field] || ''}
                    onChange={(e) => setSyncConfig({ ...syncConfig, [field]: e.target.value })}
                    options={repoOptions}
                    placeholder="Select a repository"
                  />
                ) : (
                  <Input
                    label={field.replace(/_/g, ' ')}
                    value={syncConfig[field] || ''}
                    onChange={(e) => setSyncConfig({ ...syncConfig, [field]: e.target.value })}
                    placeholder={`Enter ${field.replace(/_/g, ' ')}`}
                  />
                )}
                {field === 'repository' && syncSource === 'github_stars' && connectedRepos.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Connect GitHub repos in Settings to select from a list
                  </p>
                )}
              </div>
            ))}
          </>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={!title.trim()} className="flex-1">
            Add Task
          </Button>
        </div>
      </form>
    </Modal>
  );
}
