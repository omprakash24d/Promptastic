
"use client";

import type React from 'react';
import { useEffect } from 'react';
import { useTeleprompterStore } from '@/hooks/useTeleprompterStore';
import { ScriptManager } from '@/components/promptastic/ScriptManager';
import { SettingsPanel } from '@/components/promptastic/SettingsPanel';
import { PlaybackControls } from '@/components/promptastic/PlaybackControls';
import { TeleprompterView } from '@/components/promptastic/TeleprompterView';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, X } from 'lucide-react'; // Changed Settings to BookOpen
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PromptasticPage() {
  const { 
    isSettingsPanelOpen, 
    setSettingsPanelOpen, 
    darkMode, 
    scripts,
    activeScriptName,
    loadScript: loadScriptFromStore,
  } = useTeleprompterStore();

  // Effect to apply dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Load last active script or first script on mount/data change
  useEffect(() => {
    if (activeScriptName && scripts.some(s => s.name === activeScriptName)) {
      loadScriptFromStore(activeScriptName);
    } else if (scripts.length > 0) {
      loadScriptFromStore(scripts[0].name);
    }
    // If scripts.length is 0 and no activeScriptName, the default scriptText from store initial state will be used.
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
          <SheetContent side="right" className="w-full sm:max-w-md p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle className="text-lg">Settings & Scripts</SheetTitle>
               <SheetClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </SheetClose>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-4rem)]"> {/* Adjust height based on header */}
              <Tabs defaultValue="settings" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                  <TabsTrigger value="scripts">Scripts</TabsTrigger>
                </TabsList>
                <TabsContent value="settings">
                  <SettingsPanel />
                </TabsContent>
                <TabsContent value="scripts">
                  <ScriptManager />
                </TabsContent>
              </Tabs>
            </ScrollArea>
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
