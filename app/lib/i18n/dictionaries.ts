import { en } from "./en";
import type { LanguageCode } from "./languages";
import type { Messages } from "./messages";

/*
 * The dictionary of each language that is in the app. A
 * language is added here when its file exists. Each one is
 * typed as Messages, so a missing key fails the build.
 */
export const DICTIONARIES: {
  readonly [C in LanguageCode]?: Messages;
} = {
  en,
};
