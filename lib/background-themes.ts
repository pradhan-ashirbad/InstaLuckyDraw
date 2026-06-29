export interface BackgroundTheme {
  id: string
  name: string
  swatch: string
  baseBg: string
  gradientFrom: string
  gradientVia: string
  gradientTo: string
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
  },
  {
    id: "navy",
    name: "Midnight Navy",
    swatch: "bg-gradient-to-br from-[#16275c] via-[#0a1228] to-black",
    baseBg: "bg-[#05070f]",
    gradientFrom: "from-[#0a1228]",
    gradientVia: "via-[#070c1a]",
    gradientTo: "to-black",
  },
  {
    id: "emerald",
    name: "Emerald Jewel",
    swatch: "bg-gradient-to-br from-[#114a30] via-[#0a2417] to-black",
    baseBg: "bg-[#04100a]",
    gradientFrom: "from-[#0a2417]",
    gradientVia: "via-[#06160e]",
    gradientTo: "to-black",
  },
  {
    id: "burgundy",
    name: "Burgundy Velvet",
    swatch: "bg-gradient-to-br from-[#5c1420] via-[#2b0a10] to-black",
    baseBg: "bg-[#1a0408]",
    gradientFrom: "from-[#2b0a10]",
    gradientVia: "via-[#170509]",
    gradientTo: "to-black",
  },
  {
    id: "charcoal",
    name: "Charcoal Noir",
    swatch: "bg-gradient-to-br from-[#2a2a32] via-[#15151a] to-black",
    baseBg: "bg-[#0a0a0c]",
    gradientFrom: "from-[#15151a]",
    gradientVia: "via-[#0d0d10]",
    gradientTo: "to-black",
  },
]

export const defaultBackgroundThemeId = "amber"

export const THEME_STORAGE_KEY = "instaLuckyDraw.backgroundTheme"
