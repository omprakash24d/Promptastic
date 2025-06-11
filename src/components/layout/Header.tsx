
"use client";

import React from 'react';
import { useCallback } from 'react';
import { FileText, Moon, SlidersHorizontal, Sun, HelpCircle, LogIn, LogOut, UserCircle } from 'lucide-react';
import { useTeleprompterStore } from '@/hooks/useTeleprompterStore';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link'; // Import Link for navigation
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


interface HeaderProps {
  onOpenScripts: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
}

interface NavButtonConfig {
  label: string;
  icon: React.ElementType;
  onClick?: () => void;
  href?: string;
  ariaLabel: string;
  showTextOnDesktop?: boolean;
  isAuthAction?: boolean; // To identify login/logout buttons
  requiresAuth?: boolean; // To hide if not authenticated
  hideIfAuth?: boolean; // To hide if authenticated
}

const Header = React.memo(function Header({ onOpenScripts, onOpenSettings, onOpenHelp }: HeaderProps) {
  const { darkMode, setDarkMode } = useTeleprompterStore();
  const { user, logout, loading } = useAuth(); // Get auth state

  const toggleTheme = useCallback(() => {
    setDarkMode(!darkMode);
  }, [darkMode, setDarkMode]);

  const navButtonsBase: Omit<NavButtonConfig, 'onClick' | 'href' | 'isAuthAction' | 'requiresAuth' | 'hideIfAuth'>[] = [
    {
      label: 'Scripts',
      icon: FileText,
      ariaLabel: 'Open script manager',
      showTextOnDesktop: true,
    },
    {
      label: 'Settings',
      icon: SlidersHorizontal,
      ariaLabel: 'Open settings',
      showTextOnDesktop: true,
    },
    {
      label: 'Help',
      icon: HelpCircle,
      ariaLabel: 'Open help documentation',
      showTextOnDesktop: true,
    },
    {
      label: darkMode ? 'Light Mode' : 'Dark Mode',
      icon: darkMode ? Sun : Moon,
      ariaLabel: `Toggle theme to ${darkMode ? 'light' : 'dark'} mode`,
      showTextOnDesktop: false,
    },
  ];

  const getNavButtons = (): NavButtonConfig[] => {
    const dynamicButtons: NavButtonConfig[] = [
      {
        label: 'Scripts',
        icon: FileText,
        onClick: onOpenScripts,
        ariaLabel: 'Open script manager',
        showTextOnDesktop: true,
        requiresAuth: true, // Example: Scripts only for logged-in users
      },
      {
        label: 'Settings',
        icon: SlidersHorizontal,
        onClick: onOpenSettings,
        ariaLabel: 'Open settings',
        showTextOnDesktop: true,
      },
      {
        label: 'Help',
        icon: HelpCircle,
        onClick: onOpenHelp,
        ariaLabel: 'Open help documentation',
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

    if (loading) {
      return dynamicButtons.filter(b => !b.isAuthAction && !b.requiresAuth && !b.hideIfAuth); // Show basic non-auth buttons while loading
    }

    if (user) {
      // User is logged in - Scripts button is already handled by requiresAuth
    } else {
      dynamicButtons.push({
        label: 'Login',
        icon: LogIn,
        href: '/login',
        ariaLabel: 'Login to your account',
        showTextOnDesktop: true,
        isAuthAction: true,
        hideIfAuth: true,
      });
    }
    return dynamicButtons.filter(b => !(b.requiresAuth && !user) && !(b.hideIfAuth && user));
  };
  
  const navButtons = getNavButtons();


  const UserNav = () => {
    if (loading) {
      return <Button variant="ghost" size="sm" disabled>Loading...</Button>;
    }
    if (!user) {
      return (
        <Link href="/login" passHref legacyBehavior>
          <Button variant="ghost" size="sm" asChild>
            <a><LogIn className="mr-2 h-5 w-5" />Login</a>
          </Button>
        </Link>
      );
    }
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} />
              <AvatarFallback>{user.displayName ? user.displayName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : <UserCircle />)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.displayName || 'User'}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {/* Add other items like "Profile", "Settings" later */}
          <DropdownMenuItem onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };


  return (
    <header className="border-b bg-card py-3 shadow-sm shrink-0 print:hidden" role="banner">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center cursor-pointer" passHref>
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
          </Link>


          <nav className="hidden items-center space-x-1 md:flex" aria-label="Main navigation">
            {navButtons.map((button) => (
              button.href ? (
                <Link key={button.label} href={button.href} passHref legacyBehavior>
                  <Button
                    variant="ghost"
                    size={button.showTextOnDesktop ? "sm" : "icon"}
                    aria-label={button.ariaLabel}
                    title={button.ariaLabel}
                    asChild
                  >
                    <a>
                     <button.icon className={cn(button.showTextOnDesktop ? "mr-1 h-5 w-5" : "h-5 w-5", button.label === 'Help' && button.showTextOnDesktop && "mr-1.5")} aria-hidden="true" />
                     {button.showTextOnDesktop && button.label}
                    </a>
                  </Button>
                </Link>
              ) : (
                <Button
                  key={button.label}
                  variant="ghost"
                  size={button.showTextOnDesktop ? "sm" : "icon"}
                  onClick={button.onClick}
                  aria-label={button.ariaLabel}
                  title={button.ariaLabel}
                >
                  <button.icon className={cn(button.showTextOnDesktop ? "mr-1 h-5 w-5" : "h-5 w-5", button.label === 'Help' && button.showTextOnDesktop && "mr-1.5")} aria-hidden="true" />
                  {button.showTextOnDesktop && button.label}
                </Button>
              )
            ))}
             <UserNav />
          </nav>


          <nav className="flex items-center md:hidden space-x-1" aria-label="Mobile navigation">
            {navButtons.filter(b => !b.isAuthAction || (b.isAuthAction && b.hideIfAuth && !user)).map((button) => ( // Filter out login button if user exists for mobile
              button.href ? (
                <Link key={button.label} href={button.href} passHref legacyBehavior>
                   <Button variant="ghost" size="icon" aria-label={button.ariaLabel} title={button.ariaLabel} asChild>
                        <a><button.icon className="h-5 w-5" aria-hidden="true"/></a>
                   </Button>
                </Link>
              ) : (
                 <Button
                    key={button.label}
                    variant="ghost"
                    size="icon"
                    onClick={button.onClick}
                    aria-label={button.ariaLabel}
                    title={button.ariaLabel}
                  >
                    <button.icon className="h-5 w-5" aria-hidden="true"/>
                  </Button>
              )
            ))}
             <UserNav /> {/* UserNav will handle login/logout button for mobile too */}
          </nav>
        </div>
      </div>
    </header>
  );
});

export default Header;
