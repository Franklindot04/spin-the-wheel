import { useEffect, useRef } from "react";
import type { RefObject } from "react";

type FocusTrapOptions = {
  /*
   * Where focus goes when the trap turns on. Without it, the
   * container takes focus (it needs tabIndex={-1}), unless focus
   * is already inside it.
   */
  initialFocus?: () => HTMLElement | null | undefined;

  /*
   * Where focus goes when the trap turns off. Read at that moment,
   * so it can pick whichever control is still on the page. Without
   * it, focus is left alone.
   */
  returnFocus?: () => HTMLElement | null | undefined;

  /* Wait one tick before returning focus, for a page that is drawn again first. */
  deferReturn?: boolean;
};

const FOCUSABLE =
  'a[href], button, input:not([type="hidden"]), select, textarea, summary, [tabindex], [contenteditable]';

const SKIPPED = '[hidden], [inert], [aria-hidden="true"]';

/*
 * The traps that are on, oldest first. Only the last one handles
 * Tab, so a dialog opened over another keeps focus to itself.
 */
const stack: object[] = [];

function isFocusable(
  element: HTMLElement,
  container: HTMLElement,
) {
  if (element.matches(":disabled")) {
    return false;
  }

  const tabIndex = element.getAttribute("tabindex");

  if (tabIndex !== null && Number(tabIndex) < 0) {
    return false;
  }

  if (
    element.getAttribute("contenteditable") ===
    "false"
  ) {
    return false;
  }

  // Hidden, inert or aria-hidden, on the element or inside the container.
  for (
    let node: HTMLElement | null = element;
    node && node !== container;
    node = node.parentElement
  ) {
    if (node.matches(SKIPPED)) {
      return false;
    }
  }

  return typeof element.checkVisibility ===
    "function"
    ? element.checkVisibility({
        visibilityProperty: true,
      })
    : element.getClientRects().length > 0;
}

function getFocusable(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      FOCUSABLE,
    ),
  ).filter((element) =>
    isFocusable(element, container),
  );
}

/*
 * Keeps Tab and Shift+Tab inside a dialog while active is true.
 * Tab on the last control, or from outside the container, goes to
 * the first. Shift+Tab on the first control, on the container or
 * from outside goes to the last. With nothing to focus, Tab stays
 * where it is and the container takes focus.
 *
 * Only the Tab keys. It does not close on Escape (the dialog or
 * use-popover does that), does not lock page scroll, and does not
 * set role, aria-modal, inert or aria-hidden on anything. The
 * winner box's outside-tap rule looks for
 * [role="dialog"][aria-modal="true"] in the markup, so the dialog
 * keeps those attributes itself.
 */
export function useFocusTrap(
  active: boolean,
  containerRef: RefObject<HTMLElement | null>,
  options: FocusTrapOptions = {},
) {
  const initialFocusRef = useRef(
    options.initialFocus,
  );
  const returnFocusRef = useRef(
    options.returnFocus,
  );
  const deferReturnRef = useRef(
    options.deferReturn,
  );

  useEffect(() => {
    initialFocusRef.current =
      options.initialFocus;
    returnFocusRef.current =
      options.returnFocus;
    deferReturnRef.current =
      options.deferReturn;
  });

  useEffect(() => {
    if (!active) {
      return;
    }

    const token = {};

    stack.push(token);

    const container = containerRef.current;

    if (container) {
      const initial =
        initialFocusRef.current?.();

      if (initial) {
        initial.focus();
      } else if (
        !container.contains(
          document.activeElement,
        )
      ) {
        container.focus();
      }
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      const panel = containerRef.current;

      if (
        event.key !== "Tab" ||
        !panel ||
        stack[stack.length - 1] !== token
      ) {
        return;
      }

      const focusable = getFocusable(panel);

      if (focusable.length === 0) {
        event.preventDefault();
        panel.focus();

        return;
      }

      const first = focusable[0];
      const last =
        focusable[focusable.length - 1];
      const current = document.activeElement;
      const outside = !panel.contains(current);

      if (
        event.shiftKey &&
        (current === first ||
          current === panel ||
          outside)
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (current === last || outside)
      ) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );

      stack.splice(stack.indexOf(token), 1);

      const giveBack = () =>
        returnFocusRef.current?.()?.focus();

      if (deferReturnRef.current) {
        window.setTimeout(giveBack, 0);
      } else {
        giveBack();
      }
    };
  }, [active, containerRef]);
}
