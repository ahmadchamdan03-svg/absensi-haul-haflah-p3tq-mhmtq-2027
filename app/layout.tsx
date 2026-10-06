import type { Metadata, Viewport } from 'next';
import './globals.css';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: {
    default: 'Haflah P3TQ Lirboyo 2027 | Portal Resmi Kepanitiaan',
    template: '%s | Haflah P3TQ Lirboyo 2027',
  },
  description:
    'Web resmi Haflah Akhirussanah Pondok Pesantren Putri Tahfizhil Qur-an (P3TQ) & MHMTQ Lirboyo Kediri 1448 H / 2027 M. Portal kepanitiaan, undangan digital, dan manajemen presensi.',
  keywords: [
    'haflah p3tq',
    'haflah pptq',
    'haflah lirboyo',
    'p3tq lirboyo',
    'pptq lirboyo',
    'p3tq',
    'pptq',
    'haflah akhirussanah',
    'mhmtq lirboyo',
    'pondok lirboyo',
    'haul haflah lirboyo',
    'p3tq mhmtq',
    'undangan haflah lirboyo',
  ],
  authors: [{ name: 'Panitia Haflah P3TQ MHMTQ 2027' }],
  metadataBase: new URL('https://haflahp3tq.site'),
  manifest: '/manifest.json',
  openGraph: {
    title: 'Haflah P3TQ Lirboyo 2027 | Portal Resmi',
    description:
      'Web resmi Haflah Akhirussanah P3TQ & MHMTQ Lirboyo Kediri 1448 H / 2027 M.',
    url: 'https://haflahp3tq.site',
    siteName: 'Haflah P3TQ Lirboyo',
    locale: 'id_ID',
    type: 'website',
    images: [
      {
        url: '/logo-haul-haflah-transparent.png',
        width: 800,
        height: 800,
        alt: 'Haflah P3TQ Lirboyo Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Haflah P3TQ Lirboyo 2027',
    description:
      'Web resmi Haflah Akhirussanah P3TQ & MHMTQ Lirboyo Kediri 1448 H / 2027 M.',
    images: ['/logo-haul-haflah-transparent.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  alternates: {
    canonical: 'https://haflahp3tq.site',
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
