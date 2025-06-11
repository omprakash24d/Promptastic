
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
import { HelpCircle, Settings, FileText, Play, Mic, Maximize, ListChecks, Palette, Thermometer, AlertTriangle } from 'lucide-react';


export default function PromptasticPage() {
  const {
    darkMode,
    setDarkMode,
    scripts,
    activeScriptName,
    loadScript: loadScriptFromStore,
    togglePlayPause,
  } = useTeleprompterStore();

  const { toast } = useToast();
  const [settingsSheetOpen, setSettingsSheetOpen] = useState(false);
  const [scriptsSheetOpen, setScriptsSheetOpen] = useState(false);
  const [helpSheetOpen, setHelpSheetOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const persistedStore = loadFromLocalStorage('promptastic-store', {darkMode: undefined});
    let initialDarkMode = persistedStore.darkMode;

    if (initialDarkMode === undefined) {
      if (typeof window !== 'undefined') {
        initialDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        initialDarkMode = useTeleprompterStore.getState().darkMode;
      }
    }
    setDarkMode(initialDarkMode);
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
    const { scriptText: currentText, activeScriptName: currentActive, scripts: currentScripts, LONGER_DEFAULT_SCRIPT_TEXT: defaultText } = storeState;
    const actualDefaultText = typeof defaultText === 'string' ? defaultText : "Welcome to Promptastic!";

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
  }, [activeScriptName, scripts, loadScriptFromStore]);


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

  useEffect(() => {
    const fullscreenChangeHandler = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', fullscreenChangeHandler);
    return () => document.removeEventListener('fullscreenchange', fullscreenChangeHandler);
  }, []);

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
      if (event.key === 'Escape' && document.fullscreenElement) {
        document.exitFullscreen().catch(err => {
          console.error(`Error attempting to exit full-screen mode via Escape: ${err.message} (${err.name})`);
          toast({
            variant: "destructive",
            title: "Fullscreen Error",
            description: "Could not exit full-screen mode.",
          });
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [togglePlayPause, toast]);

  const openScriptsSheet = useCallback(() => setScriptsSheetOpen(true), []);
  const openSettingsSheet = useCallback(() => setSettingsSheetOpen(true), []);
  const openHelpSheet = useCallback(() => setHelpSheetOpen(true), []);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <Header
        onOpenScripts={openScriptsSheet}
        onOpenSettings={openSettingsSheet}
        onOpenHelp={openHelpSheet}
      />

      <main ref={mainRef} className="flex-1 bg-background relative">
        <TeleprompterView />
      </main>

      <div
        className="p-4 border-t print:hidden bg-card shadow-md shrink-0"
        role="toolbar"
        aria-label="Playback Controls and Information"
      >
        <PlaybackControls
          isFullScreen={isFullScreen}
          onToggleFullScreen={handleToggleFullScreen}
        />
        <p className="text-xs text-muted-foreground text-center mt-3">
          Designed and developed by{" "}
          <a
            href="https://www.linkedin.com/in/om-prakash-yadav-0731b7256/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary"
          >
            Om Prakash
          </a>
        </p>
      </div>

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
                  <li><strong>Scrolling:</strong> When playing, the script scrolls automatically. You can manually scroll when paused.</li>
                  <li><strong>Visuals:</strong> Adjust font size, line height, text color, font family, and dark/mirror modes in Settings.</li>
                  <li><strong>Focus Line:</strong> A horizontal guide shows your current reading position. Adjust its vertical placement in Settings.</li>
                </ul>
              </section>

              <section aria-labelledby="script-management-heading" className="space-y-3">
                <h3 id="script-management-heading" className="text-lg font-semibold flex items-center"><FileText className="mr-2 h-5 w-5 text-primary"/>Script Management</h3>
                <p>Click the "Scripts" button in the header to open the Script Manager:</p>
                <ul className="list-disc list-outside pl-5 space-y-1">
                  <li><strong>New Script:</strong> Clear the editor for a new script. Type a name and save.</li>
                  <li><strong>Editing:</strong> Modify script text directly in the textarea.</li>
                  <li><strong>Saving:</strong> Save new scripts or update existing ones. Changes are saved automatically if you edit an active script and click save.</li>
                  <li><strong>Loading:</strong> Click a script name from the "Saved Scripts" list to load it.</li>
                  <li><strong>Renaming & Deleting:</strong> Use the icons next to each saved script.</li>
                  <li><strong>Importing:</strong> Click the ".txt", ".pdf", or ".docx" buttons to import scripts from files. The imported content loads into the editor; name it and save.</li>
                  <li><strong>Exporting:</strong> Export the current script as a .txt file.</li>
                </ul>
                 <div className="p-3 bg-muted/50 rounded-md border border-border">
                    <p className="flex items-center text-xs text-muted-foreground"><ListChecks className="mr-2 h-4 w-4"/>Your scripts and settings are automatically saved in your browser's local storage, so they'll be here when you return!</p>
                </div>
              </section>

              <section aria-labelledby="settings-panel-heading" className="space-y-3">
                <h3 id="settings-panel-heading" className="text-lg font-semibold flex items-center"><Settings className="mr-2 h-5 w-5 text-primary"/>Settings Panel</h3>
                <p>Click the "Settings" button (gear icon) in the header to customize your teleprompter experience:</p>
                <h4 className="font-medium flex items-center"><Palette className="mr-2 h-4 w-4"/>Appearance:</h4>
                <ul className="list-disc list-outside pl-5 space-y-1">
                  <li><strong>Font Size:</strong> Adjust text size.</li>
                  <li><strong>Line Spacing:</strong> Change space between lines.</li>
                  <li><strong>Font Family:</strong> Select different fonts.</li>
                  <li><strong>Text Color:</strong> Pick a custom text color (resets if you toggle dark/light mode).</li>
                  <li><strong>Focus Line Position:</strong> Change the vertical position of the reading guide.</li>
                  <li><strong>Mirror Mode:</strong> Flip text horizontally for physical teleprompter setups.</li>
                  <li><strong>Dark Mode:</strong> Toggle between light and dark themes.</li>
                </ul>
                <h4 className="font-medium flex items-center"><Thermometer className="mr-2 h-4 w-4"/>Playback:</h4>
                <ul className="list-disc list-outside pl-5 space-y-1">
                  <li><strong>Scroll Speed:</strong> Control how fast the text scrolls.</li>
                  <li><strong>AI Scroll Sync:</strong> Toggle the AI-powered automatic scroll speed adjustment feature.</li>
                </ul>
              </section>

              <section aria-labelledby="playback-controls-heading" className="space-y-3">
                <h3 id="playback-controls-heading" className="text-lg font-semibold">Playback Controls Bar</h3>
                <p>Located at the bottom of the screen:</p>
                <ul className="list-disc list-outside pl-5 space-y-1">
                  <li><strong>Play/Pause:</strong> Start or stop script scrolling.</li>
                  <li><strong>Reset:</strong> Return the scroll position to the top and pause.</li>
                  <li><strong>AI Sync:</strong> (If enabled in Settings) Click to start recording audio. Speak a few lines, then click "Stop Sync". The app will adjust scroll speed. (Note: Speech analysis is currently a placeholder).</li>
                  <li><strong>Full Screen:</strong> Toggle fullscreen mode for an immersive experience. Press <code className="bg-muted px-1.5 py-0.5 rounded text-xs">Esc</code> to exit.</li>
                </ul>
              </section>
              
              <section aria-labelledby="ai-sync-heading" className="space-y-3">
                 <h3 id="ai-sync-heading" className="text-lg font-semibold flex items-center"><Mic className="mr-2 h-5 w-5 text-primary"/>AI Scroll Sync</h3>
                 <p>This experimental feature attempts to adjust scroll speed based on your voice.</p>
                 <ol className="list-decimal list-outside pl-5 space-y-1">
                    <li>Enable "AI Scroll Sync" in the Settings panel.</li>
                    <li>Click the "AI Sync" button in the playback controls. Your browser may ask for microphone permission.</li>
                    <li>The button will change to "Stop Sync" and indicate recording. Speak a few lines from your script clearly.</li>
                    <li>Click "Stop Sync". The app will analyze the audio (currently mocked) and adjust the scroll speed.</li>
                 </ol>
                 <div className="p-3 bg-destructive/10 text-destructive border border-destructive/30 rounded-md">
                    <p className="flex items-center text-xs"><AlertTriangle className="mr-2 h-4 w-4"/>Microphone access is required. If denied, the feature won't work. The actual speech-to-speed analysis is currently a placeholder and will use a mock speech rate.</p>
                </div>
              </section>

              <section aria-labelledby="fullscreen-heading" className="space-y-3">
                 <h3 id="fullscreen-heading" className="text-lg font-semibold flex items-center"><Maximize className="mr-2 h-5 w-5 text-primary"/>Fullscreen Mode</h3>
                 <p>Click the "Full Screen" button in the playback controls to make the teleprompter view fill your screen. This is ideal for minimizing distractions during delivery.</p>
                 <p>To exit fullscreen mode, click the "Exit Full" button or press the <code className="bg-muted px-1.5 py-0.5 rounded text-xs">Esc</code> key on your keyboard.</p>
              </section>

              <section aria-labelledby="keyboard-shortcuts-heading" className="space-y-3">
                <h3 id="keyboard-shortcuts-heading" className="text-lg font-semibold">Keyboard Shortcuts</h3>
                <ul className="list-disc list-outside pl-5 space-y-1">
                  <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs">Spacebar</code> / <code className="bg-muted px-1.5 py-0.5 rounded text-xs">Backspace</code>: Toggle Play/Pause scrolling. (Not active if typing in an input/textarea).</li>
                  <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs">Esc</code>: Exit Fullscreen mode.</li>
                  <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs">Ctrl+S</code> / <code className="bg-muted px-1.5 py-0.5 rounded text-xs">Cmd+S</code>: Save current script in Script Manager.</li>
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
