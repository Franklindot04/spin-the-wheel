"use client";

import { useState } from "react";

export type SettingsTab =
  | "main"
  | "sound"
  | "confetti"
  | "theme";

export type WinnerDisplayMethod =
  | "popup"
  | "panel"
  | "highlight";

export type ConfettiStyle =
  | "burst"
  | "celebration"
  | "fireworks"
  | "minimal"
  | "none";

export type PageTheme =
  | "slate"
  | "blue"
  | "purple"
  | "green"
  | "orange";

export type WheelSettings = {
  spinSpeed: number;
  spinDuration: number;
  pointerMatchSliceColor: boolean;
  autoGenerateEnabled: boolean;
  autoGenerateCount: number;
  autoGenerateCategory: string;
  confettiEnabled: boolean;
  confettiStyle: ConfettiStyle;
  winnerDisplayMethod: WinnerDisplayMethod;
  numberOfEntries: number;
  soundEnabled: boolean;
  spinSound: string;
  winnerSound: string;
  volume: number;
  pageTheme: PageTheme;
};

type SettingsPanelProps = {
  settings: WheelSettings;
  onSettingsChange: (
    settings: WheelSettings,
  ) => void;
  onRestoreDefaults: () => void;
  accentClass?: string;
};

type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
};

function Toggle({
  checked,
  onChange,
  label,
  description,
}: ToggleProps) {
  return (
    <div className="flex items-center justify-between gap-6 rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">
          {label}
        </p>

        {description ? (
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked
            ? "bg-slate-900"
            : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
            checked
              ? "left-6"
              : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-3">
      <h3 className="text-sm font-bold text-slate-900">
        {title}
      </h3>

      {description ? (
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  suffix?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-800">
        {label}
      </span>

      <div className="flex items-center overflow-hidden rounded-xl border border-slate-300 bg-white">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => {
            const nextValue =
              Number(event.target.value);

            if (Number.isNaN(nextValue)) {
              return;
            }

            onChange(
              Math.min(
                max,
                Math.max(min, nextValue),
              ),
            );
          }}
          className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
        />

        {suffix ? (
          <span className="border-l border-slate-200 px-3 text-xs font-semibold text-slate-500">
            {suffix}
          </span>
        ) : null}
      </div>
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{
    value: string;
    label: string;
  }>;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-800">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

const TABS: Array<{
  id: SettingsTab;
  label: string;
}> = [
  {
    id: "main",
    label: "Main",
  },
  {
    id: "sound",
    label: "Sound",
  },
  {
    id: "confetti",
    label: "Confetti",
  },
  {
    id: "theme",
    label: "Page Theme",
  },
];

const THEME_OPTIONS: Array<{
  value: PageTheme;
  label: string;
  previewClass: string;
}> = [
  {
    value: "slate",
    label: "Classic",
    previewClass: "bg-slate-950",
  },
  {
    value: "blue",
    label: "Ocean",
    previewClass: "bg-cyan-950",
  },
  {
    value: "purple",
    label: "Violet",
    previewClass: "bg-violet-950",
  },
  {
    value: "green",
    label: "Forest",
    previewClass: "bg-emerald-950",
  },
  {
    value: "orange",
    label: "Sunset",
    previewClass: "bg-orange-950",
  },
];

const CONFETTI_OPTIONS: Array<{
  value: ConfettiStyle;
  label: string;
  description: string;
}> = [
  {
    value: "burst",
    label: "Burst",
    description:
      "A short burst from the center.",
  },
  {
    value: "celebration",
    label: "Celebration",
    description:
      "A larger celebratory effect.",
  },
  {
    value: "fireworks",
    label: "Fireworks",
    description:
      "Multiple bursts around the winner.",
  },
  {
    value: "minimal",
    label: "Minimal",
    description:
      "A subtle amount of confetti.",
  },
  {
    value: "none",
    label: "None",
    description:
      "Do not display a confetti animation.",
  },
];

const WINNER_DISPLAY_OPTIONS: Array<{
  value: WinnerDisplayMethod;
  label: string;
}> = [
  {
    value: "popup",
    label: "Popup",
  },
  {
    value: "panel",
    label: "Result panel",
  },
  {
    value: "highlight",
    label: "Highlight on wheel",
  },
];

const AUTO_GENERATE_OPTIONS = [
  {
    value: "names",
    label: "Names",
  },
  {
    value: "animals",
    label: "Animals",
  },
  {
    value: "countries",
    label: "Countries",
  },
  {
    value: "cities",
    label: "Cities",
  },
  {
    value: "foods",
    label: "Foods",
  },
  {
    value: "custom",
    label: "Custom",
  },
];

export default function SettingsPanel({
  settings,
  onSettingsChange,
  onRestoreDefaults,
  accentClass = "bg-slate-900",
}: SettingsPanelProps) {
  const [activeTab, setActiveTab] =
    useState<SettingsTab>("main");

  function updateSettings(
    changes: Partial<WheelSettings>,
  ) {
    onSettingsChange({
      ...settings,
      ...changes,
    });
  }

  return (
    <section className="w-full rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              Settings
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Customize how your wheel behaves and looks.
            </p>
          </div>

          <button
            type="button"
            onClick={onRestoreDefaults}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
          >
            Restore defaults
          </button>
        </div>

        <div className="mt-5 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1">
          {TABS.map((tab) => {
            const active =
              activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setActiveTab(tab.id)
                }
                className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-bold transition ${
                  active
                    ? `${accentClass} text-white`
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-5">
        {activeTab === "main" ? (
          <div className="space-y-6">
            <div>
              <SectionTitle
                title="Spin behavior"
                description="Control how the wheel spins and how the winner is selected."
              />

              <div className="grid gap-4 md:grid-cols-2">
                <NumberField
                  label="Spin speed"
                  value={settings.spinSpeed}
                  min={1}
                  max={10}
                  onChange={(value) =>
                    updateSettings({
                      spinSpeed: value,
                    })
                  }
                  suffix="x"
                />

                <NumberField
                  label="Spin duration"
                  value={
                    settings.spinDuration
                  }
                  min={1}
                  max={30}
                  step={0.5}
                  onChange={(value) =>
                    updateSettings({
                      spinDuration: value,
                    })
                  }
                  suffix="sec"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Toggle
                checked={
                  settings.pointerMatchSliceColor
                }
                onChange={(checked) =>
                  updateSettings({
                    pointerMatchSliceColor:
                      checked,
                  })
                }
                label="Pointer matches slice color"
                description="Change the pointer color to match the slice currently under it."
              />

              <Toggle
                checked={
                  settings.confettiEnabled
                }
                onChange={(checked) =>
                  updateSettings({
                    confettiEnabled: checked,
                  })
                }
                label="Confetti effect"
                description="Celebrate the winning result when the wheel stops."
              />
            </div>

            <div>
              <SectionTitle
                title="Winner display"
              />

              <SelectField
                label="Display method"
                value={
                  settings.winnerDisplayMethod
                }
                onChange={(value) =>
                  updateSettings({
                    winnerDisplayMethod:
                      value as WinnerDisplayMethod,
                  })
                }
                options={
                  WINNER_DISPLAY_OPTIONS
                }
              />
            </div>

            <div>
              <SectionTitle
                title="Auto-generate entries"
                description="Quickly populate the wheel with generated options."
              />

              <div className="space-y-4">
                <Toggle
                  checked={
                    settings.autoGenerateEnabled
                  }
                  onChange={(checked) =>
                    updateSettings({
                      autoGenerateEnabled:
                        checked,
                    })
                  }
                  label="Enable auto-generation"
                />

                {settings.autoGenerateEnabled ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <NumberField
                      label="Number of entries"
                      value={
                        settings.autoGenerateCount
                      }
                      min={2}
                      max={100}
                      onChange={(value) =>
                        updateSettings({
                          autoGenerateCount:
                            value,
                        })
                      }
                    />

                    <SelectField
                      label="Category"
                      value={
                        settings.autoGenerateCategory
                      }
                      onChange={(value) =>
                        updateSettings({
                          autoGenerateCategory:
                            value,
                        })
                      }
                      options={
                        AUTO_GENERATE_OPTIONS
                      }
                    />
                  </div>
                ) : null}
              </div>
            </div>

            <div>
              <SectionTitle
                title="Wheel size"
                description="Choose how many entries your wheel should contain by default."
              />

              <NumberField
                label="Number of entries"
                value={
                  settings.numberOfEntries
                }
                min={2}
                max={100}
                onChange={(value) =>
                  updateSettings({
                    numberOfEntries: value,
                  })
                }
              />
            </div>
          </div>
        ) : null}

        {activeTab === "sound" ? (
          <div className="space-y-6">
            <div>
              <SectionTitle
                title="Sound"
                description="Control sounds played while spinning and after a winner is selected."
              />

              <Toggle
                checked={
                  settings.soundEnabled
                }
                onChange={(checked) =>
                  updateSettings({
                    soundEnabled: checked,
                  })
                }
                label="Enable sound"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <SelectField
                label="Spin sound"
                value={settings.spinSound}
                onChange={(value) =>
                  updateSettings({
                    spinSound: value,
                  })
                }
                options={[
                  {
                    value: "tick",
                    label: "Tick",
                  },
                  {
                    value: "click",
                    label: "Click",
                  },
                  {
                    value: "pop",
                    label: "Pop",
                  },
                  {
                    value: "none",
                    label: "None",
                  },
                ]}
              />

              <SelectField
                label="Winner sound"
                value={
                  settings.winnerSound
                }
                onChange={(value) =>
                  updateSettings({
                    winnerSound: value,
                  })
                }
                options={[
                  {
                    value: "success",
                    label: "Success",
                  },
                  {
                    value: "chime",
                    label: "Chime",
                  },
                  {
                    value: "applause",
                    label: "Applause",
                  },
                  {
                    value: "none",
                    label: "None",
                  },
                ]}
              />
            </div>

            <div>
              <label
                htmlFor="volume"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Volume
              </label>

              <div className="rounded-xl border border-slate-300 bg-white px-4 py-4">
                <input
                  id="volume"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={settings.volume}
                  onChange={(event) =>
                    updateSettings({
                      volume: Number(
                        event.target.value,
                      ),
                    })
                  }
                  className="w-full accent-slate-900"
                />

                <div className="mt-2 flex justify-between text-xs font-semibold text-slate-500">
                  <span>0%</span>
                  <span>
                    {settings.volume}%
                  </span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "confetti" ? (
          <div className="space-y-6">
            <div>
              <SectionTitle
                title="Confetti"
                description="Choose what happens when the wheel produces a winner."
              />

              <Toggle
                checked={
                  settings.confettiEnabled
                }
                onChange={(checked) =>
                  updateSettings({
                    confettiEnabled: checked,
                  })
                }
                label="Enable confetti"
              />
            </div>

            <div>
              <SectionTitle
                title="Celebration style"
              />

              <div className="grid gap-3 md:grid-cols-2">
                {CONFETTI_OPTIONS.map(
                  (option) => {
                    const selected =
                      settings.confettiStyle ===
                      option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          updateSettings({
                            confettiStyle:
                              option.value,
                          })
                        }
                        className={`rounded-xl border p-4 text-left transition ${
                          selected
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-900 hover:border-slate-400"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-bold">
                            {option.label}
                          </span>

                          <span
                            className={`h-4 w-4 rounded-full border-2 ${
                              selected
                                ? "border-white bg-white"
                                : "border-slate-300"
                            }`}
                          />
                        </div>

                        <p
                          className={`mt-2 text-xs leading-5 ${
                            selected
                              ? "text-slate-300"
                              : "text-slate-500"
                          }`}
                        >
                          {option.description}
                        </p>
                      </button>
                    );
                  },
                )}
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "theme" ? (
          <div className="space-y-6">
            <div>
              <SectionTitle
                title="Page Theme"
                description="Choose the accent and dark page background used around your wheel."
              />

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {THEME_OPTIONS.map(
                  (theme) => {
                    const selected =
                      settings.pageTheme ===
                      theme.value;

                    return (
                      <button
                        key={theme.value}
                        type="button"
                        onClick={() =>
                          updateSettings({
                            pageTheme:
                              theme.value,
                          })
                        }
                        className={`overflow-hidden rounded-xl border text-left transition ${
                          selected
                            ? "border-slate-950 ring-2 ring-slate-950 ring-offset-2"
                            : "border-slate-200 hover:border-slate-400"
                        }`}
                      >
                        <div
                          className={`h-16 ${theme.previewClass}`}
                        />

                        <div className="flex items-center justify-between gap-2 bg-white px-3 py-2.5">
                          <span className="text-xs font-bold text-slate-800">
                            {theme.label}
                          </span>

                          {selected ? (
                            <span className="text-xs font-bold text-slate-950">
                              ✓
                            </span>
                          ) : null}
                        </div>
                      </button>
                    );
                  },
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">
                Dark page background
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                The selected theme will be
                used to create a dark page
                background while keeping the
                wheel controls readable.
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}