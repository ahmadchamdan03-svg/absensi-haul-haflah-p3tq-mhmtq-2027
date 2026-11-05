import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AiResponse {
  text: string;
  model: 'Clouvia' | 'Vikey' | 'Gemini';
}

type ProviderName = AiResponse['model'];

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

// Timeout ketat per tier: tepat 15 detik. Lewat batas → controller.abort() memutus request.
const TIER_TIMEOUT_MS: Record<ProviderName, number> = {
  Clouvia: 12000,
  Vikey: 15000,
  Gemini: 15000,
};

/**
 * Membaca env var secara aman. API Key TIDAK PERNAH di-hardcode di kode;
 * seluruh kredensial wajib disuplai melalui Environment Variables (.env.local / Vercel).
 */
function readEnv(...names: string[]): string {
  for (const name of names) {
    const value = process.env[name];
    if (value && value.trim().length > 0) return value.trim();
  }
  return '';
}

/**
 * Membuat AbortController yang otomatis memanggil abort() setelah `ms`.
 * abort() memutus koneksi HTTP sehingga server provider berhenti memproses
 * (mencegah token terbuang untuk jawaban yang sudah tidak ditunggu).
 */
function createTimeoutController(ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { controller, clear: () => clearTimeout(timer) };
}

/**
 * Log error terperinci: status code, kode error, dan response body dari provider.
 */
function logTierError(tierLabel: string, err: any, startedAt: number, aborted: boolean) {
  const elapsedMs = Date.now() - startedAt;
  if (aborted) {
    console.error(`[AI-Router] ${tierLabel} TIMEOUT setelah ${elapsedMs} ms — request dibatalkan via AbortController.`);
    return;
  }
  if (err instanceof OpenAI.APIError) {
    let body: string;
    try {
      body = JSON.stringify(err.error ?? err.message);
    } catch {
      body = String(err.error ?? err.message);
    }
    console.error(
      `[AI-Router] ${tierLabel} GAGAL (${elapsedMs} ms) | status=${err.status ?? 'n/a'} | code=${err.code ?? 'n/a'} | type=${err.type ?? 'n/a'} | body=${body}`
    );
    return;
  }
  const status = err?.status ?? err?.response?.status ?? 'n/a';
  const rawBody = err?.errorDetails ?? err?.response?.data ?? err?.message ?? String(err);
  let bodyStr: string;
  try {
    bodyStr = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody);
  } catch {
    bodyStr = String(rawBody);
  }
  console.error(
    `[AI-Router] ${tierLabel} GAGAL (${elapsedMs} ms) | status=${status} | body=${bodyStr}`
  );
}

/**
 * Pemanggil generik untuk provider OpenAI-compatible (Clouvia & Vikey).
 * - maxRetries: 0 → tidak ada retry tersembunyi; gagal langsung pindah tier.
 * - signal: AbortController → request benar-benar diputus saat timeout.
 */
async function callOpenAiCompatible(params: {
  tierLabel: string;
  apiKey: string;
  baseURL: string;
  model: string;
  timeoutMs: number;
  maxTokens: number;
  messages: ChatMessage[];
  isValidReply?: (text: string) => boolean;
}): Promise<string | null> {
  const { tierLabel, apiKey, baseURL, model, timeoutMs, maxTokens, messages, isValidReply } = params;
  const startedAt = Date.now();
  const { controller, clear } = createTimeoutController(timeoutMs);

  try {
    console.log(`[AI-Router] Mencoba ${tierLabel} (model: ${model}, timeout: ${timeoutMs / 1000}s)...`);
    const client = new OpenAI({ apiKey, baseURL, maxRetries: 0, timeout: timeoutMs + 1000 });

    const response = await client.chat.completions.create(
      {
        model,
        messages,
        temperature: 0.35,
        max_tokens: maxTokens,
      },
      { signal: controller.signal }
    );

    const replyText = response.choices?.[0]?.message?.content?.trim() || '';
    if (replyText.length > 0 && (!isValidReply || isValidReply(replyText))) {
      console.log(`[AI-Router] Sukses dijawab oleh ${tierLabel} dalam ${Date.now() - startedAt} ms`);
      return replyText;
    }
    console.warn(`[AI-Router] ${tierLabel} mengembalikan jawaban kosong/tidak valid (${Date.now() - startedAt} ms).`);
    return null;
  } catch (err: any) {
    logTierError(tierLabel, err, startedAt, controller.signal.aborted);
    return null;
  } finally {
    clear();
  }
}

/**
 * 3-Tier Failover Engine for Usth. Halwaa AI Assistant:
 * Tier 1 (Utama)     : Clouvia (coding-high-flash)
 * Tier 2 (Cadangan 1): Vikey (vikey/plan)
 * Tier 3 (Cadangan 2): Google Gemini (gemini-2.5-flash)
 * Fallback Terakhir  : Local Smart Knowledge Engine (handled by caller)
 */
export function isDocumentFileIntent(prompt: string): boolean {
  return /\b(pdf|excel|xlsx|xls|word|docx|doc|csv|file|berkas|dokumen|unduh|download|ekspor)\b/i.test(prompt);
}

export interface AskAiOptions {
  model?: string;
  timeout?: number;
}

export async function askAI(
  prompt: string,
  history: any[] = [],
  systemPrompt: string,
  options?: AskAiOptions
): Promise<AiResponse> {
  // Format message array untuk OpenAI Compatible API (Clouvia & Vikey)
  const openAiMessages: ChatMessage[] = [{ role: 'system', content: systemPrompt }];

  if (Array.isArray(history) && history.length > 0) {
    for (const item of history.slice(-6)) {
      if (item && item.content) {
        openAiMessages.push({
          role: item.role === 'assistant' ? 'assistant' : 'user',
          content: String(item.content),
        });
      }
    }
  }

  openAiMessages.push({ role: 'user', content: prompt });

  // Timeout dinamis (default 12s untuk Tier 1 Clouvia, 15s untuk failover)
  const requestTimeoutMs = options?.timeout || TIER_TIMEOUT_MS.Clouvia;

  // =========================================================================
  // TIER 1 — CLOUVIA (UTAMA)
  // =========================================================================
  const clouviaKey = readEnv('CLOUVIA_API_KEY');
  if (clouviaKey) {
    const clouviaModel = options?.model || readEnv('CLOUVIA_MODEL') || 'coding-high-flash';
    const text = await callOpenAiCompatible({
      tierLabel: 'Tier 1 Clouvia',
      apiKey: clouviaKey,
      baseURL: readEnv('CLOUVIA_BASE_URL') || 'https://router.clouvia.id/v1',
      model: clouviaModel,
      timeoutMs: requestTimeoutMs,
      maxTokens: 2500,
      messages: openAiMessages,
    });
    if (text) return { text, model: 'Clouvia' };
  } else {
    console.error('[AI-Router] Tier 1 Clouvia dilewati: CLOUVIA_API_KEY belum diset.');
  }

  // =========================================================================
  // TIER 2 — VIKEY PLAN (CADANGAN 1)
  // =========================================================================
  const vikeyKey = readEnv('VIKEY_API_KEY', 'AI_GATEWAY_API_KEY');
  if (vikeyKey) {
    const text = await callOpenAiCompatible({
      tierLabel: 'Tier 2 Vikey',
      apiKey: vikeyKey,
      baseURL: readEnv('VIKEY_BASE_URL', 'AI_GATEWAY_BASE_URL') || 'https://api-plan.vikey.ai/v1',
      model: readEnv('VIKEY_MODEL', 'AI_GATEWAY_MODEL') || 'vikey/plan',
      timeoutMs: requestTimeoutMs,
      // vikey/plan membutuhkan headroom token karena reasoning internal
      maxTokens: 2500,
      messages: openAiMessages,
      isValidReply: (t) => !t.includes('[No answer:'),
    });
    if (text) return { text, model: 'Vikey' };
  } else {
    console.error('[AI-Router] Tier 2 Vikey dilewati: VIKEY_API_KEY belum diset.');
  }

  // =========================================================================
  // TIER 3 — GOOGLE GEMINI (CADANGAN 2)
  // =========================================================================
  const geminiKey = (process.env.GEMINI_API_KEY || readEnv('GEMINI_PRO_API_KEY', 'GEMINI_API_KEYS')).trim();
  if (geminiKey) {
    const tierLabel = 'Tier 3 Gemini';
    const primaryGeminiModel = readEnv('GEMINI_MODEL') || 'gemini-2.5-flash';
    const candidateGeminiModels = Array.from(new Set([primaryGeminiModel, 'gemini-3.5-flash-lite']));
    const startedAt = Date.now();
    const { controller, clear } = createTimeoutController(requestTimeoutMs);

    try {
      // GEMINI_API_KEYS bisa berisi beberapa key dipisah koma — ambil yang pertama
      const genAI = new GoogleGenerativeAI(geminiKey.split(',')[0].trim());

      // Format riwayat pesan untuk Google Generative AI
      const geminiHistory: Array<{ role: 'user' | 'model'; parts: [{ text: string }] }> = [];
      if (Array.isArray(history) && history.length > 0) {
        for (const item of history.slice(-6)) {
          if (item && item.content) {
            geminiHistory.push({
              role: item.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: String(item.content) }],
            });
          }
        }
      }

      for (const geminiModelName of candidateGeminiModels) {
        if (controller.signal.aborted) break;
        try {
          console.log(`[AI-Router] Mencoba ${tierLabel} (model: ${geminiModelName})...`);
          const model = genAI.getGenerativeModel({
            model: geminiModelName,
            systemInstruction: systemPrompt,
          });
          const chat = model.startChat({ history: geminiHistory });
          const result = await chat.sendMessage(prompt, { signal: controller.signal });
          const replyText = result.response.text()?.trim() || '';
          if (replyText.length > 0) {
            console.log(`[AI-Router] Sukses dijawab oleh ${tierLabel} (${geminiModelName}) dalam ${Date.now() - startedAt} ms`);
            return { text: replyText, model: 'Gemini' };
          }
        } catch (innerErr: any) {
          const msg = String(innerErr?.message || innerErr);
          const isModelNotFound = innerErr?.status === 404 || msg.includes('404 Not Found');
          if (isModelNotFound && geminiModelName !== candidateGeminiModels[candidateGeminiModels.length - 1]) {
            console.error(`[AI-Router] ${tierLabel} model ${geminiModelName} 404 — mencoba fallback model berikutnya...`);
            continue;
          }
          throw innerErr;
        }
      }
      console.error(`[AI-Router] ${tierLabel} mengembalikan jawaban kosong.`);
    } catch (err: any) {
      logTierError(tierLabel, err, startedAt, controller.signal.aborted);
    } finally {
      clear();
    }
  } else {
    console.error('[AI-Router] Tier 3 Gemini dilewati: GEMINI_API_KEY belum diset.');
  }

  // Jika ketiga tier AI gagal, lemparkan error agar ditangkap oleh route handler
  throw new Error('Seluruh Tier AI (Clouvia, Vikey, Gemini) gagal merespons atau sedang offline.');
}
