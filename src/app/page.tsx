
"use client";

import type React from 'react';
import { useEffect } from 'react';
import { useTeleprompterStore } from '@/hooks/useTeleprompterStore';
import { ScriptManager } from '@/components/promptastic/ScriptManager';
import { SettingsPanel } from '@/components/promptastic/SettingsPanel';
import { PlaybackControls } from '@/components/promptastic/PlaybackControls';
import { TeleprompterView } from '@/components/promptastic/TeleprompterView';
import { Button } from '@/components/ui/button';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { loadFromLocalStorage } from '@/lib/localStorage'; // Import loadFromLocalStorage

export default function PromptasticPage() {
  const { 
    isSettingsPanelOpen, 
    setSettingsPanelOpen, 
    darkMode,
    setDarkMode, // Added setDarkMode
    scripts,
    activeScriptName,
    loadScript: loadScriptFromStore,
  } = useTeleprompterStore();

  useEffect(() => {
    // Initialize darkMode based on localStorage or system preference
    // This runs after the store is initialized and potentially rehydrated by `persist`
    const settingsFromStorage = loadFromLocalStorage('promptastic-store', {darkMode: undefined});
    
    if (settingsFromStorage.darkMode === undefined) { // If darkMode was not in localStorage
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      // Only update if system preference is different from the current store's darkMode.
      // The store's darkMode at this point is either the SSR default or what persist loaded if this effect runs after persist.
      // Calling setDarkMode will ensure consistency (e.g. for textColor).
      if (systemPrefersDark !== useTeleprompterStore.getState().darkMode) {
         setDarkMode(systemPrefersDark);
      }
    } else {
      // If darkMode was in localStorage, `persist` middleware has already updated the store.
      // We call setDarkMode with the persisted value to ensure textColor logic runs.
      // This is safe because setDarkMode is idempotent if the value is already correct.
      if (settingsFromStorage.darkMode !== useTeleprompterStore.getState().darkMode) {
        setDarkMode(settingsFromStorage.darkMode);
      }
    }
  }, [setDarkMode]);

  useEffect(() => {
    // Apply the 'dark' class to the HTML element based on the darkMode state
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    // Load initial or persisted active script
    if (scripts.length > 0) {
      const scriptToLoad = activeScriptName && scripts.some(s => s.name === activeScriptName)
        ? activeScriptName
        : scripts[0].name;
      if (scriptToLoad) {
        loadScriptFromStore(scriptToLoad);
      }
    }
  }, [activeScriptName, scripts, loadScriptFromStore]);


  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground">
      <header className="p-2 border-b flex justify-between items-center print:hidden">
        <h1 className="text-xl font-bold text-primary">Promptastic!</h1>
        <Sheet open={isSettingsPanelOpen} onOpenChange={setSettingsPanelOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Open settings and script manager">
              <BookOpen className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
            <SheetHeader className="p-4 border-b">
              <SheetTitle className="text-lg">Settings & Scripts</SheetTitle>
              <SheetClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </SheetClose>
            </SheetHeader>
            <Tabs defaultValue="settings" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-2 sticky top-0 bg-background z-10 p-1 border-b">
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="scripts">Scripts</TabsTrigger>
              </TabsList>
              <ScrollArea className="flex-1 p-4">
                <TabsContent value="settings" className="p-0 mt-0">
                  <SettingsPanel />
                </TabsContent>
                <TabsContent value="scripts" className="p-0 mt-0">
                  <ScriptManager />
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </SheetContent>
        </Sheet>
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
