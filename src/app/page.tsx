
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from "@/hooks/use-toast";


export default function PromptasticPage() {
  const {
    darkMode,
    setDarkMode,
    scripts, // For dependency array
    activeScriptName, // For dependency array
    loadScript: loadScriptFromStore, // Stable store action
    togglePlayPause,
  } = useTeleprompterStore();

  const { toast } = useToast();
  const [settingsSheetOpen, setSettingsSheetOpen] = useState(false);
  const [scriptsSheetOpen, setScriptsSheetOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  // Effect for initializing dark mode from localStorage or system preference
  useEffect(() => {
    const persistedStore = loadFromLocalStorage('promptastic-store', {darkMode: undefined});
    let initialDarkMode = persistedStore.darkMode;

    if (initialDarkMode === undefined) {
      if (typeof window !== 'undefined') {
        initialDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        // Fallback for non-browser environments or if window.matchMedia isn't available (shouldn't happen in Next.js client)
        initialDarkMode = useTeleprompterStore.getState().darkMode; 
      }
    }
    // Call setDarkMode to ensure store logic (including text color adjustment) runs
    setDarkMode(initialDarkMode);
  }, [setDarkMode]); // setDarkMode is a stable reference from Zustand


  // Effect to apply dark class to HTML element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);


  // Effect for initializing scriptText based on activeScriptName or first script
  useEffect(() => {
    const storeState = useTeleprompterStore.getState();
    const { scriptText: currentText, activeScriptName: currentActive, scripts: currentScripts, LONGER_DEFAULT_SCRIPT_TEXT: defaultText } = storeState;

    // Use LONGER_DEFAULT_SCRIPT_TEXT from the store if available, otherwise fallback
    const actualDefaultText = typeof defaultText === 'string' ? defaultText : "Welcome to Promptastic!";


    if (currentActive && currentScripts.some(s => s.name === currentActive)) {
      // Valid active script name exists
      const activeScript = currentScripts.find(s => s.name === currentActive)!;
      // Only load if current text is the placeholder or empty, to avoid overwriting edits.
      if (currentText === actualDefaultText || currentText === "") { 
        loadScriptFromStore(activeScript.name);
      }
    } else if (currentScripts.length > 0) {
      // No valid active script name, but scripts exist: load the first script.
      // Only load if current text is the placeholder or empty.
      if (currentText === actualDefaultText || currentText === "") { 
        loadScriptFromStore(currentScripts[0].name);
        // If activeScriptName was null/invalid, update it in the store to reflect this default loading.
        if(currentActive !== currentScripts[0].name) {
            useTeleprompterStore.setState({ activeScriptName: currentScripts[0].name });
        }
      }
    } else {
      // No scripts exist. Ensure scriptText is the default if it's not already.
      if (currentText !== actualDefaultText) {
        useTeleprompterStore.setState({ scriptText: actualDefaultText, activeScriptName: null, currentScrollPosition: 0 });
      }
    }
  // Dependencies: activeScriptName (from store), scripts (array from store), loadScriptFromStore (stable action)
  // These ensure the effect runs when the active script might need to change or on initial load.
  }, [activeScriptName, scripts, loadScriptFromStore]);


  const handleToggleFullScreen = () => {
    if (!mainRef.current) return;

    if (!document.fullscreenElement) {
      mainRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        toast({
          variant: "destructive",
          title: "Fullscreen Error",
          description: `Could not enter full-screen mode. ${err.message}`,
        });
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => {
           console.error(`Error attempting to exit full-screen mode: ${err.message} (${err.name})`);
           toast({
            variant: "destructive",
            title: "Fullscreen Error",
            description: `Could not exit full-screen mode. ${err.message}`,
          });
        });
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
        // Prevent play/pause if focus is on an input, textarea, or button
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.getAttribute('role') === 'button')) {
          return;
        }
        event.preventDefault();
        togglePlayPause();
      }
      if (event.key === 'Escape' && document.fullscreenElement) {
        document.exitFullscreen().catch(err => {
          console.error(`Error attempting to exit full-screen mode via Escape: ${err.message} (${err.name})`);
          toast({
            variant: "destructive",
            title: "Fullscreen Error",
            description: "Could not exit full-screen mode.", // Simplified message for Escape key
          });
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [togglePlayPause, toast]); // Added toast to dependencies as it's used in the effect


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header
        onOpenScripts={() => setScriptsSheetOpen(true)}
        onOpenSettings={() => setSettingsSheetOpen(true)}
      />

      <main ref={mainRef} className="flex-1 bg-background">
        <TeleprompterView />
      </main>

      <div 
        className="p-4 border-t print:hidden bg-card shadow-md sticky bottom-0 z-20"
        role="toolbar"
        aria-label="Playback Controls and Information"
      >
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

