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

const MAX_PIECES = 160;

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
    size: between(6, 11),
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

  if (style === "minimal") {
    /*
     * A small, soft fan of pieces from the wheel.
     */
    for (let index = 0; index < 40 * share; index += 1) {
      pieces.push(
        makePiece(
          focus.x,
          focus.y,
          toRadians(between(-135, -45)),
          between(0.2, 0.45) * size * 1.2,
          "paper",
          {
            size: between(5, 8),
            gravity: 55,
            drag: 1.2,
            life: between(3.6, 4.2),
          },
        ),
      );
    }
  } else if (style === "burst") {
    /*
     * One round burst from the middle of the wheel.
     */
    for (let index = 0; index < 90 * share; index += 1) {
      pieces.push(
        makePiece(
          focus.x,
          focus.y,
          between(0, Math.PI * 2),
          between(0.2, 0.55) * size * 1.4,
          Math.random() < 0.25 ? "dot" : "paper",
          {
            gravity: 40,
            drag: 1.4,
            life: between(5, 5.6),
          },
        ),
      );
    }
  } else if (style === "celebration") {
    /*
     * Two cannons from the bottom corners, then a
     * light rain from the top.
     */
    const cannons = Math.floor(120 * share);
    const rain = Math.floor(40 * share);

    for (let index = 0; index < cannons; index += 1) {
      const left = index % 2 === 0;

      pieces.push(
        makePiece(
          left ? 0 : width,
          height,
          toRadians(
            left
              ? between(-80, -55)
              : between(-125, -100),
          ),
          between(0.45, 0.8) * size * 1.3,
          Math.random() < 0.2 ? "dot" : "paper",
          {
            delay: between(0, 0.4),
            gravity: 45,
            drag: 1.3,
            life: between(6.5, 7.5),
          },
        ),
      );
    }

    for (let index = 0; index < rain; index += 1) {
      pieces.push(
        makePiece(
          between(0, width),
          -12,
          Math.PI / 2,
          between(25, 45),
          "paper",
          {
            delay: between(0, 2.5),
            gravity: 30,
            drag: 0.8,
            life: between(4.5, 5.3),
          },
        ),
      );
    }
  } else if (style === "fireworks") {
    /*
     * Four bursts of bright streaks in the upper part
     * of the screen, one after another.
     */
    const delays = [0, 1, 2, 3.2];

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
        index < 38 * share;
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
              size: between(2, 3.5),
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
