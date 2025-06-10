
"use client";

import type React from 'react';
// Removed Menu, X as they were for the unused generic mobile menu
import { FileText, Moon, SlidersHorizontal, Sun } from 'lucide-react';
import { useTeleprompterStore } from '@/hooks/useTeleprompterStore';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onOpenScripts: () => void;
  onOpenSettings: () => void;
}

export default function Header({ onOpenScripts, onOpenSettings }: HeaderProps) {
  const { darkMode, setDarkMode } = useTeleprompterStore();

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  // TODO: Consider more advanced theme management or custom theme options in the future.

  return (
    <header className="border-b bg-card py-3 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <svg
                className="h-5 w-5 text-primary-foreground"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L20 7V17L12 22L4 17V7L12 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="ml-3 text-xl font-semibold text-foreground">
              Promptastic!
            </span>
          </div>

          {/* Desktop Controls */}
          <div className="hidden items-center space-x-2 md:flex">
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenScripts}
              aria-label="Open script manager"
            >
              <FileText className="mr-1 h-5 w-5" />
              Scripts
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenSettings}
              aria-label="Open settings"
            >
              <SlidersHorizontal className="mr-1 h-5 w-5" />
              Settings
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {darkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Mobile Controls */}
          <div className="flex items-center md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="mr-1"
              onClick={onOpenScripts}
              aria-label="Open script manager"
            >
              <FileText className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="mr-1"
              onClick={onOpenSettings}
              aria-label="Open settings"
            >
              <SlidersHorizontal className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {darkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
