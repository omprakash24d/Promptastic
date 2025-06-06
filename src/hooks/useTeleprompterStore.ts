
"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Script, TeleprompterSettings } from '@/types';
import { loadFromLocalStorage, saveToLocalStorage } from '@/lib/localStorage';

const INITIAL_FONT_SIZE = 48; // px
const INITIAL_SCROLL_SPEED = 30; // px per second
const INITIAL_LINE_HEIGHT = 1.5;

// Previous default colors, for migration/checking if user had these set
const PREVIOUS_DEFAULT_TEXT_COLOR_LIGHT = 'hsl(215 25% 27%)'; 
const PREVIOUS_DEFAULT_TEXT_COLOR_DARK = 'hsl(210 30% 95%)';

// New default text colors
const INITIAL_TEXT_COLOR_LIGHT_MODE = 'hsl(0 0% 0%)'; // Black
const INITIAL_TEXT_COLOR_DARK_MODE = 'hsl(0 0% 100%)'; // White

const INITIAL_FONT_FAMILY = 'Arial, sans-serif'; // Default to Arial

interface TeleprompterState extends TeleprompterSettings {
  scriptText: string;
  scripts: Script[];
  activeScriptName: string | null;
  isPlaying: boolean;
  currentScrollPosition: number;
  isSettingsPanelOpen: boolean;
  
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

  toggleSettingsPanel: () => void;
  setSettingsPanelOpen: (isOpen: boolean) => void;
}

// Determine initial dark mode preference
let systemPrefersDark = false;
if (typeof window !== 'undefined') {
  systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
}

const initialDarkModeState = loadFromLocalStorage('promptastic-store', { darkMode: undefined }).darkMode ?? systemPrefersDark;

export const useTeleprompterStore = create<TeleprompterState>()(
  persist(
    (set, get) => ({
      // Initial State
      scriptText: "Welcome to Promptastic!\n\nPaste your script here or load an existing one.\n\nAdjust settings using the gear icon.",
      scripts: [],
      activeScriptName: null,
      
      fontSize: INITIAL_FONT_SIZE,
      scrollSpeed: INITIAL_SCROLL_SPEED,
      lineHeight: INITIAL_LINE_HEIGHT,
      isMirrored: false,
      darkMode: initialDarkModeState, 
      isAutoSyncEnabled: false,
      textColor: initialDarkModeState ? INITIAL_TEXT_COLOR_DARK_MODE : INITIAL_TEXT_COLOR_LIGHT_MODE,
      fontFamily: INITIAL_FONT_FAMILY,
      
      isPlaying: false,
      currentScrollPosition: 0,
      isSettingsPanelOpen: false,

      // Actions
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
        const newDefaultTextColorForMode = newDarkModeValue ? INITIAL_TEXT_COLOR_DARK_MODE : INITIAL_TEXT_COLOR_LIGHT_MODE;
        
        let finalTextColor = currentTextColor;

        // If current color is one of the known global defaults (old or new), then update it.
        if (
          currentTextColor === PREVIOUS_DEFAULT_TEXT_COLOR_LIGHT ||
          currentTextColor === PREVIOUS_DEFAULT_TEXT_COLOR_DARK ||
          currentTextColor === INITIAL_TEXT_COLOR_LIGHT_MODE ||
          currentTextColor === INITIAL_TEXT_COLOR_DARK_MODE ||
          !currentTextColor // handles undefined/empty case
        ) {
          finalTextColor = newDefaultTextColorForMode;
        }
        // If it's a custom color, it remains as currentTextColor (which is already assigned to finalTextColor)

        set({ 
          darkMode: newDarkModeValue,
          textColor: finalTextColor
        });

        if (typeof document !== 'undefined') {
          if (newDarkModeValue) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      },
      setIsAutoSyncEnabled: (enabled) => set({ isAutoSyncEnabled: enabled }),
      setTextColor: (color) => set({ textColor: color }),
      setFontFamily: (font) => set({ fontFamily: font }),

      togglePlayPause: () => set(state => ({ isPlaying: !state.isPlaying })),
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setCurrentScrollPosition: (position) => set({ currentScrollPosition: position }),
      resetScroll: () => set({ currentScrollPosition: 0, isPlaying: false }),

      toggleSettingsPanel: () => set(state => ({ isSettingsPanelOpen: !state.isSettingsPanelOpen })),
      setSettingsPanelOpen: (isOpen) => set({isSettingsPanelOpen: isOpen}),
    }),
    {
      name: 'promptastic-store',
      storage: createJSONStorage(() => ({
        getItem: (name) => JSON.stringify(loadFromLocalStorage(name, {})),
        setItem: (name, value) => saveToLocalStorage(name, JSON.parse(value)),
        removeItem: (name) => typeof window !== 'undefined' ? localStorage.removeItem(name) : undefined,
      })),
      partialize: (state) => ({
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
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) { console.warn('Hydration error in Zustand:', error); return; }
        if (state) {
          // Apply dark mode class
          if (typeof document !== 'undefined') {
            if (state.darkMode) {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          }

          // Adjust textColor if it's a default that mismatches the hydrated darkMode
          // or if it's one of the very old defaults.
          const isPreviousDefaultLight = state.textColor === PREVIOUS_DEFAULT_TEXT_COLOR_LIGHT;
          const isPreviousDefaultDark = state.textColor === PREVIOUS_DEFAULT_TEXT_COLOR_DARK;
          const isNewDefaultLight = state.textColor === INITIAL_TEXT_COLOR_LIGHT_MODE;
          const isNewDefaultDark = state.textColor === INITIAL_TEXT_COLOR_DARK_MODE;

          if (state.darkMode) { // Should be dark text color (white)
            // If color is any light default (old or new), or unset, set to dark default
            if (isPreviousDefaultLight || isNewDefaultLight || !state.textColor) {
              state.textColor = INITIAL_TEXT_COLOR_DARK_MODE;
            }
          } else { // Should be light text color (black)
            // If color is any dark default (old or new), or unset, set to light default
            if (isPreviousDefaultDark || isNewDefaultDark || !state.textColor) {
              state.textColor = INITIAL_TEXT_COLOR_LIGHT_MODE;
            }
          }
          // If user had a custom color (not matching any of these defaults), it remains untouched.
        }
      }
    }
  )
);

// This block runs once on client-side initialization to set up dark mode based on system preference
// IF no value was hydrated from localStorage for darkMode.
// It also ensures the textColor is correctly initialized based on the determined darkMode.
if (typeof window !== 'undefined') {
  const store = useTeleprompterStore.getState();
  let currentDarkMode = store.darkMode; // This will be the hydrated value or initial value

  // If darkMode was undefined from hydration (e.g. first visit, nothing in localStorage),
  // then systemPrefersDark (calculated above) would have been used for initialDarkModeState.
  // So, currentDarkMode should be correctly set at this point.

  if (currentDarkMode) {
    document.documentElement.classList.add('dark');
    // If textColor is the light default or unset, switch to dark default
    if (store.textColor === INITIAL_TEXT_COLOR_LIGHT_MODE || 
        store.textColor === PREVIOUS_DEFAULT_TEXT_COLOR_LIGHT || 
        !store.textColor) {
       useTeleprompterStore.setState({ textColor: INITIAL_TEXT_COLOR_DARK_MODE });
    }
  } else {
    document.documentElement.classList.remove('dark');
    // If textColor is the dark default or unset, switch to light default
    if (store.textColor === INITIAL_TEXT_COLOR_DARK_MODE || 
        store.textColor === PREVIOUS_DEFAULT_TEXT_COLOR_DARK || 
        !store.textColor) {
       useTeleprompterStore.setState({ textColor: INITIAL_TEXT_COLOR_LIGHT_MODE });
    }
  }
}

    