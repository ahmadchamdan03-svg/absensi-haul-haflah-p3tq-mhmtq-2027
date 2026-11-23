import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 10;
export const dynamic = 'force-dynamic';

/**
 * Auto-reply link grup WA dinonaktifkan karena link undangan digital dan
 * link grup WhatsApp resmi wali santri kini dikirim langsung dalam satu pesan undangan.
 * Endpoint tetap mengembalikan HTTP 200 agar Fonnte tidak melakukan retry berulang.
 */
export async function POST() {
  return NextResponse.json(
    {
      ok: true,
      status: 'DISABLED',
      message:
        'Auto-reply link grup dinonaktifkan karena link undangan dan link grup sudah dikirim dalam satu pesan.',
    },
    { status: 200 }
  );
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    status: 'DISABLED',
    endpoint: 'Fonnte Auto-Reply Webhook Disabled',
  });
}
