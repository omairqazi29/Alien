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

interface GradeResponse {
  grades: ModelGrade[];
}

interface ExtractTextResponse {
  extractedText: string;
  fileName: string;
  fileType: string;
}

export async function gradeEvidence(
  criteriaId: CriteriaId,
  evidenceContent: string,
  policyDetails: string,
  assumeEvidenceExists: boolean,
  exhibitsContent: string = ''
): Promise<GradeResponse> {
  const criteria = EB1A_CRITERIA.find(c => c.id === criteriaId);

  if (!criteria) {
    throw new Error(`Unknown criteria: ${criteriaId}`);
  }

  const request: GradeRequest = {
    criteriaId,
    officialTitle: criteria.officialTitle,
    policyDetails,
    evidenceContent,
    exhibitsContent,
    assumeEvidenceExists,
  };

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
    console.error('Grade API error:', error);
    throw new Error(errorMsg);
  }

  return response.json();
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
