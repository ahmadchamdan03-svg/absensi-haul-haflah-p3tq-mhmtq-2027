import { NextRequest, NextResponse } from 'next/server';
import { askAI } from '@/lib/ai-router';
import {
  detectMotivasiIntent,
  detectDiaSiapaIntent,
  isKamuSiapaQuery,
  isSayaSiapaQuery,
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
      ? "\n\n[PANDUAN SESI: Ini adalah awal sesi obrolan. Jawab salam dengan \"Wa'alaikum Salam Wr. Wb.\". PENTING: Acara ini adalah \"Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.\", BUKAN acara Ponpes Lirboyo Pusat! DILARANG menyebut \"Haul & Haflah di Pondok Pesantren Lirboyo\". Jika menawarkan bantuan atau menyapa, gunakan \"Ada lagi info kepanitiaan yang bisa saya bantu, Us?\".]"
      : "\n\n[PANDUAN SESI: Ini adalah percakapan lanjutan dalam sesi chat yang sedang berlangsung. PENTING: DILARANG MENJAWAB ATAU MENGULANG SALAM (\"Wa'alaikum Salam Wr. Wb.\" ataupun \"Assalamu'alaikum\"). Langsung jawab ke inti pertanyaan secara to-the-point dan santun. Sapa pengguna dengan \"Usth.\", bukan \"Kang\" atau \"Mbak\". Jika menawarkan bantuan, gunakan \"Ada lagi info kepanitiaan yang bisa saya bantu, Us?\".]";

    const liveDataPrompt = await getLiveSupabaseGuestPrompt(prompt);
    const dynamicSystemPrompt = `${HAFLAH_KNOWLEDGE_SYSTEM_PROMPT}\n\n${liveDataPrompt}${sessionPromptDirective}

[PANDUAN KEPANITIAAN & DATA RESMI: Jika user menanyakan tentang personil panitia, format WAJIB 3 paragraf: Paragraf 1 (jabatan), Paragraf 2 (kalimat sanjungan/fans), Paragraf 3 ("Ada lagi info kepanitiaan yang bisa saya bantu, Us?"). DILARANG MENYEUTKAN SALDO AKHIR Rp 1.102.000 (Jawab: Saldo ini masih bersifat anggaran (perencanaan), bukan realisasi. Untuk laporan realisasi final, silakan tunggu LPJ resmi panitia). Total SH dan total Tamu Undangan selalu di-query LIVE dari Supabase. Selalu sebut 'Anggaran [pemasukan/pengeluaran]' dengan disclaimer '(masih perencanaan, bukan realisasi)'.]`;

    // 1. UTAMAKAN PEMANGGILAN AI (3-Tier Failover: Clouvia -> Vikey -> Gemini)
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

    // 2. Fallback Rekap Kehadiran
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

    // 6. Fallback Live Category & Arrived Guests
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
