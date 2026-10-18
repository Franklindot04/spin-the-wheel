import type { ConfettiEffect } from "./wheel-types";

/*
 * Confetti drawn on a canvas. It is started from a
 * winner, runs on one animation loop, and cleans up
 * after itself. Nothing here runs while the module
 * loads, because Next.js also loads client modules on
 * the server.
 */

export type ConfettiFocus = {
  x: number;
  y: number;
};

export type ConfettiShow = {
  stop: () => void;
};

/*
 * Bright colours that look good on every page theme.
 */
const COLORS = [
  "#f43f5e",
  "#f59e0b",
  "#facc15",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
];

const MAX_PIECES = 240;

const MAX_PIXEL_RATIO = 2;

/*
 * Below this size (the shorter side of the canvas, in
 * pixels) a phone-sized screen gets fewer pieces.
 */
const SMALL_SCREEN = 520;

const SMALL_SCREEN_SHARE = 0.6;

type Piece = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  drag: number;
  size: number;
  angle: number;
  turn: number;
  flap: number;
  phase: number;
  color: string;
  shape: "paper" | "dot" | "spark";
  delay: number;
  life: number;
  age: number;
};

function between(
  low: number,
  high: number,
): number {
  return low + Math.random() * (high - low);
}

function pick<T>(items: T[]): T {
  return items[
    Math.floor(Math.random() * items.length)
  ];
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function makePiece(
  x: number,
  y: number,
  angle: number,
  speed: number,
  shape: Piece["shape"],
  options: Partial<Piece>,
): Piece {
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    gravity: 800,
    drag: 1.2,
    size: between(8, 14),
    angle: between(0, Math.PI * 2),
    turn: between(-9, 9),
    flap: between(6, 12),
    phase: between(0, Math.PI * 2),
    color: pick(COLORS),
    shape,
    delay: 0,
    life: between(2, 2.6),
    age: 0,
    ...options,
  };
}

function buildPieces(
  style: ConfettiEffect,
  width: number,
  height: number,
  focus: ConfettiFocus,
): Piece[] {
  /*
   * Pieces fly a distance that depends on the size of the
   * canvas, then drift down slowly, so on a phone they
   * stay on the screen as long as on a desktop. "reach" is
   * how far a piece would travel with no gravity: its
   * speed is the reach times its drag.
   */
  const size = Math.min(width, height);
  const share =
    size < SMALL_SCREEN ? SMALL_SCREEN_SHARE : 1;
  const pieces: Piece[] = [];

  /*
   * New pieces keep coming through the show so the middle
   * is never empty. A late piece lives only until the end
   * of the show, so the length does not change.
   */
  function addTrickle(
    count: number,
    firstAt: number,
    lastAt: number,
    endAt: number,
    shortest: number,
    longest: number,
    make: (options: Partial<Piece>) => Piece,
  ) {
    for (let index = 0; index < count * share; index += 1) {
      const delay = between(firstAt, lastAt);

      pieces.push(
        make({
          delay,
          life: Math.min(
            between(shortest, longest),
            endAt - delay,
          ),
        }),
      );
    }
  }

  if (style === "minimal") {
    /*
     * A small, soft fan of pieces from the wheel. This is
     * the lightest style, with the fewest pieces.
     */
    const fan = (options: Partial<Piece>, reach: number) =>
      makePiece(
        focus.x,
        focus.y,
        toRadians(between(-150, -30)),
        reach * size * 1.2,
        "paper",
        {
          size: between(6, 10),
          gravity: 55,
          drag: 1.2,
          ...options,
        },
      );

    /*
     * Most of the opening goes up in the first 0.3 s.
     */
    for (let index = 0; index < 56 * share; index += 1) {
      pieces.push(
        fan(
          {
            delay: between(0, 0.3),
            life: between(3.6, 3.9),
          },
          between(0.35, 0.85),
        ),
      );
    }

    addTrickle(30, 0.4, 2.6, 4.1, 2, 2.4, (options) =>
      fan(options, between(0.2, 0.5)),
    );
  } else if (style === "burst") {
    /*
     * One round burst from the middle of the wheel, then
     * a string of small pops.
     */
    const pop = (
      x: number,
      y: number,
      options: Partial<Piece>,
      reach: number,
    ) =>
      makePiece(
        x,
        y,
        between(0, Math.PI * 2),
        reach * size * 1.4,
        Math.random() < 0.25 ? "dot" : "paper",
        { gravity: 40, drag: 1.4, ...options },
      );

    /*
     * The opening burst, from the middle of the wheel in
     * the first 0.3 s.
     */
    for (let index = 0; index < 80 * share; index += 1) {
      pieces.push(
        pop(
          focus.x,
          focus.y,
          {
            delay: between(0, 0.3),
            life: between(5, 5.3),
          },
          between(0.25, 0.7),
        ),
      );
    }

    /*
     * Then 19 small pops, about a quarter of a second
     * apart. They alternate between the middle of the
     * wheel and random points around it.
     */
    for (let burst = 0; burst < 19; burst += 1) {
      const at = 0.3 + burst * 0.24 + between(0, 0.08);
      const angle = between(0, Math.PI * 2);
      const away = between(0.15, 0.45) * size;
      const around = burst % 2 === 1;
      const x = around
        ? Math.min(
            width,
            Math.max(0, focus.x + Math.cos(angle) * away),
          )
        : focus.x;
      const y = around
        ? Math.min(
            height,
            Math.max(0, focus.y + Math.sin(angle) * away),
          )
        : focus.y;

      for (
        let index = 0;
        index < 8 * share;
        index += 1
      ) {
        pieces.push(
          pop(
            x,
            y,
            {
              delay: at + between(0, 0.05),
              life: Math.min(
                between(2.4, 3),
                5.5 - at,
              ),
            },
            between(0.12, 0.3),
          ),
        );
      }
    }
  } else if (style === "celebration") {
    /*
     * Two cannons from the bottom corners, then more
     * smaller shots and a light rain from the top.
     */
    const shoot = (
      options: Partial<Piece>,
      reach: number,
    ) => {
      const left = Math.random() < 0.5;

      return makePiece(
        left ? 0 : width,
        height,
        toRadians(
          left
            ? between(-88, -32)
            : between(-148, -92),
        ),
        reach * size * 1.3,
        Math.random() < 0.2 ? "dot" : "paper",
        { gravity: 45, drag: 1.3, ...options },
      );
    };

    /*
     * The opening, all in the first 0.3 s: cannons from the
     * bottom corners, sprays from the sides, and a shower
     * from the top, so the whole screen fills at once.
     */
    for (let index = 0; index < 70 * share; index += 1) {
      pieces.push(
        shoot(
          {
            delay: between(0, 0.3),
            life: between(6.5, 7.5),
          },
          between(0.7, 1.2),
        ),
      );
    }

    for (let index = 0; index < 25 * share; index += 1) {
      const left = index % 2 === 0;

      pieces.push(
        makePiece(
          left ? 0 : width,
          between(0.25, 0.7) * height,
          toRadians(
            left ? between(-20, 10) : between(170, 200),
          ),
          between(0.5, 1) * size * 1.3,
          Math.random() < 0.2 ? "dot" : "paper",
          {
            delay: between(0, 0.3),
            gravity: 45,
            drag: 1.3,
            life: between(6.5, 7.5),
          },
        ),
      );
    }

    for (let index = 0; index < 45 * share; index += 1) {
      pieces.push(
        makePiece(
          between(0, width),
          -12,
          toRadians(between(70, 110)),
          between(140, 300),
          "paper",
          {
            delay: between(0, 0.3),
            gravity: 45,
            drag: 0.9,
            life: between(6.5, 7.2),
          },
        ),
      );
    }

    addTrickle(45, 0.5, 5.8, 7.5, 2.8, 3.4, (options) =>
      shoot(options, between(0.3, 0.6)),
    );

    addTrickle(55, 0.3, 6.2, 7.6, 3, 4, (options) =>
      makePiece(
        between(0, width),
        -12,
        Math.PI / 2,
        between(25, 45),
        "paper",
        { gravity: 30, drag: 0.8, ...options },
      ),
    );
  } else if (style === "fireworks") {
    /*
     * Six bursts of bright streaks in the upper part of the
     * screen, one after another.
     */
    const delays = [0, 0.6, 1.2, 1.9, 2.6, 3.2];

    delays.forEach((delay, burst) => {
      const centerX =
        burst === 0
          ? focus.x
          : between(width * 0.2, width * 0.8);
      const centerY =
        burst === 0
          ? focus.y
          : between(height * 0.15, height * 0.45);
      const color = pick(COLORS);

      for (
        let index = 0;
        index < 36 * share;
        index += 1
      ) {
        pieces.push(
          makePiece(
            centerX,
            centerY,
            between(0, Math.PI * 2),
            between(0.12, 0.3) * size * 1.2,
            "spark",
            {
              color,
              delay,
              gravity: 40,
              drag: 1.2,
              size: between(2.5, 4),
              life: between(2.6, 3),
            },
          ),
        );
      }
    });
  }

  return pieces.slice(0, MAX_PIECES);
}

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
  } catch {
    return false;
  }
}

/*
 * Starts the confetti on a canvas. Returns null when
 * nothing should be drawn: style None, reduced motion,
 * no canvas support, or a canvas with no size.
 */
export function startConfetti(
  canvas: HTMLCanvasElement,
  style: ConfettiEffect,
  focus?: ConfettiFocus,
): ConfettiShow | null {
  if (
    style === "none" ||
    typeof window === "undefined" ||
    prefersReducedMotion()
  ) {
    return null;
  }

  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  let width = 0;
  let height = 0;
  let ratio = 1;

  function resize() {
    ratio = Math.min(
      MAX_PIXEL_RATIO,
      window.devicePixelRatio || 1,
    );
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
  }

  resize();

  if (width < 1 || height < 1) {
    return null;
  }

  const pieces = buildPieces(
    style,
    width,
    height,
    focus ?? { x: width / 2, y: height * 0.45 },
  );

  let frame = 0;
  let stopped = false;
  let elapsed = 0;
  let last: number | null = null;

  function draw(piece: Piece, fade: number) {
    context!.globalAlpha = fade;
    context!.fillStyle = piece.color;
    context!.strokeStyle = piece.color;

    if (piece.shape === "spark") {
      context!.lineWidth = piece.size;
      context!.lineCap = "round";
      context!.beginPath();
      context!.moveTo(piece.x, piece.y);
      context!.lineTo(
        piece.x - piece.vx * 0.08,
        piece.y - piece.vy * 0.08,
      );
      context!.stroke();

      return;
    }

    context!.save();
    context!.translate(piece.x, piece.y);
    context!.rotate(piece.angle);

    if (piece.shape === "dot") {
      context!.beginPath();
      context!.arc(0, 0, piece.size * 0.4, 0, Math.PI * 2);
      context!.fill();
    } else {
      /*
       * A paper strip that flips as it falls.
       */
      context!.scale(
        1,
        Math.cos(piece.age * piece.flap + piece.phase),
      );
      context!.fillRect(
        -piece.size / 2,
        -piece.size * 0.3,
        piece.size,
        piece.size * 0.6,
      );
    }

    context!.restore();
  }

  function step(now: number) {
    if (stopped) {
      return;
    }

    const seconds =
      last === null
        ? 0
        : Math.min(0.05, (now - last) / 1000);

    last = now;
    elapsed += seconds;

    context!.setTransform(ratio, 0, 0, ratio, 0, 0);
    context!.clearRect(0, 0, width, height);

    let alive = 0;

    for (const piece of pieces) {
      if (piece.age >= piece.life) {
        continue;
      }

      alive += 1;

      if (elapsed < piece.delay) {
        continue;
      }

      piece.age += seconds;

      const damping = Math.exp(-piece.drag * seconds);

      piece.vx *= damping;
      piece.vy = piece.vy * damping + piece.gravity * seconds;
      piece.x += piece.vx * seconds;
      piece.y += piece.vy * seconds;
      piece.angle += piece.turn * seconds;

      draw(
        piece,
        Math.max(
          0,
          Math.min(
            1,
            (piece.life - piece.age) / (piece.life * 0.35),
          ),
        ),
      );
    }

    context!.globalAlpha = 1;

    if (alive === 0) {
      stop();

      return;
    }

    frame = window.requestAnimationFrame(step);
  }

  function handleVisibility() {
    if (document.visibilityState === "hidden") {
      stop();
    }
  }

  const observer =
    typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(() => {
          if (!stopped) {
            resize();
          }
        });

  function stop() {
    if (stopped) {
      return;
    }

    stopped = true;
    window.cancelAnimationFrame(frame);
    document.removeEventListener(
      "visibilitychange",
      handleVisibility,
    );
    observer?.disconnect();
    context!.setTransform(1, 0, 0, 1, 0, 0);
    context!.clearRect(0, 0, canvas.width, canvas.height);
  }

  observer?.observe(canvas);

  document.addEventListener(
    "visibilitychange",
    handleVisibility,
  );

  frame = window.requestAnimationFrame(step);

  return { stop };
}
