"use client";

import type { ReactNode, RefObject } from "react";
import type { AppearanceThemeConfig } from "../lib/wheel-types";

type MobileToolbarProps = {
  theme: AppearanceThemeConfig;
  accentClass: string;
  spinning: boolean;
  historyOpen: boolean;
  historyCount: number;
  onShowEntries: () => void;
  onShowHistory: () => void;
  allEntriesHidden: boolean;
  hideAllDisabled: boolean;
  onToggleAllEntriesHidden: () => void;
  importDisabled: boolean;
  importTitle: string;
  onImport: () => void;
  onExport: () => void;
  wheels: { id: string; name: string }[];
  activeWheelId: string;
  onSwitchWheel: (id: string) => void;
  onAddWheel: () => void;
  onRename: () => void;
  onShare: () => void;
  onOpenSettings: () => void;
  settingsButtonRef: RefObject<HTMLButtonElement | null>;
};

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/*
 * The phone toolbar under the wheel. The wide layout keeps its
 * controls in the header and in the side column (page.tsx).
 */
export default function MobileToolbar({
  theme,
  accentClass,
  spinning,
  historyOpen,
  historyCount,
  onShowEntries,
  onShowHistory,
  allEntriesHidden,
  hideAllDisabled,
  onToggleAllEntriesHidden,
  importDisabled,
  importTitle,
  onImport,
  onExport,
  wheels,
  activeWheelId,
  onSwitchWheel,
  onAddWheel,
  onRename,
  onShare,
  onOpenSettings,
  settingsButtonRef,
}: MobileToolbarProps) {
  const focusClass =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

  const idleClass = `${theme.subtleSurfaceClass} ${theme.borderClass} ${theme.textPrimaryClass} not-disabled:hover:brightness-125`;

  const baseClass = `h-11 rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-40 ${focusClass}`;

  const iconClass = `flex w-11 shrink-0 items-center justify-center ${baseClass} ${idleClass}`;

  const textClass = (selected: boolean) =>
    `min-w-0 flex-1 px-2 text-xs font-semibold ${baseClass} ${
      selected
        ? `${accentClass} border-transparent text-white shadow-sm ring-2 ring-inset ring-white/70`
        : idleClass
    }`;

  const historyLabel = `Show history, ${historyCount} ${
    historyCount === 1 ? "spin" : "spins"
  }`;

  return (
    <div className="mx-auto mt-4 max-w-lg space-y-2 md:hidden max-[359px]:-mx-3">
      <div className="flex gap-1 min-[414px]:gap-2">
        <button
          type="button"
          onClick={onShowEntries}
          aria-pressed={!historyOpen}
          aria-label="Show entries"
          className={textClass(!historyOpen)}
        >
          Entries
        </button>

        <button
          type="button"
          onClick={onShowHistory}
          aria-pressed={historyOpen}
          aria-label={historyLabel}
          className={textClass(historyOpen)}
        >
          History
        </button>

        <button
          type="button"
          onClick={onToggleAllEntriesHidden}
          disabled={hideAllDisabled}
          aria-label={
            allEntriesHidden
              ? "Show all entries"
              : "Hide all entries"
          }
          className={iconClass}
        >
          <Icon>
            {allEntriesHidden ? (
              <>
                <path d="M3 3l18 18" />
                <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                <path d="M9.9 5.1A10.8 10.8 0 0 1 12 4.8c6 0 9.5 7.2 9.5 7.2a17.4 17.4 0 0 1-3.2 3.8" />
                <path d="M6.2 6.2A17.6 17.6 0 0 0 2.5 12S6 19.2 12 19.2a10.8 10.8 0 0 0 4.1-.8" />
              </>
            ) : (
              <>
                <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                <circle cx="12" cy="12" r="2.5" />
              </>
            )}
          </Icon>
        </button>

        <button
          type="button"
          onClick={onImport}
          disabled={importDisabled}
          aria-label="Import data"
          title={importTitle}
          className={iconClass}
        >
          <Icon>
            <path d="M12 21V9" />
            <path d="m7 14 5-5 5 5" />
            <path d="M5 3h14" />
          </Icon>
        </button>

        <button
          type="button"
          onClick={onExport}
          disabled={spinning}
          aria-label="Export data"
          className={iconClass}
        >
          <Icon>
            <path d="M12 3v12" />
            <path d="m7 10 5 5 5-5" />
            <path d="M5 21h14" />
          </Icon>
        </button>
      </div>

      <div className="flex flex-wrap gap-1 min-[414px]:gap-2">
        <select
          value={activeWheelId}
          onChange={(event) =>
            onSwitchWheel(event.target.value)
          }
          disabled={spinning}
          aria-label="Select wheel"
          className={`min-w-0 px-2 text-sm font-medium max-[374px]:basis-full min-[375px]:flex-1 ${baseClass} ${idleClass}`}
        >
          {wheels.map((wheel) => (
            <option key={wheel.id} value={wheel.id}>
              {wheel.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onAddWheel}
          disabled={spinning}
          className={`shrink-0 px-2 text-sm font-semibold max-[374px]:flex-1 ${baseClass} ${idleClass}`}
        >
          + Wheel
        </button>

        <button
          type="button"
          onClick={onRename}
          disabled={spinning}
          aria-label="Rename wheel"
          className={`${iconClass} max-[374px]:flex-1`}
        >
          <Icon>
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L8 18l-4 1 1-4Z" />
          </Icon>
        </button>

        <button
          type="button"
          onClick={onShare}
          aria-label="Share Spin the Wheel"
          className={`${iconClass} max-[374px]:flex-1`}
        >
          <Icon>
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <path d="M8.6 13.5l6.8 4" />
            <path d="M15.4 6.5l-6.8 4" />
          </Icon>
        </button>

        <button
          ref={settingsButtonRef}
          type="button"
          onClick={onOpenSettings}
          disabled={spinning}
          aria-label="Settings"
          className={`${iconClass} max-[374px]:flex-1`}
        >
          <Icon>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </Icon>
        </button>
      </div>
    </div>
  );
}
