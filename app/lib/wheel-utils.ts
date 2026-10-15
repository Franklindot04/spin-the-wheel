import type { SetStateAction } from "react";

import type { WheelEntry } from "./wheel-types";

export function getRandomIndex(length: number): number {
  if (length <= 0) {
    return -1;
  }

  return Math.floor(Math.random() * length);
}

export function resolveStateValue<T>(
  value: SetStateAction<T>,
  previous: T,
): T {
  return typeof value === "function"
    ? (value as (previous: T) => T)(previous)
    : value;
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
