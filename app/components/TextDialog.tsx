"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent, RefObject } from "react";
import type { AppearanceThemeConfig } from "../lib/wheel-types";
import { useFocusTrap } from "../lib/use-focus-trap";
import { usePopover } from "../lib/use-popover";

/*
 * A name and an id that do not look like a contact field, so that
 * Safari does not offer AutoFill Contact for it.
 */
const FIELD_ID = "wheel-label-field";

type TextDialogProps = {
  theme: AppearanceThemeConfig;
  accentClass: string;
  accentHoverClass: string;
  title: string;
  label: string;
  initialValue: string;
  /* A text area for longer text. Enter still submits. */
  multiline?: boolean;
  hint?: string;
  submitLabel?: string;
  /* Gets the trimmed text. Returns a message to show, or null. */
  validate?: (text: string) => string | null;
  onSubmit: (text: string) => void;
  onClose: () => void;
};

/*
 * One small dialog for changing a piece of text (wheel name, title,
 * description). It replaces the browser prompt, which some phone
 * browsers switch off after "Suppress dialogs".
 *
 * Escape and a tap outside close it (a touch that scrolls does not),
 * Tab stays inside it, the page behind does not scroll, and focus
 * starts in the field with the text selected.
 */
export default function TextDialog({
  theme,
  accentClass,
  accentHoverClass,
  title,
  label,
  initialValue,
  multiline = false,
  hint,
  submitLabel = "OK",
  validate,
  onSubmit,
  onClose,
}: TextDialogProps) {
  const titleId = useId();
  const messageId = useId();
  const panelRef =
    useRef<HTMLDivElement>(null);
  const fieldRef = useRef<
    HTMLInputElement | HTMLTextAreaElement
  >(null);

  const [value, setValue] =
    useState(initialValue);
  const [error, setError] = useState("");

  usePopover(
    true,
    () => onClose(),
    panelRef,
    () => {
      const field = fieldRef.current;

      field?.select();

      return field;
    },
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

  /*
   * A prompt held one line. New lines, typed or pasted, become
   * spaces, so what is saved has the same shape as before.
   */
  function submit() {
    const text = value
      .replace(/\s*[\r\n]+\s*/g, " ")
      .trim();

    const problem = validate
      ? validate(text)
      : null;

    if (problem) {
      setError(problem);
      fieldRef.current?.focus();

      return;
    }

    onSubmit(text);
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    submit();
  }

  const fieldClass = `block w-full rounded-lg border px-3 py-2.5 text-base outline-none transition ${theme.inputClass} ${
    error ? "border-red-400" : ""
  }`;

  const describedBy =
    [hint ? `${messageId}-hint` : "", messageId]
      .filter(Boolean)
      .join(" ");

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-slate-950/60 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] sm:items-center sm:p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`max-h-[calc(100dvh-max(1rem,env(safe-area-inset-top))-1rem)] w-full max-w-md overflow-y-auto sm:max-h-[90dvh] rounded-2xl p-5 shadow-2xl sm:p-6 ${theme.surfaceClass}`}
      >
        <form noValidate onSubmit={handleSubmit}>
          <h2
            id={titleId}
            className={`text-lg font-semibold ${theme.textPrimaryClass}`}
          >
            {title}
          </h2>

          <label
            htmlFor={FIELD_ID}
            className={`mt-4 block text-sm font-medium ${theme.textSecondaryClass}`}
          >
            {label}
          </label>

          {multiline ? (
            <textarea
              id={FIELD_ID}
              name={FIELD_ID}
              autoComplete="off"
              autoCorrect="off"
              ref={
                fieldRef as RefObject<HTMLTextAreaElement>
              }
              value={value}
              rows={4}
              onChange={(event) => {
                setValue(event.target.value);
                setError("");
              }}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  submit();
                }
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy}
              className={`mt-1 resize-y ${fieldClass}`}
            />
          ) : (
            <input
              id={FIELD_ID}
              name={FIELD_ID}
              ref={
                fieldRef as RefObject<HTMLInputElement>
              }
              type="text"
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                setError("");
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy}
              autoComplete="off"
              autoCorrect="off"
              className={`mt-1 ${fieldClass}`}
            />
          )}

          {hint ? (
            <p
              id={`${messageId}-hint`}
              className={`mt-2 text-xs leading-5 ${theme.textMutedClass}`}
            >
              {hint}
            </p>
          ) : null}

          <p
            id={messageId}
            aria-live="polite"
            className={`text-sm font-medium text-red-300 ${
              error ? "mt-2" : ""
            }`}
          >
            {error}
          </p>

          <div className="mt-5 flex gap-3">
            <button
              type="submit"
              className={`h-11 flex-1 rounded-lg px-4 text-sm font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${accentClass} ${accentHoverClass}`}
            >
              {submitLabel}
            </button>

            <button
              type="button"
              onClick={onClose}
              className={`h-11 rounded-lg border px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${theme.borderClass} ${theme.textSecondaryClass} ${theme.controlHoverClass}`}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
