import type { MessageTable } from "./translate";

/*
 * The English text, and the source of truth for the keys.
 * Every other language has to give the same keys (see
 * Messages), so a key that is missing there stops the
 * build. A plural message gives { one, other } and uses
 * {count}. A sentence with a link or other element marks
 * it with a tag such as <link>text</link>.
 *
 * Only a few keys are here so far. The rest of the
 * interface text moves in later.
 */
export const en = {
  "faq.title": "FAQ",
  "faq.close": "Close",
  "faq.feedback": "Send feedback",
} as const satisfies MessageTable;
