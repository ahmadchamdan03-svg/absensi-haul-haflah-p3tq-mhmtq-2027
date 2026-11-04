// =============================================================================
// MODUL KNOWLEDGE BASE TEKNIS & INFRASTRUKTUR SISTEM — USTH. HALWAA
// Haul & Haflah P3TQ & MHMTQ 1448 H. / 2027 M.
// =============================================================================

export const TECHNICAL_KNOWLEDGE_SECTION = `
=============================================================================
[KNOWLEDGE BASE TEKNIS & INFRASTRUKTUR SISTEM]
=============================================================================
1. ARSITEKTUR 3-TIER AI FAILOVER:
   - Tier 1: Clouvia AI Router (endpoint: https://router.clouvia.id/v1). Provider router utama untuk performa tinggi dan routing model AI (default chat: gemini-2.5-flash / deepseek-v4.1-flash).
   - Tier 2: Vikey / OpenAI Compatible Gateway (endpoint: https://api.vikey.ai/v1 atau https://api-plan.vikey.ai/v1). Cadangan pertama jika Clouvia mengalami timeout / kuota habis / kendala jaringan.
   - Tier 3: Direct Google Gemini API (model: gemini-2.5-flash / gemini-3.5-flash-lite). Jaring pengaman terakhir jika Tier 1 & 2 tidak dapat diakses.
   - Mekanisme Failover: Sistem berpindah antar-tier secara otomatis tanpa menghentikan layanan bagi pengguna.

2. INFRASTRUKTUR BACKEND & DATA:
   - Database & Auth: Supabase PostgreSQL (menampung tabel peserta_santri, tamu_undangan, presensi_log, kuota_pembelian secara realtime dengan Row Level Security).
   - Hosting & Serverless: Vercel Cloud Platform (Fluid Compute & Serverless Edge Functions).
   - WhatsApp Gateway: Fonnte API (otomatisasi distribusi pesan konfirmasi kehadiran, e-ticket, dan broadcast QR barcode).

3. PANDUAN MENJAWAB KENDALA TEKNIS / ERROR ENDPOINT:
   - Jika pengguna bertanya mengenai status error endpoint, seperti "https://router.clouvia.id/v1 error?", "clouvia error?", "api clouvia bermasalah", "supabase error", "kenapa respon AI lambat", dsb:
     * Tetap gunakan persona santun dan ramah khas Usth. Halwaa, dan selalu sapa pengguna dengan "Us".
     * Jelaskan bahwa sistem memiliki mekanisme 3-Tier AI Failover otomatis: jika salah satu endpoint (seperti Clouvia) mengalami kendala (misal HTTP 502/504 Bad Gateway, HTTP 429 Rate Limit, atau 499 Abort akibat timeout), sistem otomatis mengalihkan proses ke Vikey atau Google Gemini.
     * Berikan saran langkah pengecekan teknis bagi admin/pengembang:
       1. Cek saldo kuota API key dan status operasional di dashboard provider (misal: dashboard Clouvia di clouvia.id).
       2. Cek log error di Vercel Deployment Logs atau konsol server untuk meninjau status kode error.
       3. Untuk permintaan file/dokumen (PDF/Word/Excel) atau komputasi reasoning, pastikan batas timeout mencukupi (hingga 20 detik).
       4. Pastikan environment variables (CLOUVIA_API_KEY, VIKEY_API_KEY, GEMINI_API_KEY) aktif dan terpasang dengan benar.
`;

const TECH_KEYWORDS = [
  'clouvia',
  'router.clouvia.id',
  'vikey',
  'api.vikey.ai',
  'supabase',
  'fonnte',
  'vercel',
  'failover',
  '3-tier',
  'three-tier',
  'ai router',
  'api router',
  'gemini api',
  'api key clouvia',
  'api key vikey',
  'api key gemini',
];

export function isTechnicalInfrastructureQuery(query: string): boolean {
  if (!query || typeof query !== 'string') return false;
  const q = query.toLowerCase().trim();

  // Keyword langsung
  for (const kw of TECH_KEYWORDS) {
    if (q.includes(kw)) return true;
  }

  // Pola pertanyaan URL endpoint atau error router/gateway
  if (/https?:\/\/[^\s]+/i.test(q) && /(error|down|rusak|masalah|kendala|mati|gangguan|status)/i.test(q)) {
    return true;
  }

  if (/(endpoint|router|gateway|api|database|server)\s+(error|down|rusak|bermasalah|gangguan|mati|kenapa)/i.test(q)) {
    return true;
  }

  if (/(kenapa|mengapa|apakah)\s+(ai|clouvia|vikey|gemini|supabase|vercel|fonnte)\s+(error|lambat|down|mati|lemot)/i.test(q)) {
    return true;
  }

  return false;
}

export function handleTechnicalInfrastructureQuery(query: string): string {
  const q = query.toLowerCase().trim();

  if (q.includes('clouvia') || q.includes('router.clouvia.id')) {
    return `Nggih Us, terkait endpoint **Clouvia AI Router** (\`https://router.clouvia.id/v1\`):\n\nEndpoint Clouvia bertindak sebagai **Tier 1 (Gateway Utama)** dalam arsitektur AI Usth. Halwaa. Jika terjadi kendala koneksi, HTTP 499 (Abort Timeout), atau 502/504 (Bad Gateway) pada Clouvia, sistem kami secara otomatis mengaktifkan mekanisme **3-Tier Failover** dengan mengalihkan pemrosesan langsung ke Tier 2 (**Vikey**) atau Tier 3 (**Direct Google Gemini**).\n\nUntuk pengecekan teknis lebih lanjut oleh tim admin, silakan:\n1. Pastikan saldo token / kuota API Key di dashboard [clouvia.id](https://clouvia.id) masih mencukupi.\n2. Cek apakah model yang digunakan membutuhkan waktu reasoning lebih lama (timeout telah kami sediakan hingga 20 detik untuk dokumen berat).\n3. Tinjau log deployment di Vercel untuk memastikan konektivitas router.\n\nWonten ingkang saget kula bantu malih seputar sistem niki, Us? 😊`;
  }

  if (q.includes('supabase')) {
    return `Nggih Us, terkait database **Supabase PostgreSQL**:\n\nSupabase digunakan sebagai penyimpanan data real-time utama untuk presensi santri, data tamu undangan, pencatatan kuota tambahan, dan log kehadiran. Jika terdapat kendala koneksi ke Supabase, pastikan status proyek Supabase dalam kondisi *Active* dan kredensial \`NEXT_PUBLIC_SUPABASE_URL\` serta \`SUPABASE_SERVICE_ROLE_KEY\` terkonfigurasi dengan tepat di environment Vercel.\n\nAda lagi yang perlu dicek pada data sistem, Us?`;
  }

  if (q.includes('fonnte')) {
    return `Nggih Us, untuk layanan **Fonnte WhatsApp Gateway**:\n\nFonnte bertugas mendistribusikan notifikasi pesan undangan, e-ticket, dan QR barcode kepada tamu serta wali santri. Jika pesan WhatsApp terkendala pengiriman, silakan pastikan perangkat WA di dashboard Fonnte berstatus *Connected* dan masa aktif token \`FONNTE_TOKEN\` masih berlaku.\n\nWonten ingkang saget kula bantu malih, Us?`;
  }

  return `Nggih Us, sistem aplikasi Haul & Haflah P3TQ dan MHMTQ didukung oleh infrastruktur modern yang andal:\n\n1. **3-Tier AI Failover**: Tier 1 Clouvia Router (\`router.clouvia.id\`), didukung cadangan Tier 2 Vikey (\`api.vikey.ai\`), serta jaring pengaman Tier 3 Google Gemini (\`gemini-2.5-flash\`). Jika satu penyedia mengalami kendala, sistem langsung beralih secara otomatis.\n2. **Database & Backend**: Supabase PostgreSQL berkecepatan tinggi dengan sistem proteksi RLS.\n3. **Hosting & Serverless**: Vercel Cloud Platform untuk performa edge computing yang stabil.\n4. **WhatsApp Gateway**: Fonnte API untuk pengiriman tiket dan pengumuman resmi.\n\nBila terjadi kendala pada salah satu endpoint, sistem failover akan menjaga layanan tetap berjalan. Ada hal spesifik yang ingin dianalisis lebih lanjut, Us?`;
}
