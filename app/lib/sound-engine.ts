import {
  DEFAULT_SOUND_ENABLED,
  DEFAULT_VOLUME,
} from "./wheel-defaults";

/*
 * Shared audio output for the whole page.
 *
 * Nothing here runs while the module loads, because
 * Next.js also loads client modules on the server.
 * The AudioContext is created the first time it is
 * needed. Every call is wrapped so a missing or
 * broken audio system can never stop a spin.
 */

type AudioContextConstructor =
  typeof AudioContext;

type SoundOutput = {
  context: AudioContext;
  output: GainNode;
};

let context: AudioContext | null = null;

let masterGain: GainNode | null = null;

let soundEnabled = DEFAULT_SOUND_ENABLED;

let volume = DEFAULT_VOLUME;

let listeningForVisibility = false;

/*
 * Maps the 0 to 100 volume setting to a gain.
 * Squaring it follows how loudness is heard, so
 * the lower half of the slider is not too loud.
 */
export function volumeToGain(
  value: number,
): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const level =
    Math.min(100, Math.max(0, value)) / 100;

  return level * level;
}

function getContextConstructor():
  AudioContextConstructor | null {
  if (typeof window === "undefined") {
    return null;
  }

  const audioWindow = window as unknown as {
    AudioContext?: AudioContextConstructor;
    webkitAudioContext?: AudioContextConstructor;
  };

  return (
    audioWindow.AudioContext ??
    audioWindow.webkitAudioContext ??
    null
  );
}

function isPageVisible(): boolean {
  return (
    typeof document === "undefined" ||
    document.visibilityState !== "hidden"
  );
}

function applyVolume() {
  if (!masterGain) {
    return;
  }

  try {
    masterGain.gain.value =
      volumeToGain(volume);
  } catch {
    // Keep going without a volume change.
  }
}

function resumeContext() {
  if (!context || context.state === "running") {
    return;
  }

  try {
    const resumed = context.resume();

    if (resumed) {
      resumed.catch(() => {
        // The browser refused. A later tap tries again.
      });
    }
  } catch {
    // Keep going without sound.
  }
}

function handleVisibilityChange() {
  if (isPageVisible()) {
    resumeContext();
  }
}

function listenForVisibility() {
  if (
    listeningForVisibility ||
    typeof document === "undefined"
  ) {
    return;
  }

  document.addEventListener(
    "visibilitychange",
    handleVisibilityChange,
  );

  listeningForVisibility = true;
}

function ensureContext(): AudioContext | null {
  if (context) {
    return context;
  }

  try {
    const Constructor =
      getContextConstructor();

    if (!Constructor) {
      return null;
    }

    const created = new Constructor();
    const gain = created.createGain();

    context = created;
    masterGain = gain;

    applyVolume();
    gain.connect(created.destination);
    listenForVisibility();

    return context;
  } catch {
    context = null;
    masterGain = null;

    return null;
  }
}

/*
 * Keeps the engine in step with the wheel's saved
 * settings. Safe to call at any time, before or
 * after the context exists.
 */
export function setSoundSettings(settings: {
  enabled: boolean;
  volume: number;
}) {
  soundEnabled = settings.enabled;
  volume = settings.volume;

  applyVolume();
}

/*
 * Call this straight from the tap on Spin. On
 * iPhone the context only starts from a tap, so it
 * is created or resumed here and a silent buffer is
 * played to open the output. It ignores the sound
 * settings so the first sound after a tap can play.
 */
export function unlock() {
  try {
    const unlocked = ensureContext();

    if (!unlocked) {
      return;
    }

    resumeContext();

    const buffer = unlocked.createBuffer(
      1,
      1,
      22050,
    );
    const source =
      unlocked.createBufferSource();

    source.buffer = buffer;
    source.connect(unlocked.destination);
    source.start(0);
  } catch {
    // Keep going without sound.
  }
}

/*
 * The place to connect a sound to, or null when it
 * should stay quiet: sound off, volume 0, the page
 * hidden, or the context missing or not running. A
 * sound started while the context is stopped would
 * play late, so it is skipped.
 */
export function getSoundOutput():
  SoundOutput | null {
  try {
    if (
      !soundEnabled ||
      volume <= 0 ||
      !isPageVisible() ||
      !context ||
      !masterGain ||
      context.state !== "running"
    ) {
      return null;
    }

    return {
      context,
      output: masterGain,
    };
  } catch {
    return null;
  }
}
