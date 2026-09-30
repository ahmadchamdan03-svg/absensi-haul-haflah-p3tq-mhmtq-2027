'use client';

import LiveDasbor from '@/components/LiveDasbor';
import AuthGuard from '@/components/AuthGuard';

export default function DasborPage() {
  return (
    <AuthGuard allowedRoles={['ADMIN', 'PIMPINAN', 'PENERIMA_TAMU', 'PENJAGA_GERBANG']}>
      <div className="min-h-screen bg-[#FDFBF7] text-[#422F21] p-4 sm:p-6 pb-24 max-w-6xl mx-auto">
        <LiveDasbor />
      </div>
    </AuthGuard>
  );
}
