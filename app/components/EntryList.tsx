"use client";

import {
  useState,
} from "react";
import type {
  AppearanceThemeConfig,
  WheelEntry,
} from "../lib/wheel-types";
import EntryMenu from "./EntryMenu";

type EntryListProps = {
  entries: WheelEntry[];
  mode: "standard" | "quiz";
  onAdd: () => void;
  onUpdate: (
    id: string,
    changes: Partial<WheelEntry>,
  ) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  accentClass: string;
  accentHoverClass: string;
  theme: AppearanceThemeConfig;
};

function normalizedWeight(
  entry: WheelEntry,
): number {
  return Math.max(
    1,
    Math.floor(entry.weight ?? 1),
  );
}

function EyeIcon({
  hidden,
}: {
  hidden: boolean;
}) {
  if (hidden) {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m3 3 18 18" />
        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
        <path d="M9.9 4.3A10.9 10.9 0 0 1 12 4c5 0 8.7 4 10 8-.5 1.5-1.3 2.8-2.3 3.9" />
        <path d="M6.2 6.2C4.6 7.4 3.4 9.1 2 12c1.3 4 5 8 10 8 1.1 0 2.1-.2 3-.5" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle
        cx="12"
        cy="12"
        r="3"
      />
    </svg>
  );
}

export default function EntryList({
  entries,
  mode,
  onAdd,
  onUpdate,
  onDelete,
  onDuplicate,
  accentClass,
  accentHoverClass,
  theme,
}: EntryListProps) {
  const [
    openMenuId,
    setOpenMenuId,
  ] = useState<string | null>(null);

  function toggleHidden(
    entry: WheelEntry,
  ) {
    onUpdate(entry.id, {
      hidden: !entry.hidden,
    });
  }

  function changeWeight(
    entry: WheelEntry,
    direction: -1 | 1,
  ) {
    const currentWeight =
      normalizedWeight(entry);

    const nextWeight = Math.max(
      1,
      currentWeight + direction,
    );

    if (
      nextWeight ===
      currentWeight
    ) {
      return;
    }

    onUpdate(entry.id, {
      weight: nextWeight,
    });
  }

  function handleUpdate(
    id: string,
    changes: Partial<WheelEntry>,
  ) {
    onUpdate(id, changes);
  }

  function handleDelete(
    id: string,
  ) {
    setOpenMenuId(null);
    onDelete(id);
  }

  function handleDuplicate(
    id: string,
  ) {
    setOpenMenuId(null);
    onDuplicate(id);
  }

  return (
    <section
      className={`rounded-2xl border p-5 shadow-sm ${theme.borderClass} ${theme.surfaceClass}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2
            className={`text-base font-semibold ${theme.textPrimaryClass}`}
          >
            {mode === "quiz"
              ? "Questions"
              : "Entries"}
          </h2>

          <p
            className={`mt-1 text-sm ${theme.textMutedClass}`}
          >
            {entries.length}{" "}
            {mode === "quiz"
              ? "questions"
              : "entries"}
          </p>
        </div>

        <button
          type="button"
          onClick={onAdd}
          className={`rounded-lg px-3 py-2 text-sm font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-current focus:ring-offset-2 ${accentClass} ${accentHoverClass}`}
        >
          + Add
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {entries.map(
          (entry, index) => {
            const weight =
              normalizedWeight(
                entry,
              );

            const labelLength =
              entry.label.length;

            return (
              <div
                key={entry.id}
                className={`rounded-xl border p-3 transition ${
                  entry.hidden
                    ? `${theme.borderClass} ${theme.subtleSurfaceClass} opacity-65`
                    : `${theme.borderClass} ${theme.subtleSurfaceClass}`
                }`}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`mt-2 h-3 w-3 shrink-0 rounded-full border shadow-sm ${theme.borderClass}`}
                    style={{
                      backgroundColor:
                        entry.color,
                    }}
                    aria-hidden="true"
                  />

                  <div className="min-w-0 flex-1">
                    <input
                      value={
                        entry.label
                      }
                      onChange={(
                        event,
                      ) =>
                        onUpdate(
                          entry.id,
                          {
                            label:
                              event
                                .target
                                .value,
                          },
                        )
                      }
                      className={`w-full rounded-lg border px-3 py-2 text-sm font-medium outline-none transition ${theme.inputClass} ${
                        entry.hidden
                          ? theme.textMutedClass
                          : theme.textPrimaryClass
                      }`}
                      aria-label={`Entry ${
                        index + 1
                      }`}
                    />

                    <div className="mt-1.5 flex items-center justify-between gap-3 px-1">
                      <span
                        className={`text-[10px] font-medium ${theme.textMutedClass}`}
                      >
                        {labelLength}{" "}
                        {labelLength ===
                        1
                          ? "character"
                          : "characters"}
                      </span>

                      {entry.hidden && (
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-wide ${theme.textMutedClass}`}
                        >
                          Hidden
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        toggleHidden(
                          entry,
                        )
                      }
                      aria-label={
                        entry.hidden
                          ? `Show ${entry.label}`
                          : `Hide ${entry.label}`
                      }
                      aria-pressed={
                        !entry.hidden
                      }
                      title={
                        entry.hidden
                          ? "Show entry"
                          : "Hide entry"
                      }
                      className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${theme.textMutedClass} ${theme.controlHoverClass}`}
                    >
                      <EyeIcon
                        hidden={
                          entry.hidden ??
                          false
                        }
                      />
                    </button>

                    <EntryMenu
                      entry={entry}
                      open={
                        openMenuId ===
                        entry.id
                      }
                      spinning={false}
                      onToggle={() =>
                        setOpenMenuId(
                          (
                            current,
                          ) =>
                            current ===
                            entry.id
                              ? null
                              : entry.id,
                        )
                      }
                      onClose={() =>
                        setOpenMenuId(
                          null,
                        )
                      }
                      onUpdate={
                        handleUpdate
                      }
                      onDuplicate={
                        handleDuplicate
                      }
                      onDelete={
                        handleDelete
                      }
                      accentClass={
                        accentClass
                      }
                      accentHoverClass={
                        accentHoverClass
                      }
                      theme={theme}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(
                          entry.id,
                        )
                      }
                      disabled={
                        entries.length <=
                        2
                      }
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-lg leading-none text-red-400 transition hover:bg-red-950/40 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-30`}
                      aria-label={`Delete ${entry.label}`}
                      title="Delete entry"
                    >
                      ×
                    </button>
                  </div>
                </div>

                <div
                  className={`mt-2 flex items-center justify-between gap-3 border-t pt-2 ${theme.borderClass}`}
                >
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wide ${theme.textMutedClass}`}
                  >
                    Slice weight
                  </span>

                  <div
                    className={`flex items-center overflow-hidden rounded-lg border ${theme.borderClass} ${theme.surfaceClass}`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        changeWeight(
                          entry,
                          -1,
                        )
                      }
                      disabled={
                        weight <= 1
                      }
                      aria-label="Decrease slice weight"
                      className={`flex h-7 w-8 items-center justify-center text-sm font-bold transition ${theme.textSecondaryClass} ${theme.controlHoverClass} disabled:cursor-not-allowed disabled:opacity-35`}
                    >
                      −
                    </button>

                    <span
                      className={`min-w-[36px] border-x px-2 text-center text-[11px] font-bold ${theme.borderClass} ${theme.textSecondaryClass}`}
                    >
                      {weight}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        changeWeight(
                          entry,
                          1,
                        )
                      }
                      aria-label="Increase slice weight"
                      className={`flex h-7 w-8 items-center justify-center text-sm font-bold transition ${theme.textSecondaryClass} ${theme.controlHoverClass}`}
                    >
                      +
                    </button>
                  </div>
                </div>

                {mode ===
                  "quiz" && (
                  <div
                    className={`mt-3 space-y-2 border-t pt-3 ${theme.borderClass}`}
                  >
                    <textarea
                      value={
                        entry.question ??
                        ""
                      }
                      onChange={(
                        event,
                      ) =>
                        onUpdate(
                          entry.id,
                          {
                            question:
                              event
                                .target
                                .value,
                          },
                        )
                      }
                      placeholder="Question"
                      rows={3}
                      className={`w-full resize-y rounded-lg border px-3 py-2 text-sm outline-none transition ${theme.inputClass}`}
                    />

                    <div className="flex justify-end px-1">
                      <span
                        className={`text-[10px] font-medium ${theme.textMutedClass}`}
                      >
                        {
                          (
                            entry.question ??
                            ""
                          ).length
                        }{" "}
                        characters
                      </span>
                    </div>

                    <textarea
                      value={
                        entry.answer ??
                        ""
                      }
                      onChange={(
                        event,
                      ) =>
                        onUpdate(
                          entry.id,
                          {
                            answer:
                              event
                                .target
                                .value,
                          },
                        )
                      }
                      placeholder="Answer"
                      rows={3}
                      className={`w-full resize-y rounded-lg border px-3 py-2 text-sm outline-none transition ${theme.inputClass}`}
                    />

                    <div className="flex justify-end px-1">
                      <span
                        className={`text-[10px] font-medium ${theme.textMutedClass}`}
                      >
                        {
                          (
                            entry.answer ??
                            ""
                          ).length
                        }{" "}
                        characters
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          },
        )}
      </div>
    </section>
  );
}