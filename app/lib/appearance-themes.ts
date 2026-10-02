import type {
  AppearanceTheme,
  AppearanceThemeConfig,
} from "./wheel-types";

export const APPEARANCE_THEMES: Record<
  AppearanceTheme,
  AppearanceThemeConfig
> = {
  classic: {
    label: "Classic",
    description: "Clean and neutral.",
    swatchClass: "bg-slate-100",

    pageClass: "bg-slate-950",

    headerClass: "bg-slate-50",
    headerBorderClass: "border-slate-200",

    accentClass: "bg-slate-900",
    accentHoverClass: "hover:bg-slate-800",
    accentHex: "#0f172a",
    accentHoverHex: "#1e293b",

    surfaceClass: "bg-slate-900",
    subtleSurfaceClass: "bg-slate-800",

    textPrimaryClass: "text-slate-50",
    textSecondaryClass: "text-slate-300",
    textMutedClass: "text-slate-400",

    borderClass: "border-slate-700",
    controlClass: "bg-slate-900 border-slate-700 text-slate-200",
    controlHoverClass: "hover:bg-slate-800",
    inputClass:
      "bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-400 focus:border-slate-500 focus:ring-slate-700",
  },

  ocean: {
    label: "Ocean",
    description: "Cool blue tones.",
    swatchClass: "bg-cyan-100",

    pageClass: "bg-cyan-950",

    headerClass: "bg-cyan-50",
    headerBorderClass: "border-cyan-200",

    accentClass: "bg-cyan-700",
    accentHoverClass: "hover:bg-cyan-800",
    accentHex: "#0e7490",
    accentHoverHex: "#155e75",

    surfaceClass: "bg-cyan-900",
    subtleSurfaceClass: "bg-cyan-800",

    textPrimaryClass: "text-cyan-50",
    textSecondaryClass: "text-cyan-100",
    textMutedClass: "text-cyan-300",

    borderClass: "border-cyan-700",
    controlClass: "bg-cyan-900 border-cyan-700 text-cyan-100",
    controlHoverClass: "hover:bg-cyan-800",
    inputClass:
      "bg-cyan-800 border-cyan-700 text-cyan-50 placeholder:text-cyan-300 focus:border-cyan-500 focus:ring-cyan-700",
  },

  forest: {
    label: "Forest",
    description: "Natural green tones.",
    swatchClass: "bg-emerald-100",

    pageClass: "bg-emerald-950",

    headerClass: "bg-emerald-50",
    headerBorderClass: "border-emerald-200",

    accentClass: "bg-emerald-700",
    accentHoverClass: "hover:bg-emerald-800",
    accentHex: "#047857",
    accentHoverHex: "#065f46",

    surfaceClass: "bg-emerald-900",
    subtleSurfaceClass: "bg-emerald-800",

    textPrimaryClass: "text-emerald-50",
    textSecondaryClass: "text-emerald-100",
    textMutedClass: "text-emerald-300",

    borderClass: "border-emerald-700",
    controlClass: "bg-emerald-900 border-emerald-700 text-emerald-100",
    controlHoverClass: "hover:bg-emerald-800",
    inputClass:
      "bg-emerald-800 border-emerald-700 text-emerald-50 placeholder:text-emerald-300 focus:border-emerald-500 focus:ring-emerald-700",
  },

  sunset: {
    label: "Sunset",
    description: "Warm orange tones.",
    swatchClass: "bg-orange-100",

    pageClass: "bg-orange-950",

    headerClass: "bg-orange-50",
    headerBorderClass: "border-orange-200",

    accentClass: "bg-orange-600",
    accentHoverClass: "hover:bg-orange-700",
    accentHex: "#ea580c",
    accentHoverHex: "#c2410c",

    surfaceClass: "bg-orange-900",
    subtleSurfaceClass: "bg-orange-800",

    textPrimaryClass: "text-orange-50",
    textSecondaryClass: "text-orange-100",
    textMutedClass: "text-orange-300",

    borderClass: "border-orange-700",
    controlClass: "bg-orange-900 border-orange-700 text-orange-100",
    controlHoverClass: "hover:bg-orange-800",
    inputClass:
      "bg-orange-800 border-orange-700 text-orange-50 placeholder:text-orange-300 focus:border-orange-500 focus:ring-orange-700",
  },

  violet: {
    label: "Violet",
    description: "Soft purple tones.",
    swatchClass: "bg-violet-100",

    pageClass: "bg-violet-950",

    headerClass: "bg-violet-50",
    headerBorderClass: "border-violet-200",

    accentClass: "bg-violet-700",
    accentHoverClass: "hover:bg-violet-800",
    accentHex: "#6d28d9",
    accentHoverHex: "#5b21b6",

    surfaceClass: "bg-violet-900",
    subtleSurfaceClass: "bg-violet-800",

    textPrimaryClass: "text-violet-50",
    textSecondaryClass: "text-violet-100",
    textMutedClass: "text-violet-300",

    borderClass: "border-violet-700",
    controlClass: "bg-violet-900 border-violet-700 text-violet-100",
    controlHoverClass: "hover:bg-violet-800",
    inputClass:
      "bg-violet-800 border-violet-700 text-violet-50 placeholder:text-violet-300 focus:border-violet-500 focus:ring-violet-700",
  },
};