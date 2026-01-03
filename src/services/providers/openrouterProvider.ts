import OpenAI from 'openai';
import { SYSTEM_PROMPT, USER_PROMPT_TEMPLATE } from '../../prompts/conventionalCommit';
import { AIProvider, AIProviderError, GenerateOptions } from '../../types';

/**
 * OpenRouter provider - Access multiple AI models through a single API
 * Uses OpenAI-compatible API with custom baseURL
 * @see https://openrouter.ai/docs
 */
export class OpenRouterProvider implements AIProvider {
  readonly name = 'OpenRouter';
  readonly model = 'google/gemini-2.0-flash-001';
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://github.com/brandonpaldom/clean-commit',
        'X-Title': 'CleanCommit',
      },
    });
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
      console.error('--- CleanCommit: OpenRouter API Error ---');
      console.error(error);
      
      // Get error message for detailed checks
      const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
      
      // Check for API errors
      if (error && typeof error === 'object' && 'status' in error) {
        const apiError = error as { status: number; message?: string; code?: string };
        
        if (apiError.status === 401) {
          throw new AIProviderError('Invalid API key', 'API_ERROR', 'openrouter', false);
        }
        if (apiError.status === 429) {
          throw new AIProviderError('Rate limit exceeded. Please wait and try again.', 'RATE_LIMIT', 'openrouter', true);
        }
        if (apiError.status === 402) {
          throw new AIProviderError('No credits available. Please add credits at openrouter.ai', 'API_ERROR', 'openrouter', false);
        }
        if (apiError.status === 404) {
          throw new AIProviderError('Model not found on OpenRouter', 'API_ERROR', 'openrouter', false);
        }
        if (apiError.status >= 500) {
          throw new AIProviderError('OpenRouter server error', 'API_ERROR', 'openrouter', true);
        }
      }
      
      // Check for quota/billing issues in error message
      if (errorMessage.includes('insufficient') || errorMessage.includes('billing') || errorMessage.includes('quota') || errorMessage.includes('credits')) {
        throw new AIProviderError('No credits available. Please add credits at openrouter.ai', 'API_ERROR', 'openrouter', false);
      }
      
      if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('connection')) {
        throw new AIProviderError(`Network error: ${error instanceof Error ? error.message : 'Unknown'}`, 'NETWORK_ERROR', 'openrouter', true);
      }
      
      throw new AIProviderError('Failed to generate commit message', 'UNKNOWN', 'openrouter', false);
    }
  }
}
