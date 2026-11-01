import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AiResponse {
  text: string;
  model: 'Clouvia' | 'Vikey' | 'Gemini';
}

function withTimeout<T>(promise: Promise<T>, ms: number, tierName: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout ${tierName} setelah ${ms / 1000} detik`));
    }, ms);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

/**
 * 3-Tier Failover Engine for Usth. Halwaa AI Assistant:
 * Tier 1 (Utama)     : Clouvia (deepseek-4.1-flash-1017)
 * Tier 2 (Cadangan 1): Vikey (vikey/plan)
 * Tier 3 (Cadangan 2): Google Gemini (gemini-1.5-flash)
 * Fallback Terakhir  : Local Smart Knowledge Engine (handled by caller)
 */
export async function askAI(
  prompt: string,
  history: any[] = [],
  systemPrompt: string
): Promise<AiResponse> {
  const TIMEOUT_MS = 15000; // 15 detik timeout per tier

  // Format message array untuk OpenAI Compatible API (Clouvia & Vikey)
  const openAiMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];

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

  openAiMessages.push({
    role: 'user',
    content: prompt,
  });

  // =========================================================================
  // TIER 1 — CLOUVIA (UTAMA)
  // =========================================================================
  const clouviaKey =
    process.env.CLOUVIA_API_KEY ||
    'clv_live_F8gFYq4SZMZ8Hont2U4EiWICQmpMqn03NQG78mcPmIM';
  const clouviaBaseUrl = process.env.CLOUVIA_BASE_URL || 'https://router.clouvia.id/v1';
  const clouviaModel = process.env.CLOUVIA_MODEL || 'deepseek-4.1-flash-1017';

  if (clouviaKey && clouviaKey.trim().length > 10) {
    try {
      console.log('[AI-Router] Mencoba Tier 1: Clouvia...');
      const clouviaClient = new OpenAI({
        apiKey: clouviaKey,
        baseURL: clouviaBaseUrl,
      });

      const response = await withTimeout(
        clouviaClient.chat.completions.create({
          model: clouviaModel,
          messages: openAiMessages,
          temperature: 0.35,
          max_tokens: 1500,
        }),
        TIMEOUT_MS,
        'Tier 1 Clouvia'
      );

      const replyText = response.choices?.[0]?.message?.content;
      if (replyText && replyText.trim().length > 0) {
        console.log('[AI-Router] Sukses dijawab oleh Tier 1: Clouvia');
        return {
          text: replyText.trim(),
          model: 'Clouvia',
        };
      }
    } catch (err: any) {
      console.warn('[AI-Router] Tier 1 (Clouvia) gagal/timeout:', err.message || err);
    }
  }

  // =========================================================================
  // TIER 2 — VIKEY PLAN (CADANGAN 1)
  // =========================================================================
  const vikeyKey =
    process.env.VIKEY_API_KEY ||
    process.env.AI_GATEWAY_API_KEY ||
    'vk-2e03aab0-64d7-4069-869c-d706172c2232';
  const vikeyBaseUrl =
    process.env.VIKEY_BASE_URL ||
    process.env.AI_GATEWAY_BASE_URL ||
    'https://api-plan.vikey.ai/v1';
  const vikeyModel =
    process.env.VIKEY_MODEL || process.env.AI_GATEWAY_MODEL || 'vikey/plan';

  if (vikeyKey && vikeyKey.trim().length > 8) {
    try {
      console.log('[AI-Router] Mencoba Tier 2: Vikey Plan...');
      const vikeyClient = new OpenAI({
        apiKey: vikeyKey,
        baseURL: vikeyBaseUrl,
      });

      const response = await withTimeout(
        vikeyClient.chat.completions.create({
          model: vikeyModel,
          messages: openAiMessages,
          temperature: 0.35,
          max_tokens: 2500,
        }),
        TIMEOUT_MS,
        'Tier 2 Vikey'
      );

      const replyText = response.choices?.[0]?.message?.content;
      if (
        replyText &&
        replyText.trim().length > 0 &&
        !replyText.includes('[No answer:')
      ) {
        console.log('[AI-Router] Sukses dijawab oleh Tier 2: Vikey');
        return {
          text: replyText.trim(),
          model: 'Vikey',
        };
      }
    } catch (err: any) {
      console.warn('[AI-Router] Tier 2 (Vikey) gagal/timeout:', err.message || err);
    }
  }

  // =========================================================================
  // TIER 3 — GOOGLE GEMINI (CADANGAN 2)
  // =========================================================================
  const geminiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GEMINI_PRO_API_KEY ||
    process.env.GEMINI_API_KEYS;
  const geminiModelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  if (geminiKey && geminiKey.trim().length > 10) {
    try {
      console.log('[AI-Router] Mencoba Tier 3: Google Gemini...');
      const genAI = new GoogleGenerativeAI(geminiKey.trim());
      const model = genAI.getGenerativeModel({
        model: geminiModelName,
        systemInstruction: systemPrompt,
      });

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

      const chat = model.startChat({
        history: geminiHistory,
      });

      const result = await withTimeout(
        chat.sendMessage(prompt),
        TIMEOUT_MS,
        'Tier 3 Gemini'
      );

      const replyText = result.response.text();
      if (replyText && replyText.trim().length > 0) {
        console.log('[AI-Router] Sukses dijawab oleh Tier 3: Gemini');
        return {
          text: replyText.trim(),
          model: 'Gemini',
        };
      }
    } catch (err: any) {
      console.warn('[AI-Router] Tier 3 (Gemini) gagal/timeout:', err.message || err);
    }
  }

  // Jika ketiga tier AI gagal, lemparkan error agar ditangkap oleh route handler
  throw new Error('Seluruh Tier AI (Clouvia, Vikey, Gemini) gagal merespons atau sedang offline.');
}
