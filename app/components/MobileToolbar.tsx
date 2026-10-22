"use client";

import { useId, useRef } from "react";
import type { ReactNode, RefObject } from "react";
import { flushSync } from "react-dom";
import type { AppearanceThemeConfig } from "../lib/wheel-types";
import { usePopover } from "../lib/use-popover";

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
  onShare: () => void;
  onOpenSettings: () => void;
  moreOpen: boolean;
  onMoreToggle: () => void;
  /* restoreFocus is true when focus should go back to the More button. */
  onMoreClose: (restoreFocus: boolean) => void;
  moreButtonRef: RefObject<HTMLButtonElement | null>;
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
  onShare,
  onOpenSettings,
  moreOpen,
  onMoreToggle,
  onMoreClose,
  moreButtonRef,
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
    <div className="mx-auto mt-4 max-w-lg md:hidden max-[359px]:-mx-3">
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
          ref={settingsButtonRef}
          type="button"
          onClick={onOpenSettings}
          disabled={spinning}
          aria-label="Settings"
          className={iconClass}
        >
          <Icon>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </Icon>
        </button>

        <MoreMenu
          theme={theme}
          open={moreOpen}
          onToggle={onMoreToggle}
          onClose={onMoreClose}
          buttonRef={moreButtonRef}
          iconClass={iconClass}
          importDisabled={importDisabled}
          importTitle={importTitle}
          onImport={onImport}
          exportDisabled={spinning}
          onExport={onExport}
          onShare={onShare}
        />
      </div>
    </div>
  );
}

type MoreMenuProps = {
  theme: AppearanceThemeConfig;
  open: boolean;
  onToggle: () => void;
  onClose: (restoreFocus: boolean) => void;
  buttonRef: RefObject<HTMLButtonElement | null>;
  iconClass: string;
  importDisabled: boolean;
  importTitle: string;
  onImport: () => void;
  exportDisabled: boolean;
  onExport: () => void;
  onShare: () => void;
};

/*
 * Import, Export and Share, behind a three-dot button. The popover
 * opens upward because the toolbar sits low on the screen.
 */
function MoreMenu({
  theme,
  open,
  onToggle,
  onClose,
  buttonRef,
  iconClass,
  importDisabled,
  importTitle,
  onImport,
  exportDisabled,
  onExport,
  onShare,
}: MoreMenuProps) {
  const menuId = useId();
  const wrapperRef =
    useRef<HTMLDivElement>(null);
  const menuRef =
    useRef<HTMLDivElement>(null);

  const handleBlur = usePopover(
    open,
    onClose,
    wrapperRef,
    () =>
      menuRef.current?.querySelector<HTMLElement>(
        "[data-menu-item]:not(:disabled)",
      ),
  );

  /* The popover closes first, then the action runs. */
  function activate(action: () => void) {
    flushSync(() => {
      onClose(true);
    });

    action();
  }

  const itemClass = `flex min-h-11 w-full items-center gap-3 px-4 py-2 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-current disabled:cursor-not-allowed disabled:opacity-50 ${theme.controlHoverClass}`;

  return (
    <div
      ref={wrapperRef}
      className="relative shrink-0"
      onBlur={handleBlur}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={onToggle}
        aria-label="More actions"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
        className={iconClass}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          aria-label="More actions"
          className={`absolute bottom-full right-0 z-50 mb-1 w-48 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border py-1 shadow-xl ${theme.surfaceClass} ${theme.borderClass} ${theme.textPrimaryClass}`}
        >
          <button
            type="button"
            data-menu-item=""
            onClick={() => activate(onImport)}
            disabled={importDisabled}
            title={importTitle}
            className={itemClass}
          >
            <Icon>
              <path d="M12 21V9" />
              <path d="m7 14 5-5 5 5" />
              <path d="M5 3h14" />
            </Icon>
            Import
          </button>

          <button
            type="button"
            data-menu-item=""
            onClick={() => activate(onExport)}
            disabled={exportDisabled}
            className={itemClass}
          >
            <Icon>
              <path d="M12 3v12" />
              <path d="m7 10 5 5 5-5" />
              <path d="M5 21h14" />
            </Icon>
            Export
          </button>

          <button
            type="button"
            data-menu-item=""
            onClick={() => activate(onShare)}
            className={itemClass}
          >
            <Icon>
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <path d="M8.6 13.5l6.8 4" />
              <path d="M15.4 6.5l-6.8 4" />
            </Icon>
            Share
          </button>
        </div>
      )}
    </div>
  );
}
