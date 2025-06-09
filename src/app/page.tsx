
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
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { FileText, SlidersHorizontal, X, Maximize, Minimize } from 'lucide-react';
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
    const storeState = useTeleprompterStore.getState();
    if (storeState.scripts.length > 0) {
      const scriptToLoadName = storeState.activeScriptName && storeState.scripts.some(s => s.name === storeState.activeScriptName)
        ? storeState.activeScriptName
        : storeState.scripts[0].name;

      const targetScript = storeState.scripts.find(s => s.name === scriptToLoadName);
      if (targetScript && (storeState.scriptText !== targetScript.content || !storeState.scriptText)) {
        loadScriptFromStore(scriptToLoadName);
      }
    } else if (storeState.scriptText === "" && storeState.activeScriptName) {
      // If no scripts exist but an activeScriptName is somehow set (e.g. last script deleted), clear it.
      // Or if it was the very first load and activeScriptName got set from storage with no actual scripts
      loadScriptFromStore(storeState.activeScriptName); // This might clear scriptText if script not found
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
          // Don't interfere if typing in an input, textarea, or a button is focused
          return;
        }
        event.preventDefault();
        togglePlayPause();
      }
       // Optional: Esc to exit fullscreen
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
      </div>
      
      <Sheet open={scriptsSheetOpen} onOpenChange={setScriptsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
           <SheetHeader className="p-4 border-b">
            <SheetTitle className="text-lg">Manage Scripts</SheetTitle>
          </SheetHeader>
          <SheetClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
          </SheetClose>
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
          <SheetClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
          </SheetClose>
          <ScrollArea className="flex-1 p-4">
            <SettingsPanel />
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}

