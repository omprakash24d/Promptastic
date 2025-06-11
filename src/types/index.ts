
export interface Script {
  name: string;
  content: string;
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
}

export interface TeleprompterSettings {
  fontSize: number; // in px
  scrollSpeed: number; // px per second
  lineHeight: number; // as a multiplier, e.g., 1.5
  isMirrored: boolean;
  darkMode: boolean;
  isAutoSyncEnabled: boolean;
  textColor: string; // e.g., '#FFFFFF' or 'hsl(0, 0%, 100%)'
  fontFamily: string; // e.g., 'Inter, sans-serif', 'Arial'
}

export interface TeleprompterState extends TeleprompterSettings {
  scriptText: string;
  activeScript: Script | null; // This was in the interface but not used in store, kept for consistency
  isPlaying: boolean;
  currentScrollPosition: number; // px
  isSettingsPanelOpen: boolean;
}
