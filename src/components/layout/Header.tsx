
"use client";

import type React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { Menu, X, FileText, SlidersHorizontal } from 'lucide-react';
import { useTeleprompterStore } from '@/hooks/useTeleprompterStore';

interface HeaderProps {
  onOpenScripts: () => void;
  onOpenSettings: () => void;
}

export default function Header({ onOpenScripts, onOpenSettings }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { darkMode, setDarkMode } = useTeleprompterStore(); // Keep for potential theme toggle in header later

  return (
    <header className="bg-card shadow-sm py-3 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <svg className="h-5 w-5 text-primary-foreground" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L20 7V17L12 22L4 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="ml-3 text-xl font-semibold text-foreground">Promptastic!</span>
          </div>

          {/* Desktop Controls */}
          <div className="hidden md:flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={onOpenScripts} aria-label="Open script manager">
              <FileText className="h-5 w-5 mr-1" />
              Scripts
            </Button>
            <Button variant="ghost" size="sm" onClick={onOpenSettings} aria-label="Open settings">
              <SlidersHorizontal className="h-5 w-5 mr-1" />
              Settings
            </Button>
          </div>

          {/* Mobile Controls Trigger (using existing sheet pattern for consistency if more links added later) */}
          <div className="md:hidden flex items-center">
            <Button variant="ghost" size="icon" className="mr-1" onClick={onOpenScripts} aria-label="Open script manager">
              <FileText className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onOpenSettings} aria-label="Open settings">
              <SlidersHorizontal className="h-5 w-5" />
            </Button>
            
            {/* 
            // If a generic mobile menu is needed later, it can be re-enabled.
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-xs p-4">
                <SheetHeader className="mb-4">
                  <SheetTitle>Navigation</SheetTitle>
                </SheetHeader>
                <SheetClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </SheetClose>
                <nav className="flex flex-col space-y-3">
                   // Example: <a href="#" className="text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>Home</a>
                </nav>
              </SheetContent>
            </Sheet>
            */}
          </div>
        </div>
      </div>
    </header>
  );
}
