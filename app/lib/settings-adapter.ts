import type {
  AppearanceTheme,
  AutoGenerateType,
  ConfettiEffect,
  WheelSettings,
  WinnerDisplay,
} from "./wheel-types";

import type {
  ConfettiStyle,
  PageTheme,
  WheelSettings as PanelWheelSettings,
  WinnerDisplayMethod,
} from "../components/SettingsPanel";

import {
  DEFAULT_AUTO_GENERATE_COUNT,
  DEFAULT_AUTO_GENERATE_TYPE,
  DEFAULT_CONFETTI_ENABLED,
  DEFAULT_MAX_ENTRIES,
  DEFAULT_POINTER_MATCH_SLICE_COLOR,
  DEFAULT_SOUND_ENABLED,
  DEFAULT_SPIN_DURATION,
  DEFAULT_SPIN_SPEED,
  DEFAULT_VOLUME,
  DEFAULT_WHEEL_SIZE,
  DEFAULT_WINNER_DISPLAY,
  MAX_SPIN_DURATION,
  MAX_SPIN_SPEED,
  MIN_SPIN_DURATION,
  MIN_SPIN_SPEED,
} from "./wheel-defaults";

function clampSpinSpeed(
  value: number,
): number {
  return Math.min(
    MAX_SPIN_SPEED,
    Math.max(
      MIN_SPIN_SPEED,
      Math.round(value),
    ),
  );
}

function panelThemeToAppTheme(
  theme: PageTheme,
): AppearanceTheme {
  switch (theme) {
    case "blue":
      return "ocean";

    case "green":
      return "forest";

    case "purple":
      return "violet";

    case "orange":
      return "sunset";

    case "slate":
    default:
      return "classic";
  }
}

function appThemeToPanelTheme(
  theme: AppearanceTheme,
): PageTheme {
  switch (theme) {
    case "ocean":
      return "blue";

    case "forest":
      return "green";

    case "violet":
      return "purple";

    case "sunset":
      return "orange";

    case "classic":
    default:
      return "slate";
  }
}

function panelAutoGenerateTypeToAppType(
  category: string,
): AutoGenerateType {
  switch (category) {
    case "countries":
      return "countries";

    case "animals":
      return "animals";

    case "cities":
      return "cities";

    case "foods":
      return "foods";

    case "names":
      return "names";

    case "custom":
      return "custom";

    default:
      return DEFAULT_AUTO_GENERATE_TYPE;
  }
}

function appAutoGenerateTypeToPanelCategory(
  type?: AutoGenerateType,
): string {
  switch (type) {
    case "countries":
      return "countries";

    case "animals":
      return "animals";

    case "cities":
      return "cities";

    case "foods":
      return "foods";

    case "names":
      return "names";

    case "custom":
      return "custom";

    default:
      return "names";
  }
}

function panelConfettiToAppEffect(
  style: ConfettiStyle,
): ConfettiEffect {
  switch (style) {
    case "burst":
      return "burst";

    case "celebration":
      return "celebration";

    case "fireworks":
      return "fireworks";

    case "minimal":
      return "minimal";

    case "none":
    default:
      return "none";
  }
}

function appConfettiToPanelStyle(
  effect?: ConfettiEffect,
): ConfettiStyle {
  switch (effect) {
    case "burst":
      return "burst";

    case "celebration":
      return "celebration";

    case "fireworks":
      return "fireworks";

    case "minimal":
      return "minimal";

    case "none":
    default:
      return "none";
  }
}

function panelWinnerToAppWinner(
  method: WinnerDisplayMethod,
): WinnerDisplay {
  switch (method) {
    case "popup":
      return "popup";

    case "panel":
      return "banner";

    case "highlight":
      return "wheel";

    default:
      return DEFAULT_WINNER_DISPLAY;
  }
}

function appWinnerToPanelWinner(
  winner?: WinnerDisplay,
): WinnerDisplayMethod {
  switch (winner) {
    case "popup":
      return "popup";

    case "wheel":
      return "highlight";

    case "banner":
    case "none":
    default:
      return "panel";
  }
}

function clampSpinDuration(
  value: number,
): number {
  return Math.min(
    MAX_SPIN_DURATION,
    Math.max(
      MIN_SPIN_DURATION,
      value,
    ),
  );
}

export function wheelSettingsToPanelSettings(
  settings: WheelSettings,
): PanelWheelSettings {
  return {
    spinSpeed:
      clampSpinSpeed(
        settings.spinSpeed ??
          DEFAULT_SPIN_SPEED,
      ),

    spinDuration:
      clampSpinDuration(
        settings.spinDuration ??
          DEFAULT_SPIN_DURATION,
      ),

    pointerMatchSliceColor:
      settings.pointerMatchSliceColor ??
      DEFAULT_POINTER_MATCH_SLICE_COLOR,

    autoGenerateEnabled:
      settings.autoGenerateEnabled ??
      false,

    autoGenerateCount:
      settings.autoGenerateCount ??
      DEFAULT_AUTO_GENERATE_COUNT,

    autoGenerateCategory:
      appAutoGenerateTypeToPanelCategory(
        settings.autoGenerateType,
      ),

    confettiEnabled:
      settings.confettiEnabled ??
      DEFAULT_CONFETTI_ENABLED,

    confettiStyle:
      appConfettiToPanelStyle(
        settings.confettiEffect,
      ),

    winnerDisplayMethod:
      appWinnerToPanelWinner(
        settings.winnerDisplay,
      ),

    numberOfEntries:
      settings.maxEntries ??
      DEFAULT_MAX_ENTRIES,

    soundEnabled:
      settings.soundEnabled ??
      DEFAULT_SOUND_ENABLED,

    spinSound:
      settings.spinSound ??
      "tick",

    winnerSound:
      settings.winnerSound ??
      "success",

    volume:
      settings.volume ??
      DEFAULT_VOLUME,

    pageTheme:
      appThemeToPanelTheme(
        settings.appearanceTheme,
      ),
  };
}

export function panelSettingsToWheelSettings(
  panelSettings: PanelWheelSettings,
  currentSettings: WheelSettings,
): WheelSettings {
  return {
    ...currentSettings,

    appearanceTheme:
      panelThemeToAppTheme(
        panelSettings.pageTheme,
      ),

    wheelSize:
      currentSettings.wheelSize ??
      DEFAULT_WHEEL_SIZE,

    spinSpeed:
      clampSpinSpeed(
        panelSettings.spinSpeed,
      ),

    spinDuration:
      clampSpinDuration(
        panelSettings.spinDuration,
      ),

    pointerMatchSliceColor:
      panelSettings.pointerMatchSliceColor,

    autoGenerateEnabled:
      panelSettings.autoGenerateEnabled,

    autoGenerateCount:
      panelSettings.autoGenerateCount,

    autoGenerateType:
      panelAutoGenerateTypeToAppType(
        panelSettings.autoGenerateCategory,
      ),

    confettiEnabled:
      panelSettings.confettiEnabled,

    confettiEffect:
      panelConfettiToAppEffect(
        panelSettings.confettiStyle,
      ),

    winnerDisplay:
      panelWinnerToAppWinner(
        panelSettings.winnerDisplayMethod,
      ),

    maxEntries:
      panelSettings.numberOfEntries,

    soundEnabled:
      panelSettings.soundEnabled,

    spinSound:
      panelSettings.spinSound,

    winnerSound:
      panelSettings.winnerSound,

    volume:
      panelSettings.volume,
  };
}