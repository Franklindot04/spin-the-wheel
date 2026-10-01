"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import type { ChangeEvent, CSSProperties } from "react";
import EntryList from "./components/EntryList";
import Wheel, { WheelEntry } from "./components/Wheel";

type Mode = "standard" | "quiz";

type AppearanceTheme =
  | "classic"
  | "ocean"
  | "forest"
  | "sunset"
  | "violet";

type AppearanceThemeConfig = {
  label: string;
  description: string;
  swatchClass: string;
  pageClass: string;
  accentClass: string;
  accentHoverClass: string;
  accentHex: string;
  accentHoverHex: string;
  surfaceClass: string;
  subtleSurfaceClass: string;
};

const APPEARANCE_THEMES: Record<
  AppearanceTheme,
  AppearanceThemeConfig
> = {
  classic: {
    label: "Classic",
    description: "Clean slate with the original appearance.",
    swatchClass: "bg-slate-950",
    pageClass: "bg-slate-50",
    accentClass: "bg-slate-950",
    accentHoverClass: "hover:bg-slate-800",
    accentHex: "#020617",
    accentHoverHex: "#1e293b",
    surfaceClass: "bg-white",
    subtleSurfaceClass: "bg-slate-50",
  },
  ocean: {
    label: "Ocean",
    description: "Cool blue accents with a calm backdrop.",
    swatchClass: "bg-blue-600",
    pageClass: "bg-blue-50",
    accentClass: "bg-blue-700",
    accentHoverClass: "hover:bg-blue-800",
    accentHex: "#1d4ed8",
    accentHoverHex: "#1e40af",
    surfaceClass: "bg-blue-100",
    subtleSurfaceClass: "bg-blue-200/70",
  },
  forest: {
    label: "Forest",
    description: "Fresh green accents with a natural tone.",
    swatchClass: "bg-emerald-700",
    pageClass: "bg-emerald-50",
    accentClass: "bg-emerald-700",
    accentHoverClass: "hover:bg-emerald-800",
    accentHex: "#047857",
    accentHoverHex: "#065f46",
    surfaceClass: "bg-emerald-100",
    subtleSurfaceClass: "bg-emerald-200/70",
  },
  sunset: {
    label: "Sunset",
    description: "Warm orange accents with a soft backdrop.",
    swatchClass: "bg-orange-600",
    pageClass: "bg-orange-50",
    accentClass: "bg-orange-600",
    accentHoverClass: "hover:bg-orange-700",
    accentHex: "#ea580c",
    accentHoverHex: "#c2410c",
    surfaceClass: "bg-orange-100",
    subtleSurfaceClass: "bg-orange-200/70",
  },
  violet: {
    label: "Violet",
    description: "Bold violet accents with a subtle backdrop.",
    swatchClass: "bg-violet-700",
    pageClass: "bg-violet-50",
    accentClass: "bg-violet-700",
    accentHoverClass: "hover:bg-violet-800",
    accentHex: "#6d28d9",
    accentHoverHex: "#5b21b6",
    surfaceClass: "bg-violet-100",
    subtleSurfaceClass: "bg-violet-200/70",
  },
};

type SpinHistoryItem = {
  id: string;
  entryId: string;
  label: string;
  mode: Mode;
  question?: string;
  timestamp: number;
};

type StoredWheelData = {
  version: 1;
  standardEntries: WheelEntry[];
  quizEntries: WheelEntry[];
  wheelTitle: string;
  wheelDescription: string;
  standardHistory?: SpinHistoryItem[];
  quizHistory?: SpinHistoryItem[];
  appearanceTheme?: AppearanceTheme;
};

const STORAGE_KEY = "spin-the-wheel:v1";

const COLORS = [
  "#bfdbfe",
  "#fde68a",
  "#bbf7d0",
  "#fecaca",
  "#ddd6fe",
  "#fed7aa",
  "#bae6fd",
  "#fbcfe8",
];

const DEFAULT_WHEEL_TITLE = "Spin the Wheel";

const DEFAULT_WHEEL_DESCRIPTION =
  "Create a wheel for anything.";

function createInitialEntries(): WheelEntry[] {
  return [
    {
      id: "standard-1",
      label: "Option 1",
      color: COLORS[0],
      question: "",
      answer: "",
    },
    {
      id: "standard-2",
      label: "Option 2",
      color: COLORS[1],
      question: "",
      answer: "",
    },
    {
      id: "standard-3",
      label: "Option 3",
      color: COLORS[2],
      question: "",
      answer: "",
    },
    {
      id: "standard-4",
      label: "Option 4",
      color: COLORS[3],
      question: "",
      answer: "",
    },
  ];
}

function createInitialQuizEntries(): WheelEntry[] {
  return [
    {
      id: "quiz-1",
      label: "Question 1",
      color: COLORS[0],
      question: "",
      answer: "",
    },
    {
      id: "quiz-2",
      label: "Question 2",
      color: COLORS[1],
      question: "",
      answer: "",
    },
    {
      id: "quiz-3",
      label: "Question 3",
      color: COLORS[2],
      question: "",
      answer: "",
    },
    {
      id: "quiz-4",
      label: "Question 4",
      color: COLORS[3],
      question: "",
      answer: "",
    },
  ];
}

function isStoredWheelData(
  value: unknown,
): value is StoredWheelData {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Partial<StoredWheelData>;

  return (
    data.version === 1 &&
    Array.isArray(data.standardEntries) &&
    Array.isArray(data.quizEntries) &&
    typeof data.wheelTitle === "string" &&
    typeof data.wheelDescription === "string"
  );
}

/*
 * Returns a uniformly distributed random index
 * from 0 through length - 1.
 *
 * Rejection sampling is used so that converting the
 * 32-bit random value into an index does not introduce
 * modulo bias.
 *
 * Every Standard spin calls this function independently.
 * Previous Standard results have no influence on the
 * next result.
 */
function getRandomIndex(length: number): number {
  if (length <= 0) {
    throw new Error(
      "Cannot generate a random index for an empty collection.",
    );
  }

  const range = 0x100000000;
  const limit = range - (range % length);
  const randomValues = new Uint32Array(1);

  do {
    crypto.getRandomValues(randomValues);
  } while (randomValues[0] >= limit);

  return randomValues[0] % length;
}

export default function Home() {
  const [mode, setMode] =
    useState<Mode>("standard");

  /*
   * Persistent wheel configuration.
   *
   * Standard and Quiz intentionally have separate
   * entry collections.
   */
  const [standardEntries, setStandardEntries] =
    useState<WheelEntry[]>(createInitialEntries);

  const [quizEntries, setQuizEntries] =
    useState<WheelEntry[]>(createInitialQuizEntries);

  const [wheelTitle, setWheelTitle] =
    useState(DEFAULT_WHEEL_TITLE);

  const [wheelDescription, setWheelDescription] =
    useState(DEFAULT_WHEEL_DESCRIPTION);

  const [appearanceTheme, setAppearanceTheme] =
    useState<AppearanceTheme>("classic");

  /*
   * Persistent spin history.
   *
   * History records completed spins but never affects
   * the random selection of future spins.
   */
  const [standardHistory, setStandardHistory] =
    useState<SpinHistoryItem[]>([]);

  const [quizHistory, setQuizHistory] =
    useState<SpinHistoryItem[]>([]);

  /*
   * Temporary Quiz-mode session state.
   *
   * The selected quiz question remains in the
   * remaining pool until Next Spin or another Spin
   * is clicked.
   *
   * This state is intentionally NOT persisted.
   */
  const [remainingQuizEntries, setRemainingQuizEntries] =
    useState<WheelEntry[]>([]);

  const [quizStarted, setQuizStarted] =
    useState(false);

  const [rotation, setRotation] =
    useState(0);

  const [spinning, setSpinning] =
    useState(false);

  const [selectedEntry, setSelectedEntry] =
    useState<WheelEntry | null>(null);

  const [showAnswer, setShowAnswer] =
    useState(false);

  /*
   * Settings modal.
   */
  const [settingsOpen, setSettingsOpen] =
    useState(false);

  const [resetConfirmOpen, setResetConfirmOpen] =
    useState(false);

  /*
   * Import / Export controls.
   */
  const importInputRef =
    useRef<HTMLInputElement>(null);

  const [importError, setImportError] =
    useState("");

  const [pendingImport, setPendingImport] =
    useState<StoredWheelData | null>(null);

  /*
   * Tracks whether the initial localStorage load
   * has completed.
   */
  const hasLoadedStorage = useRef(false);

  /*
   * Load saved configuration from localStorage.
   */
  useEffect(() => {
    const loadStoredData = () => {
      try {
        const saved =
          window.localStorage.getItem(
            STORAGE_KEY,
          );

        if (saved) {
          const parsed: unknown =
            JSON.parse(saved);

          if (isStoredWheelData(parsed)) {
            setStandardEntries(
              parsed.standardEntries,
            );

            setQuizEntries(
              parsed.quizEntries,
            );

            setWheelTitle(
              parsed.wheelTitle,
            );

            setWheelDescription(
              parsed.wheelDescription,
            );

            setAppearanceTheme(
              parsed.appearanceTheme &&
                parsed.appearanceTheme in
                  APPEARANCE_THEMES
                ? parsed.appearanceTheme
                : "classic",
            );

            setStandardHistory(
              parsed.standardHistory ?? [],
            );

            setQuizHistory(
              parsed.quizHistory ?? [],
            );
          }
        }
      } catch {
        // Ignore invalid or unavailable local storage.
      } finally {
        hasLoadedStorage.current = true;
      }
    };

    const timer = window.setTimeout(
      loadStoredData,
      0,
    );

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  /*
   * Persist wheel configuration whenever it changes.
   *
   * Temporary Quiz session state is intentionally
   * excluded from localStorage.
   */
  useEffect(() => {
    if (!hasLoadedStorage.current) {
      return;
    }

    const data: StoredWheelData = {
      version: 1,
      standardEntries,
      quizEntries,
      wheelTitle,
      wheelDescription,
      standardHistory,
      quizHistory,
      appearanceTheme,
    };

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data),
      );
    } catch {
      // Ignore unavailable or full local storage.
    }
  }, [
    standardEntries,
    quizEntries,
    wheelTitle,
    wheelDescription,
    standardHistory,
    quizHistory,
    appearanceTheme,
  ]);

  /*
   * Close Settings and normalize empty text fields.
   */
  function closeSettings() {
    setWheelTitle(
      wheelTitle.trim() ||
        DEFAULT_WHEEL_TITLE,
    );

    setWheelDescription(
      wheelDescription.trim() ||
        DEFAULT_WHEEL_DESCRIPTION,
    );

    setResetConfirmOpen(false);
    setImportError("");
    setPendingImport(null);
    setSettingsOpen(false);
  }

  /*
   * Keyboard support for the Settings modal.
   */
  useEffect(() => {
    if (!settingsOpen) {
      return;
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        setWheelTitle(
          (current) =>
            current.trim() ||
            DEFAULT_WHEEL_TITLE,
        );

        setWheelDescription(
          (current) =>
            current.trim() ||
            DEFAULT_WHEEL_DESCRIPTION,
        );

        setResetConfirmOpen(false);
        setImportError("");
        setPendingImport(null);
        setSettingsOpen(false);
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [settingsOpen]);

  /*
   * Entries currently being configured.
   */
  const currentSetupEntries =
    mode === "standard"
      ? standardEntries
      : quizEntries;

  /*
   * During Quiz mode, the current remaining pool
   * is rendered directly.
   *
   * The selected question stays visible until the
   * next action.
   */
  const wheelEntries =
    mode === "quiz" && quizStarted
      ? remainingQuizEntries
      : currentSetupEntries;

  /*
   * A quiz requires at least two complete
   * question/answer pairs.
   */
  const quizReady =
    quizEntries.length >= 2 &&
    quizEntries.every(
      (entry) =>
        Boolean(entry.question?.trim()) &&
        Boolean(entry.answer?.trim()),
    );

  /*
   * The final quiz question remains visible on the
   * wheel after being selected.
   */
  const quizComplete =
    mode === "quiz" &&
    quizStarted &&
    !spinning &&
    remainingQuizEntries.length === 1 &&
    selectedEntry !== null;

  function addEntry() {
    const entries =
      mode === "standard"
        ? standardEntries
        : quizEntries;

    const nextNumber =
      entries.length + 1;

    const newEntry: WheelEntry = {
      id: crypto.randomUUID(),
      label:
        mode === "quiz"
          ? `Question ${nextNumber}`
          : `Option ${nextNumber}`,
      color:
        COLORS[
          entries.length %
            COLORS.length
        ],
      question: "",
      answer: "",
    };

    if (mode === "standard") {
      setStandardEntries((current) => [
        ...current,
        newEntry,
      ]);
    } else {
      setQuizEntries((current) => [
        ...current,
        newEntry,
      ]);
    }

    setSelectedEntry(null);
    setShowAnswer(false);
  }

  function updateEntry(
    id: string,
    changes: Partial<WheelEntry>,
  ) {
    if (mode === "standard") {
      setStandardEntries((current) =>
        current.map((entry) =>
          entry.id === id
            ? { ...entry, ...changes }
            : entry,
        ),
      );
    } else {
      setQuizEntries((current) =>
        current.map((entry) =>
          entry.id === id
            ? { ...entry, ...changes }
            : entry,
        ),
      );
    }

    setSelectedEntry(null);
    setShowAnswer(false);
  }

  function deleteEntry(id: string) {
    const entries =
      mode === "standard"
        ? standardEntries
        : quizEntries;

    if (entries.length <= 2) {
      return;
    }

    if (mode === "standard") {
      setStandardEntries((current) =>
        current.filter(
          (entry) => entry.id !== id,
        ),
      );
    } else {
      setQuizEntries((current) =>
        current.filter(
          (entry) => entry.id !== id,
        ),
      );
    }

    setSelectedEntry(null);
    setShowAnswer(false);
  }

  function changeMode(nextMode: Mode) {
    if (spinning) {
      return;
    }

    setMode(nextMode);

    setSelectedEntry(null);
    setShowAnswer(false);

    /*
     * Changing modes exits any active quiz session,
     * but does not modify the saved quiz configuration.
     */
    setQuizStarted(false);
    setRemainingQuizEntries([]);

    setRotation(0);
  }

  function startQuiz() {
    if (!quizReady) {
      return;
    }

    /*
     * Start from a fresh copy of the complete
     * quiz configuration.
     *
     * quizEntries itself is never modified.
     */
    setRemainingQuizEntries([
      ...quizEntries,
    ]);

    setSelectedEntry(null);
    setShowAnswer(false);
    setRotation(0);
    setQuizStarted(true);
  }

  function backToQuizSetup() {
    if (spinning) {
      return;
    }

    /*
     * Restore the complete quiz pool for the
     * next session.
     */
    setRemainingQuizEntries([]);
    setSelectedEntry(null);
    setShowAnswer(false);
    setQuizStarted(false);
    setRotation(0);
  }

  function addHistoryItem(
    entry: WheelEntry,
    historyMode: Mode,
  ) {
    const item: SpinHistoryItem = {
      id: crypto.randomUUID(),
      entryId: entry.id,
      label: entry.label,
      mode: historyMode,
      question: entry.question,
      timestamp: Date.now(),
    };

    if (historyMode === "standard") {
      setStandardHistory((current) => [
        item,
        ...current,
      ]);
    } else {
      setQuizHistory((current) => [
        item,
        ...current,
      ]);
    }
  }

  function clearHistory(historyMode: Mode) {
    if (historyMode === "standard") {
      setStandardHistory([]);
    } else {
      setQuizHistory([]);
    }
  }

  function formatHistoryTime(timestamp: number) {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function spinWheel() {
    if (
      spinning ||
      wheelEntries.length < 2 ||
      (mode === "quiz" &&
        (!quizStarted || quizComplete))
    ) {
      return;
    }

    /*
     * ==========================================
     * STANDARD MODE
     * ==========================================
     *
     * Every Standard spin independently selects
     * one entry from the complete Standard wheel.
     *
     * There is deliberately NO shuffle bag,
     * no cycle, no previous-result exclusion,
     * and no memory of previous Standard spins.
     *
     * Therefore, if there are N entries, every
     * spin gives each entry exactly a 1/N chance.
     *
     * Repeats are completely valid, including
     * immediate repeats.
     */
    if (mode === "standard") {
      const selectedIndex =
        getRandomIndex(
          standardEntries.length,
        );

      const selected =
        standardEntries[selectedIndex];

      const segmentAngle =
        360 / standardEntries.length;

      const selectedCenter =
        selectedIndex *
          segmentAngle +
        segmentAngle / 2;

      /*
       * Normalize the current rotation so that
       * repeated spins remain synchronized.
       */
      const normalizedRotation =
        ((rotation % 360) + 360) %
        360;

      const desiredRotation =
        (360 - selectedCenter) % 360;

      const rotationDelta =
        (desiredRotation -
          normalizedRotation +
          360) %
        360;

      const extraSpins = 5 * 360;

      const targetRotation =
        rotation +
        extraSpins +
        rotationDelta;

      setSelectedEntry(null);
      setShowAnswer(false);
      setSpinning(true);
      setRotation(targetRotation);

      window.setTimeout(() => {
        setSelectedEntry(selected);
        setSpinning(false);
        addHistoryItem(selected, "standard");
      }, 4500);

      return;
    }

    /*
     * ==========================================
     * QUIZ MODE
     * ==========================================
     *
     * Quiz keeps its existing no-repeat behavior.
     */
    let entriesForSpin =
      wheelEntries;

    /*
     * If a question is currently displayed and the
     * user clicks Spin directly, remove that question
     * before selecting the next one.
     */
    if (
      mode === "quiz" &&
      selectedEntry
    ) {
      entriesForSpin =
        wheelEntries.filter(
          (entry) =>
            entry.id !==
            selectedEntry.id,
        );

      setRemainingQuizEntries(
        entriesForSpin,
      );
    }

    if (entriesForSpin.length < 2) {
      return;
    }

    /*
     * Randomly select from the remaining quiz
     * questions.
     *
     * Since questions are removed after progressing,
     * the same question cannot repeat during a
     * single quiz session.
     */
    const selectedIndex =
      getRandomIndex(
        entriesForSpin.length,
      );

    const selected =
      entriesForSpin[
        selectedIndex
      ];

    const segmentAngle =
      360 / entriesForSpin.length;

    const selectedCenter =
      selectedIndex *
        segmentAngle +
      segmentAngle / 2;

    const normalizedRotation =
      ((rotation % 360) + 360) %
      360;

    const desiredRotation =
      (360 - selectedCenter) % 360;

    const rotationDelta =
      (desiredRotation -
        normalizedRotation +
        360) %
      360;

    const extraSpins = 5 * 360;

    const targetRotation =
      rotation +
      extraSpins +
      rotationDelta;

    setSelectedEntry(null);
    setShowAnswer(false);
    setSpinning(true);
    setRotation(targetRotation);

    /*
     * IMPORTANT:
     *
     * Do not remove the newly selected question
     * during the animation.
     *
     * It stays on the wheel until Next Spin or
     * another Spin is clicked.
     */
    window.setTimeout(() => {
      setSelectedEntry(selected);
      setSpinning(false);
      addHistoryItem(selected, "quiz");
    }, 4500);
  }

  function nextSpin() {
    if (
      spinning ||
      !selectedEntry ||
      quizComplete
    ) {
      return;
    }

    /*
     * Remove the currently displayed question only
     * when the user explicitly chooses Next Spin.
     */
    setRemainingQuizEntries(
      (current) =>
        current.filter(
          (entry) =>
            entry.id !==
            selectedEntry.id,
        ),
    );

    setSelectedEntry(null);
    setShowAnswer(false);
  }

  function resetEntries() {
    if (spinning) {
      return;
    }

    if (mode === "standard") {
      setStandardEntries(
        createInitialEntries(),
      );
    } else {
      setQuizEntries(
        createInitialQuizEntries(),
      );

      setRemainingQuizEntries([]);
      setQuizStarted(false);
    }

    setSelectedEntry(null);
    setShowAnswer(false);
    setRotation(0);
  }

  function getExportData(): StoredWheelData {
    return {
      version: 1,
      standardEntries,
      quizEntries,
      wheelTitle,
      wheelDescription,
      standardHistory,
      quizHistory,
      appearanceTheme,
    };
  }

  function exportData() {
    const data = getExportData();
    const blob = new Blob(
      [JSON.stringify(data, null, 2)],
      { type: "application/json" },
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const safeTitle =
      wheelTitle
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") ||
      "spin-the-wheel";

    link.href = url;
    link.download = `${safeTitle}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function handleImportFile(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    setImportError("");

    file
      .text()
      .then((content) => {
        const parsed: unknown =
          JSON.parse(content);

        if (!isStoredWheelData(parsed)) {
          throw new Error(
            "This file is not a valid Spin the Wheel export.",
          );
        }

        const imported: StoredWheelData = {
          ...parsed,
          standardHistory:
            parsed.standardHistory ?? [],
          quizHistory:
            parsed.quizHistory ?? [],
          appearanceTheme:
            parsed.appearanceTheme &&
            parsed.appearanceTheme in
              APPEARANCE_THEMES
              ? parsed.appearanceTheme
              : "classic",
        };

        setPendingImport(imported);
      })
      .catch(() => {
        setImportError(
          "The selected file could not be imported. Choose a valid Spin the Wheel JSON export.",
        );
      });
  }

  function applyImportedData() {
    if (!pendingImport || spinning) {
      return;
    }

    setStandardEntries(
      pendingImport.standardEntries,
    );

    setQuizEntries(
      pendingImport.quizEntries,
    );

    setWheelTitle(
      pendingImport.wheelTitle,
    );

    setWheelDescription(
      pendingImport.wheelDescription,
    );

    setAppearanceTheme(
      pendingImport.appearanceTheme ?? "classic",
    );

    setStandardHistory(
      pendingImport.standardHistory ?? [],
    );

    setQuizHistory(
      pendingImport.quizHistory ?? [],
    );

    setRemainingQuizEntries([]);
    setQuizStarted(false);
    setSelectedEntry(null);
    setShowAnswer(false);
    setRotation(0);

    setPendingImport(null);
    setImportError("");
  }

  const spinAllowed =
    mode === "standard"
      ? standardEntries.length >= 2
      : quizStarted &&
        !quizComplete &&
        remainingQuizEntries.length >= 2;

  return (
    <main
      className={`min-h-screen text-slate-950 transition-colors ${APPEARANCE_THEMES[appearanceTheme].pageClass}`}
      style={{
        "--wheel-accent":
          APPEARANCE_THEMES[appearanceTheme].accentHex,
        "--wheel-accent-hover":
          APPEARANCE_THEMES[appearanceTheme].accentHoverHex,
      } as CSSProperties}
    >
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {wheelTitle}
            </h1>

            <p className="text-sm text-slate-500">
              {wheelDescription}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setSettingsOpen(true)
            }
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            Settings
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 pt-6">
        <div className="flex w-fit rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() =>
              changeMode("standard")
            }
            className={`rounded-lg px-5 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1 ${
              mode === "standard"
                ? `${APPEARANCE_THEMES[appearanceTheme].accentClass} text-white`
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Standard
          </button>

          <button
            type="button"
            onClick={() =>
              changeMode("quiz")
            }
            className={`rounded-lg px-5 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1 ${
              mode === "quiz"
                ? `${APPEARANCE_THEMES[appearanceTheme].accentClass} text-white`
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Quiz
          </button>
        </div>
      </div>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Main wheel area */}
        <div className={`rounded-2xl border border-slate-200 p-8 shadow-sm transition-colors ${APPEARANCE_THEMES[appearanceTheme].surfaceClass}`}>
          <div
            className={
              mode === "quiz"
                ? "flex min-h-[560px] items-center justify-center"
                : "flex min-h-[620px] items-center justify-center"
            }
          >
            <Wheel
              entries={wheelEntries}
              spinning={spinning}
              rotation={rotation}
              onSpin={spinWheel}
              canSpin={spinAllowed}
              accentClass={
                APPEARANCE_THEMES[appearanceTheme].accentClass
              }
              accentHoverClass={
                APPEARANCE_THEMES[appearanceTheme].accentHoverClass
              }
            />
          </div>

          {/* Quiz result area */}
          {mode === "quiz" && (
            <div className="mt-8 w-full">
              <div className={`mx-auto min-h-[180px] max-w-2xl rounded-2xl border border-slate-200 p-6 text-center transition-colors ${APPEARANCE_THEMES[appearanceTheme].subtleSurfaceClass}`}>
                {!quizStarted && (
                  <div className="flex min-h-[125px] items-center justify-center">
                    <p className="text-sm text-slate-400">
                      Start the quiz from the setup
                      panel.
                    </p>
                  </div>
                )}

                {quizStarted &&
                  !selectedEntry &&
                  !quizComplete && (
                    <div className="flex min-h-[125px] items-center justify-center">
                      <p className="text-sm text-slate-400">
                        Spin the wheel to reveal the
                        question.
                      </p>
                    </div>
                  )}

                {quizStarted &&
                  selectedEntry && (
                    <>
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                        {selectedEntry.label}
                      </p>

                      <p className="mt-3 text-lg font-semibold leading-7">
                        {selectedEntry.question ||
                          "No question has been entered."}
                      </p>

                      {!showAnswer && (
                        <button
                          type="button"
                          onClick={() =>
                            setShowAnswer(true)
                          }
                          className={`mt-6 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 ${APPEARANCE_THEMES[appearanceTheme].accentClass} ${APPEARANCE_THEMES[appearanceTheme].accentHoverClass}`}
                        >
                          Show Answer
                        </button>
                      )}

                      {showAnswer && (
                        <>
                          <div className="mt-6 rounded-xl border border-white/80 bg-white/90 p-4 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                              Answer
                            </p>

                            <p className="mt-2 text-base font-medium">
                              {selectedEntry.answer ||
                                "No answer has been entered."}
                            </p>
                          </div>

                          {quizComplete ? (
                            <div className="mt-5">
                              <p className="text-sm font-semibold text-slate-950">
                                Quiz Complete
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                All questions have been
                                selected.
                              </p>

                              <button
                                type="button"
                                onClick={
                                  backToQuizSetup
                                }
                                className="mt-4 rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                              >
                                Back to Setup
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={nextSpin}
                              className={`mt-4 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 ${APPEARANCE_THEMES[appearanceTheme].accentClass} ${APPEARANCE_THEMES[appearanceTheme].accentHoverClass}`}
                            >
                              Next Spin
                            </button>
                          )}
                        </>
                      )}
                    </>
                  )}
              </div>
            </div>
          )}

          {/* Standard result */}
          {mode === "standard" &&
            selectedEntry && (
              <div className="mt-6 text-center">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Result
                </p>

                <p className="mt-2 text-2xl font-bold">
                  {selectedEntry.label}
                </p>
              </div>
            )}
        </div>

        {/* Right-side controls */}
        <div>
          {/* Standard mode */}
          {mode === "standard" && (
            <>
              <EntryList
                entries={standardEntries}
                mode={mode}
                onAdd={addEntry}
                onUpdate={updateEntry}
                onDelete={deleteEntry}
                accentClass={
                  APPEARANCE_THEMES[appearanceTheme].accentClass
                }
                accentHoverClass={
                  APPEARANCE_THEMES[appearanceTheme].accentHoverClass
                }
              />

              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-slate-950">
                        Spin History
                      </h2>

                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                        {standardHistory.length}
                      </span>
                    </div>

                    <p className="mt-1 text-sm leading-5 text-slate-500">
                      A record of completed spins. History never affects randomness.
                    </p>
                  </div>

                  {standardHistory.length > 0 && (
                    <button
                      type="button"
                      onClick={() => clearHistory("standard")}
                      disabled={spinning}
                      className="shrink-0 text-xs font-semibold text-slate-400 transition hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {standardHistory.length === 0 ? (
                  <div className="mt-5 rounded-xl bg-slate-50 p-5 text-center">
                    <p className="text-sm text-slate-400">
                      No spins recorded yet.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 max-h-72 space-y-2 overflow-y-auto pr-1">
                    {standardHistory.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5"
                      >
                        <span className="w-7 shrink-0 text-xs font-semibold text-slate-400">
                          #{standardHistory.length - index}
                        </span>

                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
                          {item.label}
                        </span>

                        <span className="shrink-0 text-xs text-slate-400">
                          {formatHistoryTime(item.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Quiz setup */}
          {mode === "quiz" &&
            !quizStarted && (
              <div>
                <EntryList
                  entries={quizEntries}
                  mode={mode}
                  onAdd={addEntry}
                  onUpdate={updateEntry}
                  onDelete={deleteEntry}
                  accentClass={
                    APPEARANCE_THEMES[appearanceTheme].accentClass
                  }
                  accentHoverClass={
                    APPEARANCE_THEMES[appearanceTheme].accentHoverClass
                  }
                />

                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-semibold text-slate-950">
                          Quiz History
                        </h2>

                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                          {quizHistory.length}
                        </span>
                      </div>

                      <p className="mt-1 text-sm leading-5 text-slate-500">
                        Questions selected across quiz sessions.
                      </p>
                    </div>

                    {quizHistory.length > 0 && (
                      <button
                        type="button"
                        onClick={() => clearHistory("quiz")}
                        disabled={spinning}
                        className="shrink-0 text-xs font-semibold text-slate-400 transition hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {quizHistory.length === 0 ? (
                    <div className="mt-5 rounded-xl bg-slate-50 p-5 text-center">
                      <p className="text-sm text-slate-400">
                        No quiz questions recorded yet.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-5 max-h-72 space-y-2 overflow-y-auto pr-1">
                      {quizHistory.map((item, index) => (
                        <div
                          key={item.id}
                          className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-7 shrink-0 text-xs font-semibold text-slate-400">
                              #{quizHistory.length - index}
                            </span>

                            <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
                              {item.label}
                            </span>

                            <span className="shrink-0 text-xs text-slate-400">
                              {formatHistoryTime(item.timestamp)}
                            </span>
                          </div>

                          {item.question && (
                            <p className="mt-1 truncate pl-10 text-xs text-slate-400">
                              {item.question}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={startQuiz}
                  disabled={!quizReady}
                  className={`mt-4 w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 ${APPEARANCE_THEMES[appearanceTheme].accentClass} ${APPEARANCE_THEMES[appearanceTheme].accentHoverClass}`}
                >
                  Start Quiz
                </button>

                {!quizReady && (
                  <p className="mt-2 text-center text-xs text-slate-400">
                    Enter a question and answer for
                    every entry before starting.
                  </p>
                )}
              </div>
            )}

          {/* Quiz play mode */}
          {mode === "quiz" &&
            quizStarted && (
              <>
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold">
                  {quizComplete
                    ? "Quiz Complete"
                    : "Quiz in Progress"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {quizComplete
                    ? "All questions have been selected."
                    : "The contestant can now spin the wheel."}
                </p>

                {!quizComplete && (
                  <div className="mt-5 rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                      Questions Remaining
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                      {remainingQuizEntries.length}
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={backToQuizSetup}
                  disabled={spinning}
                  className="mt-6 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Back to Setup
                </button>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-slate-950">
                        Quiz History
                      </h2>

                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                        {quizHistory.length}
                      </span>
                    </div>

                    <p className="mt-1 text-sm leading-5 text-slate-500">
                      Questions selected across quiz sessions.
                    </p>
                  </div>

                  {quizHistory.length > 0 && (
                    <button
                      type="button"
                      onClick={() => clearHistory("quiz")}
                      disabled={spinning}
                      className="shrink-0 text-xs font-semibold text-slate-400 transition hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {quizHistory.length === 0 ? (
                  <div className="mt-5 rounded-xl bg-slate-50 p-5 text-center">
                    <p className="text-sm text-slate-400">
                      No quiz questions recorded yet.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 max-h-72 space-y-2 overflow-y-auto pr-1">
                    {quizHistory.map((item, index) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 shrink-0 text-xs font-semibold text-slate-400">
                            #{quizHistory.length - index}
                          </span>

                          <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
                            {item.label}
                          </span>

                          <span className="shrink-0 text-xs text-slate-400">
                            {formatHistoryTime(item.timestamp)}
                          </span>
                        </div>

                        {item.question && (
                          <p className="mt-1 truncate pl-10 text-xs text-slate-400">
                            {item.question}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                </div>
              </>
            )}
        </div>
      </section>

      {/* Settings modal */}
      {settingsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-6 backdrop-blur-sm"
          role="presentation"
        >
          <div
            className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2
                  id="settings-title"
                  className="text-xl font-bold"
                >
                  Settings
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Customize the basic appearance of
                  your wheel.
                </p>
              </div>

              <button
                type="button"
                onClick={closeSettings}
                className="text-lg leading-none text-slate-400 transition hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                aria-label="Close settings"
              >
                ×
              </button>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="wheel-title"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Wheel title
                </label>

                <input
                  id="wheel-title"
                  type="text"
                  value={wheelTitle}
                  onChange={(event) =>
                    setWheelTitle(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="wheel-description"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Description
                </label>

                <input
                  id="wheel-description"
                  type="text"
                  value={wheelDescription}
                  onChange={(event) =>
                    setWheelDescription(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold">
                  Current wheel
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {currentSetupEntries.length}{" "}
                  {mode === "quiz"
                    ? "questions configured."
                    : "entries configured."}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <p className="text-sm font-semibold">
                    Appearance
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Choose an accent and background style for
                    the app. Your wheel entries keep their own
                    colors.
                  </p>
                </div>

                <div className="mt-4 space-y-2">
                  {(Object.keys(
                    APPEARANCE_THEMES,
                  ) as AppearanceTheme[]).map(
                    (themeKey) => {
                      const theme =
                        APPEARANCE_THEMES[themeKey];

                      return (
                        <button
                          key={themeKey}
                          type="button"
                          onClick={() =>
                            setAppearanceTheme(
                              themeKey,
                            )
                          }
                          className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 ${
                            appearanceTheme ===
                            themeKey
                              ? "border-slate-400 bg-white shadow-sm"
                              : "border-slate-200 bg-white/70 hover:bg-white"
                          }`}
                          aria-pressed={
                            appearanceTheme ===
                            themeKey
                          }
                        >
                          <span
                            className={`h-8 w-8 shrink-0 rounded-full ${theme.swatchClass}`}
                            aria-hidden="true"
                          />

                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-slate-900">
                              {theme.label}
                            </span>

                            <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                              {theme.description}
                            </span>
                          </span>

                          {appearanceTheme ===
                            themeKey && (
                            <span className="text-xs font-semibold text-slate-500">
                              Selected
                            </span>
                          )}
                        </button>
                      );
                    },
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <p className="text-sm font-semibold">
                    Data
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Export your wheel setup and history, or
                    import a saved Spin the Wheel file.
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={exportData}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                  >
                    Export Data
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      importInputRef.current?.click()
                    }
                    disabled={spinning}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Import Data
                  </button>
                </div>

                <input
                  ref={importInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportFile}
                  className="hidden"
                />

                {importError && (
                  <p className="mt-3 text-xs leading-5 text-red-600">
                    {importError}
                  </p>
                )}

                {pendingImport && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Import this file?
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      This will replace the current wheel
                      configurations, appearance, title,
                      description, and saved history.
                    </p>

                    <div className="mt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setPendingImport(null)
                        }
                        className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={applyImportedData}
                        className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 ${APPEARANCE_THEMES[appearanceTheme].accentClass} ${APPEARANCE_THEMES[appearanceTheme].accentHoverClass}`}
                      >
                        Import
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  setResetConfirmOpen(true)
                }
                disabled={spinning}
                className="w-full rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reset Entries
              </button>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={closeSettings}
                className={`rounded-xl px-5 py-3 text-sm font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 ${APPEARANCE_THEMES[appearanceTheme].accentClass} ${APPEARANCE_THEMES[appearanceTheme].accentHoverClass}`}
              >
                Done
              </button>
            </div>

            {/* Reset confirmation */}
            {resetConfirmOpen && (
              <div
                className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-950/20 p-6"
                role="presentation"
              >
                <div
                  className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
                  role="alertdialog"
                  aria-modal="true"
                  aria-labelledby="reset-dialog-title"
                  aria-describedby="reset-dialog-description"
                >
                  <h3
                    id="reset-dialog-title"
                    className="text-lg font-bold"
                  >
                    Reset entries?
                  </h3>

                  <p
                    id="reset-dialog-description"
                    className="mt-2 text-sm leading-6 text-slate-500"
                  >
                    This will restore the current wheel
                    to its default entries. This action
                    cannot be undone.
                  </p>

                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setResetConfirmOpen(false)
                      }
                      className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        resetEntries();
                        setResetConfirmOpen(false);
                      }}
                      className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}