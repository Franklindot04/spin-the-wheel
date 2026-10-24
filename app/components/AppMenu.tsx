"use client";

import { useId, useRef } from "react";
import type { RefObject } from "react";
import { flushSync } from "react-dom";
import { FEEDBACK_URL } from "../lib/feedback";
import { usePopover } from "../lib/use-popover";
import { useT } from "../lib/i18n/provider";

type AppMenuProps = {
  open: boolean;
  onToggle: () => void;
  /* restoreFocus is true when focus should go back to the menu button. */
  onClose: (restoreFocus: boolean) => void;
  buttonRef: RefObject<HTMLButtonElement | null>;
  onEditTitle: () => void;
  onEditDescription: () => void;
  onHowItWorks: () => void;
  onFaq: () => void;
  onSendFeedback: () => void;
  spinning: boolean;
  surfaceClass: string;
  borderClass: string;
  hoverClass: string;
  textColor: string;
};

export default function AppMenu({
  open,
  onToggle,
  onClose,
  buttonRef,
  onEditTitle,
  onEditDescription,
  onHowItWorks,
  onFaq,
  onSendFeedback,
  spinning,
  surfaceClass,
  borderClass,
  hoverClass,
  textColor,
}: AppMenuProps) {
  const t = useT();
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

  /*
   * The menu closes first, so an item that opens a browser
   * prompt or a dialog does not leave the menu showing.
   */
  function activate(action: () => void) {
    flushSync(() => {
      onClose(true);
    });

    action();
  }

  const itemClass = `flex min-h-11 w-full items-center gap-3 px-4 py-2 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-current disabled:cursor-not-allowed disabled:opacity-50 ${hoverClass}`;

  const spinTitle = spinning
    ? t("common.waitForSpin")
    : undefined;

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
        aria-label={t("menu.label")}
        aria-expanded={open}
        aria-controls={menuId}
        className={`flex h-11 w-11 items-center justify-center rounded-lg border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${surfaceClass} ${borderClass} ${hoverClass}`}
        style={{ color: textColor }}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M4 6h16" />
          <path d="M4 12h16" />
          <path d="M4 18h16" />
        </svg>
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          aria-label={t("menu.label")}
          className={`absolute right-0 top-full z-50 mt-1 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border py-1 shadow-xl ${surfaceClass} ${borderClass}`}
          style={{ color: textColor }}
        >
          <button
            type="button"
            data-menu-item=""
            onClick={() =>
              activate(onEditTitle)
            }
            disabled={spinning}
            title={spinTitle}
            className={itemClass}
          >
            {t("menu.editTitle")}
          </button>

          <button
            type="button"
            data-menu-item=""
            onClick={() =>
              activate(onEditDescription)
            }
            disabled={spinning}
            title={spinTitle}
            className={itemClass}
          >
            {t("menu.editDescription")}
          </button>

          <button
            type="button"
            data-menu-item=""
            onClick={() =>
              activate(onHowItWorks)
            }
            className={itemClass}
          >
            {t("menu.howItWorks")}
          </button>

          <button
            type="button"
            data-menu-item=""
            onClick={() => activate(onFaq)}
            className={itemClass}
          >
            {t("menu.faq")}
          </button>

          <div
            className={`my-1 border-t ${borderClass}`}
            aria-hidden="true"
          />

          <button
            type="button"
            data-menu-item=""
            onClick={() =>
              activate(onSendFeedback)
            }
            disabled={spinning}
            title={spinTitle}
            className={itemClass}
          >
            {t("menu.sendFeedback")}
          </button>

          <a
            href={FEEDBACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-menu-item=""
            aria-label={t("menu.reportOnGithubLabel")}
            onClick={() => onClose(true)}
            className={itemClass}
          >
            {t("menu.reportOnGithub")}
          </a>
        </div>
      )}
    </div>
  );
}
