"use client";

import type { WheelEntry } from "../lib/wheel-types";

type PersonalisePanelProps = {
  entries: WheelEntry[];
  spinning: boolean;
  onUpdate: (
    id: string,
    changes: Partial<WheelEntry>,
  ) => void;
  accentClass: string;
  accentHoverClass: string;
};

function normalizedWeight(
  entry: WheelEntry,
): number {
  return Math.max(
    1,
    Math.floor(entry.weight ?? 1),
  );
}

export default function PersonalisePanel({
  entries,
  spinning,
  onUpdate,
  accentClass,
  accentHoverClass,
}: PersonalisePanelProps) {
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
      nextWeight === currentWeight
    ) {
      return;
    }

    onUpdate(entry.id, {
      weight: nextWeight,
    });
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-base font-semibold text-slate-950">
          Personalise
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Adjust the weight of each
          entry. Higher weight gives an
          entry a larger slice and a
          higher chance of being selected.
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
          <p className="text-sm text-slate-500">
            Add an entry to personalise
            your wheel.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {entries.map((entry, index) => {
            const weight =
              normalizedWeight(entry);

            return (
              <div
                key={entry.id}
                className={`rounded-xl border border-slate-200 p-4 transition ${
                  entry.hidden
                    ? "bg-slate-50 opacity-60"
                    : "bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-4 w-4 shrink-0 rounded-full border border-white shadow-sm ring-1 ring-slate-200"
                    style={{
                      backgroundColor:
                        entry.color,
                    }}
                    aria-hidden="true"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400">
                        {index + 1}
                      </span>

                      <p className="truncate text-sm font-semibold text-slate-900">
                        {entry.label ||
                          `Entry ${
                            index + 1
                          }`}
                      </p>
                    </div>

                    {entry.hidden && (
                      <p className="mt-1 text-xs font-medium text-slate-400">
                        Hidden from wheel
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      changeWeight(
                        entry,
                        -1,
                      )
                    }
                    disabled={
                      spinning ||
                      weight <= 1
                    }
                    aria-label={`Decrease weight for ${
                      entry.label ||
                      `entry ${
                        index + 1
                      }`
                    }`}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    −
                  </button>

                  <div className="flex h-9 flex-1 items-center justify-center rounded-lg bg-slate-50 px-3 text-xs font-semibold text-slate-600">
                    Weight {weight}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      changeWeight(
                        entry,
                        1,
                      )
                    }
                    disabled={spinning}
                    aria-label={`Increase weight for ${
                      entry.label ||
                      `entry ${
                        index + 1
                      }`
                    }`}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white transition focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-35 ${accentClass} ${accentHoverClass}`}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}