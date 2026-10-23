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
 * Lets a sound preview in Settings play while Enable sound
 * is off. It does not change the saved setting. Volume 0 and
 * a hidden page still keep it silent, and changing the
 * Enable sound setting (for example with the speaker button)
 * turns it off again.
 */
let previewOverride = false;

export function allowPreview(allowed: boolean) {
  previewOverride = allowed;
}

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
  } else {
    stopWinnerSound();
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
  if (settings.enabled !== soundEnabled) {
    previewOverride = false;
  }

  soundEnabled = settings.enabled;
  volume = settings.volume;

  applyVolume();

  if (
    (!soundEnabled && !previewOverride) ||
    volume <= 0
  ) {
    stopWinnerSound();
  }
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
    /* These ids must stay in step with sound-options.ts. */
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
 * Winner sounds. Everything a winner sound plays is
 * routed through one "bus" gain, so a sound that is
 * still going can be faded out when the next spin
 * starts, when sound is turned off, or when the page
 * is hidden.
 */
const winnerBuses = new Set<GainNode>();

let winnerRequest = 0;

let applauseBuffer: AudioBuffer | null = null;

/*
 * The loudest point of the applause. It is kept well below
 * the notes of the other winner sounds.
 */
const APPLAUSE_LEVEL = 0.55;

/*
 * Decoded uploaded sounds, kept by their data URL.
 * null means the file could not be decoded, so it is
 * not tried again. Only the last few are kept, since
 * a decoded sound is much bigger than the file.
 */
const MAX_CACHED_SOUNDS = 4;

const decodedSounds = new Map<
  string,
  AudioBuffer | null
>();

const decodingSounds = new Map<
  string,
  Promise<AudioBuffer | null>
>();

export function stopWinnerSound() {
  winnerRequest += 1;

  try {
    for (const bus of winnerBuses) {
      try {
        if (context) {
          bus.gain.cancelScheduledValues(
            context.currentTime,
          );
          bus.gain.setTargetAtTime(
            0,
            context.currentTime,
            0.015,
          );
        }
      } catch {
        // Fall through to disconnecting it.
      }

      window.setTimeout(() => {
        try {
          bus.disconnect();
        } catch {
          // Already gone.
        }
      }, 150);
    }

    winnerBuses.clear();
  } catch {
    // Keep going without sound.
  }
}

function openWinnerBus(
  target: SoundOutput,
  seconds: number,
): GainNode {
  const bus = target.context.createGain();

  bus.connect(target.output);
  winnerBuses.add(bus);

  window.setTimeout(() => {
    if (winnerBuses.delete(bus)) {
      try {
        bus.disconnect();
      } catch {
        // Already gone.
      }
    }
  }, (seconds + 0.3) * 1000);

  return bus;
}

function playNote(
  audio: AudioContext,
  bus: GainNode,
  type: OscillatorType,
  frequency: number,
  begin: number,
  length: number,
  peak: number,
) {
  const oscillator = audio.createOscillator();
  const envelope = audio.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(
    frequency,
    begin,
  );

  envelope.gain.setValueAtTime(0, begin);
  envelope.gain.linearRampToValueAtTime(
    peak,
    begin + 0.01,
  );
  envelope.gain.exponentialRampToValueAtTime(
    0.001,
    begin + length,
  );

  oscillator.connect(envelope);
  envelope.connect(bus);
  oscillator.start(begin);
  oscillator.stop(begin + length + 0.05);
}

function playSuccess(
  audio: AudioContext,
  bus: GainNode,
) {
  /*
   * Four rising notes (C, E, G, high C) that end on a
   * longer one.
   */
  const begin = audio.currentTime;

  playNote(audio, bus, "triangle", 523.25, begin, 0.35, 0.3);
  playNote(audio, bus, "triangle", 659.25, begin + 0.11, 0.35, 0.3);
  playNote(audio, bus, "triangle", 783.99, begin + 0.22, 0.35, 0.3);
  playNote(audio, bus, "triangle", 1046.5, begin + 0.33, 0.9, 0.32);
}

function playChime(
  audio: AudioContext,
  bus: GainNode,
) {
  /*
   * Two bell strikes. Each is a pure note plus softer
   * notes above it that die away faster.
   */
  const begin = audio.currentTime;

  const strikes = [
    { at: 0, base: 1318.5, level: 1 },
    { at: 0.3, base: 1568, level: 0.7 },
  ];

  const partials = [
    { ratio: 1, gain: 0.35, length: 1.6 },
    { ratio: 1.5, gain: 0.2, length: 1.1 },
    { ratio: 2, gain: 0.12, length: 0.7 },
    { ratio: 2.52, gain: 0.06, length: 0.45 },
  ];

  for (const strike of strikes) {
    for (const partial of partials) {
      playNote(
        audio,
        bus,
        "sine",
        strike.base * partial.ratio,
        begin + strike.at,
        partial.length,
        partial.gain * strike.level,
      );
    }
  }
}

/*
 * How many claps per second the whole crowd makes, at a
 * moment in the applause. It builds up, stays busy for a
 * moment, then thins out.
 */
const APPLAUSE_SECONDS = 2.6;

const APPLAUSE_BUSIEST = 54;

function getClapRate(time: number): number {
  if (time < 0.9) {
    return 6 + (APPLAUSE_BUSIEST - 6) * (time / 0.9);
  }

  if (time < 1.4) {
    return APPLAUSE_BUSIEST;
  }

  return Math.max(
    4,
    APPLAUSE_BUSIEST * (1 - (time - 1.4) / 1.2),
  );
}

function playApplause(
  audio: AudioContext,
  bus: GainNode,
) {
  /*
   * A small crowd, about two and a half seconds, kept
   * quiet. Three layers share one swell that rises, eases
   * back and fades:
   *
   * - A soft hiss of the room: noise with the lows and
   *   highs taken off.
   * - Three groups of people, each with its own random
   *   claps (short bursts of noise, each with a slightly
   *   different tone). They sit left, middle and right
   *   where the browser can pan them.
   *
   * Claps come close together in the middle and are
   * sparse at the start and the end.
   */
  if (!applauseBuffer) {
    const size = Math.floor(audio.sampleRate * 3);
    const buffer = audio.createBuffer(
      1,
      size,
      audio.sampleRate,
    );
    const samples = buffer.getChannelData(0);

    for (let index = 0; index < size; index += 1) {
      samples[index] = Math.random() * 2 - 1;
    }

    applauseBuffer = buffer;
  }

  const begin = audio.currentTime;
  const end = begin + APPLAUSE_SECONDS;
  const swell = audio.createGain();

  swell.connect(bus);
  swell.gain.setValueAtTime(0.001, begin);
  swell.gain.linearRampToValueAtTime(
    APPLAUSE_LEVEL,
    begin + 0.7,
  );
  swell.gain.linearRampToValueAtTime(
    APPLAUSE_LEVEL * 0.7,
    begin + 1.5,
  );
  swell.gain.exponentialRampToValueAtTime(0.001, end);

  const room = audio.createBufferSource();
  const roomLow = audio.createBiquadFilter();
  const roomHigh = audio.createBiquadFilter();
  const roomGain = audio.createGain();

  room.buffer = applauseBuffer;
  roomLow.type = "highpass";
  roomLow.frequency.value = 450;
  roomHigh.type = "lowpass";
  roomHigh.frequency.value = 2600;
  roomGain.gain.value = 0.16;

  room.connect(roomLow);
  roomLow.connect(roomHigh);
  roomHigh.connect(roomGain);
  roomGain.connect(swell);
  room.start(begin, Math.random() * 0.3);
  room.stop(end + 0.05);

  const groups = [
    { pan: -0.8, tone: 1500 },
    { pan: 0, tone: 2300 },
    { pan: 0.8, tone: 3100 },
  ];

  for (const group of groups) {
    const source = audio.createBufferSource();
    const filter = audio.createBiquadFilter();
    const claps = audio.createGain();

    source.buffer = applauseBuffer;
    filter.type = "bandpass";
    filter.Q.value = 1;
    filter.frequency.setValueAtTime(group.tone, begin);
    claps.gain.setValueAtTime(0, begin);

    source.connect(filter);
    filter.connect(claps);

    if (typeof audio.createStereoPanner === "function") {
      const panner = audio.createStereoPanner();

      panner.pan.value = group.pan;
      claps.connect(panner);
      panner.connect(swell);
    } else {
      claps.connect(swell);
    }

    /*
     * Claps for this group: random times, thinned to
     * follow the crowd's rate. Times only go forward and
     * never overlap, which the gain automation needs.
     */
    let clock = 0;

    for (;;) {
      clock +=
        -Math.log(1 - Math.random()) /
        (APPLAUSE_BUSIEST / groups.length);

      if (clock >= APPLAUSE_SECONDS) {
        break;
      }

      if (
        Math.random() >
        getClapRate(clock) / APPLAUSE_BUSIEST
      ) {
        continue;
      }

      const clapStart = begin + clock;
      const length = 0.012 + Math.random() * 0.028;
      const level = 0.4 + Math.random() * 0.6;

      filter.frequency.setValueAtTime(
        group.tone * (0.7 + Math.random() * 0.7),
        clapStart,
      );
      claps.gain.setValueAtTime(0, clapStart);
      claps.gain.linearRampToValueAtTime(
        level,
        clapStart + 0.002,
      );
      claps.gain.exponentialRampToValueAtTime(
        0.001,
        clapStart + length,
      );

      clock += length + 0.002;
    }

    source.start(begin, Math.random() * 0.3);
    source.stop(end + 0.05);
  }
}

function playPresetWinnerSound(
  sound: string,
) {
  /* These ids must stay in step with sound-options.ts. */
  if (
    sound !== "success" &&
    sound !== "chime" &&
    sound !== "applause"
  ) {
    return;
  }

  const target = getSoundOutput();

  if (!target) {
    return;
  }

  const seconds =
    sound === "applause" ? 3 : 2;
  const bus = openWinnerBus(target, seconds);

  if (sound === "success") {
    playSuccess(target.context, bus);
  } else if (sound === "chime") {
    playChime(target.context, bus);
  } else {
    playApplause(target.context, bus);
  }
}

function decodeAudioFile(
  audio: AudioContext,
  data: ArrayBuffer,
): Promise<AudioBuffer> {
  /*
   * Older Safari only takes callbacks.
   */
  return new Promise((resolve, reject) => {
    const decoding = audio.decodeAudioData(
      data,
      resolve,
      reject,
    );

    if (decoding && decoding.catch) {
      decoding.catch(reject);
    }
  });
}

function rememberSound(
  url: string,
  buffer: AudioBuffer | null,
) {
  decodedSounds.delete(url);
  decodedSounds.set(url, buffer);

  while (decodedSounds.size > MAX_CACHED_SOUNDS) {
    const oldest = decodedSounds.keys().next();

    if (oldest.done) {
      break;
    }

    decodedSounds.delete(oldest.value);
  }
}

function decodeEntrySound(
  url: string,
): Promise<AudioBuffer | null> {
  const known = decodedSounds.get(url);

  if (known !== undefined) {
    return Promise.resolve(known);
  }

  const running = decodingSounds.get(url);

  if (running) {
    return running;
  }

  const audio = context;

  if (!audio) {
    return Promise.resolve(null);
  }

  const job = fetch(url)
    .then((response) => response.arrayBuffer())
    .then((data) => decodeAudioFile(audio, data))
    .then(
      (buffer): AudioBuffer | null => buffer,
      (): AudioBuffer | null => null,
    )
    .then((buffer) => {
      rememberSound(url, buffer);
      decodingSounds.delete(url);

      return buffer;
    });

  decodingSounds.set(url, job);

  return job;
}

/*
 * Starts decoding an uploaded sound ahead of time, so
 * it is ready when the wheel stops. The result is
 * ignored here. Safe with nothing, or with a file
 * that cannot be decoded.
 */
export function prepareEntrySound(
  url: string | undefined,
) {
  try {
    if (url) {
      decodeEntrySound(url).catch(() => {
        // Nothing to do: the winner falls back later.
      });
    }
  } catch {
    // Keep going without sound.
  }
}

/*
 * Plays the winner sound. An uploaded sound on the
 * winning entry replaces the one chosen in Settings,
 * even when that one is None. If the uploaded sound
 * cannot be decoded or played, the Settings sound
 * plays instead and nothing is shown.
 */
export function playWinnerSound(
  sound: string,
  entrySound?: string,
) {
  try {
    stopWinnerSound();

    const request = winnerRequest;

    if (!entrySound) {
      playPresetWinnerSound(sound);

      return;
    }

    decodeEntrySound(entrySound)
      .then((buffer) => {
        if (request !== winnerRequest) {
          return;
        }

        const target = getSoundOutput();

        if (buffer && target) {
          const bus = openWinnerBus(
            target,
            buffer.duration,
          );
          const source =
            target.context.createBufferSource();

          source.buffer = buffer;
          source.connect(bus);
          source.start(0);

          return;
        }

        if (!buffer) {
          playPresetWinnerSound(sound);
        }
      })
      .catch(() => {
        try {
          if (request === winnerRequest) {
            playPresetWinnerSound(sound);
          }
        } catch {
          // Keep going without sound.
        }
      });
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
      (!soundEnabled && !previewOverride) ||
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
