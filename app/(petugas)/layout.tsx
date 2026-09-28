'use client';

import AuthGuard from '@/components/AuthGuard';

export default function PetugasLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['ADMIN', 'PENJAGA_GERBANG']}>
      {children}
    </AuthGuard>
  );
}
