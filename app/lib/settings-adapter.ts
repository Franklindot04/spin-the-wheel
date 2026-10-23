import type {
  AutoGenerateType,
  ConfettiEffect,
  WheelSettings,
  WinnerDisplay,
} from "./wheel-types";

import type {
  ConfettiStyle,
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
  MAX_SPIN_DURATION,
  MAX_SPIN_SPEED,
  MIN_SPIN_DURATION,
  MIN_SPIN_SPEED,
} from "./wheel-defaults";

import {
  DEFAULT_SPIN_SOUND,
  DEFAULT_WINNER_SOUND,
} from "./sound-options";

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

function appWinnerToPanelWinner(
  winner?: WinnerDisplay,
): WinnerDisplayMethod {
  switch (winner) {
    case "popup":
      return "popup";

    case "banner":
    case "none":
    case "wheel":
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
      DEFAULT_SPIN_SOUND,

    winnerSound:
      settings.winnerSound ??
      DEFAULT_WINNER_SOUND,

    volume:
      settings.volume ??
      DEFAULT_VOLUME,

    appearanceTheme:
      settings.appearanceTheme,
  };
}

export function panelSettingsToWheelSettings(
  panelSettings: PanelWheelSettings,
  currentSettings: WheelSettings,
): WheelSettings {
  return {
    ...currentSettings,

    appearanceTheme:
      panelSettings.appearanceTheme,

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

    /*
     * The saved value is only written when the user picks a
     * different choice. An untouched wheel keeps its raw value,
     * even one the panel shows as Result panel (banner, none or
     * wheel).
     */
    winnerDisplay:
      panelSettings.winnerDisplayMethod ===
      appWinnerToPanelWinner(
        currentSettings.winnerDisplay,
      )
        ? currentSettings.winnerDisplay
        : panelSettings.winnerDisplayMethod ===
            "popup"
          ? "popup"
          : "banner",

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