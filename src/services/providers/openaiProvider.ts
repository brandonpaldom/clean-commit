import OpenAI from 'openai';
import { SYSTEM_PROMPT, USER_PROMPT_TEMPLATE } from '../../prompts/conventionalCommit';
import { AIProvider, AIProviderError, GenerateOptions } from '../../types';

export class OpenAIProvider implements AIProvider {
  readonly name = 'OpenAI';
  readonly model = 'gpt-4o-mini';
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
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
      console.error('--- CleanCommit: OpenAI API Error ---');
      console.error(error);
      
      // Get error message for detailed checks
      const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
      
      // Check for OpenAI API errors
      if (error && typeof error === 'object' && 'status' in error) {
        const apiError = error as { status: number; message?: string; code?: string };
        
        if (apiError.status === 401) {
          throw new AIProviderError('Invalid API key', 'API_ERROR', 'openai', false);
        }
        if (apiError.status === 429) {
          // Distinguish between rate limit and insufficient credits
          if (errorMessage.includes('insufficient_quota') || errorMessage.includes('billing')) {
            throw new AIProviderError('No API credits available. Please add credits at platform.openai.com/account/billing', 'API_ERROR', 'openai', false);
          }
          throw new AIProviderError('Rate limit exceeded. Please wait and try again.', 'RATE_LIMIT', 'openai', true);
        }
        if (apiError.status === 402) {
          throw new AIProviderError('No API credits available. Please add credits at platform.openai.com/account/billing', 'API_ERROR', 'openai', false);
        }
        if (apiError.status === 404) {
          throw new AIProviderError('Model not found', 'API_ERROR', 'openai', false);
        }
        if (apiError.status >= 500) {
          throw new AIProviderError('OpenAI server error', 'API_ERROR', 'openai', true);
        }
      }
      
      // Check for quota/billing issues in error message
      if (errorMessage.includes('insufficient_quota') || errorMessage.includes('billing') || errorMessage.includes('quota')) {
        throw new AIProviderError('No API credits available. Please add credits at platform.openai.com/account/billing', 'API_ERROR', 'openai', false);
      }
      
      if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('connection')) {
        throw new AIProviderError(`Network error: ${error instanceof Error ? error.message : 'Unknown'}`, 'NETWORK_ERROR', 'openai', true);
      }
      
      throw new AIProviderError('Failed to generate commit message', 'UNKNOWN', 'openai', false);
    }
  }
}
