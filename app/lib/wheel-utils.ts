import type { SetStateAction } from "react";

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