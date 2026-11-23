import { NextRequest, NextResponse } from 'next/server';
import { sendFonnteServerMessage } from '@/lib/whatsapp';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      target,
      message,
      delay,
      typing,
      tipe_pesan,
      nama_santri,
      kode,
      id,
      mark_reminder_sent,
    } = body;

    // Jika tipe_pesan === 'PENGINAPAN' dan message kosong, buat pesan penginapan otomatis
    let finalMessage = message;
    if (tipe_pesan === 'PENGINAPAN' && !finalMessage) {
      const nama = (nama_santri || body.nama || 'Santri').trim();
      finalMessage = `Kepada Yth. Bapak/Ibu Wali Santri *${nama}*\n\nMenjelang pelaksanaan Haul & Haflah Akhirussanah P3TQ & MHMTQ, bagi Bapak/Ibu Wali Santri yang membutuhkan penginapan, harap segera menghubungi panitia.\n\nTerima kasih atas perhatiannya. Wassalamu'alaikum Wr. Wb.\n\nJazakumullahu khairan katsiran.\nPanitia Haul & Haflah P3TQ dan MHMTQ 2027`;
    }

    if (!target || !finalMessage) {
      return NextResponse.json(
        { ok: false, message: 'Nomor tujuan (target) dan pesan wajib diisi.' },
        { status: 400 }
      );
    }

    const sendResult = await sendFonnteServerMessage({
      target,
      message: finalMessage,
      delay,
      typing: typing !== false,
    });

    if (!sendResult.data && !sendResult.ok) {
      return NextResponse.json(
        { ok: false, message: sendResult.reason || 'Nomor tujuan atau isi pesan tidak valid.' },
        { status: 400 }
      );
    }

    let waReminderSentAt: string | null = null;
    const isTamuCode = String(kode || '').trim().toUpperCase().startsWith('UND');
    if (sendResult.ok && mark_reminder_sent === true && !isTamuCode && (id || kode)) {
      const sentAtIso = new Date().toISOString();
      try {
        let query = supabaseServer
          .from('peserta_santri')
          .update({
            wa_reminder_sent_at: sentAtIso,
            updated_at: sentAtIso,
          });
        query = id ? query.eq('id', id) : query.eq('kode', String(kode).trim());
        const { error: updateErr } = await query;
        if (!updateErr) {
          waReminderSentAt = sentAtIso;
        } else {
          console.error('Error updating wa_reminder_sent_at:', updateErr);
        }
      } catch (dbErr) {
        console.error('Exception updating wa_reminder_sent_at:', dbErr);
      }
    }

    return NextResponse.json({
      ok: sendResult.ok,
      data: sendResult.data,
      ...(waReminderSentAt ? { wa_reminder_sent_at: waReminderSentAt } : {}),
    });
  } catch (error: any) {
    console.error('Error sending WhatsApp via Fonnte:', error);
    return NextResponse.json(
      { ok: false, message: error.message || 'Terjadi kesalahan pada gateway WhatsApp' },
      { status: 500 }
    );
  }
}
