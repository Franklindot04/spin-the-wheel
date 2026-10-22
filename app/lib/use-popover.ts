import { useCallback, useEffect, useRef } from "react";
import type { FocusEvent, RefObject } from "react";

/*
 * A touch that starts a page scroll ends in pointercancel, so a
 * touch only closes a popover when it is a tap: released outside
 * it, close to where it started. Mouse and pen close on
 * pointerdown. Same rule as the entry menu.
 */
const TAP_MOVE_LIMIT = 10;

/*
 * Shared behaviour of the small popovers on phones (app menu,
 * wheel chip, More). While open: focus goes to the element that
 * initialFocus returns, Escape closes (focus back on the button),
 * and a tap or click outside closes (focus stays where it went).
 * wrapperRef holds the button and the popover together, so a click
 * on the button is not an outside click. The returned onBlur closes
 * the popover when focus leaves the wrapper.
 */
export function usePopover(
  open: boolean,
  onClose: (restoreFocus: boolean) => void,
  wrapperRef: RefObject<HTMLElement | null>,
  initialFocus: () => HTMLElement | null | undefined,
) {
  const onCloseRef = useRef(onClose);
  const initialFocusRef = useRef(initialFocus);

  useEffect(() => {
    onCloseRef.current = onClose;
    initialFocusRef.current = initialFocus;
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    initialFocusRef.current()?.focus();

    let touchStart: {
      id: number;
      x: number;
      y: number;
    } | null = null;

    function isOutside(event: PointerEvent) {
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
  }, [open, wrapperRef]);

  return useCallback(
    (event: FocusEvent<HTMLElement>) => {
      const next =
        event.relatedTarget as Node | null;

      if (
        open &&
        next &&
        !wrapperRef.current?.contains(next)
      ) {
        onCloseRef.current(false);
      }
    },
    [open, wrapperRef],
  );
}
