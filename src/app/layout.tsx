
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext';

const APP_NAME = 'Promptastic!';
const APP_DESCRIPTION = 'Promptastic! is a modern, feature-rich teleprompter application designed for presenters and content creators. Manage scripts, customize display, and use AI-powered enhancements.';
const APP_URL = 'https://prompt.indhinditech.com/';

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    template: `%s | ${APP_NAME}`,
    default: `${APP_NAME} - Modern Teleprompter & Script Tool`,
  },
  description: APP_DESCRIPTION,
  keywords: ['teleprompter', 'Next.js', 'React', 'presentation tool', 'script management', 'public speaking', 'content creation', 'AI teleprompter'],
  manifest: `${APP_URL}manifest.json`,
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
      template: `%s | ${APP_NAME}`,
      default: `${APP_NAME} - Modern Teleprompter & Script Tool`,
    },
    description: APP_DESCRIPTION,
    url: APP_URL,
    images: [
      {
        url: `${APP_URL}og-image.png`,
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
    images: [`${APP_URL}twitter-image.png`],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#5DADE2',
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
          if (store && store.state) { // Check if store and store.state exist
            var prefs = store.state;
            // Check for enableHighContrast first
            if (typeof prefs.enableHighContrast === 'boolean' && prefs.enableHighContrast) {
              document.documentElement.classList.add('high-contrast');
            } else if (typeof prefs.darkMode === 'boolean' && prefs.darkMode) {
              document.documentElement.classList.add('dark');
            }
            // If prefs.darkMode is explicitly false, or if neither highContrast nor darkMode are true,
            // no theme class is added by this script, and CSS defaults (light theme) will apply initially.
          }
        }
      } catch (e) {
        // Fails silently if localStorage is unavailable or data is corrupted.
        // The main app logic in page.tsx will still attempt to set the theme.
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
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
