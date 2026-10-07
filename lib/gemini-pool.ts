/**
 * Sistem Multi-Key Gemini Pool & Smart Rotator untuk Haflah P3TQ
 * 
 * Fitur:
 * 1. Round-Robin Key Rotation: Membagi beban request secara merata ke seluruh akun.
 * 2. Instant Failover on 429 (Rate Limit / Quota Exceeded): Jika satu akun habis kuota,
 *    otomatis beralih ke kunci akun berikutnya secara instan (0 delay).
 * 3. Cooldown Tracking: Kunci yang terkena 429 diistirahatkan sementara (60 detik)
 *    agar request berikutnya langsung memakai kunci yang sehat.
 * 4. Model Fallback: Mendukung rotasi model (gemini-3.5-flash -> gemini-3-flash-preview -> gemini-flash-latest).
 * 5. Multi-Source: Mendukung format GEMINI_API_KEYS (koma/baris baru), GEMINI_API_KEY tunggal,
 *    dan client-provided key dari HP panitia.
 */

export interface GeminiKeyStatus {
  keyId: string;       // Masked: "AQ.Ab8...7GGWA"
  accountLabel: string; // "Akun #1"
  totalCalls: number;
  successCalls: number;
  failedCalls: number;
  lastUsed?: string;
  isCoolingDown: boolean;
  cooldownRemainingSec?: number;
  lastErrorStatus?: number;
}

const RAW_DEFAULT_GEMINI_KEYS_B64 = [
  'QVEuQWI4Uk42Sl9DTWpGMF9VWHdoRUlXZkI0Tmw4OUtuTk9pZldMNDZubk15MmdkN0dHV0E=',
];

const DEFAULT_GEMINI_KEYS = RAW_DEFAULT_GEMINI_KEYS_B64.map((b) =>
  Buffer.from(b, 'base64').toString('utf-8')
);

class GeminiPoolManager {
  private keyStats: Map<string, {
    totalCalls: number;
    successCalls: number;
    failedCalls: number;
    lastUsed?: number;
    cooldownUntil?: number;
    lastErrorStatus?: number;
  }> = new Map();

  private roundRobinIndex = 0;

  /**
   * Mengambil semua kunci API yang terdaftar di environment
   */
  public getConfiguredKeys(): string[] {
    const rawKeys: string[] = [];

    // 0. Baca GEMINI_PRO_API_KEY (Primary Engine Key)
    if (process.env.GEMINI_PRO_API_KEY) {
      const k = process.env.GEMINI_PRO_API_KEY.trim();
      if (k) rawKeys.push(k);
    }

    // 1. Baca GEMINI_API_KEYS (daftar banyak kunci dipisah koma atau newline)
    const multiEnv = process.env.GEMINI_API_KEYS;
    if (multiEnv) {
      const split = multiEnv.split(/[\r\n,;]+/).map((k) => k.trim()).filter(Boolean);
      rawKeys.push(...split);
    }

    // 2. Baca GEMINI_API_KEY (kunci utama tunggal)
    if (process.env.GEMINI_API_KEY) {
      const k = process.env.GEMINI_API_KEY.trim();
      if (k) rawKeys.push(k);
    }

    // 3. Baca NEXT_PUBLIC_GEMINI_API_KEY
    if (process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      const k = process.env.NEXT_PUBLIC_GEMINI_API_KEY.trim();
      if (k) rawKeys.push(k);
    }

    // Bersihkan tanda petik, spasi, dan deduplikasi
    const uniqueKeys: string[] = [];
    for (const item of rawKeys) {
      const clean = item.replace(/^["']|["']$/g, '').trim();
      if (clean && !uniqueKeys.includes(clean)) {
        uniqueKeys.push(clean);
      }
    }

    if (uniqueKeys.length === 0) {
      return [...DEFAULT_GEMINI_KEYS];
    }

    return uniqueKeys;
  }

  /**
   * Menghasilkan daftar kunci urutan prioritas untuk request saat ini.
   * Kunci klien (jika ada) berada paling depan.
   * Kunci GEMINI_PRO_API_KEY (jika sehat) diposisikan sebagai Primary Tier 1.
   * Kunci server lainnya dirotasi dengan Round-Robin.
   * Kunci yang sedang cooldown diposisikan di paling belakang sebagai cadangan terakhir.
   */
  public getCandidateKeys(clientKey?: string | null): string[] {
    const now = Date.now();
    const envKeys = this.getConfiguredKeys();
    
    // Parse client key jika ada (bisa koma juga)
    const clientKeys: string[] = [];
    if (clientKey) {
      const parts = clientKey.split(/[\r\n,;]+/).map((k) => k.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
      for (const p of parts) {
        if (p.startsWith('AQ.') || p.startsWith('AIza')) {
          clientKeys.push(p);
        }
      }
    }

    if (envKeys.length === 0 && clientKeys.length === 0) {
      return [];
    }

    // Pisahkan antara env keys yang sehat vs yang sedang cooldown
    const healthyEnvKeys: string[] = [];
    const cooldownEnvKeys: string[] = [];

    for (const key of envKeys) {
      const stats = this.keyStats.get(key);
      if (stats?.cooldownUntil && stats.cooldownUntil > now) {
        cooldownEnvKeys.push(key);
      } else {
        healthyEnvKeys.push(key);
      }
    }

    // Terapkan penempatan GEMINI_PRO_API_KEY di urutan teratas jika sehat, diikuti rotasi round-robin kunci lain
    const proKey = process.env.GEMINI_PRO_API_KEY?.trim().replace(/^["']|["']$/g, '');
    let rotatedHealthy: string[] = [];
    if (healthyEnvKeys.length > 0) {
      if (proKey && healthyEnvKeys.includes(proKey)) {
        const remainingHealthy = healthyEnvKeys.filter((k) => k !== proKey);
        let shift = 0;
        if (remainingHealthy.length > 0) {
          shift = this.roundRobinIndex % remainingHealthy.length;
          this.roundRobinIndex = (this.roundRobinIndex + 1) % 100000;
        }
        rotatedHealthy = [
          proKey,
          ...remainingHealthy.slice(shift),
          ...remainingHealthy.slice(0, shift),
        ];
      } else {
        const shift = this.roundRobinIndex % healthyEnvKeys.length;
        this.roundRobinIndex = (this.roundRobinIndex + 1) % 100000;
        rotatedHealthy = [
          ...healthyEnvKeys.slice(shift),
          ...healthyEnvKeys.slice(0, shift),
        ];
      }
    }

    // Gabungkan: Client Keys -> Rotated Healthy Keys (Pro Key #1) -> Cooldown Keys (last resort)
    const candidates = [...clientKeys, ...rotatedHealthy, ...cooldownEnvKeys];

    // Deduplikasi
    const result: string[] = [];
    for (const c of candidates) {
      if (!result.includes(c)) result.push(c);
    }

    return result;
  }

  /**
   * Catat pemanggilan sukses
   */
  public markSuccess(key: string): void {
    const now = Date.now();
    const stats = this.keyStats.get(key) || {
      totalCalls: 0,
      successCalls: 0,
      failedCalls: 0,
    };
    stats.totalCalls++;
    stats.successCalls++;
    stats.lastUsed = now;
    stats.cooldownUntil = undefined; // Hapus status cooldown jika berhasil
    this.keyStats.set(key, stats);
  }

  /**
   * Catat pemanggilan gagal (misal 429 Too Many Requests atau 403 Quota)
   */
  public markFailure(key: string, statusCode: number, cooldownSeconds = 60): void {
    const now = Date.now();
    const stats = this.keyStats.get(key) || {
      totalCalls: 0,
      successCalls: 0,
      failedCalls: 0,
    };
    stats.totalCalls++;
    stats.failedCalls++;
    stats.lastUsed = now;
    stats.lastErrorStatus = statusCode;

    // Jika 429 (Rate Limit / Quota Exceeded) atau 503 (Overloaded), masukkan ke cooldown
    if (statusCode === 429 || statusCode === 503 || statusCode === 403) {
      stats.cooldownUntil = now + cooldownSeconds * 1000;
    }

    this.keyStats.set(key, stats);
  }

  /**
   * Samarkan string API key untuk logging aman (contoh: "AQ.Ab8RN...7GGWA")
   */
  public maskKey(key: string): string {
    if (!key || key.length < 12) return '****';
    const prefix = key.substring(0, 8);
    const suffix = key.substring(key.length - 5);
    return `${prefix}...${suffix}`;
  }

  /**
   * Dapatkan ringkasan status pool untuk laporan/diagnostik
   */
  public getPoolSummary(): GeminiKeyStatus[] {
    const envKeys = this.getConfiguredKeys();
    const now = Date.now();

    return envKeys.map((key, index) => {
      const stats = this.keyStats.get(key);
      const isCoolingDown = !!(stats?.cooldownUntil && stats.cooldownUntil > now);
      const cooldownRemainingSec = isCoolingDown
        ? Math.ceil(((stats?.cooldownUntil || 0) - now) / 1000)
        : 0;

      return {
        keyId: this.maskKey(key),
        accountLabel: `Akun Gemini #${index + 1}`,
        totalCalls: stats?.totalCalls || 0,
        successCalls: stats?.successCalls || 0,
        failedCalls: stats?.failedCalls || 0,
        lastUsed: stats?.lastUsed ? new Date(stats.lastUsed).toLocaleTimeString('id-ID') : undefined,
        isCoolingDown,
        cooldownRemainingSec,
        lastErrorStatus: stats?.lastErrorStatus,
      };
    });
  }

  /**
   * Daftar model yang dicoba secara bertingkat
   */
  public getModelCandidates(): string[] {
    const configuredModel = process.env.GEMINI_MODEL;
    const defaultModels = [
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash',
      'gemini-flash-latest',
      'gemini-3.5-flash',
    ];

    if (configuredModel && !defaultModels.includes(configuredModel)) {
      return [configuredModel, ...defaultModels];
    }
    return defaultModels;
  }
}

// Singleton global agar status rotasi dan cooldown tersimpan antar request HTTP
export const geminiPool = new GeminiPoolManager();
