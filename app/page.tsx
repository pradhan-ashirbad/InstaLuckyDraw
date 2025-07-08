"use client"

import type React from "react"
import { useState, useCallback, useMemo, useEffect } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Upload,
  Sparkles,
  Car,
  Laptop,
  AirVent,
  Tv,
  Smartphone,
  Wind,
  Headphones,
  Volume2,
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
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

/* -------------------- PRIZE DATA WITH REAL IMAGES -------------------- */
const corporatePrizes: PrizeCategory[] = [
  {
    id: "noise-earbuds",
    name: "NOISE PURE BUDS (EARBUDS)",
    icon: <Headphones className="w-6 h-6" />,
    winnerCount: 20,
    color: "bg-gradient-to-r from-blue-500 to-purple-600",
    image: "https://www.livemint.com/lm-img/img/2025/02/25/1600x900/Noise_master_buds_1740457297467_1740457302868.jpg",
    description: "Premium Earbuds",
    order: 1,
  },
  {
    id: "mixer-grinder",
    name: "MIXER GRINDER-FOOD PROCESSOR",
    icon: <Volume2 className="w-6 h-6" />,
    winnerCount: 7,
    color: "bg-gradient-to-r from-green-400 to-blue-500",
    image: "https://butterflyeu.com/cdn/shop/files/Elektra25.png?v=1713431211",
    description: "Kitchen Appliance",
    order: 2,
  },
  {
    id: "samsung-a16",
    name: "SMARTPHONE - SAMSUNG A16",
    icon: <Smartphone className="w-6 h-6" />,
    winnerCount: 6,
    color: "bg-gradient-to-r from-purple-500 to-pink-500",
    image: "https://www.financialexpress.com/wp-content/uploads/2024/10/SAMSUNG-A16.jpg",
    description: "Samsung Galaxy A16",
    order: 3,
  },
  {
    id: "double-door-fridge",
    name: "DOUBLE DOOR FRIDGE",
    icon: <AirVent className="w-6 h-6" />,
    winnerCount: 5,
    color: "bg-gradient-to-r from-cyan-400 to-blue-500",
    image:
      "https://www.lg.com/content/dam/channel/wcms/in/images/refrigerators/gl-s292rdsx_adszebn_eail_in_c/gallery/GL-S292RDSX-Refrigerators-Front-View-DZ-01.jpg",
    description: "Energy Efficient Fridge",
    order: 4,
  },
  {
    id: "smart-tv-43",
    name: "43 INCH SMART TELEVISION",
    icon: <Tv className="w-6 h-6" />,
    winnerCount: 4,
    color: "bg-gradient-to-r from-indigo-500 to-purple-600",
    image: "https://www.intex.in/cdn/shop/products/1_9b8014ad-124e-4742-a628-9a4c4affe617.jpg?v=1750330801",
    description: "4K Smart TV",
    order: 5,
  },
  {
    id: "split-ac-1-5",
    name: "SPLIT AC 1.5 TON",
    icon: <Wind className="w-6 h-6" />,
    winnerCount: 3,
    color: "bg-gradient-to-r from-teal-400 to-green-500",
    image:
      "https://static.wixstatic.com/media/4af009_50b99ed648a4405980138b37e56d3abb~mv2.jpg/v1/fill/w_980,h_569,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/4af009_50b99ed648a4405980138b37e56d3abb~mv2.jpg",
    description: "Energy Efficient AC",
    order: 6,
  },
  {
    id: "laptop",
    name: "LAPTOP",
    icon: <Laptop className="w-6 h-6" />,
    winnerCount: 2,
    color: "bg-gradient-to-r from-gray-700 to-gray-900",
    image: "https://cdn.mos.cms.futurecdn.net/Gw3Se82bvppoJsHc4rCVsQ.jpg",
    description: "High Performance Laptop",
    order: 7,
  },
  {
    id: "tvs-jupiter",
    name: "TVS JUPITER",
    icon: <Car className="w-6 h-6" />,
    winnerCount: 1,
    color: "bg-gradient-to-r from-yellow-400 to-orange-500",
    image: "https://www.tvsmotor.com/tvs-jupiter/-/media/28DECBlogs/TVS-Jupiter-125Jul.jpg",
    description: "Premium Scooter",
    order: 8,
  },
  {
    id: "tvs-icube",
    name: "TVS I-CUBE SCOOTERS",
    icon: <Car className="w-6 h-6" />,
    winnerCount: 3,
    color: "bg-gradient-to-r from-emerald-400 to-teal-500",
    image: "https://imgd.aeplcdn.com/1280x720/n/cw/ec/202879/iqube-right-front-three-quarter-10.jpeg?isig=0",
    description: "Electric Scooter",
    order: 9,
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
      if (categoryId === "tvs-icube") {
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

    setIsDrawing(true)
    await new Promise((r) => setTimeout(r, 4000)) // fake spin delay

    const selected = eligible[Math.floor(Math.random() * eligible.length)]
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
    <div className="min-h-screen bg-gradient-to-br from-orange-600 via-orange-800 to-black">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
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
            <div className="bg-gradient-to-r from-orange-600 via-orange-800 to-black backdrop-blur-md border-b border-orange-500/30 shadow-2xl">
              <div className="max-w-7xl mx-auto p-4">
                <TabsList className="grid w-full grid-cols-6 bg-black/60 border-orange-500/50 backdrop-blur-md shadow-2xl">
                  {[
                    ["upload", "Data Upload", <Upload key="upload" className="w-4 h-4" />],
                    ["dataview", "Data View", <Eye key="dataview" className="w-4 h-4" />],
                    ["prizes", "Prize Gallery", <Sparkles key="prizes" className="w-4 h-4" />],
                    ["manage", "Manage Prizes", <Car key="manage" className="w-4 h-4" />],
                    ["draw", "Lucky Draw", <Sparkles key="draw" className="w-4 h-4" />],
                    ["results", "Results", <Download key="results" className="w-4 h-4" />],
                  ].map(([val, label, icon]) => (
                    <TabsTrigger
                      key={val}
                      value={val}
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 text-white font-medium flex items-center gap-2 px-4 py-3 transition-all duration-300 hover:bg-orange-500/20"
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
          <header className="text-center space-y-4 py-6 mt-4">
            <h1 className="text-5xl md:text-6xl font-bold text-white flex items-center justify-center gap-4">
              <Sparkles className="w-10 h-10 md:w-12 md:h-12 text-orange-400 animate-pulse" />
              Insta Fortune Fiesta
              <Sparkles className="w-10 h-10 md:w-12 md:h-12 text-orange-400 animate-pulse" />
            </h1>
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

          {/* --------------------- PRIZE GALLERY --------------------- */}
          <TabsContent value="prizes" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {prizeCategories
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((p, idx) => (
                  <Card
                    key={p.id}
                    className="bg-black/40 border-orange-500/30 backdrop-blur-sm overflow-hidden hover:scale-105 transition-transform"
                  >
                    <div className={`h-4 ${p.color}`} />
                    <CardContent className="p-6">
                      <div className="text-center space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-white border-orange-500">
                            #{idx + 1}
                          </Badge>
                          <Badge className={`${p.color} text-white`}>
                            {p.winnerCount} {p.winnerCount === 1 ? "Winner" : "Winners"}
                          </Badge>
                        </div>
                        <img
                          src={p.image || "/placeholder.svg"}
                          alt={p.name}
                          className="w-full h-48 object-cover rounded-lg"
                          onError={(e) => {
                            // Fallback to placeholder if image fails to load
                            e.currentTarget.src = `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(p.name)}`
                          }}
                        />
                        <h3 className="text-xl font-bold text-white">{p.name}</h3>
                        <p className="text-orange-200">{p.description}</p>
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
