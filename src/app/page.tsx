
"use client";

import type React from 'react';
import { useEffect, useState } from 'react';
import { useTeleprompterStore } from '@/hooks/useTeleprompterStore';
import { SettingsPanel } from '@/components/promptastic/SettingsPanel';
import { PlaybackControls } from '@/components/promptastic/PlaybackControls';
import { TeleprompterView } from '@/components/promptastic/TeleprompterView';
import { loadFromLocalStorage } from '@/lib/localStorage';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer'; // Import the new footer
import { ScriptManager } from '@/components/promptastic/ScriptManager';
import { Button } from '@/components/ui/button';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { BookOpen, SlidersHorizontal, FileText, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';


export default function PromptasticPage() {
  const { 
    darkMode,
    setDarkMode,
    scripts,
    activeScriptName,
    loadScript: loadScriptFromStore,
    scriptText: currentGlobalScriptText, // get current scriptText from store
  } = useTeleprompterStore();

  // States for controlling the new separate sheets
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
      // Only update if the stored value is different from the current store state
      // This avoids unnecessary re-renders if the store is already correctly initialized
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
    // Ensure script is loaded if an active script name exists but no text is in the store,
    // or if no active script is set but scripts exist (load the first one).
    // This helps ensure the teleprompter view isn't empty on initial load or after a script deletion.
    const storeState = useTeleprompterStore.getState();
    if (storeState.scripts.length > 0) {
      const scriptToLoadName = storeState.activeScriptName && storeState.scripts.some(s => s.name === storeState.activeScriptName)
        ? storeState.activeScriptName
        : storeState.scripts[0].name;

      // Only load if the target script is not already the one in global state's scriptText
      // or if scriptText is empty
      const targetScript = storeState.scripts.find(s => s.name === scriptToLoadName);
      if (targetScript && (storeState.scriptText !== targetScript.content || !storeState.scriptText)) {
        loadScriptFromStore(scriptToLoadName);
      }
    } else if (storeState.scriptText === "" && storeState.activeScriptName) {
      // If activeScriptName is set but scriptText is empty (e.g., after deleting all scripts then undoing), try to reload.
      loadScriptFromStore(storeState.activeScriptName);
    } else if (storeState.scripts.length === 0 && storeState.scriptText !== "" && !storeState.activeScriptName) {
      // If no scripts exist, ensure scriptText is cleared if it's not already reflecting an unsaved state
      // This case might be less common but covers potential edge scenarios
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
      
      {/* New marketing-style footer */}
      <Footer />
    </div>
  );
}
