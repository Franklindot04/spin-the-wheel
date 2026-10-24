"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import type { ReactNode } from "react";

import type {
  AppearanceThemeConfig,
  ConfettiEffect,
  WheelEntry,
} from "../lib/wheel-types";
import {
  DEFAULT_WHEEL_SIZE,
  MAX_WHEEL_SIZE,
  MIN_WHEEL_SIZE,
} from "../lib/wheel-defaults";
import {
  startConfetti,
  type ConfettiShow,
} from "../lib/confetti";
import {
  playSpinTick,
  stopWinnerSound,
  unlock,
} from "../lib/sound-engine";
import { useT } from "../lib/i18n/provider";
import { DEFAULT_SPIN_SOUND } from "../lib/sound-options";
import { createTickTracker } from "../lib/spin-ticks";
import {
  getEntryWeight,
  truncateGraphemes,
} from "../lib/wheel-utils";

export type { WheelEntry } from "../lib/wheel-types";

type WheelProps = {
  entries: WheelEntry[];
  spinning: boolean;
  rotation: number;
  onSpin: () => void;
  canSpin?: boolean;
  minSpinEntries?: number;
  emptyTitle?: string;
  emptyMessage?: string;
  spinDuration?: number;
  spinSound?: string;
  soundActive?: boolean;
  confettiStyle?: ConfettiEffect;
  confettiRun?: number;
  confettiStop?: number;
  soundEnabled?: boolean;
  onSoundToggle?: () => void;
  pointerMatchSliceColor?: boolean;
  wheelSize?: number;
  onWheelSizeChange?: (size: number) => void;
  accentClass: string;
  accentHoverClass: string;
  theme?: AppearanceThemeConfig;
  expandedResult?: ReactNode;
  /*
   * Shown at the left of the controls row on phones (below md),
   * and not while the wheel is full screen.
   */
  controlsStart?: ReactNode;
  onExpandedChange?: (expanded: boolean) => void;
  /*
   * The winner box. It shows when result is set and the
   * wheel is big enough for it; onBoxFitChange tells the
   * page whether it is, so the page can keep the result
   * panel when it is not.
   */
  result?: WinnerBoxResult | null;
  onContinue?: () => void;
  onRemove?: () => void;
  removeDisabled?: boolean;
  reason?: string;
  /* Why Spin cannot be used, shown under it. Left out in full screen. */
  spinReason?: string;
  onBoxFitChange?: (fits: boolean) => void;
  /*
   * Each time this number goes up, focus moves to Spin (or to
   * Close or the full screen button if Spin cannot be used).
   */
  focusSpinRequest?: number;
  /*
   * The quiz box: the drawn question's label, question and
   * answer, shown once Show Answer is pressed. It uses the same
   * size rule as the winner box. Closing it (Hide Answer, Escape
   * or a click outside) calls onHideAnswer.
   */
  quiz?: QuizBoxData | null;
  onHideAnswer?: () => void;
  onAnotherSpin?: () => void;
  anotherSpinDisabled?: boolean;
};

export type QuizBoxData = {
  label: string;
  emoji?: string;
  image?: string;
  question: string;
  answer: string;
  /* False on the last question, where there is no other spin. */
  canSpinAgain: boolean;
};

export type WinnerBoxResult = {
  label: string;
  emoji?: string;
  image?: string;
};

const SIZE_STEP = 40;
/* Below this wheel width (px) the winner box does not fit. */
export const MIN_WINNER_BOX_WHEEL = 224;
const VIEWBOX_SIZE = 440;
const CENTER = VIEWBOX_SIZE / 2;
const RADIUS = 205;
const LABEL_MAX_WIDTH = 130;
/*
 * Label width budget for an entry with an
 * image. The label ends at LABEL_RADIUS plus
 * half its width, so 86 keeps it within 175.
 * That leaves room for a 24-unit image before
 * the rim gap.
 */
const LABEL_MAX_WIDTH_WITH_IMAGE = 86;
const LABEL_CHAR_WIDTH = 0.6;
const LABEL_RADIUS = 132;
const LABEL_MAX_FONT_SIZE = 15;
const LABEL_MIN_FONT_SIZE = 9;
const HIDE_LABELS_AT = 40;
const EMOJI_ADVANCE = 1.6;
const EMOJI_GLYPH_WIDTH = 1.3;
const EMOJI_GLYPH_HEIGHT = 1.2;
const EMOJI_MIN_FONT_SIZE = 9;
const IMAGE_RADIUS = 175;
const IMAGE_SIZE = 36;
const IMAGE_MIN_SIZE = 12;
const IMAGE_SHRINK_STEP = 0.5;
const IMAGE_EDGE_GAP = 2;
const IMAGE_RIM_GAP = 3;
const IMAGE_LABEL_GAP = 3;

function toIdPart(value: string) {
  /*
   * Keeps letters, digits and "-" and turns
   * anything else, such as the ":" in a React
   * id or a space in an entry id, into its
   * character code. Different values always
   * give different parts, and the result is
   * safe inside url(#...).
   */
  return value.replace(
    /[^A-Za-z0-9-]/g,
    (character) =>
      `_${character.charCodeAt(0).toString(16)}_`,
  );
}

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleInDegrees: number,
) {
  const angleInRadians =
    ((angleInDegrees - 90) * Math.PI) /
    180;

  return {
    x:
      cx +
      radius *
        Math.cos(angleInRadians),
    y:
      cy +
      radius *
        Math.sin(angleInRadians),
  };
}

function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) {
  const start =
    polarToCartesian(
      cx,
      cy,
      radius,
      endAngle,
    );

  const end =
    polarToCartesian(
      cx,
      cy,
      radius,
      startAngle,
    );

  if (
    endAngle - startAngle >= 360
  ) {
    return [
      "M",
      cx - radius,
      cy,
      "A",
      radius,
      radius,
      0,
      1,
      0,
      cx + radius,
      cy,
      "A",
      radius,
      radius,
      0,
      1,
      0,
      cx - radius,
      cy,
      "Z",
    ].join(" ");
  }

  const largeArcFlag =
    endAngle - startAngle <= 180
      ? "0"
      : "1";

  return [
    "M",
    cx,
    cy,
    "L",
    start.x,
    start.y,
    "A",
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
    "Z",
  ].join(" ");
}

function getLabelLayout(
  label: string,
  angle: number,
  emoji: string | undefined,
  maxWidth: number,
) {
  /*
   * The emoji and the gap after it are
   * counted as a constant share of the
   * font size, not by string length.
   */
  const emojiAdvance = emoji
    ? EMOJI_ADVANCE
    : 0;

  for (
    let fontSize =
      LABEL_MAX_FONT_SIZE;
    fontSize >=
    LABEL_MIN_FONT_SIZE;
    fontSize--
  ) {
    const maxChars = Math.floor(
      (maxWidth -
        emojiAdvance * fontSize) /
        (fontSize *
          LABEL_CHAR_WIDTH),
    );

    const fits =
      label.length <= maxChars;

    if (
      !fits &&
      fontSize >
        LABEL_MIN_FONT_SIZE
    ) {
      continue;
    }

    const text = fits
      ? label
      : `${truncateGraphemes(
          label,
          maxChars - 1,
        )}…`;

    const width =
      emojiAdvance * fontSize +
      text.length *
        fontSize *
        LABEL_CHAR_WIDTH;

    const room =
      (LABEL_RADIUS - width / 2) *
      ((angle * Math.PI) / 180);

    const needed = emoji
      ? Math.max(
          fontSize * 0.8 + 2,
          fontSize *
            EMOJI_GLYPH_HEIGHT,
        )
      : fontSize * 0.8 + 2;

    if (needed <= room) {
      return {
        text: emoji
          ? `${emoji} ${text}`
          : text,
        fontSize,
      };
    }
  }

  return null;
}

function getEmojiOnlyLayout(
  emoji: string,
  angle: number,
) {
  for (
    let fontSize =
      LABEL_MAX_FONT_SIZE;
    fontSize >=
    EMOJI_MIN_FONT_SIZE;
    fontSize--
  ) {
    const width =
      fontSize *
      EMOJI_GLYPH_WIDTH;

    const room =
      (LABEL_RADIUS - width / 2) *
      ((angle * Math.PI) / 180);

    if (
      fontSize *
        EMOJI_GLYPH_HEIGHT <=
      room
    ) {
      return {
        text: emoji,
        fontSize,
      };
    }
  }

  return null;
}

function getSliceLayout(
  label: string,
  angle: number,
  emoji: string | undefined,
  hideLabels: boolean,
  maxWidth: number,
) {
  if (hideLabels) {
    return emoji
      ? getEmojiOnlyLayout(
          emoji,
          angle,
        )
      : null;
  }

  return (
    getLabelLayout(
      label,
      angle,
      emoji,
      maxWidth,
    ) ??
    (emoji
      ? getEmojiOnlyLayout(
          emoji,
          angle,
        )
      : null)
  );
}

function getLabelEnd(
  layout: {
    text: string;
    fontSize: number;
  } | null,
  emoji: string | undefined,
  measuredWidth: number | undefined,
) {
  /*
   * Outer end of the drawn label, measured
   * from the wheel center. The label is
   * centered on LABEL_RADIUS. The measured
   * width of the rendered text is used when
   * known. Before that, the width uses the
   * same estimate as the label layout.
   */
  if (!layout) {
    return null;
  }

  if (measuredWidth !== undefined) {
    return (
      LABEL_RADIUS +
      measuredWidth / 2
    );
  }

  const width =
    emoji &&
    layout.text === emoji
      ? layout.fontSize *
        EMOJI_GLYPH_WIDTH
      : emoji
        ? EMOJI_ADVANCE *
            layout.fontSize +
          Math.max(
            0,
            layout.text.length -
              emoji.length -
              1,
          ) *
            layout.fontSize *
            LABEL_CHAR_WIDTH
        : layout.text.length *
          layout.fontSize *
          LABEL_CHAR_WIDTH;

  return LABEL_RADIUS + width / 2;
}

function getImagePlacement(
  angle: number,
  labelEnd: number | null,
) {
  /*
   * The label and its emoji always win.
   * The image goes beyond the label, inside
   * the rim and the slice edges. It shrinks
   * until it fits and is skipped when it
   * would be too small.
   */
  const sinHalf = Math.sin(
    (Math.min(angle, 180) / 2 *
      Math.PI) /
      180,
  );

  for (
    let radius = IMAGE_SIZE / 2;
    radius * 2 >= IMAGE_MIN_SIZE;
    radius -= IMAGE_SHRINK_STEP
  ) {
    const center = Math.max(
      IMAGE_RADIUS,
      labelEnd === null
        ? 0
        : labelEnd +
            IMAGE_LABEL_GAP +
            radius,
    );

    if (
      center + radius >
        RADIUS - IMAGE_RIM_GAP ||
      radius >
        center * sinHalf -
          IMAGE_EDGE_GAP
    ) {
      continue;
    }

    return {
      radius: center,
      scale:
        radius / (IMAGE_SIZE / 2),
    };
  }

  return null;
}

function clampSize(value: number) {
  return Math.min(
    MAX_WHEEL_SIZE,
    Math.max(MIN_WHEEL_SIZE, value),
  );
}

const DEFAULT_POINTER_FALLBACK = "#0f172a";

/*
 * The wheel's real rotation in degrees, read from
 * the turning group while the CSS transition runs.
 * Returns null when the browser gives no matrix.
 */
function readRotation(
  element: Element,
): number | null {
  const transform =
    window.getComputedStyle(element)
      .transform;
  const match = /^matrix(3d)?\(([^)]+)\)$/.exec(
    transform,
  );

  if (!match) {
    return null;
  }

  const values = match[2]
    .split(",")
    .map((value) => Number(value));

  const cos = values[0];
  const sin = values[1];

  if (
    !Number.isFinite(cos) ||
    !Number.isFinite(sin)
  ) {
    return null;
  }

  return (Math.atan2(sin, cos) * 180) / Math.PI;
}

function getInitialPointerColor(
  entries: WheelEntry[],
  rotation: number,
  enabled: boolean,
  fallback: string,
) {
  if (!enabled) {
    return "#ffffff";
  }

  const visibleEntries =
    entries.filter(
      (entry) => !entry.hidden,
    );

  if (
    visibleEntries.length === 0
  ) {
    return fallback;
  }

  const totalWeight =
    visibleEntries.reduce(
      (sum, entry) =>
        sum + getEntryWeight(entry),
      0,
    );

  const pointerAngle =
    ((360 -
      (rotation % 360)) +
      360) %
    360;

  let start = 0;

  for (const entry of visibleEntries) {
    const angle =
      (getEntryWeight(entry) /
        totalWeight) *
      360;

    const end =
      start + angle;

    if (
      pointerAngle >= start &&
      pointerAngle < end
    ) {
      return (
        entry.color ??
        fallback
      );
    }

    start = end;
  }

  return (
    visibleEntries[0]?.color ??
    fallback
  );
}

function subscribeToFullscreenSupport() {
  // Support never changes while the page is open.
  return () => {};
}

function getFullscreenSupport() {
  return (
    document.fullscreenEnabled &&
    typeof document.documentElement
      .requestFullscreen ===
      "function"
  );
}

function getServerFullscreenSupport() {
  return false;
}

function FullscreenIcon({
  active,
}: {
  active: boolean;
}) {
  if (active) {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 3v5H3" />
        <path d="M16 3v5h5" />
        <path d="M8 21v-5H3" />
        <path d="M16 21v-5h5" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 8V3h5" />
      <path d="M16 3h5v5" />
      <path d="M21 16v5h-5" />
      <path d="M8 21H3v-5" />
    </svg>
  );
}

function SpeakerIcon({
  muted,
}: {
  muted: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 5 6 9H3v6h3l5 4z" />

      {muted ? (
        <>
          <path d="M16 9.5l5 5" />
          <path d="M21 9.5l-5 5" />
        </>
      ) : (
        <>
          <path d="M15.5 9a4 4 0 0 1 0 6" />
          <path d="M18.5 6.5a8 8 0 0 1 0 11" />
        </>
      )}
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M5 12h14" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

/*
 * The round picture in the winner box and the quiz box. It is
 * clipped to a circle the same way the slice pictures are. It is
 * decoration: the name and text say everything, so it is hidden
 * from screen readers.
 */
function BoxPicture({
  src,
  id,
  small,
}: {
  src: string;
  id: string;
  small: boolean;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      className={`shrink-0 ${
        small ? "h-8 w-8" : "h-11 w-11"
      }`}
    >
      <defs>
        <clipPath
          id={id}
          clipPathUnits="userSpaceOnUse"
        >
          <circle
            cx="50"
            cy="50"
            r="50"
          />
        </clipPath>
      </defs>

      <image
        href={src}
        width="100"
        height="100"
        preserveAspectRatio="xMidYMid slice"
        clipPath={`url(#${id})`}
      />

      <circle
        cx="50"
        cy="50"
        r="48"
        fill="none"
        stroke="#ffffff"
        strokeWidth="4"
      />
    </svg>
  );
}

export default function Wheel({
  entries,
  spinning,
  rotation,
  onSpin,
  canSpin = true,
  minSpinEntries = 2,
    emptyTitle,
  emptyMessage,
  spinDuration = 4.5,
  spinSound = DEFAULT_SPIN_SOUND,
  soundActive = false,
  confettiStyle = "none",
  confettiRun = 0,
  confettiStop = 0,
  soundEnabled = true,
  onSoundToggle,
  pointerMatchSliceColor = true,
  wheelSize,
  onWheelSizeChange,
  accentClass,
  accentHoverClass,
  theme,
  expandedResult,
  controlsStart,
  onExpandedChange,
  result = null,
  onContinue,
  onRemove,
  removeDisabled = false,
  reason,
  spinReason,
  onBoxFitChange,
  focusSpinRequest = 0,
  quiz = null,
  onHideAnswer,
  onAnotherSpin,
  anotherSpinDisabled = false,
}: WheelProps) {
  const t = useT();

  const imageClipPrefix = `slice-image-${toIdPart(
    useId(),
  )}`;

  const [
    internalWheelSize,
    setInternalWheelSize,
  ] = useState(
    clampSize(
      wheelSize ?? DEFAULT_WHEEL_SIZE,
    ),
  );

  const [
    fullscreen,
    setFullscreen,
  ] = useState(false);

  const [
    inPageView,
    setInPageView,
  ] = useState(false);

  const historyEntryRef =
    useRef(false);

  const inPageViewWasOpenRef =
    useRef(false);

  const fullscreenButtonRef =
    useRef<HTMLButtonElement | null>(
      null,
    );

  const closeButtonRef =
    useRef<HTMLButtonElement | null>(
      null,
    );

  const closeInPageView =
    useCallback(() => {
      setInPageView(false);

      if (historyEntryRef.current) {
        historyEntryRef.current = false;

        window.history.back();
      }
    }, []);

  const expanded =
    fullscreen || inPageView;

  useEffect(() => {
    onExpandedChange?.(expanded);
  }, [expanded, onExpandedChange]);

  const fullscreenSupported =
    useSyncExternalStore(
      subscribeToFullscreenSupport,
      getFullscreenSupport,
      getServerFullscreenSupport,
    );

  const wheelContainerRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const wheelBoxRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const spinButtonRef =
    useRef<HTMLButtonElement | null>(
      null,
    );

  const continueButtonRef =
    useRef<HTMLButtonElement | null>(
      null,
    );

  const winnerBoxRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const returnFocusRef =
    useRef(false);

  const boxOpenRef = useRef(false);

  /*
   * What closing the open box does: Continue for the winner
   * box, Hide Answer for the quiz box. Never Remove.
   */
  const onContinueRef = useRef(onContinue);

  useEffect(() => {
    onContinueRef.current =
      quiz !== null
        ? onHideAnswer
        : onContinue;
  }, [quiz, onContinue, onHideAnswer]);

  const [
    wheelPx,
    setWheelPx,
  ] = useState<number | null>(null);

  const boxId = useId();

  const [
    labelWidths,
    setLabelWidths,
  ] = useState<
    Record<string, number>
  >({});

  const spinTimerRef =
    useRef<number | null>(null);

  const rotationRef =
    useRef(rotation);

  const rotatingGroupRef =
    useRef<SVGGElement | null>(null);

  const confettiCanvasRef =
    useRef<HTMLCanvasElement | null>(null);

  const confettiShowRef =
    useRef<ConfettiShow | null>(null);

  const lastConfettiRunRef =
    useRef(confettiRun);

  const lastConfettiStopRef =
    useRef(confettiStop);

  const [
    availableWidth,
    setAvailableWidth,
  ] = useState<number | null>(null);

  const safeSize = clampSize(
    wheelSize ??
      internalWheelSize,
  );

  const renderedSize =
    availableWidth === null
      ? safeSize
      : Math.min(
          safeSize,
          availableWidth,
        );

  const visibleEntries =
    useMemo(
      () =>
        entries.filter(
          (entry) =>
            !entry.hidden,
        ),
      [entries],
    );

    const totalWeight =
    useMemo(
      () =>
        visibleEntries.reduce(
          (sum, entry) =>
            sum +
            getEntryWeight(
              entry,
            ),
          0,
        ),
      [visibleEntries],
    );

  const slices = useMemo(
    () => {
      return visibleEntries.reduce<
        Array<{
          entry: WheelEntry;
          start: number;
          end: number;
          angle: number;
        }>
      >(
        (
          result,
          entry,
        ) => {
          const start =
            result.length > 0
              ? result[
                  result.length - 1
                ].end
              : 0;

          const angle =
            totalWeight > 0
              ? (getEntryWeight(
                  entry,
                ) /
                  totalWeight) *
                360
              : 0;

          return [
            ...result,
            {
              entry,
              start,
              end:
                start + angle,
              angle,
            },
          ];
        },
        [],
      );
    },
    [
      visibleEntries,
      totalWeight,
    ],
  );

  const pointerFallbackColor =
    theme?.pointerFallbackHex ??
    DEFAULT_POINTER_FALLBACK;

  const [
    pointerColor,
    setPointerColor,
  ] = useState(() =>
    getInitialPointerColor(
      entries,
      rotation,
      pointerMatchSliceColor,
      pointerFallbackColor,
    ),
  );

  const safeSpinDuration =
    Math.max(
      1,
      Math.min(
        30,
        spinDuration,
      ),
    );

  useEffect(() => {
    rotationRef.current =
      rotation;
  }, [rotation]);

  /*
   * Draws confetti when the run counter goes up, which the
   * page does at the moment a winner is set. The canvas is
   * inside this container so it also shows in both full
   * screen views.
   */
  useEffect(() => {
    if (confettiRun === lastConfettiRunRef.current) {
      return;
    }

    lastConfettiRunRef.current = confettiRun;

    const canvas = confettiCanvasRef.current;

    if (!canvas) {
      return;
    }

    confettiShowRef.current?.stop();
    confettiShowRef.current = null;

    if (confettiStyle === "none") {
      return;
    }

    /*
     * The middle of the wheel in canvas pixels. It is read
     * again if the canvas changes size during the show.
     */
    const getWheelCentre = () => {
      const wheelBox = canvas.parentElement
        ?.querySelector(
          "svg[data-wheel-svg]",
        )
        ?.getBoundingClientRect();
      const canvasBox = canvas.getBoundingClientRect();

      return wheelBox
        ? {
            x:
              wheelBox.left +
              wheelBox.width / 2 -
              canvasBox.left,
            y:
              wheelBox.top +
              wheelBox.height / 2 -
              canvasBox.top,
          }
        : undefined;
    };

    confettiShowRef.current = startConfetti(
      canvas,
      confettiStyle,
      getWheelCentre,
    );
  }, [confettiRun, confettiStyle]);

  /*
   * The page raises the stop counter when what the confetti
   * belongs to goes away: a mode switch, another wheel, a
   * quiz starting or going back to setup, or a reset. It runs
   * before the screen is painted, so no piece is left behind.
   * Stopping also clears the canvas.
   */
  useLayoutEffect(() => {
    if (confettiStop === lastConfettiStopRef.current) {
      return;
    }

    lastConfettiStopRef.current = confettiStop;
    confettiShowRef.current?.stop();
    confettiShowRef.current = null;
  }, [confettiStop]);

  /*
   * A new spin, or leaving the page, ends the confetti.
   */
  useEffect(() => {
    if (spinning) {
      confettiShowRef.current?.stop();
      confettiShowRef.current = null;
    }
  }, [spinning]);

  useEffect(() => {
    return () => {
      confettiShowRef.current?.stop();
    };
  }, []);

  /*
   * Plays a sound each time a slice edge passes the
   * pointer. It follows the real rotation, so the
   * sounds slow down with the wheel and stop when it
   * stops. The loop also stops when sound is turned
   * off or muted, and while the page is hidden.
   */
  useEffect(() => {
    const group = rotatingGroupRef.current;

    if (
      !spinning ||
      !soundActive ||
      spinSound === "none" ||
      !group
    ) {
      return;
    }

    const starts = slices.map(
      (slice) => slice.start,
    );

    let tracker = createTickTracker(starts);
    let frame = 0;

    function step(now: number) {
      const angle = readRotation(
        group as SVGGElement,
      );

      if (angle !== null) {
        const edges = tracker.update(
          angle,
          now,
        );

        if (edges > 0) {
          playSpinTick(
            spinSound,
            1 + Math.min(edges - 1, 4) * 0.125,
          );
        }
      }

      frame = window.requestAnimationFrame(step);
    }

    function start() {
      tracker = createTickTracker(starts);
      frame = window.requestAnimationFrame(step);
    }

    function stop() {
      window.cancelAnimationFrame(frame);
    }

    function handleVisibility() {
      stop();

      if (document.visibilityState !== "hidden") {
        start();
      }
    }

    start();

    document.addEventListener(
      "visibilitychange",
      handleVisibility,
    );

    return () => {
      stop();

      document.removeEventListener(
        "visibilitychange",
        handleVisibility,
      );
    };
  }, [spinning, soundActive, spinSound, slices]);

  useLayoutEffect(() => {
    /*
     * Measure the rendered labels so the
     * image can be placed clear of them,
     * whatever the font.
     */
    function measureLabels() {
      const next: Record<
        string,
        number
      > = {};

      wheelContainerRef.current
        ?.querySelectorAll<SVGTextElement>(
          "text[data-entry-id]",
        )
        .forEach((node) => {
          const id =
            node.dataset.entryId;

          if (id) {
            next[id] =
              node.getComputedTextLength();
          }
        });

      setLabelWidths((current) => {
        const keys =
          Object.keys(next);

        return keys.length ===
          Object.keys(current)
            .length &&
          keys.every(
            (key) =>
              current[key] ===
              next[key],
          )
          ? current
          : next;
      });
    }

    measureLabels();

    document.fonts?.ready.then(
      measureLabels,
    );
  }, [slices]);

  useEffect(() => {
    const container =
      wheelContainerRef.current;

    if (!container) {
      return;
    }

    const observer =
      new ResizeObserver(
        (observed) => {
          const width =
            observed[0]
              ?.contentRect
              .width;

          if (width) {
            setAvailableWidth(
              Math.floor(width),
            );
          }
        },
      );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  /*
   * The width of the wheel itself, which decides whether
   * the winner box has room.
   */
  useEffect(() => {
    const box = wheelBoxRef.current;

    if (!box) {
      return;
    }

    const observer =
      new ResizeObserver(
        (observed) => {
          const width =
            observed[0]
              ?.contentRect
              .width;

          if (width) {
            setWheelPx(
              Math.floor(width),
            );
          }
        },
      );

    observer.observe(box);

    return () => {
      observer.disconnect();
    };
  }, []);

  const boxFits =
    wheelPx === null ||
    wheelPx >=
      MIN_WINNER_BOX_WHEEL;

  useEffect(() => {
    onBoxFitChange?.(boxFits);
  }, [boxFits, onBoxFitChange]);

  const winnerOpen =
    result !== null && boxFits;

  const quizOpen =
    quiz !== null && boxFits;

  const boxOpen = winnerOpen || quizOpen;

  useEffect(() => {
    boxOpenRef.current = boxOpen;
  }, [boxOpen]);

  /*
   * A click or tap outside the box closes it like Continue,
   * never like Remove. It only listens: it does not stop the
   * event, so a click on Spin, an eye icon, Settings or Export
   * still does its own job. Like the entry menu, a mouse or pen
   * closes on pointer down, and a touch closes on release when
   * the finger moved less than 10 px. A scroll ends in
   * pointercancel, so it does not close the box.
   */
  useEffect(() => {
    if (!boxOpen) {
      return;
    }

    const TAP_MOVE_LIMIT = 10;

    let touchStart: {
      id: number;
      x: number;
      y: number;
    } | null = null;

    function isOutside(
      event: PointerEvent,
    ) {
      const box =
        winnerBoxRef.current;

      /*
       * The quiz card's own Show Answer / Hide Answer button is
       * marked, so a press on it is not also a click outside.
       * While a dialog of the app is open on top (How it works, the
       * FAQ), a press in it is not a click outside either, and the
       * box stays as it was.
       */
      return (
        box !== null &&
        document.querySelector(
          '[role="dialog"][aria-modal="true"]',
        ) === null &&
        !box.contains(
          event.target as Node,
        ) &&
        !(
          event.target as Element
        ).closest?.(
          "[data-keep-quiz-box]",
        )
      );
    }

    function closeFromOutside(
      event: PointerEvent,
    ) {
      /*
       * Focus goes back to Spin only when the click was on
       * something that cannot take focus itself, so clicking a
       * text field in the list keeps that field. It waits a tick,
       * because the browser moves focus after the pointer event.
       */
      const target =
        event.target as Element | null;

      if (
        !target?.closest?.(
          "a[href], button, input, select, textarea, [tabindex]",
        )
      ) {
        window.setTimeout(() => {
          const active =
            document.activeElement;

          if (
            active &&
            active !== document.body
          ) {
            return;
          }

          const spin =
            spinButtonRef.current;

          (spin && !spin.disabled
            ? spin
            : (closeButtonRef.current ??
              fullscreenButtonRef.current)
          )?.focus();
        }, 0);
      }

      onContinueRef.current?.();
    }

    function handlePointerDown(
      event: PointerEvent,
    ) {
      if (
        event.pointerType === "touch"
      ) {
        touchStart = isOutside(event)
          ? {
              id: event.pointerId,
              x: event.clientX,
              y: event.clientY,
            }
          : null;

        return;
      }

      if (isOutside(event)) {
        closeFromOutside(event);
      }
    }

    function handlePointerUp(
      event: PointerEvent,
    ) {
      if (
        event.pointerType !== "touch" ||
        !touchStart ||
        touchStart.id !== event.pointerId
      ) {
        return;
      }

      const start = touchStart;

      touchStart = null;

      if (
        Math.hypot(
          event.clientX - start.x,
          event.clientY - start.y,
        ) < TAP_MOVE_LIMIT &&
        isOutside(event)
      ) {
        closeFromOutside(event);
      }
    }

    function handlePointerCancel(
      event: PointerEvent,
    ) {
      if (
        touchStart?.id ===
        event.pointerId
      ) {
        touchStart = null;
      }
    }

    document.addEventListener(
      "pointerdown",
      handlePointerDown,
    );

    document.addEventListener(
      "pointerup",
      handlePointerUp,
    );

    document.addEventListener(
      "pointercancel",
      handlePointerCancel,
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown,
      );

      document.removeEventListener(
        "pointerup",
        handlePointerUp,
      );

      document.removeEventListener(
        "pointercancel",
        handlePointerCancel,
      );
    };
  }, [boxOpen]);

  /* Focus starts on Continue when the box appears. */
  useEffect(() => {
    if (boxOpen) {
      continueButtonRef.current?.focus();
    }
  }, [boxOpen]);

  const spinDisabled =
    !canSpin ||
    spinning ||
    visibleEntries.length <
      minSpinEntries;

  const spinReasonShown =
    Boolean(spinReason) &&
    spinDisabled &&
    !spinning &&
    !boxOpen &&
    !expanded;

  /*
   * After Continue, Remove or Escape closes the box, focus
   * goes back to Spin. If Spin cannot be used (a Remove that
   * left too few entries), it goes to the full screen button
   * or Close.
   */
  useEffect(() => {
    if (boxOpen || !returnFocusRef.current) {
      return;
    }

    returnFocusRef.current = false;

    const target = spinDisabled
      ? (closeButtonRef.current ??
        fullscreenButtonRef.current)
      : spinButtonRef.current;

    target?.focus();
  }, [boxOpen, spinDisabled]);

  const lastFocusRequestRef =
    useRef(focusSpinRequest);

  useEffect(() => {
    if (
      focusSpinRequest ===
      lastFocusRequestRef.current
    ) {
      return;
    }

    lastFocusRequestRef.current =
      focusSpinRequest;

    const target = spinDisabled
      ? (closeButtonRef.current ??
        fullscreenButtonRef.current)
      : spinButtonRef.current;

    target?.focus();
  }, [focusSpinRequest, spinDisabled]);

  function continueFromBox() {
    returnFocusRef.current = true;

    onContinueRef.current?.();
  }

  function anotherSpinFromBox() {
    returnFocusRef.current = true;

    onAnotherSpin?.();
  }

  function removeFromBox() {
    if (removeDisabled) {
      return;
    }

    returnFocusRef.current = true;

    onRemove?.();
  }

  useEffect(() => {
    function handleFullscreenChange() {
      setFullscreen(
        document.fullscreenElement ===
          wheelContainerRef.current,
      );
    }

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange,
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange,
      );
    };
  }, []);

  useEffect(() => {
    if (!inPageView) {
      return;
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        /* The winner box closes first, then the view. */
        if (boxOpenRef.current) {
          returnFocusRef.current = true;

          onContinueRef.current?.();

          return;
        }

        closeInPageView();
      }
    }

    function handlePopState() {
      if (historyEntryRef.current) {
        historyEntryRef.current = false;

        setInPageView(false);
      }
    }

    const previousOverflow =
      document.body.style.overflow;

    const previousOverscroll =
      document.documentElement.style
        .overscrollBehavior;

    document.body.style.overflow =
      "hidden";

    document.documentElement.style.overscrollBehavior =
      "contain";

    // The page behind is hidden while the view is open (see globals.css).
    document.documentElement.setAttribute(
      "data-wheel-view",
      "open",
    );

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    window.addEventListener(
      "popstate",
      handlePopState,
    );

    closeButtonRef.current?.focus();

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );

      window.removeEventListener(
        "popstate",
        handlePopState,
      );

      document.documentElement.removeAttribute(
        "data-wheel-view",
      );

      document.body.style.overflow =
        previousOverflow;

      document.documentElement.style.overscrollBehavior =
        previousOverscroll;
    };
  }, [inPageView, closeInPageView]);

  useEffect(() => {
    // Give focus back to the fullscreen button once the view has closed.
    if (inPageView) {
      inPageViewWasOpenRef.current = true;
    } else if (
      inPageViewWasOpenRef.current
    ) {
      inPageViewWasOpenRef.current = false;

      fullscreenButtonRef.current?.focus();
    }
  }, [inPageView]);

  useEffect(() => {
    return () => {
      if (
        spinTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          spinTimerRef.current,
        );
      }
    };
  }, []);

  function getSliceAtRotation(
    currentRotation: number,
  ) {
    const pointerAngle =
      ((360 -
        (currentRotation %
          360)) +
        360) %
      360;

    return (
      slices.find(
        (slice) =>
          pointerAngle >=
            slice.start &&
          pointerAngle <
            slice.end,
      ) ?? slices[0]
    );
  }

  const renderedPointerColor =
    pointerMatchSliceColor
      ? spinning
        ? pointerColor
        : getSliceAtRotation(
            rotation,
          )?.entry.color ??
          pointerFallbackColor
      : "#ffffff";

  function handleSpin() {
    if (
      spinTimerRef.current !==
      null
    ) {
      window.clearTimeout(
        spinTimerRef.current,
      );
    }

    /*
     * Important:
     * Do not change pointerColor here.
     *
     * The pointer must remain the same
     * color throughout the entire spin.
     */
    /*
     * Runs inside the tap so iPhone allows sound.
     */
    unlock();

    confettiShowRef.current?.stop();
    confettiShowRef.current = null;

    /*
     * A winner sound from the last spin ends here.
     */
    stopWinnerSound();

    onSpin();

    spinTimerRef.current =
      window.setTimeout(
        () => {
          spinTimerRef.current =
            null;

          const finalSlice =
            getSliceAtRotation(
              rotationRef.current,
            );

          if (
            pointerMatchSliceColor
          ) {
            setPointerColor(
              finalSlice?.entry
                .color ??
                pointerFallbackColor,
            );
          } else {
            setPointerColor(
              "#ffffff",
            );
          }
        },
        safeSpinDuration *
            1000 +
          100,
      );
  }

  const wheelTransition = spinning
    ? `transform ${safeSpinDuration}s cubic-bezier(0.12, 0.7, 0.2, 1)`
    : "none";

  async function toggleFullscreen() {
    if (
      !wheelContainerRef.current
    ) {
      return;
    }

    if (
      document.fullscreenElement
    ) {
      try {
        await document.exitFullscreen();
      } catch {
        setFullscreen(false);
      }

      return;
    }

    if (fullscreenSupported) {
      try {
        await wheelContainerRef.current.requestFullscreen();

        return;
      } catch {
        setFullscreen(false);
      }
    }

    openInPageView();
  }

  function openInPageView() {
    /*
     * One history entry lets the browser back
     * gesture close the view. It is removed
     * again when the view is closed any other
     * way.
     */
    window.history.pushState(
      { wheelFullView: true },
      "",
      window.location.href,
    );

    historyEntryRef.current = true;

    setInPageView(true);
  }

  function changeWheelSize(
    direction: -1 | 1,
  ) {
    const nextSize =
      clampSize(
        renderedSize +
          direction *
            SIZE_STEP,
      );

    setInternalWheelSize(
      nextSize,
    );

    onWheelSizeChange?.(
      nextSize,
    );
  }

  /*
   * The in-page view is pinned with inset-0 and
   * has no viewport-unit height, so it follows
   * the visible area as the browser bars move.
   * The frame around it is the size container
   * that the landscape column and the result
   * slot measure against. Outside the in-page
   * view it generates no box.
   */
  return (
    <div
      className={
        inPageView
          ? "wheel-view-frame fixed inset-0 z-[100]"
          : "contents"
      }
    >
    <div
      ref={
        wheelContainerRef
      }
      className={
        expanded
          ? `wheel-expanded relative flex w-full flex-col items-center overflow-hidden overscroll-contain pt-[max(1rem,env(safe-area-inset-top))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] sm:pt-[max(2rem,env(safe-area-inset-top))] sm:pr-[max(2rem,env(safe-area-inset-right))] sm:pb-[max(2rem,env(safe-area-inset-bottom))] sm:pl-[max(2rem,env(safe-area-inset-left))] ${
              inPageView
                ? "h-full"
                : "h-dvh"
            } ${
              theme?.pageClass ??
              "bg-white"
            }`
          : "relative flex w-full flex-col items-center"
      }
    >
      <div
        className="wheel-controls mb-4 flex w-full max-w-[760px] shrink-0 items-center justify-end gap-3 sm:justify-between"
        aria-label={t("wheelView.controls")}
      >
        <div
          className={`hidden items-center overflow-hidden rounded-xl border shadow-sm ${
            expanded
              ? ""
              : "sm:flex"
          } ${
            theme?.controlClass ??
            "border-slate-300 bg-white"
          }`}
        >
          <button
            type="button"
            onClick={() =>
              changeWheelSize(
                -1,
              )
            }
            disabled={
              renderedSize <=
                MIN_WHEEL_SIZE ||
              spinning
            }
            className={`flex h-11 w-11 md:h-9 md:w-9 items-center justify-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-40 ${
              theme?.controlHoverClass ??
              "text-slate-700 hover:bg-slate-100"
            }`}
            aria-label={t("wheelView.decreaseSize")}
            title={t("wheelView.decreaseSize")}
          >
            <MinusIcon />
          </button>

          <div
            className={`flex h-11 md:h-9 min-w-16 items-center justify-center border-x px-2 text-xs font-bold tabular-nums ${
              theme?.borderClass ??
              "border-slate-200 text-slate-800"
            }`}
            aria-live="polite"
          >
            {renderedSize}
          </div>

          <button
            type="button"
            onClick={() =>
              changeWheelSize(
                1,
              )
            }
            disabled={
              renderedSize >=
                MAX_WHEEL_SIZE ||
              (availableWidth !==
                null &&
                renderedSize >=
                  availableWidth) ||
              spinning
            }
            className={`flex h-11 w-11 md:h-9 md:w-9 items-center justify-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-40 ${
              theme?.controlHoverClass ??
              "text-slate-700 hover:bg-slate-100"
            }`}
            aria-label={t("wheelView.increaseSize")}
            title={t("wheelView.increaseSize")}
          >
            <PlusIcon />
          </button>
        </div>

        {!expanded && controlsStart ? (
          <div className="min-w-0 flex-1 md:hidden">
            {controlsStart}
          </div>
        ) : null}

        <div
          className={`flex items-center gap-2 ${
            expanded
              ? "ml-auto"
              : ""
          }`}
        >
          {onSoundToggle ? (
            <button
              type="button"
              onClick={onSoundToggle}
              aria-pressed={!soundEnabled}
              className={`flex ${expanded ? "h-9 w-9" : "h-11 w-11 md:h-9 md:w-9"} items-center justify-center rounded-xl border shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
                theme
                  ? `${theme.controlClass} ${theme.controlHoverClass}`
                  : "border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
              }`}
              aria-label={
                soundEnabled
                  ? t("wheelView.mute")
                  : t("wheelView.unmute")
              }
              title={
                soundEnabled
                  ? t("wheelView.mute")
                  : t("wheelView.unmute")
              }
            >
              <SpeakerIcon muted={!soundEnabled} />
            </button>
          ) : null}

          {inPageView ? (
            <button
              ref={closeButtonRef}
              type="button"
              onClick={
                closeInPageView
              }
              className={`flex h-9 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
                theme
                  ? `${theme.controlClass} ${theme.controlHoverClass}`
                  : "border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
              }`}
              aria-label={t("wheelView.closeFullscreen")}
              title={t("wheelView.closeTitle")}
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M6 6l12 12" />
                <path d="M18 6L6 18" />
              </svg>
              {t("wheelView.close")}
            </button>
          ) : (
            <button
              ref={
                fullscreenButtonRef
              }
              type="button"
              onClick={
                toggleFullscreen
              }
              disabled={spinning}
              className={`flex ${expanded ? "h-9 w-9" : "h-11 w-11 md:h-9 md:w-9"} items-center justify-center rounded-xl border shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-40 ${
                theme
                  ? `${theme.controlClass} ${theme.controlHoverClass}`
                  : "border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
              }`}
              aria-label={
                fullscreen
                  ? t("wheelView.exitFullscreen")
                  : t("wheelView.enterFullscreen")
              }
              title={
                fullscreen
                  ? t("wheelView.exitFullscreen")
                  : t("wheelView.fullscreenTitle")
              }
            >
              <FullscreenIcon
                active={
                  fullscreen
                }
              />
            </button>
          )}
        </div>
      </div>

      <div
        className={
          expanded
            ? "wheel-fit-region flex min-h-0 w-full flex-1 items-center justify-center"
            : "contents"
        }
      >
      <div
        ref={wheelBoxRef}
        className={`relative flex items-center justify-center ${
          expanded
            ? "wheel-fit"
            : ""
        }`}
        style={{
          width: "100%",
          maxWidth: expanded
            ? undefined
            : renderedSize,
          aspectRatio: "1 / 1",
        }}
      >
        <svg
          viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
          className="h-full w-full overflow-visible drop-shadow-xl"
          aria-label={t("wheelView.svgLabel")}
          data-wheel-svg=""
          role="img"
        >
          <g
            ref={rotatingGroupRef}
            style={{
              transform: `rotate(${rotation}deg)`,
              transformOrigin: `${CENTER}px ${CENTER}px`,
              transition:
                wheelTransition,
            }}
          >
            {slices.map(
              ({
                entry,
                start,
                end,
                angle,
              }) => {
                const mid =
                  start +
                  angle / 2;

                const labelPoint =
                  polarToCartesian(
                    CENTER,
                    CENTER,
                    LABEL_RADIUS,
                    mid,
                  );

                let labelRotation =
                  mid - 90;

                if (
                  mid >= 180 &&
                  mid < 360
                ) {
                  labelRotation +=
                    180;
                }

                if (angle >= 360) {
                  labelRotation =
                    -rotation;
                }

                const labelLayout =
                  getSliceLayout(
                    entry.label,
                    angle,
                    entry.emoji,
                    visibleEntries.length >=
                      HIDE_LABELS_AT,
                    entry.image
                      ? LABEL_MAX_WIDTH_WITH_IMAGE
                      : LABEL_MAX_WIDTH,
                  );

                const imagePlacement =
                  entry.image
                    ? getImagePlacement(
                        angle,
                        getLabelEnd(
                          labelLayout,
                          entry.emoji,
                          labelWidths[
                            entry.id
                          ],
                        ),
                      )
                    : null;

                const imagePoint =
                  polarToCartesian(
                    CENTER,
                    CENTER,
                    imagePlacement?.radius ??
                      IMAGE_RADIUS,
                    mid,
                  );

                const imageRadius =
                  (IMAGE_SIZE / 2) *
                  (imagePlacement?.scale ??
                    1);

                const imageClipId = `${imageClipPrefix}-${toIdPart(
                  entry.id,
                )}`;

                return (
                  <g
                    key={
                      entry.id
                    }
                  >
                    <title>
                      {entry.emoji
                        ? `${entry.emoji} ${entry.label}`
                        : entry.label}
                    </title>

                    <path
                      d={describeArc(
                        CENTER,
                        CENTER,
                        RADIUS,
                        start,
                        end,
                      )}
                      fill={
                        entry.color ??
                        "#cbd5e1"
                      }
                      stroke="#ffffff"
                      strokeWidth="3"
                    />

                    {entry.image &&
                    imagePlacement ? (
                      <>
                        <defs>
                          <clipPath
                            id={
                              imageClipId
                            }
                            clipPathUnits="userSpaceOnUse"
                          >
                            <circle
                              cx={
                                imagePoint.x
                              }
                              cy={
                                imagePoint.y
                              }
                              r={
                                imageRadius
                              }
                            />
                          </clipPath>
                        </defs>

                        <image
                          href={
                            entry.image
                          }
                          x={
                            imagePoint.x -
                            imageRadius
                          }
                          y={
                            imagePoint.y -
                            imageRadius
                          }
                          width={
                            imageRadius *
                            2
                          }
                          height={
                            imageRadius *
                            2
                          }
                          preserveAspectRatio="xMidYMid slice"
                          clipPath={`url(#${imageClipId})`}
                        />
                      </>
                    ) : null}

                    {labelLayout ? (
                      <text
                        data-entry-id={
                          entry.id
                        }
                        x={
                          labelPoint.x
                        }
                        y={
                          labelPoint.y
                        }
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={
                          angle >= 360
                            ? undefined
                            : `rotate(${labelRotation} ${labelPoint.x} ${labelPoint.y})`
                        }
                        style={
                          angle >= 360
                            ? {
                                /*
                                 * A single slice keeps its label
                                 * upright. The counter-rotation
                                 * uses the wheel's own transition
                                 * so both turn together.
                                 */
                                transform: `rotate(${labelRotation}deg)`,
                                transformOrigin: `${labelPoint.x}px ${labelPoint.y}px`,
                                transition:
                                  wheelTransition,
                              }
                            : undefined
                        }
                        fill={
                          entry.textColor ??
                          "#0f172a"
                        }
                        fontFamily={
                          entry.fontFamily ??
                          "Arial, Helvetica, sans-serif"
                        }
                        fontSize={
                          labelLayout.fontSize
                        }
                        fontWeight="700"
                      >
                        {
                          labelLayout.text
                        }
                      </text>
                    ) : null}
                  </g>
                );
              },
            )}

            <circle
              cx={CENTER}
              cy={CENTER}
              r="25"
              fill="#ffffff"
              stroke="#cbd5e1"
              strokeWidth="3"
            />
          </g>

          <path
            d="M 220 34 L 203 0 L 237 0 Z"
            fill={renderedPointerColor}
            stroke={
              pointerMatchSliceColor
                ? "#ffffff"
                : "#0f172a"
            }
            strokeWidth="2"
          />
        </svg>

        {visibleEntries.length === 0 ? (
          <div
            className={`absolute inset-[6%] flex items-center justify-center rounded-full border-2 border-dashed p-4 text-center ${
              theme
                ? `border-white/25 ${theme.subtleSurfaceClass}`
                : "border-slate-500 bg-slate-900/95"
            }`}
            role="status"
          >
            <div>
              <p
                className={`text-sm font-semibold ${
                  theme?.textPrimaryClass ??
                  "text-slate-100"
                }`}
              >
                {emptyTitle ?? t("wheelView.emptyTitle")}
              </p>
              <p
                className={`mt-1 text-xs ${
                  theme?.textSecondaryClass ??
                  "text-slate-300"
                }`}
              >
                {emptyMessage ?? t("wheelView.emptyMessage")}
              </p>
            </div>
          </div>
        ) : null}

        {quizOpen && quiz ? (
          <div
            ref={winnerBoxRef}
            role="dialog"
            aria-modal="false"
            aria-label={t("quizBox.label")}
            aria-describedby={`${boxId}-answer`}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();

                /* The in-page view must not also see this Escape. */
                event.stopPropagation();

                continueFromBox();
              }
            }}
            className={`winner-box absolute left-1/2 top-1/2 z-30 flex max-w-[94%] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border p-3 text-center shadow-xl ${
              theme
                ? `${theme.borderClass} ${theme.surfaceClass}`
                : "border-slate-600 bg-slate-900"
            }`}
            style={{
              width: Math.min(
                440,
                Math.max(
                  200,
                  Math.round(
                    (wheelPx ?? 0) *
                      0.8,
                  ),
                ),
              ),
              /*
               * With a picture the label row is taller, so the
               * cap grows by the same amount and the scrolling
               * area for long text stays the same size.
               */
              maxHeight:
                Math.round(
                  (wheelPx ?? 0) * 0.82,
                ) +
                (quiz.image
                  ? (wheelPx ?? 0) < 300
                    ? 16
                    : 28
                  : 0),
            }}
          >
            <div className="flex shrink-0 items-center justify-center gap-2">
              {quiz.image ? (
                <BoxPicture
                  src={quiz.image}
                  id={`${boxId}-image`}
                  small={(wheelPx ?? 0) < 300}
                />
              ) : null}

              <p
                title={quiz.label}
                className={`min-w-0 truncate text-xs font-bold ${
                  theme?.textPrimaryClass ??
                  "text-slate-50"
                }`}
              >
                {quiz.emoji ? (
                  <span aria-hidden="true">
                    {quiz.emoji}{" "}
                  </span>
                ) : null}
                {quiz.label}
              </p>
            </div>

            <div
              tabIndex={0}
              aria-label={t("quizBox.qaLabel")}
              className="mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
            >
              <p
                className={`text-[10px] font-semibold uppercase tracking-widest ${
                  theme?.textMutedClass ??
                  "text-slate-400"
                }`}
              >
                {t("quizBox.question")}
              </p>

              <p
                className={`break-words text-sm leading-5 ${
                  theme?.textPrimaryClass ??
                  "text-slate-50"
                }`}
              >
                {quiz.question}
              </p>

              <p
                className={`mt-2 text-[10px] font-semibold uppercase tracking-widest ${
                  theme?.textMutedClass ??
                  "text-slate-400"
                }`}
              >
                {t("quizBox.answer")}
              </p>

              <p
                id={`${boxId}-answer`}
                className={`break-words text-sm font-semibold leading-5 ${
                  theme?.textPrimaryClass ??
                  "text-slate-50"
                }`}
              >
                {quiz.answer}
              </p>
            </div>

            <div className="mt-2 flex shrink-0 gap-2">
              <button
                ref={continueButtonRef}
                type="button"
                onClick={continueFromBox}
                className={`min-h-9 min-w-0 flex-1 rounded-lg px-1 text-sm font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${accentClass} ${accentHoverClass}`}
              >
                {t("result.hideAnswer")}
              </button>

              {quiz.canSpinAgain ? (
                <button
                  type="button"
                  onClick={anotherSpinFromBox}
                  disabled={anotherSpinDisabled}
                  className={`min-h-9 min-w-0 py-1 flex-1 rounded-lg border px-1 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-40 ${
                    theme
                      ? `${theme.borderClass} ${theme.textSecondaryClass} ${theme.controlHoverClass}`
                      : "border-slate-600 text-slate-200"
                  }`}
                >
                  {t("result.anotherSpin")}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {winnerOpen && result ? (
          <div
            ref={winnerBoxRef}
            role="dialog"
            aria-modal="false"
            aria-label={t("winnerBox.label")}
            aria-describedby={`${boxId}-name${
              removeDisabled && reason
                ? ` ${boxId}-reason`
                : ""
            }`}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();

                /*
                 * Stops here, so the in-page view does not also
                 * see this Escape and close.
                 */
                event.stopPropagation();

                continueFromBox();
              }
            }}
            className={`winner-box absolute left-1/2 top-1/2 z-30 flex max-w-[92%] -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-2xl border p-3 text-center shadow-xl ${
              theme
                ? `${theme.borderClass} ${theme.surfaceClass}`
                : "border-slate-600 bg-slate-900"
            }`}
            style={{
              width: Math.min(
                340,
                Math.max(
                  180,
                  Math.round(
                    (wheelPx ?? 0) *
                      0.62,
                  ),
                ),
              ),
            }}
          >
            <p
              aria-hidden="true"
              className={`text-[10px] font-semibold uppercase tracking-widest ${
                theme?.textMutedClass ??
                "text-slate-400"
              }`}
            >
              {t("winnerBox.heading")}
            </p>

            <div className="mt-1 flex w-full items-center justify-center gap-2">
              {result.image ? (
                <BoxPicture
                  src={result.image}
                  id={`${boxId}-image`}
                  small={(wheelPx ?? 0) < 300}
                />
              ) : null}

              <p
                id={`${boxId}-name`}
                title={result.label}
                className={`line-clamp-3 min-w-0 break-words font-bold leading-tight ${
                  result.image
                    ? "text-left"
                    : "w-full"
                } ${
                  (wheelPx ?? 0) < 300
                    ? "text-sm"
                    : "text-xl"
                } ${
                  theme?.textPrimaryClass ??
                  "text-slate-50"
                }`}
              >
                {result.emoji ? (
                  <span aria-hidden="true">
                    {result.emoji}{" "}
                  </span>
                ) : null}
                {result.label}
              </p>
            </div>

            <div className="mt-2 flex w-full gap-2">
              <button
                ref={continueButtonRef}
                type="button"
                onClick={continueFromBox}
                className={`h-9 min-w-0 flex-1 rounded-lg px-1 text-sm font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${accentClass} ${accentHoverClass}`}
              >
                {t("winnerBox.continue")}
              </button>

              <button
                type="button"
                onClick={removeFromBox}
                disabled={removeDisabled}
                className={`h-9 min-w-0 flex-1 rounded-lg border px-1 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-40 ${
                  theme
                    ? `${theme.borderClass} ${theme.textSecondaryClass} ${theme.controlHoverClass}`
                    : "border-slate-600 text-slate-200"
                }`}
              >
                {t("winnerBox.remove")}
              </button>
            </div>

            {removeDisabled && reason ? (
              <p
                id={`${boxId}-reason`}
                className={`mt-2 text-xs leading-4 ${
                  theme?.textMutedClass ??
                  "text-slate-400"
                }`}
              >
                {reason}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
      </div>

      {expanded && expandedResult ? (
        <div className="wheel-slot mt-4 w-full max-w-2xl shrink-0 overflow-y-auto overscroll-contain">
          {expandedResult}
        </div>
      ) : null}

      <button
        ref={spinButtonRef}
        type="button"
        onClick={handleSpin}
        disabled={spinDisabled}
        aria-describedby={
          spinReasonShown
            ? `${boxId}-spin-reason`
            : undefined
        }
        className={`wheel-spin mt-6 min-w-32 shrink-0 rounded-xl px-9 py-3 text-sm font-bold text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 ${accentClass} ${accentHoverClass}`}
      >
        {spinning
          ? t("wheelView.spinning")
          : t("wheelView.spin")}
      </button>

      {spinReasonShown ? (
        <p
          id={`${boxId}-spin-reason`}
          className={`mt-2 text-center text-xs leading-4 ${
            theme?.textSecondaryClass ??
            "text-slate-300"
          }`}
        >
          {spinReason}
        </p>
      ) : null}

      <canvas
        ref={confettiCanvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 h-full w-full"
      />
    </div>
    </div>
  );
}