
"use client";

import { useEffect } from 'react';
import { useTeleprompterStore } from '@/hooks/useTeleprompterStore';

export function ThemeManager() {
  const darkMode = useTeleprompterStore((state) => state.darkMode);
  const enableHighContrast = useTeleprompterStore((state) => state.enableHighContrast);

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove theme classes first to avoid conflicts
    root.classList.remove('dark', 'high-contrast');

    if (enableHighContrast) {
      root.classList.add('high-contrast');
    } else if (darkMode) {
      root.classList.add('dark');
    }
    // If neither high-contrast nor dark, it defaults to the light theme (no specific class needed for light typically)
  }, [darkMode, enableHighContrast]);

  return null; // This component does not render any visible UI
}
