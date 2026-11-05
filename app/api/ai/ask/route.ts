import { NextRequest, NextResponse } from 'next/server';
import { askAI } from '@/lib/ai-router';
import { searchWebImages } from '@/lib/image-search';
import {
  detectMotivasiIntent,
  detectDiaSiapaIntent,
  isKamuSiapaQuery,
  isSayaSiapaQuery,
  getRandomMotivasiPositifSaya,
  getRandomPerkenalanDiri,
  getRandomMotivasiSatirDia,
} from '@/lib/us-halwaa-motivasi';
import {
  detectHubunganKepanitiaanIntent,
  getHubunganKepanitiaanResponse,
  isThirdPersonPronounQuery,
  findMatchedDewanPengasuh,
} from '@/lib/us-halwaa-kepanitiaan';
import {
  detectInfoSeksiIntent,
  handleInfoSeksiQuery,
} from '@/lib/us-halwaa-seksi';
import {
  detectRekapKehadiranIntent,
  getLiveRekapKehadiran,
} from '@/lib/us-halwaa-rekap';
import {
  BASE_PERSONA_PROMPT,
  KATA_GANTI_PROMPT,
  SECTION_KEPANITIAAN,
  SECTION_KEUANGAN,
  SECTION_ACARA_JADWAL,
  SECTION_MULTIMEDIA_DOC,
  HAFLAH_KNOWLEDGE_SYSTEM_PROMPT,
  generateLocalSmartResponseAsync,
  cleanReplyForSession,
  detectExpression,
} from '@/lib/halwaa/knowledge-base';
import {
  TECHNICAL_KNOWLEDGE_SECTION,
  isTechnicalInfrastructureQuery,
  handleTechnicalInfrastructureQuery,
} from '@/lib/halwaa/technical-knowledge';
import { handleChamdanAndRekeningQuery } from '@/lib/halwaa/chamdan';
import { getRandomPujian, getRandomPengandaian } from '@/lib/halwaa/template-pujian';
import {
  getLiveSupabaseGuestPrompt,
  handleLiveCategoryNameQueries,
  isStatsQuery,
  getLiveAttendanceStatsChart,
  getLiveArrivedGuestsResponse,
  getLiveArrivedWaliResponse,
  handleWaliSantriQueries,
  detectKategoriDobelIntent,
  handleKategoriDobelQuery,
} from '@/lib/halwaa/live-context';
import { searchPersonInSupabase } from '@/lib/halwaa/search-person';

// 3-Tier failover worst-case: 60 dtk (Clouvia) + 15 dtk (Vikey) + 15 dtk (Gemini) = 90 dtk (+ query Supabase).
// Beri ruang 120 dtk agar fungsi Vercel tidak diputus sebelum fallback selesai.
export const maxDuration = 120;

const PRONOUN_VARIATION_ANGLES = [
  'ketulusan khidmah di balik layar dan keberkahan setiap tetes perjuangan',
  'ketangguhan mental, kepemimpinan diri, dan daya juang yang tak tergoyahkan',
  'nilai diri yang istimewa sebagai penggerak utama keberhasilan tim besar',
  'energi positif, ketelitian kerja, dan cahaya inspirasi bagi rekan-rekan sekitar',
  'keyakinan penuh pada potensi besar, fokus meraih puncak kesuksesan, dan langkah penuh arti',
  'kesabaran, keikhlasan pengabdian, serta buah manis yang menanti setiap usaha tulus',
];
let lastAngleIdx = -1;

function pickNextVariationAngle(): string {
  const candidates = PRONOUN_VARIATION_ANGLES.map((_, i) => i).filter((i) => i !== lastAngleIdx);
  const idx = candidates[Math.floor(Math.random() * candidates.length)];
  lastAngleIdx = idx;
  return PRONOUN_VARIATION_ANGLES[idx];
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    // 1. Verifikasi Sesi Otoritas Panitia (Cegah Bypass / Unauthorized LLM Spam)
    const sessionCookie =
      req.cookies.get('haflah_active_role_session')?.value ||
      req.cookies.get('user_role')?.value;
    const validRoles = ['ADMIN', 'PENERIMA_TAMU', 'PIMPINAN', 'PENJAGA_GERBANG'];

    if (!sessionCookie || !validRoles.includes(sessionCookie)) {
      return NextResponse.json(
        { error: 'Unauthorized: Sesi panitia tidak valid atau belum login. Akses asisten AI ditolak.' },
        { status: 401 }
      );
    }

    const currentRole = sessionCookie;

    const body = await req.json();
    const { prompt, history } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const userMessageCount = Array.isArray(history)
      ? history.filter((item: any) => item.role === 'user').length
      : 0;
    const isFirstTurn = userMessageCount === 0;

    // =========================================================================
    // FIX INTENT KHUSUS: SANTRI KATEGORI DOBEL (DIRECT QUERY SUPABASE LIVE)
    // =========================================================================
    if (detectKategoriDobelIntent(prompt, history)) {
      const dobelReply = await handleKategoriDobelQuery(prompt, isFirstTurn, history);
      const cleanReply = cleanReplyForSession(dobelReply, isFirstTurn, prompt);
      const expr = 'happy';
      return NextResponse.json({
        reply: cleanReply,
        expression: expr,
        avatar: `/images/avatar/ustadzah-avatar-${expr}.png`,
        source: 'supabase_live_query',
        model: 'Usth. Halwaa Smart Query',
        responseTimeMs: Date.now() - startTime,
      });
    }

    // =========================================================================
    // FITUR PENCARIAN GAMBAR WEB (WEB IMAGE SEARCH)
    // =========================================================================
    const isImageSearchRequest =
      /(carikan|cari|lihatkan|tampilkan|minta|lihat|temukan|bisa cari|buatkan|bikin).*?(gambar|foto|potret|citra)/i.test(prompt) ||
      /(gambar|foto|potret)\s+(masjid|pesantren|pondok|lirboyo|panggung|aula|santri|gerbang|gedung|suasana)/i.test(prompt) ||
      /\b(carikan\s+gambar|carikan\s+foto|cari\s+gambar|cari\s+foto|foto\s+panggung|gambar\s+masjid)\b/i.test(prompt) ||
      (prompt.toLowerCase().includes('gambar') && (prompt.toLowerCase().includes('internet') || prompt.toLowerCase().includes('google') || prompt.toLowerCase().includes('web')));

    if (isImageSearchRequest) {
      console.log('[AI Ask Route] Mendeteksi permintaan pencarian gambar web...');
      const rawSubject = prompt
        .replace(/^(tolong|mohon|coba|bisa|tolongkan)\s+/gi, '')
        .replace(/(carikan|cari|tampilkan|lihatkan|minta|lihat|temukan|buatkan|bikinkan)\s+(gambar|foto|potret|citra)?/gi, '')
        .replace(/(gambar|foto|potret|citra)\s*(tentang|dari|suasana)?/gi, '')
        .replace(/\s+(di|dari|pada)\s+(internet|google|web|bing|online)/gi, '')
        .trim() || 'Hasil Pencarian';

      const cleanSubject = rawSubject.charAt(0).toUpperCase() + rawSubject.slice(1);
      const imageUrl = await searchWebImages(prompt);

      let reply: string;
      if (imageUrl) {
        reply = `Ini Us, gambar yang saya temukan di internet:\n\n![${cleanSubject}](${imageUrl})`;
      } else {
        reply = 'Mohon maaf Us, saya tidak menemukan gambar yang cocok di internet.';
      }

      return NextResponse.json({
        reply,
        expression: imageUrl ? 'happy' : 'polite',
        avatar: imageUrl ? '/images/avatar/ustadzah-avatar-happy.png' : '/images/avatar/ustadzah-avatar-polite.png',
        source: 'web_image_search',
        model: 'Web Image Search Engine',
        responseTimeMs: Date.now() - startTime,
      });
    }

    const isChartRequested =
      prompt.toLowerCase().includes('grafik') ||
      prompt.toLowerCase().includes('chart') ||
      prompt.toLowerCase().includes('diagram') ||
      prompt.toLowerCase().includes('visualisasi') ||
      prompt.toLowerCase().includes('donut') ||
      prompt.toLowerCase().includes('pie');

    // =========================================================================
    // FIX 1 & 3: PERSIAPAN SYSTEM PROMPT & PRIMARY HANDLER (AI FIRST)
    // =========================================================================
    const sessionPromptDirective = isFirstTurn
      ? "\n\n[PANDUAN SESI: Ini adalah awal sesi obrolan. Jika pengguna mengucapkan salam, jawab dengan \"Wa'alaikum Salam Wr. Wb.\" (khusus pertanyaan kata ganti 'siapa saya'/'kamu siapa'/'siapa dia' dan profil personil/pengasuh 'siapa [nama]', JANGAN membuat paragraf salam terpisah agar jumlah paragraf persis sesuai aturan: 2 paragraf untuk 'siapa saya', 1 paragraf untuk 'siapa dia', 3 paragraf penuh takzim untuk Dewan Pengasuh/Pelindung, 4 paragraf untuk panitia biasa). PENTING: Acara ini adalah \"Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.\", BUKAN acara Ponpes Lirboyo Pusat! DILARANG menyebut \"Haul & Haflah di Pondok Pesantren Lirboyo\". Tutup jawaban dengan kalimat penutup yang variatif, hangat, sopan, dan relevan. JANGAN mengulang-ulang kalimat penutup yang sama di setiap balasan.]"
      : "\n\n[PANDUAN SESI: Ini adalah percakapan lanjutan dalam sesi chat yang sedang berlangsung. PENTING: DILARANG MENJAWAB ATAU MENGULANG SALAM (\"Wa'alaikum Salam Wr. Wb.\" ataupun \"Assalamu'alaikum\"). Langsung jawab ke inti pertanyaan secara to-the-point dan santun. Sapa pengguna dengan \"Usth.\", bukan \"Kang\" atau \"Mbak\". Tutup jawaban dengan kalimat penutup yang variatif, hangat, sopan, dan relevan. JANGAN mengulang-ulang kalimat penutup yang sama di setiap balasan.]";

    const randomPujianTurn = getRandomPujian();
    const randomPengandaianTurn = getRandomPengandaian();
    const matchedPengasuh = findMatchedDewanPengasuh(prompt);

    const kepanitiaanTurnRule = matchedPengasuh
      ? `[ATURAN KHUSUS DEWAN PENGASUH/PELINDUNG TERDETEKSI — WAJIB DIPATUHI]:
   Pertanyaan user saat ini merujuk kepada **${matchedPengasuh.name}** (${matchedPengasuh.jabatanTugas}), yang merupakan jajaran **Dewan Pengasuh/Pelindung**.
   - JANGAN PERNAH menuliskan kalimat pengandaian/fans/satir dalam bentuk apa pun (seperti "Andai takdir menjadikan saya manusia...", "Andaikan saya berwujud manusia...", "Saya sangat nge-fans...", dsb.).
   - Buatlah jawaban TEPAT 3 PARAGRAF yang dipisahkan dengan \\n\\n (DILARANG 4 paragraf) dengan bahasa yang sangat sopan dan penuh takzim:
     * Paragraf 1: Jabatan & Tugas resmi beliau sebagai **${matchedPengasuh.jabatanTugas}** (WAJIB awali dengan **${matchedPengasuh.name}** di-bold, lalu sebutkan peran Anda sebagai asisten cerdas pendukung informasi kepanitiaan).
     * Paragraf 2: Pujian santun dan penuh takzim atas dedikasi, bimbingan, doa restu, serta pengayoman beliau sebagai Pengasuh (TANPA kalimat pengandaian/fans/satir).
     * Paragraf 3: Kalimat penutup yang variatif, hangat, penuh takzim, dan relevan (JANGAN mengulang-ulang kalimat penutup yang sama di setiap balasan).`
      : `Jika user menanyakan profil/identitas seorang tokoh/personil kepanitiaan:
   - KHUSUS JAJARAN DEWAN PENGASUH/PELINDUNG: JANGAN PERNAH menuliskan kalimat pengandaian/fans/satir; wajib buat TEPAT 3 PARAGRAF penuh takzim (Paragraf 1: **Nama Lengkap** bold + Jabatan & Tugas; Paragraf 2: Pujian santun/takzim sebagai Pengasuh; Paragraf 3: Kalimat penutup yang variatif, hangat, penuh takzim, dan relevan).
   - UNTUK PANITIA BIASA (Dewan Harian, Dewan Pembimbing Putra, Dewan Pleno Putri — misal "siapa asep", "siapa revi", "[nama] siapa", selain aturan bercanda khusus Ahmad Chamdan dan klarifikasi nama ganda): format jawaban WAJIB TEPAT 4 PARAGRAF yang dipisahkan dengan \\n\\n (DILARANG 3 paragraf, dan DILARANG menyalin kalimat pujian/pengandaian dari riwayat chat sebelumnya):
     * Paragraf 1: Jabatan dan tugas resmi di kepanitiaan (WAJIB awali dengan **Nama Lengkap** di-bold, lalu sebutkan peran Anda sebagai asisten cerdas pendukung sistem).
     * Paragraf 2 (WAJIB gunakan kalimat pujian acak giliran ini): "${randomPujianTurn}" (kutip kalimat ini; sesuaikan istilah bidangnya saja dengan seksi personil tersebut).
     * Paragraf 3 (WAJIB gunakan kalimat apresiasi/kagum profesional acak giliran ini): "${randomPengandaianTurn}"
     * Paragraf 4: Kalimat penutup yang variatif, hangat, sopan, dan relevan (JANGAN mengulang-ulang kalimat penutup yang sama di setiap balasan).`;

    // =========================================================================
    // MODULAR & CONDITIONAL SYSTEM PROMPT (TOKEN REDUCTION OPTIMIZATION)
    // =========================================================================
    const userQueryLower = prompt.toLowerCase().trim();

    const isGreetingOnly = /^(halo|hai|hi|hey|assalamu'alaikum|assalamualaikum|ass|pagi|siang|malam|selamat pagi|selamat siang|selamat malam|terima kasih|makasih|syukron|matur nuwun|tes|test|ping|p)[\s.!,?]*$/i.test(prompt.trim());

    const isPronounIntent =
      isSayaSiapaQuery(prompt) ||
      isKamuSiapaQuery(prompt) ||
      isThirdPersonPronounQuery(prompt) ||
      detectDiaSiapaIntent(userQueryLower) ||
      userQueryLower.includes('halwa siapa') ||
      userQueryLower.includes('siapa halwa');

    const isKepanitiaanIntent =
      !!matchedPengasuh ||
      detectHubunganKepanitiaanIntent(prompt) ||
      detectInfoSeksiIntent(prompt) ||
      /\b(panitia|seksi|ketua|sekretaris|bendahara|kasi|wakasi|koor|pengasuh|pembimbing|pleno|gus|ning|ustadz|ustadzah|bapak|profil|tugas|jabatan|dewan)\b/i.test(prompt) ||
      /\bsiapa\b/i.test(prompt);

    const isKeuanganIntent =
      /\b(biaya|bayar|uang|saldo|transfer|rekening|anggaran|dana|donasi|subsidi|nominal|rupiah|pos|pengeluaran|pemasukan|bri)\b/i.test(prompt);

    const isAcaraJadwalIntent =
      /\b(acara|tanggal|jadwal|kapan|waktu|jam|lokasi|tempat|aula|muktamar|tiket|kartu|sambang|sambangan|gladi|kotor|bersih|rundown|tata tertib|tertib|aturan|larangan|syarat)\b/i.test(prompt);

    const isLiveGuestOrStatsIntent =
      isStatsQuery(prompt) ||
      detectRekapKehadiranIntent(prompt) ||
      /\b(tamu|undangan|santri|shohibul|hajat|kuota|kursi|statistik|kehadiran|hadir|datang|presensi|rekap|dobel|cekin|checkin|vvip|vip|ids|kehormatan|penguji|asatidz|perwakilan)\b/i.test(prompt);

    const isDocMediaIntent =
      /\b(gambar|foto|ilustrasi|link|tautan|website|download|unduh|pdf|word|docx|doc|excel|xlsx|xls|tabel|table|csv|file|berkas|ekspor)\b/i.test(prompt);

    const isTechIntent = isTechnicalInfrastructureQuery(prompt);

    // Bangun prompt secara modular sesuai konteks yang ditanyakan user
    const promptParts: string[] = [BASE_PERSONA_PROMPT];
    promptParts.push(sessionPromptDirective);

    if (isPronounIntent) {
      const pronounAngleTurn = pickNextVariationAngle();
      promptParts.push(KATA_GANTI_PROMPT);
      promptParts.push(`[SUDUT PANDANG VARIASI GILIRAN INI: "${pronounAngleTurn}". Pastikan susunan kalimat dan metafora segar dan berbeda dari sebelumnya.]`);
    }

    if (isKepanitiaanIntent) {
      promptParts.push(SECTION_KEPANITIAAN);
      promptParts.push(kepanitiaanTurnRule);
    }

    if (isKeuanganIntent) {
      promptParts.push(SECTION_KEUANGAN);
    }

    if (isAcaraJadwalIntent) {
      promptParts.push(SECTION_ACARA_JADWAL);
    }

    if (isDocMediaIntent) {
      promptParts.push(SECTION_MULTIMEDIA_DOC);
    }

    if (isTechIntent) {
      promptParts.push(TECHNICAL_KNOWLEDGE_SECTION);
    }

    // Live Supabase Context HANYA dimuat jika user bertanya tentang tamu/santri/kuota/kehadiran
    if (isLiveGuestOrStatsIntent) {
      const liveDataPrompt = await getLiveSupabaseGuestPrompt(prompt);
      if (liveDataPrompt) {
        promptParts.push(liveDataPrompt);
      }
    }

    // Fallback untuk pertanyaan umum yang tidak menyentuh kategori spesifik dan bukan sekadar sapaan
    if (
      !isGreetingOnly &&
      !isPronounIntent &&
      !isKepanitiaanIntent &&
      !isKeuanganIntent &&
      !isAcaraJadwalIntent &&
      !isLiveGuestOrStatsIntent &&
      !isDocMediaIntent &&
      !isTechIntent
    ) {
      promptParts.push(HAFLAH_KNOWLEDGE_SYSTEM_PROMPT);
    }

    const dynamicSystemPrompt = promptParts.join('\n\n');

    // 1. UTAMAKAN PEMANGGILAN AI (3-Tier Failover: Clouvia -> Vikey -> Gemini)
    try {
      const customModel = process.env.CLOUVIA_MODEL || 'deepseek-v4.1-flash';
      const customTimeout = 60000;
      // Output tokens: 1200 untuk chat biasa (hemat token), 2500 untuk dokumen/file
      const customMaxTokens = isDocMediaIntent ? 2500 : 1200;

      const aiResponse = await askAI(prompt, history, dynamicSystemPrompt, {
        model: customModel,
        timeout: customTimeout,
        maxTokens: customMaxTokens,
      });
      if (aiResponse && aiResponse.text && aiResponse.text.trim().length > 0) {
        const cleanReply = cleanReplyForSession(aiResponse.text, isFirstTurn, prompt);
        const expr = isSayaSiapaQuery(prompt) || isThirdPersonPronounQuery(prompt)
          ? 'happy'
          : isKamuSiapaQuery(prompt) || prompt.toLowerCase().includes('halwa siapa')
            ? 'wave'
            : detectExpression(cleanReply, prompt, isFirstTurn);
        const durationMs = Date.now() - startTime;

        let chartData: any = undefined;
        if (isChartRequested) {
          const stats = await getLiveAttendanceStatsChart();
          chartData = stats.chart;
        }

        return NextResponse.json({
          reply: cleanReply,
          expression: expr,
          avatar: `/images/avatar/ustadzah-avatar-${expr}.png`,
          source: 'ai_cloud_gateway',
          model: aiResponse.model,
          responseTimeMs: durationMs,
          ...(chartData ? { chart: chartData } : {}),
        });
      }
    } catch (aiError: any) {
      console.warn('[AI Ask Route] Seluruh tier AI gagal/offline. Berpindah ke Local Smart Fallback:', aiError.message || aiError);

      if (isTechnicalInfrastructureQuery(prompt)) {
        return NextResponse.json({
          reply: handleTechnicalInfrastructureQuery(prompt),
          expression: 'polite',
          avatar: '/images/avatar/ustadzah-avatar-polite.png',
          source: 'smart_knowledge_engine',
          model: 'Usth. Halwaa Architecture Engine',
          responseTimeMs: Date.now() - startTime,
        });
      }

      // Cadangan (Fallback Lokal) Kata Ganti — hanya dipakai saat seluruh AI gagal/timeout
      if (isSayaSiapaQuery(prompt)) {
        return NextResponse.json({
          reply: getRandomMotivasiPositifSaya(),
          expression: 'happy',
          avatar: '/images/avatar/ustadzah-avatar-happy.png',
          source: 'smart_knowledge_engine',
          model: 'Local Smart Assistant',
        });
      }
      if (isKamuSiapaQuery(prompt) || prompt.toLowerCase().includes('halwa siapa')) {
        return NextResponse.json({
          reply: getRandomPerkenalanDiri(),
          expression: 'wave',
          avatar: '/images/avatar/ustadzah-avatar-wave.png',
          source: 'smart_knowledge_engine',
          model: 'Local Smart Assistant',
        });
      }
      if (isThirdPersonPronounQuery(prompt)) {
        return NextResponse.json({
          reply: getRandomMotivasiSatirDia(),
          expression: 'happy',
          avatar: '/images/avatar/ustadzah-avatar-happy.png',
          source: 'smart_knowledge_engine',
          model: 'Local Smart Assistant',
        });
      }
    }

    // =========================================================================
    // FIX 2: LOGIKA FALLBACK BERURUTAN (JIKA AI GAGAL / OFFLINE)
    // =========================================================================

    // 0. Fallback Analisis Teknis & Infrastruktur Sistem
    if (isTechnicalInfrastructureQuery(prompt)) {
      const reply = handleTechnicalInfrastructureQuery(prompt);
      return NextResponse.json({
        reply,
        expression: 'polite',
        avatar: '/images/avatar/ustadzah-avatar-polite.png',
        source: 'smart_knowledge_engine',
        model: 'Usth. Halwaa Architecture Engine',
        responseTimeMs: Date.now() - startTime,
      });
    }

    // 1. Fallback Chart / Grafik Rekap Kehadiran
    if (isChartRequested) {
      const stats = await getLiveAttendanceStatsChart();
      const replyText = await getLiveRekapKehadiran(isFirstTurn);
      const cleanReply = cleanReplyForSession(replyText, isFirstTurn, prompt);
      const expr = detectExpression(cleanReply, prompt, isFirstTurn);
      return NextResponse.json({
        reply: cleanReply,
        expression: expr,
        avatar: `/images/avatar/ustadzah-avatar-${expr}.png`,
        source: 'supabase_live_stats',
        model: 'Local Smart Assistant',
        chart: stats.chart,
      });
    }

    // 2. Fallback Rekap Kehadiran & Daftar Tamu/Wali Hadir
    if (detectRekapKehadiranIntent(prompt)) {
      const replyText = await getLiveRekapKehadiran(isFirstTurn);
      const expr = detectExpression(replyText, prompt, isFirstTurn);
      return NextResponse.json({
        reply: replyText,
        expression: expr,
        avatar: `/images/avatar/ustadzah-avatar-${expr}.png`,
        source: 'supabase_live_stats',
        model: 'Local Smart Assistant',
      });
    }

    const qLower = prompt.toLowerCase();
    const hasPresenceOrRekapKeyword =
      qLower.includes('hadir') ||
      qLower.includes('datang') ||
      qLower.includes('tiba') ||
      qLower.includes('masuk') ||
      qLower.includes('presensi') ||
      qLower.includes('rekap');

    const isAskingWhoArrived =
      hasPresenceOrRekapKeyword &&
      (qLower.includes('tamu') ||
        qLower.includes('undangan') ||
        qLower.includes('masyayikh') ||
        qLower.includes('penguji') ||
        qLower.includes('vip')) &&
      !qLower.includes('wali') &&
      (qLower.includes('siapa') ||
        qLower.includes('siapakah') ||
        qLower.includes('daftar') ||
        qLower.includes('sebutkan') ||
        qLower.includes('mana') ||
        qLower.includes('rekap'));

    if (isAskingWhoArrived) {
      const arrivedGuestsReply = await getLiveArrivedGuestsResponse(prompt, isFirstTurn);
      if (arrivedGuestsReply) {
        const cleanReply = cleanReplyForSession(arrivedGuestsReply, isFirstTurn, prompt);
        const expr = detectExpression(cleanReply, prompt, isFirstTurn);
        return NextResponse.json({
          reply: cleanReply,
          expression: expr,
          avatar: `/images/avatar/ustadzah-avatar-${expr}.png`,
          source: 'supabase_live_query',
          model: 'Local Smart Assistant',
        });
      }
    }

    const isAskingWaliArrived =
      hasPresenceOrRekapKeyword &&
      (qLower.includes('wali') || qLower.includes('orang tua') || qLower.includes('pendamping')) &&
      (qLower.includes('siapa') ||
        qLower.includes('siapakah') ||
        qLower.includes('daftar') ||
        qLower.includes('sebutkan') ||
        qLower.includes('mana') ||
        qLower.includes('yang sudah hadir') ||
        qLower.includes('rekap'));

    if (isAskingWaliArrived) {
      const arrivedWaliReply = await getLiveArrivedWaliResponse(prompt, isFirstTurn);
      if (arrivedWaliReply) {
        const cleanReply = cleanReplyForSession(arrivedWaliReply, isFirstTurn, prompt);
        const expr = detectExpression(cleanReply, prompt, isFirstTurn);
        return NextResponse.json({
          reply: cleanReply,
          expression: expr,
          avatar: `/images/avatar/ustadzah-avatar-${expr}.png`,
          source: 'supabase_live_query',
          model: 'Local Smart Assistant',
        });
      }
    }

    // 3. Fallback Info Seksi
    if (detectInfoSeksiIntent(prompt)) {
      const replyText = handleInfoSeksiQuery(prompt, isFirstTurn);
      const expr = detectExpression(replyText, prompt, isFirstTurn);
      return NextResponse.json({
        reply: replyText,
        expression: expr,
        avatar: `/images/avatar/ustadzah-avatar-${expr}.png`,
        source: 'smart_knowledge_engine',
        model: 'Local Smart Assistant',
      });
    }

    // 4. Fallback Hubungan Kepanitiaan & Pronoun (Dia/Kamu/Saya)
    if (detectHubunganKepanitiaanIntent(prompt)) {
      const replyText = getHubunganKepanitiaanResponse(prompt, isFirstTurn);
      const expr = detectExpression(replyText, prompt, isFirstTurn);
      return NextResponse.json({
        reply: replyText,
        expression: expr,
        avatar: `/images/avatar/ustadzah-avatar-${expr}.png`,
        source: 'smart_knowledge_engine',
        model: 'Local Smart Assistant',
      });
    }

    // 5. Fallback Chamdan / No Rekening
    const chamdanReply = handleChamdanAndRekeningQuery(prompt, history);
    if (chamdanReply) {
      const cleanReply = cleanReplyForSession(chamdanReply, isFirstTurn, prompt);
      const expr = detectExpression(cleanReply, prompt, isFirstTurn);
      return NextResponse.json({
        reply: cleanReply,
        expression: expr,
        avatar: `/images/avatar/ustadzah-avatar-${expr}.png`,
        source: 'smart_knowledge_engine',
        model: 'Local Smart Assistant',
      });
    }

    // 6. Fallback Live Category & Wali Santri Queries
    const liveCatReply = await handleLiveCategoryNameQueries(prompt, isFirstTurn);
    if (liveCatReply) {
      const cleanReply = cleanReplyForSession(liveCatReply, isFirstTurn, prompt);
      const expr = detectExpression(cleanReply, prompt, isFirstTurn);
      return NextResponse.json({
        reply: cleanReply,
        expression: expr,
        avatar: `/images/avatar/ustadzah-avatar-${expr}.png`,
        source: 'supabase_live_query',
        model: 'Local Smart Assistant',
      });
    }

    const waliSantriReply = await handleWaliSantriQueries(prompt, isFirstTurn);
    if (waliSantriReply) {
      const cleanReply = cleanReplyForSession(waliSantriReply, isFirstTurn, prompt);
      const expr = detectExpression(cleanReply, prompt, isFirstTurn);
      return NextResponse.json({
        reply: cleanReply,
        expression: expr,
        avatar: `/images/avatar/ustadzah-avatar-${expr}.png`,
        source: 'supabase_live_query',
        model: 'Local Smart Assistant',
      });
    }

    // 7. Fallback Search Person in Supabase
    const personMatch = await searchPersonInSupabase(prompt);
    if (personMatch) {
      let detailText = '';
      if (personMatch.code === 'NOT_FOUND' || personMatch.extraInfo === 'DATA_NOT_FOUND') {
        detailText = `${isFirstTurn ? "Wa'alaikum Salam Wr. Wb.! 🙏✨\n\n" : ""}Maaf Us, data untuk **${personMatch.name}** belum tersedia di sistem. Mohon cek menu [Data Peserta & Tamu](/admin/peserta).`;
      } else if (personMatch.hasArrived) {
        const statusHadir = '✅ **HADIR**';
        if (personMatch.type === 'SANTRI') {
          detailText =
            `${isFirstTurn ? "Wa'alaikum Salam Wr. Wb.! 🙏✨\n\n" : ""}` +
            `Alhamdulillah Us, data peserta / wali santri **${personMatch.name}** (\`${personMatch.code}\`):\n\n` +
            `- **Nama Santri**: ${personMatch.name}\n` +
            `- **${personMatch.roleOrInstansi}**\n` +
            `- **Kategori**: ${personMatch.category} ${personMatch.subCategory ? '(' + personMatch.subCategory + ')' : ''}\n` +
            `- **Status Kehadiran**: ${statusHadir}\n` +
            `- **Kontak**: ${personMatch.phone || 'Tersedia di database'}\n` +
            `- **Alokasi Kuota**: ${personMatch.quotaTotal} Kursi (Terpakai: ${personMatch.quotaUsed})`;
        } else {
          detailText =
            `${isFirstTurn ? "Wa'alaikum Salam Wr. Wb.! 🙏✨\n\n" : ""}` +
            `Alhamdulillah Us, data tamu undangan **${personMatch.name}** (\`${personMatch.code}\`):\n\n` +
            `- **Nama Tamu**: ${personMatch.name}\n` +
            `- **Instansi / Alamat**: ${personMatch.roleOrInstansi}\n` +
            `- **Kategori**: ${personMatch.category}\n` +
            `- **Status Kehadiran**: ${statusHadir}\n` +
            `- **Kontak**: ${personMatch.phone || 'Tersedia di database'}\n` +
            `- **Jatah Kursi**: ${personMatch.quotaTotal} Orang (Terpakai: ${personMatch.quotaUsed})`;
        }
      } else {
        detailText = `${isFirstTurn ? "Wa'alaikum Salam Wr. Wb.! 🙏✨\n\n" : ""}Mohon maaf Us, sampai saat ini belum ada catatan kehadiran untuk **${personMatch.name}** (${personMatch.code}) di sistem presensi. Beliau mungkin belum datang atau belum di-absen oleh petugas gerbang.`;
      }

      const cleanReply = cleanReplyForSession(detailText, isFirstTurn, prompt);
      const expr = detectExpression(cleanReply, prompt, isFirstTurn);
      return NextResponse.json({
        reply: cleanReply,
        expression: expr,
        avatar: `/images/avatar/ustadzah-avatar-${expr}.png`,
        source: 'supabase_live_query',
        model: 'Local Smart Assistant',
      });
    }

    // 8. Fallback Terakhir: generateLocalSmartResponseAsync
    const localSmartResult = await generateLocalSmartResponseAsync(prompt, isFirstTurn, currentRole);
    const cleanReply = cleanReplyForSession(localSmartResult, isFirstTurn, prompt);
    const expr = detectExpression(cleanReply, prompt, isFirstTurn);
    return NextResponse.json({
      reply: cleanReply,
      expression: expr,
      avatar: `/images/avatar/ustadzah-avatar-${expr}.png`,
      source: 'smart_knowledge_engine',
      model: 'Local Smart Assistant',
    });
  } catch (error: any) {
    console.error('Error in /api/ai/ask:', error);
    return NextResponse.json(
      {
        error: error.message || 'Internal Server Error',
        reply: "Afwan Us, terjadi kendala saat memproses jawaban. Silakan ajukan pertanyaan kembali ya. 🙏",
        expression: 'thinking',
        avatar: '/images/avatar/ustadzah-avatar-thinking.png',
        model: 'Local Smart Assistant',
      },
      { status: 500 }
    );
  }
}
