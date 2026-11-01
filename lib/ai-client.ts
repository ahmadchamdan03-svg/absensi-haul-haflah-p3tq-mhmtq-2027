import OpenAI from 'openai';

// Kredensial TIDAK di-hardcode. Wajib diisi melalui Environment Variables
// (AI_GATEWAY_API_KEY atau VIKEY_API_KEY) di .env.local / Vercel.
export const AI_GATEWAY_DEFAULT_URL = 'https://api-plan.vikey.ai/v1';
export const AI_GATEWAY_DEFAULT_MODEL = 'vikey/plan';

function resolveGatewayKey(): string {
  return (process.env.AI_GATEWAY_API_KEY || process.env.VIKEY_API_KEY || '').trim();
}

function resolveGatewayUrl(): string {
  return process.env.AI_GATEWAY_BASE_URL || process.env.VIKEY_BASE_URL || AI_GATEWAY_DEFAULT_URL;
}

let cachedClient: OpenAI | null = null;

export function getAiClient(customApiKey?: string): OpenAI {
  const apiKey = customApiKey && customApiKey.trim().length > 0 ? customApiKey.trim() : resolveGatewayKey();
  if (!apiKey) {
    throw new Error('AI Gateway API key belum diset (AI_GATEWAY_API_KEY / VIKEY_API_KEY).');
  }

  if (customApiKey && customApiKey.trim().length > 0) {
    return new OpenAI({ apiKey, baseURL: resolveGatewayUrl(), timeout: 15000, maxRetries: 0 });
  }

  if (!cachedClient) {
    cachedClient = new OpenAI({ apiKey, baseURL: resolveGatewayUrl(), timeout: 15000, maxRetries: 0 });
  }
  return cachedClient;
}
