import { NextRequest, NextResponse } from 'next/server';
import { askAI } from '@/lib/ai-router';
import { getRandomMotivasiPrompt, FALLBACK_MOTIVASI } from '@/lib/motivasi/prompt-templates';

export const maxDuration = 20;

export async function POST(req: NextRequest) {
  try {
    let konteks = 'Haflah P3TQ & MHMTQ';
    try {
      const body = await req.json();
      if (body?.konteks && typeof body.konteks === 'string') {
        konteks = body.konteks.replace(/\b(dokumen|pdf|laporan|file|word|excel|docx|xlsx)\b/gi, '').trim() || 'Haflah P3TQ & MHMTQ';
      }
    } catch {
      // Body opsional / kosong
    }

    const prompt = getRandomMotivasiPrompt(konteks);
    const systemInstruction =
      'Anda adalah Usth. Halwaa, asisten cerdas resmi Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M. ' +
      'Tugas Anda adalah menuliskan TEPAT SATU PARAGRAF motivasi islami yang indah, santun, dan menyentuh hati (terdiri dari 3-4 kalimat). ' +
      'DILARANG keras menuliskan salam pembuka (Assalamu\'alaikum), salam penutup, judul, format bullet points, nomor, atau tanda petik di awal/akhir paragraf. ' +
      'DILARANG keras menyebutkan kata "PDF", "Dokumen", atau "Laporan". Cukup sebut acara atau kegiatan secara umum (misal: Haflah P3TQ). ' +
      'Langsung tuliskan isi paragraf motivasi saja secara mengalir.';

    const aiResponse = await askAI(prompt, [], systemInstruction, {
      model: process.env.CLOUVIA_MODEL || 'gemini-2.5-flash',
      timeout: 10000,
    });

    const rawText = aiResponse?.text?.trim() || '';
    // Bersihkan dari kutipan pembungkus jika ada dan sanitasi kata file/dokumen
    const cleanParagraf = rawText
      .replace(/^["'“”«»]+|["'“”«»]+$/g, '')
      .replace(/^###.*?\n+/g, '')
      .replace(/\n\n+/g, ' ')
      .replace(/\b(?:dokumen\s+pdf|file\s+pdf|dokumen\s+ini|laporan\s+ini)\b/gi, 'kegiatan ini')
      .replace(/\b(?:dokumen|pdf|laporan)\b/gi, 'kegiatan')
      .trim();

    if (cleanParagraf && cleanParagraf.length > 30) {
      return NextResponse.json({
        sukses: true,
        paragraf: cleanParagraf,
        model: aiResponse.model,
      });
    }

    return NextResponse.json({
      sukses: true,
      paragraf: FALLBACK_MOTIVASI,
      model: 'Fallback',
    });
  } catch (error: any) {
    console.warn('[api/motivasi-fresh] Gagal menghasilkan motivasi dinamis, beralih ke fallback:', error?.message || error);
    return NextResponse.json({
      sukses: true,
      paragraf: FALLBACK_MOTIVASI,
      model: 'Fallback',
    });
  }
}
