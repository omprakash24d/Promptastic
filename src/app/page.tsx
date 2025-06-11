
"use client";

import type React from 'react';
import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link'; 
import { useRouter } from 'next/navigation';
import { useTeleprompterStore } from '@/hooks/useTeleprompterStore';
import { useAuth } from '@/contexts/AuthContext';
import { SettingsPanel } from '@/components/promptastic/SettingsPanel';
import { PlaybackControls } from '@/components/promptastic/PlaybackControls';
import type { PlaybackControlsHandle } from '@/components/promptastic/PlaybackControls';
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

const FONT_SIZE_STEP = 2;
const SCROLL_SPEED_STEP = 5;
const FULLSCREEN_AUTOSTART_COUNTDOWN = 3;

interface PersistedStorePreferences {
  darkMode?: boolean;
  enableHighContrast?: boolean;
}

export default function PromptasticPage() {
  const {
    darkMode, setDarkMode,
    scripts, activeScriptName, loadScript: loadScriptFromStore,
    togglePlayPause, isPlaying, setIsPlaying,
    resetScroll,
    isPresentationMode, setIsPresentationMode,
    enableHighContrast,
    LONGER_DEFAULT_SCRIPT_TEXT,
    setFontSize,
    setScrollSpeed,
    setCountdownValue,
    scriptText,
  } = useTeleprompterStore();

  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();

  const [settingsSheetOpen, setSettingsSheetOpen] = useState(false);
  const [scriptsSheetOpen, setScriptsSheetOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const playbackControlsRef = useRef<PlaybackControlsHandle>(null);


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

    const store = useTeleprompterStore.getState();

    if (!document.fullscreenElement) {
      mainRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        toast({
          variant: "destructive",
          title: "Fullscreen Error",
          description: `Could not enter full-screen mode. ${err.message}`,
        });
      }).then(() => {
        // After successfully entering fullscreen
        if (!store.isPlaying && store.scriptText.trim() && store.scriptText !== store.LONGER_DEFAULT_SCRIPT_TEXT) {
           toast({ title: `Starting playback in ${FULLSCREEN_AUTOSTART_COUNTDOWN} seconds...`, description: "Press Space/Backspace to cancel." });
           store.setCountdownValue(FULLSCREEN_AUTOSTART_COUNTDOWN);
        }
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

      if (event.altKey) { // Global Alt-based shortcuts
        switch (event.key.toUpperCase()) {
          case 'S':
            if (scriptsSheetOpen) setScriptsSheetOpen(false); else openScriptsSheet();
            event.preventDefault();
            break;
          case 'E': // E for sEttings
            if (settingsSheetOpen) setSettingsSheetOpen(false); else openSettingsSheet();
            event.preventDefault();
            break;
          case 'T':
            setDarkMode(!useTeleprompterStore.getState().darkMode);
            toast({ description: `Dark mode ${useTeleprompterStore.getState().darkMode ? 'enabled' : 'disabled'}.` });
            event.preventDefault();
            break;
          case 'L':
            if (!user && window.location.pathname !== '/login') router.push('/login');
            event.preventDefault();
            break;
          case 'H':
            if (window.location.pathname !== '/how-to-use') router.push('/how-to-use');
            event.preventDefault();
            break;
          case 'M':
            if (playbackControlsRef.current?.triggerSummary) {
              playbackControlsRef.current.triggerSummary();
            } else {
              toast({ title: "Summary", description: "Summary feature not available here or script is empty.", variant: "default" });
            }
            event.preventDefault();
            break;
        }
        return; // Return early if an Alt-key shortcut was handled
      }

      if (isTyping) return; // Do not process other shortcuts if typing

      if ((event.code === 'Space' || event.code === 'Backspace')) {
        event.preventDefault();
        togglePlayPause();
      } else if (event.key.toUpperCase() === 'R' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        resetScroll();
        toast({ title: "Scroll Reset", description: "Teleprompter scroll position has been reset to the beginning." });
      } else if (event.key.toUpperCase() === 'F') {
        event.preventDefault();
        handleToggleFullScreen();
      } else if (event.key === '[') { 
        event.preventDefault();
        const oldSpeed = useTeleprompterStore.getState().scrollSpeed;
        setScrollSpeed(prev => Math.max(1, prev - SCROLL_SPEED_STEP));
        if (useTeleprompterStore.getState().scrollSpeed !== oldSpeed) {
         toast({ description: `Scroll speed decreased to ${useTeleprompterStore.getState().scrollSpeed}.` });
        }
      } else if (event.key === ']') { 
        event.preventDefault();
        const oldSpeed = useTeleprompterStore.getState().scrollSpeed;
        setScrollSpeed(prev => Math.min(200, prev + SCROLL_SPEED_STEP));
        if (useTeleprompterStore.getState().scrollSpeed !== oldSpeed) {
          toast({ description: `Scroll speed increased to ${useTeleprompterStore.getState().scrollSpeed}.` });
        }
      } else if (event.key === '-') { 
        event.preventDefault();
        const oldSize = useTeleprompterStore.getState().fontSize;
        setFontSize(prev => Math.max(12, prev - FONT_SIZE_STEP));
         if (useTeleprompterStore.getState().fontSize !== oldSize) {
          toast({ description: `Font size decreased to ${useTeleprompterStore.getState().fontSize}px.` });
        }
      } else if (event.key === '=') { 
        event.preventDefault();
        const oldSize = useTeleprompterStore.getState().fontSize;
        setFontSize(prev => Math.min(150, prev + FONT_SIZE_STEP));
        if (useTeleprompterStore.getState().fontSize !== oldSize) {
          toast({ description: `Font size increased to ${useTeleprompterStore.getState().fontSize}px.` });
        }
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
  }, [
    togglePlayPause, resetScroll, toast, isPresentationMode, setIsPresentationMode, 
    handleToggleFullScreen, setFontSize, setScrollSpeed,
    scriptsSheetOpen, settingsSheetOpen, router, user, setDarkMode // Added dependencies for new shortcuts
  ]);

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
            ref={playbackControlsRef}
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

