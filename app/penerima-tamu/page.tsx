'use client';

import AuthGuard from '@/components/AuthGuard';
import PenerimaTamuPanel from '@/components/PenerimaTamuPanel';

export default function PenerimaTamuPage() {
  return (
    <AuthGuard allowedRoles={['PENERIMA_TAMU', 'ADMIN', 'PENJAGA_GERBANG']}>
      <PenerimaTamuPanel showLogout={true} />
    </AuthGuard>
  );
}
