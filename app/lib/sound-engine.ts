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

let noiseBuffer: AudioBuffer | null = null;

function getNoiseBuffer(
  target: AudioContext,
): AudioBuffer {
  if (noiseBuffer) {
    return noiseBuffer;
  }

  const length = Math.floor(
    target.sampleRate * 0.05,
  );
  const buffer = target.createBuffer(
    1,
    length,
    target.sampleRate,
  );
  const samples = buffer.getChannelData(0);

  for (let index = 0; index < length; index += 1) {
    samples[index] = Math.random() * 2 - 1;
  }

  noiseBuffer = buffer;

  return buffer;
}

/*
 * One short sound as a slice edge passes the
 * pointer. "strength" is 1 for a single edge and
 * grows a little when several went by together.
 * Does nothing for "none", an unknown name, or
 * when sound should stay quiet.
 */
export function playSpinTick(
  sound: string,
  strength = 1,
) {
  try {
    if (
      sound !== "tick" &&
      sound !== "click" &&
      sound !== "pop"
    ) {
      return;
    }

    const target = getSoundOutput();

    if (!target) {
      return;
    }

    const { context: audio, output } = target;
    const start = audio.currentTime;
    const peak =
      0.45 * Math.min(1.5, Math.max(0.5, strength));
    const envelope = audio.createGain();

    envelope.connect(output);

    if (sound === "click") {
      /*
       * A dull knock: a burst of noise with the
       * highs and lows taken off.
       */
      const source = audio.createBufferSource();
      const filter = audio.createBiquadFilter();

      source.buffer = getNoiseBuffer(audio);
      filter.type = "bandpass";
      filter.frequency.value =
        1800 + Math.random() * 400;
      filter.Q.value = 1.2;
      source.connect(filter);
      filter.connect(envelope);

      envelope.gain.setValueAtTime(peak, start);
      envelope.gain.exponentialRampToValueAtTime(
        0.001,
        start + 0.025,
      );

      source.start(start);
      source.stop(start + 0.03);

      return;
    }

    const oscillator = audio.createOscillator();

    oscillator.type = "sine";

    if (sound === "pop") {
      /*
       * A soft bubble: a low note that drops fast.
       */
      oscillator.frequency.setValueAtTime(
        620,
        start,
      );
      oscillator.frequency.exponentialRampToValueAtTime(
        160,
        start + 0.06,
      );

      envelope.gain.setValueAtTime(peak, start);
      envelope.gain.exponentialRampToValueAtTime(
        0.001,
        start + 0.075,
      );

      oscillator.connect(envelope);
      oscillator.start(start);
      oscillator.stop(start + 0.08);

      return;
    }

    /*
     * A light tick: a high note that falls a little,
     * with a tiny change in pitch each time.
     */
    const pitch = 1500 * (0.95 + Math.random() * 0.1);

    oscillator.frequency.setValueAtTime(
      pitch,
      start,
    );
    oscillator.frequency.exponentialRampToValueAtTime(
      pitch * 0.6,
      start + 0.02,
    );

    envelope.gain.setValueAtTime(peak, start);
    envelope.gain.exponentialRampToValueAtTime(
      0.001,
      start + 0.025,
    );

    oscillator.connect(envelope);
    oscillator.start(start);
    oscillator.stop(start + 0.03);
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
