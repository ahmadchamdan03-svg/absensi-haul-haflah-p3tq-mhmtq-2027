import { NextRequest, NextResponse } from 'next/server';
import { aiClient, getAiClient } from '@/lib/ai-client';
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
    const { prompt, history, apiKey: clientApiKey, role, userRole } = body;
    const currentRole = role || userRole || 'WALI';

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const userMessageCount = Array.isArray(history)
      ? history.filter((item: any) => item.role === 'user').length
      : 0;
    const isFirstTurn = userMessageCount === 0;

    const chamdanReply = handleChamdanAndRekeningQuery(prompt, history);
    if (chamdanReply) {
      const cleanReply = cleanReplyForSession(chamdanReply, isFirstTurn, prompt);
      const expr = detectExpression(cleanReply, prompt, isFirstTurn);
      return NextResponse.json({
        reply: cleanReply,
        expression: expr,
        avatar: `/images/avatar/ustadzah-avatar-${expr}.png`,
        source: 'smart_knowledge_engine',
        model: 'Usth. Halwaa Knowledge Engine',
      });
    }

    // 0. FITUR REKAP KEHADIRAN REALTIME
    const isChartRequested =
      prompt.toLowerCase().includes('grafik') ||
      prompt.toLowerCase().includes('chart') ||
      prompt.toLowerCase().includes('diagram') ||
      prompt.toLowerCase().includes('visualisasi') ||
      prompt.toLowerCase().includes('donut') ||
      prompt.toLowerCase().includes('pie');

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
        model: 'Usth. Halwaa Live Attendance Recap Engine',
        chart: stats.chart,
      });
    }

    if (detectRekapKehadiranIntent(prompt)) {
      const replyText = await getLiveRekapKehadiran(isFirstTurn);
      const expr = detectExpression(replyText, prompt, isFirstTurn);
      return NextResponse.json({
        reply: replyText,
        expression: expr,
        avatar: `/images/avatar/ustadzah-avatar-${expr}.png`,
        source: 'supabase_live_stats',
        model: 'Usth. Halwaa Live Attendance Recap Engine',
      });
    }

    // FITUR INFO BAGAN / SEKSI KEPANITIAAN
    if (detectInfoSeksiIntent(prompt)) {
      const replyText = handleInfoSeksiQuery(prompt, isFirstTurn);
      const expr = detectExpression(replyText, prompt, isFirstTurn);
      return NextResponse.json({
        reply: replyText,
        expression: expr,
        avatar: `/images/avatar/ustadzah-avatar-${expr}.png`,
        source: 'smart_knowledge_engine',
        model: 'Usth. Halwaa Committee Section Engine',
      });
    }

    if (detectHubunganKepanitiaanIntent(prompt, history)) {
      const replyText = getHubunganKepanitiaanResponse(prompt, isFirstTurn, history);
      const isVerbatim = isThirdPersonPronounQuery(prompt) || isKamuSiapaQuery(prompt) || isSayaSiapaQuery(prompt);
      let cleanReply = replyText;
      if (!isVerbatim && !replyText.includes('Ada lagi info kepanitiaan yang bisa saya bantu, Us?')) {
        cleanReply = cleanReplyForSession(replyText, isFirstTurn, prompt);
      }
      cleanReply = cleanReply
        .replace(/Wonten ingkang saget dibantu malih[,.\s]*Us\?/gi, 'Ada lagi info kepanitiaan yang bisa saya bantu, Us?')
        .replace(/Wonten ingkang saget dibantu[,.\s]*Us\?/gi, 'Ada lagi info kepanitiaan yang bisa saya bantu, Us?');

      const expr = detectExpression(cleanReply, prompt, isFirstTurn);
      return NextResponse.json({
        reply: cleanReply,
        expression: expr,
        avatar: `/images/avatar/ustadzah-avatar-${expr}.png`,
        source: 'smart_knowledge_engine',
        model: 'Usth. Halwaa Committee Assistant Engine',
      });
    }

    const qLower = prompt.trim().toLowerCase().replace(/[.!?,]/g, '');
    const isMotivasiIntentPrompt = Boolean(detectMotivasiIntent(qLower)) || Boolean(detectDiaSiapaIntent(qLower));
    const isGreetingPrompt =
      isMotivasiIntentPrompt ||
      qLower === "assalamu'alaikum" ||
      qLower === "assalamu'alaikum us" ||
      qLower === 'assalamualaikum' ||
      qLower === 'assalamualaikum us' ||
      qLower === 'halo' ||
      qLower === 'halo us' ||
      qLower === 'hai' ||
      qLower === 'hai us' ||
      qLower === 'p' ||
      qLower === 'tes' ||
      qLower.includes('siapa kamu') ||
      qLower.includes('kamu siapa') ||
      qLower.includes('siapa anda') ||
      qLower.includes('kamu ai apa') ||
      qLower.includes('kamu itu apa') ||
      qLower.includes('siapa yang buat kamu') ||
      qLower.includes('kamu bisa apa') ||
      qLower.includes('siapa halwaa') ||
      qLower.includes('siapa usth halwaa') ||
      qLower.includes('terima kasih') ||
      qLower.includes('makasih');

    if (isStatsQuery(prompt)) {
      const stats = await getLiveAttendanceStatsChart();
      const now = new Date();
      const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });
      const nowStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
      const { textSummary: ts } = stats;
      const replyText = `${isFirstTurn ? "Wa'alaikum Salam Wr. Wb.! 🙏✨\n\n" : ""}Alhamdulillah Us, per ${dateStr} pukul ${nowStr} WIB, statistik kehadiran Haul & Haflah 2027:

*WALI SANTRI*
• Hadir: ${ts.totalWaliHadir.toLocaleString('id-ID')} dari ${ts.totalWaliKuota.toLocaleString('id-ID')} kuota (${ts.percentWaliRatio}%)
• Laki-laki: ${ts.waliL.toLocaleString('id-ID')} | Perempuan: ${ts.waliP.toLocaleString('id-ID')}
• Belum hadir: ${ts.waliBelum.toLocaleString('id-ID')} kursi

*TAMU UNDANGAN*
• Hadir: ${ts.totalTamuHadir.toLocaleString('id-ID')} dari ${ts.totalTamuKuota.toLocaleString('id-ID')} kuota (${ts.percentTamuRatio}%)
• Laki-laki: ${ts.tamuL.toLocaleString('id-ID')} | Perempuan: ${ts.tamuP.toLocaleString('id-ID')}
• Belum hadir: ${ts.tamuBelum.toLocaleString('id-ID')} kursi

Total yang sudah hadir: **${ts.totalHadir.toLocaleString('id-ID')} orang** dari **${ts.totalKuota.toLocaleString('id-ID')} kuota** (${ts.percentHadirTotal}%). Semoga acara berjalan lancar hingga selesai.

[👉 Buka Live Dasbor](/admin/dasbor) · [👉 Data Peserta & Tamu](/admin/peserta)`;

      return NextResponse.json({
        reply: cleanReplyForSession(replyText, isFirstTurn, prompt),
        expression: 'happy',
        avatar: '/images/avatar/ustadzah-avatar-happy.png',
        source: 'supabase_live_stats',
        model: 'Usth. Halwaa Live Stats Engine',
        chart: stats.chart,
      });
    }

    const isAskingWhoArrived =
      (qLower.includes('tamu') || qLower.includes('undangan') || qLower.includes('masyayikh') || qLower.includes('penguji') || qLower.includes('vip')) &&
      !qLower.includes('wali') &&
      (qLower.includes('siapa') || qLower.includes('siapakah') || qLower.includes('daftar') || qLower.includes('sebutkan') || qLower.includes('mana') || qLower.includes('siapa saja')) &&
      (qLower.includes('hadir') || qLower.includes('datang') || qLower.includes('tiba') || qLower.includes('masuk') || qLower.includes('presensi'));

    if (isAskingWhoArrived) {
      const replyText = await getLiveArrivedGuestsResponse(prompt, isFirstTurn);
      const cleanReply = cleanReplyForSession(replyText, isFirstTurn, prompt);
      const expr = detectExpression(cleanReply, prompt, isFirstTurn);
      return NextResponse.json({
        reply: cleanReply,
        expression: expr,
        avatar: `/images/avatar/ustadzah-avatar-${expr}.png`,
        source: 'supabase_live_query',
        model: 'Usth. Halwaa Live Database Engine',
      });
    }

    const isAskingWaliArrived =
      (qLower.includes('wali') || qLower.includes('orang tua') || qLower.includes('pendamping')) &&
      (qLower.includes('siapa') || qLower.includes('siapakah') || qLower.includes('daftar') || qLower.includes('sebutkan') || qLower.includes('mana') || qLower.includes('siapa saja') || qLower.includes('yang sudah hadir')) &&
      (qLower.includes('hadir') || qLower.includes('datang') || qLower.includes('tiba') || qLower.includes('masuk') || qLower.includes('presensi'));

    const waliQueryReply = await handleWaliSantriQueries(prompt, isFirstTurn);
    if (waliQueryReply) {
      const cleanReply = cleanReplyForSession(waliQueryReply, isFirstTurn, prompt);
      const expr = detectExpression(cleanReply, prompt, isFirstTurn);
      return NextResponse.json({
        reply: cleanReply,
        expression: expr,
        avatar: `/images/avatar/ustadzah-avatar-${expr}.png`,
        source: 'supabase_live_query',
        model: 'Usth. Halwaa Live Database Engine',
      });
    }

    const categoryNameReply = await handleLiveCategoryNameQueries(prompt, isFirstTurn);
    if (categoryNameReply) {
      const cleanReply = cleanReplyForSession(categoryNameReply, isFirstTurn, prompt);
      const expr = detectExpression(cleanReply, prompt, isFirstTurn);
      return NextResponse.json({
        reply: cleanReply,
        expression: expr,
        avatar: `/images/avatar/ustadzah-avatar-${expr}.png`,
        source: 'supabase_live_query',
        model: 'Usth. Halwaa Live Database Engine',
      });
    }

    if (isAskingWaliArrived) {
      const replyText = await getLiveArrivedWaliResponse(prompt, isFirstTurn);
      const cleanReply = cleanReplyForSession(replyText, isFirstTurn, prompt);
      const expr = detectExpression(cleanReply, prompt, isFirstTurn);
      return NextResponse.json({
        reply: cleanReply,
        expression: expr,
        avatar: `/images/avatar/ustadzah-avatar-${expr}.png`,
        source: 'supabase_live_query',
        model: 'Usth. Halwaa Live Database Engine',
      });
    }

    const personMatch = await searchPersonInSupabase(prompt);
    if (personMatch) {
      let detailText = '';
      if (personMatch.code === 'NOT_FOUND' || personMatch.extraInfo === 'DATA_NOT_FOUND') {
        detailText = `${isFirstTurn ? "Wa'alaikum Salam Wr. Wb.! 🙏✨\n\n" : ""}Maaf Us, data untuk **${personMatch.name}** belum tersedia di sistem. Mohon cek menu [Data Peserta & Tamu](/admin/peserta).`;
      } else if (personMatch.hasArrived) {
        if (personMatch.type === 'SANTRI') {
          const statusHadir = personMatch.hasArrived ? '✅ **HADIR**' : '⏳ Belum Presensi';
          detailText = `${isFirstTurn ? "Wa'alaikum Salam Wr. Wb.! 🙏✨\n\n" : ""}Alhamdulillah Us, data peserta / wali santri **${personMatch.name}** (\`${personMatch.code}\`):\n\n` +
            `- **Nama Santri**: ${personMatch.name}\n` +
            `- **${personMatch.roleOrInstansi}**\n` +
            `- **Kategori**: ${personMatch.category}\n` +
            `- **Status Kehadiran**: ${statusHadir}\n` +
            `- **Kontak / HP**: ${personMatch.phone || 'Tersedia di database'}\n` +
            `${personMatch.extraInfo ? '- **Keterangan**: ' + personMatch.extraInfo : ''}`;
        } else {
          const statusHadir = personMatch.hasArrived ? '✅ **HADIR**' : '⏳ Belum Presensi';
          detailText = `${isFirstTurn ? "Wa'alaikum Salam Wr. Wb.! 🙏✨\n\n" : ""}Alhamdulillah Us, data **${personMatch.name}** (\`${personMatch.code}\`):\n\n` +
            `- **Nama Tamu**: ${personMatch.name}\n` +
            `- **Instansi / Alamat**: ${personMatch.roleOrInstansi}\n` +
            `- **Kategori**: ${personMatch.category}\n` +
            `- **Status Kehadiran**: ${statusHadir}\n` +
            `- **Kontak / HP**: ${personMatch.phone || 'Tersedia di database'}\n` +
            `${personMatch.extraInfo ? '- **Keterangan**: ' + personMatch.extraInfo : ''}`;
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
        model: 'Usth. Halwaa Live Database Engine',
      });
    }

    const localSmartResult = await generateLocalSmartResponseAsync(prompt, isFirstTurn, currentRole);
    const isGenericFallback = localSmartResult.includes('Wonten ingkang saget dibantu Us? Silakan sampaikan pertanyaan seputar pelaksanaan Haul & Haflah');

    if (!isGenericFallback || isGreetingPrompt) {
      const cleanReply = cleanReplyForSession(localSmartResult, isFirstTurn, prompt);
      const expr = detectExpression(cleanReply, prompt, isFirstTurn);
      return NextResponse.json({
        reply: cleanReply,
        expression: expr,
        avatar: `/images/avatar/ustadzah-avatar-${expr}.png`,
        source: 'smart_knowledge_engine',
        model: isGreetingPrompt ? 'Usth. Halwaa Fast Response' : 'Usth. Halwaa Knowledge Engine (Realtime)',
      });
    }

    const sessionPromptDirective = isFirstTurn
      ? "\n\n[PANDUAN SESI: Ini adalah awal sesi obrolan. Jawab salam dengan \"Wa'alaikum Salam Wr. Wb.\". PENTING: Acara ini adalah \"Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.\", BUKAN acara Ponpes Lirboyo Pusat! DILARANG menyebut \"Haul & Haflah di Pondok Pesantren Lirboyo\". Jika menawarkan bantuan atau menyapa, gunakan \"Ada lagi info kepanitiaan yang bisa saya bantu, Us?\".]"
      : "\n\n[PANDUAN SESI: Ini adalah percakapan lanjutan dalam sesi chat yang sedang berlangsung. PENTING: DILARANG MENJAWAB ATAU MENGULANG SALAM (\"Wa'alaikum Salam Wr. Wb.\" ataupun \"Assalamu'alaikum\"). Langsung jawab ke inti pertanyaan secara to-the-point dan santun. Sapa pengguna dengan \"Usth.\", bukan \"Kang\" atau \"Mbak\". Jika menawarkan bantuan, gunakan \"Ada lagi info kepanitiaan yang bisa saya bantu, Us?\".]";

    const liveDataPrompt = await getLiveSupabaseGuestPrompt(prompt);
    const dynamicSystemPrompt = `${HAFLAH_KNOWLEDGE_SYSTEM_PROMPT}\n\n${liveDataPrompt}${sessionPromptDirective}

[PANDUAN KEPANITIAAN & DATA RESMI: Jika user menanyakan tentang personil panitia, format WAJIB 3 paragraf: Paragraf 1 (jabatan), Paragraf 2 (kalimat sanjungan/fans), Paragraf 3 ("Ada lagi info kepanitiaan yang bisa saya bantu, Us?"). DILARANG MENYEUTKAN SALDO AKHIR Rp 1.102.000 (Jawab: Saldo ini masih bersifat anggaran (perencanaan), bukan realisasi. Untuk laporan realisasi final, silakan tunggu LPJ resmi panitia). Total SH dan total Tamu Undangan selalu di-query LIVE dari Supabase. Selalu sebut 'Anggaran [pemasukan/pengeluaran]' dengan disclaimer '(masih perencanaan, bukan realisasi)'.]`;

    const client = clientApiKey ? getAiClient(clientApiKey) : aiClient;
    const modelName = process.env.AI_GATEWAY_MODEL || 'gpt-4o-mini';

    try {
      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: dynamicSystemPrompt },
      ];

      if (Array.isArray(history) && history.length > 0) {
        for (const item of history.slice(-6)) {
          if (item && item.content) {
            messages.push({
              role: item.role === 'assistant' ? 'assistant' : 'user',
              content: String(item.content),
            });
          }
        }
      }

      messages.push({
        role: 'user',
        content: prompt,
      });

      const response = await client.chat.completions.create({
        model: modelName,
        messages,
        temperature: 0.35,
        max_tokens: 800,
      });

      const replyText = response.choices?.[0]?.message?.content;
      if (replyText && replyText.trim().length > 0) {
        const cleanReply = cleanReplyForSession(replyText, isFirstTurn, prompt);
        const expr = detectExpression(cleanReply, prompt, isFirstTurn);
        const durationMs = Date.now() - startTime;

        return NextResponse.json({
          reply: cleanReply,
          expression: expr,
          avatar: `/images/avatar/ustadzah-avatar-${expr}.png`,
          source: 'vikey_cloud_api',
          model: `Vikey (${modelName})`,
          responseTimeMs: durationMs,
        });
      }
    } catch (apiError: any) {
      console.warn('[Vikey Cloud AI] Failed to fetch completion from Vikey API, falling back to local engine:', apiError?.message || apiError);
    }

    const localReply = await generateLocalSmartResponseAsync(prompt, isFirstTurn, currentRole);
    const cleanReply = cleanReplyForSession(localReply, isFirstTurn, prompt);
    const expr = detectExpression(cleanReply, prompt, isFirstTurn);
    return NextResponse.json({
      reply: cleanReply,
      expression: expr,
      avatar: `/images/avatar/ustadzah-avatar-${expr}.png`,
      source: 'smart_knowledge_engine',
      model: 'Usth. Halwaa Knowledge Engine (Fallback)',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const baseURL = process.env.AI_GATEWAY_BASE_URL || 'https://api.vikey.ai/v1';
  const model = process.env.AI_GATEWAY_MODEL || 'gpt-4o-mini';
  const hasKey = Boolean(process.env.AI_GATEWAY_API_KEY || 'vk-2e03aab0-64d7-4069-869c-d706172c2232');

  return NextResponse.json({
    status: 'ok',
    engine: 'Vikey Cloud OpenAI Compatible API',
    gateway: {
      baseURL,
      model,
      hasKey,
    },
  });
}
