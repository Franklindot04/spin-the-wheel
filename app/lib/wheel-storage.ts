import type {
  AppData,
  LegacyStoredData,
  Wheel,
} from "./wheel-types";
import {
  DEFAULT_WHEEL_DESCRIPTION,
  DEFAULT_WHEEL_TITLE,
  createDefaultWheelSettings,
  normalizeEntry,
  normalizeWheel,
  normalizeWheelSettings,
} from "./wheel-defaults";
import { APPEARANCE_THEMES } from "./appearance-themes";

export const STORAGE_KEY =
  "spin-the-wheel:v2";

export const LEGACY_STORAGE_KEY =
  "spin-the-wheel:v1";

export function isLegacyStoredData(
  value: unknown,
): value is LegacyStoredData {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return false;
  }

  const data =
    value as Partial<LegacyStoredData>;

  return (
    data.version === 1 &&
    Array.isArray(
      data.standardEntries,
    ) &&
    Array.isArray(
      data.quizEntries,
    ) &&
    typeof data.wheelTitle ===
      "string" &&
    typeof data.wheelDescription ===
      "string"
  );
}

export function isAppData(
  value: unknown,
): value is AppData {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return false;
  }

  const data =
    value as Partial<AppData>;

  return (
    data.version === 2 &&
    Array.isArray(data.wheels) &&
    data.wheels.length > 0 &&
    typeof data.activeWheelId ===
      "string"
  );
}

export function migrateStoredData(
  value: unknown,
): AppData | null {
  if (isAppData(value)) {
    const wheels = value.wheels.map(
      normalizeWheel,
    );

    const activeWheelId =
      wheels.some(
        (wheel) =>
          wheel.id ===
          value.activeWheelId,
      )
        ? value.activeWheelId
        : wheels[0].id;

    return {
      version: 2,
      wheels,
      activeWheelId,
    };
  }

  if (isLegacyStoredData(value)) {
    const legacySettings =
      createDefaultWheelSettings();

    const wheel: Wheel = {
      id: crypto.randomUUID(),

      name: "Wheel 1",

      title:
        value.wheelTitle.trim() ||
        DEFAULT_WHEEL_TITLE,

      description:
        value.wheelDescription.trim() ||
        DEFAULT_WHEEL_DESCRIPTION,

      standardEntries:
        value.standardEntries.map(
          normalizeEntry,
        ),

      quizEntries:
        value.quizEntries.map(
          normalizeEntry,
        ),

      standardHistory:
        value.standardHistory ?? [],

      quizHistory:
        value.quizHistory ?? [],

      settings: {
        ...legacySettings,

        appearanceTheme:
          value.appearanceTheme &&
          value.appearanceTheme in
            APPEARANCE_THEMES
            ? value.appearanceTheme
            : legacySettings.appearanceTheme,
      },
    };

    return {
      version: 2,
      wheels: [normalizeWheel(wheel)],
      activeWheelId: wheel.id,
    };
  }

  return null;
}

export function serializeAppData(
  appData: AppData,
): string {
  return JSON.stringify(
    appData,
    null,
    2,
  );
}

export function parseImportedData(
  content: string,
): AppData {
  const parsed: unknown =
    JSON.parse(content);

  const imported =
    migrateStoredData(parsed);

  if (!imported) {
    throw new Error(
      "This file is not a valid Spin the Wheel export.",
    );
  }

  return imported;
}

export function normalizeImportedWheelSettings(
  appData: AppData,
): AppData {
  return {
    ...appData,

    wheels: appData.wheels.map(
      (wheel) => ({
        ...wheel,
        settings:
          normalizeWheelSettings(
            wheel.settings,
          ),
      }),
    ),
  };
}