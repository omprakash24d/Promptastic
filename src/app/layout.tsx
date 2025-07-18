
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeManager } from '@/components/layout/ThemeManager';

const APP_NAME = 'Promptastic!';
const APP_DESCRIPTION = 'Promptastic! is a modern, feature-rich teleprompter application designed for presenters and content creators. Manage scripts, customize display, and use AI-powered enhancements.';
// APP_URL is still useful for canonical URLs or absolute URLs if needed elsewhere,
// but for assets served by Next.js, relative paths are preferred.
const APP_URL = 'https://prompt.indhinditech.com/';

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: `${APP_NAME} - Modern Teleprompter & Script Tool`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: ['teleprompter', 'Next.js', 'React', 'presentation tool', 'script management', 'public speaking', 'content creation', 'AI teleprompter'],
  manifest: '/site.webmanifest', // Relative path
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: APP_NAME,
    title: {
        default: `${APP_NAME} - Modern Teleprompter & Script Tool`,
        template: `%s | ${APP_NAME}`,
    },
    description: APP_DESCRIPTION,
    url: APP_URL, // Canonical URL can remain absolute
    images: [
      {
        url: '/og-image.png', // Relative path
        width: 1200,
        height: 630,
        alt: 'Promptastic! Teleprompter Application Interface',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: {
        default: `${APP_NAME} - Modern Teleprompter & Script Tool`,
        template: `%s | ${APP_NAME}`,
    },
    description: APP_DESCRIPTION,
    images: ['/twitter-image.png'], // Relative path
  },
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon', sizes: 'any' }, // Relative path
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' }, // Relative path
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' }, // Relative path
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' } // Relative path
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#5DADE2', // This should match a color in your theme
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const setInitialTheme = `
    (function() {
      try {
        var serializedStore = localStorage.getItem('promptastic-store');
        if (serializedStore) {
          var store = JSON.parse(serializedStore);
          if (store && store.state && typeof store.state === 'object') { 
            var prefs = store.state;
            if (typeof prefs.enableHighContrast === 'boolean' && prefs.enableHighContrast) {
              document.documentElement.classList.add('high-contrast');
            } else if (typeof prefs.darkMode === 'boolean' && prefs.darkMode) {
              document.documentElement.classList.add('dark');
            }
          }
        }
      } catch (e) {
        console.warn('Initial theme script error:', e);
      }
    })();
  `;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: setInitialTheme }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <ThemeManager />
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
