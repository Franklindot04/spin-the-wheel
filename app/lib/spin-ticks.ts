/*
 * Works out when a slice edge passes the pointer
 * while the wheel turns, so a sound can be played
 * for it. It uses the same slice geometry as the
 * wheel: slice starts in degrees, and the pointer
 * at angle 0 reading (360 - rotation) % 360.
 *
 * It knows nothing about audio or the page, so it
 * can be tested on its own.
 */

/*
 * At the start of a spin the wheel can pass many
 * slice edges in one frame. Sounds closer together
 * than this are merged into one, which keeps the
 * rate at about 30 per second at most.
 */
export const MIN_TICK_GAP_MS = 32;

function positiveModulo(
  value: number,
  divisor: number,
): number {
  return (
    ((value % divisor) + divisor) %
    divisor
  );
}

function countStartsUpTo(
  starts: number[],
  angle: number,
): number {
  let low = 0;
  let high = starts.length;

  while (low < high) {
    const middle = (low + high) >> 1;

    if (starts[middle] <= angle) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }

  return low;
}

/*
 * A running total of slice edges the pointer has
 * passed, counting each full turn. Only the
 * difference between two totals matters.
 */
function edgeTotal(
  starts: number[],
  pointerAngle: number,
): number {
  return (
    Math.floor(pointerAngle / 360) *
      starts.length +
    countStartsUpTo(
      starts,
      positiveModulo(pointerAngle, 360),
    )
  );
}

export type TickTracker = {
  /*
   * Give it the wheel's current rotation in degrees
   * (any whole turns are fine) and the time in
   * milliseconds. It returns 0 when nothing should
   * play. Otherwise it returns how many edges went
   * by since the last sound, so a fast stretch can
   * be a little louder.
   */
  update: (
    rotation: number,
    now: number,
  ) => number;
};

export function createTickTracker(
  sliceStarts: number[],
  minGapMs = MIN_TICK_GAP_MS,
): TickTracker {
  let lastRotation: number | null = null;
  let unwrapped = 0;
  let lastTotal = 0;
  let pendingEdges = 0;
  let lastTickAt = -Infinity;

  return {
    update(rotation, now) {
      if (
        sliceStarts.length === 0 ||
        !Number.isFinite(rotation)
      ) {
        return 0;
      }

      if (lastRotation === null) {
        lastRotation = rotation;
        unwrapped = rotation;
        lastTotal = edgeTotal(
          sliceStarts,
          -unwrapped,
        );

        return 0;
      }

      /*
       * The wheel only turns forward. A step that
       * looks like almost a full turn backward is
       * rounding noise from a wheel that has stopped.
       */
      let step = positiveModulo(
        rotation - lastRotation,
        360,
      );

      if (step > 359.5) {
        step = 0;
      }

      lastRotation = rotation;
      unwrapped += step;

      const total = edgeTotal(
        sliceStarts,
        -unwrapped,
      );

      pendingEdges += Math.abs(
        total - lastTotal,
      );

      lastTotal = total;

      if (
        pendingEdges === 0 ||
        now - lastTickAt < minGapMs
      ) {
        return 0;
      }

      const edges = pendingEdges;

      pendingEdges = 0;
      lastTickAt = now;

      return edges;
    },
  };
}
