import { GoogleGenerativeAI } from '@google/generative-ai';
import { SYSTEM_PROMPT, USER_PROMPT_TEMPLATE } from '../../prompts/conventionalCommit';
import { AIProvider, AIProviderError, GenerateOptions } from '../../types';

export class GeminiProvider implements AIProvider {
  readonly name = 'Google Gemini';
  readonly model = 'gemini-2.5-flash';

  constructor(private readonly apiKey: string) {}

  async generateCommitMessage(diff: string, options: GenerateOptions): Promise<string> {
    try {
      const genAI = new GoogleGenerativeAI(this.apiKey);
      const model = genAI.getGenerativeModel({ model: this.model });

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
      console.error('--- CleanCommit: Gemini API Error ---');
      console.error(error);
      
      if (error instanceof Error) {
        const msg = error.message.toLowerCase();

        if (msg.includes('api_key') || msg.includes('invalid')) {
          throw new AIProviderError('Invalid or missing API key', 'API_ERROR', 'gemini', false);
        }
        if (msg.includes('rate_limit') || msg.includes('429')) {
          throw new AIProviderError('Rate limit exceeded', 'RATE_LIMIT', 'gemini', true);
        }
        if (msg.includes('404') || msg.includes('not found')) {
          throw new AIProviderError('Model not found. Check your API key permissions.', 'API_ERROR', 'gemini', false);
        }
        if (msg.includes('fetch') || msg.includes('network') || msg.includes('connection')) {
          throw new AIProviderError(`Network error: ${error.message}`, 'NETWORK_ERROR', 'gemini', true);
        }
      }
      throw new AIProviderError('Failed to generate commit message', 'UNKNOWN', 'gemini', false);
    }
  }
}
