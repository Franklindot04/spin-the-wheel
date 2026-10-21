import { APP_VERSION } from "./app-version";

const NEW_ISSUE_URL =
  "https://github.com/Franklindot04/spin-the-wheel/issues/new";

/*
 * Opens the Feedback form (.github/ISSUE_TEMPLATE/feedback.yml)
 * and fills its "version" field. The form supplies the title
 * and the questions. Only the app version goes in: no wheel
 * data, and nothing read from the browser, so the address is
 * the same on the server and in the page.
 */
const params = new URLSearchParams({
  template: "feedback.yml",
  version: APP_VERSION,
});

export const FEEDBACK_URL = `${NEW_ISSUE_URL}?${params.toString()}`;
