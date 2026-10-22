"use client";

import type { RefObject } from "react";
import type { AppearanceThemeConfig, Mode } from "../lib/wheel-types";
import AppMenu from "./AppMenu";

type MobileTopBarProps = {
  title: string;
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  spinning: boolean;
  theme: AppearanceThemeConfig;
  accentClass: string;
  headerSurfaceClass: string;
  headerBorderClass: string;
  headerHoverClass: string;
  headerTextColor: string;
  headerMutedColor: string;
  menuOpen: boolean;
  onMenuToggle: () => void;
  onMenuClose: (restoreFocus: boolean) => void;
  menuButtonRef: RefObject<HTMLButtonElement | null>;
  onEditTitle: () => void;
  onEditDescription: () => void;
  onDeleteWheel: () => void;
  onSendFeedback: () => void;
  canDeleteWheel: boolean;
};

/*
 * The top bar for screens narrower than md. The wide header
 * (page.tsx) keeps its place from md up.
 */
export default function MobileTopBar({
  title,
  mode,
  onModeChange,
  spinning,
  theme,
  accentClass,
  headerSurfaceClass,
  headerBorderClass,
  headerHoverClass,
  headerTextColor,
  headerMutedColor,
  menuOpen,
  onMenuToggle,
  onMenuClose,
  menuButtonRef,
  onEditTitle,
  onEditDescription,
  onDeleteWheel,
  onSendFeedback,
  canDeleteWheel,
}: MobileTopBarProps) {
  const modeClass = (value: Mode) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      mode === value
        ? `${accentClass} text-white`
        : `${theme.textSecondaryClass} ${theme.controlHoverClass}`
    } disabled:cursor-not-allowed disabled:opacity-50`;

  return (
    <div
      className={`border-b md:hidden ${headerBorderClass} ${headerSurfaceClass}`}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 sm:px-6">
        <h1
          className="min-w-0 flex-1 truncate text-base font-extrabold tracking-tight"
          style={{ color: headerTextColor }}
        >
          {title}
        </h1>

        <div
          className={`flex shrink-0 rounded-xl border p-1 shadow-sm ${theme.borderClass} ${theme.surfaceClass}`}
        >
          <button
            type="button"
            onClick={() =>
              onModeChange("standard")
            }
            disabled={spinning}
            className={modeClass("standard")}
          >
            Standard
          </button>
          <button
            type="button"
            onClick={() =>
              onModeChange("quiz")
            }
            disabled={spinning}
            className={modeClass("quiz")}
          >
            Quiz
          </button>
        </div>

        <AppMenu
          open={menuOpen}
          onToggle={onMenuToggle}
          onClose={onMenuClose}
          buttonRef={menuButtonRef}
          onEditTitle={onEditTitle}
          onEditDescription={onEditDescription}
          onDeleteWheel={onDeleteWheel}
          onSendFeedback={onSendFeedback}
          spinning={spinning}
          canDeleteWheel={canDeleteWheel}
          surfaceClass={headerSurfaceClass}
          borderClass={headerBorderClass}
          hoverClass={headerHoverClass}
          textColor={headerTextColor}
          mutedColor={headerMutedColor}
        />
      </div>
    </div>
  );
}
