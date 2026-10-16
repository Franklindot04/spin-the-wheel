"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  AppearanceThemeConfig,
  WheelEntry,
} from "../lib/wheel-types";
import { getEntryWeight } from "../lib/wheel-utils";

export type { WheelEntry } from "../lib/wheel-types";

type WheelProps = {
  entries: WheelEntry[];
  spinning: boolean;
  rotation: number;
  onSpin: () => void;
  canSpin?: boolean;
  minSpinEntries?: number;
  spinDuration?: number;
  pointerMatchSliceColor?: boolean;
  wheelSize?: number;
  onWheelSizeChange?: (size: number) => void;
  accentClass: string;
  accentHoverClass: string;
  theme?: AppearanceThemeConfig;
};

const MIN_SIZE = 420;
const DEFAULT_SIZE = 560;
const MAX_SIZE = 760;
const SIZE_STEP = 40;
const VIEWBOX_SIZE = 440;
const CENTER = VIEWBOX_SIZE / 2;
const RADIUS = 205;
const LABEL_MAX_WIDTH = 130;
const LABEL_CHAR_WIDTH = 0.6;
const LABEL_RADIUS = 132;
const LABEL_MAX_FONT_SIZE = 15;
const LABEL_MIN_FONT_SIZE = 9;
const HIDE_LABELS_AT = 40;
const EMOJI_ADVANCE = 1.6;
const EMOJI_GLYPH_WIDTH = 1.3;
const EMOJI_GLYPH_HEIGHT = 1.2;
const EMOJI_MIN_FONT_SIZE = 9;

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
  emoji?: string,
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
      (LABEL_MAX_WIDTH -
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
      : `${label.slice(
          0,
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
    ) ??
    (emoji
      ? getEmojiOnlyLayout(
          emoji,
          angle,
        )
      : null)
  );
}

function clampSize(value: number) {
  return Math.min(
    MAX_SIZE,
    Math.max(MIN_SIZE, value),
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
  spinDuration = 4.5,
  pointerMatchSliceColor = true,
  wheelSize,
  onWheelSizeChange,
  accentClass,
  accentHoverClass,
  theme,
}: WheelProps) {
  const [
    internalWheelSize,
    setInternalWheelSize,
  ] = useState(
    clampSize(
      wheelSize ?? DEFAULT_SIZE,
    ),
  );

  const [
    fullscreen,
    setFullscreen,
  ] = useState(false);

  const wheelContainerRef =
    useRef<HTMLDivElement | null>(
      null,
    );

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

  async function toggleFullscreen() {
    if (
      !wheelContainerRef.current
    ) {
      return;
    }

    try {
      if (
        document.fullscreenElement
      ) {
        await document.exitFullscreen();
      } else {
        await wheelContainerRef.current.requestFullscreen();
      }
    } catch {
      setFullscreen(false);
    }
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
        fullscreen
          ? `flex min-h-screen w-full flex-col items-center justify-center p-8 ${
              theme?.pageClass ??
              "bg-white"
            }`
          : "flex w-full flex-col items-center"
      }
    >
      <div
        className="mb-4 flex w-full max-w-[760px] items-center justify-end gap-3 sm:justify-between"
        aria-label="Wheel controls"
      >
        <div
          className={`hidden items-center overflow-hidden rounded-xl border shadow-sm sm:flex ${
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
                MIN_SIZE ||
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
                MAX_SIZE ||
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

        <div className="flex items-center gap-2">
          <button
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
        </div>
      </div>

      <div
        className="relative flex items-center justify-center"
        style={{
          width: "100%",
          maxWidth: renderedSize,
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
              transition: spinning
                ? `transform ${safeSpinDuration}s cubic-bezier(0.12, 0.7, 0.2, 1)`
                : "none",
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
                  );

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

                    {entry.image ? (
                      <image
                        href={
                          entry.image
                        }
                        x={
                          labelPoint.x -
                          18
                        }
                        y={
                          labelPoint.y -
                          18
                        }
                        width="36"
                        height="36"
                        preserveAspectRatio="xMidYMid slice"
                        clipPath="circle(18px at 18px 18px)"
                      />
                    ) : null}

                    {labelLayout ? (
                      <text
                        x={
                          labelPoint.x
                        }
                        y={
                          labelPoint.y
                        }
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={`rotate(${labelRotation} ${labelPoint.x} ${labelPoint.y})`}
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
                No visible entries
              </p>
              <p
                className={`mt-1 text-xs ${
                  theme?.textSecondaryClass ??
                  "text-slate-300"
                }`}
              >
                Add entries or show hidden ones to spin the wheel.
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={handleSpin}
        disabled={
          !canSpin ||
          spinning ||
          visibleEntries.length <
            minSpinEntries
        }
        className={`mt-6 min-w-32 rounded-xl px-9 py-3 text-sm font-bold text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 ${accentClass} ${accentHoverClass}`}
      >
        {spinning
          ? "Spinning…"
          : "Spin"}
      </button>
    </div>
  );
}