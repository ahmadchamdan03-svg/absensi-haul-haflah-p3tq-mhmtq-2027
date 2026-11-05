'use client';

import LiveDasbor from '@/components/LiveDasbor';
import AuthGuard from '@/components/AuthGuard';

export default function DasborPublicPage() {
  return (
    <AuthGuard allowedRoles={['ADMIN', 'PIMPINAN', 'PENERIMA_TAMU', 'PENJAGA_GERBANG']}>
      <div className="min-h-screen text-[#0F2C59] p-4 sm:p-6 pb-24 max-w-6xl mx-auto">
        <LiveDasbor />
      </div>
    </AuthGuard>
  );
}
