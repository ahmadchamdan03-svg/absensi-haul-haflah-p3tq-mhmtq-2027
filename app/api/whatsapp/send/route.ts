import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { target, message, delay } = body;

    if (!target || !message) {
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
    formData.append('message', message);
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
