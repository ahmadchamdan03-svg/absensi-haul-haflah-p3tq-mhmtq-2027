import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, Home } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface ShortLinkPageProps {
  params: {
    kode: string;
  };
}

export default async function ShortLinkRedirectPage({ params }: ShortLinkPageProps) {
  const rawKode = decodeURIComponent(params.kode || '').trim();

  if (!rawKode) {
    return <NotFoundView />;
  }

  // 1. Query persidangan_peserta WHERE kode_peserta = rawKode (case-insensitive)
  const { data: peserta, error: pesertaErr } = await supabase
    .from('persidangan_peserta')
    .select('persidangan_id, kode_peserta')
    .ilike('kode_peserta', rawKode)
    .maybeSingle();

  if (pesertaErr || !peserta || !peserta.persidangan_id) {
    return <NotFoundView kode={rawKode} />;
  }

  // 2. Query slug dari tabel persidangan
  const { data: persidangan, error: persidanganErr } = await supabase
    .from('persidangan')
    .select('slug')
    .eq('id', peserta.persidangan_id)
    .maybeSingle();

  if (persidanganErr || !persidangan || !persidangan.slug) {
    return <NotFoundView kode={rawKode} />;
  }

  // 3. Lakukan redirect ke /persidangan/{slug}?to={kode}
  redirect(
    `/persidangan/${persidangan.slug}?to=${encodeURIComponent(peserta.kode_peserta || rawKode)}`
  );
}

function NotFoundView({ kode }: { kode?: string }) {
  return (
    <div className="min-h-screen bg-[#FAF7F3] flex items-center justify-center p-4">
      <div className="bg-white border-2 border-[#D5C4B4] rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-xl space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold uppercase tracking-wider">
            Tautan Tidak Valid
          </span>
          <h2 className="font-serif font-black text-xl text-[#422F21]">
            Undangan Tidak Ditemukan
          </h2>
          <p className="text-xs text-[#735334] leading-relaxed">
            Kode undangan {kode ? <strong className="font-mono text-[#8C6A47]">{kode}</strong> : ''} tidak ditemukan atau belum terdaftar di sistem persidangan.
            Pastikan tautan yang Anda buka sesuai dengan yang dikirimkan oleh panitia.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8C6A47] hover:bg-[#735334] text-white text-xs font-bold shadow-md transition-all"
          >
            <Home className="w-4 h-4" />
            Kembali ke Beranda
          </Link>
        </div>

        <div className="text-[10px] text-[#A89887] pt-2 border-t border-[#EFE8E1]">
          Panitia Haul &amp; Haflah P3TQ - MHMTQ 1448 H. / 2027 M.
        </div>
      </div>
    </div>
  );
}
