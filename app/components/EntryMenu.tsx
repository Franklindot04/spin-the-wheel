"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  AppearanceThemeConfig,
  WheelEntry,
} from "../lib/wheel-types";
import { getEntryWeight } from "../lib/wheel-utils";
import {
  EMOJI_GROUPS,
  EMOJI_OPTIONS,
  EMOJI_TONES,
  applyEmojiTone,
  getEmojiTone,
  stripEmojiTone,
} from "../lib/entry-emoji";

const TONE_SWATCH_COLORS = [
  "#facc15",
  "#fcd9b6",
  "#e9b98c",
  "#c58c5f",
  "#8d5a3b",
  "#4a2f21",
];

type EntryMenuProps = {
  entry: WheelEntry;
  open: boolean;
  spinning: boolean;
  textLocked?: boolean;
  duplicateDisabled?: boolean;
  duplicateDisabledTitle?: string;
  deleteDisabled?: boolean;
  deleteDisabledTitle?: string;
  onToggle: () => void;
  onClose: () => void;
  onUpdate: (
    id: string,
    changes: Partial<WheelEntry>,
  ) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  accentClass: string;
  accentHoverClass: string;
  theme: AppearanceThemeConfig;
};

const MAX_IMAGE_SIZE =
  1 * 1024 * 1024;

const MAX_AUDIO_SIZE =
  2 * 1024 * 1024;

const MAX_IMAGE_DIMENSION = 512;

const IMAGE_JPEG_QUALITY = 0.85;

const FONT_OPTIONS = [
  {
    label: "Arial",
    value:
      "Arial, Helvetica, sans-serif",
  },
  {
    label: "Georgia",
    value:
      "Georgia, 'Times New Roman', serif",
  },
  {
    label: "Verdana",
    value:
      "Verdana, Geneva, sans-serif",
  },
  {
    label: "Trebuchet MS",
    value:
      "'Trebuchet MS', Arial, sans-serif",
  },
  {
    label: "Courier New",
    value:
      "'Courier New', Courier, monospace",
  },
];

function getUnlistedFontLabel(
  fontFamily: string,
): string {
  const name = fontFamily
    .split(",")[0]
    .trim()
    .replace(/^['"]|['"]$/g, "");

  return `${name || fontFamily} (not available)`;
}

function formatFileSize(
  bytes: number,
): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function readFileAsDataUrl(
  file: Blob,
): Promise<string> {
  return new Promise(
    (resolve, reject) => {
      const reader =
        new FileReader();

      reader.onload = () => {
        if (
          typeof reader.result ===
          "string"
        ) {
          resolve(reader.result);
        } else {
          reject(
            new Error(
              "The selected file could not be read.",
            ),
          );
        }
      };

      reader.onerror = () => {
        reject(
          new Error(
            "The selected file could not be read.",
          ),
        );
      };

      reader.readAsDataURL(file);
    },
  );
}

type DecodedImage = {
  source: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
};

async function decodeImage(
  file: File,
): Promise<DecodedImage> {
  if (
    typeof createImageBitmap ===
    "function"
  ) {
    try {
      const bitmap =
        await createImageBitmap(
          file,
          {
            imageOrientation:
              "from-image",
          },
        );

      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        release: () =>
          bitmap.close(),
      };
    } catch {
      // Fall back to an image element below.
    }
  }

  const url =
    URL.createObjectURL(file);

  try {
    const image = new Image();

    image.src = url;

    await image.decode();

    if (
      !image.naturalWidth ||
      !image.naturalHeight
    ) {
      throw new Error(
        "The image has no size.",
      );
    }

    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      release: () =>
        URL.revokeObjectURL(url),
    };
  } catch (error) {
    URL.revokeObjectURL(url);

    throw error;
  }
}

async function renderImage(
  decoded: DecodedImage,
): Promise<Blob> {
  const scale = Math.min(
    1,
    MAX_IMAGE_DIMENSION /
      Math.max(
        decoded.width,
        decoded.height,
      ),
  );

  const width = Math.max(
    1,
    Math.round(
      decoded.width * scale,
    ),
  );

  const height = Math.max(
    1,
    Math.round(
      decoded.height * scale,
    ),
  );

  const canvas =
    document.createElement(
      "canvas",
    );

  canvas.width = width;
  canvas.height = height;

  const context =
    canvas.getContext("2d");

  if (!context) {
    throw new Error(
      "The image could not be drawn.",
    );
  }

  context.drawImage(
    decoded.source,
    0,
    0,
    width,
    height,
  );

  const pixels =
    context.getImageData(
      0,
      0,
      width,
      height,
    ).data;

  let transparent = false;

  for (
    let index = 3;
    index < pixels.length;
    index += 4
  ) {
    if (pixels[index] < 255) {
      transparent = true;
      break;
    }
  }

  const blob =
    await new Promise<Blob | null>(
      (resolve) => {
        canvas.toBlob(
          resolve,
          transparent
            ? "image/png"
            : "image/jpeg",
          IMAGE_JPEG_QUALITY,
        );
      },
    );

  if (!blob) {
    throw new Error(
      "The image could not be saved.",
    );
  }

  return blob;
}

function MenuIcon({
  type,
}: {
  type:
    | "color"
    | "text"
    | "font"
    | "weight"
    | "emoji"
    | "image"
    | "sound"
    | "duplicate"
    | "delete";
}) {
  if (type === "emoji") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle
          cx="12"
          cy="12"
          r="9"
        />
        <path d="M8.5 14a4 4 0 0 0 7 0" />
        <path d="M9 9.5h.01" />
        <path d="M15 9.5h.01" />
      </svg>
    );
  }

  if (type === "color") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3a9 9 0 1 0 0 18h1.2a2 2 0 0 0 0-4H12a2 2 0 0 1-0-4h3a6 6 0 0 0 0-12h-3Z" />
        <circle
          cx="7.5"
          cy="10"
          r="1"
        />
        <circle
          cx="10"
          cy="6.5"
          r="1"
        />
        <circle
          cx="15"
          cy="6.5"
          r="1"
        />
      </svg>
    );
  }

  if (type === "text") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 5h14" />
        <path d="M12 5v14" />
        <path d="M8 19h8" />
      </svg>
    );
  }

  if (type === "font") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m5 19 5-14h4l5 14" />
        <path d="M7 14h10" />
      </svg>
    );
  }

  if (type === "weight") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h16" />
        <circle
          cx="9"
          cy="7"
          r="1.5"
        />
        <circle
          cx="15"
          cy="12"
          r="1.5"
        />
        <circle
          cx="11"
          cy="17"
          r="1.5"
        />
      </svg>
    );
  }

  if (type === "image") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect
          x="3"
          y="4"
          width="18"
          height="16"
          rx="2"
        />
        <circle
          cx="8.5"
          cy="9"
          r="1.5"
        />
        <path d="m3 16 5-5 4 4 3-3 6 6" />
      </svg>
    );
  }

  if (type === "sound") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M11 5 6 9H3v6h3l5 4V5Z" />
        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
        <path d="M18.5 5.5a9 9 0 0 1 0 13" />
      </svg>
    );
  }

  if (type === "duplicate") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect
          x="8"
          y="8"
          width="11"
          height="11"
          rx="2"
        />
        <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
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
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M9 7V4h6v3" />
    </svg>
  );
}

function MenuRow({
  icon,
  label,
  children,
  theme,
}: {
  icon:
    | "color"
    | "text"
    | "font"
    | "weight"
    | "image"
    | "sound"
    | "duplicate"
    | "delete";
  label: string;
  children: React.ReactNode;
  theme: AppearanceThemeConfig;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 ${theme.textSecondaryClass}`}
    >
      <span className="shrink-0">
        <MenuIcon type={icon} />
      </span>

      <span className="min-w-0 flex-1 text-xs font-medium">
        {label}
      </span>

      {children}
    </div>
  );
}

function EmojiPicker({
  entry,
  disabled,
  locked,
  onUpdate,
  theme,
}: {
  entry: WheelEntry;
  disabled: boolean;
  locked: boolean;
  onUpdate: (
    id: string,
    changes: Partial<WheelEntry>,
  ) => void;
  theme: AppearanceThemeConfig;
}) {
  /*
   * The tone is interface state only.
   * It starts from the tone of the
   * entry's current emoji.
   */
  const [tone, setTone] = useState(
    () => getEmojiTone(entry.emoji),
  );

  /*
   * Interface state only: collapsed each
   * time the menu opens, never saved.
   */
  const [expanded, setExpanded] =
    useState(false);

  const groupName = `emoji-${entry.id}`;
  const toneName = `emoji-tone-${entry.id}`;
  const panelId = `emoji-panel-${entry.id}`;

  /*
   * Spoken name of the saved emoji: the
   * curated name (with its tone) when it
   * is in the list, otherwise the emoji.
   */
  const currentOption = entry.emoji
    ? EMOJI_OPTIONS.find(
        (option) =>
          option.emoji ===
          stripEmojiTone(
            entry.emoji ?? "",
          ),
      )
    : undefined;

  const currentTone = getEmojiTone(
    entry.emoji,
  );

  const currentEmojiName =
    currentOption
      ? currentTone > 0
        ? `${currentOption.name}, ${EMOJI_TONES[
            currentTone
          ].name.toLowerCase()} skin tone`
        : currentOption.name
      : entry.emoji;

  const cellClass = `relative flex h-9 w-full cursor-pointer items-center justify-center rounded-lg text-lg leading-none transition ${theme.subtleSurfaceClass} ${theme.textPrimaryClass} ${theme.controlHoverClass} peer-checked:ring-2 peer-checked:ring-current peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-current peer-disabled:cursor-not-allowed peer-disabled:opacity-40`;

  return (
    <div className="px-3 py-2.5">
      <button
        type="button"
        onClick={() =>
          setExpanded(
            (current) => !current,
          )
        }
        aria-expanded={expanded}
        aria-controls={panelId}
        aria-label={`Emoji: ${
          entry.emoji
            ? currentEmojiName
            : "none"
        }`}
        className={`flex w-full items-center gap-3 rounded-lg text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current ${theme.textSecondaryClass}`}
      >
        <span className="shrink-0">
          <MenuIcon type="emoji" />
        </span>

        <span className="min-w-0 flex-1 text-xs font-medium">
          Emoji
        </span>

        {entry.emoji ? (
          <span
            role="img"
            aria-label={currentEmojiName}
            className="text-base leading-none"
          >
            {entry.emoji}
          </span>
        ) : (
          <span
            className={`text-[11px] font-medium ${theme.textMutedClass}`}
          >
            None
          </span>
        )}

        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 transition-transform ${
            expanded
              ? "rotate-180"
              : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {expanded && locked && (
        <p
          id={panelId}
          className={`mt-2 text-[11px] leading-4 ${theme.textMutedClass}`}
        >
          Locked while the quiz runs. Back to Setup to change it.
        </p>
      )}

      {expanded && !locked && (
      <div id={panelId}>
      <label className="relative mt-2 inline-block">
        <input
          type="radio"
          name={groupName}
          value=""
          checked={!entry.emoji}
          onChange={() =>
            onUpdate(entry.id, {
              emoji: undefined,
            })
          }
          disabled={disabled}
          aria-label="No emoji"
          className="peer sr-only"
        />

        <span
          aria-hidden="true"
          className={`flex cursor-pointer items-center rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${theme.subtleSurfaceClass} ${theme.textSecondaryClass} ${theme.controlHoverClass} peer-checked:ring-2 peer-checked:ring-current peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-current peer-disabled:cursor-not-allowed peer-disabled:opacity-40`}
        >
          None
        </span>
      </label>

      <div
        role="group"
        aria-label="Emoji skin tone"
        className="mt-2 flex items-center gap-2"
      >
        <span
          className={`mr-auto text-[10px] ${theme.textMutedClass}`}
        >
          Skin tone
        </span>

        {EMOJI_TONES.map(
          (item, index) => (
            <label
              key={item.name}
              className="relative"
            >
              <input
                type="radio"
                name={toneName}
                value={index}
                checked={tone === index}
                onChange={() =>
                  setTone(index)
                }
                disabled={disabled}
                aria-label={`${item.name} skin tone`}
                className="peer sr-only"
              />

              <span
                aria-hidden="true"
                className={`block h-6 w-6 cursor-pointer rounded-full border ${theme.borderClass} peer-checked:ring-2 peer-checked:ring-current peer-checked:ring-offset-1 peer-checked:ring-offset-transparent peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-current peer-disabled:cursor-not-allowed peer-disabled:opacity-40`}
                style={{
                  backgroundColor:
                    TONE_SWATCH_COLORS[
                      index
                    ],
                }}
              />
            </label>
          ),
        )}
      </div>

      <div className="mt-2 space-y-1">
        {EMOJI_GROUPS.map((group) => (
          <div
            key={group.label}
            role="group"
            aria-label={group.label}
            className="grid grid-cols-6 gap-1"
          >
            {group.options.map(
              (option) => {
                const value =
                  option.toneCapable
                    ? applyEmojiTone(
                        option.emoji,
                        tone,
                      )
                    : option.emoji;

                const name =
                  option.toneCapable &&
                  tone > 0
                    ? `${option.name}, ${EMOJI_TONES[
                        tone
                      ].name.toLowerCase()} skin tone`
                    : option.name;

                return (
                  <label
                    key={option.emoji}
                    className="relative block"
                  >
                    <input
                      type="radio"
                      name={groupName}
                      value={value}
                      checked={
                        entry.emoji ===
                        value
                      }
                      onChange={() =>
                        onUpdate(
                          entry.id,
                          {
                            emoji: value,
                          },
                        )
                      }
                      disabled={
                        disabled
                      }
                      aria-label={name}
                      className="peer sr-only"
                    />

                    <span
                      aria-hidden="true"
                      className={cellClass}
                    >
                      {value}
                    </span>
                  </label>
                );
              },
            )}
          </div>
        ))}
      </div>
      </div>
      )}
    </div>
  );
}

export default function EntryMenu({
  entry,
  open,
  spinning,
  textLocked = false,
  duplicateDisabled = false,
  duplicateDisabledTitle,
  deleteDisabled = false,
  deleteDisabledTitle,
  onToggle,
  onClose,
  onUpdate,
  onDuplicate,
  onDelete,
  accentClass,
  accentHoverClass,
  theme,
}: EntryMenuProps) {
  const menuRef =
    useRef<HTMLDivElement>(null);

  const imageInputRef =
    useRef<HTMLInputElement>(null);

  const soundInputRef =
    useRef<HTMLInputElement>(null);

  const [mediaError, setMediaError] =
    useState<string | null>(null);

  const [mediaNote, setMediaNote] =
    useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    /*
     * A touch that starts a page scroll ends in
     * pointercancel, so a touch only closes the
     * menu when it is a tap: released outside
     * the menu, close to where it started.
     * Mouse and pen close on pointerdown.
     */
    const TAP_MOVE_LIMIT = 10;

    let touchStart: {
      id: number;
      x: number;
      y: number;
    } | null = null;

    function isOutside(
      event: PointerEvent,
    ) {
      const target =
        event.target as Node;

      return (
        menuRef.current !== null &&
        !menuRef.current.contains(
          target,
        )
      );
    }

    function handlePointerDown(
      event: PointerEvent,
    ) {
      if (
        event.pointerType ===
        "touch"
      ) {
        touchStart = isOutside(
          event,
        )
          ? {
              id: event.pointerId,
              x: event.clientX,
              y: event.clientY,
            }
          : null;

        return;
      }

      if (isOutside(event)) {
        onClose();
      }
    }

    function handlePointerUp(
      event: PointerEvent,
    ) {
      if (
        event.pointerType !==
          "touch" ||
        !touchStart ||
        touchStart.id !==
          event.pointerId
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
        onClose();
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

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        onClose();
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

    document.addEventListener(
      "keydown",
      handleKeyDown,
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

      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [open, onClose]);

  const weight =
    getEntryWeight(entry);

  function updateWeight(
    direction: -1 | 1,
  ) {
    const nextWeight = Math.max(
      1,
      weight + direction,
    );

    if (nextWeight === weight) {
      return;
    }

    onUpdate(entry.id, {
      weight: nextWeight,
    });
  }

  async function handleImageChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    setMediaError(null);
    setMediaNote(null);

    if (
      !file.type.startsWith(
        "image/",
      )
    ) {
      setMediaError(
        "Please select an image file.",
      );
      return;
    }

    const isGif =
      file.type === "image/gif";

    let imageBlob: Blob = file;

    let decoded: DecodedImage;

    try {
      decoded =
        await decodeImage(file);
    } catch {
      setMediaError(
        `Could not read this image (${formatFileSize(
          file.size,
        )}).`,
      );
      return;
    }

    try {
      if (
        isGif ||
        file.size >
          MAX_IMAGE_SIZE ||
        decoded.width >
          MAX_IMAGE_DIMENSION ||
        decoded.height >
          MAX_IMAGE_DIMENSION
      ) {
        imageBlob =
          await renderImage(
            decoded,
          );
      }
    } catch {
      setMediaError(
        `Could not read this image (${formatFileSize(
          file.size,
        )}).`,
      );
      return;
    } finally {
      decoded.release();
    }

    if (
      imageBlob.size >
      MAX_IMAGE_SIZE
    ) {
      // Rounded up to 0.1 MB so a size just over the limit never shows as the limit.
      setMediaError(
        `Image is ${formatFileSize(
          Math.ceil(
            imageBlob.size /
              (MAX_IMAGE_SIZE /
                10),
          ) *
            (MAX_IMAGE_SIZE / 10),
        )} and still over the ${formatFileSize(
          MAX_IMAGE_SIZE,
        )} limit after resizing.`,
      );
      return;
    }

    try {
      const dataUrl =
        await readFileAsDataUrl(
          imageBlob,
        );

      onUpdate(entry.id, {
        image: dataUrl,
      });

      setMediaError(null);

      if (isGif) {
        setMediaNote(
          "Only the first frame of the GIF is used.",
        );
      }
    } catch {
      setMediaError(
        "The image could not be loaded.",
      );
    }
  }

  async function handleSoundChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    setMediaError(null);
    setMediaNote(null);

    if (
      !file.type.startsWith(
        "audio/",
      )
    ) {
      setMediaError(
        "Please select an audio file.",
      );
      return;
    }

    if (
      file.size >
      MAX_AUDIO_SIZE
    ) {
      setMediaError(
        `Audio must be ${formatFileSize(
          MAX_AUDIO_SIZE,
        )} or smaller.`,
      );
      return;
    }

    try {
      const dataUrl =
        await readFileAsDataUrl(
          file,
        );

      onUpdate(entry.id, {
        winnerSound: dataUrl,
      });

      setMediaError(null);
    } catch {
      setMediaError(
        "The audio file could not be loaded.",
      );
    }
  }

  function handleDuplicate() {
    onDuplicate(entry.id);
    onClose();
  }

  function handleDelete() {
    onDelete(entry.id);
    onClose();
  }

  function openImagePicker() {
    setMediaError(null);
    setMediaNote(null);
    imageInputRef.current?.click();
  }

  function openSoundPicker() {
    setMediaError(null);
    setMediaNote(null);
    soundInputRef.current?.click();
  }

  function removeImage() {
    onUpdate(entry.id, {
      image: undefined,
    });

    setMediaError(null);
    setMediaNote(null);
  }

  function removeSound() {
    onUpdate(entry.id, {
      winnerSound: undefined,
    });

    setMediaError(null);
    setMediaNote(null);
  }

  return (
    <div
      ref={menuRef}
      className="relative"
    >
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="hidden"
        aria-hidden="true"
      />

      <input
        ref={soundInputRef}
        type="file"
        accept="audio/*"
        onChange={handleSoundChange}
        className="hidden"
        aria-hidden="true"
      />

      <button
        type="button"
        onClick={() => {
          setMediaError(null);
          setMediaNote(null);
          onToggle();
        }}
        disabled={spinning}
        aria-label={`Customize ${
          entry.label ||
          "entry"
        }`}
        aria-expanded={open}
        aria-haspopup="menu"
        title="Customize entry"
        className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${theme.textMutedClass} ${theme.controlHoverClass} disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <span
          aria-hidden="true"
          className="text-lg font-bold leading-none"
        >
          ⋯
        </span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label={`Customize ${
            entry.label ||
            "entry"
          }`}
          className={`absolute right-0 top-10 z-50 w-72 max-w-[calc(100vw-6.5rem)] overflow-hidden rounded-xl border ${theme.borderClass} ${theme.surfaceClass} shadow-xl ring-1 ring-white/10`}
        >
          <div
            className={`border-b ${theme.borderClass} ${theme.subtleSurfaceClass} px-3 py-2.5`}
          >
            <p
              className={`truncate text-xs font-bold ${theme.textPrimaryClass}`}
            >
              {entry.label ||
                "Untitled entry"}
            </p>

            <p
              className={`mt-0.5 text-[10px] ${theme.textMutedClass}`}
            >
              Entry customization
            </p>
          </div>

          <div className="py-1">
            <MenuRow
              icon="color"
              label="Slice color"
              theme={theme}
            >
              <label
                htmlFor={`slice-color-${entry.id}`}
                className="flex cursor-pointer items-center gap-2"
              >
                <span
                  className={`h-7 w-7 rounded-lg border border-white shadow-sm ring-1 ${theme.borderClass}`}
                  style={{
                    backgroundColor:
                      entry.color,
                  }}
                />

                <span
                  className={`text-[10px] font-medium uppercase ${theme.textMutedClass}`}
                >
                  {entry.color}
                </span>

                <input
                  id={`slice-color-${entry.id}`}
                  type="color"
                  value={
                    entry.color ||
                    "#bfdbfe"
                  }
                  onChange={(event) =>
                    onUpdate(
                      entry.id,
                      {
                        color:
                          event.target
                            .value,
                      },
                    )
                  }
                  disabled={spinning}
                  className="sr-only"
                />
              </label>
            </MenuRow>

            <MenuRow
              icon="text"
              label="Text color"
              theme={theme}
            >
              <label
                htmlFor={`text-color-${entry.id}`}
                className="flex cursor-pointer items-center gap-2"
              >
                <span
                  className={`h-7 w-7 rounded-lg border border-white shadow-sm ring-1 ${theme.borderClass}`}
                  style={{
                    backgroundColor:
                      entry.textColor ||
                      "#0f172a",
                  }}
                />

                <span
                  className={`text-[10px] font-medium uppercase ${theme.textMutedClass}`}
                >
                  {entry.textColor ||
                    "#0f172a"}
                </span>

                <input
                  id={`text-color-${entry.id}`}
                  type="color"
                  value={
                    entry.textColor ||
                    "#0f172a"
                  }
                  onChange={(event) =>
                    onUpdate(
                      entry.id,
                      {
                        textColor:
                          event.target
                            .value,
                      },
                    )
                  }
                  disabled={spinning}
                  className="sr-only"
                />
              </label>
            </MenuRow>

            <MenuRow
              icon="font"
              label="Font"
              theme={theme}
            >
              <select
                value={
                  entry.fontFamily ||
                  FONT_OPTIONS[0].value
                }
                onChange={(event) =>
                  onUpdate(
                    entry.id,
                    {
                      fontFamily:
                        event.target
                          .value,
                    },
                  )
                }
                disabled={spinning}
                className={`max-w-[150px] rounded-lg px-2 py-1.5 text-[11px] font-medium outline-none transition ${theme.inputClass} disabled:cursor-not-allowed disabled:opacity-40`}
                style={{
                  fontFamily:
                    entry.fontFamily ||
                    FONT_OPTIONS[0].value,
                }}
              >
                {entry.fontFamily &&
                !FONT_OPTIONS.some(
                  (font) =>
                    font.value ===
                    entry.fontFamily,
                ) ? (
                  <option
                    value={
                      entry.fontFamily
                    }
                    disabled
                  >
                    {getUnlistedFontLabel(
                      entry.fontFamily,
                    )}
                  </option>
                ) : null}

                {FONT_OPTIONS.map(
                  (font) => (
                    <option
                      key={font.value}
                      value={
                        font.value
                      }
                    >
                      {font.label}
                    </option>
                  ),
                )}
              </select>
            </MenuRow>

            <MenuRow
              icon="weight"
              label="Slice weight"
              theme={theme}
            >
              <div
                className={`flex items-center overflow-hidden rounded-lg border ${theme.borderClass}`}
              >
                <button
                  type="button"
                  onClick={() =>
                    updateWeight(
                      -1,
                    )
                  }
                  disabled={
                    spinning ||
                    weight <= 1
                  }
                  aria-label="Decrease slice weight"
                  className={`flex h-8 w-8 items-center justify-center text-sm font-bold ${theme.textSecondaryClass} transition ${theme.controlHoverClass} disabled:cursor-not-allowed disabled:opacity-35`}
                >
                  −
                </button>

                <span
                  className={`min-w-[42px] border-x ${theme.borderClass} px-2 text-center text-[11px] font-bold ${theme.textSecondaryClass}`}
                >
                  {weight}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    updateWeight(
                      1,
                    )
                  }
                  disabled={spinning}
                  aria-label="Increase slice weight"
                  className={`flex h-8 w-8 items-center justify-center text-sm font-bold ${theme.textSecondaryClass} transition ${theme.controlHoverClass} disabled:cursor-not-allowed disabled:opacity-35`}
                >
                  +
                </button>
              </div>
            </MenuRow>

            <div
              className={`my-1 border-t ${theme.borderClass}`}
            />

            <EmojiPicker
              entry={entry}
              disabled={spinning}
              locked={textLocked}
              onUpdate={onUpdate}
              theme={theme}
            />

            <div
              className={`my-1 border-t ${theme.borderClass}`}
            />

            <div className="px-3 py-2.5">
              <div className="flex items-center gap-3">
                <span
                  className={`shrink-0 ${theme.textSecondaryClass}`}
                >
                  <MenuIcon type="image" />
                </span>

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-xs font-medium ${theme.textSecondaryClass}`}
                  >
                    Image
                  </p>

                  <p
                    className={`mt-0.5 text-[10px] ${theme.textMutedClass}`}
                  >
                    Max{" "}
                    {formatFileSize(
                      MAX_IMAGE_SIZE,
                    )}
                  </p>
                </div>

                {entry.image ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={
                        openImagePicker
                      }
                      disabled={
                        spinning
                      }
                      className={`rounded-lg ${theme.subtleSurfaceClass} px-2 py-1.5 text-[10px] font-semibold ${theme.textSecondaryClass} transition ${theme.controlHoverClass} disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                      Replace
                    </button>

                    <button
                      type="button"
                      onClick={
                        removeImage
                      }
                      disabled={
                        spinning
                      }
                      aria-label="Remove image"
                      className="rounded-lg px-2 py-1.5 text-[10px] font-semibold text-red-200 transition not-disabled:hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={
                      openImagePicker
                    }
                    disabled={spinning}
                    className={`rounded-lg ${theme.subtleSurfaceClass} px-2.5 py-1.5 text-[10px] font-semibold ${theme.textSecondaryClass} transition ${theme.controlHoverClass} disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    Add
                  </button>
                )}
              </div>

              {entry.image && (
                <div
                  className={`mt-2 flex items-center gap-2 rounded-lg ${theme.subtleSurfaceClass} p-2`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- entry images are data URLs, so next/image gives no benefit */}
                  <img
                    src={entry.image}
                    alt=""
                    className={`h-10 w-10 rounded-md object-cover ring-1 ${theme.borderClass}`}
                  />

                  <span className="text-[10px] font-medium text-emerald-200">
                    Image attached
                  </span>
                </div>
              )}
            </div>

            <div
              className={`border-t ${theme.borderClass} px-3 py-2.5`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`shrink-0 ${theme.textSecondaryClass}`}
                >
                  <MenuIcon type="sound" />
                </span>

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-xs font-medium ${theme.textSecondaryClass}`}
                  >
                    Winner sound
                  </p>

                  <p
                    className={`mt-0.5 text-[10px] ${theme.textMutedClass}`}
                  >
                    Max{" "}
                    {formatFileSize(
                      MAX_AUDIO_SIZE,
                    )}
                  </p>
                </div>

                {entry.winnerSound ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={
                        openSoundPicker
                      }
                      disabled={
                        spinning
                      }
                      className={`rounded-lg ${theme.subtleSurfaceClass} px-2 py-1.5 text-[10px] font-semibold ${theme.textSecondaryClass} transition ${theme.controlHoverClass} disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                      Replace
                    </button>

                    <button
                      type="button"
                      onClick={
                        removeSound
                      }
                      disabled={
                        spinning
                      }
                      aria-label="Remove winner sound"
                      className="rounded-lg px-2 py-1.5 text-[10px] font-semibold text-red-200 transition not-disabled:hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={
                      openSoundPicker
                    }
                    disabled={spinning}
                    className={`rounded-lg ${theme.subtleSurfaceClass} px-2.5 py-1.5 text-[10px] font-semibold ${theme.textSecondaryClass} transition ${theme.controlHoverClass} disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    Add
                  </button>
                )}
              </div>

              {entry.winnerSound && (
                <div
                  className={`mt-2 flex items-center gap-2 rounded-lg ${theme.subtleSurfaceClass} p-2`}
                >
                  <audio
                    controls
                    preload="metadata"
                    src={
                      entry.winnerSound
                    }
                    className="h-8 min-w-0 flex-1"
                  />

                  <span className="shrink-0 text-[10px] font-medium text-emerald-200">
                    Audio attached
                  </span>
                </div>
              )}
            </div>

            {mediaError && (
              <div className="mx-3 mb-2 rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2">
                <p className="text-[11px] font-medium leading-4 text-red-300">
                  {mediaError}
                </p>
              </div>
            )}

            {mediaNote && !mediaError && (
              <div
                className={`mx-3 mb-2 rounded-lg ${theme.subtleSurfaceClass} px-3 py-2`}
              >
                <p
                  className={`text-[11px] font-medium leading-4 ${theme.textSecondaryClass}`}
                >
                  {mediaNote}
                </p>
              </div>
            )}

            <div
              className={`my-1 border-t ${theme.borderClass}`}
            />

            <button
              type="button"
              onClick={
                handleDuplicate
              }
              disabled={
                spinning ||
                duplicateDisabled
              }
              title={
                duplicateDisabled
                  ? duplicateDisabledTitle ??
                    "Back to Setup to duplicate questions"
                  : undefined
              }
              aria-label={`Duplicate entry ${entry.label}`.trim()}
              className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-xs font-medium ${theme.textSecondaryClass} transition ${theme.controlHoverClass} disabled:cursor-not-allowed disabled:opacity-40`}
            >
              <MenuIcon type="duplicate" />

              <span className="flex-1">
                Duplicate entry
              </span>
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={
                spinning ||
                deleteDisabled
              }
              title={
                deleteDisabled
                  ? deleteDisabledTitle ??
                    "Keep at least 2 visible entries"
                  : undefined
              }
              aria-label={`Delete entry ${entry.label}`.trim()}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-xs font-medium text-red-300 transition not-disabled:hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <MenuIcon type="delete" />

              <span className="flex-1">
                Delete entry
              </span>
            </button>
          </div>

          <div
            className={`border-t ${theme.borderClass} ${theme.subtleSurfaceClass} px-3 py-2`}
          >
            <button
              type="button"
              onClick={onClose}
              className={`w-full rounded-lg px-3 py-2 text-xs font-semibold text-white transition ${accentClass} ${accentHoverClass}`}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}