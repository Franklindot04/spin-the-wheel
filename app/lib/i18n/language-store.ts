import { applyDocumentMeta } from "./document-meta";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  parseStoredLanguage,
  pickLanguage,
  type LanguageCode,
} from "./languages";

/*
 * Where the current language lives while the page is open.
 * It is a small store, not React state, so the provider can
 * read it for its very first render and a change made in
 * another tab can reach it. Only the browser calls these.
 */
let current: LanguageCode | null = null;

const listeners = new Set<() => void>();

function readDocumentLanguage(): LanguageCode | null {
  return parseStoredLanguage(
    document.documentElement.getAttribute(
      "data-lang",
    ),
  );
}

function readStoredLanguage(): LanguageCode | null {
  try {
    return parseStoredLanguage(
      window.localStorage.getItem(
        LANGUAGE_STORAGE_KEY,
      ),
    );
  } catch {
    // Blocked storage means no saved choice.
    return null;
  }
}

function detectLanguage(): LanguageCode {
  try {
    return pickLanguage(
      navigator.languages &&
        navigator.languages.length > 0
        ? navigator.languages
        : [navigator.language],
    );
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

/* A saved choice wins, then the device language, then English. */
function chosenOrDetected(): LanguageCode {
  return readStoredLanguage() ?? detectLanguage();
}

export function setDocumentLanguage(
  language: LanguageCode,
): void {
  const root = document.documentElement;

  if (root.getAttribute("lang") !== language) {
    root.setAttribute("lang", language);
  }

    if (root.getAttribute("data-lang") !== language) {
    root.setAttribute("data-lang", language);
  }

  applyDocumentMeta(language);
}

/*
 * The head script has already worked this out before the
 * first paint, so its answer is read back from the page.
 * If the script did not run, the same answer is worked out
 * here.
 */
export function getLanguageSnapshot(): LanguageCode {
  if (current === null) {
    current =
      readDocumentLanguage() ?? chosenOrDetected();
  }

  return current;
}

/* What the page is rendered with before the browser is known. */
export function getServerLanguageSnapshot(): LanguageCode {
  return DEFAULT_LANGUAGE;
}

function apply(language: LanguageCode): void {
  setDocumentLanguage(language);

  if (current === language) {
    return;
  }

  current = language;

  listeners.forEach((listener) => listener());
}

/*
 * Saves the person's choice and switches to it. If the
 * browser will not save it, the language still changes for
 * this visit. A language that is not available is ignored.
 */
export function setLanguage(
  language: LanguageCode,
): void {
  if (parseStoredLanguage(language) === null) {
    return;
  }

  try {
    window.localStorage.setItem(
      LANGUAGE_STORAGE_KEY,
      language,
    );
  } catch {
    // Not saved, but this visit still uses it.
  }

  apply(language);
}

/*
 * Only this key is watched. A change in another tab moves
 * this tab to the same language and nothing else, so the
 * "changed in another tab" notice about the wheels is not
 * involved. A removed key (or a cleared storage) goes back
 * to the device language.
 */
function handleStorage(event: StorageEvent): void {
  if (
    event.key !== null &&
    event.key !== LANGUAGE_STORAGE_KEY
  ) {
    return;
  }

  try {
    if (event.storageArea !== window.localStorage) {
      return;
    }
  } catch {
    return;
  }

  apply(
    parseStoredLanguage(event.newValue) ??
      detectLanguage(),
  );
}

export function subscribeToLanguage(
  listener: () => void,
): () => void {
  if (listeners.size === 0) {
    window.addEventListener("storage", handleStorage);
  }

  listeners.add(listener);

  return () => {
    listeners.delete(listener);

    if (listeners.size === 0) {
      window.removeEventListener(
        "storage",
        handleStorage,
      );
    }
  };
}
