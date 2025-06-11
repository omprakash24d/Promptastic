
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
const BLACK_RGB = 'rgb(0,0,0)';
const WHITE_RGB = 'rgb(255,255,255)';


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
Use the spacebar to quickly play or pause the scrolling.
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
      // Helper to check if a color is effectively black (HSL, Hex, or RGB)
      // Normalizes by removing spaces for rgb formats e.g. "rgb(0, 0, 0)" -> "rgb(0,0,0)"
      const isEffectivelyBlack = (color: string | undefined | null): boolean => {
        if (!color) return false;
        const c = color.toLowerCase().replace(/\s/g, '');
        return c === INITIAL_TEXT_COLOR_LIGHT_MODE_HSL.toLowerCase() || 
               c === BLACK_HEX.toLowerCase() ||
               c === BLACK_RGB;
      };
      
      // Helper to check if a color is effectively white (HSL, Hex, or RGB)
      const isEffectivelyWhite = (color: string | undefined | null): boolean => {
        if (!color) return false;
        const c = color.toLowerCase().replace(/\s/g, '');
        return c === INITIAL_TEXT_COLOR_DARK_MODE_HSL.toLowerCase() || 
               c === WHITE_HEX.toLowerCase() ||
               c === WHITE_RGB;
      };

      return {
        scriptText: LONGER_DEFAULT_SCRIPT_TEXT,
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
          // Always set text to white in dark mode and black in light mode
          // This prioritizes visibility over preserving custom colors across theme changes.
          let newFinalTextColor;
          if (newDarkModeValue) { // Switching to Dark Mode
            newFinalTextColor = INITIAL_TEXT_COLOR_DARK_MODE_HSL;
          } else { // Switching to Light Mode
            newFinalTextColor = INITIAL_TEXT_COLOR_LIGHT_MODE_HSL;
          }
          set({ 
            darkMode: newDarkModeValue,
            textColor: newFinalTextColor 
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
        // Do not persist scriptText directly if it should always start with a default or loaded script.
        // If you want to persist the current scriptText even without saving, add it here.
        // scriptText: state.scriptText 
      }),
    }
  )
);

// Effect to ensure that when the store initializes and activeScriptName is set,
// if scriptText is empty or still the default welcome message while activeScriptName points to a real script,
// the active script's content is loaded into scriptText.
// Also, if no activeScriptName but scripts exist, load the first script.
// This is a bit of a workaround for complex initial state hydration with persisted activeScriptName.
const unsub = useTeleprompterStore.subscribe(
  (state, prevState) => {
    // This logic tries to ensure a sensible script is loaded on initialization
    // especially when activeScriptName is persisted.
    if (state.scripts.length > 0 && 
        (!state.scriptText || state.scriptText === LONGER_DEFAULT_SCRIPT_TEXT || state.scriptText === "") &&
        !state.isPlaying /* Only run this if not actively playing to avoid interruptions */
      ) {
      
      let scriptToAutoLoadName: string | null = null;

      if (state.activeScriptName && state.scripts.some(s => s.name === state.activeScriptName)) {
        // If a valid activeScriptName exists, prioritize it
        const activeScript = state.scripts.find(s => s.name === state.activeScriptName);
        if (activeScript && activeScript.content !== state.scriptText) {
            scriptToAutoLoadName = state.activeScriptName;
        }
      } else if (state.scripts.length > 0) {
        // If no valid activeScriptName, or activeScriptName points to a non-existent script,
        // load the first script in the list.
        scriptToAutoLoadName = state.scripts[0].name;
      }

      if (scriptToAutoLoadName) {
        // Check if this subscription is still active to avoid errors during HMR or unmount
        if (typeof unsub === 'function') { 
            // Temporarily set isPlaying to true to prevent recursive calls from loadScript setting position
            // This is a bit of a hack and suggests the state logic could be further refined.
            // Alternatively, `loadScript` could have an option to not reset scroll.
            const originalIsPlaying = state.isPlaying;
            useTeleprompterStore.setState({ isPlaying: true });
            useTeleprompterStore.getState().loadScript(scriptToAutoLoadName);
            useTeleprompterStore.setState({ isPlaying: originalIsPlaying, currentScrollPosition: 0 });
        }
      }
    } else if (state.scripts.length === 0 && state.activeScriptName === null && state.scriptText !== LONGER_DEFAULT_SCRIPT_TEXT) {
        // If all scripts are deleted and no active script, reset to default welcome message.
         if (typeof unsub === 'function') {
            useTeleprompterStore.setState({ scriptText: LONGER_DEFAULT_SCRIPT_TEXT, currentScrollPosition: 0 });
         }
    }
  },
  // Selector to run the effect only when relevant parts change.
  // For initial load, we mainly care about scripts and activeScriptName being populated from persistence.
  (state) => ({ scripts: state.scripts, activeScriptName: state.activeScriptName, scriptText: state.scriptText, isPlaying: state.isPlaying }) 
);
// Consider the lifecycle of this subscription, especially with HMR or if the store is ever unmounted/recreated.
// For a simple app, this might be fine. For more complex scenarios, this logic might live better inside
// the `PromptasticPage` component's useEffect.


// The isEffectivelyBlack and isEffectivelyWhite helpers were removed from here as they were
// simplified in the setDarkMode logic to always switch to default black/white.
// If more nuanced color preservation is needed in the future, they might be reintroduced.


