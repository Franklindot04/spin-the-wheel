import {
  allowPreview,
  playSpinTick,
  playWinnerSound,
  stopWinnerSound,
  unlock,
} from "./sound-engine";

/*
 * Short previews for the Settings panel. They use the same
 * sounds as a real spin and a real winner. Nothing here runs
 * while the module loads, because Next.js also loads client
 * modules on the server.
 */

export const SPIN_DEMO_SECONDS = 1.5;

/*
 * How long each winner sound lasts, with a little extra, so
 * the button can go back to Play when the sound is over.
 */
const WINNER_SECONDS: Record<string, number> = {
  success: 1.4,
  chime: 2.1,
  applause: 2.8,
};

/*
 * The demo turns a wheel about two full turns with the same
 * easing the real wheel uses. A tick plays each time it
 * passes a peg, so the ticks start fast and slow down.
 */
const DEMO_DEGREES = 720;

const DEMO_PEG_DEGREES = 20;

const MIN_TICK_GAP_MS = 32;

function bezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;

  const x = (t: number) =>
    ((ax * t + bx) * t + cx) * t;

  const y = (t: number) =>
    ((ay * t + by) * t + cy) * t;

  return (progress: number) => {
    let low = 0;
    let high = 1;

    for (let step = 0; step < 30; step += 1) {
      const middle = (low + high) / 2;

      if (x(middle) < progress) {
        low = middle;
      } else {
        high = middle;
      }
    }

    return y((low + high) / 2);
  };
}

/*
 * The times, in milliseconds from the start, when the
 * spin demo plays a tick.
 */
export function getSpinDemoTimes(): number[] {
  const ease = bezier(0.12, 0.7, 0.2, 1);
  const times: number[] = [];
  let pegs = 0;
  let lastAt = -Infinity;

  for (let at = 0; at <= SPIN_DEMO_SECONDS * 1000; at += 4) {
    const turned =
      DEMO_DEGREES *
      ease(at / (SPIN_DEMO_SECONDS * 1000));
    const passed = Math.floor(turned / DEMO_PEG_DEGREES);

    if (passed > pegs && at - lastAt >= MIN_TICK_GAP_MS) {
      pegs = passed;
      lastAt = at;
      times.push(at);
    }
  }

  return times;
}

let timers: number[] = [];

let whenOver: (() => void) | null = null;

function clearTimers() {
  for (const timer of timers) {
    window.clearTimeout(timer);
  }

  timers = [];
}

function handleHidden() {
  if (document.visibilityState === "hidden") {
    finish();
  }
}

/*
 * Stops a preview that is playing. It does not call the
 * callback, so the caller can reset its own button.
 */
export function stopPreview() {
  clearTimers();
  stopWinnerSound();
  allowPreview(false);
  whenOver = null;

  if (typeof document !== "undefined") {
    document.removeEventListener(
      "visibilitychange",
      handleHidden,
    );
  }
}

/*
 * The sound ran out, or the page was hidden: stop and tell
 * the caller so it can go back to Play.
 */
function finish() {
  const callback = whenOver;

  stopPreview();
  callback?.();
}

function begin(
  soundEnabled: boolean,
  onOver: () => void,
) {
  stopPreview();

  /*
   * Runs inside the tap, so iPhone allows sound.
   */
  unlock();

  /*
   * Play still works with Enable sound off. Volume 0 and a
   * hidden page keep it silent.
   */
  allowPreview(!soundEnabled);

  whenOver = onOver;

  document.addEventListener(
    "visibilitychange",
    handleHidden,
  );
}

export function startSpinPreview(
  sound: string,
  soundEnabled: boolean,
  onOver: () => void,
) {
  try {
    begin(soundEnabled, onOver);

    for (const at of getSpinDemoTimes()) {
      timers.push(
        window.setTimeout(
          () => playSpinTick(sound),
          at,
        ),
      );
    }

    timers.push(
      window.setTimeout(
        finish,
        SPIN_DEMO_SECONDS * 1000 + 80,
      ),
    );
  } catch {
    // Keep going without sound.
  }
}

export function startWinnerPreview(
  sound: string,
  soundEnabled: boolean,
  onOver: () => void,
) {
  try {
    begin(soundEnabled, onOver);
    playWinnerSound(sound);

    timers.push(
      window.setTimeout(
        finish,
        (WINNER_SECONDS[sound] ?? 1.5) * 1000,
      ),
    );
  } catch {
    // Keep going without sound.
  }
}
