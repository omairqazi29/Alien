import type { VercelRequest, VercelResponse } from '@vercel/node';

interface GradeRequest {
  criteriaId: string;
  officialTitle: string;
  policyDetails: string;
  evidenceContent: string;
  exhibitsContent: string;
  assumeEvidenceExists: boolean;
}

interface SingleGradeResponse {
  grade: 'strong' | 'moderate' | 'weak' | 'insufficient';
  score: number;
  feedback: string;
  suggestions: string[];
}

const MODELS = [
  'Claude Opus 4.5',
  'Google Gemma 3 12B',
  'DeepSeek R1',
  'Mistral Large 3',
  'Meta Llama 4 Maverick',
  'Qwen3 235B',
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { criteriaId, officialTitle, policyDetails, evidenceContent, exhibitsContent, assumeEvidenceExists } = req.body as GradeRequest;

    if (!evidenceContent || !evidenceContent.trim()) {
      return res.status(400).json({ error: 'No evidence content provided. Please add petition evidence before grading.' });
    }

    // Set up SSE streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const gradeFromScore = (score: number): 'strong' | 'moderate' | 'weak' | 'insufficient' => {
      if (score >= 75) return 'strong';
      if (score >= 50) return 'moderate';
      if (score >= 25) return 'weak';
      return 'insufficient';
    };

    const completedGrades: (SingleGradeResponse & { model: string; modelName: string })[] = [];
    const failedModels: string[] = [];
    const totalModels = MODELS.length;

    // Send individual grade as SSE event
    const sendGrade = (grade: SingleGradeResponse & { model: string; modelName: string }) => {
      completedGrades.push(grade);
      res.write(`data: ${JSON.stringify({ type: 'grade', grade })}\n\n`);

      // Calculate and send updated average
      const avgScore = Math.round(completedGrades.reduce((sum, g) => sum + g.score, 0) / completedGrades.length);
      const averageGrade = {
        model: 'average',
        modelName: 'Average',
        grade: gradeFromScore(avgScore),
        score: avgScore,
        feedback: `Average score across ${completedGrades.length} model${completedGrades.length > 1 ? 's' : ''}.`,
        suggestions: [],
      };
      res.write(`data: ${JSON.stringify({ type: 'average', grade: averageGrade, totalModels, completedCount: completedGrades.length, failedCount: failedModels.length })}\n\n`);
    };

    // Send error event for failed model
    const sendError = (modelName: string, error: Error) => {
      console.error(`${modelName} error:`, error.message);
      failedModels.push(modelName);
      res.write(`data: ${JSON.stringify({ type: 'error', modelName, error: error.message, failedCount: failedModels.length, totalModels })}\n\n`);
    };

    // Grade a single model by calling the grade-single endpoint internally
    async function gradeWithModel(modelName: string): Promise<SingleGradeResponse & { model: string; modelName: string }> {
      // Get the base URL for internal API calls
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      const baseUrl = `${protocol}://${host}`;

      const response = await fetch(`${baseUrl}/api/grade-single`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          criteriaId,
          officialTitle,
          policyDetails,
          evidenceContent,
          exhibitsContent,
          assumeEvidenceExists,
          modelName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.details || errorData.error || `Failed to grade with ${modelName}`);
      }

      const data = await response.json();
      return data.grade;
    }

    // Run all models in parallel, streaming results as they complete
    const modelPromises = MODELS.map(modelName =>
      gradeWithModel(modelName)
        .then(sendGrade)
        .catch(e => sendError(modelName, e instanceof Error ? e : new Error(String(e))))
    );

    await Promise.all(modelPromises);

    // Send completion event with summary
    res.write(`data: ${JSON.stringify({ type: 'done', completedCount: completedGrades.length, failedCount: failedModels.length, failedModels })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Grading error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');

    return res.status(500).json({
      error: 'Failed to grade evidence',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
