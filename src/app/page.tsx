
"use client";

import type React from 'react';
import { useEffect, useState } from 'react';
import { useTeleprompterStore } from '@/hooks/useTeleprompterStore';
import { SettingsPanel } from '@/components/promptastic/SettingsPanel';
import { PlaybackControls } from '@/components/promptastic/PlaybackControls';
import { TeleprompterView } from '@/components/promptastic/TeleprompterView';
import { loadFromLocalStorage } from '@/lib/localStorage';
import Header from '@/components/layout/Header';
import { ScriptManager } from '@/components/promptastic/ScriptManager';
import { Button } from '@/components/ui/button';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { FileText, SlidersHorizontal, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';


export default function PromptasticPage() {
  const { 
    darkMode,
    setDarkMode,
    scripts,
    activeScriptName,
    loadScript: loadScriptFromStore,
    scriptText: currentGlobalScriptText, 
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
      loadScriptFromStore(storeState.activeScriptName);
    }
  }, [activeScriptName, scripts, loadScriptFromStore, currentGlobalScriptText]);


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />

      <main className="flex-1">
        <TeleprompterView />
      </main>

      {/* Functional app footer for controls */}
      <div className="p-4 border-t print:hidden bg-card shadow-md sticky bottom-0 z-20">
        <PlaybackControls />
      </div>
      
    </div>
  );
}
