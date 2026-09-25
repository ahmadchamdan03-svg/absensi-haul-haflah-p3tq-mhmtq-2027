import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/mock-data';
import { verifyQrPayload } from '@/lib/hmac';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { kode_qr, jumlah_l, jumlah_p, jalur, nonce, jumlah_balita } = body;

    if (!kode_qr) {
      return NextResponse.json({ ok: false, reason: 'KODE_QR_KOSONG' }, { status: 400 });
    }

    // Bersihkan format jika berformat HFL27.SH0042.xxxx
    let cleanKode = kode_qr.trim();
    if (cleanKode.includes('.')) {
      const parts = cleanKode.split('.');
      if (parts.length >= 2) cleanKode = parts[1];
    }

    const res = store.checkin(
      cleanKode,
      Number(jumlah_l) || 0,
      Number(jumlah_p) || 0,
      jalur || 'TIMUR',
      Number(jumlah_balita) || 0
    );

    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json({ ok: false, reason: err.message }, { status: 500 });
  }
}
