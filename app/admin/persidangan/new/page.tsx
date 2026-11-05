'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FilePlus } from 'lucide-react';
import PersidanganForm from '@/components/PersidanganForm';
import { Persidangan } from '@/lib/persidangan';

export default function NewPersidanganPage() {
  const router = useRouter();

  const handleSuccess = (data: Persidangan) => {
    router.push(`/admin/persidangan/${data.id}?tab=pdf`);
  };

  return (
    <div className="px-6 lg:px-8 py-6 pb-12 max-w-5xl mx-auto">
      {/* Unified Seamless Panel: Header + Form */}
      <div className="bg-white/80 backdrop-blur-md border border-[#BAE6FD] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] overflow-hidden">
        {/* Top Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-b from-[#F0F9FF] to-[#F5EFE8] border-b border-[#BAE6FD] space-y-2">
          <Link
            href="/admin/persidangan"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1D4ED8] hover:text-[#5E432A] transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Daftar Persidangan
          </Link>
          <h1 className="font-serif font-black text-xl sm:text-2xl text-[#0F2C59] flex items-center gap-2.5">
            <FilePlus className="w-6 h-6 text-[#1D4ED8]" />
            Buat Persidangan Baru
          </h1>
          <p className="text-xs text-[#1E40AF]">
            Isi judul persidangan dan sesuaikan template pesan WhatsApp di bawah. Setelah dibuat, Anda akan langsung diarahkan untuk mengunggah berkas PDF undangan resmi.
          </p>
        </div>

        {/* Form Container */}
        <div className="p-5 sm:p-6 bg-white">
          <PersidanganForm
            mode="create"
            onSuccess={handleSuccess}
            onCancel={() => router.push('/admin/persidangan')}
          />
        </div>
      </div>
    </div>
  );
}
