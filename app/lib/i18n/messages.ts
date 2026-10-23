import type { en } from "./en";
import type { PluralMessage } from "./translate";

/*
 * The shape every language has to fill in: the same keys as
 * English, a string where English has a string, and a
 * { one, other } pair where English has a plural.
 */
type Shape<T extends Readonly<Record<string, unknown>>> = {
  [K in keyof T]: T[K] extends string
    ? string
    : PluralMessage;
};

export type Messages = Shape<typeof en>;

export type MessageKey = keyof Messages;
