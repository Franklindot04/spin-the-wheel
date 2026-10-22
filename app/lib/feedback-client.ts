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
 * Stand-in for sending a report. It waits a moment and
 * resolves, and sends and stores nothing. A later stage
 * replaces it with a real POST to /api/feedback.
 */
export async function sendFeedbackStub(
  report: FeedbackReport,
): Promise<void> {
  void report;

  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, 800);
  });
}
