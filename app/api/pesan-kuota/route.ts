import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/mock-data';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { keluarga_id, jumlah } = body;

    if (!keluarga_id || !jumlah) {
      return NextResponse.json({ ok: false, reason: 'PARAMETER_TIDAK_LENGKAP' }, { status: 400 });
    }

    const res = store.pesanKuota(keluarga_id, Number(jumlah));
    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json({ ok: false, reason: err.message }, { status: 500 });
  }
}
