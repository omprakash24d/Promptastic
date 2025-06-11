
"use client";

import type React from 'react';
import { useEffect, useState, useRef, useCallback } from 'react';
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
import { HelpCircle, Settings, FileText, Play, Mic, Maximize, ListChecks, Palette, Thermometer, AlertTriangle, MonitorPlay, LayoutList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';


export default function PromptasticPage() {
  const {
    darkMode, setDarkMode,
    scripts, activeScriptName, loadScript: loadScriptFromStore,
    togglePlayPause,
    isPresentationMode, setIsPresentationMode,
    enableHighContrast,
    LONGER_DEFAULT_SCRIPT_TEXT, // Get default text from store
  } = useTeleprompterStore();

  const { toast } = useToast();
  const [settingsSheetOpen, setSettingsSheetOpen] = useState(false);
  const [scriptsSheetOpen, setScriptsSheetOpen] = useState(false);
  const [helpSheetOpen, setHelpSheetOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Define the expected shape of the data from localStorage
    interface PersistedStorePreferences {
      darkMode?: boolean;
      enableHighContrast?: boolean;
    }

    // Provide a default that matches this shape if nothing is found
    const persistedPrefs = loadFromLocalStorage<PersistedStorePreferences>(
      'promptastic-store', // This is the key used by useTeleprompterStore persist middleware
      {} // Default to an empty object if no store found or error
    );

    let resolvedDarkMode: boolean;
    if (typeof persistedPrefs.darkMode === 'boolean') {
      resolvedDarkMode = persistedPrefs.darkMode;
    } else if (typeof window !== 'undefined') {
      // Fallback to system preference if not in localStorage
      resolvedDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      // Final fallback to current store state (e.g., for SSR or if window is somehow undefined)
      resolvedDarkMode = useTeleprompterStore.getState().darkMode;
    }

    // Only update if the resolved value differs from the current store state
    if (useTeleprompterStore.getState().darkMode !== resolvedDarkMode) {
      setDarkMode(resolvedDarkMode);
    }

    let resolvedHighContrast: boolean;
    if (typeof persistedPrefs.enableHighContrast === 'boolean') {
      resolvedHighContrast = persistedPrefs.enableHighContrast;
    } else {
      // Fallback to current store state
      resolvedHighContrast = useTeleprompterStore.getState().enableHighContrast;
    }

    // Only update if the resolved value differs from the current store state
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
    // LONGER_DEFAULT_SCRIPT_TEXT is accessed from the initial destructuring of useTeleprompterStore
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
      // This condition handles the case where there are no scripts
      // and ensures the scriptText is set to default if it's not already.
      if (currentText !== actualDefaultText) {
        useTeleprompterStore.setState({ scriptText: actualDefaultText, activeScriptName: null, currentScrollPosition: 0 });
      }
    }
  }, [activeScriptName, scripts, loadScriptFromStore, LONGER_DEFAULT_SCRIPT_TEXT]);


  const handleToggleFullScreen = () => {
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
  };
  
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
        // If exiting fullscreen externally while in presentation mode, also exit presentation mode
        setIsPresentationMode(false);
      }
    };
    document.addEventListener('fullscreenchange', fullscreenChangeHandler);
    return () => document.removeEventListener('fullscreenchange', fullscreenChangeHandler);
  }, [isPresentationMode, setIsPresentationMode]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.code === 'Backspace') {
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.getAttribute('role') === 'button')) {
          return;
        }
        event.preventDefault();
        togglePlayPause();
      }
      if (event.key === 'Escape') {
        if (isPresentationMode) {
            setIsPresentationMode(false); // Exit presentation mode first
        }
        if (document.fullscreenElement) { // Then exit fullscreen if still active
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
  }, [togglePlayPause, toast, isPresentationMode, setIsPresentationMode]);

  const openScriptsSheet = useCallback(() => setScriptsSheetOpen(true), []);
  const openSettingsSheet = useCallback(() => setSettingsSheetOpen(true), []);
  const openHelpSheet = useCallback(() => setHelpSheetOpen(true), []);

  return (
    <div className={cn("flex flex-col h-screen bg-background text-foreground overflow-hidden", isPresentationMode && "presentation-mode-active")}>
      {!isPresentationMode && (
        <Header
          onOpenScripts={openScriptsSheet}
          onOpenSettings={openSettingsSheet}
          onOpenHelp={openHelpSheet}
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
            isPresentationMode={isPresentationMode}
            onTogglePresentationMode={togglePresentationMode}
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
            >
                <Maximize className="h-5 w-5" /> {/* Using Maximize as "exit" icon here */}
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

      <Sheet open={helpSheetOpen} onOpenChange={setHelpSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col overflow-y-auto">
          <SheetHeader className="p-4 border-b sticky top-0 bg-background z-10">
            <SheetTitle className="text-lg flex items-center">
              <HelpCircle className="mr-2 h-5 w-5" />
              About Promptastic! & How to Use
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6 text-sm">
              <section aria-labelledby="welcome-heading">
                <h3 id="welcome-heading" className="text-xl font-semibold mb-2">Welcome to Promptastic!</h3>
                <p>Promptastic is a high-performance teleprompter application designed to make your presentations, recordings, and speeches smooth and professional.</p>
              </section>

              <section aria-labelledby="teleprompter-view-heading" className="space-y-3">
                <h3 id="teleprompter-view-heading" className="text-lg font-semibold flex items-center"><Play className="mr-2 h-5 w-5 text-primary"/>Teleprompter View & Core Playback</h3>
                <p>The main area displays your script. Use the playback controls or keyboard shortcuts to manage scrolling:</p>
                <ul className="list-disc list-outside pl-5 space-y-1">
                  <li><strong>Play/Pause:</strong> Click the Play/Pause button or press <code className="bg-muted px-1.5 py-0.5 rounded text-xs">Spacebar</code> or <code className="bg-muted px-1.5 py-0.5 rounded text-xs">Backspace</code>.</li>
                  <li><strong>Scrolling:</strong> When playing, the script scrolls automatically. You can manually scroll when paused. Click a paragraph while paused to set it as the new starting point.</li>
                  <li><strong>Visuals:</strong> Adjust font size, line height, text color, font family, horizontal padding, and dark/mirror modes in Settings.</li>
                  <li><strong>Focus Line/Area:</strong> A horizontal guide or shaded paragraph shows your current reading position. Adjust its vertical placement and style in Settings.</li>
                  <li><strong>Countdown:</strong> Optionally enable a countdown timer (1-60s) in Settings before playback starts.</li>
                  <li><strong>Rich Text:</strong> Use `**bold**`, `*italic*`, `_underline_`, and `//CUES//` like `//PAUSE//`, `//EMPHASIZE//` (colors text), `//SLOWDOWN//`.</li>
                </ul>
              </section>

              <section aria-labelledby="script-management-heading" className="space-y-3">
                <h3 id="script-management-heading" className="text-lg font-semibold flex items-center"><FileText className="mr-2 h-5 w-5 text-primary"/>Script Management</h3>
                <p>Click the "Scripts" button in the header to open the Script Manager:</p>
                <ul className="list-disc list-outside pl-5 space-y-1">
                  <li><strong>New Script:</strong> Clear the editor for a new script. Type a name and save.</li>
                  <li><strong>Editing:</strong> Modify script text directly in the textarea. Estimated reading time is shown.</li>
                  <li><strong>Saving:</strong> Save new scripts or update existing ones. Changes are saved automatically if you edit an active script and click save.</li>
                  <li><strong>Loading:</strong> Click a script name from the "Saved Scripts" list to load it.</li>
                  <li><strong>Renaming & Deleting:</strong> Use the icons next to each saved script.</li>
                  <li><strong>Importing:</strong> Click the ".txt", ".pdf", ".md", or ".docx" buttons to import scripts from files.</li>
                  <li><strong>Exporting:</strong> Export the current script as a .txt file.</li>
                  <li><strong>Script Versions:</strong> Save multiple versions of a script with notes. Load any version back into the editor.</li>
                  <li><strong>AI Summary:</strong> Generate an AI-powered summary of your script (available in Script Manager and footer controls).</li>
                </ul>
                 <div className="p-3 bg-muted/50 rounded-md border border-border">
                    <p className="flex items-center text-xs text-muted-foreground"><ListChecks className="mr-2 h-4 w-4"/>Your scripts, versions, and settings (including custom profiles) are automatically saved in your browser's local storage or synced with Firestore if logged in.</p>
                </div>
              </section>

              <section aria-labelledby="settings-panel-heading" className="space-y-3">
                <h3 id="settings-panel-heading" className="text-lg font-semibold flex items-center"><Settings className="mr-2 h-5 w-5 text-primary"/>Settings Panel</h3>
                <p>Click the "Settings" button (gear icon) in the header to customize your teleprompter experience:</p>
                <h4 className="font-medium flex items-center"><LayoutList className="mr-2 h-4 w-4"/>Layout & Profiles:</h4>
                 <ul className="list-disc list-outside pl-5 space-y-1">
                    <li><strong>Layout Presets:</strong> Quickly apply predefined sets of visual settings.</li>
                    <li><strong>Settings Profiles:</strong> Save your current combination of settings as a named profile. Load, rename, or delete your custom profiles.</li>
                 </ul>
                <h4 className="font-medium flex items-center"><Palette className="mr-2 h-4 w-4"/>Appearance:</h4>
                <ul className="list-disc list-outside pl-5 space-y-1">
                  <li><strong>Font Size, Line Spacing, Font Family:</strong> Customize text appearance. Includes "Atkinson Hyperlegible" font for readability.</li>
                  <li><strong>Text Color:</strong> Pick a custom text color (managed by High Contrast mode if active).</li>
                  <li><strong>Horizontal Padding:</strong> Adjust side margins for the text area.</li>
                  <li><strong>Focus Line Position & Style:</strong> Change the vertical position and style (line or shaded paragraph) of the reading guide.</li>
                  <li><strong>Mirror Mode:</strong> Flip text horizontally.</li>
                  <li><strong>Dark Mode & High Contrast Mode:</strong> Toggle between light/dark themes and a high-contrast theme for accessibility.</li>
                </ul>
                <h4 className="font-medium flex items-center"><Thermometer className="mr-2 h-4 w-4"/>Playback:</h4>
                <ul className="list-disc list-outside pl-5 space-y-1">
                  <li><strong>Scroll Speed:</strong> Control how fast the text scrolls.</li>
                  <li><strong>AI Scroll Sync:</strong> Toggle the AI-powered automatic scroll speed adjustment feature.</li>
                  <li><strong>Countdown Timer & Duration:</strong> Enable and set a countdown (1-60s) before scrolling starts.</li>
                </ul>
                 <h4 className="font-medium">General:</h4>
                 <ul className="list-disc list-outside pl-5 space-y-1">
                    <li><strong>Reset All Settings:</strong> Reverts core appearance and playback settings to 'Default' preset values.</li>
                 </ul>
              </section>

              <section aria-labelledby="playback-controls-heading" className="space-y-3">
                <h3 id="playback-controls-heading" className="text-lg font-semibold">Playback Controls Bar</h3>
                <p>Located at the bottom of the screen (hidden in Presentation Mode):</p>
                <ul className="list-disc list-outside pl-5 space-y-1">
                  <li><strong>Play/Pause:</strong> Start or stop script scrolling.</li>
                  <li><strong>Reset:</strong> Return the scroll position to the top and pause.</li>
                  <li><strong>AI Sync:</strong> (If enabled) Click to start/stop audio recording for scroll speed adjustment.</li>
                  <li><strong>Summary:</strong> Get an AI-generated summary of the current script.</li>
                  <li><strong>Full Screen:</strong> Toggle standard fullscreen mode.</li>
                  <li><strong>Presentation Mode:</strong> Toggle a distraction-free, minimal UI fullscreen mode.</li>
                </ul>
              </section>
              
              <section aria-labelledby="ai-sync-heading" className="space-y-3">
                 <h3 id="ai-sync-heading" className="text-lg font-semibold flex items-center"><Mic className="mr-2 h-5 w-5 text-primary"/>AI Scroll Sync</h3>
                 <p>This experimental feature attempts to adjust scroll speed based on your voice. Enable in Settings, then use the "AI Sync" button in playback controls.</p>
                 <div className="p-3 bg-destructive/10 text-destructive border border-destructive/30 rounded-md">
                    <p className="flex items-center text-xs"><AlertTriangle className="mr-2 h-4 w-4"/>Microphone access is required. The actual speech-to-speed analysis is currently a placeholder.</p>
                </div>
              </section>

              <section aria-labelledby="fullscreen-modes-heading" className="space-y-3">
                 <h3 id="fullscreen-modes-heading" className="text-lg font-semibold flex items-center"><Maximize className="mr-2 h-5 w-5 text-primary"/>Fullscreen & Presentation Modes</h3>
                 <p><strong>Fullscreen Mode:</strong> Click the "Full Screen" button to make the teleprompter view fill your screen. Press <code className="bg-muted px-1.5 py-0.5 rounded text-xs">Esc</code> to exit.</p>
                 <p><strong>Presentation Mode:</strong> Click the "Present" button (<MonitorPlay className="inline h-4 w-4"/> icon) for an even more immersive, distraction-free experience. This mode also goes fullscreen and hides all UI except the script and a subtle exit button. Press <code className="bg-muted px-1.5 py-0.5 rounded text-xs">Esc</code> to exit.</p>
              </section>

              <section aria-labelledby="keyboard-shortcuts-heading" className="space-y-3">
                <h3 id="keyboard-shortcuts-heading" className="text-lg font-semibold">Keyboard Shortcuts</h3>
                <ul className="list-disc list-outside pl-5 space-y-1">
                  <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs">Spacebar</code> / <code className="bg-muted px-1.5 py-0.5 rounded text-xs">Backspace</code>: Toggle Play/Pause scrolling.</li>
                  <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs">Esc</code>: Exit Fullscreen or Presentation mode.</li>
                  <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs">Ctrl+S</code> / <code className="bg-muted px-1.5 py-0.5 rounded text-xs">Cmd+S</code>: Save current script in Script Manager (if focus is within script manager context).</li>
                </ul>
              </section>

              <section aria-labelledby="about-dev-heading" className="space-y-1">
                <h3 id="about-dev-heading" className="text-lg font-semibold">About the Developer</h3>
                <p>Promptastic! was designed and developed by Om Prakash. You can find more about his work on LinkedIn.</p>
              </section>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

    </div>
  );
}

    