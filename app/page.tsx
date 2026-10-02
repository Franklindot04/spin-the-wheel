"use client";
import { useEffect, useRef, useState, } from "react";
import type { ChangeEvent, CSSProperties, SetStateAction, } from "react";
import EntryList from "./components/EntryList";
import SettingsPanel, { type WheelSettings as PanelWheelSettings, } from "./components/SettingsPanel";
import WheelComponent from "./components/Wheel";
import type { WheelEntry, } from "./lib/wheel-types";
import type { AppData, Mode, SpinHistoryItem, Wheel, } from "./lib/wheel-types";
import { APPEARANCE_THEMES, } from "./lib/appearance-themes";
import { panelSettingsToWheelSettings, wheelSettingsToPanelSettings, } from "./lib/settings-adapter";
import { COLORS, createInitialAppData, createInitialEntries, createInitialQuizEntries, createWheel, createDefaultWheelSettings, DEFAULT_WHEEL_DESCRIPTION, DEFAULT_WHEEL_TITLE, DEFAULT_SPIN_DURATION, DEFAULT_SPIN_SPEED, } from "./lib/wheel-defaults";
import { LEGACY_STORAGE_KEY, STORAGE_KEY, migrateStoredData, parseImportedData, serializeAppData, } from "./lib/wheel-storage";
import { formatHistoryTime, resolveStateValue, } from "./lib/wheel-utils";
export default function Home() {
    const [appData, setAppData] = useState<AppData>(createInitialAppData);
    const [mode, setMode] = useState<Mode>("standard");
    const activeWheel = appData.wheels.find((wheel) => wheel.id ===
        appData.activeWheelId) ??
        appData.wheels[0];
    const [remainingQuizEntries, setRemainingQuizEntries,] = useState<WheelEntry[]>([]);
    const [quizStarted, setQuizStarted,] = useState(false);
    const [rotation, setRotation,] = useState(0);
    const [spinning, setSpinning,] = useState(false);
    const [selectedEntry, setSelectedEntry,] = useState<WheelEntry | null>(null);
    const [showAnswer, setShowAnswer,] = useState(false);
    const [settingsOpen, setSettingsOpen,] = useState(false);
    const [historyOpen, setHistoryOpen,] = useState(false);
    const [resetConfirmOpen, setResetConfirmOpen,] = useState(false);
    const importInputRef = useRef<HTMLInputElement>(null);
    const [importError, setImportError,] = useState("");
    const [pendingImport, setPendingImport,] = useState<AppData | null>(null);
    const hasLoadedStorage = useRef(false);
    function updateActiveWheel(changes: Partial<Wheel>) {
        setAppData((current) => ({
            ...current,
            wheels: current.wheels.map((wheel) => wheel.id ===
                current.activeWheelId
                ? {
                    ...wheel,
                    ...changes,
                }
                : wheel),
        }));
    }
    function switchWheel(id: string) {
        if (spinning ||
            id ===
                appData.activeWheelId) {
            return;
        }
        setAppData((current) => ({
            ...current,
            activeWheelId: id,
        }));
        setRotation(0);
        setSelectedEntry(null);
        setShowAnswer(false);
        setRemainingQuizEntries([]);
        setQuizStarted(false);
        setHistoryOpen(false);
    }
    function addWheel() {
        if (spinning) {
            return;
        }
        const wheel = createWheel(appData.wheels.length + 1);
        setAppData((current) => ({
            ...current,
            wheels: [
                ...current.wheels,
                wheel,
            ],
            activeWheelId: wheel.id,
        }));
        setMode("standard");
        setRotation(0);
        setSelectedEntry(null);
        setShowAnswer(false);
        setRemainingQuizEntries([]);
        setQuizStarted(false);
        setHistoryOpen(false);
    }
    function renameActiveWheel() {
        if (spinning) {
            return;
        }
        const next = window.prompt("Wheel name", activeWheel.name);
        if (next === null) {
            return;
        }
        updateActiveWheel({
            name: next.trim() ||
                activeWheel.name,
        });
    }
    function editWheelTitle() {
        if (spinning) {
            return;
        }
        const next = window.prompt("Wheel title", wheelTitle);
        if (next === null) {
            return;
        }
        updateActiveWheel({
            title: next.trim() ||
                DEFAULT_WHEEL_TITLE,
        });
    }
    function editWheelDescription() {
        if (spinning) {
            return;
        }
        const next = window.prompt("Wheel description", wheelDescription);
        if (next === null) {
            return;
        }
        updateActiveWheel({
            description: next.trim() ||
                DEFAULT_WHEEL_DESCRIPTION,
        });
    }
    function deleteActiveWheel() {
        if (spinning ||
            appData.wheels.length <= 1) {
            return;
        }
        if (!window.confirm(`Delete ${activeWheel.name}?`)) {
            return;
        }
        setAppData((current) => {
            const remaining = current.wheels.filter((wheel) => wheel.id !==
                current.activeWheelId);
            return {
                ...current,
                wheels: remaining,
                activeWheelId: remaining[0].id,
            };
        });
        setRotation(0);
        setSelectedEntry(null);
        setShowAnswer(false);
        setRemainingQuizEntries([]);
        setQuizStarted(false);
        setHistoryOpen(false);
    }
    const standardEntries = activeWheel.standardEntries;
    const setStandardEntries = (next: SetStateAction<WheelEntry[]>) => {
        updateActiveWheel({
            standardEntries: resolveStateValue(next, activeWheel.standardEntries),
        });
    };
    const quizEntries = activeWheel.quizEntries;
    const setQuizEntries = (next: SetStateAction<WheelEntry[]>) => {
        updateActiveWheel({
            quizEntries: resolveStateValue(next, activeWheel.quizEntries),
        });
    };
    const wheelTitle = activeWheel.title;
    const wheelDescription = activeWheel.description;
    function handleSettingsChange(panelSettings: PanelWheelSettings) {
        updateActiveWheel({
            settings: panelSettingsToWheelSettings(panelSettings, activeWheel.settings),
        });
    }
    const panelSettings = wheelSettingsToPanelSettings(activeWheel.settings);
    const standardHistory = activeWheel.standardHistory;
    const setStandardHistory = (next: SetStateAction<SpinHistoryItem[]>) => {
        updateActiveWheel({
            standardHistory: resolveStateValue(next, activeWheel.standardHistory),
        });
    };
    const quizHistory = activeWheel.quizHistory;
    const setQuizHistory = (next: SetStateAction<SpinHistoryItem[]>) => {
        updateActiveWheel({
            quizHistory: resolveStateValue(next, activeWheel.quizHistory),
        });
    };
    useEffect(() => {
        const loadStoredData = () => {
            try {
                const savedV2 = window.localStorage.getItem(STORAGE_KEY);
                if (savedV2) {
                    const parsed: unknown = JSON.parse(savedV2);
                    const migrated = migrateStoredData(parsed);
                    if (migrated) {
                        setAppData(migrated);
                        return;
                    }
                }
                const savedV1 = window.localStorage.getItem(LEGACY_STORAGE_KEY);
                if (savedV1) {
                    const parsed: unknown = JSON.parse(savedV1);
                    const migrated = migrateStoredData(parsed);
                    if (migrated) {
                        setAppData(migrated);
                    }
                }
            }
            catch {
                // Ignore invalid or unavailable local storage.
            }
            finally {
                hasLoadedStorage.current =
                    true;
            }
        };
        const timer = window.setTimeout(loadStoredData, 0);
        return () => {
            window.clearTimeout(timer);
        };
    }, []);
    useEffect(() => {
        if (!hasLoadedStorage.current) {
            return;
        }
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
        }
        catch {
            // Ignore unavailable or full local storage.
        }
    }, [appData]);
    function closeSettings() {
        setResetConfirmOpen(false);
        setImportError("");
        setPendingImport(null);
        setSettingsOpen(false);
    }
    useEffect(() => {
        if (!settingsOpen) {
            return;
        }
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key ===
                "Escape") {
                closeSettings();
            }
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [settingsOpen]);
    const currentSetupEntries = mode === "standard"
        ? standardEntries
        : quizEntries;
    function toggleAllEntriesHidden() {
        if (spinning) {
            return;
        }
        const entries = mode === "standard"
            ? standardEntries
            : quizEntries;
        if (entries.length === 0) {
            return;
        }
        const shouldHide = entries.some((entry) => !entry.hidden);
        const updated = entries.map((entry) => ({
            ...entry,
            hidden: shouldHide,
        }));
        if (mode === "standard") {
            setStandardEntries(updated);
        }
        else {
            setQuizEntries(updated);
        }
    }
    const allEntriesHidden = currentSetupEntries.length > 0 &&
        currentSetupEntries.every((entry) => entry.hidden);
    const wheelEntries = mode === "quiz" &&
        quizStarted
        ? remainingQuizEntries.length > 0
            ? remainingQuizEntries
            : selectedEntry
                ? [selectedEntry]
                : []
        : currentSetupEntries;
    const quizReady = quizEntries.length >= 2 &&
        quizEntries.every((entry) => Boolean(entry.question?.trim()) &&
            Boolean(entry.answer?.trim()));
    const quizComplete = mode === "quiz" &&
        quizStarted &&
        !spinning &&
        remainingQuizEntries.length <=
            1 &&
        selectedEntry !== null;
    function addEntry() {
        const entries = mode === "standard"
            ? standardEntries
            : quizEntries;
        const nextNumber = entries.length + 1;
        const newEntry: WheelEntry = {
            id: crypto.randomUUID(),
            label: mode === "quiz"
                ? `Question ${nextNumber}`
                : `Option ${nextNumber}`,
            color: COLORS[entries.length %
                COLORS.length],
            question: "",
            answer: "",
            textColor: "#0f172a",
            fontFamily: "Arial, Helvetica, sans-serif",
            weight: 1,
            hidden: false,
        };
        if (mode === "standard") {
            setStandardEntries((current) => [
                ...current,
                newEntry,
            ]);
        }
        else {
            setQuizEntries((current) => [
                ...current,
                newEntry,
            ]);
        }
        setSelectedEntry(null);
        setShowAnswer(false);
    }
    function updateEntry(id: string, changes: Partial<WheelEntry>) {
        if (mode === "standard") {
            setStandardEntries((current) => current.map((entry) => entry.id === id
                ? {
                    ...entry,
                    ...changes,
                }
                : entry));
        }
        else {
            setQuizEntries((current) => current.map((entry) => entry.id === id
                ? {
                    ...entry,
                    ...changes,
                }
                : entry));
        }
        setSelectedEntry(null);
        setShowAnswer(false);
    }
    function duplicateEntry(id: string) {
        const entries = mode === "standard"
            ? standardEntries
            : quizEntries;
        const source = entries.find((entry) => entry.id === id);
        if (!source) {
            return;
        }
        const duplicate: WheelEntry = {
            ...source,
            id: crypto.randomUUID(),
            label: `${source.label} Copy`,
        };
        const nextEntries = entries.flatMap((entry) => entry.id === id
            ? [
                entry,
                duplicate,
            ]
            : [entry]);
        if (mode === "standard") {
            setStandardEntries(nextEntries);
        }
        else {
            setQuizEntries(nextEntries);
        }
        setSelectedEntry(null);
        setShowAnswer(false);
    }
    function deleteEntry(id: string) {
        const entries = mode === "standard"
            ? standardEntries
            : quizEntries;
        if (entries.length <= 2) {
            return;
        }
        if (mode === "standard") {
            setStandardEntries((current) => current.filter((entry) => entry.id !== id));
        }
        else {
            setQuizEntries((current) => current.filter((entry) => entry.id !== id));
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
        setQuizStarted(false);
        setRemainingQuizEntries([]);
        setRotation(0);
        setHistoryOpen(false);
    }
    function startQuiz() {
        if (!quizReady ||
            spinning) {
            return;
        }
        setRemainingQuizEntries([...quizEntries]);
        setSelectedEntry(null);
        setShowAnswer(false);
        setRotation(0);
        setQuizStarted(true);
    }
    function backToQuizSetup() {
        if (spinning) {
            return;
        }
        setRemainingQuizEntries([]);
        setSelectedEntry(null);
        setShowAnswer(false);
        setQuizStarted(false);
        setRotation(0);
    }
    function addHistoryItem(entry: WheelEntry, historyMode: Mode) {
        const item: SpinHistoryItem = {
            id: crypto.randomUUID(),
            entryId: entry.id,
            label: entry.label,
            mode: historyMode,
            question: entry.question,
            timestamp: Date.now(),
        };
        if (historyMode ===
            "standard") {
            setStandardHistory((current) => [
                item,
                ...current,
            ]);
        }
        else {
            setQuizHistory((current) => [
                item,
                ...current,
            ]);
        }
    }
    function clearHistory(historyMode: Mode) {
        if (historyMode ===
            "standard") {
            setStandardHistory([]);
        }
        else {
            setQuizHistory([]);
        }
    }
    function spinWheel() {
        if (spinning ||
            wheelEntries.length < 2 ||
            (mode === "quiz" &&
                (!quizStarted ||
                    quizComplete))) {
            return;
        }
        const entriesForSpin = wheelEntries.filter((entry) => !entry.hidden);
        if (entriesForSpin.length < 2) {
            return;
        }
        /*
         * The visual wheel uses weighted
         * slices, so winner selection uses
         * the same weights.
         */
        const getWeight = (entry: WheelEntry) => Math.max(1, Math.floor(entry.weight ?? 1));
        const totalWeight = entriesForSpin.reduce((sum, entry) => sum +
            getWeight(entry), 0);
        /*
         * Select a candidate using the
         * weighted probability distribution.
         */
        const randomValue = Math.random() *
            totalWeight;
        let accumulatedWeight = 0;
        let selectedIndex = 0;
        for (let index = 0; index <
            entriesForSpin.length; index += 1) {
            accumulatedWeight +=
                getWeight(entriesForSpin[index]);
            if (randomValue <
                accumulatedWeight) {
                selectedIndex =
                    index;
                break;
            }
        }
        /*
         * Calculate the exact weighted
         * geometry of the candidate slice.
         */
        let selectedStart = 0;
        for (let index = 0; index < selectedIndex; index += 1) {
            selectedStart +=
                (getWeight(entriesForSpin[index]) /
                    totalWeight) *
                    360;
        }
        const selected = entriesForSpin[selectedIndex];
        const selectedAngle = (getWeight(selected) /
            totalWeight) *
            360;
        const selectedCenter = selectedStart +
            selectedAngle / 2;
        const spinSpeed = activeWheel.settings
            .spinSpeed ??
            DEFAULT_SPIN_SPEED;
        const spinDuration = activeWheel.settings
            .spinDuration ??
            DEFAULT_SPIN_DURATION;
        /*
         * Normalize the current rotation
         * so repeated spins stay aligned.
         */
        const normalizedRotation = ((rotation %
            360) +
            360) % 360;
        /*
         * Wheel.tsx treats the fixed pointer
         * as angle 0 at the top.
         *
         * Therefore the selected slice center
         * must be rotated to angle 0.
         */
        const desiredRotation = (360 -
            selectedCenter) % 360;
        const rotationDelta = (desiredRotation -
            normalizedRotation +
            360) % 360;
        const extraSpins = (2 +
            spinSpeed * 0.6) * 360;
        const targetRotation = rotation +
            extraSpins +
            rotationDelta;
        /*
         * Hide the previous result while
         * the wheel is moving.
         */
        setSelectedEntry(null);
        setShowAnswer(false);
        setSpinning(true);
        setRotation(targetRotation);
        /*
         * Wait for the actual wheel animation
         * to finish before determining the result.
         *
         * The final result is calculated from
         * the physical final rotation rather
         * than trusting the originally selected
         * candidate.
         */
        window.setTimeout(() => {
            const finalRotation = ((targetRotation %
                360) +
                360) % 360;
            /*
             * Pointer is fixed at the top.
             * Convert the final wheel rotation
             * into the angle currently beneath
             * that pointer.
             */
            const pointerAngle = (360 -
                finalRotation +
                360) % 360;
            let finalStart = 0;
            let finalEntry = entriesForSpin[0];
            for (const entry of entriesForSpin) {
                const angle = (getWeight(entry) /
                    totalWeight) * 360;
                const finalEnd = finalStart +
                    angle;
                if (pointerAngle >=
                    finalStart &&
                    pointerAngle <
                        finalEnd) {
                    finalEntry =
                        entry;
                    break;
                }
                finalStart =
                    finalEnd;
            }
            setSelectedEntry(finalEntry);
            setSpinning(false);
            addHistoryItem(finalEntry, mode);
            if (mode === "quiz") {
                setRemainingQuizEntries((current) => current.filter((entry) => entry.id !==
                    finalEntry.id));
            }
        }, spinDuration * 1000);
    }
    function nextSpin() {
        if (spinning ||
            !selectedEntry ||
            quizComplete) {
            return;
        }
        setSelectedEntry(null);
        setShowAnswer(false);
    }
    function resetWheelToDefaults() {
        if (spinning) {
            return;
        }
        updateActiveWheel({
            standardEntries: createInitialEntries(),
            quizEntries: createInitialQuizEntries(),
            title: DEFAULT_WHEEL_TITLE,
            description: DEFAULT_WHEEL_DESCRIPTION,
            settings: createDefaultWheelSettings(),
            standardHistory: [],
            quizHistory: [],
        });
        setRemainingQuizEntries([]);
        setQuizStarted(false);
        setSelectedEntry(null);
        setShowAnswer(false);
        setRotation(0);
        setResetConfirmOpen(false);
    }
    function exportData() {
        const blob = new Blob([
            serializeAppData(appData),
        ], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const safeTitle = wheelTitle
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") ||
            "spin-the-wheel";
        link.href = url;
        link.download =
            `${safeTitle}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }
    function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) {
            return;
        }
        setImportError("");
        file
            .text()
            .then((content) => {
            const imported = parseImportedData(content);
            if (!imported) {
                throw new Error("Invalid import.");
            }
            setPendingImport(imported);
        })
            .catch(() => {
            setImportError("The selected file could not be imported. Choose a valid Spin the Wheel JSON export.");
        });
    }
    function applyImportedData() {
        if (!pendingImport ||
            spinning) {
            return;
        }
        setAppData(pendingImport);
        setMode("standard");
        setRemainingQuizEntries([]);
        setQuizStarted(false);
        setSelectedEntry(null);
        setShowAnswer(false);
        setRotation(0);
        setPendingImport(null);
        setImportError("");
        setSettingsOpen(false);
        setHistoryOpen(false);
    }
    const spinAllowed = mode === "standard"
        ? standardEntries.filter((entry) => !entry.hidden).length >= 2
        : quizStarted &&
            !quizComplete &&
            remainingQuizEntries.filter((entry) => !entry.hidden).length >= 2;
    const theme = APPEARANCE_THEMES[activeWheel.settings
        .appearanceTheme];
    const appearanceTheme = activeWheel.settings.appearanceTheme;
    const headerTextClass = appearanceTheme === "ocean"
        ? "text-cyan-950"
        : appearanceTheme === "forest"
            ? "text-emerald-950"
            : appearanceTheme === "sunset"
                ? "text-orange-950"
                : appearanceTheme === "violet"
                    ? "text-violet-950"
                    : "text-slate-900";
    const headerMutedClass = appearanceTheme === "ocean"
        ? "text-cyan-800"
        : appearanceTheme === "forest"
            ? "text-emerald-800"
            : appearanceTheme === "sunset"
                ? "text-orange-800"
                : appearanceTheme === "violet"
                    ? "text-violet-800"
                    : "text-slate-700";
    const headerTextColor = appearanceTheme === "ocean"
        ? "#164e63"
        : appearanceTheme === "forest"
            ? "#064e3b"
            : appearanceTheme === "sunset"
                ? "#7c2d12"
                : appearanceTheme === "violet"
                    ? "#4c1d95"
                    : "#0f172a";
    const headerMutedColor = appearanceTheme === "ocean"
        ? "#155e75"
        : appearanceTheme === "forest"
            ? "#065f46"
            : appearanceTheme === "sunset"
                ? "#9a3412"
                : appearanceTheme === "violet"
                    ? "#5b21b6"
                    : "#334155";
    const headerSurfaceClass = appearanceTheme === "ocean"
        ? "bg-cyan-100"
        : appearanceTheme === "forest"
            ? "bg-emerald-100"
            : appearanceTheme === "sunset"
                ? "bg-orange-100"
                : appearanceTheme === "violet"
                    ? "bg-violet-100"
                    : "bg-slate-100";
    const headerBorderClass = appearanceTheme === "ocean"
        ? "border-cyan-300"
        : appearanceTheme === "forest"
            ? "border-emerald-300"
            : appearanceTheme === "sunset"
                ? "border-orange-300"
                : appearanceTheme === "violet"
                    ? "border-violet-300"
                    : "border-slate-300";
    const headerHoverClass = appearanceTheme === "ocean"
        ? "hover:bg-cyan-200"
        : appearanceTheme === "forest"
            ? "hover:bg-emerald-200"
            : appearanceTheme === "sunset"
                ? "hover:bg-orange-200"
                : appearanceTheme === "violet"
                    ? "hover:bg-violet-200"
                    : "hover:bg-slate-200";
    const actionAccentClass = appearanceTheme === "classic"
        ? "bg-slate-700"
        : theme.accentClass;
    const actionHoverClass = appearanceTheme === "classic"
        ? "hover:bg-slate-600"
        : theme.accentHoverClass;
    return (<main className={`min-h-screen transition-colors ${theme.pageClass} ${theme.textPrimaryClass}`} style={{
            "--wheel-accent": theme.accentHex,
            "--wheel-accent-hover": theme.accentHoverHex,
        } as CSSProperties}>
      <header className={`border-b ${headerBorderClass} ${headerSurfaceClass}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className={`truncate text-xl font-bold tracking-tight ${headerTextClass}`} style={{ color: headerTextColor }}>
                {wheelTitle.trim() || DEFAULT_WHEEL_TITLE}
              </h1>
              <button type="button" onClick={editWheelTitle} disabled={spinning} aria-label="Edit wheel title" title="Edit title" className={`shrink-0 rounded-md p-1 transition ${headerHoverClass} disabled:cursor-not-allowed disabled:opacity-40`} style={{ color: headerMutedColor }}>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L8 18l-4 1 1-4Z"/>
                </svg>
              </button>
            </div>
            <div className="mt-1 flex items-center gap-1">
              <p className={`truncate text-sm ${headerMutedClass}`} style={{ color: headerMutedColor }}>
                {wheelDescription.trim() || DEFAULT_WHEEL_DESCRIPTION}
              </p>
              <button type="button" onClick={editWheelDescription} disabled={spinning} aria-label="Edit wheel description" title="Edit description" className={`shrink-0 rounded-md p-1 transition ${headerHoverClass} disabled:cursor-not-allowed disabled:opacity-40`} style={{ color: headerMutedColor }}>
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L8 18l-4 1 1-4Z"/>
                </svg>
              </button>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <select value={appData.activeWheelId} onChange={(event) => switchWheel(event.target.value)} disabled={spinning} aria-label="Select wheel" className={`rounded-lg border px-3 py-2 text-sm font-medium outline-none transition ${theme.controlClass} ${headerHoverClass} focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50`}>
              {appData.wheels.map((wheel) => (<option key={wheel.id} value={wheel.id}>
                    {wheel.name}
                  </option>))}
            </select>
            <button type="button" onClick={addWheel} disabled={spinning} className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${headerSurfaceClass} ${headerBorderClass} ${headerHoverClass} disabled:cursor-not-allowed disabled:opacity-50`} style={{ color: headerTextColor }}>
              + Wheel
            </button>
            {appData.wheels.length >
            1 && (<button type="button" onClick={deleteActiveWheel} disabled={spinning} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50">
                − Wheel
              </button>)}
            <button type="button" onClick={renameActiveWheel} disabled={spinning} className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${headerSurfaceClass} ${headerBorderClass} ${headerHoverClass} disabled:cursor-not-allowed disabled:opacity-50`} style={{ color: headerTextColor }}>
              Rename
            </button>
            <button type="button" onClick={() => setSettingsOpen(true)} disabled={spinning} className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${headerSurfaceClass} ${headerBorderClass} ${headerHoverClass} disabled:cursor-not-allowed disabled:opacity-50`} style={{ color: headerTextColor }}>
              Settings
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-6 pt-6">
        <div className={`flex w-fit rounded-xl border p-1 shadow-sm ${theme.borderClass} ${theme.surfaceClass}`}>
          <button type="button" onClick={() => changeMode("standard")} disabled={spinning} className={`rounded-lg px-5 py-2 text-sm font-medium transition ${mode === "standard"
            ? `${actionAccentClass} text-white`
            : `${theme.textSecondaryClass} ${theme.controlHoverClass}`} disabled:cursor-not-allowed disabled:opacity-50`}>
            Standard
          </button>
          <button type="button" onClick={() => changeMode("quiz")} disabled={spinning} className={`rounded-lg px-5 py-2 text-sm font-medium transition ${mode === "quiz"
            ? `${actionAccentClass} text-white`
            : `${theme.textSecondaryClass} ${theme.controlHoverClass}`} disabled:cursor-not-allowed disabled:opacity-50`}>
            Quiz
          </button>
        </div>
      </div>
      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className={`rounded-2xl border p-8 shadow-sm transition-colors ${theme.borderClass} ${theme.surfaceClass}`}>
          <div className={mode === "quiz"
            ? "flex min-h-[560px] items-center justify-center"
            : "flex min-h-[620px] items-center justify-center"}>
            <WheelComponent entries={wheelEntries} spinning={spinning} rotation={rotation} onSpin={spinWheel} canSpin={spinAllowed} spinDuration={activeWheel
            .settings
            .spinDuration} pointerMatchSliceColor={activeWheel
            .settings
            .pointerMatchSliceColor} accentClass={actionAccentClass} accentHoverClass={actionHoverClass}/>
          </div>
          {mode === "quiz" &&
            !quizStarted && (<div className={`mx-auto mt-6 max-w-2xl rounded-2xl border p-6 shadow-sm ${theme.borderClass} ${theme.surfaceClass}`}>
              <h2 className={`text-lg font-semibold ${theme.textPrimaryClass}`}>
                Quiz Mode
              </h2>
              <p className={`mt-1 text-sm leading-6 ${theme.textSecondaryClass}`}>
                Configure your questions and answers, then start the quiz before handing the wheel to the contestant.
              </p>
              {!quizReady && (<div className={`mt-4 rounded-xl p-4 text-sm ${theme.subtleSurfaceClass} ${theme.textSecondaryClass}`}>
                  Every question needs both a question and an answer before the quiz can start.
                </div>)}
            </div>)}
          {mode === "quiz" &&
            quizStarted &&
            selectedEntry && (<div className={`mx-auto mt-6 max-w-2xl rounded-2xl border p-6 text-center shadow-sm ${theme.borderClass} ${theme.surfaceClass}`}>
              <p className={`text-xs font-semibold uppercase tracking-widest ${theme.textMutedClass}`}>
                And the question is...
              </p>
              <p className={`mt-2 text-xl font-bold ${theme.textPrimaryClass}`}>
                {selectedEntry.label}
              </p>
              <div className={`mt-4 rounded-xl p-5 text-left ${theme.subtleSurfaceClass}`}>
                <p className={`text-xs font-semibold uppercase tracking-widest ${theme.textMutedClass}`}>
                  Your question
                </p>
                <p className={`mt-2 text-base leading-7 ${theme.textPrimaryClass}`}>
                  {selectedEntry.question}
                </p>
              </div>
              {showAnswer && (<div className={`mt-4 rounded-xl border p-5 text-left ${theme.borderClass} ${theme.surfaceClass}`}>
                  <p className={`text-xs font-semibold uppercase tracking-widest ${theme.textMutedClass}`}>
                    The answer
                  </p>
                  <p className={`mt-2 text-base leading-7 ${theme.textPrimaryClass}`}>
                    {selectedEntry.answer}
                  </p>
                </div>)}
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <button type="button" onClick={() => setShowAnswer((current) => !current)} className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${actionAccentClass} ${actionHoverClass}`}>
                  {showAnswer
                ? "Hide Answer"
                : "Show Answer"}
                </button>
                {!quizComplete && (<button type="button" onClick={nextSpin} disabled={spinning ||
                    remainingQuizEntries.length <
                        2} className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${theme.borderClass} ${theme.textSecondaryClass} ${theme.controlHoverClass} disabled:cursor-not-allowed disabled:opacity-40`}>
                    Give it another spin 😉
                  </button>)}
              </div>
            </div>)}
          {mode === "quiz" &&
            quizStarted &&
            !selectedEntry && (<div className={`mx-auto mt-6 max-w-2xl rounded-2xl border p-5 text-center ${theme.borderClass} ${theme.subtleSurfaceClass}`}>
              <p className={`text-sm font-semibold ${theme.textPrimaryClass}`}>
                Alright... give it a spin 😉
              </p>
              <p className={`mt-1 text-sm leading-6 ${theme.textSecondaryClass}`}>
                The question is waiting.
              </p>
            </div>)}
          {mode === "standard" &&
            selectedEntry && (<div className="mt-6 text-center">
              <p className={`text-xs font-semibold uppercase tracking-widest ${theme.textMutedClass}`}>
                Result
              </p>
              <p className={`mt-2 text-2xl font-bold ${theme.textPrimaryClass}`}>
                {selectedEntry.label}
              </p>
            </div>)}
        </div>
        <div>
          <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1">
            <button type="button" onClick={() => setHistoryOpen(false)} className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold transition ${!historyOpen
            ? `${actionAccentClass} text-white shadow-sm`
            : `${theme.borderClass} ${theme.surfaceClass} ${theme.textMutedClass} ${theme.controlHoverClass}`}`} aria-label="Show entries" title="Entries">
              Entries
            </button>
            <button type="button" onClick={() => setHistoryOpen(true)} className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold transition ${historyOpen
            ? `${actionAccentClass} text-white shadow-sm`
            : `${theme.borderClass} ${theme.surfaceClass} ${theme.textMutedClass} ${theme.controlHoverClass}`}`} aria-label="Show history" title="History">
              History
              <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${theme.subtleSurfaceClass} ${theme.textMutedClass}`}>
                {mode === "standard"
            ? standardHistory.length
            : quizHistory.length}
              </span>
            </button>
            <button type="button" onClick={toggleAllEntriesHidden} disabled={spinning ||
            currentSetupEntries.length === 0} className={`shrink-0 rounded-lg border p-2 transition ${theme.borderClass} ${theme.surfaceClass} ${theme.textSecondaryClass} ${theme.controlHoverClass} disabled:cursor-not-allowed disabled:opacity-40`} aria-label={allEntriesHidden
            ? "Show all entries"
            : "Hide all entries"} title={allEntriesHidden
            ? "Show all entries"
            : "Hide all entries"}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {allEntriesHidden ? (<>
                    <path d="M3 3l18 18"/>
                    <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/>
                    <path d="M9.9 5.1A10.8 10.8 0 0 1 12 4.8c6 0 9.5 7.2 9.5 7.2a17.4 17.4 0 0 1-3.2 3.8"/>
                    <path d="M6.2 6.2A17.6 17.6 0 0 0 2.5 12S6 19.2 12 19.2a10.8 10.8 0 0 0 4.1-.8"/>
                  </>) : (<>
                    <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/>
                    <circle cx="12" cy="12" r="2.5"/>
                  </>)}
              </svg>
            </button>
            <button type="button" onClick={exportData} disabled={spinning} className={`shrink-0 rounded-lg border p-2 transition ${theme.borderClass} ${theme.surfaceClass} ${theme.textSecondaryClass} ${theme.controlHoverClass} disabled:cursor-not-allowed disabled:opacity-40`} aria-label="Export data" title="Export data">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3v12"/>
                <path d="m7 10 5 5 5-5"/>
                <path d="M5 21h14"/>
              </svg>
            </button>
            <button type="button" onClick={() => importInputRef.current?.click()} disabled={spinning} className={`shrink-0 rounded-lg border p-2 transition ${theme.borderClass} ${theme.surfaceClass} ${theme.textSecondaryClass} ${theme.controlHoverClass} disabled:cursor-not-allowed disabled:opacity-40`} aria-label="Import data" title="Import data">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 21V9"/>
                <path d="m7 14 5-5 5 5"/>
                <path d="M5 3h14"/>
              </svg>
            </button>
            <input ref={importInputRef} type="file" accept=".json,application/json" onChange={handleImportFile} className="hidden"/>
          </div>
          {!historyOpen && (<>
              <EntryList entries={currentSetupEntries} mode={mode} onAdd={addEntry} onUpdate={updateEntry} onDelete={deleteEntry} onDuplicate={duplicateEntry} accentClass={actionAccentClass} accentHoverClass={actionHoverClass} theme={theme}/>
              <div className="mt-4">
                <button type="button" onClick={resetWheelToDefaults} disabled={spinning} className={`w-full rounded-lg border px-3 py-2 text-xs font-semibold transition ${theme.borderClass} ${theme.surfaceClass} ${theme.textSecondaryClass} ${theme.controlHoverClass} disabled:cursor-not-allowed disabled:opacity-40`}>
                  Reset Entries
                </button>
              </div>
            </>)}
          {historyOpen && (<div className={`rounded-2xl border p-6 shadow-sm ${theme.borderClass} ${theme.surfaceClass}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className={`text-base font-semibold ${theme.textPrimaryClass}`}>
                      Spin History
                    </h2>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${theme.subtleSurfaceClass} ${theme.textMutedClass}`}>
                      {(mode ===
                "standard"
                ? standardHistory
                : quizHistory).length}
                    </span>
                  </div>
                  <p className={`mt-1 text-sm leading-5 ${theme.textSecondaryClass}`}>
                    Completed spins are recorded here.
                  </p>
                </div>
                <button type="button" onClick={() => setHistoryOpen(false)} className={`text-sm font-semibold ${theme.textMutedClass} transition hover:opacity-80`}>
                  Close
                </button>
              </div>
              <div className="mt-5">
                {(mode ===
                "standard"
                ? standardHistory
                : quizHistory).length ===
                0 ? (<div className={`rounded-xl p-5 text-center ${theme.subtleSurfaceClass}`}>
                    <p className={`text-sm ${theme.textMutedClass}`}>
                      No spins recorded yet.
                    </p>
                  </div>) : (<div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                    {(mode ===
                    "standard"
                    ? standardHistory
                    : quizHistory).map((item, index) => (<div key={item.id} className={`rounded-xl border px-3 py-2.5 ${theme.borderClass} ${theme.subtleSurfaceClass}`}>
                          <div className="flex items-center gap-3">
                            <span className={`w-7 shrink-0 text-xs font-semibold ${theme.textMutedClass}`}>
                              #
                              {(mode ===
                        "standard"
                        ? standardHistory
                        : quizHistory).length -
                        index}
                            </span>
                            <span className={`min-w-0 flex-1 truncate text-sm font-medium ${theme.textPrimaryClass}`}>
                              {item.label}
                            </span>
                            <span className={`shrink-0 text-xs ${theme.textMutedClass}`}>
                              {formatHistoryTime(item.timestamp)}
                            </span>
                          </div>
                          {item.question && (<p className={`mt-1 truncate pl-10 text-xs ${theme.textMutedClass}`}>
                              {item.question}
                            </p>)}
                        </div>))}
                  </div>)}
              </div>
              <button type="button" onClick={() => clearHistory(mode)} disabled={(mode ===
                "standard"
                ? standardHistory
                : quizHistory).length === 0} className="mt-4 w-full rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40">
                Clear History
              </button>
            </div>)}
          {mode ===
            "quiz" &&
            !quizStarted && (<div className={`mt-6 rounded-2xl border p-6 shadow-sm ${theme.borderClass} ${theme.surfaceClass}`}>
              <h2 className={`text-base font-semibold ${theme.textPrimaryClass}`}>
                Quiz Setup
              </h2>
              <p className={`mt-1 text-sm leading-5 ${theme.textSecondaryClass}`}>
                Add a question and answer for every entry before starting.
              </p>
              <button type="button" onClick={startQuiz} disabled={!quizReady} className={`mt-5 w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${actionAccentClass} ${actionHoverClass}`}>
                Start Quiz
              </button>
              {!quizReady && (<p className={`mt-2 text-center text-xs ${theme.textMutedClass}`}>
                  Every question needs both a question and an answer.
                </p>)}
            </div>)}
          {mode ===
            "quiz" &&
            quizStarted && (<div className={`mt-6 rounded-2xl border p-6 shadow-sm ${theme.borderClass} ${theme.surfaceClass}`}>
              <h2 className={`text-lg font-semibold ${theme.textPrimaryClass}`}>
                {quizComplete
                ? "Quiz Complete"
                : "Quiz in Progress"}
              </h2>
              <p className={`mt-1 text-sm ${theme.textSecondaryClass}`}>
                {quizComplete
                ? "All questions have been selected."
                : "The contestant can now spin the wheel."}
              </p>
              {!quizComplete && (<div className={`mt-5 rounded-xl p-4 ${theme.subtleSurfaceClass}`}>
                  <p className={`text-xs font-semibold uppercase tracking-widest ${theme.textMutedClass}`}>
                    Questions Remaining
                  </p>
                  <p className={`mt-1 text-2xl font-bold ${theme.textPrimaryClass}`}>
                    {remainingQuizEntries.length}
                  </p>
                </div>)}
              <button type="button" onClick={backToQuizSetup} disabled={spinning} className={`mt-6 w-full rounded-lg border px-4 py-3 text-sm font-medium transition ${theme.borderClass} ${theme.textSecondaryClass} ${theme.controlHoverClass} disabled:cursor-not-allowed disabled:opacity-50`}>
                Back to Setup
              </button>
            </div>)}
        </div>
      </section>
      <footer className={`mx-auto flex max-w-7xl flex-col gap-2 border-t px-6 py-4 text-xs ${theme.borderClass} ${theme.textMutedClass} sm:flex-row sm:items-center sm:justify-between`}>
        <span>
          {activeWheel.name}
        </span>
        <span>
          {currentSetupEntries.length}{" "}
          {currentSetupEntries.length ===
            1
            ? "entry"
            : "entries"}
        </span>
      </footer>
      {settingsOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-label="Settings" onMouseDown={(event) => {
                if (event.target ===
                    event.currentTarget) {
                    closeSettings();
                }
            }}>
          <div className={`max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl shadow-2xl ${theme.surfaceClass}`}>
            <SettingsPanel settings={panelSettings} onSettingsChange={handleSettingsChange} onRestoreDefaults={resetWheelToDefaults} accentClass={actionAccentClass}/>
            <div className={`border-t px-5 py-4 ${theme.borderClass} ${theme.surfaceClass}`}>
              <button type="button" onClick={closeSettings} className={`w-full rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${theme.borderClass} ${theme.textSecondaryClass} ${theme.controlHoverClass}`}>
                Done
              </button>
            </div>
          </div>
        </div>)}
      {pendingImport && (<div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4">
          <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl ${theme.surfaceClass}`}>
            <h2 className={`text-lg font-semibold ${theme.textPrimaryClass}`}>
              Import wheel data?
            </h2>
            <p className={`mt-2 text-sm leading-6 ${theme.textSecondaryClass}`}>
              This will replace the current saved wheel data.
            </p>
            {importError && (<p className="mt-3 rounded-lg bg-red-950/40 px-3 py-2 text-sm text-red-300">
                {importError}
              </p>)}
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={applyImportedData} disabled={spinning} className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${actionAccentClass} ${actionHoverClass} disabled:cursor-not-allowed disabled:opacity-40`}>
                Import
              </button>
              <button type="button" onClick={() => setPendingImport(null)} className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${theme.borderClass} ${theme.textSecondaryClass} ${theme.controlHoverClass}`}>
                Cancel
              </button>
            </div>
          </div>
        </div>)}
      {resetConfirmOpen && (<div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4">
          <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl ${theme.surfaceClass}`}>
            <h2 className={`text-lg font-semibold ${theme.textPrimaryClass}`}>
              Restore defaults?
            </h2>
            <p className={`mt-2 text-sm leading-6 ${theme.textSecondaryClass}`}>
              This will restore the default entries, quiz questions, settings, title, description, and history.
            </p>
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={resetWheelToDefaults} disabled={spinning} className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${actionAccentClass} ${actionHoverClass} disabled:cursor-not-allowed disabled:opacity-40`}>
                Restore
              </button>
              <button type="button" onClick={() => setResetConfirmOpen(false)} className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${theme.borderClass} ${theme.textSecondaryClass} ${theme.controlHoverClass}`}>
                Cancel
              </button>
            </div>
          </div>
        </div>)}
    </main>);
}
