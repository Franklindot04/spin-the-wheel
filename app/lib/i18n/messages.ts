import type { en } from "./en";
import type { PluralMessage } from "./translate";
import type { ParamsFor } from "./typed";

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

/*
 * The keys whose text has no {placeholders}. A list in a lib
 * file keeps keys of this kind, so the component that shows one
 * can call t(key) without values, whichever key it holds.
 */
export type PlainMessageKey = {
  [K in MessageKey]: ParamsFor<typeof en, K> extends undefined
    ? K
    : never;
}[MessageKey];
