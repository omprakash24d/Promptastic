
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext';

const APP_NAME = 'Promptastic!';
const APP_DESCRIPTION = 'Promptastic! is a modern, feature-rich teleprompter application designed for presenters and content creators. Manage scripts, customize display, and use AI-powered enhancements.';
const APP_URL = 'https://prompt.indhinditech.com/'; // Updated APP_URL

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    template: `%s | ${APP_NAME}`,
    default: `${APP_NAME} - Modern Teleprompter & Script Tool`,
  },
  description: APP_DESCRIPTION,
  keywords: ['teleprompter', 'Next.js', 'React', 'presentation tool', 'script management', 'public speaking', 'content creation', 'AI teleprompter'],
  manifest: `${APP_URL}manifest.json`, // Updated manifest path
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_NAME,
    // startupImage: [], // TODO: Add startup images for PWA on iOS if desired
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
    images: [ // Uncommented and updated
      {
        url: `${APP_URL}og-image.png`, // Assumes og-image.png is in /public
        width: 1200,
        height: 630,
        alt: 'Promptastic! Teleprompter Application Interface',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: {
      template: `%s | ${APP_NAME}`,
      default: `${APP_NAME} - Modern Teleprompter & Script Tool`,
    },
    description: APP_DESCRIPTION,
    // site: '@yourTwitterHandle', // TODO: Replace with your Twitter handle if you have one
    // creator: '@creatorTwitterHandle',
    images: [`${APP_URL}twitter-image.png`], // Uncommented and updated, assumes twitter-image.png is in /public
  },
  icons: { // Uncommented and configured
    icon: '/favicon.ico', // Assumes favicon.ico is in /public
    shortcut: '/favicon.ico', // Using favicon.ico for shortcut as well
    apple: '/apple-touch-icon.png', // Assumes apple-touch-icon.png is in /public
    // You can add more specific sizes if needed:
    // other: [
    //   { rel: 'icon', type: 'image/png', sizes: '32x32', url: '/favicon-32x32.png' },
    //   { rel: 'icon', type: 'image/png', sizes: '16x16', url: '/favicon-16x16.png' },
    // ],
  },
  // alternates: { // Optional: If you have canonical URLs for different versions
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
