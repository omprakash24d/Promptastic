
import type React from 'react';
import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer'; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft, HelpCircle, Play, FileText, Settings, Mic, Maximize, LayoutList, Palette, ListChecks, Hammer, Info, Share2, Timer, ClockIcon, SlidersHorizontalIcon, Type, MinusSquare, VenetianMask, AlignCenterVertical, Gauge, Contrast, Speaker, Keyboard as KeyboardIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, RotateCcw, BookOpenText, MonitorPlay } from 'lucide-react'; 
import { ShareButtons } from '@/components/promptastic/ShareButtons';

export const metadata: Metadata = {
    title: 'How to Use Promptastic!',
    description: 'A comprehensive guide on using Promptastic! teleprompter features, script management, settings, AI tools, and keyboard shortcuts.',
};

export default function HowToUsePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto shadow-lg">
          <CardHeader className="items-center">
            <HelpCircle className="h-12 w-12 text-primary mb-3" />
            <CardTitle className="text-2xl md:text-3xl text-center">How to Use Promptastic!</CardTitle>
            <CardDescription className="text-center">A guide to get the most out of your teleprompter.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 prose prose-sm sm:prose-base dark:prose-invert max-w-none">
            
            <section aria-labelledby="about-tool-heading" className="space-y-3">
                <h3 id="about-tool-heading" className="text-xl font-semibold mb-3 flex items-center"><Info className="mr-2 h-5 w-5 text-primary"/>About Promptastic!</h3>
                <p>Promptastic! is a modern, feature-rich teleprompter application designed for presenters, content creators, and anyone who needs to deliver scripts smoothly and professionally. Built with Next.js, React, and ShadCN UI, it offers a clean, intuitive interface, real-time customization, and AI-powered enhancements for an optimal prompting experience.</p>
            </section>

            <Separator/>

            <section aria-labelledby="core-features-heading" className="space-y-3">
                <h3 id="core-features-heading" className="text-xl font-semibold mb-3 flex items-center"><LayoutList className="mr-2 h-5 w-5 text-primary"/>Core Features & Usage</h3>

                <h4 id="teleprompter-view-heading" className="font-medium flex items-center pt-2"><Play className="mr-2 h-5 w-5"/>Teleprompter View & Playback</h4>
                <ul className="list-disc list-outside pl-5 space-y-1" aria-labelledby="teleprompter-view-heading">
                  <li><strong>Smooth Scrolling:</strong> The script scrolls automatically at an adjustable speed.</li>
                  <li><strong>Playback Controls:</strong> Use the <Play className="inline h-4 w-4"/> Play/Pause, <RotateCcw className="inline h-4 w-4"/> Reset, and other controls in the footer of the main teleprompter page.</li>
                  <li><strong>Countdown Timer:</strong> Optionally enable a countdown (1-60 seconds) in Settings to give you a moment to prepare before scrolling begins. When entering fullscreen mode (<Maximize className="inline h-4 w-4"/> or `F` key), if not already playing, a 3-second countdown will automatically start.</li>
                  <li><strong>Manual Scroll & Jump:</strong> When paused, you can manually scroll. Clicking on a paragraph while paused will set it as the new starting point for playback.</li>
                  <li><strong>Rich Text & Cues:</strong>
                    The teleprompter supports basic formatting like <code className="bg-muted px-1.5 py-0.5 rounded text-xs">**bold**</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-xs">*italic*</code>, and <code className="bg-muted px-1.5 py-0.5 rounded text-xs">_underline_</code>.
                    Visual cues like <code className="bg-muted px-1.5 py-0.5 rounded text-xs">//PAUSE//</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-xs">//EMPHASIZE//</code> (highlights text in primary color), and <code className="bg-muted px-1.5 py-0.5 rounded text-xs">//SLOWDOWN//</code> are also displayed.
                  </li>
                </ul>

                <h4 id="script-management-heading" className="font-medium flex items-center pt-2"><FileText className="mr-2 h-5 w-5"/>Script Management</h4>
                <p>Access the Script Manager by clicking the "Scripts" (<FileText className="inline h-4 w-4"/> icon) button in the header (or from the main menu on mobile). Shortcut: `Alt + S`.</p>
                <ul className="list-disc list-outside pl-5 space-y-1" aria-labelledby="script-management-heading">
                  <li><strong>Create & Edit:</strong> Type or paste your script directly into the editor.</li>
                  <li><strong>Estimated Reading Time:</strong> An estimated reading time (<ClockIcon className="inline h-4 w-4"/>) is shown in the Script Editor to help you gauge script length.</li>
                  <li><strong>Save Scripts:</strong> Save your work with a unique name. If you are logged in, scripts sync to the cloud (Firebase Firestore); otherwise, they are saved in your browser's local storage.</li>
                  <li><strong>Load Scripts:</strong> Select a script from the "Saved Scripts" list to load it into the teleprompter.</li>
                  <li><strong>Organize:</strong> Rename, duplicate, or delete scripts as needed.</li>
                  <li><strong>Import:</strong> Import scripts from <code className="bg-muted px-1.5 py-0.5 rounded text-xs">.txt</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-xs">.md</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-xs">.pdf</code>, and <code className="bg-muted px-1.5 py-0.5 rounded text-xs">.docx</code> files using the respective import buttons.</li>
                  <li><strong>Export:</strong> Export the current script as a <code className="bg-muted px-1.5 py-0.5 rounded text-xs">.txt</code> file.</li>
                  <li><strong>Versioning:</strong> Save multiple versions of a script with optional notes. You can load any previous version back into the editor.</li>
                  <li><strong>AI Summary:</strong> Generate an AI-powered summary of your script using the "Summarize" button in the Script Manager or the <BookOpenText className="inline h-4 w-4"/> "Summary" button in the playback controls on the main page. Shortcut: `Alt + M`.</li>
                </ul>
                 <div className="p-3 bg-muted/50 rounded-md border border-border mt-2">
                    <p className="flex items-center text-xs text-muted-foreground"><ListChecks className="mr-2 h-4 w-4"/>Your scripts, versions, and settings (including custom profiles) are automatically saved in your browser's local storage or synced with Firestore if logged in.</p>
                </div>

                <h4 id="settings-panel-heading" className="font-medium flex items-center pt-2"><SlidersHorizontalIcon className="mr-2 h-5 w-5"/>Settings Panel</h4>
                <p>Access Teleprompter Settings by clicking the "Settings" (<Settings className="inline h-4 w-4"/> icon) button in the header (or from the main menu on mobile). Shortcut: `Alt + E`.</p>
                 <ul className="list-disc list-outside pl-5 space-y-1" aria-labelledby="settings-panel-heading">
                    <li><strong>Appearance:</strong>
                        Customize <strong className="font-medium">Font Size</strong> (<Type className="inline h-4 w-4"/>), <strong className="font-medium">Line Spacing</strong>, <strong className="font-medium">Font Family</strong> (including Atkinson Hyperlegible for readability), <strong className="font-medium">Text Color</strong> (<Palette className="inline h-4 w-4"/>), <strong className="font-medium">Horizontal Text Padding</strong> (<MinusSquare className="inline h-4 w-4"/>), <strong className="font-medium">Focus Line Position</strong> (<AlignCenterVertical className="inline h-4 w-4"/>) and <strong className="font-medium">Focus Style</strong> (<VenetianMask className="inline h-4 w-4"/>: line or shaded paragraph), <strong className="font-medium">Mirror Mode</strong>, and <strong className="font-medium">Themes</strong> (Light/Dark <Contrast className="inline h-4 w-4"/>/High-Contrast. Toggle Dark/Light with `Alt + T`).
                    </li>
                    <li><strong>Playback:</strong> Adjust <strong className="font-medium">Scroll Speed</strong> (<Gauge className="inline h-4 w-4"/>), enable/disable <strong className="font-medium">AI Scroll Sync</strong> (<Mic className="inline h-4 w-4"/>), and configure the optional <strong className="font-medium">Countdown Timer</strong> (<Timer className="inline h-4 w-4"/> enable/disable, duration 1-60s).</li>
                    <li><strong>Layouts & Profiles:</strong> Quickly apply predefined layout presets (e.g., "Default", "Studio Recording") or save/load your custom combinations of settings as named profiles for different scenarios.</li>
                    <li><strong>General:</strong> Reset core settings to their "Default" preset values.</li>
                 </ul>

                <h4 id="ai-scroll-sync-heading" className="font-medium flex items-center pt-2"><Mic className="mr-2 h-5 w-5"/>AI Scroll Sync (Experimental)</h4>
                 <p>This feature attempts to listen to your speech and adjust the teleprompter scroll speed accordingly. Enable it in Settings, then use the "AI Sync" button in the playback controls on the main page. Microphone access is required.</p>
                 <div className="p-3 bg-destructive/10 text-destructive border border-destructive/30 rounded-md">
                    <p className="flex items-center text-xs"><AlertTriangle className="mr-2 h-4 w-4"/>The speech analysis component of AI Scroll Sync is currently a placeholder and does not perform actual speech-to-speed calculations. This requires integration with a Speech-to-Text API.</p>
                </div>

                 <h4 id="fullscreen-presentation-heading" className="font-medium flex items-center pt-2"><Maximize className="mr-2 h-5 w-5"/>Fullscreen & Presentation Modes</h4>
                 <p><strong>Fullscreen Mode:</strong> Click the <Maximize className="inline h-4 w-4"/> "Full Screen" button in the playback controls on the main page (Shortcut: `F`) to make the teleprompter view fill your entire screen. This helps minimize distractions. If not already playing, scrolling will automatically start with a 3-second countdown.</p>
                 <p>Press <code className="bg-muted px-1.5 py-0.5 rounded text-xs">Esc</code> to exit Fullscreen mode.</p>
              </section>

              <Separator/>

              <section aria-labelledby="keyboard-shortcuts-heading">
                <h3 id="keyboard-shortcuts-heading" className="text-lg font-semibold mb-2 flex items-center"><KeyboardIcon className="mr-2 h-5 w-5 text-primary"/>Keyboard Shortcuts</h3>
                <p className="text-sm text-muted-foreground">Promptastic! offers a variety of keyboard shortcuts for efficient operation. For a comprehensive list, please visit the dedicated <Link href="/keyboard-shortcuts" className="text-primary hover:underline">Keyboard Shortcuts page</Link> (also accessible from the Help menu).</p>
                <p className="text-sm text-muted-foreground mt-1">Common shortcuts (when not focused on an input field like the script editor):</p>
                <ul className="list-disc list-outside pl-5 space-y-1 mt-2 text-sm">
                  <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs">Spacebar</code> / <code className="bg-muted px-1.5 py-0.5 rounded text-xs">Backspace</code>: Toggle Play/Pause scrolling.</li>
                  <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs">R</code>: Reset scroll to the beginning.</li>
                  <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs">F</code>: Toggle Fullscreen mode.</li>
                  <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs">Esc</code>: Exit Fullscreen or Presentation mode.</li>
                  <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs">[</code>: Decrease scroll speed.</li>
                  <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs">]</code>: Increase scroll speed.</li>
                  <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs">-</code>: Decrease font size.</li>
                  <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs">=</code>: Increase font size.</li>
                  <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs">Ctrl+S</code> / <code className="bg-muted px-1.5 py-0.5 rounded text-xs">Cmd+S</code>: Save current script (Script Manager open & editor focused).</li>
                  <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs">Alt + S</code>: Toggle Script Manager Panel.</li>
                  <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs">Alt + E</code>: Toggle Settings Panel.</li>
                  <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs">Alt + M</code>: Show Script Summary (main page).</li>
                  <li><code className="bg-muted px-1.5 py-0.5 rounded text-xs">Alt + T</code>: Toggle Dark/Light Mode.</li>
                </ul>
              </section>

            <Separator/>

            <section aria-labelledby="share-guide-heading">
              <ShareButtons className="mt-6" />
            </section>
            
            <div className="mt-8 text-center">
              <Button asChild variant="outline">
                <Link href="/">
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back to Promptastic!
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
