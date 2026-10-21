import { APP_VERSION } from "./app-version";

const NEW_ISSUE_URL =
  "https://github.com/Franklindot04/spin-the-wheel/issues/new";

/*
 * Only the app version goes in. No wheel data, and
 * nothing read from the browser, so the address is the
 * same on the server and in the page.
 */
const BODY = [
  `App version: ${APP_VERSION}`,
  "",
  "## What I did",
  "",
  "",
  "## What I expected",
  "",
  "",
  "## What happened",
  "",
  "",
  "## Device and browser",
  "(for example iPhone 15, Safari)",
  "",
].join("\n");

const params = new URLSearchParams({
  title: "Feedback: ",
  body: BODY,
});

export const FEEDBACK_URL = `${NEW_ISSUE_URL}?${params.toString()}`;
