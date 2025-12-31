import { Check, ChevronRight } from 'lucide-react';
import type { Criteria } from '../types';

interface CriteriaCardProps {
  criteria: Criteria;
  onToggle: () => void;
  onSelect: () => void;
  taskCount: number;
  completedCount: number;
}

export function CriteriaCard({ criteria, onToggle, onSelect, taskCount, completedCount }: CriteriaCardProps) {
  const progress = taskCount > 0 ? (completedCount / taskCount) * 100 : 0;

  return (
    <div
      className={`relative p-4 rounded-lg border-2 transition-all ${
        criteria.selected
          ? 'border-emerald-500 bg-emerald-500/10'
          : 'border-gray-700 bg-gray-800 hover:border-gray-600'
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
            criteria.selected
              ? 'bg-emerald-500 border-emerald-500'
              : 'border-gray-500 hover:border-emerald-400'
          }`}
        >
          {criteria.selected && <Check className="w-3 h-3 text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white">{criteria.name}</h3>
          <p className="text-sm text-gray-400 mt-1 line-clamp-2">{criteria.description}</p>

          {criteria.selected && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>{completedCount}/{taskCount} tasks</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {criteria.selected && (
          <button
            onClick={onSelect}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
