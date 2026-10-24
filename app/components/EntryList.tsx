"use client";

import {
  useState,
} from "react";
import type {
  AppearanceThemeConfig,
  WheelEntry,
} from "../lib/wheel-types";
import {
  canDeleteEntry,
  countGraphemes,
  getEntryWeight,
} from "../lib/wheel-utils";
import { useT } from "../lib/i18n/provider";
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
  additionsDisabled?: boolean;
  deletionsDisabled?: boolean;
  textLocked?: boolean;
  disabled?: boolean;
  /* The entry whose result is showing in the winner box. */
  lockedId?: string | null;
  maxEntries?: number;
  accentClass: string;
  accentHoverClass: string;
  theme: AppearanceThemeConfig;
};

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
  additionsDisabled = false,
  deletionsDisabled = false,
  textLocked = false,
  disabled = false,
  lockedId = null,
  maxEntries,
  accentClass,
  accentHoverClass,
  theme,
}: EntryListProps) {
  const t = useT();

  const [
    openMenuId,
    setOpenMenuId,
  ] = useState<string | null>(null);

  /*
   * A menu left open on the locked entry closes when the lock
   * starts.
   */
  if (
    lockedId !== null &&
    openMenuId === lockedId
  ) {
    setOpenMenuId(null);
  }

  const atLimit =
    maxEntries !== undefined &&
    entries.length >= maxEntries;

  const limitMessage = t(
    mode === "quiz"
      ? "entryList.limit.questions"
      : "entryList.limit.entries",
    { max: maxEntries ?? 0 },
  );

  const deleteLockedTitle = t(
    "entryList.deleteLockedTitle",
  );

  const lockedClass = textLocked
    ? "border-dashed cursor-default"
    : "";

  const quizTextHidden =
    mode === "quiz" && textLocked;

  function toggleHidden(
    entry: WheelEntry,
  ) {
    onUpdate(entry.id, {
      hidden: !entry.hidden,
      hiddenByHideAll: undefined,
    });
  }

  function changeWeight(
    entry: WheelEntry,
    direction: -1 | 1,
  ) {
    const currentWeight =
      getEntryWeight(entry);

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
              ? t("entryList.heading.questions")
              : t("entryList.heading.entries")}
          </h2>

          <p
            className={`mt-1 text-sm ${theme.textMutedClass}`}
          >
            {atLimit
              ? t(
                  mode === "quiz"
                    ? "entryList.countAtLimit.questions"
                    : "entryList.countAtLimit.entries",
                  {
                    count: entries.length,
                    max: maxEntries ?? 0,
                  },
                )
              : t(
                  mode === "quiz"
                    ? "entryList.count.questions"
                    : "entryList.count.entries",
                  { count: entries.length },
                )}
          </p>
        </div>

        <button
          type="button"
          onClick={onAdd}
          disabled={
            disabled ||
            additionsDisabled ||
            atLimit
          }
          title={
            additionsDisabled
              ? t("entryList.addLockedTitle")
              : atLimit
                ? limitMessage
                : undefined
          }
          className={`rounded-lg px-3 py-2 text-sm font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-current focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 ${accentClass} ${accentHoverClass}`}
        >
          {t("entryList.add")}

        </button>
      </div>

      {quizTextHidden && (
        <p
          className={`mt-4 rounded-xl p-4 text-sm leading-6 ${theme.subtleSurfaceClass} ${theme.textSecondaryClass}`}
        >
          {t("entryList.quizTextHidden")}
        </p>
      )}

      <div className="mt-5 space-y-3">
        {entries.map(
          (entry, index) => {
            const weight =
              getEntryWeight(
                entry,
              );

            const labelLength =
              countGraphemes(
                entry.label,
              );

            const questionLength =
              countGraphemes(
                entry.question ??
                  "",
              );

            const answerLength =
              countGraphemes(
                entry.answer ?? "",
              );

            const hiddenContentClass =
              entry.hidden
                ? "opacity-65"
                : "";

            const rowLocked =
              entry.id === lockedId;

            const rowDisabled =
              disabled || rowLocked;

            const lockNoteId = `entry-lock-${entry.id}`;

            return (
              <div
                key={entry.id}
                className={`rounded-xl border p-3 transition ${theme.borderClass} ${theme.subtleSurfaceClass}`}
              >
                <div className="flex flex-wrap items-start gap-2 sm:flex-nowrap">
                  <span
                    className={`mt-2 h-3 w-3 shrink-0 rounded-full border shadow-sm ${theme.borderClass} ${hiddenContentClass}`}
                    style={{
                      backgroundColor:
                        entry.color,
                    }}
                    aria-hidden="true"
                  />

                  {entry.emoji && (
                    <span
                      className={`mt-1.5 shrink-0 text-base leading-none ${hiddenContentClass}`}
                      aria-hidden="true"
                    >
                      {entry.emoji}
                    </span>
                  )}

                  <div
                    className={`order-first min-w-full flex-1 sm:order-none sm:min-w-0 ${hiddenContentClass}`}
                  >
                    {quizTextHidden ? (
                      <p
                        className={`w-full break-words rounded-lg px-3 py-2 text-sm font-medium ${
                          entry.hidden
                            ? theme.textMutedClass
                            : theme.textPrimaryClass
                        }`}
                      >
                        {entry.label}
                      </p>
                    ) : (
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
                        disabled={
                          rowDisabled
                        }
                        aria-describedby={
                          rowLocked
                            ? lockNoteId
                            : undefined
                        }
                        readOnly={
                          textLocked
                        }
                        aria-readonly={
                          textLocked ||
                          undefined
                        }
                        className={`w-full rounded-lg border px-3 py-2 text-sm font-medium outline-none transition disabled:cursor-not-allowed disabled:opacity-40 ${theme.inputClass} ${lockedClass} ${
                          entry.hidden
                            ? theme.textMutedClass
                            : theme.textPrimaryClass
                        }`}
                        aria-label={t("entryList.entryLabel", {
                          number: index + 1,
                        })}
                      />
                    )}

                    <div className="mt-1.5 flex items-center justify-between gap-3 px-1">
                      <span
                        className={`text-[10px] font-medium ${theme.textMutedClass}`}
                      >
                        {t("entryList.characters", {
                          count: labelLength,
                        })}
                      </span>

                      {entry.hidden && (
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-wide ${theme.textMutedClass}`}
                        >
                          {t("entryList.hidden")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="ml-auto flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        toggleHidden(
                          entry,
                        )
                      }
                      aria-label={
                        entry.hidden
                          ? t("entryList.showNamed", {
                              name: entry.label,
                            })
                          : t("entryList.hideNamed", {
                              name: entry.label,
                            })
                      }
                      aria-pressed={
                        !entry.hidden
                      }
                      disabled={
                        rowDisabled
                      }
                      title={
                        entry.hidden
                          ? t("entryList.showTitle")
                          : t("entryList.hideTitle")
                      }
                      className={`flex h-8 w-8 items-center justify-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-40 ${theme.textMutedClass} ${theme.controlHoverClass}`}
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
                      spinning={rowDisabled}
                      textLocked={
                        textLocked
                      }
                      duplicateDisabled={
                        additionsDisabled ||
                        atLimit
                      }
                      duplicateDisabledTitle={
                        additionsDisabled
                          ? undefined
                          : limitMessage
                      }
                      deleteDisabled={
                        deletionsDisabled ||
                        !canDeleteEntry(
                          entries,
                          entry,
                        )
                      }
                      deleteDisabledTitle={
                        deletionsDisabled
                          ? deleteLockedTitle
                          : undefined
                      }
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
                        rowDisabled ||
                        deletionsDisabled ||
                        !canDeleteEntry(
                          entries,
                          entry,
                        )
                      }
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-lg leading-none text-red-200 transition not-disabled:hover:bg-red-950/40 not-disabled:hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-30`}
                      aria-label={t("entryList.deleteNamed", {
                        name: entry.label,
                      })}
                      title={
                        deletionsDisabled
                          ? deleteLockedTitle
                          : t("entryList.deleteTitle")
                      }
                    >
                      ×
                    </button>
                  </div>
                </div>

                <div
                  className={`mt-2 flex items-center justify-between gap-3 border-t pt-2 ${theme.borderClass} ${hiddenContentClass}`}
                >
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wide ${theme.textMutedClass}`}
                  >
                    {t("entryList.sliceWeight")}
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
                        rowDisabled ||
                        weight <= 1
                      }
                      aria-label={t("entryList.decreaseWeight")}
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
                      disabled={
                        rowDisabled
                      }
                      aria-label={t("entryList.increaseWeight")}
                      className={`flex h-7 w-8 items-center justify-center text-sm font-bold transition ${theme.textSecondaryClass} ${theme.controlHoverClass} disabled:cursor-not-allowed disabled:opacity-35`}
                    >
                      +
                    </button>
                  </div>
                </div>

                {rowLocked && (
                  <p
                    id={lockNoteId}
                    className={`mt-2 text-xs leading-4 ${theme.textMutedClass}`}
                  >
                    {t("entryList.locked")}
                  </p>
                )}

                {mode ===
                  "quiz" &&
                  !quizTextHidden && (
                  <div
                    className={`mt-3 space-y-2 border-t pt-3 ${theme.borderClass} ${hiddenContentClass}`}
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
                      placeholder={t("entryList.questionPlaceholder")}
                      rows={3}
                      disabled={
                        disabled
                      }
                      readOnly={
                        textLocked
                      }
                      aria-readonly={
                        textLocked ||
                        undefined
                      }
                      className={`w-full resize-y rounded-lg border px-3 py-2 text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-40 ${theme.inputClass} ${lockedClass}`}
                    />

                    <div className="flex justify-end px-1">
                      <span
                        className={`text-[10px] font-medium ${theme.textMutedClass}`}
                      >
                        {t("entryList.characters", {
                          count: questionLength,
                        })}
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
                      placeholder={t("entryList.answerPlaceholder")}
                      rows={3}
                      disabled={
                        disabled
                      }
                      readOnly={
                        textLocked
                      }
                      aria-readonly={
                        textLocked ||
                        undefined
                      }
                      className={`w-full resize-y rounded-lg border px-3 py-2 text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-40 ${theme.inputClass} ${lockedClass}`}
                    />

                    <div className="flex justify-end px-1">
                      <span
                        className={`text-[10px] font-medium ${theme.textMutedClass}`}
                      >
                        {t("entryList.characters", {
                          count: answerLength,
                        })}
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