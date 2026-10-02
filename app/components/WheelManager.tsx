"use client";

import { useState } from "react";

export type ManagedWheel = {
  id: string;
  name: string;
};

type WheelManagerProps = {
  wheels: ManagedWheel[];
  activeWheelId: string;
  onWheelChange: (wheelId: string) => void;
  onAddWheel: (name: string) => void;
  onDeleteWheel: (wheelId: string) => void;
};

function ChevronDownIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 15H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

export default function WheelManager({
  wheels,
  activeWheelId,
  onWheelChange,
  onAddWheel,
  onDeleteWheel,
}: WheelManagerProps) {
  const [open, setOpen] =
    useState(false);

  const [showAddForm, setShowAddForm] =
    useState(false);

  const [newWheelName, setNewWheelName] =
    useState("");

  const activeWheel =
    wheels.find(
      (wheel) =>
        wheel.id === activeWheelId,
    ) ?? wheels[0];

  function handleAddWheel() {
    const trimmedName =
      newWheelName.trim();

    if (!trimmedName) {
      return;
    }

    onAddWheel(trimmedName);

    setNewWheelName("");
    setShowAddForm(false);
  }

  function handleDeleteWheel() {
    if (!activeWheel) {
      return;
    }

    if (wheels.length <= 1) {
      return;
    }

    onDeleteWheel(activeWheel.id);
  }

  if (!activeWheel) {
    return (
      <div className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
        No wheels
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setOpen((current) => !current)
            }
            aria-expanded={open}
            aria-haspopup="menu"
            className="flex min-w-[180px] items-center justify-between gap-4 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-left shadow-sm transition hover:bg-slate-50"
          >
            <span className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Wheel
              </span>

              <span className="block max-w-[150px] truncate text-sm font-bold text-slate-900">
                {activeWheel.name}
              </span>
            </span>

            <ChevronDownIcon />
          </button>

          {open ? (
            <>
              <button
                type="button"
                aria-label="Close wheel menu"
                onClick={() =>
                  setOpen(false)
                }
                className="fixed inset-0 z-30 cursor-default"
              />

              <div
                role="menu"
                className="absolute right-0 z-40 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
              >
                <div className="border-b border-slate-200 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Your wheels
                  </p>
                </div>

                <div className="max-h-64 overflow-y-auto p-2">
                  {wheels.map(
                    (wheel) => {
                      const selected =
                        wheel.id ===
                        activeWheelId;

                      return (
                        <button
                          key={wheel.id}
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            onWheelChange(
                              wheel.id,
                            );
                            setOpen(false);
                          }}
                          className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition ${
                            selected
                              ? "bg-slate-100"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-slate-900">
                              {wheel.name}
                            </span>

                            {selected ? (
                              <span className="mt-0.5 block text-[11px] font-medium text-slate-500">
                                Current wheel
                              </span>
                            ) : null}
                          </span>

                          {selected ? (
                            <CheckIcon />
                          ) : null}
                        </button>
                      );
                    },
                  )}
                </div>

                <div className="border-t border-slate-200 p-2">
                  {!showAddForm ? (
                    <button
                      type="button"
                      onClick={() =>
                        setShowAddForm(
                          true,
                        )
                      }
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-slate-800 transition hover:bg-slate-50"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                        <PlusIcon />
                      </span>

                      <span>
                        Add new wheel
                      </span>
                    </button>
                  ) : (
                    <div className="rounded-xl bg-slate-50 p-3">
                      <label
                        htmlFor="new-wheel-name"
                        className="block text-xs font-bold text-slate-600"
                      >
                        Wheel name
                      </label>

                      <input
                        id="new-wheel-name"
                        type="text"
                        value={
                          newWheelName
                        }
                        onChange={(event) =>
                          setNewWheelName(
                            event.target
                              .value,
                          )
                        }
                        onKeyDown={(event) => {
                          if (
                            event.key ===
                            "Enter"
                          ) {
                            handleAddWheel();
                          }

                          if (
                            event.key ===
                            "Escape"
                          ) {
                            setNewWheelName(
                              "",
                            );
                            setShowAddForm(
                              false,
                            );
                          }
                        }}
                        placeholder="e.g. Quiz Wheel"
                        autoFocus
                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                      />

                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setNewWheelName(
                              "",
                            );
                            setShowAddForm(
                              false,
                            );
                          }}
                          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          onClick={
                            handleAddWheel
                          }
                          disabled={
                            !newWheelName.trim()
                          }
                          className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Add wheel
                        </button>
                      </div>
                    </div>
                  )}

                  {wheels.length > 1 ? (
                    <button
                      type="button"
                      onClick={
                        handleDeleteWheel
                      }
                      className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-red-600 transition hover:bg-red-50"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
                        <TrashIcon />
                      </span>

                      <span>
                        Delete current wheel
                      </span>
                    </button>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}