import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const token = process.env.FONNTE_TOKEN || 'qUYeuFbxZZPoTT6cniAj';

    const response = await fetch('https://api.fonnte.com/device', {
      method: 'POST',
      headers: {
        Authorization: token,
      },
      cache: 'no-store',
    });

    const result = await response.json();

    return NextResponse.json({
      ok: result.status === true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error checking Fonnte device:', error);
    return NextResponse.json(
      { ok: false, message: error.message || 'Gagal mengecek status perangkat' },
      { status: 500 }
    );
  }
}
