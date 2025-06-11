
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
import { useIsMobile } from '@/hooks/use-mobile';

interface HeaderProps {
  onOpenScripts?: () => void;
  onOpenSettings?: () => void;
}

const staticHelpPageItems = [
    { label: "About Promptastic!", href: "/about-us", icon: Info },
    { label: "How to Use", href: "/how-to-use", icon: FileQuestion },
    { label: "Contact Us", href: "/contact-us", icon: Mail },
    { label: "Privacy Policy", href: "/privacy-policy", icon: ShieldCheck },
    { label: "Terms & Conditions", href: "/terms-conditions", icon: Gavel },
];


const Header = React.memo(function Header({ onOpenScripts, onOpenSettings }: HeaderProps) {
  const { darkMode, setDarkMode } = useTeleprompterStore();
  const { user, logout, loading } = useAuth();
  const isMobile = useIsMobile();

  const toggleTheme = useCallback(() => {
    setDarkMode(!darkMode);
  }, [darkMode, setDarkMode]);

  const UserNavDesktop = () => {
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

  const renderMobileMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open main menu" title="Open main menu">
          <Hammer className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        {loading ? (
            <DropdownMenuItem disabled>Loading user...</DropdownMenuItem>
        ) : !user ? (
          <Link href="/login" passHref legacyBehavior>
            <DropdownMenuItem asChild>
              <a><LogIn className="mr-2 h-4 w-4" />Login</a>
            </DropdownMenuItem>
          </Link>
        ) : (
          <>
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
                <a><UserCircle2 className="mr-2 h-4 w-4" />Profile</a>
              </DropdownMenuItem>
            </Link>
          </>
        )}
        
        {onOpenScripts && (
            <DropdownMenuItem onClick={onOpenScripts}>
                <FileText className="mr-2 h-4 w-4" /> Scripts
            </DropdownMenuItem>
        )}
        {onOpenSettings && (
            <DropdownMenuItem onClick={onOpenSettings}>
                <SlidersHorizontal className="mr-2 h-4 w-4" /> Settings
            </DropdownMenuItem>
        )}


        {user && !loading && (
             <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
            </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Help & Information</DropdownMenuLabel>
        {staticHelpPageItems.map(item => (
          <Link key={item.href} href={item.href} passHref legacyBehavior>
            <DropdownMenuItem asChild>
              <a><item.icon className="mr-2 h-4 w-4" />{item.label}</a>
            </DropdownMenuItem>
          </Link>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );


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

          {isMobile ? (
            <nav className="flex items-center space-x-1" aria-label="Mobile navigation">
              <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={`Toggle theme to ${darkMode ? 'light' : 'dark'} mode`} title={`Toggle theme to ${darkMode ? 'light' : 'dark'} mode`}>
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              {renderMobileMenu()}
            </nav>
          ) : (
            <nav className="hidden items-center space-x-1 md:flex" aria-label="Main navigation">
              {user && onOpenScripts && (
                <Button variant="ghost" size="sm" onClick={onOpenScripts} aria-label="Open script manager" title="Open script manager">
                  <FileText className="mr-1 h-5 w-5" /> Scripts
                </Button>
              )}
              {onOpenSettings && (
                <Button variant="ghost" size="sm" onClick={onOpenSettings} aria-label="Open settings" title="Open settings">
                    <SlidersHorizontal className="mr-1 h-5 w-5" /> Settings
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" aria-label="Open help menu" title="Open help menu">
                    <Hammer className="mr-1 h-5 w-5" /> Help
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {staticHelpPageItems.map(item => (
                    <Link key={item.href} href={item.href} passHref legacyBehavior>
                      <DropdownMenuItem asChild>
                        <a><item.icon className="mr-2 h-4 w-4" />{item.label}</a>
                      </DropdownMenuItem>
                    </Link>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={`Toggle theme to ${darkMode ? 'light' : 'dark'} mode`} title={`Toggle theme to ${darkMode ? 'light' : 'dark'} mode`}>
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <UserNavDesktop />
            </nav>
          )}
        </div>
      </div>
    </header>
  );
});

export default Header;
