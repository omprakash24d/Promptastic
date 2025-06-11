
"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Script, TeleprompterSettings } from '@/types';
import { loadFromLocalStorage, saveToLocalStorage } from '@/lib/localStorage';

const INITIAL_FONT_SIZE = 48; // px
const INITIAL_SCROLL_SPEED = 30; // px per second
const INITIAL_LINE_HEIGHT = 1.5;

// Default text colors for different modes
const INITIAL_TEXT_COLOR_LIGHT_MODE_HSL = 'hsl(0 0% 0%)'; // Black HSL
const INITIAL_TEXT_COLOR_DARK_MODE_HSL = 'hsl(0 0% 100%)'; // White HSL
const BLACK_HEX = '#000000';
const WHITE_HEX = '#ffffff';

const INITIAL_FONT_FAMILY = 'Arial, sans-serif';

// Default app theme is dark mode.
const SERVER_DEFAULT_DARK_MODE = true;
// Corresponding text color for default dark mode.
const SERVER_DEFAULT_TEXT_COLOR = INITIAL_TEXT_COLOR_DARK_MODE_HSL;

const LONGER_DEFAULT_SCRIPT_TEXT = `Welcome to Promptastic!
Your high-performance teleprompter.

This is a longer default script to help you test the scrolling functionality right away.
You can paste your own script here, or use the "Manage Scripts" panel to load, save, and import scripts.

The teleprompter will scroll automatically when you press the play button.
You can adjust the font size, scroll speed, and line height using the settings panel (gear icon).

Mirror mode is available for use with physical teleprompter setups.
Dark mode can be toggled for different lighting conditions.

Try out the AI Scroll Sync feature! Click the "AI Sync" button, speak a few lines from your script, and then click "Stop Sync." The app will (currently in a mock phase) adjust the scroll speed based on your speech.

This text should be long enough to demonstrate scrolling on most screen sizes and with default font settings.
If you find the scrolling too fast or too slow, remember to adjust the "Scroll Speed" in the settings.
You can also reset the scroll position at any time using the "Reset" button.
Use the spacebar or backspace key to quickly play or pause the scrolling.
Full-screen mode can be toggled for an immersive experience.

We hope you enjoy using Promptastic!
Feel free to experiment with all the features.
Happy prompting!`;


interface TeleprompterState extends TeleprompterSettings {
  scriptText: string;
  scripts: Script[];
  activeScriptName: string | null;
  isPlaying: boolean;
  currentScrollPosition: number;
  LONGER_DEFAULT_SCRIPT_TEXT: string; // Added to make it accessible to other parts if needed
  
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
      return {
        scriptText: LONGER_DEFAULT_SCRIPT_TEXT,
        scripts: [],
        activeScriptName: null,
        LONGER_DEFAULT_SCRIPT_TEXT: LONGER_DEFAULT_SCRIPT_TEXT,
        
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
          set({
            darkMode: newDarkModeValue,
            textColor: newDarkModeValue ? INITIAL_TEXT_COLOR_DARK_MODE_HSL : INITIAL_TEXT_COLOR_LIGHT_MODE_HSL,
          });
        },
        setIsAutoSyncEnabled: (enabled) => set({ isAutoSyncEnabled: enabled }),
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
        scripts: state.scripts,
        activeScriptName: state.activeScriptName,
        fontSize: state.fontSize,
        scrollSpeed: state.scrollSpeed,
        lineHeight: state.lineHeight,
        isMirrored: state.isMirrored,
        darkMode: state.darkMode,
        isAutoSyncEnabled: state.isAutoSyncEnabled,
        textColor: state.textColor,
        fontFamily: state.fontFamily, // Persist fontFamily
      }),
    }
  )
);

// Simplified subscription:
// Only responsible for resetting to default script text if all scripts are removed
// and the current text isn't already the default.
// Initial script loading based on activeScriptName is handled by PromptasticPage.tsx useEffect.
const unsub = useTeleprompterStore.subscribe(
  (state) => {
    const currentStore = useTeleprompterStore.getState();
    if (currentStore.scripts.length === 0 && currentStore.activeScriptName === null && currentStore.scriptText !== currentStore.LONGER_DEFAULT_SCRIPT_TEXT) {
        useTeleprompterStore.setState({ scriptText: currentStore.LONGER_DEFAULT_SCRIPT_TEXT, currentScrollPosition: 0 });
    }
  },
  (state) => ({ scripts: state.scripts, activeScriptName: state.activeScriptName, scriptText: state.scriptText, LONGER_DEFAULT_SCRIPT_TEXT: state.LONGER_DEFAULT_SCRIPT_TEXT }) 
);
