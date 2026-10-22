"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { APP_VERSION } from "../lib/app-version";
import { FEEDBACK_URL } from "../lib/feedback";
import {
  EMPTY_FEEDBACK_DRAFT,
  FEEDBACK_LIMITS,
  sendFeedbackStub,
  type FeedbackDraft,
} from "../lib/feedback-client";
import type { AppearanceThemeConfig } from "../lib/wheel-types";

type FeedbackDialogProps = {
  theme: AppearanceThemeConfig;
  accentClass: string;
  accentHoverClass: string;
  /* The text typed so far. Kept by the page, in memory only. */
  draft: FeedbackDraft;
  onDraftChange: (draft: FeedbackDraft) => void;
  onClose: () => void;
  /* The element that gets focus after the dialog closes. */
  getReturnFocus: () => HTMLElement | null;
};

type Status = "idle" | "sending" | "success" | "error";

type FieldErrors = {
  happened?: string;
  email?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([tabindex="-1"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type FieldProps = {
  id: string;
  label: string;
  tag?: string;
  value: string;
  max: number;
  rows?: number;
  hint?: string;
  error?: string;
  placeholder?: string;
  readOnly: boolean;
  inputClass: string;
  labelClass: string;
  mutedClass: string;
  onChange: (value: string) => void;
  email?: boolean;
  required?: boolean;
};

function Field({
  id,
  label,
  tag,
  value,
  max,
  rows,
  hint,
  error,
  placeholder,
  readOnly,
  inputClass,
  labelClass,
  mutedClass,
  onChange,
  email,
  required,
}: FieldProps) {
  const showCounter =
    value.length >= Math.ceil(max * 0.8);

  const describedBy =
    [
      error ? `${id}-error` : "",
      hint ? `${id}-hint` : "",
      showCounter ? `${id}-count` : "",
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  // 16px keeps iOS from zooming in on focus.
  const shared = {
    id,
    value,
    placeholder,
    readOnly,
    maxLength: max,
    required,
    "aria-required": required || undefined,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    className: `w-full rounded-xl border px-3 py-2.5 text-base outline-none transition aria-invalid:border-red-400 ${inputClass}`,
  };

  return (
    <div>
      <label
        htmlFor={id}
        className={`mb-1.5 flex items-baseline justify-between gap-3 text-sm font-semibold ${labelClass}`}
      >
        <span>{label}</span>

        {tag ? (
          <span
            className={`text-xs font-normal ${mutedClass}`}
          >
            {tag}
          </span>
        ) : null}
      </label>

      {rows ? (
        <textarea
          {...shared}
          rows={rows}
          autoComplete="off"
          className={`${shared.className} resize-y`}
          onChange={(event) =>
            onChange(event.target.value)
          }
        />
      ) : (
        <input
          {...shared}
          type={email ? "email" : "text"}
          inputMode={email ? "email" : undefined}
          autoComplete={email ? "email" : "off"}
          autoCapitalize={email ? "none" : undefined}
          spellCheck={email ? false : undefined}
          onChange={(event) =>
            onChange(event.target.value)
          }
        />
      )}

      {error ? (
        <p
          id={`${id}-error`}
          className="mt-1.5 text-sm font-semibold text-red-300"
        >
          {error}
        </p>
      ) : null}

      {hint ? (
        <p
          id={`${id}-hint`}
          className={`mt-1.5 text-xs leading-5 ${mutedClass}`}
        >
          {hint}
        </p>
      ) : null}

      {showCounter ? (
        <p
          id={`${id}-count`}
          className={`mt-1 text-right text-xs ${
            value.length >= max
              ? "font-semibold text-red-300"
              : mutedClass
          }`}
        >
          {value.length} / {max}
        </p>
      ) : null}
    </div>
  );
}

export default function FeedbackDialog({
  theme,
  accentClass,
  accentHoverClass,
  draft,
  onDraftChange,
  onClose,
  getReturnFocus,
}: FeedbackDialogProps) {
  const [values, setValues] =
    useState<FeedbackDraft>(draft);

  const [honeypot, setHoneypot] = useState("");

  const [status, setStatus] =
    useState<Status>("idle");

  const [offline, setOffline] = useState(false);

  const [errors, setErrors] =
    useState<FieldErrors>({});

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef =
    useRef<HTMLButtonElement>(null);

  const onCloseRef = useRef(onClose);
  const getReturnFocusRef = useRef(getReturnFocus);
  const sendingRef = useRef(false);
  const aliveRef = useRef(true);

  useEffect(() => {
    onCloseRef.current = onClose;
    getReturnFocusRef.current = getReturnFocus;
  });

  useEffect(() => {
    aliveRef.current = true;

    return () => {
      aliveRef.current = false;
    };
  }, []);

  /*
   * Escape closes, Tab stays inside the dialog, and focus
   * goes back to the Send feedback row afterwards. The page
   * behind does not scroll while the dialog is open.
   */
  useEffect(() => {
    const dialog = dialogRef.current;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCloseRef.current();

        return;
      }

      if (event.key !== "Tab" || !dialog) {
        return;
      }

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          FOCUSABLE,
        ),
      ).filter(
        (element) =>
          element.getClientRects().length > 0,
      );

      if (focusable.length === 0) {
        event.preventDefault();

        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (
        event.shiftKey &&
        (active === first ||
          active === dialog ||
          !dialog.contains(active))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (active === last ||
          !dialog.contains(active))
      ) {
        event.preventDefault();
        first.focus();
      }
    }

    const previousBodyOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    dialog?.focus();

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
      document.body.style.overflow =
        previousBodyOverflow;

      // Settings is shown again in the same update, so wait
      // for its row to be on the page.
      window.setTimeout(() => {
        getReturnFocusRef.current()?.focus();
      }, 0);
    };
  }, []);

  // Back online: the offline message no longer applies.
  useEffect(() => {
    function handleOnline() {
      setOffline(false);
      setStatus((current) =>
        current === "error" ? "idle" : current,
      );
    }

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener(
        "online",
        handleOnline,
      );
    };
  }, []);

  useEffect(() => {
    if (status === "success") {
      closeButtonRef.current?.focus();
    }
  }, [status]);

  function updateField(
    key: keyof FeedbackDraft,
    value: string,
  ) {
    const next = { ...values, [key]: value };

    setValues(next);
    onDraftChange(next);

    if (key === "happened" || key === "email") {
      setErrors((current) => ({
        ...current,
        [key]: undefined,
      }));
    }
  }

  function focusField(id: string) {
    dialogRef.current
      ?.querySelector<HTMLElement>(`#${id}`)
      ?.focus();
  }

  async function submit(
    event?: FormEvent<HTMLFormElement>,
  ) {
    event?.preventDefault();

    // The button stays focusable while sending, so a second
    // press or Enter has to be refused here.
    if (sendingRef.current) {
      return;
    }

    const report: FeedbackDraft = {
      happened: values.happened.trim(),
      did: values.did.trim(),
      expected: values.expected.trim(),
      device: values.device.trim(),
      email: values.email.trim(),
    };

    const nextErrors: FieldErrors = {};

    if (!report.happened) {
      nextErrors.happened = "Tell us what happened.";
    }

    if (
      report.email &&
      (report.email.length >
        FEEDBACK_LIMITS.email ||
        !EMAIL_PATTERN.test(report.email))
    ) {
      nextErrors.email =
        "That email doesn't look right.";
    }

    setErrors(nextErrors);

    if (nextErrors.happened) {
      focusField("feedback-happened");

      return;
    }

    if (nextErrors.email) {
      focusField("feedback-email");

      return;
    }

    if (!navigator.onLine) {
      setOffline(true);
      setStatus("error");

      return;
    }

    sendingRef.current = true;
    setOffline(false);
    setStatus("sending");

    try {
      // A filled honeypot means a bot. It gets the same
      // answer as a person, and nothing is sent.
      if (!honeypot.trim()) {
        await sendFeedbackStub({
          ...report,
          version: APP_VERSION,
        });
      }

      onDraftChange(EMPTY_FEEDBACK_DRAFT);

      if (aliveRef.current) {
        setValues(EMPTY_FEEDBACK_DRAFT);
        setStatus("success");
      }
    } catch {
      if (aliveRef.current) {
        setStatus("error");
      }
    } finally {
      sendingRef.current = false;
    }
  }

  const sending = status === "sending";

  const inputClass = theme.inputClass;
  const labelClass = theme.textPrimaryClass;
  const mutedClass = theme.textMutedClass;

  const secondaryButtonClass = `rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${theme.borderClass} ${theme.textSecondaryClass} ${theme.controlHoverClass}`;

  const primaryButtonClass = `rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition aria-disabled:cursor-not-allowed aria-disabled:opacity-40 ${accentClass} ${accentHoverClass}`;

  const githubLink = (text: string) => (
    <a
      href={FEEDBACK_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold underline underline-offset-2"
    >
      {text}
      <span className="sr-only">
        {" "}
        (opens in a new tab)
      </span>
    </a>
  );

  // Inside the scrolling part, so a phone keyboard leaves more room.
  const heading = (
    <div>
      <h2
        className={`text-lg font-semibold ${theme.textPrimaryClass}`}
      >
        Send feedback
      </h2>

      <p className={`mt-1 text-xs ${mutedClass}`}>
        App version {APP_VERSION}
      </p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4">
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Send feedback"
        className={`flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl shadow-2xl outline-none ${theme.surfaceClass}`}
      >
        {status === "success" ? (
          <>
            <div className="px-6 py-6">
              {heading}

              <p
                role="status"
                className={`mt-4 text-base font-semibold ${theme.textPrimaryClass}`}
              >
                Thanks, we got it
              </p>
            </div>

            <div
              className={`border-t px-6 py-4 ${theme.borderClass}`}
            >
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                className={`w-full ${primaryButtonClass}`}
              >
                Close
              </button>
            </div>
          </>
        ) : (
          <form
            noValidate
            onSubmit={submit}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-6 py-6">
              {heading}

              <Field
                id="feedback-happened"
                label="What happened"
                tag="Required"
                value={values.happened}
                max={FEEDBACK_LIMITS.happened}
                rows={4}
                required
                error={errors.happened}
                readOnly={sending}
                inputClass={inputClass}
                labelClass={labelClass}
                mutedClass={mutedClass}
                onChange={(value) =>
                  updateField("happened", value)
                }
              />

              <Field
                id="feedback-did"
                label="What I did"
                value={values.did}
                max={FEEDBACK_LIMITS.did}
                rows={3}
                readOnly={sending}
                inputClass={inputClass}
                labelClass={labelClass}
                mutedClass={mutedClass}
                onChange={(value) =>
                  updateField("did", value)
                }
              />

              <Field
                id="feedback-expected"
                label="What I expected"
                value={values.expected}
                max={FEEDBACK_LIMITS.expected}
                rows={3}
                readOnly={sending}
                inputClass={inputClass}
                labelClass={labelClass}
                mutedClass={mutedClass}
                onChange={(value) =>
                  updateField("expected", value)
                }
              />

              <Field
                id="feedback-device"
                label="Device and browser"
                value={values.device}
                max={FEEDBACK_LIMITS.device}
                placeholder="iPhone 15, Safari"
                readOnly={sending}
                inputClass={inputClass}
                labelClass={labelClass}
                mutedClass={mutedClass}
                onChange={(value) =>
                  updateField("device", value)
                }
              />

              <Field
                id="feedback-email"
                label="Email"
                tag="Optional"
                value={values.email}
                max={FEEDBACK_LIMITS.email}
                hint="Only used to reply to you."
                error={errors.email}
                email
                readOnly={sending}
                inputClass={inputClass}
                labelClass={labelClass}
                mutedClass={mutedClass}
                onChange={(value) =>
                  updateField("email", value)
                }
              />

              {/* Left empty by people. A bot that fills it is ignored. */}
              <div
                aria-hidden="true"
                className="sr-only"
              >
                <label htmlFor="feedback-extra">
                  Leave this field empty
                </label>

                <input
                  id="feedback-extra"
                  name="fb_extra"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(event) =>
                    setHoneypot(event.target.value)
                  }
                />
              </div>

              <p
                className={`text-xs leading-5 ${mutedClass}`}
              >
                Your report goes to the
                developer&apos;s private storage. It
                includes the app version and what you
                type, and your email if you add one.
                It&apos;s used only to fix problems and
                to reply, and reports are kept for up to
                6 months. Don&apos;t include personal or
                sensitive information.
              </p>
            </div>

            <div
              className={`border-t px-6 py-4 ${theme.borderClass}`}
            >
              {status === "error" ? (
                <div
                  role="alert"
                  className="mb-3 rounded-lg border border-red-300/40 bg-red-950/50 px-3 py-2.5 text-sm leading-6 text-red-100"
                >
                  {offline ? (
                    <>
                      You&apos;re offline. Try again
                      when you&apos;re back, or{" "}
                      {githubLink("use GitHub")}.
                    </>
                  ) : (
                    <>
                      Couldn&apos;t send your report.
                      Your text is still here. Try
                      again, or {githubLink("use GitHub")}.
                    </>
                  )}
                </div>
              ) : null}

              <div className="flex gap-3">
                <button
                  type="submit"
                  aria-disabled={sending || undefined}
                  className={`flex-1 ${primaryButtonClass}`}
                >
                  {sending
                    ? "Sending…"
                    : status === "error"
                      ? "Retry"
                      : "Send"}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className={secondaryButtonClass}
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
