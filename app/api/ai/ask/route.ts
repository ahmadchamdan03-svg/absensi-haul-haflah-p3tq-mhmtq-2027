import { NextRequest, NextResponse } from 'next/server';
import { askAI } from '@/lib/ai-router';
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
  HAFLAH_KNOWLEDGE_SYSTEM_PROMPT,
  generateLocalSmartResponseAsync,
  cleanReplyForSession,
  detectExpression,
} from '@/lib/halwaa/knowledge-base';
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
} from '@/lib/halwaa/live-context';
import { searchPersonInSupabase } from '@/lib/halwaa/search-person';

// 3-Tier failover worst-case: 3 × 15 dtk = 45 dtk (+ query Supabase).
// Beri ruang 60 dtk agar fungsi Vercel tidak diputus sebelum fallback selesai.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const { prompt, history, role, userRole } = body;
    const currentRole = role || userRole || 'WALI';

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const userMessageCount = Array.isArray(history)
      ? history.filter((item: any) => item.role === 'user').length
      : 0;
    const isFirstTurn = userMessageCount === 0;

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
      ? "\n\n[PANDUAN SESI: Ini adalah awal sesi obrolan. Jika pengguna mengucapkan salam, jawab dengan \"Wa'alaikum Salam Wr. Wb.\" (khusus pertanyaan profil personil panitia 'siapa [nama]', langsung mulai dari Paragraf 1 dengan **Nama Lengkap** tanpa membuat paragraf salam terpisah agar jumlah paragraf tepat 4). PENTING: Acara ini adalah \"Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.\", BUKAN acara Ponpes Lirboyo Pusat! DILARANG menyebut \"Haul & Haflah di Pondok Pesantren Lirboyo\". Jika menawarkan bantuan atau menyapa, gunakan \"Ada lagi info kepanitiaan yang bisa saya bantu, Us?\".]"
      : "\n\n[PANDUAN SESI: Ini adalah percakapan lanjutan dalam sesi chat yang sedang berlangsung. PENTING: DILARANG MENJAWAB ATAU MENGULANG SALAM (\"Wa'alaikum Salam Wr. Wb.\" ataupun \"Assalamu'alaikum\"). Langsung jawab ke inti pertanyaan secara to-the-point dan santun. Sapa pengguna dengan \"Usth.\", bukan \"Kang\" atau \"Mbak\". Jika menawarkan bantuan, gunakan \"Ada lagi info kepanitiaan yang bisa saya bantu, Us?\".]";

    // =========================================================================
    // INTERCEPTOR LOKAL KATA GANTI (SEBELUM MEMANGGIL AI CLOUD)
    // =========================================================================
    // 1. Cek Saya Siapa (Motivasi Positif — 2 Paragraf)
    if (isSayaSiapaQuery(prompt)) {
      return NextResponse.json({
        reply: getRandomMotivasiPositifSaya(),
        expression: 'happy',
        avatar: '/images/avatar/ustadzah-avatar-happy.png',
        source: 'smart_knowledge_engine',
        model: 'Local Motivasi Engine',
      });
    }

    // 2. Cek Kamu Siapa (Perkenalan Diri)
    if (isKamuSiapaQuery(prompt) || prompt.toLowerCase().includes('halwa siapa')) {
      return NextResponse.json({
        reply: getRandomPerkenalanDiri(),
        expression: 'wave',
        avatar: '/images/avatar/ustadzah-avatar-wave.png',
        source: 'smart_knowledge_engine',
        model: 'Local Perkenalan Engine',
      });
    }

    // 3. Cek Dia Siapa (Motivasi Satir — 1 Paragraf)
    if (isThirdPersonPronounQuery(prompt)) {
      return NextResponse.json({
        reply: getRandomMotivasiSatirDia(),
        expression: 'happy',
        avatar: '/images/avatar/ustadzah-avatar-happy.png',
        source: 'smart_knowledge_engine',
        model: 'Local Satir Engine',
      });
    }

    const liveDataPrompt = await getLiveSupabaseGuestPrompt(prompt);
    const randomPujianTurn = getRandomPujian();
    const randomPengandaianTurn = getRandomPengandaian();
    const dynamicSystemPrompt = `${HAFLAH_KNOWLEDGE_SYSTEM_PROMPT}\n\n${liveDataPrompt}${sessionPromptDirective}

[PANDUAN KEPANITIAAN & DATA RESMI:
1. Jika user menanyakan profil/identitas seorang personil panitia (misal "siapa asep", "siapa revi", "[nama] siapa") — selain aturan bercanda khusus Ahmad Chamdan dan klarifikasi nama ganda — format jawaban WAJIB TEPAT 4 PARAGRAF yang dipisahkan dengan \\n\\n (DILARANG 3 paragraf, dan DILARANG menyalin kalimat pujian/pengandaian dari riwayat chat sebelumnya):
   - Paragraf 1: Jabatan dan tugas resmi di kepanitiaan (WAJIB awali dengan **Nama Lengkap** di-bold, lalu sebutkan peran Anda sebagai asisten cerdas pendukung sistem).
   - Paragraf 2 (WAJIB gunakan kalimat pujian acak giliran ini): "${randomPujianTurn}" (kutip kalimat ini; hanya jika bidang tugas personil tersebut bukan administrasi/kesekretariatan, sesuaikan istilah bidangnya saja dengan seksi personil tersebut tanpa mengubah gaya kalimatnya).
   - Paragraf 3 (WAJIB gunakan kalimat pengandaian/fans acak giliran ini): "${randomPengandaianTurn}"
   - Paragraf 4 (Penutup Wajib): "Ada lagi info kepanitiaan yang bisa saya bantu, Us?"
2. DILARANG MENYEBUTKAN SALDO AKHIR Rp 1.102.000 (Jawab: Saldo ini masih bersifat anggaran (perencanaan), bukan realisasi. Untuk laporan realisasi final, silakan tunggu LPJ resmi panitia). Total SH dan total Tamu Undangan selalu di-query LIVE dari Supabase. Selalu sebut 'Anggaran [pemasukan/pengeluaran]' dengan disclaimer '(masih perencanaan, bukan realisasi)'.]`;

    // 4. UTAMAKAN PEMANGGILAN AI UNTUK PERTANYAAN LAINNYA (3-Tier Failover: Clouvia -> Vikey -> Gemini)
    try {
      const aiResponse = await askAI(prompt, history, dynamicSystemPrompt);
      if (aiResponse && aiResponse.text && aiResponse.text.trim().length > 0) {
        const cleanReply = cleanReplyForSession(aiResponse.text, isFirstTurn, prompt);
        const expr = detectExpression(cleanReply, prompt, isFirstTurn);
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
    }

    // =========================================================================
    // FIX 2: LOGIKA FALLBACK BERURUTAN (JIKA AI GAGAL / OFFLINE)
    // =========================================================================

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
