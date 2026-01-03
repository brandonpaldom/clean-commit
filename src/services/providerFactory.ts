import { AIProvider, AIProviderType, AIProviderError } from '../types';
import { GeminiProvider, OpenAIProvider, GroqProvider, OpenRouterProvider } from './providers';

/**
 * Secret storage keys for each provider's API key
 */
export const PROVIDER_SECRET_KEYS: Record<AIProviderType, string> = {
  gemini: 'cleancommit.geminiApiKey',
  openai: 'cleancommit.openaiApiKey',
  groq: 'cleancommit.groqApiKey',
  openrouter: 'cleancommit.openrouterApiKey',
};

/**
 * Creates an AI provider instance based on the specified type and API key
 */
export function createProvider(type: AIProviderType, apiKey: string): AIProvider {
  if (!apiKey) {
    throw new AIProviderError(
      `API key not configured for ${type}`,
      'NO_API_KEY',
      type,
      false
    );
  }

  switch (type) {
    case 'gemini':
      return new GeminiProvider(apiKey);
    case 'openai':
      return new OpenAIProvider(apiKey);
    case 'groq':
      return new GroqProvider(apiKey);
    case 'openrouter':
      return new OpenRouterProvider(apiKey);
    default:
      throw new AIProviderError(
        `Unknown provider: ${type}`,
        'INVALID_PROVIDER',
        type,
        false
      );
  }
}

/**
 * Validates if a provider type is valid
 */
export function isValidProvider(type: string): type is AIProviderType {
  return ['gemini', 'openai', 'groq', 'openrouter'].includes(type);
}
