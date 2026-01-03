import Groq from 'groq-sdk';
import { SYSTEM_PROMPT, USER_PROMPT_TEMPLATE } from '../../prompts/conventionalCommit';
import { AIProvider, AIProviderError, GenerateOptions } from '../../types';

export class GroqProvider implements AIProvider {
  readonly name = 'Groq';
  readonly model = 'llama-3.3-70b-versatile';
  private client: Groq;

  constructor(apiKey: string) {
    this.client = new Groq({ apiKey });
  }

  async generateCommitMessage(diff: string, options: GenerateOptions): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: USER_PROMPT_TEMPLATE(diff, options.language) }
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      const text = completion.choices[0]?.message?.content?.trim() || '';
      
      // Clean up any markdown blocks if the AI accidentally included them
      return text.replace(/^```[a-z]*\n/i, '').replace(/\n```$/i, '').trim();
    } catch (error) {
      console.error('--- CleanCommit: Groq API Error ---');
      console.error(error);
      
      // Check for Groq API errors
      if (error && typeof error === 'object' && 'status' in error) {
        const apiError = error as { status: number; message?: string };
        if (apiError.status === 401) {
          throw new AIProviderError('Invalid API key', 'API_ERROR', 'groq', false);
        }
        if (apiError.status === 429) {
          throw new AIProviderError('Rate limit exceeded', 'RATE_LIMIT', 'groq', true);
        }
        if (apiError.status === 404) {
          throw new AIProviderError('Model not found', 'API_ERROR', 'groq', false);
        }
        if (apiError.status >= 500) {
          throw new AIProviderError('Groq server error', 'API_ERROR', 'groq', true);
        }
      }
      
      if (error instanceof Error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('fetch') || msg.includes('network') || msg.includes('connection')) {
          throw new AIProviderError(`Network error: ${error.message}`, 'NETWORK_ERROR', 'groq', true);
        }
      }
      
      throw new AIProviderError('Failed to generate commit message', 'UNKNOWN', 'groq', false);
    }
  }
}
