import type { CriteriaId, ModelGrade } from '../types';
import { EB1A_CRITERIA } from '../types';

interface GradeRequest {
  criteriaId: CriteriaId;
  officialTitle: string;
  policyDetails: string;
  evidenceContent: string;
  exhibitsContent: string;
  assumeEvidenceExists: boolean;
}

interface ExtractTextResponse {
  extractedText: string;
  fileName: string;
  fileType: string;
}

interface GradeStreamEvent {
  type: 'grade' | 'average' | 'done';
  grade?: ModelGrade;
  totalModels?: number;
}

export interface GradeStreamCallbacks {
  onGrade: (grade: ModelGrade) => void;
  onAverage: (grade: ModelGrade, completedCount: number, totalModels: number) => void;
  onDone: () => void;
  onError: (error: Error) => void;
}

export async function gradeEvidenceStream(
  criteriaId: CriteriaId,
  evidenceContent: string,
  policyDetails: string,
  assumeEvidenceExists: boolean,
  exhibitsContent: string = '',
  callbacks: GradeStreamCallbacks
): Promise<void> {
  const criteria = EB1A_CRITERIA.find(c => c.id === criteriaId);

  if (!criteria) {
    callbacks.onError(new Error(`Unknown criteria: ${criteriaId}`));
    return;
  }

  const request: GradeRequest = {
    criteriaId,
    officialTitle: criteria.officialTitle,
    policyDetails,
    evidenceContent,
    exhibitsContent,
    assumeEvidenceExists,
  };

  try {
    const response = await fetch('/api/grade', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      const errorMsg = error.details || error.error || 'Failed to grade evidence';
      callbacks.onError(new Error(errorMsg));
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      callbacks.onError(new Error('No response body'));
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let completedCount = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const event: GradeStreamEvent = JSON.parse(line.slice(6));

            if (event.type === 'grade' && event.grade) {
              completedCount++;
              callbacks.onGrade(event.grade);
            } else if (event.type === 'average' && event.grade) {
              callbacks.onAverage(event.grade, completedCount, event.totalModels || 6);
            } else if (event.type === 'done') {
              callbacks.onDone();
            }
          } catch (e) {
            console.error('Failed to parse SSE event:', line, e);
          }
        }
      }
    }
  } catch (error) {
    callbacks.onError(error instanceof Error ? error : new Error('Unknown error'));
  }
}

export async function extractTextFromFile(
  fileUrl: string,
  fileType: string,
  fileName: string
): Promise<string> {
  const response = await fetch('/api/extract-text', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fileUrl, fileType, fileName }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('Extract text API error:', error);
    throw new Error(error.details || error.error || 'Failed to extract text');
  }

  const data: ExtractTextResponse = await response.json();
  return data.extractedText;
}
