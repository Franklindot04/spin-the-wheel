import {
  resolveMessage,
  translateMessage,
  type MessageTable,
  type MissingReporter,
  type PluralMessage,
} from "./translate";
import {
  parseRich,
  renderRich,
  type RichComponents,
} from "./rich";
import type { ReactNode } from "react";

/* The {names} used in a message text. */
type Names<S extends string> =
  S extends `${string}{${infer P}}${infer Rest}`
    ? P | Names<Rest>
    : never;

type ValueNames<V> = V extends string
  ? Names<V>
  : V extends {
        readonly one: infer A extends string;
        readonly other: infer B extends string;
      }
    ? Names<A> | Names<B> | "count"
    : never;

/*
 * The values a message needs. A message with no
 * placeholders takes none, and a plural message needs a
 * number called count.
 */
export type ParamsFor<
  T extends MessageTable,
  K extends keyof T,
> = [ValueNames<T[K]>] extends [never]
  ? undefined
  : {
      [P in ValueNames<T[K]>]: P extends "count"
        ? number
        : string | number;
    };

type Args<
  T extends MessageTable,
  K extends keyof T,
> = ParamsFor<T, K> extends undefined
  ? []
  : [params: ParamsFor<T, K>];

export type Translator<T extends MessageTable> = {
  <K extends keyof T & string>(
    key: K,
    ...args: Args<T, K>
  ): string;
  rich: <K extends keyof T & string>(
    key: K,
    components: RichComponents,
    ...args: Args<T, K>
  ) => ReactNode;
};

type PlainParams = Readonly<
  Record<string, string | number>
>;

/*
 * Builds t() for one language. The English table is the
 * fallback for any key the language lacks.
 */
export function createTranslator<
  T extends MessageTable,
>(options: {
  language: string;
  messages: Readonly<Record<string, unknown>> | undefined;
  fallback: T;
  onMissing?: MissingReporter;
}): Translator<T> {
  const resolveOptions = {
    language: options.language,
    messages: options.messages as
      | MessageTable
      | undefined,
    fallback: options.fallback as MessageTable,
    onMissing: options.onMissing,
  };

  const translate = (
    key: string,
    params?: PlainParams,
  ) => translateMessage(key, params, resolveOptions);

  const rich = (
    key: string,
    components: RichComponents,
    params?: PlainParams,
  ) =>
    renderRich(
      parseRich(
        resolveMessage(key, params, resolveOptions),
      ),
      components,
      params,
    );

  return Object.assign(translate, {
    rich,
  }) as unknown as Translator<T>;
}

export type { PluralMessage };
