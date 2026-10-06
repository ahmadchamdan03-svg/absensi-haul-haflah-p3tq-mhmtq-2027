import { MetadataRoute } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const contentType = 'application/xml';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://haflahp3tq.site';
  const now = new Date();

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/miraj-journey`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/denah`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];
}
