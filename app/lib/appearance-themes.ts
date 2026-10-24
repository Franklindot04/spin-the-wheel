import type {
  AppearanceTheme,
  AppearanceThemeConfig,
} from "./wheel-types";

/*
 * Holds only the active wheel's theme name. It is
 * written by the app and read only by the script in
 * the page head, so the loading screen can use the
 * saved theme before the saved wheels are read.
 */
export const THEME_STORAGE_KEY =
  "spin-the-wheel:theme";

export const APPEARANCE_THEMES: Record<
  AppearanceTheme,
  AppearanceThemeConfig
> = {
  classic: {
    labelKey: "theme.classic.label",
    descriptionKey: "theme.classic.description",

    pageClass: "bg-slate-950",

    /*
     * The loading shell in globals.css (.shell-header, one rule per
     * theme) repeats the header surface and border colours of every
     * theme below. Change them there together with these.
     */
    header: {
      surfaceClass: "bg-slate-100",
      borderClass: "border-slate-300",
      hoverClass: "not-disabled:hover:bg-slate-200",
      titleHex: "#0f172a",
      mutedHex: "#334155",
      toastTextClass: "text-slate-900",
    },

    accentClass: "bg-slate-900",
    accentHoverClass: "not-disabled:hover:bg-slate-800",
    accentHex: "#0f172a",
    accentHoverHex: "#1e293b",
    pointerFallbackHex: "#f8fafc",

    surfaceClass: "bg-slate-900",
    subtleSurfaceClass: "bg-slate-800",

    textPrimaryClass: "text-slate-50",
    textSecondaryClass: "text-slate-300",
    textMutedClass: "text-slate-400",

    borderClass: "border-slate-700",
    controlClass: "bg-slate-900 border-slate-700 text-slate-200",
    controlHoverClass: "not-disabled:hover:bg-slate-800",
    inputClass:
      "bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-300",
  },

  ocean: {
    labelKey: "theme.ocean.label",
    descriptionKey: "theme.ocean.description",

    pageClass: "bg-cyan-950",

    header: {
      surfaceClass: "bg-cyan-100",
      borderClass: "border-cyan-300",
      hoverClass: "not-disabled:hover:bg-cyan-200",
      titleHex: "#164e63",
      mutedHex: "#155e75",
      toastTextClass: "text-cyan-950",
    },

    accentClass: "bg-cyan-700",
    accentHoverClass: "not-disabled:hover:bg-cyan-800",
    accentHex: "#0e7490",
    accentHoverHex: "#155e75",
    pointerFallbackHex: "#ecfeff",

    surfaceClass: "bg-cyan-900",
    subtleSurfaceClass: "bg-cyan-800",

    textPrimaryClass: "text-cyan-50",
    textSecondaryClass: "text-cyan-100",
    textMutedClass: "text-cyan-300",

    borderClass: "border-cyan-700",
    controlClass: "bg-cyan-900 border-cyan-700 text-cyan-100",
    controlHoverClass: "not-disabled:hover:bg-cyan-800",
    inputClass:
      "bg-cyan-800 border-cyan-700 text-cyan-50 placeholder:text-cyan-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-300",
  },

  forest: {
    labelKey: "theme.forest.label",
    descriptionKey: "theme.forest.description",

    pageClass: "bg-emerald-950",

    header: {
      surfaceClass: "bg-emerald-100",
      borderClass: "border-emerald-300",
      hoverClass: "not-disabled:hover:bg-emerald-200",
      titleHex: "#064e3b",
      mutedHex: "#065f46",
      toastTextClass: "text-emerald-950",
    },

    accentClass: "bg-emerald-700",
    accentHoverClass: "not-disabled:hover:bg-emerald-800",
    accentHex: "#047857",
    accentHoverHex: "#065f46",
    pointerFallbackHex: "#ecfdf5",

    surfaceClass: "bg-emerald-900",
    subtleSurfaceClass: "bg-emerald-800",

    textPrimaryClass: "text-emerald-50",
    textSecondaryClass: "text-emerald-100",
    textMutedClass: "text-emerald-300",

    borderClass: "border-emerald-700",
    controlClass: "bg-emerald-900 border-emerald-700 text-emerald-100",
    controlHoverClass: "not-disabled:hover:bg-emerald-800",
    inputClass:
      "bg-emerald-800 border-emerald-700 text-emerald-50 placeholder:text-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-300",
  },

  sunset: {
    labelKey: "theme.sunset.label",
    descriptionKey: "theme.sunset.description",

    pageClass: "bg-orange-950",

    header: {
      surfaceClass: "bg-orange-100",
      borderClass: "border-orange-300",
      hoverClass: "not-disabled:hover:bg-orange-200",
      titleHex: "#7c2d12",
      mutedHex: "#9a3412",
      toastTextClass: "text-orange-950",
    },

    accentClass: "bg-orange-700",
    accentHoverClass: "not-disabled:hover:bg-orange-800",
    accentHex: "#c2410c",
    accentHoverHex: "#9a3412",
    pointerFallbackHex: "#fff7ed",

    surfaceClass: "bg-orange-900",
    subtleSurfaceClass: "bg-orange-800",

    textPrimaryClass: "text-orange-50",
    textSecondaryClass: "text-orange-100",
    textMutedClass: "text-orange-300",

    borderClass: "border-orange-700",
    controlClass: "bg-orange-900 border-orange-700 text-orange-100",
    controlHoverClass: "not-disabled:hover:bg-orange-800",
    inputClass:
      "bg-orange-800 border-orange-700 text-orange-50 placeholder:text-orange-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-300",
  },

  violet: {
    labelKey: "theme.violet.label",
    descriptionKey: "theme.violet.description",

    pageClass: "bg-violet-950",

    header: {
      surfaceClass: "bg-violet-100",
      borderClass: "border-violet-300",
      hoverClass: "not-disabled:hover:bg-violet-200",
      titleHex: "#4c1d95",
      mutedHex: "#5b21b6",
      toastTextClass: "text-violet-950",
    },

    accentClass: "bg-violet-700",
    accentHoverClass: "not-disabled:hover:bg-violet-800",
    accentHex: "#6d28d9",
    accentHoverHex: "#5b21b6",
    pointerFallbackHex: "#f5f3ff",

    surfaceClass: "bg-violet-900",
    subtleSurfaceClass: "bg-violet-800",

    textPrimaryClass: "text-violet-50",
    textSecondaryClass: "text-violet-100",
    textMutedClass: "text-violet-300",

    borderClass: "border-violet-700",
    controlClass: "bg-violet-900 border-violet-700 text-violet-100",
    controlHoverClass: "not-disabled:hover:bg-violet-800",
    inputClass:
      "bg-violet-800 border-violet-700 text-violet-50 placeholder:text-violet-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-300",
  },
};