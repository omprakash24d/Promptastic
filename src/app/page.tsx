
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
    scripts,
    activeScriptName,
    loadScript: loadScriptFromStore,
    scriptText: currentGlobalScriptText,
    togglePlayPause,
  } = useTeleprompterStore();

  const { toast } = useToast();
  const [settingsSheetOpen, setSettingsSheetOpen] = useState(false);
  const [scriptsSheetOpen, setScriptsSheetOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const persistedStore = loadFromLocalStorage('promptastic-store', {darkMode: undefined});
    let initialDarkMode = persistedStore.darkMode;

    if (initialDarkMode === undefined) {
      if (typeof window !== 'undefined') {
        initialDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        initialDarkMode = useTeleprompterStore.getState().darkMode; 
      }
    }
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
        loadScriptFromStore(storeState.activeScriptName);
    } else if (storeState.scripts.length === 0 && storeState.scriptText === "" && !storeState.activeScriptName) {
       // Store's initial state handles welcome message.
    }
  }, [activeScriptName, scripts, loadScriptFromStore, currentGlobalScriptText]);


  const handleToggleFullScreen = () => {
    if (!mainRef.current) return;

    if (!document.fullscreenElement) {
      mainRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        toast({
          variant: "destructive",
          title: "Fullscreen Error",
          description: `Could not enter full-screen mode: ${err.message}`,
        });
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => {
           console.error(`Error attempting to exit full-screen mode: ${err.message} (${err.name})`);
           toast({
            variant: "destructive",
            title: "Fullscreen Error",
            description: `Could not exit full-screen mode: ${err.message}`,
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
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.getAttribute('role') === 'button')) {
          return;
        }
        event.preventDefault();
        togglePlayPause();
      }
      if (event.key === 'Escape' && document.fullscreenElement) {
        document.exitFullscreen().catch(err => {
          console.error(`Error attempting to exit full-screen mode via Escape: ${err.message} (${err.name})`);
          // Optionally toast here as well, though browser usually handles Escape well.
        });
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
