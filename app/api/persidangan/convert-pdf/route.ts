import { NextResponse } from 'next/server';

/**
 * Endpoint ini telah dideprecate.
 * Proses konversi PDF ke JPG kini dijalankan 100% di sisi browser (client-side)
 * menggunakan library pdfjs-dist untuk menghindari batas memori & timeout 500 di server Vercel.
 */
export async function POST() {
  return NextResponse.json({
    success: false,
    message: 'Endpoint ini telah dialihkan ke konversi langsung di sisi browser (client-side).',
  });
}
