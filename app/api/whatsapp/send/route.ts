import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { target, message, delay, tipe_pesan, nama_santri } = body;

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

    const token = process.env.FONNTE_TOKEN || 'qUYeuFbxZZPoTT6cniAj';

    // Bersihkan nomor target
    let cleanTarget = target.replace(/[^0-9]/g, '');
    if (cleanTarget.startsWith('0')) {
      cleanTarget = '62' + cleanTarget.slice(1);
    }

    const formData = new FormData();
    formData.append('target', cleanTarget);
    formData.append('message', finalMessage);
    if (delay) {
      formData.append('delay', String(delay));
    }
    formData.append('countryCode', '62');

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        Authorization: token,
      },
      body: formData,
    });

    const result = await response.json();

    return NextResponse.json({
      ok: result.status === true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error sending WhatsApp via Fonnte:', error);
    return NextResponse.json(
      { ok: false, message: error.message || 'Terjadi kesalahan pada gateway WhatsApp' },
      { status: 500 }
    );
  }
}
