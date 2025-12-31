import type { CriteriaId, ModelGrade } from '../types';
import { EB1A_CRITERIA } from '../types';

interface GradeRequest {
  criteriaId: CriteriaId;
  criteriaName: string;
  criteriaDescription: string;
  policyDetails: string;
  evidenceContent: string;
  assumeEvidenceExists: boolean;
}

interface GradeResponse {
  grades: ModelGrade[];
}

export async function gradeEvidence(
  criteriaId: CriteriaId,
  evidenceContent: string,
  policyDetails: string,
  assumeEvidenceExists: boolean
): Promise<GradeResponse> {
  const criteria = EB1A_CRITERIA.find(c => c.id === criteriaId);

  if (!criteria) {
    throw new Error(`Unknown criteria: ${criteriaId}`);
  }

  const request: GradeRequest = {
    criteriaId,
    criteriaName: criteria.name,
    criteriaDescription: `${criteria.officialTitle}\n\n${criteria.description}\n\nKey Guidance: ${criteria.keyGuidance}`,
    policyDetails,
    evidenceContent,
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
