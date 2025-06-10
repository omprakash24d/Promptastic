
"use client";

import type React from 'react';
import { useEffect, useState, useRef } from 'react';
import { useTeleprompterStore } from '@/hooks/useTeleprompterStore';
import { SettingsPanel } from '@/components/promptastic/SettingsPanel';
import { PlaybackControls } from '@/components/promptastic/PlaybackControls';
import { TeleprompterView } from '@/components/promptastic/TeleprompterView';
import { loadFromLocalStorage } from '@/lib/localStorage';
import Header from '@/components/layout/Header';
import { ScriptManager } from '@/components/promptastic/ScriptManager';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { FileText, SlidersHorizontal, Maximize, Minimize } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';


export default function PromptasticPage() {
  const {
    darkMode,
    setDarkMode,
    scripts,
    activeScriptName,
    loadScript: loadScriptFromStore,
    scriptText: currentGlobalScriptText,
    togglePlayPause,
  } = useTeleprompterStore();

  const [settingsSheetOpen, setSettingsSheetOpen] = useState(false);
  const [scriptsSheetOpen, setScriptsSheetOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Initialize dark mode from localStorage or system preference
    const persistedStore = loadFromLocalStorage('promptastic-store', {darkMode: undefined});
    let initialDarkMode = persistedStore.darkMode;

    if (initialDarkMode === undefined) {
      if (typeof window !== 'undefined') {
        initialDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        // Fallback to store's SSR default if window is not available
        initialDarkMode = useTeleprompterStore.getState().darkMode; 
      }
    }
    // Always call setDarkMode to ensure textColor is also correctly set 
    // based on the determined initialDarkMode. The setDarkMode function 
    // in the store will handle the textColor adjustment.
    setDarkMode(initialDarkMode);
  }, [setDarkMode]);


  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const storeState = useTeleprompterStore.getState();
    if (storeState.scripts.length > 0) {
      const scriptToLoadName = storeState.activeScriptName && storeState.scripts.some(s => s.name === storeState.activeScriptName)
        ? storeState.activeScriptName
        : storeState.scripts[0].name;

      const targetScript = storeState.scripts.find(s => s.name === scriptToLoadName);
      if (targetScript && (storeState.scriptText !== targetScript.content || !storeState.scriptText)) {
        loadScriptFromStore(scriptToLoadName);
      } else if (!targetScript && !storeState.scriptText && storeState.scripts.length > 0) {
        loadScriptFromStore(storeState.scripts[0].name);
      }
    } else if (storeState.scriptText === "" && storeState.activeScriptName) {
        // This case handles when a script was deleted, and activeScriptName might still be set
        // but scriptText is empty. Attempt to load it, which might clear activeScriptName if not found.
        loadScriptFromStore(storeState.activeScriptName);
    } else if (storeState.scripts.length === 0 && storeState.scriptText === "" && !storeState.activeScriptName) {
       // If no scripts, no active script, and scriptText is empty, ensure default is set
       // The store's initial state should handle the welcome message.
       // No explicit action needed here as store provides the default.
    }
  }, [activeScriptName, scripts, loadScriptFromStore, currentGlobalScriptText]);


  const handleToggleFullScreen = () => {
    if (!mainRef.current) return;

    if (!document.fullscreenElement) {
      mainRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const fullscreenChangeHandler = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', fullscreenChangeHandler);
    return () => document.removeEventListener('fullscreenchange', fullscreenChangeHandler);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.getAttribute('role') === 'button')) {
          return;
        }
        event.preventDefault();
        togglePlayPause();
      }
      if (event.key === 'Escape' && document.fullscreenElement) {
        document.exitFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [togglePlayPause]);


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header
        onOpenScripts={() => setScriptsSheetOpen(true)}
        onOpenSettings={() => setSettingsSheetOpen(true)}
      />

      <main ref={mainRef} className="flex-1">
        <TeleprompterView />
      </main>

      <div className="p-4 border-t print:hidden bg-card shadow-md sticky bottom-0 z-20">
        <PlaybackControls
          isFullScreen={isFullScreen}
          onToggleFullScreen={handleToggleFullScreen}
        />
        <p className="text-xs text-muted-foreground text-center mt-3">
          Designed and developed by{" "}
          <a
            href="https://www.linkedin.com/in/om-prakash-yadav-0731b7256/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary"
          >
            Om Prakash
          </a>
        </p>
      </div>

      <Sheet open={scriptsSheetOpen} onOpenChange={setScriptsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="text-lg">Manage Scripts</SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1 p-4">
            <ScriptManager />
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <Sheet open={settingsSheetOpen} onOpenChange={setSettingsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-sm p-0 flex flex-col">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="text-lg">Teleprompter Settings</SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1 p-4">
            <SettingsPanel />
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}

