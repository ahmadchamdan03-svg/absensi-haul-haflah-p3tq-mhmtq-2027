import { MetadataRoute } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/miraj-journey', '/denah'],
        disallow: [
          '/admin/',
          '/scan/',
          '/pimpinan/',
          '/penerima-tamu/',
          '/rekon/',
          '/dasbor/',
          '/api/',
          '/beli/',
          '/u/',
        ],
      },
    ],
    sitemap: 'https://haflahp3tq.site/sitemap.xml',
  };
}
