/*
 * The address people receive from the share button.
 * It is the live site, not the current page, so a
 * preview build or a local run still shares the real
 * link. Change it here if the site moves.
 */
export const SHARE_URL =
  "https://spin-the-wheel-9js.pages.dev";

export const SHARE_TITLE = "Spin the Wheel";

/*
 * shared:    the share sheet took the link
 * cancelled: the person closed the share sheet
 * copied:    the link is on the clipboard
 * failed:    nothing worked
 */
export type ShareResult =
  | "shared"
  | "cancelled"
  | "copied"
  | "failed";

function copyWithTextarea(
  text: string,
): boolean {
  const previous =
    document.activeElement;

  const field =
    document.createElement("textarea");

  field.value = text;

  field.setAttribute("readonly", "");

  field.setAttribute("aria-hidden", "true");

  field.tabIndex = -1;

  // 16px stops iOS from zooming in on focus.
  field.style.cssText =
    "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px;pointer-events:none";

  document.body.appendChild(field);

  let copied = false;

  try {
    field.focus({ preventScroll: true });

    field.select();

    field.setSelectionRange(
      0,
      text.length,
    );

    copied =
      document.execCommand("copy");
  } catch {
    copied = false;
  }

  field.remove();

  // Put focus back where it was.
  if (previous instanceof HTMLElement) {
    previous.focus({
      preventScroll: true,
    });
  }

  return copied;
}

/*
 * Tries the clipboard first, which needs a secure
 * page, then the older copy command.
 */
export async function copyText(
  text: string,
): Promise<boolean> {
  if (
    window.isSecureContext &&
    typeof navigator.clipboard
      ?.writeText === "function"
  ) {
    try {
      await navigator.clipboard.writeText(
        text,
      );

      return true;
    } catch {
      // Fall through to the older way.
    }
  }

  return copyWithTextarea(text);
}

/*
 * Opens the share sheet where the browser has one and
 * copies the link where it does not, or where the
 * sheet fails. Closing the sheet is not a failure.
 */
export async function shareLink(): Promise<ShareResult> {
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({
        title: SHARE_TITLE,
        url: SHARE_URL,
      });

      return "shared";
    } catch (error) {
      if (
        (error as { name?: string } | null)
          ?.name === "AbortError"
      ) {
        return "cancelled";
      }
    }
  }

  return (await copyText(SHARE_URL))
    ? "copied"
    : "failed";
}
