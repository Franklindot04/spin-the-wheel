import type { PlainMessageKey } from "./i18n/messages";

export const MAX_EMOJI_LENGTH = 16;

/*
 * The names are message keys (see i18n/en.ts); the picker shows
 * them with t().
 */
export type EmojiOption = {
  emoji: string;
  nameKey: PlainMessageKey;
  toneCapable?: boolean;
};

export type EmojiGroup = {
  labelKey: PlainMessageKey;
  options: EmojiOption[];
};

export const EMOJI_GROUPS: EmojiGroup[] = [
  {
    labelKey: "emoji.group.people",
    options: [
      { emoji: "🧑", nameKey: "emoji.name.person", toneCapable: true },
      { emoji: "👩", nameKey: "emoji.name.woman", toneCapable: true },
      { emoji: "👨", nameKey: "emoji.name.man", toneCapable: true },
      { emoji: "👧", nameKey: "emoji.name.girl", toneCapable: true },
      { emoji: "👦", nameKey: "emoji.name.boy", toneCapable: true },
      { emoji: "🧓", nameKey: "emoji.name.olderPerson", toneCapable: true },
    ],
  },
  {
    labelKey: "emoji.group.facesAndGestures",
    options: [
      { emoji: "😀", nameKey: "emoji.name.grinningFace" },
      { emoji: "😎", nameKey: "emoji.name.sunglasses" },
      { emoji: "🤩", nameKey: "emoji.name.starStruck" },
      { emoji: "😂", nameKey: "emoji.name.laughing" },
      { emoji: "🥳", nameKey: "emoji.name.party" },
      { emoji: "👍", nameKey: "emoji.name.thumbsUp", toneCapable: true },
      { emoji: "👏", nameKey: "emoji.name.clapping", toneCapable: true },
      { emoji: "🙌", nameKey: "emoji.name.raisedHands", toneCapable: true },
      { emoji: "💪", nameKey: "emoji.name.flexedArm", toneCapable: true },
    ],
  },
  {
    labelKey: "emoji.group.foodAndDrink",
    options: [
      { emoji: "🍕", nameKey: "emoji.name.pizza" },
      { emoji: "🍔", nameKey: "emoji.name.burger" },
      { emoji: "🍟", nameKey: "emoji.name.fries" },
      { emoji: "🌮", nameKey: "emoji.name.taco" },
      { emoji: "🍣", nameKey: "emoji.name.sushi" },
      { emoji: "🍩", nameKey: "emoji.name.doughnut" },
      { emoji: "🍰", nameKey: "emoji.name.cake" },
      { emoji: "🍎", nameKey: "emoji.name.apple" },
      { emoji: "🍌", nameKey: "emoji.name.banana" },
      { emoji: "🍓", nameKey: "emoji.name.strawberry" },
      { emoji: "☕", nameKey: "emoji.name.coffee" },
      { emoji: "🍺", nameKey: "emoji.name.beer" },
    ],
  },
  {
    labelKey: "emoji.group.animalsAndNature",
    options: [
      { emoji: "🐶", nameKey: "emoji.name.dog" },
      { emoji: "🐱", nameKey: "emoji.name.cat" },
      { emoji: "🦊", nameKey: "emoji.name.fox" },
      { emoji: "🐼", nameKey: "emoji.name.panda" },
      { emoji: "🌸", nameKey: "emoji.name.blossom" },
      { emoji: "🌈", nameKey: "emoji.name.rainbow" },
    ],
  },
  {
    labelKey: "emoji.group.activitiesAndObjects",
    options: [
      { emoji: "⚽", nameKey: "emoji.name.soccerBall" },
      { emoji: "🏀", nameKey: "emoji.name.basketball" },
      { emoji: "🎮", nameKey: "emoji.name.gameController" },
      { emoji: "🎵", nameKey: "emoji.name.musicNote" },
      { emoji: "🎁", nameKey: "emoji.name.gift" },
      { emoji: "📚", nameKey: "emoji.name.books" },
    ],
  },
  {
    labelKey: "emoji.group.symbols",
    options: [
      { emoji: "⭐", nameKey: "emoji.name.star" },
      { emoji: "❤️", nameKey: "emoji.name.heart" },
      { emoji: "🔥", nameKey: "emoji.name.fire" },
      { emoji: "✅", nameKey: "emoji.name.checkMark" },
      { emoji: "❌", nameKey: "emoji.name.crossMark" },
      { emoji: "💡", nameKey: "emoji.name.lightBulb" },
    ],
  },
];

export const EMOJI_OPTIONS: EmojiOption[] =
  EMOJI_GROUPS.flatMap(
    (group) => group.options,
  );

export type EmojiTone = {
  nameKey: PlainMessageKey;
  /* The form used inside a sentence, as its own message. */
  inlineKey: PlainMessageKey;
  modifier: string;
};

/*
 * Index 0 is the default (no modifier).
 */
export const EMOJI_TONES: EmojiTone[] = [
  {
    nameKey: "emoji.tone.default",
    inlineKey: "emoji.toneInline.default",
    modifier: "",
  },
  {
    nameKey: "emoji.tone.light",
    inlineKey: "emoji.toneInline.light",
    modifier: "\u{1F3FB}",
  },
  {
    nameKey: "emoji.tone.mediumLight",
    inlineKey: "emoji.toneInline.mediumLight",
    modifier: "\u{1F3FC}",
  },
  {
    nameKey: "emoji.tone.medium",
    inlineKey: "emoji.toneInline.medium",
    modifier: "\u{1F3FD}",
  },
  {
    nameKey: "emoji.tone.mediumDark",
    inlineKey: "emoji.toneInline.mediumDark",
    modifier: "\u{1F3FE}",
  },
  {
    nameKey: "emoji.tone.dark",
    inlineKey: "emoji.toneInline.dark",
    modifier: "\u{1F3FF}",
  },
];

const TONE_MODIFIER_PATTERN =
  /[\u{1F3FB}-\u{1F3FF}]/u;

export function getEmojiTone(
  emoji: string | undefined,
): number {
  if (!emoji) {
    return 0;
  }

  const match =
    emoji.match(TONE_MODIFIER_PATTERN);

  if (!match) {
    return 0;
  }

  const index = EMOJI_TONES.findIndex(
    (tone) =>
      tone.modifier === match[0],
  );

  return index > 0 ? index : 0;
}

export function applyEmojiTone(
  baseEmoji: string,
  toneIndex: number,
): string {
  const tone =
    EMOJI_TONES[toneIndex] ??
    EMOJI_TONES[0];

  return `${baseEmoji}${tone.modifier}`;
}

/*
 * Removes a skin-tone modifier so the
 * emoji can be matched to the curated list.
 */
export function stripEmojiTone(
  emoji: string,
): string {
  return emoji.replace(
    new RegExp(
      TONE_MODIFIER_PATTERN.source,
      "gu",
    ),
    "",
  );
}

function createPictographicPattern(
  source: string,
): RegExp | null {
  try {
    return new RegExp(source, "u");
  } catch {
    return null;
  }
}

/*
 * Built from strings so the property
 * escapes are not checked against the
 * compile target; unsupported runtimes
 * simply get null.
 */
const PICTOGRAPHIC_PATTERN =
  createPictographicPattern(
    "\\p{Extended_Pictographic}",
  );

const SINGLE_EMOJI_PATTERN =
  createPictographicPattern(
    "^\\p{Extended_Pictographic}(?:\\uFE0F|\\p{Emoji_Modifier})?(?:\\u200D\\p{Extended_Pictographic}(?:\\uFE0F|\\p{Emoji_Modifier})?)*$",
  );

function isSingleGrapheme(
  value: string,
): boolean {
  if (
    typeof Intl !== "undefined" &&
    typeof Intl.Segmenter ===
      "function"
  ) {
    const segments = Array.from(
      new Intl.Segmenter().segment(
        value,
      ),
    );

    return segments.length === 1;
  }

  return (
    SINGLE_EMOJI_PATTERN?.test(
      value,
    ) ?? false
  );
}

/*
 * Returns a clean emoji string, or
 * undefined when the value is missing,
 * not a string, too long, not a single
 * grapheme cluster, or not pictographic.
 * Never throws and never rejects an entry.
 */
export function normalizeEmoji(
  value: unknown,
): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  if (
    trimmed.length === 0 ||
    trimmed.length > MAX_EMOJI_LENGTH
  ) {
    return undefined;
  }

  if (
    !PICTOGRAPHIC_PATTERN?.test(
      trimmed,
    )
  ) {
    return undefined;
  }

  return isSingleGrapheme(trimmed)
    ? trimmed
    : undefined;
}
