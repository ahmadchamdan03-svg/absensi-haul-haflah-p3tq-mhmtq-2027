import type { Metadata, Viewport } from 'next';
import './globals.css';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'Haflah P3TQ',
  description: 'Aplikasi Absensi & Manajemen Kuota Haul-Haflah P3TQ - MHMTQ Lirboyo Kediri',
  metadataBase: new URL('https://haflahp3tq.site'),
  manifest: '/manifest.json',
  openGraph: {
    title: 'Haflah P3TQ',
    description: 'Aplikasi Absensi & Manajemen Kuota Haul-Haflah P3TQ - MHMTQ Lirboyo Kediri',
    url: 'https://haflahp3tq.site',
    siteName: 'Haflah P3TQ',
    images: [
      {
        url: '/logo-haul-haflah-transparent.png',
        width: 800,
        height: 800,
        alt: 'Haflah P3TQ Logo',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Haflah P3TQ',
    description: 'Aplikasi Absensi & Manajemen Kuota Haul-Haflah P3TQ - MHMTQ Lirboyo Kediri',
    images: ['/logo-haul-haflah-transparent.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png' },
      { url: '/apple-touch-icon.png' },
    ],
    shortcut: '/favicon.ico',
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
