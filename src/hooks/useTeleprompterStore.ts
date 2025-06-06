
"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Script, TeleprompterSettings } from '@/types';
import { loadFromLocalStorage, saveToLocalStorage } from '@/lib/localStorage';

const INITIAL_FONT_SIZE = 48; // px
const INITIAL_SCROLL_SPEED = 30; // px per second
const INITIAL_LINE_HEIGHT = 1.5;
const INITIAL_TEXT_COLOR_LIGHT = 'hsl(215 25% 27%)'; // Matches --foreground
const INITIAL_TEXT_COLOR_DARK = 'hsl(210 30% 95%)'; // Matches dark --foreground
const INITIAL_FONT_FAMILY = 'Inter';

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
      darkMode: false, 
      isAutoSyncEnabled: false,
      textColor: INITIAL_TEXT_COLOR_LIGHT, // Default to light mode text color
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
      setDarkMode: (darkMode) => {
        set({ 
          darkMode,
          // Adjust default text color based on dark mode, if it's currently set to one of the defaults
          textColor: get().textColor === INITIAL_TEXT_COLOR_LIGHT || get().textColor === INITIAL_TEXT_COLOR_DARK 
                     ? (darkMode ? INITIAL_TEXT_COLOR_DARK : INITIAL_TEXT_COLOR_LIGHT)
                     : get().textColor
        });
        if (typeof document !== 'undefined') {
          if (darkMode) {
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
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Ensure dark mode class is set on HTML element after rehydration
          if (typeof document !== 'undefined') {
            if (state.darkMode) {
              document.documentElement.classList.add('dark');
               // If textColor is default light, change to default dark
              if (state.textColor === INITIAL_TEXT_COLOR_LIGHT) {
                state.textColor = INITIAL_TEXT_COLOR_DARK;
              }
            } else {
              document.documentElement.classList.remove('dark');
              // If textColor is default dark, change to default light
              if (state.textColor === INITIAL_TEXT_COLOR_DARK) {
                state.textColor = INITIAL_TEXT_COLOR_LIGHT;
              }
            }
          }
        }
      }
    }
  )
);

if (typeof window !== 'undefined') {
  const initialStoreState = useTeleprompterStore.getState();
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Check if darkMode is already set (e.g. from localStorage)
  let currentDarkMode = initialStoreState.darkMode;

  // If darkMode wasn't in persisted state, use system preference
  if (initialStoreState.darkMode === undefined || initialStoreState.darkMode === null) {
      currentDarkMode = systemPrefersDark;
      useTeleprompterStore.setState({ darkMode: currentDarkMode });
  }

  // Apply dark mode class and initial text color
  if (currentDarkMode) {
    document.documentElement.classList.add('dark');
    if (initialStoreState.textColor === INITIAL_TEXT_COLOR_LIGHT || !initialStoreState.textColor) {
       useTeleprompterStore.setState({ textColor: INITIAL_TEXT_COLOR_DARK });
    }
  } else {
    document.documentElement.classList.remove('dark');
    if (initialStoreState.textColor === INITIAL_TEXT_COLOR_DARK || !initialStoreState.textColor) {
       useTeleprompterStore.setState({ textColor: INITIAL_TEXT_COLOR_LIGHT });
    }
  }
}
