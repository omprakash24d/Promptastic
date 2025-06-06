"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Script, TeleprompterSettings } from '@/types';
import { loadFromLocalStorage, saveToLocalStorage } from '@/lib/localStorage';

const INITIAL_FONT_SIZE = 48; // px
const INITIAL_SCROLL_SPEED = 30; // px per second
const INITIAL_LINE_HEIGHT = 1.5;

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
      darkMode: false, // System preference can be checked in useEffect in page.tsx
      isAutoSyncEnabled: false,
      
      isPlaying: false,
      currentScrollPosition: 0,
      isSettingsPanelOpen: false,

      // Actions
      setScriptText: (text) => set({ scriptText: text, activeScriptName: null }), // Clear active script if text is manually changed
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

      setFontSize: (size) => set({ fontSize: Math.max(12, size) }), // Min font size 12px
      setScrollSpeed: (speed) => set({ scrollSpeed: Math.max(1, speed) }), // Min speed 1
      setLineHeight: (height) => set({ lineHeight: Math.max(1, height) }), // Min line height 1
      setIsMirrored: (mirrored) => set({ isMirrored: mirrored }),
      setDarkMode: (darkMode) => {
        set({ darkMode });
        if (typeof document !== 'undefined') {
          if (darkMode) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      },
      setIsAutoSyncEnabled: (enabled) => set({ isAutoSyncEnabled: enabled }),

      togglePlayPause: () => set(state => ({ isPlaying: !state.isPlaying })),
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setCurrentScrollPosition: (position) => set({ currentScrollPosition: position }),
      resetScroll: () => set({ currentScrollPosition: 0, isPlaying: false }),

      toggleSettingsPanel: () => set(state => ({ isSettingsPanelOpen: !state.isSettingsPanelOpen })),
      setSettingsPanelOpen: (isOpen) => set({isSettingsPanelOpen: isOpen}),
    }),
    {
      name: 'promptastic-store', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => ({
        getItem: (name) => JSON.stringify(loadFromLocalStorage(name, {})),
        setItem: (name, value) => saveToLocalStorage(name, JSON.parse(value)),
        removeItem: (name) => typeof window !== 'undefined' ? localStorage.removeItem(name) : undefined,
      })),
      partialize: (state) => ({ // Persist only these parts of the state
        scripts: state.scripts,
        activeScriptName: state.activeScriptName,
        fontSize: state.fontSize,
        scrollSpeed: state.scrollSpeed,
        lineHeight: state.lineHeight,
        isMirrored: state.isMirrored,
        darkMode: state.darkMode,
        isAutoSyncEnabled: state.isAutoSyncEnabled,
        // Do not persist scriptText, isPlaying, currentScrollPosition, isSettingsPanelOpen by default
      }),
    }
  )
);

// Initialize dark mode based on persisted state or system preference
if (typeof window !== 'undefined') {
  const initialDarkMode = useTeleprompterStore.getState().darkMode;
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const darkMode = initialDarkMode ?? systemPrefersDark; // Use persisted if available, else system
  
  if (darkMode) {
    document.documentElement.classList.add('dark');
    useTeleprompterStore.setState({ darkMode: true }); // Ensure store is updated if system preference was used
  } else {
    document.documentElement.classList.remove('dark');
     useTeleprompterStore.setState({ darkMode: false });
  }
}
