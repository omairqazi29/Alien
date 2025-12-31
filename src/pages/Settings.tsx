import { useState } from 'react';
import { Upload, Database, Github, RefreshCw, Star, Check, Plus, X, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/database';
import { useGitHubConfig, useAvailableRepos } from '../hooks/useGitHub';
import { useAsyncAction } from '../hooks/useAsync';
import { Button, Card, CardHeader, Modal, Alert, Badge } from '../components/ui';
import { SEED_TASKS } from '../data/seedTasks';
import type { CriteriaId } from '../types';
import type { GitHubRepo } from '../lib/github';

// Extracted component for connected repo display
function ConnectedRepoCard({
  repo,
  onUpdateThreshold,
  onRemove,
}: {
  repo: { id: number; name: string; current_stars?: number; stars_threshold?: number; last_synced?: string };
  onUpdateThreshold: (id: number, threshold: number) => void;
  onRemove: (id: number) => void;
}) {
  const meetsThreshold = (repo.current_stars || 0) >= (repo.stars_threshold || 0);

  return (
    <div
      className={`p-3 rounded-lg border ${
        meetsThreshold ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-gray-900 border-gray-700'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">{repo.name}</span>
            {meetsThreshold && <Badge variant="success">Threshold met!</Badge>}
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              {repo.current_stars || 0} stars
            </span>
            <span>Target: {repo.stars_threshold || 0}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={repo.stars_threshold || 0}
            onChange={(e) => onUpdateThreshold(repo.id, parseInt(e.target.value) || 0)}
            className="w-20 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm text-center"
            min="0"
          />
          <button
            onClick={() => onRemove(repo.id)}
            className="p-1 text-gray-400 hover:text-red-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      {repo.last_synced && (
        <p className="text-xs text-gray-500 mt-2">
          Last synced: {new Date(repo.last_synced).toLocaleString()}
        </p>
      )}
    </div>
  );
}

// Extracted component for repo selection item
function RepoSelectItem({ repo, onSelect }: { repo: GitHubRepo; onSelect: (repo: GitHubRepo) => void }) {
  return (
    <button
      onClick={() => onSelect(repo)}
      className="w-full p-3 bg-gray-900 rounded-lg border border-gray-700 hover:border-emerald-500 transition-colors text-left"
    >
      <div className="font-medium text-white">{repo.name}</div>
      <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
        <span className="flex items-center gap-1">
          <Star className="w-3 h-3" />
          {repo.stargazers_count}
        </span>
        {repo.language && <span>{repo.language}</span>}
      </div>
      {repo.description && (
        <p className="text-sm text-gray-500 mt-1 line-clamp-1">{repo.description}</p>
      )}
    </button>
  );
}

export function Settings() {
  const { user } = useAuth();
  const [showRepoSelector, setShowRepoSelector] = useState(false);
  const [syncResult, setSyncResult] = useState<{ tasksCompleted: number; reposUpdated: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);

  // GitHub hooks
  const githubConfig = useGitHubConfig();
  const availableRepos = useAvailableRepos(githubConfig.repos, githubConfig.username);

  // Import tasks action
  const importAction = useAsyncAction(async () => {
    if (!user) return;
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
  });

  // Sync repos action
  const syncAction = useAsyncAction(async () => {
    const result = await githubConfig.syncAll();
    setSyncResult(result);
  });

  const handleSaveUsername = async () => {
    if (!usernameInput.trim()) return;
    setSavingUsername(true);
    setError(null);
    try {
      await githubConfig.saveUsername(usernameInput.trim());
      setUsernameInput('');
    } catch {
      setError('Failed to save GitHub username');
    } finally {
      setSavingUsername(false);
    }
  };

  const handleLoadRepos = async () => {
    await availableRepos.load();
    setShowRepoSelector(true);
  };

  const handleAddRepo = async (repo: GitHubRepo) => {
    await githubConfig.addRepo(repo);
    availableRepos.removeFromAvailable(repo.id);
    if (availableRepos.repos.length === 1) {
      setShowRepoSelector(false);
    }
  };

  // Count tasks per criteria
  const tasksByCriteria = SEED_TASKS.reduce(
    (acc, task) => {
      acc[task.criteria_id] = (acc[task.criteria_id] || 0) + 1;
      return acc;
    },
    {} as Record<CriteriaId, number>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Manage your account, connect GitHub, and import data.</p>
      </div>

      {/* GitHub Integration */}
      <Card padding="lg" className="mb-6">
        <CardHeader
          icon={<Github className="w-6 h-6 text-white" />}
          title="GitHub Integration"
          description="Add your GitHub username to track repository stars for your Original Contributions criterion. Set thresholds to auto-complete tasks when milestones are reached."
          action={
            githubConfig.isConnected && (
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <Check className="w-3 h-3" />
                Connected as @{githubConfig.username}
              </span>
            )
          }
        />

        <div className="mt-4">
          {!githubConfig.isConnected ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Enter GitHub username"
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                onKeyDown={(e) => e.key === 'Enter' && handleSaveUsername()}
              />
              <Button
                variant="primary"
                loading={savingUsername}
                icon={<Save className="w-4 h-4" />}
                onClick={handleSaveUsername}
                disabled={!usernameInput.trim()}
              >
                Save
              </Button>
            </div>
          ) : (
            <>
              {githubConfig.repos.length > 0 && (
                <div className="space-y-3 mb-4">
                  {githubConfig.repos.map((repo) => (
                    <ConnectedRepoCard
                      key={repo.id}
                      repo={repo}
                      onUpdateThreshold={githubConfig.updateThreshold}
                      onRemove={githubConfig.removeRepo}
                    />
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  loading={availableRepos.loading}
                  icon={<Plus className="w-4 h-4" />}
                  onClick={handleLoadRepos}
                >
                  Add Repository
                </Button>

                {githubConfig.repos.length > 0 && (
                  <Button
                    variant="primary"
                    loading={syncAction.loading}
                    icon={<RefreshCw className={`w-4 h-4 ${syncAction.loading ? 'animate-spin' : ''}`} />}
                    onClick={() => syncAction.execute()}
                  >
                    Sync All
                  </Button>
                )}

                {syncResult && (
                  <div className="flex items-center gap-2 text-sm text-emerald-400">
                    <Check className="w-4 h-4" />
                    <span>
                      Synced {syncResult.reposUpdated} repos
                      {syncResult.tasksCompleted > 0 && (
                        <>
                          , auto-completed {syncResult.tasksCompleted} task
                          {syncResult.tasksCompleted !== 1 ? 's' : ''}!
                        </>
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* Repo Selector Modal */}
              <Modal
                open={showRepoSelector}
                onClose={() => setShowRepoSelector(false)}
                title="Select Repository"
                size="lg"
              >
                <div className="p-4">
                  {availableRepos.repos.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No more repositories available</p>
                  ) : (
                    <div className="space-y-2">
                      {availableRepos.repos.map((repo) => (
                        <RepoSelectItem key={repo.id} repo={repo} onSelect={handleAddRepo} />
                      ))}
                    </div>
                  )}
                </div>
              </Modal>
            </>
          )}

          {(error || availableRepos.error || syncAction.error) && (
            <Alert variant="error" className="mt-4">
              {error || availableRepos.error || syncAction.error}
            </Alert>
          )}
        </div>
      </Card>

      {/* Import Seed Tasks */}
      <Card padding="lg" className="mb-6">
        <CardHeader
          icon={<Database className="w-6 h-6 text-blue-400" />}
          title="Import Pre-defined Tasks"
          description={`Import ${SEED_TASKS.length} tasks from your EB-1A preparation spreadsheet.`}
        />

        <div className="mt-4">
          <ul className="text-sm text-gray-400 mb-4 space-y-1">
            {Object.entries(tasksByCriteria).map(([criteriaId, count]) => (
              <li key={criteriaId} className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                {criteriaId.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}: {count} tasks
              </li>
            ))}
          </ul>

          {importAction.success ? (
            <Alert variant="success">
              <Upload className="w-4 h-4 inline mr-2" />
              Tasks imported successfully! Go to Criteria to see them.
            </Alert>
          ) : (
            <Button
              variant="primary"
              className="bg-blue-600 hover:bg-blue-500"
              loading={importAction.loading}
              icon={<Upload className="w-4 h-4" />}
              onClick={() => importAction.execute()}
            >
              {importAction.loading ? 'Importing...' : 'Import Tasks'}
            </Button>
          )}

          {importAction.error && (
            <Alert variant="error" className="mt-4">
              {importAction.error}
            </Alert>
          )}
        </div>
      </Card>

      {/* Account Info */}
      <Card padding="lg">
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
      </Card>
    </div>
  );
}
