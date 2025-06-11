
"use client";

import type React from 'react';
import { useEffect, useState, useRef, useCallback } from 'react';
import type { Metadata } from 'next'; // Import Metadata type for page-specific metadata
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
import { HelpCircle, Settings, FileText, Play, Mic, Maximize, ListChecks, Palette, Thermometer, AlertTriangle, MonitorPlay, LayoutList, Info, Mail, ShieldCheck, Gavel, Hammer } from 'lucide-react'; // Added Info, Mail, ShieldCheck, Gavel, Hammer
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';


export default function PromptasticPage() {
  const {
    darkMode, setDarkMode,
    scripts, activeScriptName, loadScript: loadScriptFromStore,
    togglePlayPause,
    isPresentationMode, setIsPresentationMode,
    enableHighContrast,
    LONGER_DEFAULT_SCRIPT_TEXT,
  } = useTeleprompterStore();

  const { toast } = useToast();
  const [settingsSheetOpen, setSettingsSheetOpen] = useState(false);
  const [scriptsSheetOpen, setScriptsSheetOpen] = useState(false);
  const [helpSheetOpen, setHelpSheetOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    interface PersistedStorePreferences {
      darkMode?: boolean;
      enableHighContrast?: boolean;
    }

    const persistedPrefs = loadFromLocalStorage<PersistedStorePreferences>(
      'promptastic-store',
      {}
    );

    let resolvedDarkMode: boolean;
    if (typeof persistedPrefs.darkMode === 'boolean') {
      resolvedDarkMode = persistedPrefs.darkMode;
    } else if (typeof window !== 'undefined') {
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

      <Sheet open={helpSheetOpen} onOpenChange={setHelpSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col overflow-y-auto">
          <SheetHeader className="p-4 border-b sticky top-0 bg-background z-10">
            <SheetTitle className="text-lg flex items-center">
              <Hammer className="mr-2 h-5 w-5" /> {/* Changed icon */}
              Help & Information
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6 text-sm">
              
              <section aria-labelledby="about-tool-heading" className="space-y-3">
                <h3 id="about-tool-heading" className="text-xl font-semibold mb-3 flex items-center"><Info className="mr-2 h-5 w-5 text-primary"/>About Promptastic! & How to Use</h3>
                <p>Promptastic is a high-performance teleprompter application designed to make your presentations, recordings, and speeches smooth and professional.</p>
                 <h4 className="font-medium flex items-center pt-2"><Play className="mr-2 h-5 w-5"/>Teleprompter View & Core Playback</h4>
                <ul className="list-disc list-outside pl-5 space-y-1">
                  <li><strong>Play/Pause:</strong> Click the Play/Pause button or press <code className="bg-muted px-1.5 py-0.5 rounded text-xs">Spacebar</code> or <code className="bg-muted px-1.5 py-0.5 rounded text-xs">Backspace</code>.</li>
                  <li><strong>Scrolling:</strong> When playing, the script scrolls automatically. You can manually scroll when paused. Click a paragraph while paused to set it as the new starting point.</li>
                  <li><strong>Visuals:</strong> Adjust font size, line height, text color, font family, horizontal padding, and dark/mirror modes in Settings.</li>
                  <li><strong>Focus Line/Area:</strong> A horizontal guide or shaded paragraph shows your current reading position. Adjust its vertical placement and style in Settings.</li>
                  <li><strong>Countdown:</strong> Optionally enable a countdown timer (1-60s) in Settings before playback starts.</li>
                  <li><strong>Rich Text:</strong> Use `**bold**`, `*italic*`, `_underline_`, and `//CUES//` like `//PAUSE//`, `//EMPHASIZE//` (colors text), `//SLOWDOWN//`.</li>
                </ul>
                 <h4 className="font-medium flex items-center pt-2"><FileText className="mr-2 h-5 w-5"/>Script Management</h4>
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
                 <div className="p-3 bg-muted/50 rounded-md border border-border mt-2">
                    <p className="flex items-center text-xs text-muted-foreground"><ListChecks className="mr-2 h-4 w-4"/>Your scripts, versions, and settings (including custom profiles) are automatically saved in your browser's local storage or synced with Firestore if logged in.</p>
                </div>
                <h4 className="font-medium flex items-center pt-2"><Settings className="mr-2 h-5 w-5"/>Settings Panel</h4>
                 <ul className="list-disc list-outside pl-5 space-y-1">
                    <li><strong>Layout Presets & Profiles:</strong> Quickly apply predefined visual settings or save/load your custom configurations.</li>
                    <li><strong>Appearance:</strong> Customize font size, line spacing, font family, text color, horizontal padding, focus line position/style, mirror mode, and themes (Light/Dark/High-Contrast).</li>
                    <li><strong>Playback:</strong> Control scroll speed, AI scroll sync, and countdown timer settings.</li>
                 </ul>
                 <h4 className="font-medium flex items-center pt-2"><Mic className="mr-2 h-5 w-5"/>AI Scroll Sync</h4>
                 <p>This experimental feature attempts to adjust scroll speed based on your voice. Enable in Settings, then use the "AI Sync" button in playback controls.</p>
                 <div className="p-3 bg-destructive/10 text-destructive border border-destructive/30 rounded-md">
                    <p className="flex items-center text-xs"><AlertTriangle className="mr-2 h-4 w-4"/>Microphone access is required. The actual speech-to-speed analysis is currently a placeholder.</p>
                </div>
                 <h4 className="font-medium flex items-center pt-2"><Maximize className="mr-2 h-5 w-5"/>Fullscreen & Presentation Modes</h4>
                 <p><strong>Fullscreen Mode:</strong> Click the "Full Screen" button to make the teleprompter view fill your screen. Press <code className="bg-muted px-1.5 py-0.5 rounded text-xs">Esc</code> to exit.</p>
                 <p><strong>Presentation Mode:</strong> Click the "Present" button (<MonitorPlay className="inline h-4 w-4"/> icon) for an even more immersive, distraction-free experience. This mode also goes fullscreen and hides all UI except the script and a subtle exit button. Press <code className="bg-muted px-1.5 py-0.5 rounded text-xs">Esc</code> to exit.</p>
                 <h4 className="font-medium flex items-center pt-2">Keyboard Shortcuts</h4>
                <ul className="list-disc list-outside pl-5 space-y-1">
                  <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs">Spacebar</code> / <code className="bg-muted px-1.5 py-0.5 rounded text-xs">Backspace</code>: Toggle Play/Pause scrolling.</li>
                  <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs">Esc</code>: Exit Fullscreen or Presentation mode.</li>
                  <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs">Ctrl+S</code> / <code className="bg-muted px-1.5 py-0.5 rounded text-xs">Cmd+S</code>: Save current script in Script Manager (if focus is within script manager context).</li>
                </ul>
              </section>

              <Separator />

              <section aria-labelledby="contact-heading">
                <h3 id="contact-heading" className="text-lg font-semibold mb-2 flex items-center"><Mail className="mr-2 h-5 w-5 text-primary"/>Contact Us</h3>
                <p>For support or inquiries, please reach out to us at:</p>
                <p className="mt-1">Email: <a href="mailto:support@promptastic.com" className="underline hover:text-primary">support@promptastic.com</a> (Placeholder)</p>
                <p className="mt-1">Instagram: <a href="https://www.instagram.com/omprakash24d/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">@omprakash24d</a></p>
              </section>
              
              <Separator />

              <section aria-labelledby="privacy-policy-heading">
                <h3 id="privacy-policy-heading" className="text-lg font-semibold mb-2 flex items-center"><ShieldCheck className="mr-2 h-5 w-5 text-primary"/>Privacy Policy</h3>
                <p>Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your information.</p>
                <p className="mt-1"><a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Read our full Privacy Policy here.</a> (Placeholder)</p>
                 <p className="text-xs text-muted-foreground mt-1">Note: This is a placeholder link. A real privacy policy page needs to be created.</p>
              </section>

              <Separator />

              <section aria-labelledby="terms-conditions-heading">
                <h3 id="terms-conditions-heading" className="text-lg font-semibold mb-2 flex items-center"><Gavel className="mr-2 h-5 w-5 text-primary"/>Terms & Conditions</h3>
                <p>By using Promptastic!, you agree to our Terms and Conditions.</p>
                <p className="mt-1"><a href="/terms-conditions" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Read our full Terms & Conditions here.</a> (Placeholder)</p>
                <p className="text-xs text-muted-foreground mt-1">Note: This is a placeholder link. A real terms and conditions page needs to be created.</p>
              </section>
              
              <Separator />

              <section aria-labelledby="about-dev-heading" className="space-y-1">
                <h3 id="about-dev-heading" className="text-lg font-semibold">About the Developer</h3>
                <p>Promptastic! was designed and developed by Om Prakash. You can find more about his work on his <a href="https://www.instagram.com/omprakash24d/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Instagram</a>.</p>
              </section>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

    </div>
  );
}
