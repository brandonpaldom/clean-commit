import { AIProvider, AIProviderType, AIProviderError, PROVIDER_INFO } from '../types';
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
export function createProvider(
  type: AIProviderType,
  apiKey: string,
  model: string = PROVIDER_INFO[type].model
): AIProvider {
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
      return new GeminiProvider(apiKey, model);
    case 'openai':
      return new OpenAIProvider(apiKey, model);
    case 'groq':
      return new GroqProvider(apiKey, model);
    case 'openrouter':
      return new OpenRouterProvider(apiKey, model);
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
