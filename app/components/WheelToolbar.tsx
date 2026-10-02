"use client";

type WheelToolbarProps = {
  entriesCount: number;
  historyCount: number;

  historyOpen: boolean;
  soundEnabled: boolean;
  hiddenEntriesCount: number;

  onEntriesClick: () => void;
  onHistoryClick: () => void;
  onPersonaliseClick: () => void;

  onImportClick: () => void;
  onExportClick: () => void;

  onShuffleClick: () => void;
  onSortClick: () => void;

  onSoundToggle: () => void;
  onHideToggle: () => void;

  disabled?: boolean;
};

function ListIcon() {
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
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h.01" />
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
    </svg>
  );
}

function HistoryIcon() {
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
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function SlidersIcon() {
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
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
      <circle cx="8" cy="6" r="2" />
      <circle cx="15" cy="12" r="2" />
      <circle cx="10" cy="18" r="2" />
    </svg>
  );
}

function ImportIcon() {
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
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

function ExportIcon() {
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
      <path d="M12 15V3" />
      <path d="m17 8-5-5-5 5" />
      <path d="M5 21h14" />
    </svg>
  );
}

function ShuffleIcon() {
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
      <path d="M3 7h3c5 0 6 10 11 10h4" />
      <path d="m18 14 3 3-3 3" />
      <path d="M3 17h3c1.7 0 2.8-.8 3.7-2" />
      <path d="M14.3 9C15.2 7.8 16.3 7 18 7h3" />
      <path d="m18 4 3 3-3 3" />
    </svg>
  );
}

function SortIcon() {
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
      <path d="M8 6h13" />
      <path d="M8 12h9" />
      <path d="M8 18h5" />
      <path d="m3 8 2-2 2 2" />
      <path d="M5 6v12" />
    </svg>
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

function EyeIcon({
  hidden,
}: {
  hidden: boolean;
}) {
  if (hidden) {
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
        <path d="m3 3 18 18" />
        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
        <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5 0 8.5 4 10 8a17 17 0 0 1-3.1 4.7" />
        <path d="M6.6 6.6C4.8 7.8 3.5 9.7 2 12c1.5 3 5 7 10 7 1.1 0 2.2-.2 3.1-.5" />
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
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle
        cx="12"
        cy="12"
        r="3"
      />
    </svg>
  );
}

function ToolbarButton({
  label,
  onClick,
  icon,
  badge,
  active = false,
  disabled = false,
  destructive = false,
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  badge?: number;
  active?: boolean;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={
        active ? true : undefined
      }
      title={label}
      className={`group inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
        destructive
          ? active
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
          : active
            ? "border-slate-300 bg-slate-900 text-white"
            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
      }`}
    >
      <span className="shrink-0">
        {icon}
      </span>

      <span className="hidden sm:inline">
        {label}
      </span>

      {typeof badge ===
      "number" ? (
        <span
          className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] ${
            active
              ? "bg-white/20 text-white"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}

export default function WheelToolbar({
  entriesCount,
  historyCount,
  historyOpen,
  soundEnabled,
  hiddenEntriesCount,
  onEntriesClick,
  onHistoryClick,
  onPersonaliseClick,
  onImportClick,
  onExportClick,
  onShuffleClick,
  onSortClick,
  onSoundToggle,
  onHideToggle,
  disabled = false,
}: WheelToolbarProps) {
  const allEntriesHidden =
    entriesCount > 0 &&
    hiddenEntriesCount >=
      entriesCount;

  const hasHiddenEntries =
    hiddenEntriesCount > 0;

  return (
    <section
      aria-label="Wheel controls"
      className="w-full"
    >
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <ToolbarButton
              label="Entries"
              onClick={onEntriesClick}
              icon={<ListIcon />}
              badge={entriesCount}
              disabled={disabled}
            />

            <ToolbarButton
              label="History"
              onClick={onHistoryClick}
              icon={<HistoryIcon />}
              badge={historyCount}
              active={historyOpen}
              disabled={disabled}
            />

            <ToolbarButton
              label="Personalise"
              onClick={onPersonaliseClick}
              icon={<SlidersIcon />}
              disabled={disabled}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ToolbarButton
              label="Import"
              onClick={onImportClick}
              icon={<ImportIcon />}
              disabled={disabled}
            />

            <ToolbarButton
              label="Export"
              onClick={onExportClick}
              icon={<ExportIcon />}
              disabled={disabled}
            />
          </div>
        </div>

        <div className="h-px bg-slate-100" />

        <div className="flex flex-wrap items-center gap-2">
          <ToolbarButton
            label="Shuffle"
            onClick={onShuffleClick}
            icon={<ShuffleIcon />}
            disabled={
              disabled ||
              entriesCount < 2
            }
          />

          <ToolbarButton
            label="Sort"
            onClick={onSortClick}
            icon={<SortIcon />}
            disabled={
              disabled ||
              entriesCount < 2
            }
          />

          <ToolbarButton
            label={
              soundEnabled
                ? "Sound on"
                : "Sound off"
            }
            onClick={onSoundToggle}
            icon={
              <SpeakerIcon
                muted={!soundEnabled}
              />
            }
            active={!soundEnabled}
            disabled={disabled}
          />

          <ToolbarButton
            label={
              allEntriesHidden
                ? "Show all"
                : hasHiddenEntries
                  ? "Show hidden"
                  : "Hide"
            }
            onClick={onHideToggle}
            icon={
              <EyeIcon
                hidden={
                  allEntriesHidden ||
                  hasHiddenEntries
                }
              />
            }
            active={hasHiddenEntries}
            disabled={
              disabled ||
              entriesCount === 0
            }
          />

          {hasHiddenEntries ? (
            <span className="ml-1 text-xs font-semibold text-slate-400">
              {hiddenEntriesCount}{" "}
              hidden
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}