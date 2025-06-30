import { NextResponse } from 'next/server';
import { AppError, handleApiError, logError } from '@/utils/errorHandler';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      throw new AppError('Valid prompt text is required', 400);
    }

    if (prompt.length > 2000) {
      throw new AppError('Prompt too long. Maximum 2000 characters.', 400);
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new AppError('AI service not configured', 500);
    }

    const systemInstruction = `You are an expert prompt engineer for text-to-image AI models like Midjourney. Your task is to enhance the following user prompt to make it more vivid, detailed, and visually stunning, while maintaining and amplifying its core Indonesian theme. Do not change the main subject. Add details about composition, lighting, artistic style, and specific Indonesian cultural or natural elements. The final output must only be the enhanced prompt string, without any preamble or explanation.`;

    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemInstruction}\n\nUser Prompt: "${prompt}"` }]
        }
      ]
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logError({ status: response.status, error: errorBody }, 'Gemini API Error');
      throw new AppError('AI enhancement service temporarily unavailable', 503);
    }

    const result = await response.json();

    if (result.candidates && result.candidates[0]?.content?.parts[0]?.text) {
      const enhancedPrompt = result.candidates[0].content.parts[0].text.trim();
      return NextResponse.json({ enhancedPrompt });
    } else {
      logError(result, 'Unexpected Gemini Response');
      throw new AppError('Failed to enhance prompt. Please try again.', 500);
    }

  } catch (error) {
    const { message, statusCode } = handleApiError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}