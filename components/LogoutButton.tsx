'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { clearActiveRole, getActiveRole, ROLES_CONFIG } from '@/lib/auth-roles';

interface LogoutButtonProps {
  className?: string;
}

/**
 * Tombol logout kecil. Klik → clear session → kembali ke landing page (/).
 */
export default function LogoutButton({ className }: LogoutButtonProps) {
  const router = useRouter();

  const handleLogout = () => {
    clearActiveRole();
    router.replace('/');
  };

  const role = getActiveRole();
  const roleTitle = role ? ROLES_CONFIG[role]?.title : '';

  return (
    <button
      type="button"
      onClick={handleLogout}
      title={`Keluar dari sesi ${roleTitle}`}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer ${className || ''}`}
    >
      <LogOut className="w-3.5 h-3.5" />
      <span>Keluar</span>
    </button>
  );
}
