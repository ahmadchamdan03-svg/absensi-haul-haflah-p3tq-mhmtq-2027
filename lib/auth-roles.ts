// =====================================================================
// AUTENTIKASI & MANAJEMEN OTORITAS PERAN (ROLE-BASED ACCESS CONTROL)
// Haul & Haflah P3TQ - MHMTQ 1448 H. / 2027 M.
// =====================================================================

export type AppRole = 'ADMIN' | 'PENERIMA_TAMU' | 'PIMPINAN' | 'PENJAGA_GERBANG' | 'WALI';

export interface RoleConfig {
  key: AppRole;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  badgeColor: string;
  route: string;
  requirePassword: boolean;
  password?: string;
  hasAI: boolean;
  aiMode: string;
}

export const ROLES_CONFIG: Record<AppRole, RoleConfig> = {
  ADMIN: {
    key: 'ADMIN',
    title: 'Administrator',
    subtitle: 'Seksi Kesekretariatan & Sistem',
    description: 'Semua akses kelola: Master data 549 santri & 70 tamu, rekonsiliasi kuota, audit log, buka/tutup kuota, dan ekspor data.',
    badge: 'Semua Akses',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    route: '/admin/peserta',
    requirePassword: true,
    password: 'admin_haflah',
    hasAI: true,
    aiMode: 'Super Admin Mode (Semua Data & Anggaran)',
  },
  PENERIMA_TAMU: {
    key: 'PENERIMA_TAMU',
    title: 'Penerima Tamu',
    subtitle: 'Seksi Penerima Tamu Putra & Putri',
    description: 'Live dasbor kehadiran, akses absen cepat tamu kehormatan & VVIP/VIP, serta panduan 8 pos jaga & penjemputan Dzurriyah.',
    badge: 'Dasbor & Absen Tamu',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    route: '/penerima-tamu',
    requirePassword: true,
    password: 'pt_haflah',
    hasAI: true,
    aiMode: 'Informasi Dzurriyah, Protokoler & 8 Pos Tamu',
  },
  PIMPINAN: {
    key: 'PIMPINAN',
    title: 'Pimpinan & Masyayikh',
    subtitle: 'Dewan Pengasuh & Penasehat',
    description: 'Live dasbor eksekutif: Memantau tingkat okupansi kursi Aula Al-Muktamar, persentase kedatangan, dan rasio jamaah secara langsung.',
    badge: 'Executive View',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    route: '/pimpinan',
    requirePassword: true,
    password: 'pimpinan_haflah',
    hasAI: true,
    aiMode: 'Ringkasan Eksekutif & Tanya Jawab Rekapitulasi',
  },
  PENJAGA_GERBANG: {
    key: 'PENJAGA_GERBANG',
    title: 'Penjaga Gerbang',
    subtitle: 'Seksi Keamanan & Petugas Gerbang',
    description: 'PWA scanner kamera & USB barcode, verifikasi kartu masuk (Hitam Gold vs Merah Gold), buzzer error keras, dan cek kuota peserta (hanya melihat).',
    badge: 'Scanner & Cek Peserta',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    route: '/scan',
    requirePassword: true,
    password: '1234567890',
    hasAI: true,
    aiMode: 'Panduan Alur Gerbang, Ketertiban & Darurat',
  },
  WALI: {
    key: 'WALI',
    title: 'Wali Santri & Tamu',
    subtitle: 'Shohibul Hajat & Undangan',
    description: 'Undangan digital resmi, kartu masuk barcode QR, estimasi kehadiran, lokasi sambangan, dan panduan haflah.',
    badge: 'Undangan Pribadi',
    badgeColor: 'bg-stone-100 text-stone-800 border-stone-300',
    route: '/u',
    requirePassword: false,
    hasAI: true,
    aiMode: 'Layanan Tanya Jawab Adicara & Ibadah (Data Rahasia Terproteksi)',
  },
};

const SESSION_ROLE_KEY = 'haflah_active_role_session';

export function getActiveRole(): AppRole | null {
  if (typeof window === 'undefined') return null;
  try {
    const role = sessionStorage.getItem(SESSION_ROLE_KEY) || localStorage.getItem(SESSION_ROLE_KEY);
    if (role && (role in ROLES_CONFIG)) {
      return role as AppRole;
    }
  } catch (e) {}
  return null;
}

export function setActiveRole(role: AppRole): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SESSION_ROLE_KEY, role);
    localStorage.setItem(SESSION_ROLE_KEY, role);
  } catch (e) {}
}

export function clearActiveRole(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(SESSION_ROLE_KEY);
    localStorage.removeItem(SESSION_ROLE_KEY);
  } catch (e) {}
}

export function verifyRolePassword(role: AppRole, inputPassword: string): boolean {
  const config = ROLES_CONFIG[role];
  if (!config) return false;
  if (!config.requirePassword) return true;
  return config.password === inputPassword.trim();
}
