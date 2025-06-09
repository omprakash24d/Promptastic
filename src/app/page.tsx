
"use client";

import type React from 'react';
import { useEffect, useState } from 'react';
import { useTeleprompterStore } from '@/hooks/useTeleprompterStore';
import { SettingsPanel } from '@/components/promptastic/SettingsPanel';
import { PlaybackControls } from '@/components/promptastic/PlaybackControls';
import { TeleprompterView } from '@/components/promptastic/TeleprompterView';
import { loadFromLocalStorage } from '@/lib/localStorage';
import Header from '@/components/layout/Header'; // Import the new header

export default function PromptasticPage() {
  const { 
    darkMode,
    setDarkMode,
    scripts,
    activeScriptName,
    loadScript: loadScriptFromStore,
  } = useTeleprompterStore();

  useEffect(() => {
    const settingsFromStorage = loadFromLocalStorage('promptastic-store', {darkMode: undefined});
    
    if (settingsFromStorage.darkMode === undefined) {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemPrefersDark !== useTeleprompterStore.getState().darkMode) {
         setDarkMode(systemPrefersDark);
      }
    } else {
      if (settingsFromStorage.darkMode !== useTeleprompterStore.getState().darkMode) {
        setDarkMode(settingsFromStorage.darkMode);
      }
    }
  }, [setDarkMode]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    if (scripts.length > 0) {
      const scriptToLoad = activeScriptName && scripts.some(s => s.name === activeScriptName)
        ? activeScriptName
        : scripts[0].name;
      if (scriptToLoad && !useTeleprompterStore.getState().scriptText) { 
        loadScriptFromStore(scriptToLoad);
      } else if (!activeScriptName && scripts.length > 0 && !useTeleprompterStore.getState().scriptText) {
        loadScriptFromStore(scripts[0].name);
      }
    }
  }, [activeScriptName, scripts, loadScriptFromStore]);


  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground">
      <Header /> {/* Use the new header component */}

      <main className="flex-1 overflow-hidden">
        <TeleprompterView />
      </main>

      <footer className="p-2 border-t print:hidden">
        <PlaybackControls />
      </footer>
    </div>
  );
}
