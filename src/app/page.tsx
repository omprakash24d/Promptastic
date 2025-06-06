
"use client";

import type React from 'react';
import { useEffect } from 'react';
import { useTeleprompterStore } from '@/hooks/useTeleprompterStore';
import { ScriptManager } from '@/components/promptastic/ScriptManager';
import { SettingsPanel } from '@/components/promptastic/SettingsPanel';
import { PlaybackControls } from '@/components/promptastic/PlaybackControls';
import { TeleprompterView } from '@/components/promptastic/TeleprompterView';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, X } from 'lucide-react';
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

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    if (scripts.length > 0) {
      if (activeScriptName && scripts.some(s => s.name === activeScriptName)) {
        loadScriptFromStore(activeScriptName);
      } else {
        loadScriptFromStore(scripts[0].name);
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
              <ScrollArea className="flex-1">
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
