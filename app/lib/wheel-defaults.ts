import type {
  AppData,
  AppearanceTheme,
  AutoGenerateType,
  ConfettiEffect,
  SpinSpeed,
  Wheel,
  WheelEntry,
  WheelSettings,
  WinnerDisplay,
} from "./wheel-types";

import { APPEARANCE_THEMES } from "./appearance-themes";

export const COLORS = [
  "#bfdbfe",
  "#fde68a",
  "#bbf7d0",
  "#fecaca",
  "#ddd6fe",
  "#fed7aa",
  "#bae6fd",
  "#fbcfe8",
];

export const DEFAULT_WHEEL_TITLE =
  "Spin the Wheel";

export const DEFAULT_WHEEL_DESCRIPTION =
  "Create a wheel for anything.";

export const DEFAULT_TEXT_COLOR =
  "#0f172a";

export const DEFAULT_FONT_FAMILY =
  "Arial, Helvetica, sans-serif";

export const MIN_WHEEL_SIZE = 420;

export const DEFAULT_WHEEL_SIZE = 560;

export const MAX_WHEEL_SIZE = 760;

export const MIN_SPIN_DURATION = 1;

export const DEFAULT_SPIN_DURATION = 4.5;

export const MAX_SPIN_DURATION = 30;

export const MIN_SPIN_SPEED = 1;

export const DEFAULT_SPIN_SPEED: SpinSpeed = 5;

export const MAX_SPIN_SPEED = 10;

export const DEFAULT_POINTER_MATCH_SLICE_COLOR =
  true;

export const DEFAULT_AUTO_GENERATE_COUNT = 9;

export const DEFAULT_AUTO_GENERATE_TYPE: AutoGenerateType =
  "names";

export const DEFAULT_CONFETTI_ENABLED =
  true;

export const DEFAULT_CONFETTI_EFFECT: ConfettiEffect =
  "celebration";

export const DEFAULT_WINNER_DISPLAY: WinnerDisplay =
  "banner";

export const DEFAULT_MAX_ENTRIES = 50;

export const DEFAULT_SOUND_ENABLED =
  true;

export const DEFAULT_VOLUME = 80;

export function createDefaultWheelSettings(): WheelSettings {
  return {
    appearanceTheme: "classic",

    wheelSize: DEFAULT_WHEEL_SIZE,

    soundEnabled:
      DEFAULT_SOUND_ENABLED,

    volume:
      DEFAULT_VOLUME,

    spinSpeed:
      DEFAULT_SPIN_SPEED,

    spinDuration:
      DEFAULT_SPIN_DURATION,

    pointerMatchSliceColor:
      DEFAULT_POINTER_MATCH_SLICE_COLOR,

    autoGenerateCount:
      DEFAULT_AUTO_GENERATE_COUNT,

    autoGenerateType:
      DEFAULT_AUTO_GENERATE_TYPE,

    confettiEnabled:
      DEFAULT_CONFETTI_ENABLED,

    confettiEffect:
      DEFAULT_CONFETTI_EFFECT,

    winnerDisplay:
      DEFAULT_WINNER_DISPLAY,

    maxEntries:
      DEFAULT_MAX_ENTRIES,
  };
}

export function createEntry(
  id: string,
  label: string,
  colorIndex: number,
): WheelEntry {
  return {
    id,
    label,
    color:
      COLORS[colorIndex % COLORS.length],
    question: "",
    answer: "",
    textColor:
      DEFAULT_TEXT_COLOR,
    fontFamily:
      DEFAULT_FONT_FAMILY,
    weight: 1,
    hidden: false,
  };
}

export function createInitialEntries(
  prefix = "standard",
): WheelEntry[] {
  return [1, 2, 3, 4].map((number) =>
    createEntry(
      `${prefix}-${number}`,
      prefix === "quiz"
        ? `Question ${number}`
        : `Option ${number}`,
      number - 1,
    ),
  );
}

export function createInitialQuizEntries(): WheelEntry[] {
  return createInitialEntries("quiz");
}

export function normalizeEntry(
  entry: WheelEntry,
): WheelEntry {
  return {
    ...entry,

    color:
      entry.color || COLORS[0],

    textColor:
      entry.textColor ||
      DEFAULT_TEXT_COLOR,

    fontFamily:
      entry.fontFamily ||
      DEFAULT_FONT_FAMILY,

    weight: Math.max(
      1,
      Math.floor(entry.weight ?? 1),
    ),

    hidden:
      entry.hidden ?? false,

    question:
      entry.question ?? "",

    answer:
      entry.answer ?? "",
  };
}

function normalizeSpinDuration(
  value: unknown,
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return DEFAULT_SPIN_DURATION;
  }

  return Math.min(
    MAX_SPIN_DURATION,
    Math.max(
      MIN_SPIN_DURATION,
      value,
    ),
  );
}

function normalizeWheelSize(
  value: unknown,
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return DEFAULT_WHEEL_SIZE;
  }

  return Math.min(
    MAX_WHEEL_SIZE,
    Math.max(
      MIN_WHEEL_SIZE,
      Math.round(value),
    ),
  );
}

function normalizePositiveInteger(
  value: unknown,
  fallback: number,
  maximum: number,
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return fallback;
  }

  return Math.min(
    maximum,
    Math.max(
      1,
      Math.floor(value),
    ),
  );
}

function normalizeVolume(
  value: unknown,
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return DEFAULT_VOLUME;
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(value),
    ),
  );
}

function normalizeSpinSpeed(
  value: unknown,
): SpinSpeed {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return Math.min(
      MAX_SPIN_SPEED,
      Math.max(
        MIN_SPIN_SPEED,
        Math.round(value),
      ),
    );
  }

  /*
   * Migrate the previous three-level
   * speed representation safely.
   */
  if (value === "slow") {
    return 2;
  }

  if (value === "normal") {
    return DEFAULT_SPIN_SPEED;
  }

  if (value === "fast") {
    return 8;
  }

  return DEFAULT_SPIN_SPEED;
}

function normalizeAutoGenerateType(
  value: unknown,
): AutoGenerateType {
  if (
    value === "names" ||
    value === "animals" ||
    value === "countries" ||
    value === "cities" ||
    value === "foods" ||
    value === "custom"
  ) {
    return value;
  }

  return DEFAULT_AUTO_GENERATE_TYPE;
}

function normalizeConfettiEffect(
  value: unknown,
): ConfettiEffect {
  if (
    value === "burst" ||
    value === "celebration" ||
    value === "fireworks" ||
    value === "minimal" ||
    value === "none"
  ) {
    return value;
  }

  return DEFAULT_CONFETTI_EFFECT;
}

function normalizeWinnerDisplay(
  value: unknown,
): WinnerDisplay {
  if (
    value === "banner" ||
    value === "popup" ||
    value === "wheel" ||
    value === "none"
  ) {
    return value;
  }

  return DEFAULT_WINNER_DISPLAY;
}

export function normalizeWheelSettings(
  settings?: Partial<WheelSettings>,
): WheelSettings {
  const defaults =
    createDefaultWheelSettings();

  return {
    appearanceTheme:
      settings?.appearanceTheme &&
      settings.appearanceTheme in
        APPEARANCE_THEMES
        ? settings.appearanceTheme
        : defaults.appearanceTheme,

    wheelSize:
      normalizeWheelSize(
        settings?.wheelSize,
      ),

    soundEnabled:
      typeof settings?.soundEnabled ===
      "boolean"
        ? settings.soundEnabled
        : defaults.soundEnabled,

    volume:
      normalizeVolume(
        settings?.volume,
      ),

    spinSpeed:
      normalizeSpinSpeed(
        settings?.spinSpeed,
      ),

    spinDuration:
      normalizeSpinDuration(
        settings?.spinDuration,
      ),

    pointerMatchSliceColor:
      typeof settings?.pointerMatchSliceColor ===
      "boolean"
        ? settings.pointerMatchSliceColor
        : defaults.pointerMatchSliceColor,

    autoGenerateCount:
      normalizePositiveInteger(
        settings?.autoGenerateCount,
        defaults.autoGenerateCount ??
          DEFAULT_AUTO_GENERATE_COUNT,
        defaults.maxEntries,
      ),

    autoGenerateType:
      normalizeAutoGenerateType(
        settings?.autoGenerateType,
      ),

    confettiEnabled:
      typeof settings?.confettiEnabled ===
      "boolean"
        ? settings.confettiEnabled
        : defaults.confettiEnabled,

    confettiEffect:
      normalizeConfettiEffect(
        settings?.confettiEffect,
      ),

    winnerDisplay:
      normalizeWinnerDisplay(
        settings?.winnerDisplay,
      ),

    maxEntries:
      normalizePositiveInteger(
        settings?.maxEntries,
        defaults.maxEntries,
        500,
      ),
  };
}

export function normalizeWheel(
  wheel: Wheel,
): Wheel {
  const normalizedSettings =
    normalizeWheelSettings(
      wheel.settings,
    );

  const maxEntries =
    normalizedSettings.maxEntries;

  return {
    ...wheel,

    name:
      wheel.name?.trim() ||
      "Wheel",

    title:
      wheel.title?.trim() ||
      DEFAULT_WHEEL_TITLE,

    description:
      wheel.description?.trim() ||
      DEFAULT_WHEEL_DESCRIPTION,

    standardEntries: (
      wheel.standardEntries ?? []
    )
      .slice(0, maxEntries)
      .map(normalizeEntry),

    quizEntries: (
      wheel.quizEntries ?? []
    )
      .slice(0, maxEntries)
      .map(normalizeEntry),

    standardHistory:
      wheel.standardHistory ?? [],

    quizHistory:
      wheel.quizHistory ?? [],

    settings:
      normalizedSettings,
  };
}

export function createWheel(
  index = 1,
): Wheel {
  return {
    id: crypto.randomUUID(),

    name:
      `Wheel ${index}`,

    title:
      DEFAULT_WHEEL_TITLE,

    description:
      DEFAULT_WHEEL_DESCRIPTION,

    standardEntries:
      createInitialEntries(),

    quizEntries:
      createInitialQuizEntries(),

    standardHistory: [],

    quizHistory: [],

    settings:
      createDefaultWheelSettings(),
  };
}

export function createInitialAppData(): AppData {
  const wheel =
    createWheel(1);

  return {
    version: 2,
    wheels: [wheel],
    activeWheelId: wheel.id,
  };
}

export function isAppearanceTheme(
  value: unknown,
): value is AppearanceTheme {
  return (
    typeof value === "string" &&
    value in APPEARANCE_THEMES
  );
}