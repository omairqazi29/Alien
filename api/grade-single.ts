import type { VercelRequest, VercelResponse } from '@vercel/node';

const BEDROCK_API_KEY = process.env.BEDROCK_API_KEY;
const AWS_REGION = process.env.AWS_REGION || 'us-east-2';
const BEDROCK_ENDPOINT = `https://bedrock-runtime.${AWS_REGION}.amazonaws.com`;

interface SingleGradeRequest {
  criteriaId: string;
  officialTitle: string;
  policyDetails: string;
  evidenceContent: string;
  exhibitsContent: string;
  assumeEvidenceExists: boolean;
  modelName: string;
}

interface SingleGradeResponse {
  grade: 'strong' | 'moderate' | 'weak' | 'insufficient';
  score: number;
  feedback: string;
  suggestions: string[];
}

const MODEL_CONFIG: Record<string, { modelId: string; model: string }> = {
  'Claude Opus 4.5': { modelId: 'us.anthropic.claude-opus-4-5-20251101-v1:0', model: 'claude-opus-4-5' },
  'Google Gemma 3 12B': { modelId: 'google.gemma-3-12b-it', model: 'gemma-3-12b' },
  'DeepSeek R1': { modelId: 'us.deepseek.r1-v1:0', model: 'deepseek-r1' },
  'Mistral Large 3': { modelId: 'mistral.mistral-large-3-675b-instruct', model: 'mistral-large-3' },
  'Meta Llama 4 Maverick': { modelId: 'us.meta.llama4-maverick-17b-instruct-v1:0', model: 'llama4-maverick' },
  'Qwen3 235B': { modelId: 'qwen.qwen3-235b-a22b-2507-v1:0', model: 'qwen3-235b' },
};

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
    const { officialTitle, policyDetails, evidenceContent, exhibitsContent, assumeEvidenceExists, modelName } = req.body as SingleGradeRequest;

    if (!evidenceContent || !evidenceContent.trim()) {
      return res.status(400).json({ error: 'No evidence content provided.' });
    }

    const modelConfig = MODEL_CONFIG[modelName];
    if (!modelConfig) {
      return res.status(400).json({ error: `Unknown model: ${modelName}` });
    }

    let assumeNote = '';
    let exhibitsSection = '';

    if (assumeEvidenceExists) {
      assumeNote = `\n\n**IMPORTANT**: The applicant has indicated that all exhibits and supporting documents referenced in the evidence documentation exist and are available. Evaluate the evidence assuming these documents are properly attached to the petition.`;
    } else {
      if (exhibitsContent && exhibitsContent.trim()) {
        exhibitsSection = `\n\n## Attached Exhibits (Extracted Text)\nThe following exhibits have been attached and their content extracted for your review:\n\n${exhibitsContent}`;
        assumeNote = `\n\n**NOTE**: The above exhibits have been provided. Evaluate both the petition text and the exhibit content together.`;
      } else {
        assumeNote = `\n\n**NOTE**: No exhibits have been attached. Evaluate only what is explicitly described in the evidence documentation. If exhibits or supporting documents are referenced but not provided, note this as a gap.`;
      }
    }

    const userPrompt = `
## Criterion Being Evaluated
${officialTitle}

## USCIS Policy Manual Guidance
${policyDetails}

## Evidence Documentation
${evidenceContent}${exhibitsSection}
${assumeNote}

## Your Task
Evaluate this evidence for the above criterion. Apply the USCIS Policy Manual guidance in your assessment. Consider whether this evidence would convince a USCIS officer that the applicant has extraordinary ability at a national or international level.

Respond with a JSON object containing:
- "grade": one of "strong", "moderate", "weak", "insufficient"
- "score": number from 0-100
- "feedback": detailed paragraph explaining your assessment
- "suggestions": array of 2-4 specific improvement suggestions

JSON Response:`;

    const url = `${BEDROCK_ENDPOINT}/model/${modelConfig.modelId}/converse`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BEDROCK_API_KEY}`,
      },
      body: JSON.stringify({
        system: [{ text: SYSTEM_PROMPT }],
        messages: [
          {
            role: 'user',
            content: [{ text: userPrompt }],
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
    const textContent = responseBody.output?.message?.content?.[0]?.text || '';

    const gradeResult = parseJsonResponse(textContent);
    validateGrade(gradeResult);

    return res.status(200).json({
      grade: {
        model: modelConfig.model,
        modelName,
        ...gradeResult,
      },
    });
  } catch (error) {
    console.error('Single model grading error:', error);
    return res.status(500).json({
      error: 'Failed to grade evidence',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

function parseJsonResponse(text: string): SingleGradeResponse {
  if (!text || text.trim() === '') {
    throw new Error('Empty response from model');
  }

  console.log('Raw model response (first 500 chars):', text.substring(0, 500));

  // Remove markdown code blocks if present
  let cleanedText = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  // Try to find JSON object in the response - get the LAST complete JSON object
  const jsonMatches = cleanedText.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
  let jsonMatch: string | null = null;

  if (jsonMatches && jsonMatches.length > 0) {
    for (const match of jsonMatches) {
      if (match.includes('"grade"') || match.includes("'grade'")) {
        jsonMatch = match;
        break;
      }
    }
    if (!jsonMatch) {
      jsonMatch = jsonMatches[jsonMatches.length - 1];
    }
  }

  if (!jsonMatch) {
    const gradeMatch = cleanedText.match(/grade["\s:]+["']?(strong|moderate|weak|insufficient)["']?/i);
    const scoreMatch = cleanedText.match(/score["\s:]+(\d+)/i);
    const feedbackMatch = cleanedText.match(/feedback["\s:]+["']([^"']+)["']/i);

    if (gradeMatch || scoreMatch) {
      return {
        grade: (gradeMatch?.[1]?.toLowerCase() as 'strong' | 'moderate' | 'weak' | 'insufficient') || 'moderate',
        score: scoreMatch ? parseInt(scoreMatch[1], 10) : 50,
        feedback: feedbackMatch?.[1] || 'Response parsed from non-JSON format.',
        suggestions: [],
      };
    }
    console.error('No JSON found. Full response:', cleanedText);
    throw new Error('No JSON found in response');
  }

  let cleanedJson = jsonMatch
    .replace(/[\x00-\x1F\x7F]/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\r/g, ' ')
    .replace(/\t/g, ' ');

  cleanedJson = cleanedJson.replace(/,\s*([}\]])/g, '$1');
  cleanedJson = cleanedJson.replace(/'([^']+)':/g, '"$1":');
  cleanedJson = cleanedJson.replace(/:\s*'([^']*)'/g, ': "$1"');

  console.log('Cleaned JSON:', cleanedJson.substring(0, 300));

  try {
    return JSON.parse(cleanedJson);
  } catch (parseError) {
    console.error('JSON parse error:', parseError, 'Cleaned JSON:', cleanedJson);

    const gradeMatch = cleanedJson.match(/"grade"\s*:\s*"(strong|moderate|weak|insufficient)"/i);
    const scoreMatch = cleanedJson.match(/"score"\s*:\s*(\d+)/);
    const feedbackMatch = cleanedJson.match(/"feedback"\s*:\s*"([^"]+)"/);

    if (gradeMatch && scoreMatch) {
      return {
        grade: gradeMatch[1].toLowerCase() as 'strong' | 'moderate' | 'weak' | 'insufficient',
        score: parseInt(scoreMatch[1], 10),
        feedback: feedbackMatch?.[1] || 'Feedback parsing failed.',
        suggestions: [],
      };
    }

    throw new Error(`JSON parse failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
  }
}

function validateGrade(result: SingleGradeResponse) {
  if (!['strong', 'moderate', 'weak', 'insufficient'].includes(result.grade)) {
    result.grade = 'moderate';
  }
  if (typeof result.score !== 'number' || result.score < 0 || result.score > 100) {
    result.score = 50;
  }
}
