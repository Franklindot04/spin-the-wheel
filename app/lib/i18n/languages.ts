/*
 * The languages the app knows about. A language is only
 * offered to people once `available` is true, which is
 * when its dictionary is in the app and has been checked
 * by someone who speaks it. `reviewed` records that check.
 * Names are written in the language itself, and the flag is
 * decoration only: it does not show on every system, so the
 * name always has to be shown with it.
 */
export type LanguageCode = "en" | "es" | "fr";

export type Language = {
  code: LanguageCode;
  name: string;
  flag: string;
  reviewed: boolean;
  available: boolean;
};

export const LANGUAGES: readonly Language[] = [
  {
    code: "en",
    name: "English",
    flag: "🇬🇧",
    reviewed: true,
    available: true,
  },
  {
    code: "es",
    name: "Español",
    flag: "🇪🇸",
    reviewed: false,
    available: false,
  },
  {
    code: "fr",
    name: "Français",
    flag: "🇫🇷",
    reviewed: false,
    available: false,
  },
];

export const DEFAULT_LANGUAGE: LanguageCode = "en";

/*
 * Holds only the chosen language code. It is written by
 * the app when the person picks a language, and read by the
 * script in the page head so the page has the right lang
 * before the first paint. It is not part of the wheel data,
 * so it is never in an export.
 */
export const LANGUAGE_STORAGE_KEY =
  "spin-the-wheel:language";

export const AVAILABLE_LANGUAGE_CODES: readonly LanguageCode[] =
  LANGUAGES.filter(
    (language) => language.available,
  ).map((language) => language.code);

/*
 * Picks the first language in the person's order of
 * preference that the app has. Only the first part of a
 * tag counts, so es-MX and es-ES both give es. Anything
 * else gives English.
 */
export function pickLanguage(
  preferred:
    | readonly (string | null | undefined)[]
    | null
    | undefined,
  available: readonly LanguageCode[] = AVAILABLE_LANGUAGE_CODES,
): LanguageCode {
  if (preferred) {
    for (const tag of preferred) {
      if (typeof tag !== "string") {
        continue;
      }

      const primary = tag
        .trim()
        .toLowerCase()
        .split(/[-_]/)[0];

      const match = available.find(
        (code) => code === primary,
      );

      if (match) {
        return match;
      }
    }
  }

  return DEFAULT_LANGUAGE;
}

/*
 * A stored value counts only if it is exactly the code of a
 * language that is available. Anything else means the
 * person has not chosen.
 */
export function parseStoredLanguage(
  value: unknown,
  available: readonly LanguageCode[] = AVAILABLE_LANGUAGE_CODES,
): LanguageCode | null {
  if (typeof value !== "string") {
    return null;
  }

  return (
    available.find((code) => code === value) ??
    null
  );
}
