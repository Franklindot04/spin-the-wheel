import type {
  AppData,
  LegacyStoredData,
  Wheel,
} from "./wheel-types";
import {
  DEFAULT_WHEEL_DESCRIPTION,
  DEFAULT_WHEEL_TITLE,
  createDefaultWheelSettings,
  LEGACY_WINNER_DISPLAY,
  normalizeEntries,
  normalizeWheel,
} from "./wheel-defaults";
import type { RepairReport } from "./wheel-defaults";
import {
  APPEARANCE_THEMES,
  THEME_STORAGE_KEY,
} from "./appearance-themes";
import { LANGUAGE_STORAGE_KEY } from "./i18n/languages";

export const STORAGE_KEY =
  "spin-the-wheel:v2";

export const LEGACY_STORAGE_KEY =
  "spin-the-wheel:v1";

export const UNREADABLE_BACKUP_KEY =
  "spin-the-wheel:v2:unreadable";

export const MAX_IMPORT_FILE_SIZE =
  10 * 1024 * 1024;

/*
 * Browsers do not say how much localStorage space is left, and
 * they differ: this is a conservative assumption, not a measured
 * limit. Chromium allowed about 50 MiB in testing, and other
 * browsers are often said to allow about 5 MB. The notice only
 * says storage is getting full; a save that really fails still
 * shows its own message.
 */
export const STORAGE_BUDGET_CHARACTERS =
  5000000;

export const STORAGE_WARN_RATIO = 0.8;

/*
 * The characters the app stores: the wheels, the theme copy, the
 * chosen language and the kept unreadable copy, each with its key. The wheels are
 * passed in because the caller has just written that string.
 */
export function countStoredCharacters(
  savedWheels: string,
): number {
  let total =
    STORAGE_KEY.length +
    savedWheels.length;

  for (const key of [
    THEME_STORAGE_KEY,
    LANGUAGE_STORAGE_KEY,
    UNREADABLE_BACKUP_KEY,
  ]) {
    try {
      const value =
        window.localStorage.getItem(key);

      if (value !== null) {
        total += key.length + value.length;
      }
    } catch {
      // Count what can be read.
    }
  }

  return total;
}

/*
 * The whole percent to show once storage is nearly full, or
 * null below the warning level. It stays at 99 until the budget
 * itself is reached.
 */
export function getStorageFullPercent(
  characters: number,
): number | null {
  if (
    characters <
    STORAGE_BUDGET_CHARACTERS *
      STORAGE_WARN_RATIO
  ) {
    return null;
  }

  const percent = Math.round(
    (characters /
      STORAGE_BUDGET_CHARACTERS) *
      100,
  );

  return characters <
    STORAGE_BUDGET_CHARACTERS
    ? Math.min(99, percent)
    : percent;
}

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
  report?: RepairReport,
): AppData | null {
  if (isAppData(value)) {
    const wheels: Wheel[] = [];

    for (const item of value.wheels) {
      const wheel = normalizeWheel(
        item,
        report,
      );

      if (wheel) {
        wheels.push(wheel);
      }
    }

    if (wheels.length === 0) {
      return null;
    }

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
    const legacySettings = {
      ...createDefaultWheelSettings(),
      winnerDisplay:
        LEGACY_WINNER_DISPLAY,
    };

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

    const normalized = normalizeWheel(
      wheel,
      report,
    );

    if (!normalized) {
      return null;
    }

    return {
      version: 2,
      wheels: [normalized],
      activeWheelId: normalized.id,
    };
  }

  return null;
}

export type StoredDataNotice = {
  kind:
    | "defaults"
    | "repaired"
    | "legacy"
    | "kept";
  raw: string;
  memoryOnly: boolean;
};

export type StoredDataLoad = {
  data: AppData | null;
  notice: StoredDataNotice | null;
};

function keepUnreadableCopy(
  raw: string,
): {
  raw: string;
  memoryOnly: boolean;
} {
  try {
    const existing =
      window.localStorage.getItem(
        UNREADABLE_BACKUP_KEY,
      );

    if (existing !== null) {
      return {
        raw: existing,
        memoryOnly: false,
      };
    }
  } catch {
    // Fall through and try to write the copy.
  }

  try {
    window.localStorage.setItem(
      UNREADABLE_BACKUP_KEY,
      raw,
    );

    return { raw, memoryOnly: false };
  } catch {
    return { raw, memoryOnly: true };
  }
}

function findKeptCopy(): StoredDataNotice | null {
  try {
    const existing =
      window.localStorage.getItem(
        UNREADABLE_BACKUP_KEY,
      );

    return existing === null
      ? null
      : {
          kind: "kept",
          raw: existing,
          memoryOnly: false,
        };
  } catch {
    return null;
  }
}

function loadLegacyData(): AppData | null {
  try {
    const savedV1 =
      window.localStorage.getItem(
        LEGACY_STORAGE_KEY,
      );

    if (!savedV1) {
      return null;
    }

    return migrateStoredData(
      JSON.parse(savedV1),
    );
  } catch {
    return null;
  }
}

export function loadStoredAppData(): StoredDataLoad {
  try {
    const savedV2 =
      window.localStorage.getItem(
        STORAGE_KEY,
      );

    if (savedV2) {
      let data: AppData | null = null;
      let failed = false;
      const report: RepairReport = {
        repaired: false,
      };

      try {
        data = migrateStoredData(
          JSON.parse(savedV2),
          report,
        );
      } catch {
        failed = true;
      }

      if (data && !report.repaired) {
        return {
          data,
          notice: findKeptCopy(),
        };
      }

      // Keep the stored string before anything can overwrite it.
      const copy =
        keepUnreadableCopy(savedV2);

      if (data) {
        return {
          data,
          notice: {
            kind: "repaired",
            ...copy,
          },
        };
      }

      const legacy = failed
        ? null
        : loadLegacyData();

      return {
        data: legacy,
        notice: {
          kind: legacy
            ? "legacy"
            : "defaults",
          ...copy,
        },
      };
    }

    const legacy = loadLegacyData();

    return {
      data: legacy,
      notice: findKeptCopy(),
    };
  } catch {
    // Ignore unavailable local storage.
    return { data: null, notice: null };
  }
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

/*
 * What was wrong with an import. The words are in the i18n
 * dictionary (import.error.*), so the error carries a key and
 * its values, and the page turns it into text for the
 * current language.
 */
export type ImportProblem =
  | { key: "import.error.notJson" }
  | {
      key: "import.error.unsupportedVersion";
      version: string;
    }
  | { key: "import.error.invalidFile" };

export class ImportError extends Error {
  readonly problem: ImportProblem;

  constructor(problem: ImportProblem) {
    super(problem.key);

    this.problem = problem;
  }
}

export function parseImportedData(
  content: string,
): AppData {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new ImportError({
      key: "import.error.notJson",
    });
  }

  const imported =
    migrateStoredData(parsed);

  if (!imported) {
    const version =
      parsed &&
      typeof parsed === "object"
        ? (
            parsed as {
              version?: unknown;
            }
          ).version
        : undefined;

    if (
      (typeof version === "number" ||
        typeof version === "string") &&
      version !== 1 &&
      version !== 2
    ) {
      throw new ImportError({
        key: "import.error.unsupportedVersion",
        version: String(version).slice(0, 20),
      });
    }

    throw new ImportError({
      key: "import.error.invalidFile",
    });
  }

  return imported;
}
