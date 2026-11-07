import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Undangan Resmi Haflah Akhirussanah P3TQ & MHMTQ 2027',
  description:
    'Undangan Resmi Haflah Akhirussanah & Dzikrul Haul Masyayikh Pondok Pesantren Putri Tahfizhil Qur-an (P3TQ) & MHMTQ Lirboyo Kediri 1448 H / 2027 M.',
  openGraph: {
    title: 'Undangan Resmi Haflah Akhirussanah P3TQ & MHMTQ 2027',
    description:
      'Undangan Resmi Haflah Akhirussanah & Dzikrul Haul Masyayikh Pondok Pesantren Putri Tahfizhil Qur-an (P3TQ) & MHMTQ Lirboyo Kediri 1448 H / 2027 M.',
    url: 'https://haflahp3tq.site',
    siteName: 'Haflah P3TQ Lirboyo',
    locale: 'id_ID',
    type: 'website',
    images: [
      {
        url: '/images/og-undangan.jpg?v=3',
        width: 1200,
        height: 630,
        alt: 'Undangan Resmi Haflah P3TQ Lirboyo 2027',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Undangan Resmi Haflah Akhirussanah P3TQ & MHMTQ 2027',
    description:
      'Undangan Resmi Haflah Akhirussanah & Dzikrul Haul Masyayikh Pondok Pesantren Putri Tahfizhil Qur-an (P3TQ) & MHMTQ Lirboyo Kediri 1448 H / 2027 M.',
    images: ['/images/og-undangan.jpg?v=3'],
  },
};

export default function UndanganTokenLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
