import { useState } from 'react';
import { Sparkles, AlertTriangle, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import type { AIGrade, CriteriaId, GradeLevel, Task } from '../types';

interface AIGraderProps {
  criteriaId: CriteriaId;
  criteriaName: string;
  tasks: Task[];
  existingGrade?: AIGrade;
  onGrade: (grade: AIGrade) => void;
}

const gradeConfig: Record<GradeLevel, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  strong: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: 'Strong' },
  moderate: { icon: HelpCircle, color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Moderate' },
  weak: { icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/20', label: 'Weak' },
  insufficient: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20', label: 'Insufficient' },
};

export function AIGrader({ criteriaId, criteriaName, tasks, existingGrade, onGrade }: AIGraderProps) {
  const [isGrading, setIsGrading] = useState(false);

  const simulateGrading = async () => {
    setIsGrading(true);

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const completedTasks = tasks.filter(t => t.status === 'completed');
    const completionRate = tasks.length > 0 ? completedTasks.length / tasks.length : 0;

    // Mock grading logic (replace with real AI later)
    let grade: GradeLevel;
    let score: number;

    if (completionRate >= 0.8 && completedTasks.length >= 3) {
      grade = 'strong';
      score = 75 + Math.floor(Math.random() * 20);
    } else if (completionRate >= 0.5 && completedTasks.length >= 2) {
      grade = 'moderate';
      score = 50 + Math.floor(Math.random() * 25);
    } else if (completedTasks.length >= 1) {
      grade = 'weak';
      score = 25 + Math.floor(Math.random() * 25);
    } else {
      grade = 'insufficient';
      score = Math.floor(Math.random() * 25);
    }

    const suggestions = [
      completedTasks.length < 3 ? 'Add more evidence pieces to strengthen this criterion' : null,
      tasks.some(t => t.type === 'sync' && !t.last_synced) ? 'Sync your external data sources for up-to-date metrics' : null,
      completionRate < 1 ? 'Complete all pending tasks before submission' : null,
      'Consider adding recommendation letters from recognized experts',
      'Quantify your achievements with specific numbers and metrics',
    ].filter(Boolean) as string[];

    const aiGrade: AIGrade = {
      id: `grade-${criteriaId}-${Date.now()}`,
      criteria_id: criteriaId,
      grade,
      score,
      feedback: generateFeedback(grade, criteriaName, completedTasks.length),
      suggestions: suggestions.slice(0, 3),
      graded_at: new Date().toISOString(),
    };

    onGrade(aiGrade);
    setIsGrading(false);
  };

  const generateFeedback = (grade: GradeLevel, name: string, taskCount: number): string => {
    const feedbackMap: Record<GradeLevel, string> = {
      strong: `Your evidence for ${name} is compelling. You have ${taskCount} completed evidence pieces demonstrating clear qualification. An immigration officer would likely view this criterion favorably.`,
      moderate: `Your ${name} evidence shows promise but could be strengthened. While you have ${taskCount} completed items, consider adding more prestigious or quantifiable achievements.`,
      weak: `The current evidence for ${name} needs significant improvement. With only ${taskCount} completed items, you should focus on building stronger documentation.`,
      insufficient: `Insufficient evidence for ${name}. You need to gather substantial documentation before this criterion can be considered viable.`,
    };
    return feedbackMap[grade];
  };

  const config = existingGrade ? gradeConfig[existingGrade.grade] : null;
  const GradeIcon = config?.icon;

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          AI Immigration Officer Grade
        </h3>
        <button
          onClick={simulateGrading}
          disabled={isGrading}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isGrading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Grading...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              {existingGrade ? 'Re-grade' : 'Grade'}
            </>
          )}
        </button>
      </div>

      {existingGrade && config && GradeIcon ? (
        <div className="space-y-4">
          <div className={`flex items-center gap-3 p-3 rounded-lg ${config.bg}`}>
            <GradeIcon className={`w-8 h-8 ${config.color}`} />
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-bold text-lg ${config.color}`}>{config.label}</span>
                <span className="text-gray-400">({existingGrade.score}/100)</span>
              </div>
              <div className="w-32 h-2 bg-gray-700 rounded-full mt-1">
                <div
                  className={`h-full rounded-full ${config.bg.replace('/20', '')}`}
                  style={{ width: `${existingGrade.score}%` }}
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Feedback</h4>
            <p className="text-gray-300">{existingGrade.feedback}</p>
          </div>

          {existingGrade.suggestions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">Suggestions</h4>
              <ul className="space-y-1">
                {existingGrade.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-gray-500">
            Graded: {new Date(existingGrade.graded_at).toLocaleString()}
          </p>
        </div>
      ) : (
        <p className="text-gray-400 text-sm">
          Click "Grade" to have an AI evaluate your evidence for this criterion as an immigration officer would.
        </p>
      )}
    </div>
  );
}
