export type Mode = "standard" | "quiz";

export type AppearanceTheme =
  | "classic"
  | "ocean"
  | "forest"
  | "sunset"
  | "violet";

export type AppearanceThemeConfig = {
  label: string;
  description: string;

  // Main application background
  pageClass: string;

  // Header / top navigation: the wide header, the phone top bar and the share toast
  header: {
    surfaceClass: string;
    borderClass: string;
    hoverClass: string;
    titleHex: string;
    mutedHex: string;
    toastTextClass: string;
  };

  // Primary accent / action buttons
  accentClass: string;
  accentHoverClass: string;
  accentHex: string;
  accentHoverHex: string;

  // Pointer fill when no entries are visible
  pointerFallbackHex: string;

  // Surfaces
  surfaceClass: string;
  subtleSurfaceClass: string;

  // Typography
  textPrimaryClass: string;
  textSecondaryClass: string;
  textMutedClass: string;

  // Borders and controls
  borderClass: string;
  controlClass: string;
  controlHoverClass: string;

  // Inputs / textareas / selects
  inputClass: string;
};

export type SpinSpeed = number;

export type AutoGenerateType =
  | "countries"
  | "names"
  | "animals"
  | "cities"
  | "foods"
  | "custom";

export type ConfettiEffect =
  | "burst"
  | "celebration"
  | "fireworks"
  | "minimal"
  | "none";

export type WinnerDisplay =
  | "none"
  | "popup"
  | "banner"
  | "wheel";

export type WheelEntry = {
  id: string;
  label: string;
  color: string;

  textColor?: string;
  fontFamily?: string;

  image?: string;

  emoji?: string;

  sound?: string;
  winnerSound?: string;

  question?: string;
  answer?: string;

  hidden?: boolean;
  hiddenByHideAll?: boolean;

  weight?: number;
};

export type SpinHistoryItem = {
  id: string;
  entryId: string;
  label: string;
  emoji?: string;
  mode: Mode;
  question?: string;
  timestamp: number;
};

export type WheelSettings = {
  appearanceTheme: AppearanceTheme;

  wheelSize?: number;

  spinSpeed?: SpinSpeed;
  spinDuration?: number;

  pointerMatchSliceColor?: boolean;

  autoGenerateEnabled?: boolean;
  autoGenerateCount?: number;
  autoGenerateType?: AutoGenerateType;

  confettiEnabled?: boolean;
  confettiEffect?: ConfettiEffect;

  winnerDisplay?: WinnerDisplay;

  maxEntries: number;

  soundEnabled?: boolean;
  spinSound?: string;
  winnerSound?: string;
  volume?: number;
};

export type Wheel = {
  id: string;
  name: string;

  title: string;
  description: string;

  standardEntries: WheelEntry[];
  quizEntries: WheelEntry[];

  standardHistory: SpinHistoryItem[];
  quizHistory: SpinHistoryItem[];

  settings: WheelSettings;
};

export type AppData = {
  version: 2;
  wheels: Wheel[];
  activeWheelId: string;
};

export type LegacyStoredData = {
  version: 1;

  standardEntries: WheelEntry[];
  quizEntries: WheelEntry[];

  wheelTitle: string;
  wheelDescription: string;

  standardHistory?: SpinHistoryItem[];
  quizHistory?: SpinHistoryItem[];

  appearanceTheme?: AppearanceTheme;
};