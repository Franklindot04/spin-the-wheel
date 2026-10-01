"use client";

export type WheelEntry = {
  id: string;
  label: string;
  color: string;
  question?: string;
  answer?: string;
};

type WheelProps = {
  entries: WheelEntry[];
  spinning: boolean;
  rotation: number;
  onSpin: () => void;
  canSpin?: boolean;
  accentClass: string;
  accentHoverClass: string;
};

function polarToCartesian(
  center: number,
  radius: number,
  angleInDegrees: number,
) {
  const angleInRadians =
    (angleInDegrees * Math.PI) / 180;

  return {
    x:
      center +
      radius * Math.cos(angleInRadians),
    y:
      center +
      radius * Math.sin(angleInRadians),
  };
}

function describeArc(
  center: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarToCartesian(
    center,
    radius,
    endAngle,
  );
  const end = polarToCartesian(
    center,
    radius,
    startAngle,
  );

  const largeArcFlag =
    endAngle - startAngle <= 180 ? "0" : "1";

  return [
    `M ${center} ${center}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

export default function Wheel({
  entries,
  spinning,
  rotation,
  onSpin,
  canSpin = true,
  accentClass,
  accentHoverClass,
}: WheelProps) {
  const center = 180;
  const radius = 168;
  const segmentAngle =
    entries.length > 0
      ? 360 / entries.length
      : 360;

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[360px] w-[360px]">
        <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2">
          <div
            className="h-0 w-0 border-l-[13px] border-r-[13px] border-t-[27px] border-l-transparent border-r-transparent border-t-slate-950"
            aria-hidden="true"
          />
        </div>

        <svg
          viewBox="0 0 360 360"
          role="img"
          aria-label="Spin the wheel"
          className="h-full w-full overflow-visible"
        >
          <g
            style={{
              transform: `rotate(${rotation}deg)`,
              transformOrigin: `${center}px ${center}px`,
              transition: spinning
                ? "transform 4.5s cubic-bezier(0.12, 0.7, 0.2, 1)"
                : "none",
            }}
          >
            <circle
              cx={center}
              cy={center}
              r={radius + 3}
              fill="white"
              stroke="#0f172a"
              strokeWidth="7"
            />

            {entries.map((entry, index) => {
              const startAngle =
                -90 + index * segmentAngle;
              const endAngle =
                startAngle + segmentAngle;
              const labelAngle =
                startAngle + segmentAngle / 2;
              const labelRadius =
                entries.length <= 2
                  ? 88
                  : entries.length <= 4
                    ? 94
                    : 104;
              const labelPosition =
                polarToCartesian(
                  center,
                  labelRadius,
                  labelAngle,
                );

              return (
                <g key={entry.id}>
                  <path
                    d={describeArc(
                      center,
                      radius,
                      startAngle,
                      endAngle,
                    )}
                    fill={entry.color}
                    stroke="white"
                    strokeWidth="2"
                  />

                  <g
                    transform={`translate(${labelPosition.x} ${labelPosition.y}) rotate(${labelAngle + 90})`}
                  >
                    <text
                      x="0"
                      y="0"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-slate-900 text-[10px] font-semibold"
                    >
                      {entry.label.length > 22
                        ? `${entry.label.slice(0, 22)}…`
                        : entry.label}
                    </text>
                  </g>
                </g>
              );
            })}

            <circle
              cx={center}
              cy={center}
              r="26"
              fill="#0f172a"
            />

            <circle
              cx={center}
              cy={center}
              r="7"
              fill="white"
            />
          </g>
        </svg>
      </div>

      <button
        type="button"
        onClick={onSpin}
        disabled={spinning || !canSpin || entries.length < 2}
        className={`mt-6 rounded-full px-10 py-4 text-base font-semibold text-white shadow-lg transition focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none ${accentClass} ${accentHoverClass}`}
      >
        {spinning ? "Spinning…" : "Spin"}
      </button>
    </div>
  );
}
