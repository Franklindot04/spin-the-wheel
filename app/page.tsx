"use client";
import { useEffect, useRef, useState, } from "react";
import type { ChangeEvent, CSSProperties, SetStateAction, } from "react";
import EntryList from "./components/EntryList";
import FeedbackDialog from "./components/FeedbackDialog";
import SettingsPanel, { type SettingsTab, type WheelSettings as PanelWheelSettings, } from "./components/SettingsPanel";
import WheelComponent from "./components/Wheel";
import type { WheelEntry, } from "./lib/wheel-types";
import type { AppData, Mode, SpinHistoryItem, Wheel, } from "./lib/wheel-types";
import { APPEARANCE_THEMES, THEME_STORAGE_KEY, } from "./lib/appearance-themes";
import { EMPTY_FEEDBACK_DRAFT, type FeedbackDraft, } from "./lib/feedback-client";
import { panelSettingsToWheelSettings, wheelSettingsToPanelSettings, } from "./lib/settings-adapter";
import { createEntry, createInitialAppData, createInitialEntries, createInitialQuizEntries, createWheel, createDefaultWheelSettings, DEFAULT_WHEEL_DESCRIPTION, DEFAULT_WHEEL_TITLE, DEFAULT_SPIN_DURATION, MAX_HISTORY_ITEMS, DEFAULT_SPIN_SPEED, MAX_SPIN_DURATION, MIN_SPIN_DURATION, DEFAULT_SOUND_ENABLED, DEFAULT_VOLUME, DEFAULT_CONFETTI_ENABLED, DEFAULT_CONFETTI_EFFECT, } from "./lib/wheel-defaults";
import { playWinnerSound, prepareEntrySound, setSoundSettings } from "./lib/sound-engine";
import { ImportError, MAX_IMPORT_FILE_SIZE, STORAGE_KEY, UNREADABLE_BACKUP_KEY, loadStoredAppData, parseImportedData, serializeAppData, } from "./lib/wheel-storage";
import type { StoredDataNotice } from "./lib/wheel-storage";
import { canDeleteEntry, formatHistoryTime, getEntryWeight, resolveStateValue, } from "./lib/wheel-utils";
import { shareLink } from "./lib/share";
function updateActiveWheelOf(current: AppData, changes: (wheel: Wheel) => Partial<Wheel>): AppData {
    return {
        ...current,
        wheels: current.wheels.map((wheel) => wheel.id ===
            current.activeWheelId
            ? {
                ...wheel,
                ...changes(wheel),
            }
            : wheel),
    };
}
const QUIZ_LOCKED_TEXT_KEYS: string[] = [
    "label",
    "question",
    "answer",
    "emoji",
];
export default function Home() {
    const [appData, setAppData] = useState<AppData>(createInitialAppData);
    const [mode, setMode] = useState<Mode>("standard");
    const activeWheel = appData.wheels.find((wheel) => wheel.id ===
        appData.activeWheelId) ??
        appData.wheels[0];
    const [askedQuizIds, setAskedQuizIds,] = useState<string[]>([]);
    const [quizStarted, setQuizStarted,] = useState(false);
    const [rotation, setRotation,] = useState(0);
    const [confettiRun, setConfettiRun,] = useState(0);
    const [confettiStop, setConfettiStop,] = useState(0);
    const answerConfettiFiredRef = useRef(false);
    const [spinning, setSpinning,] = useState(false);
    const [selectedEntry, setSelectedEntry,] = useState<WheelEntry | null>(null);
    const [showAnswer, setShowAnswer,] = useState(false);
    const [wheelExpanded, setWheelExpanded,] = useState(false);
    const [winnerBoxFits, setWinnerBoxFits,] = useState(true);
    const [spinFocusRequest, setSpinFocusRequest,] = useState(0);
    /* True once any spin has started since the page was opened. Not saved. */
    const [hasSpun, setHasSpun,] = useState(false);
    const [settingsOpen, setSettingsOpen,] = useState(false);
    const [settingsTab, setSettingsTab,] = useState<SettingsTab>("main");
    const [historyOpen, setHistoryOpen,] = useState(false);
    const [resetConfirmOpen, setResetConfirmOpen,] = useState(false);
    const [feedbackOpen, setFeedbackOpen,] = useState(false);
    /* What was typed in the feedback form. Kept in memory only, never saved. */
    const feedbackDraftRef = useRef<FeedbackDraft>(EMPTY_FEEDBACK_DRAFT);
    const feedbackRowRef = useRef<HTMLButtonElement>(null);
    const [entriesResetOpen, setEntriesResetOpen,] = useState(false);
    const importInputRef = useRef<HTMLInputElement>(null);
    const settingsButtonRef = useRef<HTMLButtonElement>(null);
    const settingsDialogRef = useRef<HTMLDivElement>(null);
    const resetDialogRef = useRef<HTMLDivElement>(null);
    const entriesResetDialogRef = useRef<HTMLDivElement>(null);
    const entriesResetButtonRef = useRef<HTMLButtonElement>(null);
    const [deleteCopyOpen, setDeleteCopyOpen,] = useState(false);
    const [deleteCopyFailed, setDeleteCopyFailed,] = useState(false);
    const deleteCopyDialogRef = useRef<HTMLDivElement>(null);
    const deleteCopyButtonRef = useRef<HTMLButtonElement>(null);
    const [importError, setImportError,] = useState("");
    const [saveFailed, setSaveFailed,] = useState(false);
    const [storedDataNotice, setStoredDataNotice,] = useState<StoredDataNotice | null>(null);
    const [v2StillUnreadable, setV2StillUnreadable,] = useState(false);
    const [storageStale, setStorageStale,] = useState(false);
    const storageStaleRef = useRef(false);
    const lastSeenStorageRef = useRef<string | null>(null);
    const importAlertRef = useRef<HTMLDivElement>(null);
    const saveAlertRef = useRef<HTMLDivElement>(null);
    const [pendingImport, setPendingImport,] = useState<AppData | null>(null);
    const [storageLoaded, setStorageLoaded,] = useState(false);
    const hasLoadedStorage = useRef(false);
    const mirroredThemeRef = useRef<string | null>(null);
    const spinTimerRef = useRef<number | null>(null);
    useEffect(() => {
        return () => {
            if (spinTimerRef.current !== null) {
                window.clearTimeout(spinTimerRef.current);
            }
        };
    }, []);
    const [shareMessage, setShareMessage,] = useState("");
    const shareTimerRef = useRef<number | null>(null);
    const shareUnmountedRef = useRef(false);
    useEffect(() => {
        shareUnmountedRef.current = false;
        return () => {
            shareUnmountedRef.current = true;
            if (shareTimerRef.current !== null) {
                window.clearTimeout(shareTimerRef.current);
            }
        };
    }, []);
    function showShareMessage(text: string) {
        if (shareUnmountedRef.current) {
            return;
        }
        if (shareTimerRef.current !== null) {
            window.clearTimeout(shareTimerRef.current);
        }
        setShareMessage(text);
        shareTimerRef.current = window.setTimeout(() => {
            shareTimerRef.current = null;
            setShareMessage("");
        }, 2500);
    }
    async function handleShare() {
        const result = await shareLink();
        if (result === "copied") {
            showShareMessage("Link copied");
        }
        else if (result === "failed") {
            showShareMessage("Could not copy the link");
        }
    }
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
    /*
     * Ends any confetti that is still running. Called whenever the
     * thing it was celebrating goes away.
     */
    function stopConfetti() {
        setConfettiStop((current) => current + 1);
    }
    function switchWheel(id: string) {
        if (spinning ||
            id ===
                appData.activeWheelId) {
            return;
        }
        stopConfetti();
        setAppData((current) => ({
            ...current,
            activeWheelId: id,
        }));
        setMode("standard");
        setRotation(0);
        setSelectedEntry(null);
        setShowAnswer(false);
        setAskedQuizIds([]);
        setQuizStarted(false);
        setHistoryOpen(false);
    }
    function addWheel() {
        if (spinning) {
            return;
        }
        stopConfetti();
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
        setAskedQuizIds([]);
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
        stopConfetti();
        setAppData((current) => {
            const remaining = current.wheels.filter((wheel) => wheel.id !==
                current.activeWheelId);
            return {
                ...current,
                wheels: remaining,
                activeWheelId: remaining[0].id,
            };
        });
        setMode("standard");
        setRotation(0);
        setSelectedEntry(null);
        setShowAnswer(false);
        setAskedQuizIds([]);
        setQuizStarted(false);
        setHistoryOpen(false);
    }
    const standardEntries = activeWheel.standardEntries;
    const setStandardEntries = (next: SetStateAction<WheelEntry[]>) => {
        setAppData((current) => updateActiveWheelOf(current, (wheel) => ({
            standardEntries: resolveStateValue(next, wheel.standardEntries),
        })));
    };
    const quizEntries = activeWheel.quizEntries;
    const setQuizEntries = (next: SetStateAction<WheelEntry[]>) => {
        setAppData((current) => updateActiveWheelOf(current, (wheel) => ({
            quizEntries: resolveStateValue(next, wheel.quizEntries),
        })));
    };
    /*
     * In Standard Mode the winner shows in a box on the wheel when
     * the wheel's winner display is Popup. The result panel is
     * shown instead when it is not, and as the fallback when the
     * wheel is too small for the box. Either way the drawn entry is
     * locked in the list while its result is showing, and the box
     * shows the entry as it was drawn.
     */
    const winnerPopup = activeWheel.settings.winnerDisplay === "popup";
    const standardResultExists = mode === "standard" &&
        selectedEntry !== null &&
        standardEntries.some((entry) => entry.id === selectedEntry.id);
    const winnerEntryExists = winnerPopup && standardResultExists;
    const winnerBoxShown = winnerEntryExists && winnerBoxFits;
    const lockedEntryId = standardResultExists && selectedEntry
        ? selectedEntry.id
        : null;
    const wheelTitle = activeWheel.title;
    const wheelDescription = activeWheel.description;
    function handleSettingsChange(changes: Partial<PanelWheelSettings>) {
        setAppData((current) => updateActiveWheelOf(current, (wheel) => ({
            settings: panelSettingsToWheelSettings({
                ...wheelSettingsToPanelSettings(wheel.settings),
                ...changes,
            }, wheel.settings),
        })));
    }
    const panelSettings = wheelSettingsToPanelSettings(activeWheel.settings);
    const soundEnabled = activeWheel.settings.soundEnabled ?? DEFAULT_SOUND_ENABLED;
    const soundVolume = activeWheel.settings.volume ?? DEFAULT_VOLUME;
    useEffect(() => {
        setSoundSettings({
            enabled: soundEnabled,
            volume: soundVolume,
        });
    }, [soundEnabled, soundVolume]);
    function toggleSound() {
        const next = !soundEnabled;
        /*
         * Tell the sound engine right away so ticks and a
         * winner sound that is playing stop at once, without
         * waiting for the next render.
         */
        setSoundSettings({
            enabled: next,
            volume: soundVolume,
        });
        setAppData((current) => updateActiveWheelOf(current, (wheel) => ({
            settings: {
                ...wheel.settings,
                soundEnabled: next,
            },
        })));
    }
    const standardHistory = activeWheel.standardHistory;
    const setStandardHistory = (next: SetStateAction<SpinHistoryItem[]>) => {
        setAppData((current) => updateActiveWheelOf(current, (wheel) => ({
            standardHistory: resolveStateValue(next, wheel.standardHistory),
        })));
    };
    const quizHistory = activeWheel.quizHistory;
    const setQuizHistory = (next: SetStateAction<SpinHistoryItem[]>) => {
        setAppData((current) => updateActiveWheelOf(current, (wheel) => ({
            quizHistory: resolveStateValue(next, wheel.quizHistory),
        })));
    };
    useEffect(() => {
        const loadStoredData = () => {
            try {
                const loaded = loadStoredAppData();
                if (loaded.data) {
                    setAppData(loaded.data);
                }
                setStoredDataNotice(loaded.notice);
                lastSeenStorageRef.current = window.localStorage.getItem(STORAGE_KEY);
                // Only an unreadable v2 stays unreadable until it is rewritten.
                setV2StillUnreadable(loaded.notice?.kind === "defaults");
            }
            catch {
                // Ignore invalid or unavailable local storage.
            }
            finally {
                setStorageLoaded(true);
            }
        };
        loadStoredData();
    }, []);
    useEffect(() => {
        hasLoadedStorage.current = storageLoaded;
    }, [storageLoaded]);
    useEffect(() => {
        function handleStorage(event: StorageEvent) {
            if (event.storageArea !== window.localStorage ||
                event.key !== STORAGE_KEY ||
                event.newValue === null ||
                event.newValue === lastSeenStorageRef.current) {
                return;
            }
            // Another tab saved newer data; stop saving here until the user reloads.
            storageStaleRef.current = true;
            setStorageStale(true);
        }
        window.addEventListener("storage", handleStorage);
        return () => {
            window.removeEventListener("storage", handleStorage);
        };
    }, []);
    useEffect(() => {
        if (!hasLoadedStorage.current ||
            storageStaleRef.current) {
            return;
        }
        let failed = false;
        let stale = false;
        try {
            const serialized = JSON.stringify(appData);
            const stored = window.localStorage.getItem(STORAGE_KEY);
            if (stored === serialized) {
                lastSeenStorageRef.current = serialized;
            }
            else if (stored !== null &&
                stored !== lastSeenStorageRef.current) {
                // Another tab saved since this tab last read or wrote; do not overwrite it.
                stale = true;
                storageStaleRef.current = true;
            }
            else {
                window.localStorage.setItem(STORAGE_KEY, serialized);
                lastSeenStorageRef.current = serialized;
            }
        }
        catch {
            // Keep the data in memory and tell the user it is not saved.
            failed = true;
        }
        // Keep the theme copy used by the loading screen in step with the active wheel.
        if (!storageStaleRef.current) {
            const activeTheme = (appData.wheels.find((wheel) => wheel.id ===
                appData.activeWheelId) ??
                appData.wheels[0])?.settings.appearanceTheme;
            if (activeTheme &&
                activeTheme !== mirroredThemeRef.current) {
                try {
                    window.localStorage.setItem(THEME_STORAGE_KEY, activeTheme);
                    mirroredThemeRef.current = activeTheme;
                }
                catch {
                    // The loading screen falls back to Classic.
                }
            }
        }
        // Report the result after the effect so the notice follows the latest write.
        queueMicrotask(() => {
            if (stale) {
                setStorageStale(true);
                return;
            }
            setSaveFailed(failed);
            if (!failed) {
                setV2StillUnreadable(false);
            }
        });
    }, [appData]);
    useEffect(() => {
        if (importError) {
            importAlertRef.current?.scrollIntoView({
                block: "nearest",
            });
        }
    }, [importError]);
    useEffect(() => {
        if (saveFailed) {
            saveAlertRef.current?.scrollIntoView({
                block: "nearest",
            });
        }
    }, [saveFailed]);
    function closeSettings() {
        setSettingsTab("main");
        setResetConfirmOpen(false);
        setPendingImport(null);
        setSettingsOpen(false);
    }
    useEffect(() => {
        if (!settingsOpen) {
            return;
        }
        const settingsButton = settingsButtonRef.current;
        const dialog = settingsDialogRef.current;
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key ===
                "Escape") {
                closeSettings();
                return;
            }
            if (event.key !==
                "Tab" ||
                !dialog) {
                return;
            }
            // Keep keyboard focus inside the dialog.
            const focusable = Array.from(dialog.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=\"-1\"])")).filter((element) => element.getClientRects().length > 0);
            if (focusable.length === 0) {
                event.preventDefault();
                return;
            }
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            const active = document.activeElement;
            if (event.shiftKey &&
                (active === first ||
                    active === dialog ||
                    !dialog.contains(active))) {
                event.preventDefault();
                last.focus();
            }
            else if (!event.shiftKey &&
                (active === last ||
                    !dialog.contains(active))) {
                event.preventDefault();
                first.focus();
            }
        }
        const previousBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handleKeyDown);
        dialog?.focus();
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = previousBodyOverflow;
            settingsButton?.focus();
        };
    }, [settingsOpen]);
    useEffect(() => {
        if (!resetConfirmOpen) {
            return;
        }
        const settingsButton = settingsButtonRef.current;
        const dialog = resetDialogRef.current;
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key ===
                "Escape") {
                cancelRestoreDefaults();
                return;
            }
            if (event.key !==
                "Tab" ||
                !dialog) {
                return;
            }
            // Keep keyboard focus inside the dialog.
            const focusable = Array.from(dialog.querySelectorAll<HTMLElement>("button:not([disabled])"));
            if (focusable.length === 0) {
                event.preventDefault();
                return;
            }
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            const active = document.activeElement;
            if (event.shiftKey &&
                (active === first ||
                    active === dialog ||
                    !dialog.contains(active))) {
                event.preventDefault();
                last.focus();
            }
            else if (!event.shiftKey &&
                (active === last ||
                    !dialog.contains(active))) {
                event.preventDefault();
                first.focus();
            }
        }
        window.addEventListener("keydown", handleKeyDown);
        dialog?.focus();
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            settingsButton?.focus();
        };
    }, [resetConfirmOpen]);
    useEffect(() => {
        if (!entriesResetOpen) {
            return;
        }
        const resetButton = entriesResetButtonRef.current;
        const dialog = entriesResetDialogRef.current;
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key ===
                "Escape") {
                setEntriesResetOpen(false);
                return;
            }
            if (event.key !==
                "Tab" ||
                !dialog) {
                return;
            }
            // Keep keyboard focus inside the dialog.
            const focusable = Array.from(dialog.querySelectorAll<HTMLElement>("button:not([disabled])"));
            if (focusable.length === 0) {
                event.preventDefault();
                return;
            }
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            const active = document.activeElement;
            if (event.shiftKey &&
                (active === first ||
                    active === dialog ||
                    !dialog.contains(active))) {
                event.preventDefault();
                last.focus();
            }
            else if (!event.shiftKey &&
                (active === last ||
                    !dialog.contains(active))) {
                event.preventDefault();
                first.focus();
            }
        }
        window.addEventListener("keydown", handleKeyDown);
        dialog?.focus();
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            resetButton?.focus();
        };
    }, [entriesResetOpen]);
    useEffect(() => {
        if (!deleteCopyOpen) {
            return;
        }
        const deleteCopyButton = deleteCopyButtonRef.current;
        const settingsButton = settingsButtonRef.current;
        const dialog = deleteCopyDialogRef.current;
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key ===
                "Escape") {
                setDeleteCopyOpen(false);
                return;
            }
            if (event.key !==
                "Tab" ||
                !dialog) {
                return;
            }
            // Keep keyboard focus inside the dialog.
            const focusable = Array.from(dialog.querySelectorAll<HTMLElement>("button:not([disabled])"));
            if (focusable.length === 0) {
                event.preventDefault();
                return;
            }
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            const active = document.activeElement;
            if (event.shiftKey &&
                (active === first ||
                    active === dialog ||
                    !dialog.contains(active))) {
                event.preventDefault();
                last.focus();
            }
            else if (!event.shiftKey &&
                (active === last ||
                    !dialog.contains(active))) {
                event.preventDefault();
                first.focus();
            }
        }
        window.addEventListener("keydown", handleKeyDown);
        dialog?.focus();
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            // The banner button is gone once the copy is deleted.
            if (deleteCopyButton?.isConnected) {
                deleteCopyButton.focus();
            }
            else {
                settingsButton?.focus();
            }
        };
    }, [deleteCopyOpen]);
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
        const restoreMarkedOnly = !shouldHide &&
            entries.some((entry) => entry.hiddenByHideAll === true);
        const updated = entries.map((entry) => shouldHide
            ? entry.hidden
                ? entry
                : {
                    ...entry,
                    hidden: true,
                    hiddenByHideAll: true,
                }
            : restoreMarkedOnly &&
                entry.hiddenByHideAll !== true
                ? entry
                : {
                    ...entry,
                    hidden: false,
                    hiddenByHideAll: undefined,
                });
        if (mode === "standard") {
            setStandardEntries(updated);
            if (shouldHide) {
                setSelectedEntry(null);
                setShowAnswer(false);
            }
        }
        else {
            setQuizEntries(updated);
            if (shouldHide) {
                setSelectedEntry(null);
                setShowAnswer(false);
            }
        }
    }
    const allEntriesHidden = currentSetupEntries.length > 0 &&
        currentSetupEntries.every((entry) => entry.hidden);
    const remainingQuizEntries = quizEntries.filter((entry) => !askedQuizIds.includes(entry.id));
    const remainingVisibleQuizCount = remainingQuizEntries.filter((entry) => !entry.hidden).length;
    const displayedQuizEntry = selectedEntry
        ? quizEntries.find((entry) => entry.id === selectedEntry.id) ?? null
        : null;
    const minSpinEntries = mode === "quiz"
        ? 1
        : 2;
    const wheelEntries = mode === "quiz" &&
        quizStarted
        ? remainingVisibleQuizCount > 0
            ? displayedQuizEntry
                ? quizEntries.filter((entry) => !askedQuizIds.includes(entry.id) ||
                    entry.id === displayedQuizEntry.id)
                : remainingQuizEntries
            : displayedQuizEntry
                ? [
                    {
                        ...displayedQuizEntry,
                        hidden: false,
                    },
                ]
                : []
        : currentSetupEntries;
    const quizEntriesComplete = quizEntries.length >= 2 &&
        quizEntries.every((entry) => Boolean(entry.question?.trim()) &&
            Boolean(entry.answer?.trim()));
    const enoughVisibleQuizEntries = quizEntries.filter((entry) => !entry.hidden).length >= 2;
    const quizReady = quizEntriesComplete &&
        enoughVisibleQuizEntries;
    const quizComplete = mode === "quiz" &&
        quizStarted &&
        !spinning &&
        remainingQuizEntries.length === 0;
    const remainingQuizEntriesHidden = mode === "quiz" &&
        quizStarted &&
        remainingQuizEntries.length > 0 &&
        remainingVisibleQuizCount === 0;
    const quizTextLocked = mode === "quiz" &&
        quizStarted;
    const wheelEmptyTitle = quizComplete
        ? "Quiz complete"
        : remainingQuizEntriesHidden
            ? "All remaining questions are hidden"
            : undefined;
    const wheelEmptyMessage = quizComplete
        ? "Every question has been asked. Back to Setup to run it again."
        : remainingQuizEntriesHidden
            ? "Show one to keep going, or go back to setup."
            : undefined;
    function addEntry() {
        if (spinning) {
            return;
        }
        if (mode === "quiz" &&
            quizStarted) {
            return;
        }
        const entries = mode === "standard"
            ? standardEntries
            : quizEntries;
        if (entries.length >= activeWheel.settings.maxEntries) {
            return;
        }
        const nextNumber = entries.length + 1;
        const newEntry: WheelEntry = createEntry(crypto.randomUUID(), mode === "quiz"
            ? `Question ${nextNumber}`
            : `Option ${nextNumber}`, entries.length);
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
        if (spinning ||
            id === lockedEntryId) {
            return;
        }
        if (quizTextLocked) {
            changes = Object.fromEntries(Object.entries(changes).filter(([key]) => !QUIZ_LOCKED_TEXT_KEYS.includes(key))) as Partial<WheelEntry>;
            if (Object.keys(changes).length === 0) {
                return;
            }
        }
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
        const isTextEdit = Object.keys(changes).every((key) => key === "label" ||
            key === "question" ||
            key === "answer" ||
            key === "emoji");
        if (mode === "standard" &&
            !isTextEdit) {
            setSelectedEntry(null);
            setShowAnswer(false);
        }
    }
    function duplicateEntry(id: string) {
        if (spinning ||
            id === lockedEntryId) {
            return;
        }
        if (mode === "quiz" &&
            quizStarted) {
            return;
        }
        const entries = mode === "standard"
            ? standardEntries
            : quizEntries;
        const source = entries.find((entry) => entry.id === id);
        if (!source ||
            entries.length >= activeWheel.settings.maxEntries) {
            return;
        }
        const duplicate: WheelEntry = {
            ...source,
            id: crypto.randomUUID(),
            label: `${source.label} Copy`,
            hidden: false,
            hiddenByHideAll: undefined,
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
        if (spinning ||
            id === lockedEntryId) {
            return;
        }
        if (mode === "quiz" &&
            quizStarted) {
            return;
        }
        const entries = mode === "standard"
            ? standardEntries
            : quizEntries;
        const target = entries.find((entry) => entry.id === id);
        if (!target ||
            !canDeleteEntry(entries, target)) {
            return;
        }
        if (mode === "standard") {
            setStandardEntries((current) => current.filter((entry) => entry.id !== id));
        }
        else {
            setQuizEntries((current) => current.filter((entry) => entry.id !== id));
        }
        if (mode === "standard") {
            setSelectedEntry(null);
            setShowAnswer(false);
        }
    }
    function changeMode(nextMode: Mode) {
        if (spinning) {
            return;
        }
        stopConfetti();
        setMode(nextMode);
        setSelectedEntry(null);
        setShowAnswer(false);
        setQuizStarted(false);
        setAskedQuizIds([]);
        setRotation(0);
        setHistoryOpen(false);
    }
    function startQuiz() {
        if (!quizReady ||
            spinning) {
            return;
        }
        stopConfetti();
        setAskedQuizIds([]);
        setSelectedEntry(null);
        setShowAnswer(false);
        setRotation(0);
        setQuizStarted(true);
    }
    function backToQuizSetup() {
        if (spinning) {
            return;
        }
        stopConfetti();
        setAskedQuizIds([]);
        setSelectedEntry(null);
        setShowAnswer(false);
        setQuizStarted(false);
        setRotation(0);
    }
    function dismissQuizCard() {
        if (spinning) {
            return;
        }
        setSelectedEntry(null);
        setShowAnswer(false);
    }
    function addHistoryItem(entry: WheelEntry, historyMode: Mode) {
        const item: SpinHistoryItem = {
            id: crypto.randomUUID(),
            entryId: entry.id,
            label: entry.label,
            emoji: entry.emoji,
            mode: historyMode,
            question: entry.question,
            timestamp: Date.now(),
        };
        if (historyMode ===
            "standard") {
            setStandardHistory((current) => [
                item,
                ...current,
            ].slice(0, MAX_HISTORY_ITEMS));
        }
        else {
            setQuizHistory((current) => [
                item,
                ...current,
            ].slice(0, MAX_HISTORY_ITEMS));
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
        const spinPool = mode === "quiz"
            ? remainingQuizEntries
            : wheelEntries;
        if (spinning ||
            spinPool.length < minSpinEntries ||
            (mode === "quiz" &&
                (!quizStarted ||
                    quizComplete))) {
            return;
        }
        const entriesForSpin = spinPool.filter((entry) => !entry.hidden);
        if (entriesForSpin.length < minSpinEntries) {
            return;
        }
        /*
         * The visual wheel uses weighted
         * slices, so winner selection uses
         * the same weights.
         */
        const totalWeight = entriesForSpin.reduce((sum, entry) => sum +
            getEntryWeight(entry), 0);
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
                getEntryWeight(entriesForSpin[index]);
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
                (getEntryWeight(entriesForSpin[index]) /
                    totalWeight) *
                    360;
        }
        const selected = entriesForSpin[selectedIndex];
        prepareEntrySound(selected.winnerSound);
        const selectedAngle = (getEntryWeight(selected) /
            totalWeight) *
            360;
        const selectedCenter = selectedStart +
            selectedAngle / 2;
        const spinSpeed = activeWheel.settings
            .spinSpeed ??
            DEFAULT_SPIN_SPEED;
        const spinDuration = Math.min(MAX_SPIN_DURATION, Math.max(MIN_SPIN_DURATION, activeWheel.settings
            .spinDuration ??
            DEFAULT_SPIN_DURATION));
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
        answerConfettiFiredRef.current = false;
        setSpinning(true);
        setHasSpun(true);
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
        spinTimerRef.current = window.setTimeout(() => {
            spinTimerRef.current = null;
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
                const angle = (getEntryWeight(entry) /
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
            /*
             * In Quiz Mode the winner sound and the confetti wait
             * for Show Answer.
             */
            answerConfettiFiredRef.current = false;
            if (mode !== "quiz") {
                playWinnerSound(activeWheel.settings.winnerSound ?? "success", finalEntry.winnerSound);
                setConfettiRun((current) => current + 1);
            }
            addHistoryItem(finalEntry, mode);
            if (mode === "quiz") {
                setAskedQuizIds((current) => [
                    ...current,
                    finalEntry.id,
                ]);
            }
        }, spinDuration * 1000);
    }
    /*
     * The winner box. Continue closes it. Remove hides the drawn
     * entry the same way its eye does, then closes it.
     */
    function closeWinnerBox() {
        if (spinning) {
            return;
        }
        setSelectedEntry(null);
    }
    function removeWinner() {
        if (spinning ||
            mode !== "standard" ||
            !selectedEntry ||
            standardEntries.filter((entry) => !entry.hidden).length <= 2) {
            return;
        }
        /*
         * The drawn entry is locked while the box is open, so this
         * hides it directly instead of going through updateEntry.
         */
        const removedId = selectedEntry.id;
        setStandardEntries((current) => current.map((entry) => entry.id === removedId
            ? {
                ...entry,
                hidden: true,
                hiddenByHideAll: undefined,
            }
            : entry));
        setSelectedEntry(null);
        setShowAnswer(false);
    }
    /*
     * Clear result, on the result panel: closes the result like
     * Continue does, never hides the entry, and sends focus to Spin.
     */
    /* The quiz box's Hide Answer: hides the answer in the card too. */
    function hideQuizAnswer() {
        setShowAnswer(false);
    }
    function clearResult() {
        if (spinning) {
            return;
        }
        setSelectedEntry(null);
        setSpinFocusRequest((current) => current + 1);
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
        stopConfetti();
        updateActiveWheel({
            standardEntries: createInitialEntries(),
            quizEntries: createInitialQuizEntries(),
            title: DEFAULT_WHEEL_TITLE,
            description: DEFAULT_WHEEL_DESCRIPTION,
            settings: createDefaultWheelSettings(),
            standardHistory: [],
            quizHistory: [],
        });
        setAskedQuizIds([]);
        setQuizStarted(false);
        setSelectedEntry(null);
        setShowAnswer(false);
        setRotation(0);
        setResetConfirmOpen(false);
        setSettingsTab("main");
    }
    function openResetEntries() {
        if (spinning) {
            return;
        }
        setEntriesResetOpen(true);
    }
    function resetCurrentEntries() {
        if (spinning) {
            return;
        }
        stopConfetti();
        if (mode === "standard") {
            setStandardEntries(createInitialEntries());
        }
        else {
            setQuizEntries(createInitialQuizEntries());
        }
        setAskedQuizIds([]);
        setQuizStarted(false);
        setSelectedEntry(null);
        setShowAnswer(false);
        setRotation(0);
        setEntriesResetOpen(false);
    }
    function openRestoreDefaults() {
        if (spinning) {
            return;
        }
        setSettingsOpen(false);
        setResetConfirmOpen(true);
    }
    function cancelRestoreDefaults() {
        setResetConfirmOpen(false);
        setSettingsOpen(true);
    }
    function openFeedback() {
        if (spinning) {
            return;
        }
        setSettingsOpen(false);
        setFeedbackOpen(true);
    }
    function closeFeedback() {
        setFeedbackOpen(false);
        setSettingsOpen(true);
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
    function exportRawData() {
        if (!storedDataNotice) {
            return;
        }
        const blob = new Blob([
            storedDataNotice.raw,
        ], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download =
            "spin-the-wheel-unreadable.json";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }
    function deleteUnreadableCopy() {
        setDeleteCopyFailed(false);
        // A memory-only copy was never stored, so there is nothing to verify.
        let deleted = storedDataNotice?.memoryOnly === true;
        try {
            window.localStorage.removeItem(UNREADABLE_BACKUP_KEY);
            // Read the key back so a silent failure is not reported as deleted.
            deleted =
                deleted ||
                    window.localStorage.getItem(UNREADABLE_BACKUP_KEY) === null;
        }
        catch {
            // The copy may still be stored; keep the banner unless it was memory-only.
        }
        if (deleted) {
            setStoredDataNotice(null);
        }
        else {
            setDeleteCopyFailed(true);
        }
        setDeleteCopyOpen(false);
    }
    function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) {
            return;
        }
        setImportError("");
        if (file.size > MAX_IMPORT_FILE_SIZE) {
            setImportError(`This file is too large to import. The limit is ${MAX_IMPORT_FILE_SIZE / (1024 * 1024)} MB.`);
            return;
        }
        file
            .text()
            .then((content) => {
            setPendingImport(parseImportedData(content));
        })
            .catch((error: unknown) => {
            setImportError(error instanceof ImportError
                ? error.message
                : "The selected file could not be imported. Choose a valid Spin the Wheel JSON export.");
        });
    }
    function applyImportedData() {
        if (!pendingImport ||
            spinning) {
            return;
        }
        stopConfetti();
        setAppData(pendingImport);
        setMode("standard");
        setAskedQuizIds([]);
        setQuizStarted(false);
        setSelectedEntry(null);
        setShowAnswer(false);
        setRotation(0);
        setPendingImport(null);
        setImportError("");
        setSettingsTab("main");
        setSettingsOpen(false);
        setHistoryOpen(false);
    }
    const spinAllowed = mode === "standard"
        ? standardEntries.filter((entry) => !entry.hidden).length >= 2
        : quizStarted &&
            !quizComplete &&
            remainingVisibleQuizCount >= minSpinEntries;
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
        ? "not-disabled:hover:bg-cyan-200"
        : appearanceTheme === "forest"
            ? "not-disabled:hover:bg-emerald-200"
            : appearanceTheme === "sunset"
                ? "not-disabled:hover:bg-orange-200"
                : appearanceTheme === "violet"
                    ? "not-disabled:hover:bg-violet-200"
                    : "not-disabled:hover:bg-slate-200";
    const actionAccentClass = appearanceTheme === "classic"
        ? "bg-slate-700"
        : theme.accentClass;
    const actionHoverClass = appearanceTheme === "classic"
        ? "not-disabled:hover:bg-slate-600"
        : theme.accentHoverClass;
    /*
     * The result and the quiz card are drawn twice while the wheel is
     * full screen: once in the page, hidden behind the full-screen view,
     * and once inside the view (inView). Only the copy in the view is
     * reachable, and it leaves out Back to Setup and Done.
     */
    /*
     * Show Answer plays the winner sound and fires the
     * confetti once for each drawn question. Hiding the
     * answer and showing it again does not repeat them. A
     * new draw resets this.
     */
    function toggleAnswer() {
        const reveal = !showAnswer;
        setShowAnswer(reveal);
        if (reveal && !answerConfettiFiredRef.current) {
            answerConfettiFiredRef.current = true;
            playWinnerSound(activeWheel.settings.winnerSound ?? "success", selectedEntry?.winnerSound);
            setConfettiRun((current) => current + 1);
        }
    }
    const winnerRemoveDisabled = standardEntries.filter((entry) => !entry.hidden).length <= 2;
    function renderStandardResult(inView: boolean) {
        if (!selectedEntry) {
            return null;
        }
        return (<div className={inView ? "text-center" : "mt-6 text-center"} inert={inView ? undefined : wheelExpanded} aria-hidden={inView ? undefined : wheelExpanded || undefined}>
          <p className={`text-xs font-semibold uppercase tracking-widest ${theme.textMutedClass}`}>
            Result
          </p>
          <p className={`mt-2 break-words text-2xl font-bold ${theme.textPrimaryClass}`}>
            {selectedEntry.emoji && (<span aria-hidden="true">{selectedEntry.emoji}{" "}</span>)}
            {selectedEntry.label}
          </p>
          <button type="button" onClick={clearResult} className={`mt-1 min-h-11 rounded-lg px-3 text-xs font-semibold underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current ${theme.textMutedClass}`}>
            Clear result
          </button>
        </div>);
    }
    function renderQuizCard(inView: boolean) {
        if (!displayedQuizEntry) {
            return null;
        }
        return (<div inert={inView ? undefined : wheelExpanded} aria-hidden={inView ? undefined : wheelExpanded || undefined} className={`mx-auto max-w-2xl rounded-2xl border text-center shadow-sm ${inView ? "p-4" : "mt-6 p-6"} ${theme.borderClass} ${theme.surfaceClass}`}>
          <p className={`text-xs font-semibold uppercase tracking-widest ${theme.textMutedClass}`}>
            And the question is...
          </p>
          <p className={`mt-2 break-words text-xl font-bold ${theme.textPrimaryClass}`}>
            {displayedQuizEntry.emoji && (<span aria-hidden="true">{displayedQuizEntry.emoji}{" "}</span>)}
            {displayedQuizEntry.label}
          </p>
          <div className={`mt-4 rounded-xl p-5 text-left ${theme.subtleSurfaceClass}`}>
            <p className={`text-xs font-semibold uppercase tracking-widest ${theme.textMutedClass}`}>
              Your question
            </p>
            <p tabIndex={0} className={`mt-2 max-h-60 overflow-y-auto break-words pr-1 text-base leading-7 ${theme.textPrimaryClass}`}>
              {displayedQuizEntry.question}
            </p>
          </div>
          {showAnswer && (<div className={`mt-4 rounded-xl border p-5 text-left ${theme.borderClass} ${theme.surfaceClass}`}>
              <p className={`text-xs font-semibold uppercase tracking-widest ${theme.textMutedClass}`}>
                The answer
              </p>
              <p tabIndex={0} className={`mt-2 max-h-60 overflow-y-auto break-words pr-1 text-base leading-7 ${theme.textPrimaryClass}`}>
                {displayedQuizEntry.answer}
              </p>
            </div>)}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button type="button" data-keep-quiz-box="" onClick={toggleAnswer} className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${actionAccentClass} ${actionHoverClass}`}>
              {showAnswer
            ? "Hide Answer"
            : "Show Answer"}
            </button>
            {!quizComplete &&
                !remainingQuizEntriesHidden && (<button type="button" onClick={nextSpin} disabled={spinning ||
                remainingVisibleQuizCount <
                    1} className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${theme.borderClass} ${theme.textSecondaryClass} ${theme.controlHoverClass} disabled:cursor-not-allowed disabled:opacity-40`}>
                Give it another spin 😉
              </button>)}
            {!inView &&
                (quizComplete ||
                    remainingQuizEntriesHidden) && (<>
                <button type="button" onClick={backToQuizSetup} className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${theme.borderClass} ${theme.textSecondaryClass} ${theme.controlHoverClass}`}>
                  Back to Setup
                </button>
                <button type="button" onClick={dismissQuizCard} className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${theme.borderClass} ${theme.textSecondaryClass} ${theme.controlHoverClass}`}>
                  Done
                </button>
              </>)}
          </div>
        </div>);
    }
    if (!storageLoaded) {
        return (<main key="loading-shell" className="shell-page min-h-screen" aria-busy="true">
        <header className="shell-header border-b">
          <div className="mx-auto h-[101px] max-w-7xl px-4 sm:px-6"/>
        </header>
        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <div className="shell-panel min-h-[560px] rounded-2xl border shadow-sm" role="status">
            <span className="sr-only">Loading saved wheels…</span>
          </div>
        </section>
      </main>);
    }
    return (<main className={`min-h-screen transition-colors ${theme.pageClass} ${theme.textPrimaryClass}`} style={{
            "--wheel-accent": theme.accentHex,
            "--wheel-accent-hover": theme.accentHoverHex,
        } as CSSProperties}>
      <header className={`border-b ${headerBorderClass} ${headerSurfaceClass}`}>
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between md:gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className={`truncate text-2xl font-extrabold tracking-tight ${headerTextClass}`} style={{ color: headerTextColor }}>
                {wheelTitle.trim() || DEFAULT_WHEEL_TITLE}
              </h1>
              <button type="button" onClick={editWheelTitle} disabled={spinning} aria-label="Edit wheel title" title="Edit title" className={`shrink-0 rounded-md p-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${headerHoverClass} disabled:cursor-not-allowed disabled:opacity-40`} style={{ color: headerMutedColor }}>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L8 18l-4 1 1-4Z"/>
                </svg>
              </button>
            </div>
            <div className="mt-1 flex items-center gap-1">
              <p className={`truncate text-sm font-medium ${headerMutedClass}`} style={{ color: headerMutedColor }}>
                {wheelDescription.trim() || DEFAULT_WHEEL_DESCRIPTION}
              </p>
              <button type="button" onClick={editWheelDescription} disabled={spinning} aria-label="Edit wheel description" title="Edit description" className={`shrink-0 rounded-md p-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${headerHoverClass} disabled:cursor-not-allowed disabled:opacity-40`} style={{ color: headerMutedColor }}>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L8 18l-4 1 1-4Z"/>
                </svg>
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:shrink-0 md:flex-nowrap">
            <select value={appData.activeWheelId} onChange={(event) => switchWheel(event.target.value)} disabled={spinning} aria-label="Select wheel" style={{ "--tw-ring-color": headerTextColor } as CSSProperties} className={`max-w-[9rem] max-[348px]:max-w-[6.5rem] rounded-lg border px-3 py-2 text-sm font-medium outline-none transition md:max-w-none ${theme.controlClass} ${spinning ? "" : theme.controlHoverClass} focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50`}>
              {appData.wheels.map((wheel) => (<option key={wheel.id} value={wheel.id}>
                    {wheel.name}
                  </option>))}
            </select>
            <button type="button" onClick={addWheel} disabled={spinning} className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${headerSurfaceClass} ${headerBorderClass} ${headerHoverClass} disabled:cursor-not-allowed disabled:opacity-50`} style={{ color: headerTextColor }}>
              + Wheel
            </button>
            {appData.wheels.length >
            1 && (<button type="button" onClick={deleteActiveWheel} disabled={spinning} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition not-disabled:hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50">
                − Wheel
              </button>)}
            <button type="button" onClick={renameActiveWheel} disabled={spinning} className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${headerSurfaceClass} ${headerBorderClass} ${headerHoverClass} disabled:cursor-not-allowed disabled:opacity-50`} style={{ color: headerTextColor }}>
              Rename
            </button>
            <button ref={settingsButtonRef} type="button" onClick={() => setSettingsOpen(true)} disabled={spinning} className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${headerSurfaceClass} ${headerBorderClass} ${headerHoverClass} disabled:cursor-not-allowed disabled:opacity-50`} style={{ color: headerTextColor }}>
              Settings
            </button>
            <button type="button" onClick={handleShare} aria-label="Share Spin the Wheel" title="Share" className={`relative flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg border transition before:absolute before:-inset-1 before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${headerSurfaceClass} ${headerBorderClass} ${headerHoverClass}`} style={{ color: headerTextColor }}>
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="18" cy="5" r="3"/>
                <circle cx="6" cy="12" r="3"/>
                <circle cx="18" cy="19" r="3"/>
                <path d="M8.6 13.5l6.8 4"/>
                <path d="M15.4 6.5l-6.8 4"/>
              </svg>
            </button>
          </div>
        </div>
      </header>
      <div role="status" className="pointer-events-none fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex justify-center px-[max(1rem,env(safe-area-inset-left))]">
        {shareMessage && (<span className={`rounded-lg border px-4 py-2 text-sm font-semibold shadow-lg ${headerSurfaceClass} ${headerBorderClass} ${headerTextClass}`}>
            {shareMessage}
          </span>)}
      </div>
      <div className="mx-auto max-w-7xl space-y-3 px-4 empty:hidden pt-4 sm:px-6">
        {storageStale && (<div role="alert" className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:flex-row sm:items-start sm:justify-between">
            <p className="min-w-0 break-words">Your wheels were changed in another tab. Reload to load the latest version. Changes made in this tab are not saved until you reload.</p>
            <div className="flex flex-wrap gap-3 sm:shrink-0 sm:justify-end">
              <button type="button" onClick={() => window.location.reload()} className="rounded font-semibold text-red-800 underline transition hover:text-red-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800">
                Reload
              </button>
              <button type="button" onClick={exportData} className="rounded font-semibold text-red-800 underline transition hover:text-red-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800">
                Export this tab&apos;s data
              </button>
            </div>
          </div>)}
        {storedDataNotice && (<div role="alert" className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:flex-row sm:items-start sm:justify-between">
            <p className="min-w-0 break-words">
              {storedDataNotice.kind === "defaults"
                ? "Your saved data could not be read, so the app started with defaults. A copy was kept."
                : storedDataNotice.kind === "repaired"
                    ? "Some of your saved data was repaired when it loaded. A copy of the original was kept."
                    : storedDataNotice.kind === "legacy"
                        ? "Your saved data could not be read, so the app loaded an older saved copy instead. A copy was kept."
                        : "A copy of saved data that could not be read earlier is still kept."}
              {storedDataNotice.memoryOnly
                ? " The copy lasts only until the page is closed."
                : ""}
              {deleteCopyFailed
                ? " The copy could not be deleted. Export it first if you need it, then try again."
                : ""}
            </p>
            <div className="flex flex-wrap gap-3 sm:shrink-0 sm:justify-end">
              <button type="button" onClick={exportRawData} className="rounded font-semibold text-red-800 underline transition hover:text-red-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800">
                Export raw data
              </button>
              <button ref={deleteCopyButtonRef} type="button" onClick={() => setDeleteCopyOpen(true)} className="rounded font-semibold text-red-800 underline transition hover:text-red-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800">
                Delete copy
              </button>
            </div>
          </div>)}
        {!storedDataNotice && v2StillUnreadable && (<div role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="min-w-0 break-words">The saved data is still unreadable. It will be replaced when you make a change or import a file.</p>
          </div>)}
        {saveFailed && (<div ref={saveAlertRef} role="alert" className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <p className="min-w-0 break-words">Your changes could not be saved because browser storage is full. Export your data to keep a copy.</p>
            <button type="button" onClick={exportData} className="shrink-0 rounded font-semibold text-red-800 underline transition hover:text-red-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800">
              Export
            </button>
          </div>)}
        {importError && (<div ref={importAlertRef} role="alert" className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <p className="min-w-0 break-words">{importError}</p>
            <button type="button" onClick={() => setImportError("")} aria-label="Dismiss import error" className="shrink-0 rounded font-semibold text-red-800 transition hover:text-red-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800">
              Dismiss
            </button>
          </div>)}
      </div>
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
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
      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className={`min-w-0 rounded-2xl border p-4 shadow-sm transition-colors sm:p-8 ${theme.borderClass} ${theme.surfaceClass}`}>
          <div className={mode === "quiz"
            ? "flex min-h-0 items-center justify-center sm:min-h-[560px]"
            : "flex min-h-0 items-center justify-center sm:min-h-[620px]"}>
            <WheelComponent entries={wheelEntries} spinning={spinning} rotation={rotation} onSpin={spinWheel} spinSound={activeWheel.settings.spinSound} soundActive={soundEnabled && soundVolume > 0} confettiStyle={(activeWheel.settings.confettiEnabled ?? DEFAULT_CONFETTI_ENABLED) ? (activeWheel.settings.confettiEffect ?? DEFAULT_CONFETTI_EFFECT) : "none"} confettiRun={confettiRun} confettiStop={confettiStop} soundEnabled={soundEnabled} onSoundToggle={toggleSound} canSpin={spinAllowed} minSpinEntries={minSpinEntries} emptyTitle={wheelEmptyTitle} emptyMessage={wheelEmptyMessage} spinDuration={activeWheel
            .settings
            .spinDuration} pointerMatchSliceColor={activeWheel
            .settings
            .pointerMatchSliceColor} wheelSize={activeWheel.settings.wheelSize} onWheelSizeChange={(size) => setAppData((current) => updateActiveWheelOf(current, (wheel) => ({
                settings: {
                    ...wheel.settings,
                    wheelSize: size,
                },
            })))} accentClass={actionAccentClass} accentHoverClass={actionHoverClass} theme={theme} onExpandedChange={setWheelExpanded} result={winnerEntryExists && selectedEntry
                ? { label: selectedEntry.label, emoji: selectedEntry.emoji, image: selectedEntry.image }
                : null} onContinue={closeWinnerBox} onRemove={removeWinner} removeDisabled={winnerRemoveDisabled} reason="Keep at least 2 entries visible." onBoxFitChange={setWinnerBoxFits} focusSpinRequest={spinFocusRequest} quiz={mode === "quiz" && quizStarted && displayedQuizEntry && showAnswer
                ? {
                    label: displayedQuizEntry.label,
                    emoji: displayedQuizEntry.emoji,
                    image: displayedQuizEntry.image,
                    question: displayedQuizEntry.question ?? "",
                    answer: displayedQuizEntry.answer ?? "",
                    canSpinAgain: !quizComplete && !remainingQuizEntriesHidden,
                }
                : null} onHideAnswer={hideQuizAnswer} onAnotherSpin={nextSpin} anotherSpinDisabled={spinning || remainingVisibleQuizCount < 1} expandedResult={mode === "standard"
                ? (winnerBoxShown
                    ? undefined
                    : (<div role="status" className="min-h-14">
                  {renderStandardResult(true)}
                </div>))
                : (<div role="status">
                  {quizStarted && displayedQuizEntry
                    ? renderQuizCard(true)
                    : null}
                </div>)}/>
          </div>
          {mode === "standard" &&
            !hasSpun && (<div inert={wheelExpanded} aria-hidden={wheelExpanded || undefined} className={`mx-auto mt-6 max-w-2xl rounded-2xl border p-6 shadow-sm ${theme.borderClass} ${theme.surfaceClass}`}>
              <h2 className={`text-lg font-semibold ${theme.textPrimaryClass}`}>
                Standard Mode
              </h2>
              <p className={`mt-1 text-sm leading-6 ${theme.textSecondaryClass}`}>
                Add your options in the list, then press Spin. Change a name, colour or weight with the entry&apos;s ... menu, and hide an option with its eye icon. When a winner comes up, choose Continue to keep every option, or Remove to hide the winner. At least 2 options must stay visible.
              </p>
            </div>)}
          {mode === "quiz" &&
            !quizStarted && (<div className={`mx-auto mt-6 max-w-2xl rounded-2xl border p-6 shadow-sm ${theme.borderClass} ${theme.surfaceClass}`}>
              <h2 className={`text-lg font-semibold ${theme.textPrimaryClass}`}>
                Quiz Mode
              </h2>
              <p className={`mt-1 text-sm leading-6 ${theme.textSecondaryClass}`}>
                Configure your questions and answers, then start the quiz before handing the wheel to the contestant.
              </p>
              {!quizEntriesComplete && (<div className={`mt-4 rounded-xl p-4 text-sm ${theme.subtleSurfaceClass} ${theme.textSecondaryClass}`}>
                  Every question needs both a question and an answer before the quiz can start.
                </div>)}
              {!enoughVisibleQuizEntries && (<div className={`mt-4 rounded-xl p-4 text-sm ${theme.subtleSurfaceClass} ${theme.textSecondaryClass}`}>
                  Show at least 2 questions to start the quiz.
                </div>)}
            </div>)}
          {mode === "quiz" &&
            quizStarted &&
            displayedQuizEntry && renderQuizCard(false)}
          {mode === "quiz" &&
            quizStarted &&
            !displayedQuizEntry &&
            !quizComplete && (<div className={`mx-auto mt-6 max-w-2xl rounded-2xl border p-5 text-center ${theme.borderClass} ${theme.subtleSurfaceClass}`}>
              <p className={`text-sm font-semibold ${theme.textPrimaryClass}`}>
                {spinning
                ? "Spinning... 🎡"
                : remainingQuizEntriesHidden
                    ? "All remaining questions are hidden."
                    : "Alright... give it a spin 😉"}
              </p>
              <p className={`mt-1 text-sm leading-6 ${theme.textSecondaryClass}`}>
                {spinning
                ? "The question will appear when the wheel stops."
                : remainingQuizEntriesHidden
                    ? "Show one or go back to setup."
                    : "The question is waiting."}
              </p>
            </div>)}
          {mode === "standard" &&
            selectedEntry && !winnerBoxShown && renderStandardResult(false)}
        </div>
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-2">
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
            currentSetupEntries.length === 0} className={`shrink-0 rounded-lg border p-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${theme.borderClass} ${theme.surfaceClass} ${theme.textSecondaryClass} ${theme.controlHoverClass} disabled:cursor-not-allowed disabled:opacity-40`} aria-label={allEntriesHidden
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
            <button type="button" onClick={exportData} disabled={spinning} className={`shrink-0 rounded-lg border p-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${theme.borderClass} ${theme.surfaceClass} ${theme.textSecondaryClass} ${theme.controlHoverClass} disabled:cursor-not-allowed disabled:opacity-40`} aria-label="Export data" title="Export data">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3v12"/>
                <path d="m7 10 5 5 5-5"/>
                <path d="M5 21h14"/>
              </svg>
            </button>
            <button type="button" onClick={() => {
                setImportError("");
                importInputRef.current?.click();
            }} disabled={spinning || storageStale} className={`shrink-0 rounded-lg border p-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${theme.borderClass} ${theme.surfaceClass} ${theme.textSecondaryClass} ${theme.controlHoverClass} disabled:cursor-not-allowed disabled:opacity-40`} aria-label="Import data" title={storageStale ? "Reload first: this tab is out of date and its changes are not saved" : "Import data"}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 21V9"/>
                <path d="m7 14 5-5 5 5"/>
                <path d="M5 3h14"/>
              </svg>
            </button>
            <input ref={importInputRef} type="file" accept=".json,application/json" onChange={handleImportFile} className="hidden"/>
          </div>
          {quizTextLocked && (<p className={`-mt-2 mb-4 text-xs leading-5 ${theme.textMutedClass}`}>
              Exports include all questions and answers.
            </p>)}
          {!historyOpen && (<>
              <EntryList entries={currentSetupEntries} mode={mode} onAdd={addEntry} onUpdate={updateEntry} onDelete={deleteEntry} onDuplicate={duplicateEntry} additionsDisabled={mode === "quiz" &&
                quizStarted} deletionsDisabled={mode === "quiz" &&
                quizStarted} textLocked={quizTextLocked} disabled={spinning} lockedId={lockedEntryId} maxEntries={activeWheel.settings.maxEntries} accentClass={actionAccentClass} accentHoverClass={actionHoverClass} theme={theme}/>
              <div className="mt-4">
                <button ref={entriesResetButtonRef} type="button" onClick={openResetEntries} disabled={spinning} className={`w-full rounded-lg border px-3 py-2 text-xs font-semibold transition ${theme.borderClass} ${theme.surfaceClass} ${theme.textSecondaryClass} ${theme.controlHoverClass} disabled:cursor-not-allowed disabled:opacity-40`}>
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
                              {item.emoji && (<span aria-hidden="true">{item.emoji}{" "}</span>)}
                              {item.label}
                            </span>
                            <span className={`shrink-0 text-xs ${theme.textMutedClass}`}>
                              {formatHistoryTime(item.timestamp)}
                            </span>
                          </div>
                          {item.question &&
                !quizTextLocked && (<p className={`mt-1 truncate pl-10 text-xs ${theme.textMutedClass}`}>
                              {item.question}
                            </p>)}
                        </div>))}
                  </div>)}
              </div>
              <button type="button" onClick={() => clearHistory(mode)} disabled={spinning ||
                (mode ===
                    "standard"
                    ? standardHistory
                    : quizHistory).length === 0} className="mt-4 w-full rounded-lg border border-red-400 px-4 py-2.5 text-sm font-semibold text-red-300 transition not-disabled:hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-40">
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
              {!quizEntriesComplete && (<p className={`mt-2 text-center text-xs ${theme.textMutedClass}`}>
                  Every question needs both a question and an answer.
                </p>)}
              {!enoughVisibleQuizEntries && (<p className={`mt-2 text-center text-xs ${theme.textMutedClass}`}>
                  Show at least 2 questions to start the quiz.
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
                : remainingQuizEntriesHidden
                    ? "All remaining questions are hidden. Show one or go back to setup."
                    : "The contestant can now spin the wheel."}
              </p>
              {!quizComplete && (<div className={`mt-5 rounded-xl p-4 ${theme.subtleSurfaceClass}`}>
                  <p className={`text-xs font-semibold uppercase tracking-widest ${theme.textMutedClass}`}>
                    Questions Remaining
                  </p>
                  <p className={`mt-1 text-2xl font-bold ${theme.textPrimaryClass}`}>
                    {remainingVisibleQuizCount}
                  </p>
                </div>)}
              <button type="button" onClick={backToQuizSetup} disabled={spinning} className={`mt-6 w-full rounded-lg border px-4 py-3 text-sm font-medium transition ${theme.borderClass} ${theme.textSecondaryClass} ${theme.controlHoverClass} disabled:cursor-not-allowed disabled:opacity-50`}>
                Back to Setup
              </button>
            </div>)}
        </div>
      </section>
      <footer className={`mx-auto flex max-w-7xl flex-col gap-2 border-t px-4 py-4 text-xs sm:px-6 ${theme.borderClass} ${theme.textMutedClass} sm:flex-row sm:items-center sm:justify-between`}>
        <span className="min-w-0 break-words">
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
      {settingsOpen && (<div ref={settingsDialogRef} tabIndex={-1} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 outline-none" role="dialog" aria-modal="true" aria-label="Settings" onMouseDown={(event) => {
                if (event.target ===
                    event.currentTarget) {
                    event.preventDefault();
                    closeSettings();
                }
            }}>
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-slate-50 shadow-2xl">
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <SettingsPanel settings={panelSettings} onSettingsChange={handleSettingsChange} onRestoreDefaults={openRestoreDefaults} onOpenFeedback={openFeedback} feedbackButtonRef={feedbackRowRef} activeTab={settingsTab} onActiveTabChange={setSettingsTab} accentClass={actionAccentClass} accentHex={theme.accentHex}/>
            </div>
            <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
              <button type="button" onClick={closeSettings} className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition ${actionAccentClass} ${actionHoverClass}`}>
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
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={applyImportedData} disabled={spinning || storageStale} className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${actionAccentClass} ${actionHoverClass} disabled:cursor-not-allowed disabled:opacity-40`}>
                Import
              </button>
              <button type="button" onClick={() => setPendingImport(null)} className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${theme.borderClass} ${theme.textSecondaryClass} ${theme.controlHoverClass}`}>
                Cancel
              </button>
            </div>
          </div>
        </div>)}
      {resetConfirmOpen && (<div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4">
          <div ref={resetDialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Restore defaults" className={`w-full max-w-md rounded-2xl p-6 shadow-2xl outline-none ${theme.surfaceClass}`}>
            <h2 className={`text-lg font-semibold ${theme.textPrimaryClass}`}>
              Restore defaults?
            </h2>
            <p className={`mt-2 text-sm leading-6 ${theme.textSecondaryClass}`}>
              This will restore the default entries, quiz questions, settings, title, description, and history. Your wheel name and other wheels are kept.
            </p>
            <p className={`mt-2 text-sm leading-6 ${theme.textSecondaryClass}`}>
              Export your data first if you want to keep a copy.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" onClick={exportData} className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${theme.borderClass} ${theme.textSecondaryClass} ${theme.controlHoverClass}`}>
                Export all wheels
              </button>
              <button type="button" onClick={resetWheelToDefaults} disabled={spinning} className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${actionAccentClass} ${actionHoverClass} disabled:cursor-not-allowed disabled:opacity-40`}>
                Restore
              </button>
              <button type="button" onClick={cancelRestoreDefaults} className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${theme.borderClass} ${theme.textSecondaryClass} ${theme.controlHoverClass}`}>
                Cancel
              </button>
            </div>
          </div>
        </div>)}
      {feedbackOpen && (<FeedbackDialog theme={theme} accentClass={actionAccentClass} accentHoverClass={actionHoverClass} draft={feedbackDraftRef.current} onDraftChange={(draft) => {
                feedbackDraftRef.current = draft;
            }} onClose={closeFeedback} getReturnFocus={() => feedbackRowRef.current}/>)}
      {entriesResetOpen && (<div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4">
          <div ref={entriesResetDialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Reset entries" className={`w-full max-w-md rounded-2xl p-6 shadow-2xl outline-none ${theme.surfaceClass}`}>
            <h2 className={`text-lg font-semibold ${theme.textPrimaryClass}`}>
              Reset entries?
            </h2>
            <p className={`mt-2 text-sm leading-6 ${theme.textSecondaryClass}`}>
              Reset the {mode === "quiz" ? "quiz questions" : "entries"} to the defaults?
            </p>
            {mode === "quiz" && quizStarted && (<p className={`mt-2 text-sm leading-6 ${theme.textSecondaryClass}`}>
                This also ends the quiz and returns to setup.
              </p>)}
            <p className={`mt-2 text-sm leading-6 ${theme.textSecondaryClass}`}>
              Export your data first if you want to keep a copy.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" onClick={exportData} className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${theme.borderClass} ${theme.textSecondaryClass} ${theme.controlHoverClass}`}>
                Export all wheels
              </button>
              <button type="button" onClick={resetCurrentEntries} disabled={spinning} className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${actionAccentClass} ${actionHoverClass} disabled:cursor-not-allowed disabled:opacity-40`}>
                Reset
              </button>
              <button type="button" onClick={() => setEntriesResetOpen(false)} className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${theme.borderClass} ${theme.textSecondaryClass} ${theme.controlHoverClass}`}>
                Cancel
              </button>
            </div>
          </div>
        </div>)}
      {deleteCopyOpen && storedDataNotice && (<div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4">
          <div ref={deleteCopyDialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Delete the kept copy" className={`w-full max-w-md rounded-2xl p-6 shadow-2xl outline-none ${theme.surfaceClass}`}>
            <h2 className={`text-lg font-semibold ${theme.textPrimaryClass}`}>
              Delete the kept copy?
            </h2>
            <p className={`mt-2 text-sm leading-6 ${theme.textSecondaryClass}`}>
              {storedDataNotice.memoryOnly
                ? "This copy exists only until the page is closed. Deleting it now loses it immediately."
                : "This permanently deletes the copy of your unreadable saved data kept in this browser. It cannot be recovered afterwards."}
            </p>
            <p className={`mt-2 text-sm leading-6 ${theme.textSecondaryClass}`}>
              Export raw data first if you want to keep it.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" onClick={exportRawData} className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${theme.borderClass} ${theme.textSecondaryClass} ${theme.controlHoverClass}`}>
                Export raw data
              </button>
              <button type="button" onClick={deleteUnreadableCopy} className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${actionAccentClass} ${actionHoverClass}`}>
                Delete copy
              </button>
              <button type="button" onClick={() => setDeleteCopyOpen(false)} className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${theme.borderClass} ${theme.textSecondaryClass} ${theme.controlHoverClass}`}>
                Cancel
              </button>
            </div>
          </div>
        </div>)}
    </main>);
}