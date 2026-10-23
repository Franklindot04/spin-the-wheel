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
  menuOpen: boolean;
  onMenuToggle: () => void;
  onMenuClose: (restoreFocus: boolean) => void;
  menuButtonRef: RefObject<HTMLButtonElement | null>;
  onEditTitle: () => void;
  onEditDescription: () => void;
  onHowItWorks: () => void;
  onFaq: () => void;
  onSendFeedback: () => void;
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
  menuOpen,
  onMenuToggle,
  onMenuClose,
  menuButtonRef,
  onEditTitle,
  onEditDescription,
  onHowItWorks,
  onFaq,
  onSendFeedback,
}: MobileTopBarProps) {
  const modeClass = (value: Mode) =>
    `min-h-11 rounded-lg px-3 py-2 text-sm font-medium transition ${
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
          className={`flex shrink-0 rounded-xl border p-0.5 shadow-sm ${theme.borderClass} ${theme.surfaceClass}`}
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
          onHowItWorks={onHowItWorks}
          onFaq={onFaq}
          onSendFeedback={onSendFeedback}
          spinning={spinning}
          surfaceClass={headerSurfaceClass}
          borderClass={headerBorderClass}
          hoverClass={headerHoverClass}
          textColor={headerTextColor}
        />
      </div>
    </div>
  );
}
