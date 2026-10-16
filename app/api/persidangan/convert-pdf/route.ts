import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { pdf } from 'pdf-to-img';

export const maxDuration = 60; // 60s timeout for Vercel
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { persidangan_id, pdf_url } = body;

    if (!persidangan_id || !pdf_url) {
      return NextResponse.json(
        { success: false, message: 'persidangan_id dan pdf_url wajib diisi.' },
        { status: 400 }
      );
    }

    // 1. Download PDF dari pdf_url
    const res = await fetch(pdf_url);
    if (!res.ok) {
      return NextResponse.json(
        {
          success: false,
          message: `Gagal mengunduh berkas PDF dari storage (status HTTP: ${res.status}).`,
        },
        { status: 502 }
      );
    }

    const arrayBuffer = await res.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    // Cek ukuran berkas: max 10MB
    const MAX_SIZE_BYTES = 10 * 1024 * 1024;
    if (pdfBuffer.length > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, message: 'Ukuran berkas PDF melebihi batas 10 MB.' },
        { status: 400 }
      );
    }

    // 2. Muat dokumen PDF menggunakan pdf-to-img
    const doc = await pdf(pdfBuffer, { scale: 1.5, format: 'jpg' });

    // Cek jumlah halaman: max 10 halaman
    if (doc.length > 10) {
      return NextResponse.json(
        {
          success: false,
          message: `Dokumen memiliki ${doc.length} halaman (maksimal 10 halaman). Harap unggah berkas surat yang lebih ringkas.`,
        },
        { status: 400 }
      );
    }

    // 3. Konversi dan upload setiap halaman ke Supabase Storage (bucket undangan-pdf)
    const jpgUrls: string[] = [];
    const timestamp = Date.now();
    let pageNum = 1;

    for await (const pageBuffer of doc) {
      const storagePath = `${persidangan_id}/page-${pageNum}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('undangan-pdf')
        .upload(storagePath, pageBuffer, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error(`Gagal mengunggah halaman ${pageNum} ke storage:`, uploadError);
        return NextResponse.json(
          {
            success: false,
            message: `Gagal mengunggah halaman ${pageNum} ke storage: ${uploadError.message}`,
          },
          { status: 500 }
        );
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('undangan-pdf').getPublicUrl(storagePath);

      // Tambahkan query param timestamp agar browser tidak me-cache gambar lama jika di-upload ulang
      jpgUrls.push(`${publicUrl}?v=${timestamp}`);
      pageNum++;
    }

    // 4. Update tabel persidangan
    const { error: dbError } = await supabase
      .from('persidangan')
      .update({
        jpg_urls: jpgUrls,
        updated_at: new Date().toISOString(),
      })
      .eq('id', persidangan_id);

    if (dbError) {
      console.error('Gagal memperbarui kolom jpg_urls di database:', dbError);
      return NextResponse.json(
        {
          success: false,
          message: `Gagal menyimpan daftar gambar ke database: ${dbError.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      jpg_urls: jpgUrls,
      total_pages: jpgUrls.length,
    });
  } catch (err: any) {
    console.error('Error saat konversi PDF ke JPG:', err);
    return NextResponse.json(
      {
        success: false,
        message: err?.message || 'Terjadi kesalahan sistem saat mengonversi PDF ke gambar.',
      },
      { status: 500 }
    );
  }
}
