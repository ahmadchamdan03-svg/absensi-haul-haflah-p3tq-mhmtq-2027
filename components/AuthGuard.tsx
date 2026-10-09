'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getActiveRole, AppRole, ROLES_CONFIG } from '@/lib/auth-roles';
import { WelcomePopup } from '@/components/WelcomePopup';

interface AuthGuardProps {
  /** Role(s) yang diizinkan mengakses halaman ini */
  allowedRoles: AppRole[];
  children: React.ReactNode;
}

/**
 * Wrapper component untuk proteksi halaman berdasarkan role.
 * Jika user belum login atau role-nya tidak sesuai → redirect ke landing page (/).
 */
export default function AuthGuard({ allowedRoles, children }: AuthGuardProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const currentRole = getActiveRole();
    if (!currentRole || !allowedRoles.includes(currentRole)) {
      // Belum login atau role tidak sesuai → redirect ke landing
      router.replace('/');
    } else {
      setIsAuthorized(true);
      const roleConfig = ROLES_CONFIG[currentRole];
      const nameTitle = roleConfig ? roleConfig.title : 'Pengguna';
      setUserName(nameTitle);

      const welcomeKey = `haflah_welcome_shown_${currentRole}`;
      if (typeof window !== 'undefined' && !sessionStorage.getItem(welcomeKey)) {
        setShowWelcome(true);
      }
    }
    setIsChecking(false);
  }, [allowedRoles, router]);

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    const currentRole = getActiveRole();
    if (currentRole && typeof window !== 'undefined') {
      sessionStorage.setItem(`haflah_welcome_shown_${currentRole}`, 'true');
    }
  };

  // Tampilkan loading singkat saat pengecekan
  if (isChecking || !isAuthorized) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 mx-auto border-3 border-[#D5C4B4] border-t-[#8C6A47] rounded-full animate-spin" />
          <p className="text-xs text-[#7A624E] font-medium">Memeriksa otoritas akses...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      {showWelcome && (
        <WelcomePopup userName={userName} onClose={handleCloseWelcome} />
      )}
    </>
  );
}
