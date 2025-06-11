
"use client";

import type React from 'react';
import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link'; // Ensure Link is imported
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
import { Settings, FileText, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PersistedStorePreferences {
  darkMode?: boolean;
  enableHighContrast?: boolean;
}

export default function PromptasticPage() {
  const {
    darkMode, setDarkMode,
    scripts, activeScriptName, loadScript: loadScriptFromStore,
    togglePlayPause,
    resetScroll,
    isPresentationMode, setIsPresentationMode,
    enableHighContrast,
    LONGER_DEFAULT_SCRIPT_TEXT,
  } = useTeleprompterStore();

  const { toast } = useToast();
  const [settingsSheetOpen, setSettingsSheetOpen] = useState(false);
  const [scriptsSheetOpen, setScriptsSheetOpen] = useState(false);
  // Help sheet state is removed as help is now handled by dedicated pages via header dropdown
  const [isFullScreen, setIsFullScreen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const persistedPrefs: PersistedStorePreferences = loadFromLocalStorage<PersistedStorePreferences>(
      'promptastic-store',
      {} 
    );
    
    let resolvedDarkMode: boolean;
    if (typeof persistedPrefs.darkMode === 'boolean') {
      resolvedDarkMode = persistedPrefs.darkMode;
    } else if (typeof window !== 'undefined' && window.matchMedia) {
      resolvedDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      resolvedDarkMode = useTeleprompterStore.getState().darkMode; 
    }
    
    if (useTeleprompterStore.getState().darkMode !== resolvedDarkMode) {
      setDarkMode(resolvedDarkMode);
    }

    let resolvedHighContrast: boolean;
    if (typeof persistedPrefs.enableHighContrast === 'boolean') {
      resolvedHighContrast = persistedPrefs.enableHighContrast;
    } else {
      resolvedHighContrast = useTeleprompterStore.getState().enableHighContrast;
    }

    if (useTeleprompterStore.getState().enableHighContrast !== resolvedHighContrast) {
       useTeleprompterStore.setState({ enableHighContrast: resolvedHighContrast });
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
    if (enableHighContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [enableHighContrast]);


  useEffect(() => {
    const storeState = useTeleprompterStore.getState();
    const { scriptText: currentText, activeScriptName: currentActive, scripts: currentScripts } = storeState;
    const actualDefaultText = typeof LONGER_DEFAULT_SCRIPT_TEXT === 'string' ? LONGER_DEFAULT_SCRIPT_TEXT : "Welcome to Promptastic!";

    if (currentActive && currentScripts.some(s => s.name === currentActive)) {
      const activeScript = currentScripts.find(s => s.name === currentActive)!;
      if (currentText === actualDefaultText || currentText === "") {
        loadScriptFromStore(activeScript.name);
      }
    } else if (currentScripts.length > 0) {
      if (currentText === actualDefaultText || currentText === "") {
        loadScriptFromStore(currentScripts[0].name);
        if(currentActive !== currentScripts[0].name) {
            useTeleprompterStore.setState({ activeScriptName: currentScripts[0].name });
        }
      }
    } else {
      if (currentText !== actualDefaultText) {
        useTeleprompterStore.setState({ scriptText: actualDefaultText, activeScriptName: null, currentScrollPosition: 0 });
      }
    }
  }, [activeScriptName, scripts, loadScriptFromStore, LONGER_DEFAULT_SCRIPT_TEXT]);


  const handleToggleFullScreen = useCallback(() => {
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
  }, [toast]);

  const togglePresentationMode = () => {
    setIsPresentationMode(!isPresentationMode);
    if (!isPresentationMode && !document.fullscreenElement && mainRef.current) {
      mainRef.current.requestFullscreen().catch(err => {
        toast({
          variant: "destructive",
          title: "Fullscreen Error",
          description: `Could not enter full-screen mode for Presentation Mode. ${err.message}`,
        });
      });
    } else if (isPresentationMode && document.fullscreenElement) {
       if (document.exitFullscreen) document.exitFullscreen().catch(console.error);
    }
  };


  useEffect(() => {
    const fullscreenChangeHandler = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullScreen(isCurrentlyFullscreen);
      if (!isCurrentlyFullscreen && isPresentationMode) {
        setIsPresentationMode(false);
      }
    };
    document.addEventListener('fullscreenchange', fullscreenChangeHandler);
    return () => document.removeEventListener('fullscreenchange', fullscreenChangeHandler);
  }, [isPresentationMode, setIsPresentationMode]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isTyping = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.getAttribute('role') === 'textbox');

      if ((event.code === 'Space' || event.code === 'Backspace') && !isTyping) {
        event.preventDefault();
        togglePlayPause();
      } else if (event.key.toUpperCase() === 'R' && !isTyping && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        resetScroll();
        toast({ title: "Scroll Reset", description: "Teleprompter scroll position has been reset to the beginning." });
      } else if (event.key.toUpperCase() === 'F' && !isTyping) {
        event.preventDefault();
        handleToggleFullScreen();
      } else if (event.key === 'Escape') {
        if (isPresentationMode) {
            setIsPresentationMode(false);
        }
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(err => {
            console.error(`Error attempting to exit full-screen mode via Escape: ${err.message} (${err.name})`);
            toast({
                variant: "destructive",
                title: "Fullscreen Error",
                description: "Could not exit full-screen mode.",
            });
            });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [togglePlayPause, resetScroll, toast, isPresentationMode, setIsPresentationMode, handleToggleFullScreen]);

  const openScriptsSheet = useCallback(() => setScriptsSheetOpen(true), []);
  const openSettingsSheet = useCallback(() => setSettingsSheetOpen(true), []);

  return (
    <div className={cn("flex flex-col h-screen bg-background text-foreground overflow-hidden", isPresentationMode && "presentation-mode-active")}>
      {!isPresentationMode && (
        <Header
          onOpenScripts={openScriptsSheet}
          onOpenSettings={openSettingsSheet}
        />
      )}

      <main ref={mainRef} className="flex-1 bg-background relative overflow-hidden">
        <TeleprompterView />
      </main>

      {!isPresentationMode && (
        <div
          className="p-4 border-t print:hidden bg-card shadow-md shrink-0"
          role="toolbar"
          aria-label="Playback Controls and Information"
        >
          <PlaybackControls
            isFullScreen={isFullScreen}
            onToggleFullScreen={handleToggleFullScreen}
          />
          <footer className="mt-6 text-center text-muted-foreground text-sm leading-relaxed">
            Designed and developed by{" "}
            <a
              href="https://www.instagram.com/omprakash24d/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary font-medium transition-colors duration-200"
            >
              Om Prakash
            </a>
          </footer>
        </div>
      )}
      {isPresentationMode && (
         <div className="fixed bottom-4 right-4 z-50 opacity-20 hover:opacity-100 transition-opacity">
            <Button
                onClick={togglePresentationMode}
                variant="ghost"
                size="icon"
                title="Exit Presentation Mode (Esc)"
                className="bg-black/30 hover:bg-black/50 text-white rounded-full h-10 w-10"
                aria-label="Exit Presentation Mode"
            >
                <Maximize className="h-5 w-5" />
            </Button>
        </div>
      )}


      <Sheet open={scriptsSheetOpen} onOpenChange={setScriptsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="text-lg flex items-center"><FileText className="mr-2 h-5 w-5" />Manage Scripts</SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1 p-4">
            <ScriptManager />
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <Sheet open={settingsSheetOpen} onOpenChange={setSettingsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-sm p-0 flex flex-col">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="text-lg flex items-center"><Settings className="mr-2 h-5 w-5" />Teleprompter Settings</SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1 p-4">
            <SettingsPanel />
          </ScrollArea>
        </SheetContent>
      </Sheet>

    </div>
  );
}
