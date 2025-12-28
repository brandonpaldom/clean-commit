import { GoogleGenerativeAI } from '@google/generative-ai';
import { SYSTEM_PROMPT, USER_PROMPT_TEMPLATE } from '../prompts/conventionalCommit';
import { ErrorCode, GenerateOptions } from '../types';

export class GeminiError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'GeminiError';
  }
}

export async function generateCommitMessage(
  diff: string,
  apiKey: string,
  options: GenerateOptions
): Promise<string> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // User requested gemini-2.5-flash to avoid rate limits
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: USER_PROMPT_TEMPLATE(diff, options.language) }]
      }],
      systemInstruction: SYSTEM_PROMPT,
    });

    const response = await result.response;
    const text = response.text().trim();
    
    // Clean up any markdown blocks if the AI accidentally included them
    return text.replace(/^```[a-z]*\n/i, '').replace(/\n```$/i, '').trim();
  } catch (error) {
    console.error('--- CleanCommit: Gemini API Error Detail ---');
    console.error(error);
    
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      console.error('Error Message:', error.message);
      
      // Diagnostic: Help user identify correct model
      if (msg.includes('404') || msg.includes('not found')) {
        console.warn('TIP: If 404 persists, verify your model availability at: https://aistudio.google.com/app/plan');
      }

      if (msg.includes('api_key') || msg.includes('invalid')) {
        throw new GeminiError('Invalid or missing API key', 'API_ERROR', false);
      }
      if (msg.includes('rate_limit') || msg.includes('429')) {
        throw new GeminiError('Rate limit exceeded', 'RATE_LIMIT', true);
      }
      if (msg.includes('404') || msg.includes('not found')) {
        throw new GeminiError(`Model not found (404). Check Debug Console for details.`, 'API_ERROR', false);
      }
      if (msg.includes('fetch') || msg.includes('network') || msg.includes('connection') || msg.includes('failed to fetch')) {
        throw new GeminiError(`Network error: ${error.message}`, 'NETWORK_ERROR', true);
      }
    }
    throw new GeminiError('Failed to generate commit message', 'UNKNOWN', false);
  }
}
