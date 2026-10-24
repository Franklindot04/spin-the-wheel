import type { SetStateAction } from "react";

import type { WheelEntry } from "./wheel-types";

export function resolveStateValue<T>(
  value: SetStateAction<T>,
  previous: T,
): T {
  return typeof value === "function"
    ? (value as (previous: T) => T)(previous)
    : value;
}

/*
 * Keeps the first `count` grapheme
 * clusters of `text`, so an emoji,
 * skin tone, flag or ZWJ sequence is
 * never split. Falls back to code
 * points when Intl.Segmenter is
 * missing, which never leaves a lone
 * surrogate.
 */
export function truncateGraphemes(
  text: string,
  count: number,
): string {
  if (count <= 0) {
    return "";
  }

  if (
    typeof Intl !== "undefined" &&
    typeof Intl.Segmenter ===
      "function"
  ) {
    let result = "";
    let kept = 0;

    for (const { segment } of new Intl.Segmenter().segment(
      text,
    )) {
      if (kept >= count) {
        break;
      }

      result += segment;
      kept++;
    }

    return result;
  }

  return Array.from(text)
    .slice(0, count)
    .join("");
}

let graphemeSegmenter:
  | Intl.Segmenter
  | null
  | undefined;

/*
 * Counts grapheme clusters, so an
 * emoji, skin tone, flag or ZWJ
 * sequence counts as one. Falls back
 * to code points when Intl.Segmenter
 * is missing. For display counters
 * only, not for label fitting.
 */
export function countGraphemes(
  text: string,
): number {
  if (graphemeSegmenter === undefined) {
    graphemeSegmenter =
      typeof Intl !== "undefined" &&
      typeof Intl.Segmenter ===
        "function"
        ? new Intl.Segmenter()
        : null;
  }

  if (graphemeSegmenter) {
    return Array.from(
      graphemeSegmenter.segment(text),
    ).length;
  }

  return Array.from(text).length;
}

/*
 * The locales to write a history time in: the browser's own
 * default locale when it has the same main language as the app,
 * else the first entry of the browser's language list that has
 * it (so es-MX keeps its region and its 12-hour clock under
 * Spanish), then the app's language. The default locale comes
 * first because it is what the browser itself uses for dates,
 * and its list can start with another region (a default of
 * en-GB with a list of en-US, en). A browser in another
 * language does not change the app's dates.
 */
export function historyLocales(
  language: string,
  deviceLanguages:
    | readonly (string | null | undefined)[]
    | null
    | undefined,
  defaultLocale?: string | null,
): string[] {
  const main = (tag: string) =>
    tag.trim().toLowerCase().split(/[-_]/)[0];

  const same = [
    defaultLocale,
    ...(deviceLanguages ?? []),
  ].find(
    (tag): tag is string =>
      typeof tag === "string" &&
      tag.trim() !== "" &&
      main(tag) === main(language),
  );


  return same && same !== language
    ? [same, language]
    : [language];
}

export function formatHistoryTime(
  timestamp: number,
  language: string,
): string {
  const options = {
    dateStyle: "short",
    timeStyle: "short",
  } as const;

  const date = new Date(timestamp);

  try {
    return date.toLocaleString(
      historyLocales(
        language,
        typeof navigator === "undefined"
          ? []
          : navigator.languages,
        new Intl.DateTimeFormat().resolvedOptions().locale,
      ),
      options,
    );
  } catch {
    // A tag the browser rejects: the app's language, then the
    // browser's default.
    try {
      return date.toLocaleString(language, options);
    } catch {
      return date.toLocaleString([], options);
    }
  }
}

export function canDeleteEntry(
  entries: WheelEntry[],
  entry: WheelEntry,
): boolean {
  return (
    entries.length > 2 &&
    (entry.hidden === true ||
      entries.filter(
        (item) => !item.hidden,
      ).length > 2)
  );
}

export function getEntryWeight(
  entry: WheelEntry,
): number {
  const weight = Number(
    entry.weight ?? 1,
  );

  /*
   * A weight that is not a finite number (for
   * example 1e999 in a saved file) counts as 1.
   * JSON writes Infinity as null, so keeping it
   * would only settle after a second reload.
   */
  if (!Number.isFinite(weight)) {
    return 1;
  }

  return Math.max(
    1,
    Math.floor(weight),
  );
}
