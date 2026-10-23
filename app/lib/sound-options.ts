/*
 * The spin and winner sounds a wheel can use, in the order and with
 * the labels the Settings panel shows. The ids are matched by name in
 * sound-engine.ts, so a sound added or renamed here must be changed
 * there too. This file has no imports, so anything can read it.
 */
export const SPIN_SOUND_OPTIONS = [
  { value: "tick", label: "Tick" },
  { value: "click", label: "Click" },
  { value: "pop", label: "Pop" },
  { value: "none", label: "None" },
] as const;

export const WINNER_SOUND_OPTIONS = [
  { value: "success", label: "Success" },
  { value: "chime", label: "Chime" },
  { value: "applause", label: "Applause" },
  { value: "none", label: "None" },
] as const;

export const DEFAULT_SPIN_SOUND = "tick";

export const DEFAULT_WINNER_SOUND = "success";
