import { useState, useEffect } from 'react';
import { Modal, Button, Input } from './ui';
import type { Task } from '../types';

interface EditTaskModalProps {
  open: boolean;
  task: Task | null;
  onClose: () => void;
  onSave: (updates: { title: string; description: string; exhibit?: string }) => void;
}

export function EditTaskModal({ open, task, onClose, onSave }: EditTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [exhibit, setExhibit] = useState('');

  // Sync form with task when modal opens
  useEffect(() => {
    if (task && open) {
      setTitle(task.title);
      setDescription(task.description || '');
      setExhibit(task.exhibit || '');
    }
  }, [task, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      description: description.trim(),
      exhibit: exhibit.trim() || undefined,
    });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit Task">
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <Input
          label="Title *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          autoFocus
        />

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
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

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={!title.trim()} className="flex-1">
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
