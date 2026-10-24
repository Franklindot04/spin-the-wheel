"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import type { ReactNode } from "react";
import { DICTIONARIES } from "./dictionaries";
import { keepDocumentTitle } from "./document-meta";
import { en } from "./en";
import {
  getLanguageSnapshot,
  getServerLanguageSnapshot,
  setDocumentLanguage,
  setLanguage,
  subscribeToLanguage,
} from "./language-store";
import {
  DEFAULT_LANGUAGE,
  type LanguageCode,
} from "./languages";
import { warnMissingOnce } from "./translate";
import {
  createTranslator,
  type Translator,
} from "./typed";

type TranslatorOf = Translator<typeof en>;

type LanguageContextValue = {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: TranslatorOf;
};

function translatorFor(
  language: LanguageCode,
): TranslatorOf {
  return createTranslator({
    language,
    messages: DICTIONARIES[language],
    fallback: en,
    onMissing: warnMissingOnce,
  });
}

/* Used outside the provider: English, with no way to change it. */
const LanguageContext =
  createContext<LanguageContextValue>({
    language: DEFAULT_LANGUAGE,
    setLanguage: () => {},
    t: translatorFor(DEFAULT_LANGUAGE),
  });

/*
 * Holds the language for the whole page. The server and
 * the first client render use English, and the browser's
 * own answer (already on <html> from the head script) is
 * taken straight after, before anything shows: the real
 * page does not render until its saved data has loaded.
 */
export function LanguageProvider({
  children,
}: {
  children: ReactNode;
}) {
  const language = useSyncExternalStore(
    subscribeToLanguage,
    getLanguageSnapshot,
    getServerLanguageSnapshot,
  );

    useEffect(() => {
    setDocumentLanguage(getLanguageSnapshot());

    return keepDocumentTitle(getLanguageSnapshot);
  }, []);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: translatorFor(language),
    }),
    [language],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useT(): TranslatorOf {
  return useContext(LanguageContext).t;
}

export function useLanguage() {
  const { language, setLanguage } =
    useContext(LanguageContext);

  return { language, setLanguage };
}
