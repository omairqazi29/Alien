import type { VercelRequest, VercelResponse } from '@vercel/node';

const BEDROCK_API_KEY = process.env.BEDROCK_API_KEY;
const AWS_REGION = process.env.AWS_REGION || 'us-east-2';
const BEDROCK_ENDPOINT = `https://bedrock-runtime.${AWS_REGION}.amazonaws.com`;

interface ExtractRequest {
  fileUrl: string;
  fileType: string;
  fileName: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileUrl, fileType, fileName } = req.body as ExtractRequest;

    if (!fileUrl) {
      return res.status(400).json({ error: 'No file URL provided' });
    }

    // Fetch the file
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      return res.status(400).json({ error: 'Failed to fetch file' });
    }

    const fileBuffer = await fileResponse.arrayBuffer();
    const base64Content = Buffer.from(fileBuffer).toString('base64');

    // Determine media type for Claude
    let mediaType = 'application/pdf';
    if (fileType.includes('image/png')) {
      mediaType = 'image/png';
    } else if (fileType.includes('image/jpeg') || fileType.includes('image/jpg')) {
      mediaType = 'image/jpeg';
    } else if (fileType.includes('image/gif')) {
      mediaType = 'image/gif';
    } else if (fileType.includes('image/webp')) {
      mediaType = 'image/webp';
    }

    // Use Claude's vision capabilities to extract text
    const url = `${BEDROCK_ENDPOINT}/model/anthropic.claude-3-5-sonnet-20241022-v2:0/converse`;

    const systemPrompt = `You are a document text extraction assistant. Extract ALL text content from the provided document or image.
Maintain the original structure and formatting as much as possible.
For PDFs with multiple pages, extract text from all visible pages.
For images, use OCR to extract any visible text.
Do not summarize - provide the complete text content.`;

    const userMessage = `Please extract all text content from this document (${fileName}). Provide the complete text, maintaining structure and formatting.`;

    // For PDFs, we need to handle them differently - Claude can't directly read PDFs via vision
    // We'll use a document-based approach with Claude
    const isPDF = fileType.includes('pdf');

    let requestBody;
    if (isPDF) {
      // For PDFs, use document content type
      requestBody = {
        system: [{ text: systemPrompt }],
        messages: [
          {
            role: 'user',
            content: [
              {
                document: {
                  format: 'pdf',
                  name: fileName,
                  source: {
                    bytes: base64Content,
                  },
                },
              },
              { text: userMessage },
            ],
          },
        ],
        inferenceConfig: {
          maxTokens: 4096,
          temperature: 0,
        },
      };
    } else {
      // For images, use image content type
      requestBody = {
        system: [{ text: systemPrompt }],
        messages: [
          {
            role: 'user',
            content: [
              {
                image: {
                  format: mediaType.split('/')[1],
                  source: {
                    bytes: base64Content,
                  },
                },
              },
              { text: userMessage },
            ],
          },
        ],
        inferenceConfig: {
          maxTokens: 4096,
          temperature: 0,
        },
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BEDROCK_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Bedrock API error:', response.status, errorText);
      return res.status(500).json({
        error: 'Failed to extract text',
        details: errorText,
      });
    }

    const responseBody = await response.json();
    const extractedText = responseBody.output?.message?.content?.[0]?.text || '';

    return res.status(200).json({
      extractedText,
      fileName,
      fileType,
    });
  } catch (error) {
    console.error('Text extraction error:', error);
    return res.status(500).json({
      error: 'Failed to extract text',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
