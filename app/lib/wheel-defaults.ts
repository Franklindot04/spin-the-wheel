import type {
  AppData,
  AutoGenerateType,
  ConfettiEffect,
  Mode,
  SpinHistoryItem,
  SpinSpeed,
  Wheel,
  WheelEntry,
  WheelSettings,
  WinnerDisplay,
} from "./wheel-types";

import { APPEARANCE_THEMES } from "./appearance-themes";
import { normalizeEmoji } from "./entry-emoji";
import { getEntryWeight } from "./wheel-utils";

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

export const MAX_HISTORY_ITEMS = 500;

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

export type RepairReport = {
  repaired: boolean;
};

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function normalizeId(
  value: unknown,
  report?: RepairReport,
): string {
  if (
    typeof value === "string" &&
    value !== ""
  ) {
    return value;
  }

  if (report) {
    report.repaired = true;
  }

  return crypto.randomUUID();
}

function normalizeText(
  value: unknown,
  fallback: string,
  report?: RepairReport,
): string {
  if (typeof value !== "string") {
    if (report) {
      report.repaired = true;
    }

    return fallback;
  }

  return value.trim() || fallback;
}

export function normalizeEntry(
  value: unknown,
  report?: RepairReport,
): WheelEntry | null {
  if (!isRecord(value)) {
    if (report) {
      report.repaired = true;
    }

    return null;
  }

  let label: string;

  if (typeof value.label === "string") {
    label = value.label;
  } else if (
    typeof value.label === "number" &&
    Number.isFinite(value.label)
  ) {
    label = String(value.label);

    if (report) {
      report.repaired = true;
    }
  } else {
    if (report) {
      report.repaired = true;
    }

    return null;
  }

  const entry = {
    ...value,
    id: normalizeId(value.id, report),
    label,
  } as WheelEntry;

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

    weight: getEntryWeight(entry),

    hidden:
      entry.hidden ?? false,

    question:
      entry.question ?? "",

    answer:
      entry.answer ?? "",

    emoji:
      normalizeEmoji(entry.emoji),
  };
}

export function normalizeEntries(
  value: unknown,
  report?: RepairReport,
): WheelEntry[] {
  if (!Array.isArray(value)) {
    if (report) {
      report.repaired = true;
    }

    return [];
  }

  const entries: WheelEntry[] = [];

  for (const item of value) {
    const entry =
      normalizeEntry(item, report);

    if (entry) {
      entries.push(entry);
    }
  }

  return entries;
}

export function normalizeHistory(
  history: unknown,
  fallbackMode: Mode,
): SpinHistoryItem[] {
  if (!Array.isArray(history)) {
    return [];
  }

  const seenIds = new Set<string>();
  const items: SpinHistoryItem[] = [];

  for (const raw of history) {
    if (
      !raw ||
      typeof raw !== "object" ||
      Array.isArray(raw)
    ) {
      continue;
    }

    const item =
      raw as Record<string, unknown>;

    if (typeof item.label !== "string") {
      continue;
    }

    const timestamp =
      typeof item.timestamp === "string" &&
      item.timestamp.trim() !== ""
        ? Number(item.timestamp)
        : item.timestamp;

    if (
      typeof timestamp !== "number" ||
      !Number.isFinite(timestamp)
    ) {
      continue;
    }

    let id =
      typeof item.id === "string" &&
      item.id !== ""
        ? item.id
        : crypto.randomUUID();

    while (seenIds.has(id)) {
      id = crypto.randomUUID();
    }

    seenIds.add(id);

    items.push({
      id,
      entryId:
        typeof item.entryId === "string"
          ? item.entryId
          : "",
      label: item.label,
      emoji: normalizeEmoji(item.emoji),
      mode:
        item.mode === "standard" ||
        item.mode === "quiz"
          ? item.mode
          : fallbackMode,
      question:
        typeof item.question === "string"
          ? item.question
          : undefined,
      timestamp,
    });
  }

  return items.slice(
    0,
    MAX_HISTORY_ITEMS,
  );
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
  value: unknown,
  report?: RepairReport,
): Wheel | null {
  if (!isRecord(value)) {
    if (report) {
      report.repaired = true;
    }

    return null;
  }

  const normalizedSettings =
    normalizeWheelSettings(
      value.settings as
        | Partial<WheelSettings>
        | undefined,
    );

  return {
    ...value,

    id: normalizeId(value.id, report),

    name: normalizeText(
      value.name,
      "Wheel",
      report,
    ),

    title: normalizeText(
      value.title,
      DEFAULT_WHEEL_TITLE,
      report,
    ),

    description: normalizeText(
      value.description,
      DEFAULT_WHEEL_DESCRIPTION,
      report,
    ),

    standardEntries:
      normalizeEntries(
        value.standardEntries,
        report,
      ),

    quizEntries:
      normalizeEntries(
        value.quizEntries,
        report,
      ),

    standardHistory:
      normalizeHistory(
        value.standardHistory,
        "standard",
      ),

    quizHistory:
      normalizeHistory(
        value.quizHistory,
        "quiz",
      ),

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