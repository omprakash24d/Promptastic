
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext';

const APP_NAME = 'Promptastic!';
const APP_DESCRIPTION = 'Promptastic! is a modern, feature-rich teleprompter application designed for presenters and content creators. Manage scripts, customize display, and use AI-powered enhancements.';
// TODO: Replace with your actual deployed application URL
const APP_URL = 'https://your-promptastic-app-url.com';

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    template: `%s | ${APP_NAME}`,
    default: `${APP_NAME} - Modern Teleprompter & Script Tool`,
  },
  description: APP_DESCRIPTION,
  keywords: ['teleprompter', 'Next.js', 'React', 'presentation tool', 'script management', 'public speaking', 'content creation', 'AI teleprompter'],
  manifest: `${APP_URL}/manifest.json`, // TODO: Create a manifest.json file if you want PWA features
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_NAME,
    // startupImage: [], // TODO: Add startup images for PWA on iOS
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: APP_NAME,
    title: {
      template: `%s | ${APP_NAME}`,
      default: `${APP_NAME} - Modern Teleprompter & Script Tool`,
    },
    description: APP_DESCRIPTION,
    url: APP_URL,
    // TODO: Add a specific Open Graph image for your site (e.g., 1200x630px)
    // images: [
    //   {
    //     url: `${APP_URL}/og-image.png`,
    //     width: 1200,
    //     height: 630,
    //     alt: 'Promptastic! Teleprompter Application Interface',
    //   },
    // ],
  },
  twitter: {
    card: 'summary_large_image',
    title: {
      template: `%s | ${APP_NAME}`,
      default: `${APP_NAME} - Modern Teleprompter & Script Tool`,
    },
    description: APP_DESCRIPTION,
    // TODO: Replace with your Twitter handle if you have one
    // site: '@yourTwitterHandle',
    // creator: '@creatorTwitterHandle',
    // TODO: Add a specific Twitter card image (e.g., similar to OG image)
    // images: [`${APP_URL}/twitter-image.png`],
  },
  // TODO: Add a favicon for your site
  // icons: {
  //   icon: '/favicon.ico',
  //   shortcut: '/favicon-16x16.png',
  //   apple: '/apple-touch-icon.png',
  // },
  // TODO: If you have canonical URLs for different versions (e.g. mobile), specify them
  // alternates: {
  //   canonical: APP_URL,
  //   // languages: { 'en-US': '/en-US' }, // If supporting multiple languages
  // },
  // category: 'productivity', // Optional
};

export const viewport: Viewport = {
  themeColor: '#5DADE2', // Match your primary color
  // width: 'device-width', // Default
  // initialScale: 1, // Default
  // maximumScale: 1, // Optional: to prevent zooming on mobile if desired
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
