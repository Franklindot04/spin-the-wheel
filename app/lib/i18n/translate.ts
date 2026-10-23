/*
 * The plain functions behind t(). Nothing here touches
 * React or the page, so they run the same everywhere.
 *
 * A message is a string, or a plural message with the two
 * forms the supported languages need. Placeholders are
 * written {name}. For a plural message the number is
 * always {count}, and it also picks the form.
 */
export type PluralMessage = {
  readonly one: string;
  readonly other: string;
};

export type MessageValue = string | PluralMessage;

export type MessageTable = Readonly<
  Record<string, MessageValue>
>;

export type Params = Readonly<
  Record<string, string | number>
>;

export type MissingReporter = (
  key: string,
  language: string,
) => void;

const pluralRules = new Map<
  string,
  Intl.PluralRules
>();

function getPluralRules(language: string) {
  let rules = pluralRules.get(language);

  if (!rules) {
    try {
      rules = new Intl.PluralRules(language);
    } catch {
      rules = new Intl.PluralRules("en");
    }

    pluralRules.set(language, rules);
  }

  return rules;
}

/*
 * Plural categories other than "one" use the "other" form.
 * That covers every supported language; a language that
 * needs more forms will need a wider message shape.
 */
export function selectPlural(
  language: string,
  message: PluralMessage,
  count: number,
): string {
  return getPluralRules(language).select(count) ===
    "one"
    ? message.one
    : message.other;
}

/*
 * Fills in {name} placeholders. A placeholder with no
 * value stays as it is, so a gap is easy to see.
 */
export function interpolate(
  template: string,
  params?: Params,
): string {
  if (!params) {
    return template;
  }

  return template.replace(
    /\{([A-Za-z0-9_]+)\}/g,
    (whole, name: string) =>
      Object.prototype.hasOwnProperty.call(
        params,
        name,
      )
        ? String(params[name])
        : whole,
  );
}

function isPlural(
  value: unknown,
): value is PluralMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as PluralMessage).one ===
      "string" &&
    typeof (value as PluralMessage).other ===
      "string"
  );
}

export type ResolveOptions = {
  language: string;
  messages: MessageTable | undefined;
  fallback: MessageTable;
  onMissing?: MissingReporter;
};

/*
 * Finds the text for a key, before placeholders are filled
 * in. A key the language does not have, or has in the wrong
 * shape, uses the English text. A key English does not have
 * either gives the key itself.
 */
export function resolveMessage(
  key: string,
  params: Params | undefined,
  options: ResolveOptions,
): string {
  const own = options.messages?.[key];
  const english = options.fallback[key];

  let value: MessageValue | undefined = own;

  if (value === undefined) {
    options.onMissing?.(key, options.language);

    value = english;
  }

  if (value === undefined) {
    return key;
  }

  if (typeof value === "string") {
    return value;
  }

  if (!isPlural(value)) {
    options.onMissing?.(key, options.language);

    return typeof english === "string"
      ? english
      : key;
  }

  const count = Number(params?.count);

  return selectPlural(
    options.language,
    value,
    Number.isFinite(count) ? count : NaN,
  );
}

export function translateMessage(
  key: string,
  params: Params | undefined,
  options: ResolveOptions,
): string {
  return interpolate(
    resolveMessage(key, params, options),
    params,
  );
}

const reported = new Set<string>();

/*
 * Logs a missing translation once per language and key,
 * and only while developing, so a gap shows up for the
 * person writing the translation and never in the live app.
 */
export function warnMissingOnce(
  key: string,
  language: string,
): void {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const id = `${language}:${key}`;

  if (reported.has(id)) {
    return;
  }

  reported.add(id);

  console.warn(
    `Missing "${language}" translation for "${key}". Using English.`,
  );
}

export function resetMissingWarnings(): void {
  reported.clear();
}
