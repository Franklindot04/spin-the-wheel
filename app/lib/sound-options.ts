/*
 * The spin and winner sounds a wheel can use, in the order and with
 * the labels the Settings panel shows. The ids are matched by name in
 * sound-engine.ts, so a sound added or renamed here must be changed
 * there too. The labels are message keys (see i18n/en.ts), and
 * the components show them with t(). The only import is a type,
 * which is gone at build time, so anything can read this file.
 */
import type { PlainMessageKey } from "./i18n/messages";

type SoundOption = {
  readonly value: string;
  readonly labelKey: PlainMessageKey;
};

export const SPIN_SOUND_OPTIONS = [
  { value: "tick", labelKey: "sound.spin.tick" },
  { value: "click", labelKey: "sound.spin.click" },
  { value: "pop", labelKey: "sound.spin.pop" },
  { value: "none", labelKey: "sound.none" },
] as const satisfies ReadonlyArray<SoundOption>;

export const WINNER_SOUND_OPTIONS = [
  { value: "success", labelKey: "sound.winner.success" },
  { value: "chime", labelKey: "sound.winner.chime" },
  { value: "applause", labelKey: "sound.winner.applause" },
  { value: "none", labelKey: "sound.none" },
] as const satisfies ReadonlyArray<SoundOption>;

export const DEFAULT_SPIN_SOUND = "tick";

export const DEFAULT_WINNER_SOUND = "success";
