import OpenAI from 'openai';

export const AI_GATEWAY_DEFAULT_KEY = 'sk-b4de593a3a84834b-gs89m9-941a9ab8';
export const AI_GATEWAY_DEFAULT_URL = 'http://localhost:20128/v1';
export const AI_GATEWAY_DEFAULT_MODEL = 'gpt-4o-mini';

export const aiClient = new OpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY || AI_GATEWAY_DEFAULT_KEY,
  baseURL: process.env.AI_GATEWAY_BASE_URL || AI_GATEWAY_DEFAULT_URL,
  timeout: 8000,
});

export function getAiClient(customApiKey?: string): OpenAI {
  if (customApiKey && customApiKey.trim().length > 0) {
    return new OpenAI({
      apiKey: customApiKey.trim(),
      baseURL: process.env.AI_GATEWAY_BASE_URL || AI_GATEWAY_DEFAULT_URL,
      timeout: 8000,
    });
  }
  return aiClient;
}
