
"use client";

import React from 'react'; 
import { useCallback } from 'react';
import { FileText, Moon, SlidersHorizontal, Sun } from 'lucide-react';
import { useTeleprompterStore } from '@/hooks/useTeleprompterStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onOpenScripts: () => void;
  onOpenSettings: () => void;
  className?: string; 
}

interface NavButtonConfig {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  ariaLabel: string;
  showTextOnDesktop?: boolean;
}

const Header = React.memo(function Header({ onOpenScripts, onOpenSettings, className }: HeaderProps) {
  const { darkMode, setDarkMode } = useTeleprompterStore();

  const toggleTheme = useCallback(() => {
    setDarkMode(!darkMode);
  }, [darkMode, setDarkMode]);

  const navButtons: NavButtonConfig[] = [
    {
      label: 'Scripts',
      icon: FileText,
      onClick: onOpenScripts,
      ariaLabel: 'Open script manager',
      showTextOnDesktop: true,
    },
    {
      label: 'Settings',
      icon: SlidersHorizontal,
      onClick: onOpenSettings,
      ariaLabel: 'Open settings',
      showTextOnDesktop: true,
    },
    {
      label: darkMode ? 'Light Mode' : 'Dark Mode',
      icon: darkMode ? Sun : Moon,
      onClick: toggleTheme,
      ariaLabel: `Toggle theme to ${darkMode ? 'light' : 'dark'} mode`, 
      showTextOnDesktop: false,
    },
  ];

  return (
    <header className={cn("border-b bg-card py-3 shadow-sm", className)} role="banner">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <svg
                className="h-5 w-5 text-primary-foreground"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true" 
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

          
          <nav className="hidden items-center space-x-2 md:flex" aria-label="Main navigation">
            {navButtons.map((button) => (
              <Button
                key={button.label}
                variant="ghost"
                size={button.showTextOnDesktop ? "sm" : "icon"}
                onClick={button.onClick}
                aria-label={button.ariaLabel}
                title={button.ariaLabel} 
              >
                <button.icon className={button.showTextOnDesktop ? "mr-1 h-5 w-5" : "h-5 w-5"} aria-hidden="true" />
                {button.showTextOnDesktop && button.label}
              </Button>
            ))}
          </nav>

          
          <nav className="flex items-center md:hidden" aria-label="Mobile navigation">
            {navButtons.map((button, index) => (
              <Button
                key={button.label}
                variant="ghost"
                size="icon"
                className={index < navButtons.length -1 ? "mr-1" : ""}
                onClick={button.onClick}
                aria-label={button.ariaLabel}
                title={button.ariaLabel} 
              >
                <button.icon className="h-5 w-5" aria-hidden="true"/>
              </Button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
});

export default Header;
