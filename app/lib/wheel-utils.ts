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

export function formatHistoryTime(
  timestamp: number,
): string {
  return new Date(timestamp).toLocaleString([], {
    dateStyle: "short",
    timeStyle: "short",
  });
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
  return Math.max(
    1,
    Math.floor(entry.weight ?? 1),
  );
}
