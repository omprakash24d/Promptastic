
import type { MetadataRoute } from 'next';

const BASE_URL = 'https://prompt.indhinditech.com/';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: Array<{ path: string; changeFrequency: 'yearly' | 'monthly' | 'weekly' | 'daily' | 'always' | 'hourly' | 'never'; priority: number }> = [
    { path: '/', changeFrequency: 'weekly', priority: 1.0 },
    { path: '/login', changeFrequency: 'yearly', priority: 0.5 },
    { path: '/profile', changeFrequency: 'monthly', priority: 0.4 },
    { path: '/privacy-policy', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/terms-conditions', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/about-us', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/how-to-use', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/contact-us', changeFrequency: 'yearly', priority: 0.4 },
  ];

  return staticRoutes.map((route) => ({
    url: `${BASE_URL}${route.path.startsWith('/') ? route.path.substring(1) : route.path}`,
    lastModified: new Date().toISOString(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}

