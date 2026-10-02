"use client";

import {

  useEffect,

  useMemo,

  useRef,

  useState,

} from "react";

import type { WheelEntry } from "../lib/wheel-types";

export type { WheelEntry } from "../lib/wheel-types";

type WheelProps = {

  entries: WheelEntry[];

  spinning: boolean;

  rotation: number;

  onSpin: () => void;

  canSpin?: boolean;

  spinDuration?: number;

  pointerMatchSliceColor?: boolean;

  wheelSize?: number;

  onWheelSizeChange?: (size: number) => void;

  accentClass: string;

  accentHoverClass: string;

};

const MIN_SIZE = 420;

const DEFAULT_SIZE = 560;

const MAX_SIZE = 760;

const SIZE_STEP = 40;

const VIEWBOX_SIZE = 440;

const CENTER = VIEWBOX_SIZE / 2;

const RADIUS = 205;

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

function normalizedWeight(

  entry: WheelEntry,

) {

  return Math.max(

    1,

    Math.floor(entry.weight ?? 1),

  );

}

function clampSize(value: number) {

  return Math.min(

    MAX_SIZE,

    Math.max(MIN_SIZE, value),

  );

}

function getInitialPointerColor(

  entries: WheelEntry[],

  rotation: number,

  enabled: boolean,

) {

  if (!enabled) {

    return "#0f172a";

  }

  const visibleEntries =

    entries.filter(

      (entry) => !entry.hidden,

    );

  if (

    visibleEntries.length === 0

  ) {

    return "#0f172a";

  }

  const totalWeight =

    visibleEntries.reduce(

      (sum, entry) =>

        sum + normalizedWeight(entry),

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

      (normalizedWeight(entry) /

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

        "#0f172a"

      );

    }

    start = end;

  }

  return (

    visibleEntries[0]?.color ??

    "#0f172a"

  );

}

function SpeakerIcon({

  muted,

}: {

  muted: boolean;

}) {

  if (muted) {

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

        <path d="M11 5 6 9H3v6h3l5 4V5Z" />

        <path d="m19 9-6 6" />

        <path d="m13 9 6 6" />

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

      <path d="M11 5 6 9H3v6h3l5 4V5Z" />

      <path d="M15.5 8.5a5 5 0 0 1 0 7" />

      <path d="M18.5 5.5a9 9 0 0 1 0 13" />

    </svg>

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

  spinDuration = 4.5,

  pointerMatchSliceColor = true,

  wheelSize,

  onWheelSizeChange,

  accentClass,

  accentHoverClass,

}: WheelProps) {

  const [

    internalWheelSize,

    setInternalWheelSize,

  ] = useState(

    clampSize(

      wheelSize ?? DEFAULT_SIZE,

    ),

  );

  const [muted, setMuted] =

    useState(false);

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

  const safeSize = clampSize(

    wheelSize ??

      internalWheelSize,

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

            normalizedWeight(

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

              ? (normalizedWeight(

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

  const [

    pointerColor,

    setPointerColor,

  ] = useState(() =>

    getInitialPointerColor(

      entries,

      rotation,

      pointerMatchSliceColor,

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

          "#0f172a"

      : "#0f172a";

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

                "#0f172a",

            );

          } else {

            setPointerColor(

              "#0f172a",

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

        safeSize +

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

          ? "flex min-h-screen w-full flex-col items-center justify-center bg-white p-8"

          : "flex w-full flex-col items-center"

      }

    >

      <div

        className="mb-4 flex w-full max-w-[760px] items-center justify-between gap-3"

        aria-label="Wheel controls"

      >

        <div className="flex items-center overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">

          <button

            type="button"

            onClick={() =>

              changeWheelSize(

                -1,

              )

            }

            disabled={

              safeSize <=

                MIN_SIZE ||

              spinning

            }

            className="flex h-9 w-9 items-center justify-center text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"

            aria-label="Decrease wheel size"

            title="Decrease wheel size"

          >

            <MinusIcon />

          </button>

          <div

            className="flex h-9 min-w-16 items-center justify-center border-x border-slate-200 px-2 text-xs font-bold tabular-nums text-slate-800"

            aria-live="polite"

          >

            {safeSize}

          </div>

          <button

            type="button"

            onClick={() =>

              changeWheelSize(

                1,

              )

            }

            disabled={

              safeSize >=

                MAX_SIZE ||

              spinning

            }

            className="flex h-9 w-9 items-center justify-center text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"

            aria-label="Increase wheel size"

            title="Increase wheel size"

          >

            <PlusIcon />

          </button>

        </div>

        <div className="flex items-center gap-2">

          <button

            type="button"

            onClick={() =>

              setMuted(

                (current) =>

                  !current,

              )

            }

            disabled={spinning}

            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-800 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"

            aria-label={

              muted

                ? "Unmute wheel"

                : "Mute wheel"

            }

            title={

              muted

                ? "Unmute"

                : "Mute"

            }

          >

            <SpeakerIcon

              muted={muted}

            />

          </button>

          <button

            type="button"

            onClick={

              toggleFullscreen

            }

            disabled={spinning}

            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-800 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"

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

          width: safeSize,

          height: safeSize,

          maxWidth: "100%",

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

                    132,

                    mid,

                  );

                let labelRotation =

                  mid;

                if (

                  labelRotation >

                    90 &&

                  labelRotation <

                    270

                ) {

                  labelRotation +=

                    180;

                }

                const label =

                  entry.label.length >

                  28

                    ? `${entry.label.slice(

                        0,

                        27,

                      )}…`

                    : entry.label;

                const fontSize =

                  angle < 14

                    ? 9

                    : angle < 22

                      ? 11

                      : angle < 35

                        ? 13

                        : 15;

                return (

                  <g

                    key={

                      entry.id

                    }

                  >

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

                        fontSize

                      }

                      fontWeight="700"

                    >

                      {label}

                    </text>

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

            stroke="#ffffff"

            strokeWidth="2"

          />

        </svg>

      </div>

      <button

        type="button"

        onClick={handleSpin}

        disabled={

          !canSpin ||

          spinning ||

          visibleEntries.length < 2

        }

        className={`mt-6 rounded-xl px-9 py-3 text-sm font-bold text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 ${accentClass} ${accentHoverClass}`}

      >

        {spinning

          ? "Spinning…"

          : "Spin"}

      </button>

    </div>

  );

}
