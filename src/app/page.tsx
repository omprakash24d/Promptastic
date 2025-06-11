
"use client";

import type React from 'react';
import { useEffect, useState, useRef, useCallback } from 'react';
import type { Metadata } from 'next'; // Import Metadata type for page-specific metadata
import Link from 'next/link'; // Added Link import
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
import { Settings, FileText, Play, Mic, Maximize, ListChecks, Palette, AlertTriangle, MonitorPlay, LayoutList, Info, Mail, ShieldCheck, Gavel, Hammer, TvMinimalPlay, BookOpenText, RotateCcw } from 'lucide-react';
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
                <Maximize className="h-5 w-5" /> {/* Or use TvMinimalPlay if you prefer consistency with the playbar button */}
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
              <Hammer className="mr-2 h-5 w-5" />
              Help & Information
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6 text-sm">

              <section aria-labelledby="about-tool-heading" className="space-y-3">
                <h3 id="about-tool-heading" className="text-xl font-semibold mb-3 flex items-center"><Info className="mr-2 h-5 w-5 text-primary"/>About Promptastic!</h3>
                <p>Promptastic! is a modern, feature-rich teleprompter application designed for presenters, content creators, and anyone who needs to deliver scripts smoothly and professionally. Built with Next.js, React, and ShadCN UI, it offers a clean, intuitive interface, real-time customization, and AI-powered enhancements for an optimal prompting experience.</p>
              </section>

              <Separator/>

              <section aria-labelledby="core-features-heading" className="space-y-3">
                <h3 id="core-features-heading" className="text-xl font-semibold mb-3 flex items-center"><LayoutList className="mr-2 h-5 w-5 text-primary"/>Core Features & Usage</h3>

                <h4 className="font-medium flex items-center pt-2"><Play className="mr-2 h-5 w-5"/>Teleprompter View & Playback</h4>
                <ul className="list-disc list-outside pl-5 space-y-1">
                  <li><strong>Smooth Scrolling:</strong> The script scrolls automatically at an adjustable speed.</li>
                  <li><strong>Playback Controls:</strong> Use the <Play className="inline h-4 w-4"/> Play, <RotateCcw className="inline h-4 w-4"/> Reset, and other controls in the footer.</li>
                  <li><strong>Keyboard Control:</strong> Press <code className="bg-muted px-1.5 py-0.5 rounded text-xs">Spacebar</code> or <code className="bg-muted px-1.5 py-0.5 rounded text-xs">Backspace</code> to toggle play/pause.</li>
                  <li><strong>Manual Scroll & Jump:</strong> When paused, you can manually scroll. Clicking on a paragraph while paused will set it as the new starting point for playback.</li>
                  <li><strong>Rich Text & Cues:</strong>
                    The teleprompter supports basic formatting like <code className="bg-muted px-1.5 py-0.5 rounded text-xs">**bold**</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-xs">*italic*</code>, and <code className="bg-muted px-1.5 py-0.5 rounded text-xs">_underline_</code>.
                    Visual cues like <code className="bg-muted px-1.5 py-0.5 rounded text-xs">//PAUSE//</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-xs">//EMPHASIZE//</code> (highlights text in primary color), and <code className="bg-muted px-1.5 py-0.5 rounded text-xs">//SLOWDOWN//</code> are also displayed.
                  </li>
                </ul>

                <h4 className="font-medium flex items-center pt-2"><FileText className="mr-2 h-5 w-5"/>Script Management</h4>
                <ul className="list-disc list-outside pl-5 space-y-1">
                  <li><strong>Access:</strong> Click the "Scripts" button in the header to open the Script Manager.</li>
                  <li><strong>Create & Edit:</strong> Type or paste your script directly into the editor. The estimated reading time is shown.</li>
                  <li><strong>Save Scripts:</strong> Save your work with a unique name. If you are logged in, scripts sync to the cloud (Firestore); otherwise, they are saved in your browser's local storage.</li>
                  <li><strong>Load Scripts:</strong> Select a script from the "Saved Scripts" list to load it into the teleprompter.</li>
                  <li><strong>Organize:</strong> Rename, duplicate, or delete scripts as needed.</li>
                  <li><strong>Import:</strong> Import scripts from <code className="bg-muted px-1.5 py-0.5 rounded text-xs">.txt</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-xs">.md</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-xs">.pdf</code>, and <code className="bg-muted px-1.5 py-0.5 rounded text-xs">.docx</code> files.</li>
                  <li><strong>Export:</strong> Export the current script as a <code className="bg-muted px-1.5 py-0.5 rounded text-xs">.txt</code> file.</li>
                  <li><strong>Versioning:</strong> Save multiple versions of a script with optional notes. You can load any previous version back into the editor.</li>
                  <li><strong>AI Summary:</strong> Generate an AI-powered summary of your script using the "Summarize" button in the Script Manager or the <BookOpenText className="inline h-4 w-4"/> "Summary" button in the playback controls.</li>
                </ul>
                 <div className="p-3 bg-muted/50 rounded-md border border-border mt-2">
                    <p className="flex items-center text-xs text-muted-foreground"><ListChecks className="mr-2 h-4 w-4"/>Your scripts, versions, and settings (including custom profiles) are automatically saved in your browser's local storage or synced with Firestore if logged in.</p>
                </div>

                <h4 className="font-medium flex items-center pt-2"><Settings className="mr-2 h-5 w-5"/>Settings Panel</h4>
                 <ul className="list-disc list-outside pl-5 space-y-1">
                    <li><strong>Access:</strong> Click the "Settings" (gear) icon in the header.</li>
                    <li><strong>Appearance:</strong> Customize font size, line spacing, font family (including Atkinson Hyperlegible for readability), text color, horizontal text padding, focus line position and style (line or shaded paragraph), mirror mode, and themes (Light/Dark/High-Contrast).</li>
                    <li><strong>Playback:</strong> Adjust scroll speed, enable/disable AI Scroll Sync, and configure the optional countdown timer (duration 1-60s).</li>
                    <li><strong>Layouts & Profiles:</strong> Quickly apply predefined layout presets or save/load your custom combinations of settings as named profiles for different scenarios.</li>
                 </ul>

                <h4 className="font-medium flex items-center pt-2"><Mic className="mr-2 h-5 w-5"/>AI Scroll Sync (Experimental)</h4>
                 <p>This feature attempts to listen to your speech and adjust the teleprompter scroll speed accordingly. Enable it in Settings, then use the "AI Sync" button in the playback controls. Microphone access is required.</p>
                 <div className="p-3 bg-destructive/10 text-destructive border border-destructive/30 rounded-md">
                    <p className="flex items-center text-xs"><AlertTriangle className="mr-2 h-4 w-4"/>The speech analysis component of AI Scroll Sync is currently a placeholder and does not perform actual speech-to-speed calculations. This requires integration with a Speech-to-Text API.</p>
                </div>

                 <h4 className="font-medium flex items-center pt-2"><Maximize className="mr-2 h-5 w-5"/>Fullscreen & Presentation Modes</h4>
                 <p><strong>Fullscreen Mode:</strong> Click the <Maximize className="inline h-4 w-4"/> "Full Screen" button in the playback controls to make the teleprompter view fill your entire screen. This helps minimize distractions.</p>
                 <p><strong>Presentation Mode:</strong> Click the <MonitorPlay className="inline h-4 w-4"/> "Present" button for an even more immersive, UI-less experience. This mode also goes fullscreen and hides all UI elements except for the scrolling script and a subtle exit button. Ideal for actual delivery.</p>
                 <p>Press <code className="bg-muted px-1.5 py-0.5 rounded text-xs">Esc</code> to exit either Fullscreen or Presentation mode.</p>
              </section>

              <Separator/>

              <section aria-labelledby="keyboard-shortcuts-heading">
                <h3 id="keyboard-shortcuts-heading" className="text-lg font-semibold mb-2 flex items-center"><Palette className="mr-2 h-5 w-5 text-primary"/>Keyboard Shortcuts</h3>
                <ul className="list-disc list-outside pl-5 space-y-1">
                  <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs">Spacebar</code> / <code className="bg-muted px-1.5 py-0.5 rounded text-xs">Backspace</code>: Toggle Play/Pause scrolling (when not focused on an input field).</li>
                  <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs">Esc</code>: Exit Fullscreen or Presentation mode.</li>
                  <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs">Ctrl+S</code> / <code className="bg-muted px-1.5 py-0.5 rounded text-xs">Cmd+S</code>: Save current script (when Script Manager is open and focused on the script editor).</li>
                </ul>
              </section>

              <Separator />

              <section aria-labelledby="contact-heading">
                <h3 id="contact-heading" className="text-lg font-semibold mb-2 flex items-center"><Mail className="mr-2 h-5 w-5 text-primary"/>Contact & Support</h3>
                <p>For support, feedback, or inquiries, please reach out:</p>
                <p className="mt-1">Email: <a href="mailto:support@prompt.indhinditech.com" className="underline hover:text-primary">support@prompt.indhinditech.com</a> (Placeholder)</p>
                <p className="mt-1">Instagram: <a href="https://www.instagram.com/omprakash24d/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">@omprakash24d</a></p>
              </section>

              <Separator />

              <section aria-labelledby="privacy-policy-heading">
                <h3 id="privacy-policy-heading" className="text-lg font-semibold mb-2 flex items-center"><ShieldCheck className="mr-2 h-5 w-5 text-primary"/>Privacy Policy</h3>
                <p>Your privacy is important. Our Privacy Policy explains how we collect, use, and protect your information.</p>
                <p className="mt-1"><Link href="/privacy-policy" className="underline hover:text-primary">Read our full Privacy Policy here.</Link></p>
              </section>

              <Separator />

              <section aria-labelledby="terms-conditions-heading">
                <h3 id="terms-conditions-heading" className="text-lg font-semibold mb-2 flex items-center"><Gavel className="mr-2 h-5 w-5 text-primary"/>Terms & Conditions</h3>
                <p>By using Promptastic!, you agree to our Terms and Conditions.</p>
                <p className="mt-1"><Link href="/terms-conditions" className="underline hover:text-primary">Read our full Terms & Conditions here.</Link></p>
              </section>

              <Separator />

              <section aria-labelledby="about-dev-heading" className="space-y-1">
                <h3 id="about-dev-heading" className="text-lg font-semibold">About the Developer</h3>
                <p>Promptastic! was designed and developed by Om Prakash. Connect with him on <a href="https://www.instagram.com/omprakash24d/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Instagram</a>.</p>
              </section>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

    </div>
  );
}

