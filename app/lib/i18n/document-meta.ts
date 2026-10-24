import { DICTIONARIES } from "./dictionaries";
import { en } from "./en";
import {
  DEFAULT_LANGUAGE,
  type LanguageCode,
} from "./languages";
import { translateMessage } from "./translate";

/*
 * The page title, the description and the name the phone gives
 * the app on its home screen, in one language. The built page
 * has the English ones written in (layout.tsx), and the head
 * script and the language store put these in place of them.
 * manifest.json stays English: a static site has one manifest.
 */
export type DocumentMeta = {
  title: string;
  description: string;
};

export function getDocumentMeta(
  language: LanguageCode,
): DocumentMeta {
  const options = {
    language,
    messages: DICTIONARIES[language],
    fallback: en,
  };

  return {
    title: translateMessage(
      "meta.title",
      undefined,
      options,
    ),
    description: translateMessage(
      "meta.description",
      undefined,
      options,
    ),
  };
}

/*
 * The same title and description for every language that is
 * available, for the head script, which runs on its own and
 * cannot import anything. English is left out: it is already in
 * the page.
 */
export function buildMetaMap(
  available: readonly LanguageCode[],
): Record<string, DocumentMeta> {
  const map: Record<string, DocumentMeta> = {};

  for (const code of available) {
    if (code !== DEFAULT_LANGUAGE) {
      map[code] = getDocumentMeta(code);
    }
  }

  return map;
}

/* Browser only. Used when the language changes while the page is open. */
export function applyDocumentMeta(
  language: LanguageCode,
): void {
  const meta = getDocumentMeta(language);

  if (document.title !== meta.title) {
    document.title = meta.title;
  }

  const description = document.querySelector(
    'meta[name="description"]',
  );

  if (
    description &&
    description.getAttribute("content") !==
      meta.description
  ) {
    description.setAttribute(
      "content",
      meta.description,
    );
  }

  const appleTitle = document.querySelector(
    'meta[name="apple-mobile-web-app-title"]',
  );

  if (
    appleTitle &&
    appleTitle.getAttribute("content") !== meta.title
  ) {
    appleTitle.setAttribute("content", meta.title);
  }
}

/*
 * React puts the built English title back while the page hydrates
 * (seen in dev; the title element belongs to the page's own
 * metadata), after the head script has already set the right one.
 * This keeps the title in the current language: whenever the
 * title is changed to something else, it is set again in the same
 * step, before the browser draws. Browser only. Returns the stop
 * function.
 */
export function keepDocumentTitle(
  getLanguage: () => LanguageCode,
): () => void {
  const observer = new MutationObserver(() => {
    const title = getDocumentMeta(getLanguage()).title;

    if (document.title !== title) {
      document.title = title;
    }
  });

  observer.observe(document.head, {
    subtree: true,
    childList: true,
    characterData: true,
  });

  return () => observer.disconnect();
}
