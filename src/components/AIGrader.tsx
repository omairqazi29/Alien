import { useState } from 'react';
import { Sparkles, AlertTriangle, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { gradeEvidence } from '../lib/ai';
import { useCriteriaPolicy, useAssumeEvidenceExists } from '../hooks/useData';
import { Button, Alert, Card } from './ui';
import type { AIGrade, CriteriaId, GradeLevel, ModelGrade } from '../types';

interface AIGraderProps {
  criteriaId: CriteriaId;
  evidenceContent: string;
  existingGrade?: AIGrade;
  onGrade: (grade: AIGrade) => void;
}

const gradeConfig: Record<GradeLevel, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  strong: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: 'Strong' },
  moderate: { icon: HelpCircle, color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Moderate' },
  weak: { icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/20', label: 'Weak' },
  insufficient: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20', label: 'Insufficient' },
};

function GradeCard({ grade }: { grade: ModelGrade }) {
  const config = gradeConfig[grade.grade];
  const GradeIcon = config.icon;

  return (
    <div className="flex-1 min-w-0">
      <div className="text-xs text-gray-500 mb-2 font-medium">{grade.modelName}</div>
      <div className={`flex items-center gap-3 p-3 rounded-lg ${config.bg}`}>
        <GradeIcon className={`w-8 h-8 ${config.color} flex-shrink-0`} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-bold text-lg ${config.color}`}>{config.label}</span>
            <span className="text-gray-400">({grade.score}/100)</span>
          </div>
          <div className="w-24 h-2 bg-gray-700 rounded-full mt-1">
            <div
              className={`h-full rounded-full ${config.bg.replace('/20', '')}`}
              style={{ width: `${grade.score}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-3">
        <h4 className="text-sm font-medium text-gray-400 mb-1">Feedback</h4>
        <p className="text-sm text-gray-300">{grade.feedback}</p>
      </div>

      {grade.suggestions.length > 0 && (
        <div className="mt-3">
          <h4 className="text-sm font-medium text-gray-400 mb-1">Suggestions</h4>
          <ul className="space-y-1">
            {grade.suggestions.map((suggestion, index) => (
              <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                <span className="text-purple-400">•</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function AIGrader({ criteriaId, evidenceContent, existingGrade, onGrade }: AIGraderProps) {
  const [isGrading, setIsGrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { policyDetails } = useCriteriaPolicy(criteriaId);
  const { assumeExists } = useAssumeEvidenceExists(criteriaId);

  const handleGrade = async () => {
    if (!evidenceContent || !evidenceContent.trim()) {
      setError('Please add petition evidence before grading.');
      return;
    }

    setIsGrading(true);
    setError(null);

    try {
      const result = await gradeEvidence(criteriaId, evidenceContent, policyDetails, assumeExists);

      const aiGrade: AIGrade = {
        id: `grade-${criteriaId}-${Date.now()}`,
        criteria_id: criteriaId,
        grades: result.grades,
        graded_at: new Date().toISOString(),
      };

      onGrade(aiGrade);
    } catch (err) {
      console.error('Grading error:', err);
      setError(err instanceof Error ? err.message : 'Failed to grade evidence');
    } finally {
      setIsGrading(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          AI Immigration Officer Grade
        </h3>
        <Button
          onClick={handleGrade}
          loading={isGrading}
          className="bg-purple-600 hover:bg-purple-500"
          icon={<Sparkles className="w-4 h-4" />}
        >
          {isGrading ? 'Grading...' : existingGrade ? 'Re-grade' : 'Grade'}
        </Button>
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {existingGrade && existingGrade.grades.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {existingGrade.grades.map((grade) => (
              <GradeCard key={grade.model} grade={grade} />
            ))}
          </div>

          <p className="text-xs text-gray-500">
            Graded: {new Date(existingGrade.graded_at).toLocaleString()}
          </p>
        </div>
      ) : (
        <p className="text-gray-400 text-sm">
          Click "Grade" to have two AI models evaluate your evidence for this criterion as an immigration officer would.
        </p>
      )}
    </Card>
  );
}
