"use client";

import { useEffect, useId, useRef } from "react";
import type { KeyboardEvent } from "react";
import type { AppearanceThemeConfig } from "../lib/wheel-types";
import { usePopover } from "../lib/use-popover";

type ConfirmDialogProps = {
  theme: AppearanceThemeConfig;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
};

/*
 * A yes or no question for something that cannot be undone. It
 * replaces the browser confirm, which some phone browsers switch
 * off after "Suppress dialogs". Cancel has the focus when it opens,
 * so Enter does not delete by accident.
 */
export default function ConfirmDialog({
  theme,
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const titleId = useId();
  const messageId = useId();
  const panelRef =
    useRef<HTMLDivElement>(null);
  const cancelRef =
    useRef<HTMLButtonElement>(null);

  usePopover(
    true,
    () => onClose(),
    panelRef,
    () => cancelRef.current,
  );

  useEffect(() => {
    const previousBodyOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow =
        previousBodyOverflow;
    };
  }, []);

  function handleKeyDown(
    event: KeyboardEvent<HTMLDivElement>,
  ) {
    if (event.key !== "Tab") {
      return;
    }

    const panel = panelRef.current;

    if (!panel) {
      return;
    }

    const focusable = Array.from(
      panel.querySelectorAll<HTMLElement>(
        "button:not([disabled])",
      ),
    );

    const first = focusable[0];
    const last =
      focusable[focusable.length - 1];

    const active = document.activeElement;

    if (
      event.shiftKey &&
      (active === first ||
        !panel.contains(active))
    ) {
      event.preventDefault();
      last.focus();
    } else if (
      !event.shiftKey &&
      (active === last ||
        !panel.contains(active))
    ) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        onKeyDown={handleKeyDown}
        className={`max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl p-5 shadow-2xl sm:p-6 ${theme.surfaceClass}`}
      >
        <h2
          id={titleId}
          className={`text-lg font-semibold ${theme.textPrimaryClass}`}
        >
          {title}
        </h2>

        <p
          id={messageId}
          className={`mt-2 break-words text-sm leading-6 ${theme.textSecondaryClass}`}
        >
          {message}
        </p>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className="h-11 flex-1 rounded-lg bg-red-700 px-4 text-sm font-semibold text-white transition hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          >
            {confirmLabel}
          </button>

          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            className={`h-11 rounded-lg border px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${theme.borderClass} ${theme.textSecondaryClass} ${theme.controlHoverClass}`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
