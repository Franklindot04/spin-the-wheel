export const MAX_EMOJI_LENGTH = 16;

export type EmojiOption = {
  emoji: string;
  name: string;
  toneCapable?: boolean;
};

export type EmojiGroup = {
  label: string;
  options: EmojiOption[];
};

export const EMOJI_GROUPS: EmojiGroup[] = [
  {
    label: "People",
    options: [
      { emoji: "🧑", name: "Person", toneCapable: true },
      { emoji: "👩", name: "Woman", toneCapable: true },
      { emoji: "👨", name: "Man", toneCapable: true },
      { emoji: "👧", name: "Girl", toneCapable: true },
      { emoji: "👦", name: "Boy", toneCapable: true },
      { emoji: "🧓", name: "Older person", toneCapable: true },
    ],
  },
  {
    label: "Faces and gestures",
    options: [
      { emoji: "😀", name: "Grinning face" },
      { emoji: "😎", name: "Sunglasses" },
      { emoji: "🤩", name: "Star-struck" },
      { emoji: "😂", name: "Laughing" },
      { emoji: "🥳", name: "Party" },
      { emoji: "👍", name: "Thumbs up", toneCapable: true },
      { emoji: "👏", name: "Clapping", toneCapable: true },
      { emoji: "🙌", name: "Raised hands", toneCapable: true },
      { emoji: "💪", name: "Flexed arm", toneCapable: true },
    ],
  },
  {
    label: "Food and drink",
    options: [
      { emoji: "🍕", name: "Pizza" },
      { emoji: "🍔", name: "Burger" },
      { emoji: "🍟", name: "Fries" },
      { emoji: "🌮", name: "Taco" },
      { emoji: "🍣", name: "Sushi" },
      { emoji: "🍩", name: "Doughnut" },
      { emoji: "🍰", name: "Cake" },
      { emoji: "🍎", name: "Apple" },
      { emoji: "🍌", name: "Banana" },
      { emoji: "🍓", name: "Strawberry" },
      { emoji: "☕", name: "Coffee" },
      { emoji: "🍺", name: "Beer" },
    ],
  },
  {
    label: "Animals and nature",
    options: [
      { emoji: "🐶", name: "Dog" },
      { emoji: "🐱", name: "Cat" },
      { emoji: "🦊", name: "Fox" },
      { emoji: "🐼", name: "Panda" },
      { emoji: "🌸", name: "Blossom" },
      { emoji: "🌈", name: "Rainbow" },
    ],
  },
  {
    label: "Activities and objects",
    options: [
      { emoji: "⚽", name: "Soccer ball" },
      { emoji: "🏀", name: "Basketball" },
      { emoji: "🎮", name: "Game controller" },
      { emoji: "🎵", name: "Music note" },
      { emoji: "🎁", name: "Gift" },
      { emoji: "📚", name: "Books" },
    ],
  },
  {
    label: "Symbols",
    options: [
      { emoji: "⭐", name: "Star" },
      { emoji: "❤️", name: "Heart" },
      { emoji: "🔥", name: "Fire" },
      { emoji: "✅", name: "Check mark" },
      { emoji: "❌", name: "Cross mark" },
      { emoji: "💡", name: "Light bulb" },
    ],
  },
];

export const EMOJI_OPTIONS: EmojiOption[] =
  EMOJI_GROUPS.flatMap(
    (group) => group.options,
  );

export type EmojiTone = {
  name: string;
  modifier: string;
};

/*
 * Index 0 is the default (no modifier).
 */
export const EMOJI_TONES: EmojiTone[] = [
  { name: "Default", modifier: "" },
  { name: "Light", modifier: "\u{1F3FB}" },
  { name: "Medium-light", modifier: "\u{1F3FC}" },
  { name: "Medium", modifier: "\u{1F3FD}" },
  { name: "Medium-dark", modifier: "\u{1F3FE}" },
  { name: "Dark", modifier: "\u{1F3FF}" },
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
