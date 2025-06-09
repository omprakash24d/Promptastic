
"use client";

import type React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { Menu, X, FileText, SlidersHorizontal } from 'lucide-react';
import { ScriptManager } from '@/components/promptastic/ScriptManager';
import { SettingsPanel } from '@/components/promptastic/SettingsPanel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTeleprompterStore } from '@/hooks/useTeleprompterStore';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsSheetOpen, setSettingsSheetOpen] = useState(false);
  const [scriptsSheetOpen, setScriptsSheetOpen] = useState(false);
  const { darkMode, setDarkMode } = useTeleprompterStore();


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

          {/* Desktop Navigation & Controls */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Future navigation links can go here if needed */}
            {/* <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Home</a> */}
            
            <Sheet open={scriptsSheetOpen} onOpenChange={setScriptsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" aria-label="Open script manager">
                  <FileText className="h-5 w-5 mr-1" />
                  Scripts
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle className="text-lg">Manage Scripts</SheetTitle>
                </SheetHeader>
                <SheetClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </SheetClose>
                <ScrollArea className="flex-1 p-4">
                  <ScriptManager />
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <Sheet open={settingsSheetOpen} onOpenChange={setSettingsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" aria-label="Open settings">
                  <SlidersHorizontal className="h-5 w-5 mr-1" />
                  Settings
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-sm p-0 flex flex-col">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle className="text-lg">Teleprompter Settings</SheetTitle>
                </SheetHeader>
                <SheetClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </SheetClose>
                <ScrollArea className="flex-1 p-4">
                  <SettingsPanel />
                </ScrollArea>
              </SheetContent>
            </Sheet>
            {/* Example "Get Started" button if needed later 
            <Button size="sm">Get Started</Button>
            */}
          </div>

          {/* Mobile Menu Button & Controls */}
          <div className="md:hidden flex items-center">
             <Sheet open={scriptsSheetOpen} onOpenChange={setScriptsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="mr-1" aria-label="Open script manager">
                  <FileText className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle className="text-lg">Manage Scripts</SheetTitle>
                </SheetHeader>
                 <SheetClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </SheetClose>
                <ScrollArea className="flex-1 p-4">
                  <ScriptManager />
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <Sheet open={settingsSheetOpen} onOpenChange={setSettingsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open settings">
                  <SlidersHorizontal className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-sm p-0 flex flex-col">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle className="text-lg">Teleprompter Settings</SheetTitle>
                </SheetHeader>
                 <SheetClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </SheetClose>
                <ScrollArea className="flex-1 p-4">
                  <SettingsPanel />
                </ScrollArea>
              </SheetContent>
            </Sheet>

            {/* Mobile menu for future nav links
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
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMobileMenuOpen(false)}>Home</a>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMobileMenuOpen(false)}>Products</a>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMobileMenuOpen(false)}>Features</a>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMobileMenuOpen(false)}>About</a>
                  <Button className="w-full mt-4" onClick={() => setMobileMenuOpen(false)}>Get Started</Button>
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
