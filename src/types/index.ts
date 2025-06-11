
export interface ScriptVersion {
  versionId: string;
  content: string;
  timestamp: number;
  notes?: string;
}

export interface Script {
  id?: string; // Firestore document ID (optional for local-only scripts)
  userId?: string; // ID of the user who owns this script (optional)
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
  enableHighContrast: boolean;
}

export interface LayoutPreset {
  name: string;
  settings: Partial<Pick<TeleprompterSettings, 'fontSize' | 'lineHeight' | 'focusLinePercentage' | 'fontFamily' | 'scrollSpeed' | 'focusLineStyle' | 'horizontalPadding' | 'countdownEnabled' | 'countdownDuration'>>;
}

export interface UserSettingsProfile {
  id: string;
  name: string;
  // Exclude global toggles like darkMode and enableHighContrast from per-profile settings
  settings: Omit<TeleprompterSettings, 'darkMode' | 'enableHighContrast'>;
}

export interface TeleprompterState extends TeleprompterSettings {
  scriptText: string;
  activeScript: Script | null; // Changed from activeScriptName to potentially hold the full active script object
  isPlaying: boolean;
  currentScrollPosition: number; // px
  isSettingsPanelOpen: boolean;
  isPresentationMode: boolean;
  userSettingsProfiles: UserSettingsProfile[]; // For saving/loading custom combinations of settings
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
  isEmailVerified: boolean; // Ensured this is not optional
}
