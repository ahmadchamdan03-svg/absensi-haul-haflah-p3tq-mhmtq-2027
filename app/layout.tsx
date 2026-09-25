import type { Metadata, Viewport } from 'next';
import './globals.css';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'Sistem Absensi & Manajemen Kuota Haul-Haflah P3TQ - MHMTQ',
  description: 'Aplikasi Absensi & Manajemen Kuota Haul-Haflah Pondok Pesantren Putri Tahfizhil Qur-an Lirboyo Kediri Versi 4.2',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  themeColor: '#172738',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-[#FAF7F3] text-slate-900 antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
