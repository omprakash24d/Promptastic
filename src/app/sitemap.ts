
import type { MetadataRoute } from 'next';

const BASE_URL = 'https://prompt.indhinditech.com/'; // Updated BASE_URL

export default function sitemap(): MetadataRoute.Sitemap {
  // Define your public static routes here.
  const staticRoutes: Array<{ path: string; changeFrequency: 'yearly' | 'monthly' | 'weekly' | 'daily' | 'always' | 'hourly' | 'never'; priority: number }> = [
    { path: '/', changeFrequency: 'weekly', priority: 1.0 },
    { path: '/login', changeFrequency: 'yearly', priority: 0.5 },
    // Add any other public static pages, e.g., an about page, pricing page, etc.
    // { path: '/about', changeFrequency: 'monthly', priority: 0.7 },
  ];

  return staticRoutes.map((route) => ({
    url: `${BASE_URL}${route.path.startsWith('/') ? route.path.substring(1) : route.path}`, // Ensure no double slashes
    lastModified: new Date().toISOString(), // Or a specific date for truly static content
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
