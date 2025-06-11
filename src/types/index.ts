
export interface ScriptVersion {
  versionId: string;
  content: string;
  timestamp: number;
  notes?: string;
}

export interface Script {
  name: string;
  content: string;
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
  versions: ScriptVersion[];
}

export type FocusLineStyle = 'line' | 'shadedParagraph';

export interface TeleprompterSettings {
  fontSize: number; // in px
  scrollSpeed: number; // px per second
  lineHeight: number; // as a multiplier, e.g., 1.5
  isMirrored: boolean;
  darkMode: boolean;
  isAutoSyncEnabled: boolean;
  textColor: string; // e.g., '#FFFFFF' or 'hsl(0, 0%, 100%)'
  fontFamily: string; // e.g., 'Inter, sans-serif', 'Arial'
  focusLinePercentage: number; // e.g., 0.33 for 33% from the top
  focusLineStyle: FocusLineStyle;
  countdownEnabled: boolean;
  countdownDuration: number; // in seconds
  horizontalPadding: number; // percentage, e.g., 0 to 25
  enableHighContrast: boolean; // New for accessibility
}

export interface LayoutPreset {
  name: string;
  settings: Partial<Pick<TeleprompterSettings, 'fontSize' | 'lineHeight' | 'focusLinePercentage' | 'fontFamily' | 'scrollSpeed' | 'focusLineStyle' | 'horizontalPadding' >>;
}

export interface UserSettingsProfile {
  id: string;
  name: string;
  settings: Omit<TeleprompterSettings, 'darkMode' | 'enableHighContrast'>; // darkMode and highContrast are global toggles, not per-profile
}

export interface TeleprompterState extends TeleprompterSettings {
  scriptText: string;
  activeScript: Script | null;
  isPlaying: boolean;
  currentScrollPosition: number; // px
  isSettingsPanelOpen: boolean;
  isPresentationMode: boolean; // New for Presentation Mode
  userSettingsProfiles: UserSettingsProfile[]; // New for settings profiles
}

// Updated script segment parsing type
export interface ParsedSegment {
  type: 'text' | 'pause' | 'emphasize' | 'slowdown';
  content: string;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  originalMarker?: string; // For cues like //PAUSE//
}

// User type for Authentication
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  phoneNumber?: string | null;
  photoURL?: string | null;
  // Add other Firebase user properties as needed
}
