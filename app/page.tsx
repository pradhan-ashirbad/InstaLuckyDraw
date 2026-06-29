"use client"

import type React from "react"
import { useState, useCallback, useMemo, useEffect } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Upload,
  Sparkles,
  Car,
  Tv,
  Smartphone,
  Wind,
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Trophy,
  Crown,
  Award,
  Bike,
  WashingMachine,
  Utensils,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import * as XLSX from "xlsx"

import { PrizeManagement } from "@/components/prize-management"
import { SequentialDrawInterface } from "@/components/sequential-draw-interface"
import { WinnersList } from "@/components/winners-list"
import { ExportResults } from "@/components/export-results"
import { backgroundThemes, defaultBackgroundThemeId, THEME_STORAGE_KEY } from "@/lib/background-themes"

interface DealerData {
  "Customer Id"?: string
  Name: string
  District?: string
  "Coupon Number": string
  "Count of Total Coupons"?: number
  "Row Number"?: number
  [key: string]: any
}

interface PrizeCategory {
  id: string
  name: string
  icon: React.ReactNode
  winnerCount: number
  color: string
  image: string
  description: string
  order: number
}

interface Winner {
  couponId: string
  dealerId?: string
  dealerName: string
  category: string
  timestamp: Date
  district?: string
}

/* -------------------- PRIZE DATA (draw order: Seventh → Mega) -------------------- */
const corporatePrizes: PrizeCategory[] = [
  {
    id: "bajaj-kitchen-combo",
    name: "BAJAJ KITCHEN COMBO",
    icon: <Utensils className="w-6 h-6" />,
    winnerCount: 20,
    color: "bg-gradient-to-r from-green-400 to-emerald-600",
    image: "https://images.philips.com/is/image/philipsconsumer/vrs_e676be6aea4e6bf97516b134bc61de6a80865e35?$pnglarge$&wid=1250",
    description: "Seventh Prize",
    order: 1,
  },
  {
    id: "samsung-a17",
    name: "SAMSUNG GALAXY A17",
    icon: <Smartphone className="w-6 h-6" />,
    winnerCount: 10,
    color: "bg-gradient-to-r from-purple-500 to-pink-500",
    image: "https://m.media-amazon.com/images/I/71QRVW0H+iL._AC_UY327_FMwebp_QL65_.jpg",
    description: "Sixth Prize",
    order: 2,
  },
  {
    id: "washing-machine",
    name: "FRONT LOAD WASHING MACHINE",
    icon: <WashingMachine className="w-6 h-6" />,
    winnerCount: 2,
    color: "bg-gradient-to-r from-teal-400 to-emerald-500",
    image: "/placeholder.svg",
    description: "Fifth Prize",
    order: 3,
  },
  {
    id: "split-ac-1-5",
    name: "SPLIT AC 1.5 TON",
    icon: <Wind className="w-6 h-6" />,
    winnerCount: 2,
    color: "bg-gradient-to-r from-cyan-400 to-blue-500",
    image:
      "https://static.wixstatic.com/media/4af009_50b99ed648a4405980138b37e56d3abb~mv2.jpg/v1/fill/w_980,h_569,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/4af009_50b99ed648a4405980138b37e56d3abb~mv2.jpg",
    description: "Fourth Prize",
    order: 4,
  },
  {
    id: "smart-tv-55",
    name: "55 INCH SMART TELEVISION",
    icon: <Tv className="w-6 h-6" />,
    winnerCount: 2,
    color: "bg-gradient-to-r from-indigo-500 to-purple-600",
    image: "https://www.intex.in/cdn/shop/products/1_9b8014ad-124e-4742-a628-9a4c4affe617.jpg?v=1750330801",
    description: "Third Prize",
    order: 5,
  },
  {
    id: "honda-dio",
    name: "HONDA DIO",
    icon: <Bike className="w-6 h-6" />,
    winnerCount: 1,
    color: "bg-gradient-to-r from-blue-500 to-indigo-600",
    image:
      "https://www.honda2wheelersindia.com/_next/image?url=https%3A%2F%2Fedge.sitecorecloud.io%2Fhondamotorc388f-hmsi8ece-prodb777-e813%2Fmedia%2FProject%2FHONDA2WI%2Fhonda2wheelersindia%2Fscooter%2Fdio-110%2Fdio110-accessories.png%3Fh%3D810%26iar%3D0%26w%3D1920&w=1920&q=75&dpl=dpl_7QAtHS8A71WM9kk3t5UaGA2pRwqm",
    description: "Second Prize",
    order: 6,
  },
  {
    id: "honda-shine",
    name: "HONDA SHINE SP",
    icon: <Bike className="w-6 h-6" />,
    winnerCount: 1,
    color: "bg-gradient-to-r from-red-500 to-rose-700",
    image:
      "https://www.honda2wheelersindia.com/_next/image?url=https%3A%2F%2Fedge.sitecorecloud.io%2Fhondamotorc388f-hmsi8ece-prodb777-e813%2Fmedia%2FProject%2FHONDA2WI%2Fhonda2wheelersindia%2Fmotorcycle%2Fshine-125%2Faccessories%2Fshine125-accessories.png%3Fh%3D810%26iar%3D0%26w%3D1920&w=1920&q=75&dpl=dpl_7QAtHS8A71WM9kk3t5UaGA2pRwqm",
    description: "First Prize",
    order: 7,
  },
  {
    id: "honda-unicorn",
    name: "HONDA UNICORN",
    icon: <Bike className="w-6 h-6" />,
    winnerCount: 2,
    color: "bg-gradient-to-r from-amber-400 to-orange-600",
    image:
      "https://www.honda2wheelersindia.com/_next/image?url=https%3A%2F%2Fedge.sitecorecloud.io%2Fhondamotorc388f-hmsi8ece-prodb777-e813%2Fmedia%2FProject%2FHONDA2WI%2Fhonda2wheelersindia%2Fmotorcycle%2FUnicorn%2Faccessories%2Funicorn-accessories.png%3Fh%3D810%26iar%3D0%26w%3D1920&w=1920&q=75&dpl=dpl_7QAtHS8A71WM9kk3t5UaGA2pRwqm",
    description: "★ Mega Prize",
    order: 8,
  },
]

/* ======================= MAIN PAGE COMPONENT ======================= */
export default function CorporateLuckyDrawSystem() {
  /* ---------- State ---------- */
  const [dealerData, setDealerData] = useState<DealerData[]>([])
  const [prizeCategories, setPrizeCategories] = useState<PrizeCategory[]>(
    corporatePrizes.sort((a, b) => a.order - b.order),
  )
  const [winners, setWinners] = useState<Winner[]>([])
  const [drawnCoupons, setDrawnCoupons] = useState<Set<string>>(new Set())
  const [categoryWinners, setCategoryWinners] = useState<Map<string, Set<string>>>(new Map())
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0)
  const [currentCategoryWinnerIndex, setCurrentCategoryWinnerIndex] = useState(0)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentWinner, setCurrentWinner] = useState<Winner | null>(null)
  const [drawTargetName, setDrawTargetName] = useState<string | null>(null)
  const [fileName, setFileName] = useState("")
  const [isEventComplete, setIsEventComplete] = useState(false)

  /* ---------- Navigation Visibility State ---------- */
  const [isNavigationVisible, setIsNavigationVisible] = useState(false)
  const [isNavigationHovered, setIsNavigationHovered] = useState(false)

  /* ---- Dummy audio settings (keeps PrizeManagement happy, but audio disabled) ---- */
  const [audioSettings, setAudioSettings] = useState({
    drawingMusicEnabled: false,
    winnerMusicEnabled: false,
    volume: 0,
    drawingMusicUrl: "",
    winnerMusicUrl: "",
  })

  /* ---------- Background Theme (persisted) ---------- */
  const [backgroundThemeId, setBackgroundThemeId] = useState(defaultBackgroundThemeId)

  useEffect(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    if (saved && backgroundThemes.some((t) => t.id === saved)) {
      setBackgroundThemeId(saved)
    }
  }, [])

  const handleBackgroundThemeChange = useCallback((themeId: string) => {
    setBackgroundThemeId(themeId)
    localStorage.setItem(THEME_STORAGE_KEY, themeId)
  }, [])

  const activeBackgroundTheme =
    backgroundThemes.find((t) => t.id === backgroundThemeId) ?? backgroundThemes[0]

  /* ---------- Mouse Movement Detection ---------- */
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const topThreshold = 100 // Show navigation when cursor is within 100px of top
      const shouldShow = e.clientY <= topThreshold

      setIsNavigationVisible(shouldShow)
    }

    // Add mouse move listener to document
    document.addEventListener("mousemove", handleMouseMove)

    // Cleanup
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  /* ---------- File Upload ---------- */
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(new Uint8Array(ev.target?.result as ArrayBuffer), { type: "array" })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json<DealerData>(ws)

        if (json.length && (!json[0]["Coupon Number"] || !json[0].Name)) {
          alert("File must include 'Coupon Number' and 'Name' columns.")
          return
        }

        setDealerData(json)
        // reset draw state
        setWinners([])
        setDrawnCoupons(new Set())
        setCategoryWinners(new Map())
        setCurrentCategoryIndex(0)
        setCurrentCategoryWinnerIndex(0)
        setCurrentWinner(null)
        setIsEventComplete(false)
      } catch {
        alert("Failed to read file. Please select a valid Excel/CSV.")
      }
    }
    reader.readAsArrayBuffer(file)
  }, [])

  /* ---------- Helpers ---------- */
  const getEligibleCoupons = useCallback(
    (categoryId: string) => {
      const winnerSet = categoryWinners.get(categoryId) || new Set()
      let eligible = dealerData.filter((d) => !drawnCoupons.has(d["Coupon Number"]) && !winnerSet.has(d.Name))
      // Mega prize keeps the "high engagement" gate: at least 7 total coupons
      if (categoryId === "honda-unicorn") {
        eligible = eligible.filter((d) => (Number(d["Count of Total Coupons"]) || 0) >= 7)
      }
      return eligible
    },
    [dealerData, drawnCoupons, categoryWinners],
  )

  /* ---------- Draw Logic ---------- */
  const performNextDraw = useCallback(async () => {
    if (isDrawing || currentCategoryIndex >= prizeCategories.length) return
    const category = prizeCategories[currentCategoryIndex]
    const eligible = getEligibleCoupons(category.id)
    if (!eligible.length) {
      alert("No eligible coupons remaining for this category!")
      return
    }

    // Pick the winner up front so the reel can land precisely on them
    const selected = eligible[Math.floor(Math.random() * eligible.length)]
    setDrawTargetName(selected.Name)
    setIsDrawing(true)
    await new Promise((r) => setTimeout(r, 4000)) // spin duration

    const newWinner: Winner = {
      couponId: selected["Coupon Number"],
      dealerId: selected["Customer Id"],
      dealerName: selected.Name,
      category: category.name,
      timestamp: new Date(),
      district: selected.District,
    }

    setWinners((w) => [...w, newWinner])
    setDrawnCoupons((s) => new Set(s).add(selected["Coupon Number"]))
    setCategoryWinners((m) => {
      const map = new Map(m)
      const set = map.get(category.id) || new Set()
      set.add(selected.Name)
      map.set(category.id, set)
      return map
    })
    setCurrentWinner(newWinner)
    setIsDrawing(false)
    setCurrentCategoryWinnerIndex((i) => i + 1)
  }, [isDrawing, currentCategoryIndex, prizeCategories, getEligibleCoupons])

  const moveToNextCategory = useCallback(() => {
    setCurrentCategoryIndex((i) => i + 1)
    setCurrentCategoryWinnerIndex(0)
    setCurrentWinner(null)
  }, [])

  const resetSystem = useCallback(() => {
    setWinners([])
    setDrawnCoupons(new Set())
    setCategoryWinners(new Map())
    setCurrentCategoryIndex(0)
    setCurrentCategoryWinnerIndex(0)
    setCurrentWinner(null)
    setIsEventComplete(false)
  }, [])

  /* ---------- Data-view helpers ---------- */
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(50)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedColumn, setSelectedColumn] = useState("all")

  const filteredData = useMemo(() => {
    if (!dealerData.length) return []
    return dealerData.filter((row) => {
      if (!searchTerm) return true
      if (selectedColumn === "all")
        return Object.values(row).some((v) => String(v).toLowerCase().includes(searchTerm.toLowerCase()))
      return String(row[selectedColumn] || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    })
  }, [dealerData, searchTerm, selectedColumn])

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredData.slice(start, start + itemsPerPage)
  }, [filteredData, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const columns = dealerData.length ? Object.keys(dealerData[0]) : []

  /* ---------- Top 10 dealers by coupon count ---------- */
  const topDealers = useMemo(() => {
    const byDealer = new Map<string, DealerData>()
    for (const row of dealerData) {
      const key = row["Customer Id"] || row.Name
      const count = Number(row["Count of Total Coupons"]) || 0
      const existing = byDealer.get(key)
      if (!existing || count > (Number(existing["Count of Total Coupons"]) || 0)) {
        byDealer.set(key, row)
      }
    }
    return Array.from(byDealer.values())
      .sort((a, b) => (Number(b["Count of Total Coupons"]) || 0) - (Number(a["Count of Total Coupons"]) || 0))
      .slice(0, 10)
  }, [dealerData])

  /* ---------- Export current view ---------- */
  const exportCurrentView = () => {
    if (!filteredData.length) {
      alert("No data to export!")
      return
    }
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(filteredData)
    ws["!cols"] = columns.map(() => ({ wch: 20 }))
    XLSX.utils.book_append_sheet(wb, ws, "Filtered Data")
    const ts = new Date().toISOString().split("T")[0]
    XLSX.writeFile(wb, `Filtered_Data_${ts}.xlsx`)
  }

  /* ---------- Helpers ---------- */
  const getCurrentCategory = () =>
    currentCategoryIndex < prizeCategories.length ? prizeCategories[currentCategoryIndex] : null

  const getProgress = () => {
    const total = prizeCategories.reduce((sum, c) => sum + c.winnerCount, 0)
    return {
      current: winners.length,
      total,
      percentage: total ? (winners.length / total) * 100 : 0,
    }
  }

  /* =================== RENDER =================== */
  return (
    <div className={`relative min-h-screen overflow-hidden ${activeBackgroundTheme.baseBg} text-white`}>
      {/* ---------- Calm gala backdrop (static) ---------- */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        {/* Deep base wash */}
        <div
          className={`absolute inset-0 bg-gradient-to-b ${activeBackgroundTheme.gradientFrom} ${activeBackgroundTheme.gradientVia} ${activeBackgroundTheme.gradientTo}`}
        />
        {/* Single soft, static warm glow from above */}
        <div className="absolute -top-1/4 left-1/2 h-[70vh] w-[70vw] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(245,158,11,0.16),transparent_70%)] blur-3xl" />
        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.7)_100%)]" />
      </div>

      <div className="max-w-[1700px] mx-auto p-4 space-y-6">
        <Tabs defaultValue="draw" className="space-y-6">
          {/* DYNAMIC NAVIGATION - Shows/Hides based on cursor position */}
          <div
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${
              isNavigationVisible || isNavigationHovered
                ? "transform translate-y-0 opacity-100"
                : "transform -translate-y-full opacity-0"
            }`}
            onMouseEnter={() => setIsNavigationHovered(true)}
            onMouseLeave={() => setIsNavigationHovered(false)}
          >
            <div className="bg-black/70 backdrop-blur-xl border-b border-amber-400/25 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)]">
              <div className="max-w-[1700px] mx-auto px-4 py-3 flex items-center gap-4">
                <div className="hidden md:flex items-center gap-2 pr-4 border-r border-amber-400/20">
                  <Crown className="w-5 h-5 text-amber-300" />
                  <span className="font-display text-sm font-semibold tracking-wide text-amber-100 whitespace-nowrap">
                    Fortune Fiesta
                  </span>
                </div>
                <TabsList className="grid flex-1 grid-cols-7 bg-white/5 border border-amber-400/20 backdrop-blur-md rounded-xl p-1">
                  {[
                    ["upload", "Data Upload", <Upload key="upload" className="w-4 h-4" />],
                    ["dataview", "Data View", <Eye key="dataview" className="w-4 h-4" />],
                    ["leaderboard", "Top Dealers", <Award key="leaderboard" className="w-4 h-4" />],
                    ["prizes", "Prize Gallery", <Sparkles key="prizes" className="w-4 h-4" />],
                    ["manage", "Manage Prizes", <Car key="manage" className="w-4 h-4" />],
                    ["draw", "Lucky Draw", <Trophy key="draw" className="w-4 h-4" />],
                    ["results", "Results", <Download key="results" className="w-4 h-4" />],
                  ].map(([val, label, icon]) => (
                    <TabsTrigger
                      key={val}
                      value={val}
                      className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-400 data-[state=active]:to-orange-600 data-[state=active]:text-black data-[state=active]:shadow-lg data-[state=active]:shadow-amber-500/30 text-amber-100/80 font-medium flex items-center justify-center gap-2 px-3 py-2.5 transition-all duration-300 hover:bg-amber-400/10 hover:text-amber-100"
                    >
                      {icon}
                      <span className="hidden sm:inline">{label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </div>
          </div>

          {/* Header - Always visible */}
          <header className="text-center pt-10 pb-4 mt-2 animate-float-up">
            {/* Title */}
            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-extrabold leading-[1.05] tracking-tight">
              <span className="text-gold-gradient drop-shadow-[0_2px_18px_rgba(245,158,11,0.35)]">
                Insta Fortune Fiesta
              </span>
            </h1>

            {/* Decorative divider with trophy */}
            <div className="mt-6 flex items-center justify-center gap-4">
              <span className="h-px w-24 sm:w-40 gold-rule" />
              <span className="grid h-14 w-14 place-items-center rounded-full border border-amber-400/40 bg-amber-400/10 glow-gold p-2">
                <img src="/gromor-logo.png" alt="" className="h-full w-full object-contain" />
              </span>
              <span className="h-px w-24 sm:w-40 gold-rule" />
            </div>
          </header>

          {/* --------------------- UPLOAD TAB --------------------- */}
          <TabsContent value="upload" className="space-y-4">
            <Card className="bg-black/40 border-orange-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Upload className="w-5 h-5" /> Upload Participant Data
                </CardTitle>
                <CardDescription className="text-orange-200">
                  Upload Excel/CSV containing: Customer Id, Name, District, Coupon Number, Count of Total Coupons, Row
                  Number
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="file" className="text-white">
                    Select File
                  </Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="cursor-pointer bg-black/20 border-orange-500/50 text-white"
                  />
                </div>

                {fileName && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-orange-600 text-white">
                      {fileName}
                    </Badge>
                    <span className="text-sm text-orange-200">{dealerData.length} participants loaded</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* --------------------- DATA VIEW TAB --------------------- */}
          <TabsContent value="dataview" className="space-y-4">
            {dealerData.length === 0 ? (
              <Card className="bg-black/40 border-orange-500/30 backdrop-blur-sm">
                <CardContent className="text-center py-16">
                  <Eye className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                  <p className="text-xl text-orange-200">No data uploaded yet. Please upload a file first.</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-black/40 border-orange-500/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-white">
                    <span className="flex items-center gap-2">
                      <Eye className="w-5 h-5" /> Complete Data View
                    </span>
                    <span className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-orange-600 text-white">
                        {filteredData.length} of {dealerData.length}
                      </Badge>
                      <Button size="sm" onClick={exportCurrentView} className="bg-green-600 hover:bg-green-700">
                        <Download className="w-4 h-4 mr-2" />
                        Export View
                      </Button>
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search / filter */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="search" className="text-white">
                        Search
                      </Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400" />
                        <Input
                          id="search"
                          placeholder="Search..."
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value)
                            setCurrentPage(1)
                          }}
                          className="pl-10 bg-black/20 border-orange-500/50 text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="col" className="text-white">
                        Search In
                      </Label>
                      <select
                        id="col"
                        value={selectedColumn}
                        onChange={(e) => {
                          setSelectedColumn(e.target.value)
                          setCurrentPage(1)
                        }}
                        className="w-full p-2 bg-black/20 border-orange-500/50 text-white rounded-md"
                      >
                        <option value="all">All</option>
                        {columns.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="ipp" className="text-white">
                        Items / page
                      </Label>
                      <select
                        id="ipp"
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value))
                          setCurrentPage(1)
                        }}
                        className="w-full p-2 bg-black/20 border-orange-500/50 text-white rounded-md"
                      >
                        {[25, 50, 100, 200].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto max-h-96 border border-orange-500/30 rounded-lg">
                    <table className="min-w-full bg-black/20">
                      <thead className="bg-orange-600/20 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-white border-b border-orange-500/30">
                            #
                          </th>
                          {columns.map((c) => (
                            <th
                              key={c}
                              className="px-4 py-2 text-left text-sm font-medium text-white border-b border-orange-500/30"
                            >
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedData.map((row, idx) => (
                          <tr key={idx} className="border-b border-orange-500/20 hover:bg-orange-500/10">
                            <td className="px-4 py-2 text-sm text-orange-200 font-mono">
                              {(currentPage - 1) * itemsPerPage + idx + 1}
                            </td>
                            {columns.map((c) => (
                              <td key={c} className="px-4 py-2 text-sm text-orange-200">
                                {String(row[c] || "")}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-orange-200">
                        Showing {(currentPage - 1) * itemsPerPage + 1}–
                        {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length}
                      </span>
                      <span className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          className="border-orange-500 text-white hover:bg-orange-500/20"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Prev
                        </Button>
                        {/* Simple page numbers (max 5) */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                          return (
                            <Button
                              key={page}
                              size="sm"
                              variant={page === currentPage ? "default" : "outline"}
                              onClick={() => setCurrentPage(page)}
                              className={
                                page === currentPage
                                  ? "bg-orange-600 text-white"
                                  : "border-orange-500 text-white hover:bg-orange-500/20"
                              }
                            >
                              {page}
                            </Button>
                          )
                        })}
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          className="border-orange-500 text-white hover:bg-orange-500/20"
                        >
                          Next <ChevronRight className="w-4 h-4" />
                        </Button>
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* --------------------- TOP 10 DEALERS --------------------- */}
          <TabsContent value="leaderboard" className="space-y-4">
            {topDealers.length === 0 ? (
              <Card className="bg-white/[0.04] border-amber-400/20 backdrop-blur-md rounded-2xl">
                <CardContent className="text-center py-16">
                  <Award className="w-12 h-12 text-amber-400/50 mx-auto mb-4" />
                  <p className="text-amber-100/70">Upload participant data to see the top dealers.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {topDealers.map((dealer, idx) => (
                  <Card
                    key={dealer["Customer Id"] || dealer.Name}
                    className={`relative bg-white/[0.04] border-amber-400/20 backdrop-blur-md rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-amber-300/60 ${
                      idx === 0 ? "ring-1 ring-amber-300/60 shadow-[0_18px_50px_-18px_rgba(245,158,11,0.5)]" : ""
                    }`}
                  >
                    <CardContent className="p-4 text-center space-y-2">
                      <div className="mx-auto grid h-9 w-9 place-items-center rounded-full border border-amber-400/40 bg-amber-400/10 font-display text-sm font-bold text-amber-200">
                        #{idx + 1}
                      </div>
                      <div className="font-display text-base font-semibold text-white truncate" title={dealer.Name}>
                        {dealer.Name}
                      </div>
                      {dealer.District && <div className="text-xs text-amber-100/55 truncate">{dealer.District}</div>}
                      <Badge className="bg-gradient-to-r from-amber-400 to-orange-600 text-black font-semibold">
                        {Number(dealer["Count of Total Coupons"]) || 0} Coupons
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* --------------------- PRIZE GALLERY --------------------- */}
          <TabsContent value="prizes" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {prizeCategories
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((p, idx) => (
                  <Card
                    key={p.id}
                    className="group relative bg-white/[0.04] border-amber-400/20 backdrop-blur-md overflow-hidden rounded-2xl transition-all duration-500 hover:-translate-y-1.5 hover:border-amber-300/60 hover:shadow-[0_24px_60px_-20px_rgba(245,158,11,0.5)]"
                  >
                    <div className={`h-1.5 ${p.color}`} />
                    <CardContent className="p-6">
                      <div className="text-center space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge
                            variant="outline"
                            className="text-amber-200 border-amber-400/50 bg-amber-400/5 font-display"
                          >
                            #{idx + 1}
                          </Badge>
                          <Badge className="bg-gradient-to-r from-amber-400 to-orange-600 text-black font-semibold">
                            {p.winnerCount} {p.winnerCount === 1 ? "Winner" : "Winners"}
                          </Badge>
                        </div>
                        <div className="relative overflow-hidden rounded-xl ring-1 ring-amber-400/15">
                          <img
                            src={p.image || "/placeholder.svg"}
                            alt={p.name}
                            className="w-full h-48 object-cover transition-transform duration-700 group-hover:scale-110"
                            onError={(e) => {
                              // Fallback to placeholder if image fails to load
                              e.currentTarget.src = `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(p.name)}`
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </div>
                        <h3 className="font-display text-xl font-bold text-white tracking-wide">{p.name}</h3>
                        <p className="text-amber-100/70 text-sm">{p.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          {/* --------------------- PRIZE MANAGEMENT --------------------- */}
          <TabsContent value="manage">
            <PrizeManagement
              categories={prizeCategories}
              onCategoriesChange={setPrizeCategories}
              audioSettings={audioSettings}
              onAudioSettingsChange={setAudioSettings}
              backgroundThemeId={backgroundThemeId}
              onBackgroundThemeChange={handleBackgroundThemeChange}
            />
          </TabsContent>

          {/* --------------------- LUCKY DRAW --------------------- */}
          <TabsContent value="draw" className="space-y-6">
            {dealerData.length === 0 ? (
              <Card className="bg-black/40 border-orange-500/30 backdrop-blur-sm">
                <CardContent className="text-center py-16">
                  <Upload className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                  <p className="text-xl text-orange-200">
                    Please upload participant data first to start the lucky draw
                  </p>
                </CardContent>
              </Card>
            ) : (
              <SequentialDrawInterface
                prizeCategories={prizeCategories}
                currentCategory={getCurrentCategory()}
                currentCategoryWinnerIndex={currentCategoryWinnerIndex}
                isDrawing={isDrawing}
                currentWinner={currentWinner}
                targetName={drawTargetName}
                isEventComplete={isEventComplete}
                progress={getProgress()}
                onPerformDraw={performNextDraw}
                onResetSystem={resetSystem}
                getEligibleCoupons={getEligibleCoupons}
                winners={winners}
                onMoveToNextCategory={moveToNextCategory}
              />
            )}
          </TabsContent>

          {/* --------------------- RESULTS TAB --------------------- */}
          <TabsContent value="results">
            <div className="space-y-6">
              <WinnersList winners={winners} prizeCategories={prizeCategories} />
              <ExportResults winners={winners} prizeCategories={prizeCategories} dealerData={dealerData} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
