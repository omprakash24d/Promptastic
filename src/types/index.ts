
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
}

export interface LayoutPreset {
  name: string;
  settings: Partial<Pick<TeleprompterSettings, 'fontSize' | 'lineHeight' | 'focusLinePercentage' | 'fontFamily' | 'scrollSpeed'>>;
}


export interface TeleprompterState extends TeleprompterSettings {
  scriptText: string;
  activeScript: Script | null; 
  isPlaying: boolean;
  currentScrollPosition: number; // px
  isSettingsPanelOpen: boolean;
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

