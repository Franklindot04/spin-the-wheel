"use client";

import type { WheelEntry } from "./Wheel";

type EntryListProps = {
  entries: WheelEntry[];
  mode: "standard" | "quiz";
  onAdd: () => void;
  onUpdate: (
    id: string,
    changes: Partial<WheelEntry>,
  ) => void;
  onDelete: (id: string) => void;
  accentClass: string;
  accentHoverClass: string;
};

export default function EntryList({
  entries,
  mode,
  onAdd,
  onUpdate,
  onDelete,
  accentClass,
  accentHoverClass,
}: EntryListProps) {
  const isQuiz = mode === "quiz";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-950">
              {isQuiz ? "Quiz Questions" : "Entries"}
            </h2>

            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
              {entries.length}
            </span>
          </div>

          <p className="mt-1 text-sm leading-5 text-slate-500">
            {isQuiz
              ? "Add questions and answers for your quiz."
              : "Add the options for your wheel."}
          </p>
        </div>

        <button
          type="button"
          onClick={onAdd}
          className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 ${accentClass} ${accentHoverClass}`}
        >
          + Add
        </button>
      </div>

      <div className="mt-5 space-y-2">
        {entries.map((entry, index) => (
          <div
            key={entry.id}
            className="rounded-xl border border-slate-200 bg-white p-3"
          >
            <div className="flex items-center gap-3">
              <span
                className="h-4 w-4 shrink-0 rounded-full border border-slate-200"
                style={{ backgroundColor: entry.color }}
                aria-hidden="true"
              />

              <input
                value={entry.label}
                onChange={(event) =>
                  onUpdate(entry.id, {
                    label: event.target.value,
                  })
                }
                aria-label={`${isQuiz ? "Question" : "Entry"} ${index + 1} label`}
                className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />

              <button
                type="button"
                onClick={() => onDelete(entry.id)}
                disabled={entries.length <= 2}
                aria-label={`Delete ${isQuiz ? "question" : "entry"} ${index + 1}`}
                className="shrink-0 px-1 text-sm font-medium text-slate-400 transition hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
              >
                ×
              </button>
            </div>

            {isQuiz && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <div>
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <label
                      htmlFor={`question-${entry.id}`}
                      className="text-xs font-semibold text-slate-500"
                    >
                      Question
                    </label>

                    <span className="text-xs text-slate-400">
                      {(entry.question ?? "").length} characters
                    </span>
                  </div>

                  <textarea
                    id={`question-${entry.id}`}
                    value={entry.question ?? ""}
                    onChange={(event) =>
                      onUpdate(entry.id, {
                        question: event.target.value,
                      })
                    }
                    rows={4}
                    className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div className="mt-4">
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <label
                      htmlFor={`answer-${entry.id}`}
                      className="text-xs font-semibold text-slate-500"
                    >
                      Answer
                    </label>

                    <span className="text-xs text-slate-400">
                      {(entry.answer ?? "").length} characters
                    </span>
                  </div>

                  <textarea
                    id={`answer-${entry.id}`}
                    value={entry.answer ?? ""}
                    onChange={(event) =>
                      onUpdate(entry.id, {
                        answer: event.target.value,
                      })
                    }
                    rows={3}
                    className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-2 text-xs text-slate-400">
        <span aria-hidden="true">•</span>
        <span>Minimum 2 entries required.</span>
      </div>
    </div>
  );
}
