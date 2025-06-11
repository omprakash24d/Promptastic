
"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Script, TeleprompterSettings, FocusLineStyle, LayoutPreset, ScriptVersion, UserSettingsProfile } from '@/types';
import { loadFromLocalStorage, saveToLocalStorage } from '@/lib/localStorage';
import { v4 as uuidv4 } from 'uuid';
import {
  fetchUserScripts,
  saveUserScript as saveUserScriptToFirestore,
  deleteUserScript as deleteUserScriptFromFirestore,
  saveUserScriptVersion as saveUserScriptVersionToFirestore,
} from '@/firebase/firestoreService';
import { toast } from "@/hooks/use-toast";

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
const INITIAL_HORIZONTAL_PADDING = 3; // percentage
const INITIAL_ENABLE_HIGH_CONTRAST = false;

const SERVER_DEFAULT_DARK_MODE = true;
const SERVER_DEFAULT_TEXT_COLOR = INITIAL_TEXT_COLOR_DARK_MODE_HSL;

const LONGER_DEFAULT_SCRIPT_TEXT = `Welcome to Promptastic!
Your modern, high-performance teleprompter designed to help you deliver scripts smoothly and professionally.

This is a sample script to guide you through Promptastic's features.
To get started, you can:
1.  **Manage Your Scripts**: Click the "Scripts" button in the header (or in the main menu on mobile) to open the Script Manager.
    *   Create new scripts or edit this one.
    *   Save your scripts (they sync to the cloud if you're logged in, or save locally otherwise).
    *   Load existing scripts.
    *   Import scripts from .txt, .md, .pdf, and .docx files.
    *   Export the current script as a .txt file.
    *   Save and load different versions of your scripts.
//PAUSE//
(This "//PAUSE//" cue indicates a brief pause in delivery. The teleprompter will show a visual cue.)

2.  **Customize Your View**: Click the "Settings" button in the header (or main menu on mobile).
    *   Adjust **font size**, *scroll speed*, _line spacing_, colors, and font family (including Atkinson Hyperlegible for high readability).
    *   Change the focus line style (line or shaded paragraph) and its vertical position.
    *   Use "Mirror Mode" for physical teleprompter hardware.
    *   Toggle themes: Light, Dark, and High-Contrast.
    *   Set up a countdown timer before playback (e.g., 3-2-1).
    *   Adjust horizontal text padding to narrow or widen the script column.
    *   Apply predefined "Layout Presets" or save your favorite setting combinations as "Settings Profiles".

**Understanding Formatting & Cues:**

Promptastic supports basic text formatting:
*   Use **double asterisks for bold text**.
*   Use *single asterisks for italic text*.
*   Use _underscores for underlined text_.
*   You can even combine them, like ***bold and italic text***.

Special Visual Cues (these are not spoken):
//EMPHASIZE//
The text immediately following this cue will be highlighted (usually in your app's primary color) to draw your attention. This is great for key phrases or words you want to stress.

//SLOWDOWN//
This cue suggests you should reduce your speaking pace for the section that follows. Helpful for complex points or to add dramatic effect.

Combine formatting with cues: **//EMPHASIZE//This important point is bold and emphasized!**

**Advanced Features:**

*   **AI Scroll Sync (Experimental)**: Enable this in Settings, then use the "AI Sync" button (microphone icon) in the playback controls. The app will attempt to listen to your speech and adjust scroll speed. (Note: Speech analysis is currently a placeholder and requires future integration with a Speech-to-Text API for full functionality.)
*   **AI Script Summary**: In the Script Manager or via the playback controls, click "Summarize" to get an AI-generated summary of your script.

**About the Developer:**
Promptastic! was developed by Om Prakash. To learn more about the project and the developer, please visit the "About Us" page accessible from the "Help" menu in the header.

//PAUSE//

We hope you find Promptastic! useful for all your presentation needs.
Explore all the settings and features to tailor it perfectly for you.
Happy prompting and successful presentations!
`;

const DEFAULT_LAYOUT_PRESETS: LayoutPreset[] = [
  {
    name: "Default",
    settings: {
      fontSize: INITIAL_FONT_SIZE,
      lineHeight: INITIAL_LINE_HEIGHT,
      focusLinePercentage: INITIAL_FOCUS_LINE_PERCENTAGE,
      fontFamily: INITIAL_FONT_FAMILY,
      scrollSpeed: INITIAL_SCROLL_SPEED,
      focusLineStyle: INITIAL_FOCUS_LINE_STYLE,
      horizontalPadding: INITIAL_HORIZONTAL_PADDING,
      countdownEnabled: INITIAL_COUNTDOWN_ENABLED,
      countdownDuration: INITIAL_COUNTDOWN_DURATION,
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
      focusLineStyle: 'line',
      horizontalPadding: 5,
      countdownEnabled: true,
      countdownDuration: 5,
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
      focusLineStyle: 'shadedParagraph',
      horizontalPadding: 10,
      countdownEnabled: false,
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
      focusLineStyle: 'line',
      horizontalPadding: 0,
      countdownEnabled: true,
      countdownDuration: 2,
    }
  }
];


interface TeleprompterStateStore extends TeleprompterSettings {
  scriptText: string;
  scripts: Script[];
  activeScriptName: string | null; // Name of the active script, used as a key
  currentUserId: string | null; // To track logged-in user for Firestore operations

  isPlaying: boolean;
  currentScrollPosition: number;
  LONGER_DEFAULT_SCRIPT_TEXT: string;
  layoutPresets: LayoutPreset[];
  activeLayoutPresetName: string | null;
  countdownValue: number | null;
  isPresentationMode: boolean;
  enableHighContrast: boolean;
  userSettingsProfiles: UserSettingsProfile[];

  setScriptText: (text: string) => void;
  setActiveScriptName: (name: string | null) => void;
  
  loadScript: (scriptName: string) => void;
  saveScript: (name: string, content?: string) => Promise<void>;
  deleteScript: (scriptName: string) => Promise<void>;
  renameScript: (oldName: string, newName: string) => Promise<void>;
  duplicateScript: (scriptName: string) => Promise<string | null>;
  saveScriptVersion: (scriptName: string, notes?: string) => Promise<void>;
  loadScriptVersion: (scriptName: string, versionId: string) => void;
  
  initializeUserScripts: (userId: string) => Promise<void>;
  clearUserScripts: () => void;
  setCurrentUserId: (userId: string | null) => void;


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
  setEnableHighContrast: (enabled: boolean) => void;
  setIsPresentationMode: (enabled: boolean) => void;

  resetSettingsToDefaults: () => void;
  applyLayoutPreset: (presetName: string) => void;

  saveUserSettingsProfile: (name: string) => void;
  loadUserSettingsProfile: (profileId: string) => void;
  deleteUserSettingsProfile: (profileId: string) => void;
  renameUserSettingsProfile: (profileId: string, newName: string) => void;

  togglePlayPause: () => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentScrollPosition: (position: number) => void;
  resetScroll: () => void;
  setCountdownValue: (value: number | null | ((prev: number | null) => number | null)) => void;
}

export const useTeleprompterStore = create<TeleprompterStateStore>()(
  persist(
    (set, get) => {
      const getSettingsForProfile = (): Omit<TeleprompterSettings, 'darkMode' | 'enableHighContrast'> => {
        const state = get();
        return {
          fontSize: state.fontSize,
          scrollSpeed: state.scrollSpeed,
          lineHeight: state.lineHeight,
          isMirrored: state.isMirrored,
          isAutoSyncEnabled: state.isAutoSyncEnabled,
          textColor: state.textColor,
          fontFamily: state.fontFamily,
          focusLinePercentage: state.focusLinePercentage,
          focusLineStyle: state.focusLineStyle,
          countdownEnabled: state.countdownEnabled,
          countdownDuration: state.countdownDuration,
          horizontalPadding: state.horizontalPadding,
        };
      };

      return {
        scriptText: LONGER_DEFAULT_SCRIPT_TEXT,
        scripts: [],
        activeScriptName: null,
        currentUserId: null,
        LONGER_DEFAULT_SCRIPT_TEXT: LONGER_DEFAULT_SCRIPT_TEXT,
        layoutPresets: DEFAULT_LAYOUT_PRESETS,
        activeLayoutPresetName: "Default",
        isPresentationMode: false,
        enableHighContrast: INITIAL_ENABLE_HIGH_CONTRAST,
        userSettingsProfiles: [],
        
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

        setCurrentUserId: (userId) => set({ currentUserId: userId }),

        initializeUserScripts: async (userId) => {
          set({ currentUserId: userId, scripts: [], activeScriptName: null, scriptText: LONGER_DEFAULT_SCRIPT_TEXT }); 
          try {
            const firestoreScripts = await fetchUserScripts(userId);
            set({ scripts: firestoreScripts });
            if (firestoreScripts.length > 0) {
              get().loadScript(firestoreScripts[0].name);
            } else {
               set({ scriptText: LONGER_DEFAULT_SCRIPT_TEXT, activeScriptName: null });
            }
          } catch (error) {
            console.error("Error initializing user scripts from Firestore:", error);
            toast({ title: "Cloud Sync Error", description: "Could not load your scripts from the cloud.", variant: "destructive"});
            set({ scripts: [], scriptText: LONGER_DEFAULT_SCRIPT_TEXT, activeScriptName: null });
          }
        },
        clearUserScripts: () => {
          set({
            scripts: [],
            activeScriptName: null,
            scriptText: LONGER_DEFAULT_SCRIPT_TEXT,
            currentScrollPosition: 0,
            currentUserId: null,
          });
        },

        setScriptText: (text) => set({ scriptText: text, activeScriptName: null, currentScrollPosition: 0 }),
        setActiveScriptName: (name) => set({ activeScriptName: name }),
        
        loadScript: (scriptName) => {
          const script = get().scripts.find(s => s.name === scriptName);
          if (script) {
            set({ scriptText: script.content, activeScriptName: scriptName, currentScrollPosition: 0 });
          }
        },

        saveScript: async (name, content) => {
          const { currentUserId, scripts } = get();
          const scriptContentToSave = content ?? get().scriptText;
          const now = Date.now();
          
          let scriptToSave: Script;
          const existingScript = scripts.find(s => s.name === name);

          if (existingScript) {
            scriptToSave = { ...existingScript, content: scriptContentToSave, updatedAt: now };
          } else {
            scriptToSave = { name, content: scriptContentToSave, createdAt: now, updatedAt: now, versions: [] };
          }
          
          if (currentUserId) {
            try {
              const savedFirestoreScript = await saveUserScriptToFirestore(currentUserId, scriptToSave);
              set(state => ({
                scripts: state.scripts.map(s => s.name === name || s.id === savedFirestoreScript.id ? { ...savedFirestoreScript, userId: currentUserId } : s),
                activeScriptName: savedFirestoreScript.name,
                scriptText: savedFirestoreScript.content,
              }));
               if (!existingScript && !scripts.some(s => s.id === savedFirestoreScript.id)) {
                 set(state => ({ scripts: [...state.scripts, { ...savedFirestoreScript, userId: currentUserId }]}));
               }
              toast({ title: "Cloud Sync", description: `Script "${savedFirestoreScript.name}" saved to cloud.`, variant: "default" });
            } catch (error) {
              console.error("Error saving script to Firestore:", error);
              toast({ title: "Cloud Sync Error", description: `Could not save script "${name}" to the cloud. Changes saved locally.`, variant: "destructive" });
              // Save locally as fallback if cloud save fails
              if (existingScript) {
                set(state => ({
                  scripts: state.scripts.map(s => s.name === name ? scriptToSave : s),
                  activeScriptName: name, scriptText: scriptContentToSave,
                }));
              } else {
                set(state => ({
                  scripts: [...state.scripts, { ...scriptToSave, id: uuidv4() }],
                  activeScriptName: name, scriptText: scriptContentToSave,
                }));
              }
            }
          } else { // Local save for anonymous user
            if (existingScript) {
              set(state => ({
                scripts: state.scripts.map(s => s.name === name ? scriptToSave : s),
                activeScriptName: name,
                scriptText: scriptContentToSave,
              }));
            } else {
              set(state => ({
                scripts: [...state.scripts, { ...scriptToSave, id: uuidv4() }], 
                activeScriptName: name,
                scriptText: scriptContentToSave,
              }));
            }
            toast({ title: "Script Saved", description: `Script "${name}" saved locally.`, variant: "default" });
          }
        },

        deleteScript: async (scriptName) => {
          const { currentUserId, scripts, activeScriptName, LONGER_DEFAULT_SCRIPT_TEXT: defaultText } = get();
          const scriptToDelete = scripts.find(s => s.name === scriptName);

          if (!scriptToDelete) return;

          if (currentUserId && scriptToDelete.id) {
            try {
              await deleteUserScriptFromFirestore(currentUserId, scriptToDelete.id);
              toast({ title: "Cloud Sync", description: `Script "${scriptName}" deleted from cloud.`, variant: "default" });
            } catch (error) {
              console.error("Error deleting script from Firestore:", error);
              toast({ title: "Cloud Sync Error", description: `Could not delete script "${scriptName}" from cloud. Please try again.`, variant: "destructive" });
              return; // Don't delete locally if cloud delete failed
            }
          }
          
          const updatedScripts = scripts.filter(s => s.name !== scriptName);
          set({ scripts: updatedScripts });
          if (!currentUserId) toast({ title: "Script Deleted", description: `Script "${scriptName}" deleted locally.`, variant: "default" });


          if (activeScriptName === scriptName) {
            if (updatedScripts.length > 0) {
              get().loadScript(updatedScripts[0].name);
            } else {
              set({ activeScriptName: null, scriptText: defaultText, currentScrollPosition: 0 });
            }
          }
        },

        renameScript: async (oldName, newName) => {
          const { currentUserId, scripts, activeScriptName } = get();
          const scriptToRename = scripts.find(s => s.name === oldName);

          if (!scriptToRename || !newName.trim() || scripts.some(s => s.name === newName.trim() && s.name !== oldName)) {
            toast({ title: "Error", description: "Invalid rename: Name empty or already exists.", variant: "destructive" });
            return;
          }

          const updatedScript = { ...scriptToRename, name: newName.trim(), updatedAt: Date.now() };

          if (currentUserId && scriptToRename.id) {
            try {
              await saveUserScriptToFirestore(currentUserId, updatedScript);
              toast({ title: "Cloud Sync", description: `Script renamed to "${newName.trim()}" in cloud.`, variant: "default" });
            } catch (error) {
              console.error("Error renaming script in Firestore:", error);
              toast({ title: "Cloud Sync Error", description: "Could not rename script in cloud. Please try again.", variant: "destructive" });
              return; 
            }
          }
          
          set(state => ({
            scripts: state.scripts.map(s => s.name === oldName ? updatedScript : s),
            activeScriptName: state.activeScriptName === oldName ? newName.trim() : state.activeScriptName,
            scriptText: state.activeScriptName === oldName ? updatedScript.content : state.scriptText,
          }));
          if (!currentUserId) toast({ title: "Script Renamed", description: `Script renamed to "${newName.trim()}" locally.`, variant: "default" });
        },

        duplicateScript: async (scriptName) => {
          const { currentUserId, scripts } = get();
          const originalScript = scripts.find(s => s.name === scriptName);
          if (!originalScript) return null;

          let newName = `${originalScript.name} (Copy)`;
          let copyIndex = 2;
          while (scripts.some(s => s.name === newName)) {
            newName = `${originalScript.name} (Copy ${copyIndex})`;
            copyIndex++;
          }
          
          const now = Date.now();
          const duplicatedScriptData: Omit<Script, 'id' | 'userId'> = {
            name: newName,
            content: originalScript.content,
            createdAt: now,
            updatedAt: now,
            versions: originalScript.versions.map(v => ({...v, versionId: uuidv4()})),
          };

          if (currentUserId) {
            try {
              const savedFirestoreScript = await saveUserScriptToFirestore(currentUserId, duplicatedScriptData);
              const newCompleteScript = { ...savedFirestoreScript, userId: currentUserId };
              set(state => ({
                scripts: [...state.scripts, newCompleteScript],
                activeScriptName: newCompleteScript.name,
                scriptText: newCompleteScript.content,
                currentScrollPosition: 0,
              }));
              toast({ title: "Cloud Sync", description: `Script duplicated as "${newCompleteScript.name}" in cloud.`, variant: "default" });
              return newCompleteScript.name;
            } catch (error) {
              console.error("Error duplicating script in Firestore:", error);
              toast({ title: "Cloud Sync Error", description: "Could not duplicate script in cloud.", variant: "destructive" });
              return null;
            }
          } else {
            const localDuplicate = { ...duplicatedScriptData, id: uuidv4() };
            set(state => ({
              scripts: [...state.scripts, localDuplicate],
              activeScriptName: localDuplicate.name,
              scriptText: localDuplicate.content,
              currentScrollPosition: 0,
            }));
            toast({ title: "Script Duplicated", description: `Script duplicated as "${localDuplicate.name}" locally.`, variant: "default" });
            return localDuplicate.name;
          }
        },

        saveScriptVersion: async (scriptName, notes) => {
          const { currentUserId, scripts, scriptText, activeScriptName: currentActiveScriptName } = get();
          const script = scripts.find(s => s.name === scriptName);

          if (!script) {
             toast({ title: "Error", description: "Script not found to save version.", variant: "destructive" });
             return;
          }
          if (!script.id && currentUserId) {
            toast({ title: "Save Script First", description: "Please save the main script to the cloud before saving versions.", variant: "destructive" });
            return;
          }

          const contentToVersion = (currentActiveScriptName === scriptName) ? scriptText : script.content;
          
          const newVersionData: Omit<ScriptVersion, 'versionId'> = {
            content: contentToVersion,
            timestamp: Date.now(),
            notes: notes,
          };

          let savedVersion: ScriptVersion;

          if (currentUserId && script.id) {
            try {
              savedVersion = await saveUserScriptVersionToFirestore(currentUserId, script.id, newVersionData);
              toast({ title: "Cloud Sync", description: `New version for "${scriptName}" saved to cloud.`, variant: "default" });
            } catch (error) {
              console.error("Error saving script version to Firestore:", error);
              toast({ title: "Cloud Sync Error", description: "Could not save script version to cloud.", variant: "destructive" });
              return;
            }
          } else {
            savedVersion = { ...newVersionData, versionId: uuidv4() };
            toast({ title: "Version Saved", description: `New version for "${scriptName}" saved locally.`, variant: "default" });
          }
          
          const updatedScript = { ...script, versions: [...(script.versions || []), savedVersion].sort((a,b) => b.timestamp - a.timestamp) };
          set(state => ({
            scripts: state.scripts.map(s => s.name === scriptName ? updatedScript : s),
          }));
        },

        loadScriptVersion: (scriptName, versionId) => {
          const script = get().scripts.find(s => s.name === scriptName);
          const version = script?.versions.find(v => v.versionId === versionId);
          if (script && version) {
            set({ scriptText: version.content, activeScriptName: script.name, currentScrollPosition: 0 });
            toast({ title: "Version Loaded", description: `Loaded version for "${scriptName}".`, variant: "default" });
          } else {
            toast({ title: "Error", description: "Could not load script version.", variant: "destructive" });
          }
        },

        setFontSize: (size) => set({ fontSize: Math.max(12, size), activeLayoutPresetName: null }),
        setScrollSpeed: (speed) => set({ scrollSpeed: Math.max(1, speed), activeLayoutPresetName: null }),
        setLineHeight: (height) => set({ lineHeight: Math.max(1, height), activeLayoutPresetName: null }),
        setIsMirrored: (mirrored) => set({ isMirrored: mirrored }), 
        setDarkMode: (newDarkModeValue) => {
          set({
            darkMode: newDarkModeValue,
          });
        },
        setIsAutoSyncEnabled: (enabled) => set({ isAutoSyncEnabled: enabled }),
        setTextColor: (color) => set({ textColor: color }), 
        setFontFamily: (font) => set({ fontFamily: font, activeLayoutPresetName: null }),
        setFocusLinePercentage: (percentage) => set({ focusLinePercentage: Math.max(0.1, Math.min(0.9, percentage)), activeLayoutPresetName: null }),
        setFocusLineStyle: (style) => set({ focusLineStyle: style, activeLayoutPresetName: null }),
        setCountdownEnabled: (enabled) => set({ countdownEnabled: enabled, activeLayoutPresetName: null }),
        setCountdownDuration: (duration) => set({ countdownDuration: Math.max(1, Math.min(60, duration)), activeLayoutPresetName: null }),
        setHorizontalPadding: (padding) => set({ horizontalPadding: Math.max(0, Math.min(25, padding)), activeLayoutPresetName: null }),
        setEnableHighContrast: (enabled) => set({ enableHighContrast: enabled }),
        setIsPresentationMode: (enabled) => set({ isPresentationMode: enabled }),
        
        applyLayoutPreset: (presetName) => {
          const preset = get().layoutPresets.find(p => p.name === presetName);
          if (preset?.settings) { 
            const { fontSize, lineHeight, focusLinePercentage, fontFamily, scrollSpeed, focusLineStyle, horizontalPadding, countdownEnabled, countdownDuration } = preset.settings;
            set(state => ({ 
              ...state, 
              fontSize: fontSize ?? state.fontSize,
              lineHeight: lineHeight ?? state.lineHeight,
              focusLinePercentage: focusLinePercentage ?? state.focusLinePercentage,
              fontFamily: fontFamily ?? state.fontFamily,
              scrollSpeed: scrollSpeed ?? state.scrollSpeed,
              focusLineStyle: focusLineStyle ?? state.focusLineStyle,
              horizontalPadding: horizontalPadding ?? state.horizontalPadding,
              countdownEnabled: countdownEnabled ?? state.countdownEnabled,
              countdownDuration: countdownDuration ?? state.countdownDuration,
              activeLayoutPresetName: presetName 
            }));
            toast({title: "Layout Preset Applied", description: `"${presetName}" preset has been applied.`, variant: "default"});
          }
        },

        resetSettingsToDefaults: () => {
          const defaultPreset = get().layoutPresets.find(p => p.name === "Default");
          const defaultSettings = defaultPreset?.settings ?? {};
          set({
            fontSize: defaultSettings.fontSize ?? INITIAL_FONT_SIZE,
            scrollSpeed: defaultSettings.scrollSpeed ?? INITIAL_SCROLL_SPEED,
            lineHeight: defaultSettings.lineHeight ?? INITIAL_LINE_HEIGHT,
            isMirrored: INITIAL_IS_MIRRORED,
            isAutoSyncEnabled: INITIAL_IS_AUTO_SYNC_ENABLED,
            fontFamily: defaultSettings.fontFamily ?? INITIAL_FONT_FAMILY,
            focusLinePercentage: defaultSettings.focusLinePercentage ?? INITIAL_FOCUS_LINE_PERCENTAGE,
            focusLineStyle: defaultSettings.focusLineStyle ?? INITIAL_FOCUS_LINE_STYLE,
            countdownEnabled: defaultSettings.countdownEnabled ?? INITIAL_COUNTDOWN_ENABLED,
            countdownDuration: defaultSettings.countdownDuration ?? INITIAL_COUNTDOWN_DURATION,
            horizontalPadding: defaultSettings.horizontalPadding ?? INITIAL_HORIZONTAL_PADDING,
            activeLayoutPresetName: "Default",
          });
          toast({title: "Settings Reset", description: "Core appearance and playback settings have been reset to default.", variant: "default"});
        },

        saveUserSettingsProfile: (name) => {
          if (!name.trim()) {
            toast({ title: "Error", description: "Profile name cannot be empty.", variant: "destructive" });
            return;
          }
          const newProfile: UserSettingsProfile = {
            id: uuidv4(),
            name: name.trim(),
            settings: getSettingsForProfile(),
          };
          set(state => ({
            userSettingsProfiles: [...state.userSettingsProfiles, newProfile]
          }));
          toast({title: "Settings Profile Saved", description: `Profile "${name.trim()}" saved.`, variant: "default"});
        },
        loadUserSettingsProfile: (profileId) => {
          const profile = get().userSettingsProfiles.find(p => p.id === profileId);
          if (profile) {
            set(state => ({ ...state, ...profile.settings, activeLayoutPresetName: null }));
            toast({title: "Settings Profile Loaded", description: `Profile "${profile.name}" loaded.`, variant: "default"});
          } else {
            toast({ title: "Error", description: "Could not load settings profile.", variant: "destructive" });
          }
        },
        deleteUserSettingsProfile: (profileId) => {
          const profileName = get().userSettingsProfiles.find(p => p.id === profileId)?.name;
          set(state => ({
            userSettingsProfiles: state.userSettingsProfiles.filter(p => p.id !== profileId)
          }));
          toast({title: "Settings Profile Deleted", description: `Profile "${profileName || 'ID: '+profileId}" deleted.`, variant: "default"});
        },
        renameUserSettingsProfile: (profileId, newName) => {
          if (!newName.trim()) {
             toast({ title: "Error", description: "New profile name cannot be empty.", variant: "destructive" });
            return;
          }
          const oldProfileName = get().userSettingsProfiles.find(p => p.id === profileId)?.name;
          set(state => ({
            userSettingsProfiles: state.userSettingsProfiles.map(p =>
              p.id === profileId ? { ...p, name: newName.trim() } : p
            )
          }));
          toast({title: "Settings Profile Renamed", description: `Profile "${oldProfileName}" renamed to "${newName.trim()}".`, variant: "default"});
        },

        togglePlayPause: () => {
          const { isPlaying, countdownEnabled, setCountdownValue, setIsPlaying, countdownDuration } = get();
          if (isPlaying) {
            setIsPlaying(false);
            setCountdownValue(null); 
          } else {
            if (countdownEnabled) {
              setCountdownValue(countdownDuration); 
            } else {
              setIsPlaying(true); 
            }
          }
        },
        setIsPlaying: (playing) => set({ isPlaying: playing }),
        setCurrentScrollPosition: (position) => set({ currentScrollPosition: position }),
        resetScroll: () => set({ currentScrollPosition: 0, isPlaying: false, countdownValue: null }),
        setCountdownValue: (value) => {
          if (typeof value === 'function') {
            set((prevState) => ({ countdownValue: value(prevState.countdownValue) }));
          } else {
            set({ countdownValue: value });
          }
        },
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
        ...(state.currentUserId === null && { scripts: state.scripts, activeScriptName: state.activeScriptName }),
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
        enableHighContrast: state.enableHighContrast,
        userSettingsProfiles: state.userSettingsProfiles,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error("Error rehydrating Promptastic store:", error);
        }
        if (state) {
          state.layoutPresets = state.layoutPresets && state.layoutPresets.length > 0 ? state.layoutPresets : DEFAULT_LAYOUT_PRESETS;
          state.activeLayoutPresetName = state.activeLayoutPresetName ?? "Default";
          state.focusLineStyle = state.focusLineStyle ?? INITIAL_FOCUS_LINE_STYLE;
          state.scripts = state.scripts?.map(s => ({ ...s, versions: s.versions ?? [] })) ?? [];
          state.countdownEnabled = state.countdownEnabled ?? INITIAL_COUNTDOWN_ENABLED;
          state.countdownDuration = state.countdownDuration ?? INITIAL_COUNTDOWN_DURATION;
          state.horizontalPadding = state.horizontalPadding ?? INITIAL_HORIZONTAL_PADDING;
          state.enableHighContrast = state.enableHighContrast ?? INITIAL_ENABLE_HIGH_CONTRAST;
          state.userSettingsProfiles = state.userSettingsProfiles ?? [];
          state.textColor = state.textColor ?? (state.darkMode ? INITIAL_TEXT_COLOR_DARK_MODE_HSL : INITIAL_TEXT_COLOR_LIGHT_MODE_HSL);
        }
      }
    }
  )
);
