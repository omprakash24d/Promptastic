
import type { MetadataRoute } from 'next';

// TODO: Replace this with your actual deployed application URL
const BASE_URL = 'https://your-promptastic-app-url.com';

export default function sitemap(): MetadataRoute.Sitemap {
  // Define your public static routes here.
  // Dynamic routes (e.g., user-specific script pages if they were public)
  // would require fetching data to generate.
  // For Promptastic!, most user content is private.
  const staticRoutes: Array<{ path: string; changeFrequency: 'yearly' | 'monthly' | 'weekly' | 'daily' | 'always' | 'hourly' | 'never'; priority: number }> = [
    { path: '/', changeFrequency: 'weekly', priority: 1.0 },
    { path: '/login', changeFrequency: 'yearly', priority: 0.5 },
    // Add any other public static pages, e.g., an about page, pricing page, etc.
    // { path: '/about', changeFrequency: 'monthly', priority: 0.7 },
  ];

  return staticRoutes.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: new Date().toISOString(), // Or a specific date for truly static content
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
