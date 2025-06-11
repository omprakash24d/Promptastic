
"use client";

import React from 'react';
import { useCallback } from 'react';
import { FileText, Moon, SlidersHorizontal, Sun, Hammer, LogIn, LogOut, UserCircle2, Info, FileQuestion, Mail, ShieldCheck, Gavel } from 'lucide-react';
import { useTeleprompterStore } from '@/hooks/useTeleprompterStore';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
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
  onOpenHelp?: () => void; // Made optional as it might be replaced by dropdown
}

interface NavButtonConfig {
  label: string;
  icon: React.ElementType;
  onClick?: () => void;
  href?: string;
  isDropdown?: boolean;
  dropdownItems?: DropdownItemConfig[];
  ariaLabel: string;
  showTextOnDesktop?: boolean;
  requiresAuth?: boolean;
  hideIfAuth?: boolean;
}

interface DropdownItemConfig {
    label: string;
    href: string;
    icon: React.ElementType;
}

const Header = React.memo(function Header({ onOpenScripts, onOpenSettings }: HeaderProps) {
  const { darkMode, setDarkMode } = useTeleprompterStore();
  const { user, logout, loading } = useAuth();

  const toggleTheme = useCallback(() => {
    setDarkMode(!darkMode);
  }, [darkMode, setDarkMode]);

  const helpDropdownItems: DropdownItemConfig[] = [
    { label: "About Promptastic!", href: "/about-us", icon: Info },
    { label: "How to Use", href: "/how-to-use", icon: FileQuestion },
    { label: "Contact Us", href: "/contact-us", icon: Mail },
    { label: "Privacy Policy", href: "/privacy-policy", icon: ShieldCheck },
    { label: "Terms & Conditions", href: "/terms-conditions", icon: Gavel },
  ];

  const getNavButtons = (): NavButtonConfig[] => {
    const dynamicButtons: NavButtonConfig[] = [
      {
        label: 'Scripts',
        icon: FileText,
        onClick: onOpenScripts,
        ariaLabel: 'Open script manager',
        showTextOnDesktop: true,
        requiresAuth: true,
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
        icon: Hammer, 
        isDropdown: true,
        dropdownItems: helpDropdownItems,
        ariaLabel: 'Open help menu',
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
      return dynamicButtons.filter(b => !b.requiresAuth && b.label !== 'Scripts');
    }

    return dynamicButtons.filter(b => {
      if (b.requiresAuth && !user) return false;
      return true;
    });
  };

  const navButtons = getNavButtons();

  const UserNav = () => {
    if (loading) {
      return <Button variant="ghost" size="sm" className="h-8 w-20 animate-pulse bg-muted/50 rounded-md" disabled>&nbsp;</Button>;
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
              <AvatarFallback>{user.displayName ? user.displayName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : <UserCircle2 />)}</AvatarFallback>
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
          <Link href="/profile" passHref legacyBehavior>
            <DropdownMenuItem asChild>
              <a>
                <UserCircle2 className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </a>
            </DropdownMenuItem>
          </Link>
          <DropdownMenuItem onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const renderNavButton = (button: NavButtonConfig, isMobile: boolean) => {
    const buttonContent = (
      <>
        <button.icon className={cn((button.showTextOnDesktop && !isMobile) ? "mr-1 h-5 w-5" : "h-5 w-5")} aria-hidden="true" />
        {(button.showTextOnDesktop && !isMobile) && button.label}
      </>
    );

    if (button.isDropdown && button.dropdownItems) {
      return (
        <DropdownMenu key={button.label + (isMobile ? "-mobile" : "-desktop")}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size={(button.showTextOnDesktop && !isMobile) ? "sm" : "icon"}
              aria-label={button.ariaLabel}
              title={button.ariaLabel}
            >
              {buttonContent}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {button.dropdownItems.map(item => (
              <Link key={item.href} href={item.href} passHref legacyBehavior>
                <DropdownMenuItem asChild>
                  <a><item.icon className="mr-2 h-4 w-4" />{item.label}</a>
                </DropdownMenuItem>
              </Link>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    if (button.href) {
      return (
        <Link key={button.label + (isMobile ? "-mobile" : "-desktop")} href={button.href} passHref legacyBehavior>
          <Button
            variant="ghost"
            size={(button.showTextOnDesktop && !isMobile) ? "sm" : "icon"}
            aria-label={button.ariaLabel}
            title={button.ariaLabel}
            asChild
          >
            <a>{buttonContent}</a>
          </Button>
        </Link>
      );
    }

    return (
      <Button
        key={button.label + (isMobile ? "-mobile" : "-desktop")}
        variant="ghost"
        size={(button.showTextOnDesktop && !isMobile) ? "sm" : "icon"}
        onClick={button.onClick}
        aria-label={button.ariaLabel}
        title={button.ariaLabel}
      >
        {buttonContent}
      </Button>
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

          {/* Desktop Navigation */}
          <nav className="hidden items-center space-x-1 md:flex" aria-label="Main navigation">
            {navButtons.map(button => renderNavButton(button, false))}
            <UserNav />
          </nav>

          {/* Mobile Navigation: Render all available buttons as icons */}
          <nav className="flex items-center md:hidden space-x-0.5" aria-label="Mobile navigation">
            {navButtons.map(button => renderNavButton(button, true))}
            <UserNav /> {/* UserNav is separate and already responsive */}
          </nav>
        </div>
      </div>
    </header>
  );
});

export default Header;
