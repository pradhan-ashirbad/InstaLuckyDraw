export interface BackgroundTheme {
  id: string
  name: string
  swatch: string
  baseBg: string
  gradientFrom: string
  gradientVia: string
  gradientTo: string
  /** Hex accent color used to tint the center draw stage's glow/border. */
  accent: string
}

export const backgroundThemes: BackgroundTheme[] = [
  {
    id: "amber",
    name: "Amber Gala",
    swatch: "bg-gradient-to-br from-[#3a2308] via-[#160d05] to-black",
    baseBg: "bg-[#0b0705]",
    gradientFrom: "from-[#160d05]",
    gradientVia: "via-[#0c0704]",
    gradientTo: "to-black",
    accent: "#fbbf24",
  },
  {
    id: "navy",
    name: "Midnight Navy",
    swatch: "bg-gradient-to-br from-[#16275c] via-[#0a1228] to-black",
    baseBg: "bg-[#05070f]",
    gradientFrom: "from-[#0a1228]",
    gradientVia: "via-[#070c1a]",
    gradientTo: "to-black",
    accent: "#60a5fa",
  },
  {
    id: "emerald",
    name: "Emerald Jewel",
    swatch: "bg-gradient-to-br from-[#114a30] via-[#0a2417] to-black",
    baseBg: "bg-[#04100a]",
    gradientFrom: "from-[#0a2417]",
    gradientVia: "via-[#06160e]",
    gradientTo: "to-black",
    accent: "#34d399",
  },
  {
    id: "burgundy",
    name: "Burgundy Velvet",
    swatch: "bg-gradient-to-br from-[#5c1420] via-[#2b0a10] to-black",
    baseBg: "bg-[#1a0408]",
    gradientFrom: "from-[#2b0a10]",
    gradientVia: "via-[#170509]",
    gradientTo: "to-black",
    accent: "#fb7185",
  },
  {
    id: "charcoal",
    name: "Charcoal Noir",
    swatch: "bg-gradient-to-br from-[#2a2a32] via-[#15151a] to-black",
    baseBg: "bg-[#0a0a0c]",
    gradientFrom: "from-[#15151a]",
    gradientVia: "via-[#0d0d10]",
    gradientTo: "to-black",
    accent: "#cbd5e1",
  },
]

export const defaultBackgroundThemeId = "amber"

export const THEME_STORAGE_KEY = "instaLuckyDraw.backgroundTheme"

/** Sentinel theme id for the user-picked custom color option. */
export const CUSTOM_THEME_ID = "custom"

export const CUSTOM_COLOR_STORAGE_KEY = "instaLuckyDraw.customColor"

export const defaultCustomColor = "#fbbf24"

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "")
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean
  const num = Number.parseInt(full, 16) || 0
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
}

function darkenHex(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex)
  const d = (v: number) => Math.max(0, Math.round(v * (1 - amount)))
  return `#${[d(r), d(g), d(b)].map((v) => v.toString(16).padStart(2, "0")).join("")}`
}

export function hexToRgbString(hex: string) {
  const { r, g, b } = hexToRgb(hex)
  return `${r}, ${g}, ${b}`
}

export interface StageTheme {
  /** CSS gradient for the glass stage panel's own background. */
  background: string
  /** rgba() string for the expanding winner ring. */
  ringColor: string
  /** rgba() string for the stage's outer border. */
  borderColor: string
  /** rgba() string for the stage's drop shadow. */
  shadowColor: string
  /** Bare "r, g, b" triplet for ad-hoc rgba() composition. */
  glowRgb: string
}

/** Derives the center draw-stage's colors from a theme's accent hex. */
export function getStageTheme(accentHex: string): StageTheme {
  const glowRgb = hexToRgbString(accentHex)
  return {
    background: `linear-gradient(to bottom, ${darkenHex(accentHex, 0.86)}, ${darkenHex(accentHex, 0.93)}, #05050a)`,
    ringColor: `rgba(${glowRgb}, 0.7)`,
    borderColor: `rgba(${glowRgb}, 0.3)`,
    shadowColor: `rgba(${glowRgb}, 0.45)`,
    glowRgb,
  }
}

export interface OuterBackdropStyle {
  backgroundColor: string
  backgroundImage: string
  glowRgb: string
}

/** Derives the outer page backdrop's colors for the custom-color option. */
export function getOuterBackdropStyle(accentHex: string): OuterBackdropStyle {
  return {
    backgroundColor: darkenHex(accentHex, 0.95),
    backgroundImage: `linear-gradient(to bottom, ${darkenHex(accentHex, 0.88)}, ${darkenHex(accentHex, 0.94)}, #000000)`,
    glowRgb: hexToRgbString(accentHex),
  }
}
