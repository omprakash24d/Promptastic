
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
const BLACK_HEX = '#000000';
const WHITE_HEX = '#ffffff';


const INITIAL_FONT_FAMILY = 'Arial, sans-serif';

// SSR-safe defaults for initial store state before hydration from localStorage
const SERVER_DEFAULT_DARK_MODE = false; // App defaults to light mode on first load / SSR
// SERVER_DEFAULT_TEXT_COLOR is the text color that the app's initial state (pre-hydration) will have.
// Since SERVER_DEFAULT_DARK_MODE is false (light mode), the corresponding text color is black.
const SERVER_DEFAULT_TEXT_COLOR = INITIAL_TEXT_COLOR_LIGHT_MODE;


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
    (set, get) => {
      const isEffectivelyBlack = (color: string | undefined | null): boolean => {
        if (!color) return false;
        const c = color.toLowerCase();
        return c === INITIAL_TEXT_COLOR_LIGHT_MODE || c === BLACK_HEX;
      };
      
      const isEffectivelyWhite = (color: string | undefined | null): boolean => {
        if (!color) return false;
        const c = color.toLowerCase();
        return c === INITIAL_TEXT_COLOR_DARK_MODE || c === WHITE_HEX;
      };

      return {
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
        fontFamily: INITIAL_FONT_FAMILY,
        
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
          let newFinalTextColor = currentTextColor;

          // If the app is initializing or the text color hasn't been set by user (is still the server default)
          const isInitialServerDefaultColor = currentTextColor === SERVER_DEFAULT_TEXT_COLOR || !currentTextColor;

          if (newDarkModeValue) { // Target is Dark Mode
            // If current text is effectively black (common for light mode default) or it's the initial uncustomized server default,
            // change to white.
            if (isEffectivelyBlack(currentTextColor) || isInitialServerDefaultColor) {
              newFinalTextColor = INITIAL_TEXT_COLOR_DARK_MODE; // white HSL
            }
          } else { // Target is Light Mode
            // If current text is effectively white (common for dark mode default), change to black.
            // We don't need to check for isInitialServerDefaultColor here because SERVER_DEFAULT_TEXT_COLOR is already black.
            if (isEffectivelyWhite(currentTextColor)) {
              newFinalTextColor = INITIAL_TEXT_COLOR_LIGHT_MODE; // black HSL
            }
          }
          
          set({ 
            darkMode: newDarkModeValue,
            textColor: newFinalTextColor
          });
        },
        setIsAutoSyncEnabled: (enabled) => set({ isAutoSyncEnabled: enabled }),
        // When user explicitly sets a text color, it's considered custom.
        setTextColor: (color) => set({ textColor: color }), 
        setFontFamily: (font) => set({ fontFamily: font }),

        togglePlayPause: () => set(state => ({ isPlaying: !state.isPlaying })),
        setIsPlaying: (playing) => set({ isPlaying: playing }),
        setCurrentScrollPosition: (position) => set({ currentScrollPosition: position }),
        resetScroll: () => set({ currentScrollPosition: 0, isPlaying: false }),
      }
    },
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
        textColor: state.textColor, // Persist custom text color
        fontFamily: state.fontFamily,
        // scriptText is intentionally not persisted here to avoid large localStorage items by default
        // currentScrollPosition and isPlaying are runtime states, not typically persisted
      }),
    }
  )
);
