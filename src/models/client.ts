import OpenAI from 'openai';
import { type ProviderConfig } from './providers.js';

export function createModelClient(provider: ProviderConfig): OpenAI {
  return new OpenAI({
    apiKey: provider.apiKey || 'no-key',
    baseURL: provider.baseURL,
  });
}
