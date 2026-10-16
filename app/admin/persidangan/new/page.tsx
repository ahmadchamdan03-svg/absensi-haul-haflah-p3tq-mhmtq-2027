'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, FilePlus } from 'lucide-react';
import PersidanganForm from '@/components/PersidanganForm';
import { Persidangan } from '@/lib/persidangan';

export default function NewPersidanganPage() {
  const router = useRouter();

  const handleSuccess = (data: Persidangan) => {
    router.push(`/admin/persidangan/${data.id}`);
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FAF7F3] border-2 border-[#D5C4B4] rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="space-y-1">
          <Link
            href="/admin/persidangan"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8C6A47] hover:text-[#5E432A] transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Daftar Persidangan
          </Link>
          <h1 className="font-serif font-black text-xl sm:text-2xl text-[#422F21] flex items-center gap-2.5">
            <FilePlus className="w-6 h-6 text-[#8C6A47]" />
            Buat Persidangan Baru
          </h1>
          <p className="text-xs text-[#735334]">
            Isi formulir persidangan di bawah. Setelah dibuat, Anda dapat mengunggah dokumen PDF dan mendaftarkan peserta.
          </p>
        </div>
      </div>

      {/* Form Container */}
      <PersidanganForm
        mode="create"
        onSuccess={handleSuccess}
        onCancel={() => router.push('/admin/persidangan')}
      />
    </div>
  );
}
