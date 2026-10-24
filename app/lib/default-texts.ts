import { DICTIONARIES } from "./i18n/dictionaries";
import { en } from "./i18n/en";
import {
  DEFAULT_LANGUAGE,
  type LanguageCode,
} from "./i18n/languages";
import {
  translateMessage,
  warnMissingOnce,
} from "./i18n/translate";

/*
 * The words that are written into saved data when a wheel, an
 * entry or a copy is made: the title and description of a new
 * wheel, wheel and entry names, and the name of a duplicate.
 * They are plain strings once made and are never translated
 * again, so the data stays the same in an export. This file
 * reads only the dictionaries, so it is safe on the server and
 * in any library code; the caller says which language.
 */
export type DefaultTexts = {
  wheelTitle: string;
  wheelDescription: string;
  /* Used when a saved wheel has no usable name. */
  wheelNameFallback: string;
  wheelName: (number: number) => string;
  optionName: (number: number) => string;
  questionName: (number: number) => string;
  copyName: (name: string) => string;
};

export function getDefaultTexts(
  language: LanguageCode = DEFAULT_LANGUAGE,
): DefaultTexts {
  const options = {
    language,
    messages: DICTIONARIES[language],
    fallback: en,
    onMissing: warnMissingOnce,
  };

  const text = (
    key: string,
    params?: Record<string, string | number>,
  ) => translateMessage(key, params, options);

  return {
    wheelTitle: text("defaults.wheelTitle"),
    wheelDescription: text("defaults.wheelDescription"),
    wheelNameFallback: text("defaults.wheelNameFallback"),
    wheelName: (number) =>
      text("defaults.wheelName", { number }),
    optionName: (number) =>
      text("defaults.option", { number }),
    questionName: (number) =>
      text("defaults.question", { number }),
    copyName: (name) =>
      text("defaults.copyName", { name }),
  };
}
