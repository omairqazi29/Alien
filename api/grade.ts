import type { VercelRequest, VercelResponse } from '@vercel/node';

const BEDROCK_API_KEY = process.env.BEDROCK_API_KEY;
const AWS_REGION = process.env.AWS_REGION || 'us-east-2';
const BEDROCK_ENDPOINT = `https://bedrock-runtime.${AWS_REGION}.amazonaws.com`;

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
    const { officialTitle, policyDetails, evidenceContent, exhibitsContent, assumeEvidenceExists } = req.body as GradeRequest;

    if (!evidenceContent || !evidenceContent.trim()) {
      return res.status(400).json({ error: 'No evidence content provided. Please add petition evidence before grading.' });
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

    // Grade with Claude Opus 4.5 via Bedrock
    async function gradeWithClaudeOpus45(): Promise<SingleGradeResponse & { model: string; modelName: string }> {
      const textContent = await callBedrockConverse(
        'us.anthropic.claude-opus-4-5-20251101-v1:0',
        SYSTEM_PROMPT,
        userPrompt
      );

      const gradeResult = parseJsonResponse(textContent);
      validateGrade(gradeResult);

      return { model: 'claude-opus-4-5', modelName: 'Claude Opus 4.5', ...gradeResult };
    }

    // Grade with Google Gemma 3 12B via Bedrock
    async function gradeWithGemma(): Promise<SingleGradeResponse & { model: string; modelName: string }> {
      const textContent = await callBedrockConverse(
        'google.gemma-3-12b-it',
        SYSTEM_PROMPT,
        userPrompt
      );

      const gradeResult = parseJsonResponse(textContent);
      validateGrade(gradeResult);

      return { model: 'gemma-3-12b', modelName: 'Google Gemma 3 12B', ...gradeResult };
    }

    // Grade with DeepSeek R1 via Bedrock (using cross-region inference profile)
    async function gradeWithDeepSeek(): Promise<SingleGradeResponse & { model: string; modelName: string }> {
      const textContent = await callBedrockConverse(
        'us.deepseek.r1-v1:0',
        SYSTEM_PROMPT,
        userPrompt
      );

      const gradeResult = parseJsonResponse(textContent);
      validateGrade(gradeResult);

      return { model: 'deepseek-r1', modelName: 'DeepSeek R1', ...gradeResult };
    }

    // Grade with Mistral Large 3 via Bedrock
    async function gradeWithMistral(): Promise<SingleGradeResponse & { model: string; modelName: string }> {
      const textContent = await callBedrockConverse(
        'mistral.mistral-large-3-675b-instruct',
        SYSTEM_PROMPT,
        userPrompt
      );

      const gradeResult = parseJsonResponse(textContent);
      validateGrade(gradeResult);

      return { model: 'mistral-large-3', modelName: 'Mistral Large 3', ...gradeResult };
    }

    // Grade with Meta Llama 4 Maverick via Bedrock
    async function gradeWithLlama(): Promise<SingleGradeResponse & { model: string; modelName: string }> {
      const textContent = await callBedrockConverse(
        'us.meta.llama4-maverick-17b-instruct-v1:0',
        SYSTEM_PROMPT,
        userPrompt
      );

      const gradeResult = parseJsonResponse(textContent);
      validateGrade(gradeResult);

      return { model: 'llama4-maverick', modelName: 'Meta Llama 4 Maverick', ...gradeResult };
    }

    // Grade with Qwen3 235B via Bedrock
    async function gradeWithQwen(): Promise<SingleGradeResponse & { model: string; modelName: string }> {
      const textContent = await callBedrockConverse(
        'qwen.qwen3-235b-a22b-2507-v1:0',
        SYSTEM_PROMPT,
        userPrompt
      );

      const gradeResult = parseJsonResponse(textContent);
      validateGrade(gradeResult);

      return { model: 'qwen3-235b', modelName: 'Qwen3 235B', ...gradeResult };
    }

    function parseJsonResponse(text: string): SingleGradeResponse {
      if (!text || text.trim() === '') {
        throw new Error('Empty response from model');
      }

      // Try to find JSON object in the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // Try to extract data from plain text response
        const gradeMatch = text.match(/grade["\s:]+["']?(strong|moderate|weak|insufficient)["']?/i);
        const scoreMatch = text.match(/score["\s:]+(\d+)/i);

        if (gradeMatch || scoreMatch) {
          return {
            grade: (gradeMatch?.[1]?.toLowerCase() as 'strong' | 'moderate' | 'weak' | 'insufficient') || 'moderate',
            score: scoreMatch ? parseInt(scoreMatch[1], 10) : 50,
            feedback: 'Response parsed from non-JSON format.',
            suggestions: [],
          };
        }
        throw new Error('No JSON found in response');
      }

      // Clean control characters from JSON string
      let cleanedJson = jsonMatch[0]
        .replace(/[\x00-\x1F\x7F]/g, ' ') // Replace control chars with space
        .replace(/\n/g, ' ')
        .replace(/\r/g, ' ')
        .replace(/\t/g, ' ');

      // Fix common JSON issues
      // Remove trailing commas before ] or }
      cleanedJson = cleanedJson.replace(/,\s*([}\]])/g, '$1');
      // Fix unescaped quotes in strings (basic attempt)
      cleanedJson = cleanedJson.replace(/([^\\])"\s*([^,}\]:])/g, '$1\\"$2');

      try {
        return JSON.parse(cleanedJson);
      } catch (parseError) {
        // Try to extract fields manually if JSON parsing fails
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
    const totalModels = 6;

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

    // Run all models in parallel, streaming results as they complete
    const modelPromises = [
      gradeWithClaudeOpus45().then(sendGrade).catch(e => sendError('Claude Opus 4.5', e)),
      gradeWithGemma().then(sendGrade).catch(e => sendError('Google Gemma 3 12B', e)),
      gradeWithDeepSeek().then(sendGrade).catch(e => sendError('DeepSeek R1', e)),
      gradeWithMistral().then(sendGrade).catch(e => sendError('Mistral Large 3', e)),
      gradeWithLlama().then(sendGrade).catch(e => sendError('Meta Llama 4 Maverick', e)),
      gradeWithQwen().then(sendGrade).catch(e => sendError('Qwen3 235B', e)),
    ];

    await Promise.all(modelPromises);

    // Send completion event with summary
    res.write(`data: ${JSON.stringify({ type: 'done', completedCount: completedGrades.length, failedCount: failedModels.length, failedModels })}\n\n`);
    res.end();
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
