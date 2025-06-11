
import type React from 'react';
import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft, Keyboard } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Keyboard Shortcuts',
  description: 'A comprehensive list of keyboard shortcuts for Promptastic! to enhance your productivity.',
};

interface Shortcut {
  keys: string[];
  action: string;
  category: string;
  notes?: string;
}

const shortcuts: Shortcut[] = [
  // Teleprompter Playback & View
  { keys: ['Spacebar', 'Backspace'], action: 'Toggle Play/Pause Scrolling', category: 'Playback' },
  { keys: ['R'], action: 'Reset Scroll to Beginning', category: 'Playback', notes: 'Works when not typing in an input field.' },
  { keys: ['F'], action: 'Toggle Fullscreen Mode', category: 'View', notes: 'Works when not typing in an input field.' },
  { keys: ['Esc'], action: 'Exit Fullscreen or Presentation Mode', category: 'View' },
  { keys: ['['], action: 'Decrease Scroll Speed', category: 'Playback', notes: 'Works when not typing in an input field.' },
  { keys: [']'], action: 'Increase Scroll Speed', category: 'Playback', notes: 'Works when not typing in an input field.' },
  { keys: ['- (Hyphen)'], action: 'Decrease Font Size', category: 'View', notes: 'Works when not typing in an input field.' },
  { keys: ['= (Equals/Plus)'], action: 'Increase Font Size', category: 'View', notes: 'Works when not typing in an input field.' },

  // Script Management (Main Page Context)
  { keys: ['Ctrl + S', 'Cmd + S'], action: 'Save Current Script', category: 'Scripting', notes: 'Works when Script Manager is open and script editor is focused.' },
  
  // Global Application Shortcuts (Main Page Context)
  { keys: ['Alt + S'], action: 'Toggle Script Manager Panel', category: 'Navigation & Panels' },
  { keys: ['Alt + E'], action: 'Toggle Settings Panel', category: 'Navigation & Panels' },
  { keys: ['Alt + M'], action: 'Show Script Summary', category: 'AI & Tools', notes: 'Works on the main teleprompter page if a script is loaded.' },
  { keys: ['Alt + T'], action: 'Toggle Dark/Light Mode', category: 'Application' },
  { keys: ['Alt + L'], action: 'Go to Login Page', category: 'Application', notes: 'If not already logged in and not on the login page.' },
  { keys: ['Alt + H'], action: 'Go to How to Use Page', category: 'Application' },
];

const groupShortcutsByCategory = (shortcutList: Shortcut[]) => {
  return shortcutList.reduce((acc, shortcut) => {
    (acc[shortcut.category] = acc[shortcut.category] || []).push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);
};


export default function KeyboardShortcutsPage() {
  const groupedShortcuts = groupShortcutsByCategory(shortcuts);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto shadow-lg">
          <CardHeader className="items-center">
            <Keyboard className="h-12 w-12 text-primary mb-3" />
            <CardTitle className="text-2xl md:text-3xl text-center">Keyboard Shortcuts</CardTitle>
            <CardDescription className="text-center">Boost your productivity with these shortcuts for Promptastic!.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
              <section key={category} aria-labelledby={`category-${category.toLowerCase().replace(/\s+/g, '-')}`}>
                <h2 id={`category-${category.toLowerCase().replace(/\s+/g, '-')}`} className="text-xl font-semibold mb-3 mt-4 pb-1 border-b border-border">
                  {category}
                </h2>
                <ul className="space-y-2.5">
                  {categoryShortcuts.map((shortcut, index) => (
                    <li key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2.5 rounded-md bg-muted/30 border border-border/50">
                      <div className="flex-1 mb-1 sm:mb-0">
                        <span className="font-semibold text-foreground">{shortcut.action}</span>
                        {shortcut.notes && <p className="text-xs text-muted-foreground mt-0.5">{shortcut.notes}</p>}
                      </div>
                      <div className="flex-shrink-0 flex gap-1">
                        {shortcut.keys.map(key => (
                          <kbd key={key} className="px-2 py-1 text-xs font-sans font-semibold text-muted-foreground bg-muted border border-border rounded-md shadow-sm">
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            
            <Separator className="my-6" />

            <div className="text-muted-foreground text-sm">
              <p><strong>Note:</strong> Some shortcuts might be context-dependent (e.g., only work when a specific panel is open or an element is focused). Global shortcuts (like Alt + key combinations) are designed to work on the main teleprompter page. Browser or OS shortcuts may take precedence in some cases.</p>
            </div>

            <div className="mt-10 text-center">
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
