"use client";

import { useEffect, useId, useRef } from "react";
import type { RefObject } from "react";
import { flushSync } from "react-dom";
import { FEEDBACK_URL } from "../lib/feedback";

type AppMenuProps = {
  open: boolean;
  onToggle: () => void;
  /* restoreFocus is true when focus should go back to the menu button. */
  onClose: (restoreFocus: boolean) => void;
  buttonRef: RefObject<HTMLButtonElement | null>;
  onEditTitle: () => void;
  onEditDescription: () => void;
  onDeleteWheel: () => void;
  onSendFeedback: () => void;
  spinning: boolean;
  canDeleteWheel: boolean;
  surfaceClass: string;
  borderClass: string;
  hoverClass: string;
  textColor: string;
  mutedColor: string;
};

/*
 * A touch that starts a page scroll ends in pointercancel, so a
 * touch only closes the menu when it is a tap: released outside
 * the menu, close to where it started. Mouse and pen close on
 * pointerdown. Same rule as the entry menu.
 */
const TAP_MOVE_LIMIT = 10;

const FIRST_ITEM =
  "[data-menu-item]:not(:disabled)";

export default function AppMenu({
  open,
  onToggle,
  onClose,
  buttonRef,
  onEditTitle,
  onEditDescription,
  onDeleteWheel,
  onSendFeedback,
  spinning,
  canDeleteWheel,
  surfaceClass,
  borderClass,
  hoverClass,
  textColor,
  mutedColor,
}: AppMenuProps) {
  const menuId = useId();
  const wrapperRef =
    useRef<HTMLDivElement>(null);
  const menuRef =
    useRef<HTMLDivElement>(null);

  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }

    menuRef.current
      ?.querySelector<HTMLElement>(
        FIRST_ITEM,
      )
      ?.focus();

    let touchStart: {
      id: number;
      x: number;
      y: number;
    } | null = null;

    function isOutside(
      event: PointerEvent,
    ) {
      return (
        wrapperRef.current !== null &&
        !wrapperRef.current.contains(
          event.target as Node,
        )
      );
    }

    function handlePointerDown(
      event: PointerEvent,
    ) {
      if (event.pointerType === "touch") {
        touchStart = isOutside(event)
          ? {
              id: event.pointerId,
              x: event.clientX,
              y: event.clientY,
            }
          : null;

        return;
      }

      if (isOutside(event)) {
        onCloseRef.current(false);
      }
    }

    function handlePointerUp(
      event: PointerEvent,
    ) {
      if (
        event.pointerType !== "touch" ||
        !touchStart ||
        touchStart.id !== event.pointerId
      ) {
        return;
      }

      const start = touchStart;

      touchStart = null;

      if (
        Math.hypot(
          event.clientX - start.x,
          event.clientY - start.y,
        ) < TAP_MOVE_LIMIT &&
        isOutside(event)
      ) {
        onCloseRef.current(false);
      }
    }

    function handlePointerCancel(
      event: PointerEvent,
    ) {
      if (touchStart?.id === event.pointerId) {
        touchStart = null;
      }
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current(true);
      }
    }

    document.addEventListener(
      "pointerdown",
      handlePointerDown,
    );
    document.addEventListener(
      "pointerup",
      handlePointerUp,
    );
    document.addEventListener(
      "pointercancel",
      handlePointerCancel,
    );
    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown,
      );
      document.removeEventListener(
        "pointerup",
        handlePointerUp,
      );
      document.removeEventListener(
        "pointercancel",
        handlePointerCancel,
      );
      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [open]);

  /*
   * The menu closes first, so an item that opens a browser
   * prompt does not leave the menu showing behind it.
   */
  function activate(action: () => void) {
    flushSync(() => {
      onClose(true);
    });

    action();
  }

  const itemClass = `flex min-h-11 w-full items-center gap-3 px-4 py-2 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-current disabled:cursor-not-allowed disabled:opacity-50 ${hoverClass}`;

  const deleteReason = spinning
    ? "Wait for the spin to finish."
    : !canDeleteWheel
      ? "Needs at least two wheels."
      : "";

  return (
    <div
      ref={wrapperRef}
      className="relative shrink-0"
      onBlur={(event) => {
        const next =
          event.relatedTarget as Node | null;

        if (
          open &&
          next &&
          !wrapperRef.current?.contains(next)
        ) {
          onClose(false);
        }
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={onToggle}
        aria-label="Menu"
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
          aria-label="Menu"
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
            title={
              spinning
                ? "Wait for the spin to finish."
                : undefined
            }
            className={itemClass}
          >
            Edit title
          </button>

          <button
            type="button"
            data-menu-item=""
            onClick={() =>
              activate(onEditDescription)
            }
            disabled={spinning}
            title={
              spinning
                ? "Wait for the spin to finish."
                : undefined
            }
            className={itemClass}
          >
            Edit description
          </button>

          <button
            type="button"
            data-menu-item=""
            onClick={() =>
              activate(onDeleteWheel)
            }
            disabled={
              spinning || !canDeleteWheel
            }
            title={deleteReason || undefined}
            className={`${itemClass} flex-col items-start gap-0`}
          >
            <span>Delete wheel</span>
            {deleteReason ? (
              <span
                className="text-xs font-normal"
                style={{ color: mutedColor }}
              >
                {deleteReason}
              </span>
            ) : null}
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
            title={
              spinning
                ? "Wait for the spin to finish."
                : undefined
            }
            className={itemClass}
          >
            Send feedback
          </button>

          <a
            href={FEEDBACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-menu-item=""
            aria-label="Report on GitHub (opens in a new tab)"
            onClick={() => onClose(true)}
            className={itemClass}
          >
            Report on GitHub
          </a>
        </div>
      )}
    </div>
  );
}
