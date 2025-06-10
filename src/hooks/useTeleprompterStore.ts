
"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Script, TeleprompterSettings } from '@/types';
import { loadFromLocalStorage, saveToLocalStorage } from '@/lib/localStorage';

const INITIAL_FONT_SIZE = 48; // px
const INITIAL_SCROLL_SPEED = 30; // px per second
const INITIAL_LINE_HEIGHT = 1.5;

// Default text colors for different modes
const INITIAL_TEXT_COLOR_LIGHT_MODE = 'hsl(0 0% 0%)'; // Black
const INITIAL_TEXT_COLOR_DARK_MODE = 'hsl(0 0% 100%)'; // White

const INITIAL_FONT_FAMILY = 'Arial, sans-serif';

// SSR-safe defaults for initial store state before hydration from localStorage
const SERVER_DEFAULT_DARK_MODE = false; // App defaults to light mode on first load / SSR
const SERVER_DEFAULT_TEXT_COLOR = INITIAL_TEXT_COLOR_LIGHT_MODE; // Default text color for SSR / initial light mode
const SERVER_DEFAULT_FONT_FAMILY = INITIAL_FONT_FAMILY;


interface TeleprompterState extends TeleprompterSettings {
  scriptText: string;
  scripts: Script[];
  activeScriptName: string | null;
  isPlaying: boolean;
  currentScrollPosition: number;
  
  // Actions
  setScriptText: (text: string) => void;
  setActiveScriptName: (name: string | null) => void;
  loadScript: (name: string) => void;
  saveScript: (name: string, content?: string) => void;
  deleteScript: (name: string) => void;
  renameScript: (oldName: string, newName: string) => void;

  setFontSize: (size: number) => void;
  setScrollSpeed: (speed: number) => void;
  setLineHeight: (height: number) => void;
  setIsMirrored: (mirrored: boolean) => void;
  setDarkMode: (darkMode: boolean) => void;
  setIsAutoSyncEnabled: (enabled: boolean) => void;
  setTextColor: (color: string) => void;
  setFontFamily: (font: string) => void;

  togglePlayPause: () => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentScrollPosition: (position: number) => void;
  resetScroll: () => void;
}

export const useTeleprompterStore = create<TeleprompterState>()(
  persist(
    (set, get) => ({
      scriptText: "Welcome to Promptastic!\n\nPaste your script here or load an existing one.\n\nAdjust settings using the gear icon.",
      scripts: [],
      activeScriptName: null,
      
      fontSize: INITIAL_FONT_SIZE,
      scrollSpeed: INITIAL_SCROLL_SPEED,
      lineHeight: INITIAL_LINE_HEIGHT,
      isMirrored: false,
      darkMode: SERVER_DEFAULT_DARK_MODE, 
      isAutoSyncEnabled: false,
      textColor: SERVER_DEFAULT_TEXT_COLOR,
      fontFamily: SERVER_DEFAULT_FONT_FAMILY,
      
      isPlaying: false,
      currentScrollPosition: 0,

      setScriptText: (text) => set({ scriptText: text, activeScriptName: null }),
      setActiveScriptName: (name) => set({ activeScriptName: name }),
      
      loadScript: (name) => {
        const script = get().scripts.find(s => s.name === name);
        if (script) {
          set({ scriptText: script.content, activeScriptName: name, currentScrollPosition: 0 });
        }
      },
      saveScript: (name, content) => {
        const scriptContent = content ?? get().scriptText;
        const now = Date.now();
        let scripts = get().scripts;
        const existingScriptIndex = scripts.findIndex(s => s.name === name);

        if (existingScriptIndex > -1) {
          scripts[existingScriptIndex] = { ...scripts[existingScriptIndex], content: scriptContent, updatedAt: now };
        } else {
          scripts.push({ name, content: scriptContent, createdAt: now, updatedAt: now });
        }
        set({ scripts: [...scripts], activeScriptName: name });
      },
      deleteScript: (name) => {
        set(state => ({
          scripts: state.scripts.filter(s => s.name !== name),
          activeScriptName: state.activeScriptName === name ? null : state.activeScriptName,
          scriptText: state.activeScriptName === name ? "" : state.scriptText,
        }));
      },
      renameScript: (oldName, newName) => {
        set(state => ({
          scripts: state.scripts.map(s => s.name === oldName ? { ...s, name: newName } : s),
          activeScriptName: state.activeScriptName === oldName ? newName : state.activeScriptName,
        }));
      },

      setFontSize: (size) => set({ fontSize: Math.max(12, size) }),
      setScrollSpeed: (speed) => set({ scrollSpeed: Math.max(1, speed) }),
      setLineHeight: (height) => set({ lineHeight: Math.max(1, height) }),
      setIsMirrored: (mirrored) => set({ isMirrored: mirrored }),
      
      setDarkMode: (newDarkModeValue) => {
        const currentTextColor = get().textColor;
        // Determine the appropriate default text color for the mode we are switching TO.
        const newDefaultTextColorForMode = newDarkModeValue ? INITIAL_TEXT_COLOR_DARK_MODE : INITIAL_TEXT_COLOR_LIGHT_MODE;
        // Determine what the default text color was for the mode we are switching FROM.
        const previousModeDefaultTextColor = !newDarkModeValue ? INITIAL_TEXT_COLOR_DARK_MODE : INITIAL_TEXT_COLOR_LIGHT_MODE;
        
        let finalTextColor = currentTextColor;

        // If the current text color was the default for the *previous* mode,
        // or if it was the initial server default (which is light mode's default black),
        // or if textColor is somehow undefined/empty (should not happen with initial defaults),
        // then update textColor to the new mode's default.
        // Otherwise, the user has selected a custom color, and it should be preserved.
        if (
          currentTextColor === previousModeDefaultTextColor ||
          currentTextColor === SERVER_DEFAULT_TEXT_COLOR || 
          !currentTextColor 
        ) {
          finalTextColor = newDefaultTextColorForMode;
        }
        
        set({ 
          darkMode: newDarkModeValue,
          textColor: finalTextColor
        });
      },
      setIsAutoSyncEnabled: (enabled) => set({ isAutoSyncEnabled: enabled }),
      setTextColor: (color) => set({ textColor: color }), // Allows user to set any custom color
      setFontFamily: (font) => set({ fontFamily: font }),

      togglePlayPause: () => set(state => ({ isPlaying: !state.isPlaying })),
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setCurrentScrollPosition: (position) => set({ currentScrollPosition: position }),
      resetScroll: () => set({ currentScrollPosition: 0, isPlaying: false }),
    }),
    {
      name: 'promptastic-store',
      storage: createJSONStorage(() => ({
        getItem: (name) => JSON.stringify(loadFromLocalStorage(name, {})),
        setItem: (name, value) => saveToLocalStorage(name, JSON.parse(value)),
        removeItem: (name) => typeof window !== 'undefined' ? localStorage.removeItem(name) : undefined,
      })),
      partialize: (state) => ({
        // Only persist these specific parts of the state
        scripts: state.scripts,
        activeScriptName: state.activeScriptName,
        fontSize: state.fontSize,
        scrollSpeed: state.scrollSpeed,
        lineHeight: state.lineHeight,
        isMirrored: state.isMirrored,
        darkMode: state.darkMode,
        isAutoSyncEnabled: state.isAutoSyncEnabled,
        textColor: state.textColor,
        fontFamily: state.fontFamily,
        // scriptText is intentionally not persisted here to avoid large localStorage items by default
        // currentScrollPosition and isPlaying are runtime states, not typically persisted
      }),
    }
  )
);
