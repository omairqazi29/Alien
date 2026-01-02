import { useState, useCallback } from 'react';
import { Sparkles, AlertTriangle, CheckCircle, XCircle, HelpCircle, Loader2, RefreshCw } from 'lucide-react';
import { gradeEvidenceStream, retryFailedModel } from '../lib/ai';
import { useCriteriaPolicy, useAssumeEvidenceExists, useExhibits } from '../hooks/useData';
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

function AverageGradeBadge({ grade }: { grade: ModelGrade }) {
  const config = gradeConfig[grade.grade];
  const GradeIcon = config.icon;

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg ${config.bg} mb-4`}>
      <div className="flex items-center gap-3">
        <GradeIcon className={`w-6 h-6 ${config.color}`} />
        <div>
          <span className="text-xs text-gray-400">Average across 6 models</span>
          <div className="flex items-center gap-2">
            <span className={`font-bold ${config.color}`}>{config.label}</span>
            <span className="text-gray-400 text-sm">({grade.score}/100)</span>
          </div>
        </div>
      </div>
      <div className="w-32 h-2 bg-gray-700 rounded-full">
        <div
          className={`h-full rounded-full ${config.bg.replace('/20', '')}`}
          style={{ width: `${grade.score}%` }}
        />
      </div>
    </div>
  );
}

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
  const [streamingGrades, setStreamingGrades] = useState<ModelGrade[]>([]);
  const [averageGrade, setAverageGrade] = useState<ModelGrade | null>(null);
  const [gradingProgress, setGradingProgress] = useState({ completed: 0, total: 6 });
  const [failedModels, setFailedModels] = useState<string[]>([]);
  const [retryingModels, setRetryingModels] = useState<Set<string>>(new Set());
  const { policyDetails } = useCriteriaPolicy(criteriaId);
  const { assumeExists } = useAssumeEvidenceExists(criteriaId);
  const { exhibits } = useExhibits(criteriaId);

  const handleGrade = useCallback(async () => {
    if (!evidenceContent || !evidenceContent.trim()) {
      setError('Please add petition evidence before grading.');
      return;
    }

    setIsGrading(true);
    setError(null);
    setStreamingGrades([]);
    setAverageGrade(null);
    setGradingProgress({ completed: 0, total: 6 });
    setFailedModels([]);
    setRetryingModels(new Set());

    // Build exhibits content from extracted text (only when not assuming exhibits exist)
    let exhibitsContent = '';
    if (!assumeExists && exhibits.length > 0) {
      const exhibitTexts = exhibits
        .filter(e => e.extracted_text)
        .map(e => `[Exhibit ${e.label}: ${e.file_name}]\n${e.extracted_text}`)
        .join('\n\n---\n\n');
      exhibitsContent = exhibitTexts;
    }

    await gradeEvidenceStream(
      criteriaId,
      evidenceContent,
      policyDetails,
      assumeExists,
      exhibitsContent,
      {
        onGrade: (grade) => {
          setStreamingGrades(prev => [...prev, grade]);
        },
        onAverage: (grade, completed, total) => {
          setAverageGrade(grade);
          setGradingProgress({ completed, total });
        },
        onModelError: (modelName) => {
          setFailedModels(prev => [...prev, modelName]);
        },
        onDone: (_completedCount, failed) => {
          setIsGrading(false);
          setFailedModels(failed);
          // Save final grade
          setStreamingGrades(grades => {
            setAverageGrade(avg => {
              if (avg && grades.length > 0) {
                const aiGrade: AIGrade = {
                  id: `grade-${criteriaId}-${Date.now()}`,
                  criteria_id: criteriaId,
                  grades: [avg, ...grades],
                  graded_at: new Date().toISOString(),
                };
                onGrade(aiGrade);
              }
              return avg;
            });
            return grades;
          });
        },
        onError: (err) => {
          console.error('Grading error:', err);
          setError(err.message);
          setIsGrading(false);
        },
      }
    );
  }, [criteriaId, evidenceContent, policyDetails, assumeExists, exhibits, onGrade]);

  const handleRetryModel = useCallback(async (modelName: string) => {
    setRetryingModels(prev => new Set(prev).add(modelName));

    // Build exhibits content
    let exhibitsContent = '';
    if (!assumeExists && exhibits.length > 0) {
      const exhibitTexts = exhibits
        .filter(e => e.extracted_text)
        .map(e => `[Exhibit ${e.label}: ${e.file_name}]\n${e.extracted_text}`)
        .join('\n\n---\n\n');
      exhibitsContent = exhibitTexts;
    }

    try {
      const grade = await retryFailedModel(
        criteriaId,
        evidenceContent,
        policyDetails,
        assumeExists,
        exhibitsContent,
        modelName
      );

      // Add the new grade to streaming grades
      setStreamingGrades(prev => [...prev, grade]);

      // Remove from failed models
      setFailedModels(prev => prev.filter(m => m !== modelName));

      // Recalculate average
      setStreamingGrades(grades => {
        const allGrades = [...grades];
        const avgScore = Math.round(allGrades.reduce((sum, g) => sum + g.score, 0) / allGrades.length);
        const gradeFromScore = (score: number): 'strong' | 'moderate' | 'weak' | 'insufficient' => {
          if (score >= 75) return 'strong';
          if (score >= 50) return 'moderate';
          if (score >= 25) return 'weak';
          return 'insufficient';
        };

        const newAverage: ModelGrade = {
          model: 'average',
          modelName: 'Average',
          grade: gradeFromScore(avgScore),
          score: avgScore,
          feedback: `Average score across ${allGrades.length} models.`,
          suggestions: [],
        };
        setAverageGrade(newAverage);

        // Update saved grade
        const aiGrade: AIGrade = {
          id: `grade-${criteriaId}-${Date.now()}`,
          criteria_id: criteriaId,
          grades: [newAverage, ...allGrades],
          graded_at: new Date().toISOString(),
        };
        onGrade(aiGrade);

        return grades;
      });
    } catch (err) {
      console.error(`Retry failed for ${modelName}:`, err);
      setError(`Retry failed for ${modelName}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setRetryingModels(prev => {
        const next = new Set(prev);
        next.delete(modelName);
        return next;
      });
    }
  }, [criteriaId, evidenceContent, policyDetails, assumeExists, exhibits, onGrade]);

  // Use streaming grades while grading, otherwise use existing grade
  const displayGrades = isGrading || streamingGrades.length > 0
    ? streamingGrades
    : existingGrade?.grades.filter(g => g.model !== 'average') || [];

  const displayAverage = isGrading || averageGrade
    ? averageGrade
    : existingGrade?.grades.find(g => g.model === 'average') || null;

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

      {displayGrades.length > 0 || displayAverage ? (
        <div className="space-y-4">
          {/* Average grade as compact badge */}
          {displayAverage && (
            <AverageGradeBadge grade={displayAverage} />
          )}

          {/* Progress indicator while grading */}
          {isGrading && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>
                Grading with {gradingProgress.completed}/{gradingProgress.total} models
                {failedModels.length > 0 && ` (${failedModels.length} failed)`}...
              </span>
            </div>
          )}

          {/* Failed models with retry buttons */}
          {!isGrading && failedModels.length > 0 && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
              <div className="text-xs text-orange-400 flex items-center gap-1 mb-2">
                <AlertTriangle className="w-3 h-3" />
                <span>{failedModels.length} model{failedModels.length > 1 ? 's' : ''} failed</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {failedModels.map(modelName => (
                  <button
                    key={modelName}
                    onClick={() => handleRetryModel(modelName)}
                    disabled={retryingModels.has(modelName)}
                    className="flex items-center gap-1.5 px-2 py-1 bg-orange-600/20 text-orange-300 rounded text-xs hover:bg-orange-600/30 transition-colors disabled:opacity-50"
                  >
                    {retryingModels.has(modelName) ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    {retryingModels.has(modelName) ? 'Retrying...' : `Retry ${modelName}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Individual model grades */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayGrades.map((grade) => (
              <GradeCard key={grade.model} grade={grade} />
            ))}
          </div>

          {!isGrading && existingGrade && (
            <p className="text-xs text-gray-500">
              Graded: {new Date(existingGrade.graded_at).toLocaleString()}
            </p>
          )}
        </div>
      ) : (
        <p className="text-gray-400 text-sm">
          Click "Grade" to have 6 AI models evaluate your evidence for this criterion as an immigration officer would.
        </p>
      )}
    </Card>
  );
}
