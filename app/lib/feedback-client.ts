/*
 * What the feedback form sends. The app version is added
 * when the report is built, so the person never edits it.
 */
export type FeedbackDraft = {
  happened: string;
  did: string;
  expected: string;
  device: string;
  email: string;
};

export type FeedbackReport = FeedbackDraft & {
  version: string;
};

export const EMPTY_FEEDBACK_DRAFT: FeedbackDraft = {
  happened: "",
  did: "",
  expected: "",
  device: "",
  email: "",
};

// Keep these the same as LIMITS in functions/api/feedback.js.
export const FEEDBACK_LIMITS: Record<
  keyof FeedbackDraft,
  number
> = {
  happened: 2000,
  did: 1000,
  expected: 1000,
  device: 200,
  email: 254,
};

/*
 * ok:           the report was stored
 * rate-limited: the server has taken its daily share
 * offline:      the request could not leave the device
 * failed:       anything else, including a timeout
 */
export type FeedbackResult =
  | "ok"
  | "rate-limited"
  | "offline"
  | "failed";

const FEEDBACK_ENDPOINT = "/api/feedback";
const REQUEST_TIMEOUT_MS = 20000;

/*
 * Stand-in used only under next dev, which has no Functions.
 * It waits a moment and answers ok, and sends nothing.
 */
function sendFeedbackStub(
  signal: AbortSignal,
): Promise<FeedbackResult> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(
      () => resolve("ok"),
      800,
    );

    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        resolve("failed");
      },
      { once: true },
    );
  });
}

async function postFeedback(
  report: FeedbackReport,
  token: string,
  signal: AbortSignal,
): Promise<FeedbackResult> {
  // Stops on the caller's signal, or when the request
  // takes too long.
  const controller = new AbortController();
  const stop = () => controller.abort();

  if (signal.aborted) {
    stop();
  } else {
    signal.addEventListener("abort", stop, {
      once: true,
    });
  }

  const timer = window.setTimeout(
    stop,
    REQUEST_TIMEOUT_MS,
  );

  try {
    const response = await fetch(FEEDBACK_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...report, token }),
      cache: "no-store",
      signal: controller.signal,
    });

    if (response.status === 429) {
      return "rate-limited";
    }

    if (!response.ok) {
      return "failed";
    }

    const data: unknown = await response
      .json()
      .catch(() => null);

    return (data as { ok?: unknown } | null)?.ok ===
      true
      ? "ok"
      : "failed";
  } catch {
    return navigator.onLine === false
      ? "offline"
      : "failed";
  } finally {
    window.clearTimeout(timer);
    signal.removeEventListener("abort", stop);
  }
}

/*
 * Sends a report to /api/feedback, the Pages Function in
 * functions/api/feedback.js, with the Turnstile token the
 * Function checks. Aborting the signal cancels it.
 */
export function submitFeedback(
  report: FeedbackReport,
  token: string,
  signal: AbortSignal,
): Promise<FeedbackResult> {
  if (process.env.NODE_ENV === "development") {
    return sendFeedbackStub(signal);
  }

  return postFeedback(report, token, signal);
}
