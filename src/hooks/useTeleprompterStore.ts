
"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Script, TeleprompterSettings, FocusLineStyle, LayoutPreset, ScriptVersion } from '@/types';
import { loadFromLocalStorage, saveToLocalStorage } from '@/lib/localStorage';
import { v4 as uuidv4 } from 'uuid';


const INITIAL_FONT_SIZE = 48; // px
const INITIAL_SCROLL_SPEED = 30; // px per second
const INITIAL_LINE_HEIGHT = 1.5;

const INITIAL_TEXT_COLOR_LIGHT_MODE_HSL = 'hsl(0 0% 0%)'; // Black HSL
const INITIAL_TEXT_COLOR_DARK_MODE_HSL = 'hsl(0 0% 100%)'; // White HSL

const INITIAL_FONT_FAMILY = 'Arial, sans-serif';
const INITIAL_FOCUS_LINE_PERCENTAGE = 0.33; // 33% from the top
const INITIAL_IS_AUTO_SYNC_ENABLED = false;
const INITIAL_IS_MIRRORED = false;
const INITIAL_FOCUS_LINE_STYLE: FocusLineStyle = 'line';
const INITIAL_COUNTDOWN_ENABLED = false;
const INITIAL_COUNTDOWN_DURATION = 3; // seconds
const INITIAL_HORIZONTAL_PADDING = 0; // 0%

const SERVER_DEFAULT_DARK_MODE = true;
const SERVER_DEFAULT_TEXT_COLOR = INITIAL_TEXT_COLOR_DARK_MODE_HSL;

const LONGER_DEFAULT_SCRIPT_TEXT = `Welcome to Promptastic!
Your high-performance teleprompter.
//PAUSE//
This is a longer default script.
You can use **bold text**, *italic text*, or _underlined text_.
These can be combined, like ***bold and italic***.
//EMPHASIZE//
This part will be in the primary color.
//SLOWDOWN//
This part asks you to slow down.
Combine with formatting: **//EMPHASIZE//Formatted and Emphasized!**

Try out the AI Scroll Sync feature!
Happy prompting!`;

const DEFAULT_LAYOUT_PRESETS: LayoutPreset[] = [
  {
    name: "Default",
    settings: {
      fontSize: INITIAL_FONT_SIZE,
      lineHeight: INITIAL_LINE_HEIGHT,
      focusLinePercentage: INITIAL_FOCUS_LINE_PERCENTAGE,
      fontFamily: INITIAL_FONT_FAMILY,
      scrollSpeed: INITIAL_SCROLL_SPEED,
    }
  },
  {
    name: "Studio Recording",
    settings: {
      fontSize: 60,
      lineHeight: 1.6,
      focusLinePercentage: 0.4,
      fontFamily: "Verdana, sans-serif",
      scrollSpeed: 25,
    }
  },
  {
    name: "Presentation Rehearsal",
    settings: {
      fontSize: 40,
      lineHeight: 1.4,
      focusLinePercentage: 0.3,
      fontFamily: "Inter, sans-serif",
      scrollSpeed: 35,
    }
  },
  {
    name: "Quick Read",
    settings: {
      fontSize: 72,
      lineHeight: 1.7,
      focusLinePercentage: 0.5,
      fontFamily: "'Courier New', monospace",
      scrollSpeed: 40,
    }
  }
];


interface TeleprompterState extends TeleprompterSettings {
  scriptText: string;
  scripts: Script[];
  activeScriptName: string | null;
  isPlaying: boolean;
  currentScrollPosition: number;
  LONGER_DEFAULT_SCRIPT_TEXT: string;
  layoutPresets: LayoutPreset[];
  activeLayoutPresetName: string | null;
  countdownValue: number | null; // For countdown timer
  
  setScriptText: (text: string) => void;
  setActiveScriptName: (name: string | null) => void;
  loadScript: (name: string) => void;
  saveScript: (name: string, content?: string) => void;
  deleteScript: (name: string) => void;
  renameScript: (oldName: string, newName: string) => void;
  saveScriptVersion: (scriptName: string, notes?: string) => void;
  loadScriptVersion: (scriptName: string, versionId: string) => void;

  setFontSize: (size: number) => void;
  setScrollSpeed: (speed: number) => void;
  setLineHeight: (height: number) => void;
  setIsMirrored: (mirrored: boolean) => void;
  setDarkMode: (darkMode: boolean) => void;
  setIsAutoSyncEnabled: (enabled: boolean) => void;
  setTextColor: (color: string) => void;
  setFontFamily: (font: string) => void;
  setFocusLinePercentage: (percentage: number) => void;
  setFocusLineStyle: (style: FocusLineStyle) => void;
  setCountdownEnabled: (enabled: boolean) => void;
  setCountdownDuration: (duration: number) => void;
  setHorizontalPadding: (padding: number) => void;

  resetSettingsToDefaults: () => void;
  applyLayoutPreset: (presetName: string) => void;

  togglePlayPause: () => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentScrollPosition: (position: number) => void;
  resetScroll: () => void;
  setCountdownValue: (value: number | null) => void;
}

export const useTeleprompterStore = create<TeleprompterState>()(
  persist(
    (set, get) => {
      return {
        scriptText: LONGER_DEFAULT_SCRIPT_TEXT,
        scripts: [],
        activeScriptName: null,
        LONGER_DEFAULT_SCRIPT_TEXT: LONGER_DEFAULT_SCRIPT_TEXT,
        layoutPresets: DEFAULT_LAYOUT_PRESETS,
        activeLayoutPresetName: "Default",
        
        fontSize: INITIAL_FONT_SIZE,
        scrollSpeed: INITIAL_SCROLL_SPEED,
        lineHeight: INITIAL_LINE_HEIGHT,
        isMirrored: INITIAL_IS_MIRRORED,
        darkMode: SERVER_DEFAULT_DARK_MODE, 
        isAutoSyncEnabled: INITIAL_IS_AUTO_SYNC_ENABLED,
        textColor: SERVER_DEFAULT_TEXT_COLOR,
        fontFamily: INITIAL_FONT_FAMILY,
        focusLinePercentage: INITIAL_FOCUS_LINE_PERCENTAGE,
        focusLineStyle: INITIAL_FOCUS_LINE_STYLE,
        countdownEnabled: INITIAL_COUNTDOWN_ENABLED,
        countdownDuration: INITIAL_COUNTDOWN_DURATION,
        horizontalPadding: INITIAL_HORIZONTAL_PADDING,
        
        isPlaying: false,
        currentScrollPosition: 0,
        countdownValue: null,

        setScriptText: (text) => set({ scriptText: text, activeScriptName: null, currentScrollPosition: 0 }),
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
            scripts.push({ name, content: scriptContent, createdAt: now, updatedAt: now, versions: [] });
          }
          set({ scripts: [...scripts], activeScriptName: name, scriptText: scriptContent });
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
        saveScriptVersion: (scriptName, notes) => {
          const script = get().scripts.find(s => s.name === scriptName);
          if (script) {
            const currentContent = (get().activeScriptName === scriptName) ? get().scriptText : script.content;
            const newVersion: ScriptVersion = {
              versionId: uuidv4(),
              content: currentContent,
              timestamp: Date.now(),
              notes: notes,
            };
            const updatedScript = { ...script, versions: [...script.versions, newVersion] };
            set(state => ({
              scripts: state.scripts.map(s => s.name === scriptName ? updatedScript : s),
            }));
          }
        },
        loadScriptVersion: (scriptName, versionId) => {
          const script = get().scripts.find(s => s.name === scriptName);
          const version = script?.versions.find(v => v.versionId === versionId);
          if (script && version) {
            set({ scriptText: version.content, activeScriptName: script.name, currentScrollPosition: 0 });
          }
        },

        setFontSize: (size) => set({ fontSize: Math.max(12, size), activeLayoutPresetName: null }),
        setScrollSpeed: (speed) => set({ scrollSpeed: Math.max(1, speed), activeLayoutPresetName: null }),
        setLineHeight: (height) => set({ lineHeight: Math.max(1, height), activeLayoutPresetName: null }),
        setIsMirrored: (mirrored) => set({ isMirrored: mirrored }), 
        setDarkMode: (newDarkModeValue) => {
          set({
            darkMode: newDarkModeValue,
            textColor: newDarkModeValue ? INITIAL_TEXT_COLOR_DARK_MODE_HSL : INITIAL_TEXT_COLOR_LIGHT_MODE_HSL,
          });
        },
        setIsAutoSyncEnabled: (enabled) => set({ isAutoSyncEnabled: enabled }),
        setTextColor: (color) => set({ textColor: color }), 
        setFontFamily: (font) => set({ fontFamily: font, activeLayoutPresetName: null }),
        setFocusLinePercentage: (percentage) => set({ focusLinePercentage: Math.max(0.1, Math.min(0.9, percentage)), activeLayoutPresetName: null }),
        setFocusLineStyle: (style) => set({ focusLineStyle: style, activeLayoutPresetName: null }),
        setCountdownEnabled: (enabled) => set({ countdownEnabled: enabled }),
        setCountdownDuration: (duration) => set({ countdownDuration: Math.max(1, Math.min(10, duration)) }),
        setHorizontalPadding: (padding) => set({ horizontalPadding: Math.max(0, Math.min(25, padding)), activeLayoutPresetName: null }),
        
        applyLayoutPreset: (presetName) => {
          const preset = get().layoutPresets.find(p => p.name === presetName);
          if (preset) {
            set(state => ({ ...state, ...preset.settings, activeLayoutPresetName: presetName }));
          }
        },

        resetSettingsToDefaults: () => {
          const currentDarkMode = get().darkMode;
          const defaultPreset = get().layoutPresets.find(p => p.name === "Default") || { settings: {} };
          set({
            fontSize: defaultPreset.settings.fontSize ?? INITIAL_FONT_SIZE,
            scrollSpeed: defaultPreset.settings.scrollSpeed ?? INITIAL_SCROLL_SPEED,
            lineHeight: defaultPreset.settings.lineHeight ?? INITIAL_LINE_HEIGHT,
            isMirrored: INITIAL_IS_MIRRORED,
            isAutoSyncEnabled: INITIAL_IS_AUTO_SYNC_ENABLED,
            textColor: currentDarkMode ? INITIAL_TEXT_COLOR_DARK_MODE_HSL : INITIAL_TEXT_COLOR_LIGHT_MODE_HSL,
            fontFamily: defaultPreset.settings.fontFamily ?? INITIAL_FONT_FAMILY,
            focusLinePercentage: defaultPreset.settings.focusLinePercentage ?? INITIAL_FOCUS_LINE_PERCENTAGE,
            focusLineStyle: INITIAL_FOCUS_LINE_STYLE,
            countdownEnabled: INITIAL_COUNTDOWN_ENABLED,
            countdownDuration: INITIAL_COUNTDOWN_DURATION,
            horizontalPadding: INITIAL_HORIZONTAL_PADDING,
            activeLayoutPresetName: "Default",
          });
        },

        togglePlayPause: () => {
          const { isPlaying, countdownEnabled, setCountdownValue, setIsPlaying, countdownDuration } = get();
          if (isPlaying) {
            setIsPlaying(false);
            setCountdownValue(null); // Clear countdown if pausing
          } else {
            if (countdownEnabled) {
              setCountdownValue(countdownDuration); // Start countdown with user-defined duration
              // setIsPlaying will be called by TeleprompterView after countdown
            } else {
              setIsPlaying(true); // Play immediately
            }
          }
        },
        setIsPlaying: (playing) => set({ isPlaying: playing }),
        setCurrentScrollPosition: (position) => set({ currentScrollPosition: position }),
        resetScroll: () => set({ currentScrollPosition: 0, isPlaying: false, countdownValue: null }),
        setCountdownValue: (value) => set({ countdownValue: value }),
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
        fontFamily: state.fontFamily,
        focusLinePercentage: state.focusLinePercentage,
        focusLineStyle: state.focusLineStyle,
        layoutPresets: state.layoutPresets, 
        activeLayoutPresetName: state.activeLayoutPresetName,
        countdownEnabled: state.countdownEnabled,
        countdownDuration: state.countdownDuration,
        horizontalPadding: state.horizontalPadding,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (!state.layoutPresets || state.layoutPresets.length === 0) {
            state.layoutPresets = DEFAULT_LAYOUT_PRESETS;
            state.activeLayoutPresetName = "Default";
          }
          state.focusLineStyle = state.focusLineStyle ?? INITIAL_FOCUS_LINE_STYLE;
          state.scripts = state.scripts?.map(s => ({ ...s, versions: s.versions ?? [] })) ?? [];
          state.countdownEnabled = state.countdownEnabled ?? INITIAL_COUNTDOWN_ENABLED;
          state.countdownDuration = state.countdownDuration ?? INITIAL_COUNTDOWN_DURATION;
          state.horizontalPadding = state.horizontalPadding ?? INITIAL_HORIZONTAL_PADDING;
        }
      }
    }
  )
);

const unsub = useTeleprompterStore.subscribe(
  (state) => {
    const currentStore = useTeleprompterStore.getState();
    if (currentStore.scripts.length === 0 && currentStore.activeScriptName === null && currentStore.scriptText !== currentStore.LONGER_DEFAULT_SCRIPT_TEXT) {
        useTeleprompterStore.setState({ scriptText: currentStore.LONGER_DEFAULT_SCRIPT_TEXT, currentScrollPosition: 0 });
    }
  },
  (state) => ({ scripts: state.scripts, activeScriptName: state.activeScriptName, scriptText: state.scriptText, LONGER_DEFAULT_SCRIPT_TEXT: state.LONGER_DEFAULT_SCRIPT_TEXT }) 
);

