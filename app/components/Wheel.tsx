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
  WheelEntry,
} from "../lib/wheel-types";
import {
  DEFAULT_WHEEL_SIZE,
  MAX_WHEEL_SIZE,
  MIN_WHEEL_SIZE,
} from "../lib/wheel-defaults";
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
  pointerMatchSliceColor?: boolean;
  wheelSize?: number;
  onWheelSizeChange?: (size: number) => void;
  accentClass: string;
  accentHoverClass: string;
  theme?: AppearanceThemeConfig;
  expandedResult?: ReactNode;
  onExpandedChange?: (expanded: boolean) => void;
};

const SIZE_STEP = 40;
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

export default function Wheel({
  entries,
  spinning,
  rotation,
  onSpin,
  canSpin = true,
  minSpinEntries = 2,
  emptyTitle = "No visible entries",
  emptyMessage = "Add entries or show hidden ones to spin the wheel.",
  spinDuration = 4.5,
  pointerMatchSliceColor = true,
  wheelSize,
  onWheelSizeChange,
  accentClass,
  accentHoverClass,
  theme,
  expandedResult,
  onExpandedChange,
}: WheelProps) {
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

  return (
    <div
      ref={
        wheelContainerRef
      }
      className={
        expanded
          ? `wheel-expanded flex h-dvh w-full flex-col items-center overflow-hidden overscroll-contain p-4 sm:p-8 ${
              inPageView
                ? "fixed inset-x-0 top-0 z-[100]"
                : ""
            } ${
              theme?.pageClass ??
              "bg-white"
            }`
          : "flex w-full flex-col items-center"
      }
    >
      <div
        className="wheel-controls mb-4 flex w-full max-w-[760px] shrink-0 items-center justify-end gap-3 sm:justify-between"
        aria-label="Wheel controls"
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
            className={`flex h-9 w-9 items-center justify-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-40 ${
              theme?.controlHoverClass ??
              "text-slate-700 hover:bg-slate-100"
            }`}
            aria-label="Decrease wheel size"
            title="Decrease wheel size"
          >
            <MinusIcon />
          </button>

          <div
            className={`flex h-9 min-w-16 items-center justify-center border-x px-2 text-xs font-bold tabular-nums ${
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
            className={`flex h-9 w-9 items-center justify-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-40 ${
              theme?.controlHoverClass ??
              "text-slate-700 hover:bg-slate-100"
            }`}
            aria-label="Increase wheel size"
            title="Increase wheel size"
          >
            <PlusIcon />
          </button>
        </div>

        <div
          className={`flex items-center gap-2 ${
            expanded
              ? "ml-auto"
              : ""
          }`}
        >
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
              aria-label="Close fullscreen"
              title="Close (Esc)"
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
              Close
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
              className={`flex h-9 w-9 items-center justify-center rounded-xl border shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-40 ${
                theme
                  ? `${theme.controlClass} ${theme.controlHoverClass}`
                  : "border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
              }`}
              aria-label={
                fullscreen
                  ? "Exit fullscreen"
                  : "Enter fullscreen"
              }
              title={
                fullscreen
                  ? "Exit fullscreen"
                  : "Fullscreen"
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
          aria-label="Spin the wheel"
          role="img"
        >
          <g
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
                {emptyTitle}
              </p>
              <p
                className={`mt-1 text-xs ${
                  theme?.textSecondaryClass ??
                  "text-slate-300"
                }`}
              >
                {emptyMessage}
              </p>
            </div>
          </div>
        ) : null}
      </div>
      </div>

      {expanded && expandedResult ? (
        <div className="wheel-slot mt-4 max-h-[35dvh] w-full max-w-2xl shrink-0 overflow-y-auto overscroll-contain">
          {expandedResult}
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleSpin}
        disabled={
          !canSpin ||
          spinning ||
          visibleEntries.length <
            minSpinEntries
        }
        className={`wheel-spin mt-6 min-w-32 shrink-0 rounded-xl px-9 py-3 text-sm font-bold text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 ${accentClass} ${accentHoverClass}`}
      >
        {spinning
          ? "Spinning…"
          : "Spin"}
      </button>
    </div>
  );
}