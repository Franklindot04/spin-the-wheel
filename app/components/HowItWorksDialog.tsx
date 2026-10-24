"use client";

import { useEffect, useRef } from "react";
import type { AppearanceThemeConfig } from "../lib/wheel-types";
import { useFocusTrap } from "../lib/use-focus-trap";
import { usePopover } from "../lib/use-popover";
import { useT } from "../lib/i18n/provider";

type HowItWorksDialogProps = {
  theme: AppearanceThemeConfig;
  accentClass: string;
  accentHoverClass: string;
  text: string;
  onClose: () => void;
};

/*
 * The Standard Mode instructions in a small dialog, for phones where
 * the card under the toolbar is hidden. Escape and a tap outside close
 * it, Tab stays inside it, and the page behind does not scroll.
 */
export default function HowItWorksDialog({
  theme,
  accentClass,
  accentHoverClass,
  text,
  onClose,
}: HowItWorksDialogProps) {
  const t = useT();

  const panelRef =
    useRef<HTMLDivElement>(null);
  const closeRef =
    useRef<HTMLButtonElement>(null);

  usePopover(
    true,
    () => onClose(),
    panelRef,
    () => closeRef.current,
  );

  useFocusTrap(true, panelRef);

  useEffect(() => {
    const previousBodyOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow =
        previousBodyOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="how-it-works-title"
        className={`max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl p-6 shadow-2xl ${theme.surfaceClass}`}
      >
        <h2
          id="how-it-works-title"
          className={`text-lg font-semibold ${theme.textPrimaryClass}`}
        >
          {t("howItWorks.title")}
        </h2>

        <p
          className={`mt-2 text-sm leading-6 ${theme.textSecondaryClass}`}
        >
          {text}
        </p>

        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className={`mt-5 h-11 w-full rounded-lg px-4 text-sm font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${accentClass} ${accentHoverClass}`}
        >
          {t("howItWorks.close")}
        </button>
      </div>
    </div>
  );
}
