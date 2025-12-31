import type { VercelRequest, VercelResponse } from '@vercel/node';

const BEDROCK_API_KEY = process.env.BEDROCK_API_KEY;
const AWS_REGION = process.env.AWS_REGION || 'us-east-2';
const BEDROCK_ENDPOINT = `https://bedrock-runtime.${AWS_REGION}.amazonaws.com`;

interface GradeRequest {
  criteriaId: string;
  criteriaName: string;
  criteriaDescription: string;
  policyDetails: string;
  evidenceContent: string;
  assumeEvidenceExists: boolean;
}

interface SingleGradeResponse {
  grade: 'strong' | 'moderate' | 'weak' | 'insufficient';
  score: number;
  feedback: string;
  suggestions: string[];
}

interface GradeResponse {
  grades: {
    model: string;
    modelName: string;
    grade: 'strong' | 'moderate' | 'weak' | 'insufficient';
    score: number;
    feedback: string;
    suggestions: string[];
  }[];
}

const SYSTEM_PROMPT = `You are an experienced USCIS immigration officer evaluating EB-1A (Extraordinary Ability) visa petitions.

Your role is to evaluate the evidence provided for a specific EB-1A criterion and provide:
1. A grade: "strong", "moderate", "weak", or "insufficient"
2. A score from 0-100
3. Detailed feedback explaining your assessment
4. 2-4 specific suggestions for improvement

Be realistic and thorough. Consider:
- Quality and prestige of the evidence
- Whether it demonstrates "extraordinary ability" at a national/international level
- Specific documentation that would strengthen the case
- How an actual immigration officer would view this evidence

Respond in JSON format only.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { criteriaId, criteriaName, criteriaDescription, policyDetails, evidenceContent, assumeEvidenceExists } = req.body as GradeRequest;

    if (!evidenceContent || !evidenceContent.trim()) {
      return res.status(400).json({ error: 'No evidence content provided. Please add petition evidence before grading.' });
    }

    const assumeNote = assumeEvidenceExists
      ? `\n\n**IMPORTANT**: The applicant has indicated that all exhibits and supporting documents referenced in the evidence documentation exist and are available. Evaluate the evidence assuming these documents are properly attached to the petition.`
      : `\n\n**NOTE**: Evaluate only what is explicitly described in the evidence documentation. If exhibits or supporting documents are referenced but not described in detail, note this as a gap.`;

    const userPrompt = `
## Criterion Being Evaluated
**${criteriaName}** (ID: ${criteriaId})
${criteriaDescription}

## USCIS Policy Manual Guidance
${policyDetails}

## Evidence Documentation
${evidenceContent}
${assumeNote}

## Your Task
Evaluate this evidence for the "${criteriaName}" criterion. Apply the USCIS Policy Manual guidance provided above in your assessment. Consider whether this evidence would convince a USCIS officer that the applicant has extraordinary ability at a national or international level.

Respond with a JSON object containing:
- "grade": one of "strong", "moderate", "weak", "insufficient"
- "score": number from 0-100
- "feedback": detailed paragraph explaining your assessment
- "suggestions": array of 2-4 specific improvement suggestions

JSON Response:`;

    // Helper to call Bedrock Converse API with API key
    async function callBedrockConverse(modelId: string, systemPrompt: string, userMessage: string): Promise<string> {
      const url = `${BEDROCK_ENDPOINT}/model/${modelId}/converse`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${BEDROCK_API_KEY}`,
        },
        body: JSON.stringify({
          system: [{ text: systemPrompt }],
          messages: [
            {
              role: 'user',
              content: [{ text: userMessage }],
            },
          ],
          inferenceConfig: {
            maxTokens: 1024,
            temperature: 0.7,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Bedrock API error: ${response.status} - ${errorText}`);
      }

      const responseBody = await response.json();
      // Converse API returns: { output: { message: { content: [{ text: "..." }] } } }
      return responseBody.output?.message?.content?.[0]?.text || '';
    }

    // Grade with Claude Sonnet via Bedrock
    async function gradeWithClaude(): Promise<SingleGradeResponse & { model: string; modelName: string }> {
      const textContent = await callBedrockConverse(
        'us.anthropic.claude-sonnet-4-5-20250929-v1:0',
        SYSTEM_PROMPT,
        userPrompt
      );

      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Failed to parse Claude response');

      const gradeResult: SingleGradeResponse = JSON.parse(jsonMatch[0]);
      validateGrade(gradeResult);

      return { model: 'claude-sonnet-4-5', modelName: 'Claude Sonnet 4.5', ...gradeResult };
    }

    // Grade with Meta Llama via Bedrock
    async function gradeWithLlama(): Promise<SingleGradeResponse & { model: string; modelName: string }> {
      const textContent = await callBedrockConverse(
        'meta.llama3-3-70b-instruct-v1:0',
        SYSTEM_PROMPT,
        userPrompt
      );

      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Failed to parse Llama response');

      const gradeResult: SingleGradeResponse = JSON.parse(jsonMatch[0]);
      validateGrade(gradeResult);

      return { model: 'llama3-70b', modelName: 'Meta Llama 3.3 70B', ...gradeResult };
    }

    function validateGrade(result: SingleGradeResponse) {
      if (!['strong', 'moderate', 'weak', 'insufficient'].includes(result.grade)) {
        result.grade = 'moderate';
      }
      if (typeof result.score !== 'number' || result.score < 0 || result.score > 100) {
        result.score = 50;
      }
    }

    // Run both models in parallel
    const [claudeGrade, llamaGrade] = await Promise.all([
      gradeWithClaude(),
      gradeWithLlama(),
    ]);

    return res.status(200).json({ grades: [claudeGrade, llamaGrade] });
  } catch (error) {
    console.error('Grading error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');

    // More detailed error response for debugging
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'UnknownError',
      bedrockEndpoint: BEDROCK_ENDPOINT,
      region: AWS_REGION,
      hasApiKey: !!BEDROCK_API_KEY,
      apiKeyLength: BEDROCK_API_KEY?.length || 0,
    };

    console.error('Error details:', JSON.stringify(errorDetails, null, 2));

    return res.status(500).json({
      error: 'Failed to grade evidence',
      details: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        hasApiKey: !!BEDROCK_API_KEY,
        region: AWS_REGION,
        endpoint: BEDROCK_ENDPOINT,
      }
    });
  }
}
