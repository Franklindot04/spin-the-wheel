"use client";

import type { SpinHistoryItem } from "../lib/wheel-types";
import { formatHistoryTime } from "../lib/wheel-utils";

type HistoryPanelProps = {
  history: SpinHistoryItem[];
  spinning: boolean;
  onClear: () => void;
  accentClass: string;
  accentHoverClass: string;
};

export default function HistoryPanel({
  history,
  spinning,
  onClear,
  accentClass,
  accentHoverClass,
}: HistoryPanelProps) {
  const sortedHistory = [...history].sort(
    (first, second) =>
      second.timestamp - first.timestamp,
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-950">
              History
            </h2>

            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
              {history.length}
            </span>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Review the results from
            previous spins.
          </p>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            disabled={spinning}
            className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear All
          </button>
        )}
      </div>

      {sortedHistory.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 8v4l2.5 2.5" />
              <circle
                cx="12"
                cy="12"
                r="8.5"
              />
            </svg>
          </div>

          <p className="mt-3 text-sm font-medium text-slate-600">
            No spins yet.
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Your spin results will appear
            here.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {sortedHistory.map(
            (item, index) => {
              const isQuiz =
                item.mode === "quiz";

              return (
                <article
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white ${accentClass}`}
                    >
                      {sortedHistory.length -
                        index}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-950">
                            {item.label ||
                              "Unnamed entry"}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {formatHistoryTime(
                              item.timestamp,
                            )}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${
                            isQuiz
                              ? "bg-violet-50 text-violet-600"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {isQuiz
                            ? "Quiz"
                            : "Standard"}
                        </span>
                      </div>

                      {isQuiz &&
                        item.question && (
                          <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                              Question
                            </p>

                            <p className="mt-1 text-xs leading-5 text-slate-600">
                              {
                                item.question
                              }
                            </p>
                          </div>
                        )}
                    </div>
                  </div>
                </article>
              );
            },
          )}
        </div>
      )}

      {history.length > 0 && (
        <button
          type="button"
          onClick={onClear}
          disabled={spinning}
          className={`mt-4 w-full rounded-xl px-4 py-2.5 text-xs font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40 ${accentClass} ${accentHoverClass}`}
        >
          Clear History
        </button>
      )}
    </section>
  );
}