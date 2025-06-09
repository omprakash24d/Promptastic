"use client";

import type React from 'react';
import { useEffect, useState } from 'react';
import { useTeleprompterStore } from '@/hooks/useTeleprompterStore';
import { ScriptManager } from '@/components/promptastic/ScriptManager';
import { SettingsPanel } from '@/components/promptastic/SettingsPanel';
import { PlaybackControls } from '@/components/promptastic/PlaybackControls';
import { TeleprompterView } from '@/components/promptastic/TeleprompterView';
import { Button } from '@/components/ui/button';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, SlidersHorizontal, X } from 'lucide-react';
import { loadFromLocalStorage } from '@/lib/localStorage';

export default function PromptasticPage() {
  const { 
    darkMode,
    setDarkMode,
    scripts,
    activeScriptName,
    loadScript: loadScriptFromStore,
  } = useTeleprompterStore();

  const [settingsSheetOpen, setSettingsSheetOpen] = useState(false);
  const [scriptsSheetOpen, setScriptsSheetOpen] = useState(false);

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
      if (scriptToLoad && !useTeleprompterStore.getState().scriptText) { // Load only if scriptText is currently empty
        loadScriptFromStore(scriptToLoad);
      } else if (!activeScriptName && scripts.length > 0 && !useTeleprompterStore.getState().scriptText) {
        loadScriptFromStore(scripts[0].name);
      }
    }
  }, [activeScriptName, scripts, loadScriptFromStore]);


  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground">
      <header className="p-2 border-b flex justify-between items-center print:hidden">
        <h1 className="text-xl font-bold text-primary">Promptastic!</h1>
        <div className="flex gap-2">
          <Sheet open={scriptsSheetOpen} onOpenChange={setScriptsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open script manager">
                <FileText className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
              <SheetHeader className="p-4 border-b">
                <SheetTitle className="text-lg">Manage Scripts</SheetTitle>
                <SheetClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </SheetClose>
              </SheetHeader>
              <ScrollArea className="flex-1 p-4">
                <ScriptManager />
              </ScrollArea>
            </SheetContent>
          </Sheet>

          <Sheet open={settingsSheetOpen} onOpenChange={setSettingsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open settings">
                <SlidersHorizontal className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-sm p-0 flex flex-col">
              <SheetHeader className="p-4 border-b">
                <SheetTitle className="text-lg">Teleprompter Settings</SheetTitle>
                 <SheetClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </SheetClose>
              </SheetHeader>
              <ScrollArea className="flex-1 p-4">
                <SettingsPanel />
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <TeleprompterView />
      </main>

      <footer className="p-2 border-t print:hidden">
        <PlaybackControls />
      </footer>
    </div>
  );
}