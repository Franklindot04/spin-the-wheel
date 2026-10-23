"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { AppearanceThemeConfig } from "../lib/wheel-types";
import type { FaqItem } from "../lib/faq";
import { usePopover } from "../lib/use-popover";

type FaqDialogProps = {
  theme: AppearanceThemeConfig;
  accentClass: string;
  accentHoverClass: string;
  title: string;
  closeLabel: string;
  feedbackLabel: string;
  items: FaqItem[];
  /* Called by an item with the feedback action. */
  onFeedback: () => void;
  /* The form cannot open while a spin runs, as in the app menu. */
  feedbackDisabled?: boolean;
  onClose: () => void;
};

/*
 * Short questions that open to show their answers. Several can be
 * open at once. Escape and a tap outside close it (a touch that
 * scrolls does not), Tab stays inside it, and the page behind does
 * not scroll. The text comes in as data, so it can be translated.
 */
export default function FaqDialog({
  theme,
  accentClass,
  accentHoverClass,
  title,
  closeLabel,
  feedbackLabel,
  items,
  onFeedback,
  feedbackDisabled = false,
  onClose,
}: FaqDialogProps) {
  const titleId = useId();
  const idPrefix = useId();
  const panelRef =
    useRef<HTMLDivElement>(null);

  const [openIds, setOpenIds] = useState<
    string[]
  >([]);

  usePopover(
    true,
    () => onClose(),
    panelRef,
    () =>
      panelRef.current?.querySelector<HTMLElement>(
        "button[aria-expanded]",
      ),
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

  function toggle(id: string) {
    setOpenIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  /* Answers that are closed are hidden, so their buttons are skipped. */
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
    ).filter(
      (element) =>
        element.getClientRects().length > 0,
    );

    if (focusable.length === 0) {
      return;
    }

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

  const ringClass =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-current";

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-slate-950/60 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] sm:items-center sm:p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={handleKeyDown}
        className={`flex max-h-[calc(100dvh-max(1rem,env(safe-area-inset-top))-1rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl shadow-2xl sm:max-h-[90dvh] ${theme.surfaceClass}`}
      >
        <h2
          id={titleId}
          className={`px-5 pb-3 pt-5 text-lg font-semibold sm:px-6 sm:pt-6 ${theme.textPrimaryClass}`}
        >
          {title}
        </h2>

        <div
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain border-t ${theme.borderClass}`}
        >
          {items.map((item) => {
            const open = openIds.includes(
              item.id,
            );
            const buttonId = `${idPrefix}-q-${item.id}`;
            const panelId = `${idPrefix}-a-${item.id}`;

            return (
              <div
                key={item.id}
                className={`border-b last:border-b-0 ${theme.borderClass}`}
              >
                <h3>
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() =>
                      toggle(item.id)
                    }
                    className={`flex min-h-11 w-full items-center justify-between gap-3 px-5 py-3 text-left text-sm font-semibold transition sm:px-6 ${theme.textPrimaryClass} ${theme.controlHoverClass} ${ringClass}`}
                  >
                    <span className="min-w-0 break-words">
                      {item.question}
                    </span>

                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      className={`h-4 w-4 shrink-0 transition-transform motion-reduce:transition-none ${
                        open ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                </h3>

                <div
                  id={panelId}
                  hidden={!open}
                  className="px-5 pb-4 sm:px-6"
                >
                  <p
                    className={`break-words text-sm leading-6 ${theme.textSecondaryClass}`}
                  >
                    {item.answer}
                  </p>

                  {item.action === "feedback" ? (
                    <button
                      type="button"
                      onClick={onFeedback}
                      disabled={feedbackDisabled}
                      title={
                        feedbackDisabled
                          ? "Wait for the spin to finish."
                          : undefined
                      }
                      className={`mt-3 min-h-11 rounded-lg border px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${theme.borderClass} ${theme.textPrimaryClass} ${theme.controlHoverClass}`}
                    >
                      {feedbackLabel}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        <div
          className={`border-t px-5 py-4 sm:px-6 ${theme.borderClass}`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`h-11 w-full rounded-lg px-4 text-sm font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${accentClass} ${accentHoverClass}`}
          >
            {closeLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
