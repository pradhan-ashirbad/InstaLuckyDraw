"use client";

import type React from "react";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  Award,
  Bike,
  WashingMachine,
  Utensils,
  ArrowUpRight,
  Ticket,
  Users,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";

import { DRAW_DURATION_MS } from "@/lib/draw-timing";
import { PrizeManagement } from "@/components/prize-management";
import { SequentialDrawInterface } from "@/components/sequential-draw-interface";
import { WinnersList } from "@/components/winners-list";
import { ExportResults } from "@/components/export-results";
import {
  backgroundThemes,
  defaultBackgroundThemeId,
  THEME_STORAGE_KEY,
  CUSTOM_THEME_ID,
  CUSTOM_COLOR_STORAGE_KEY,
  defaultCustomColor,
  getStageTheme,
  getOuterBackdropStyle,
} from "@/lib/background-themes";

interface DealerData {
  "Customer Id"?: string;
  Name: string;
  District?: string;
  "Coupon Number": string;
  "Count of Total Coupons"?: number;
  "Row Number"?: number;
  [key: string]: any;
}

interface PrizeCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  winnerCount: number;
  color: string;
  image: string;
  description: string;
  order: number;
}

interface Winner {
  couponId: string;
  dealerId?: string;
  dealerName: string;
  category: string;
  timestamp: Date;
  district?: string;
}

/* -------------------- PRIZE DATA (draw order: Seventh → Mega) -------------------- */
const corporatePrizes: PrizeCategory[] = [
  {
    id: "bajaj-kitchen-combo",
    name: "MICROWAVE",
    icon: <Utensils className="w-6 h-6" />,
    winnerCount: 14,
    color: "bg-gradient-to-r from-green-400 to-emerald-600",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0KWqkaphPLEHonwFYVhTDbN0Imk3yhvWcqXoW_QbGrg&s",
    description: "Seventh Prize",
    order: 1,
  },
  {
    id: "samsung-a17",
    name: "LAPTOP",
    icon: <Smartphone className="w-6 h-6" />,
    winnerCount: 8,
    color: "bg-gradient-to-r from-purple-500 to-pink-500",
    image:
      "https://img.magnific.com/free-photo/laptop-with-white-screen-isolated-white-wall_231208-8594.jpg?semt=ais_hybrid&w=740&q=80",
    description: "Sixth Prize",
    order: 2,
  },
  {
    id: "washing-machine",
    name: "DOUBLE DOOR REFRIGERATOR",
    icon: <WashingMachine className="w-6 h-6" />,
    winnerCount: 3,
    color: "bg-gradient-to-r from-teal-400 to-emerald-500",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRZ34fqshCAvUXYrnzgqMRX9cql97FNKVQcEPhM3BGahw&s=10",
    description: "Premium Prize",
    order: 4,
  },
  {
    id: "split-ac-1-5",
    name: "ACTIVA",
    icon: <Wind className="w-6 h-6" />,
    winnerCount: 5,
    color: "bg-gradient-to-r from-cyan-400 to-blue-500",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQXuiVahK3Y9Axm-0jo46jQ9nwd05H-NZEVUhW5QClOnA&s=10",
    description: "Fourth Prize",
    order: 3,
  },
  // {
  //   id: "smart-tv-55",
  //   name: "LED 55 INCH SMART TELEVISION",
  //   icon: <Tv className="w-6 h-6" />,
  //   winnerCount: 2,
  //   color: "bg-gradient-to-r from-indigo-500 to-purple-600",
  //   image: "https://www.intex.in/cdn/shop/products/1_9b8014ad-124e-4742-a628-9a4c4affe617.jpg?v=1750330801",
  //   description: "Third Prize",
  //   order: 5,
  // },
  // {
  //   id: "honda-dio",
  //   name: "HONDA SHINE SP",
  //   icon: <Bike className="w-6 h-6" />,
  //   winnerCount: 1,
  //   color: "bg-gradient-to-r from-blue-500 to-indigo-600",
  //   image:
  //     "https://www.honda2wheelersindia.com/_next/image?url=https%3A%2F%2Fedge.sitecorecloud.io%2Fhondamotorc388f-hmsi8ece-prodb777-e813%2Fmedia%2FProject%2FHONDA2WI%2Fhonda2wheelersindia%2Fscooter%2Fdio-110%2Fdio110-accessories.png%3Fh%3D810%26iar%3D0%26w%3D1920&w=1920&q=75&dpl=dpl_7QAtHS8A71WM9kk3t5UaGA2pRwqm",
  //   description: "Second Prize",
  //   order: 6,
  // },
  // {
  //   id: "honda-shine",
  //   name: "HONDA SHINE SP",
  //   icon: <Bike className="w-6 h-6" />,
  //   winnerCount: 1,
  //   color: "bg-gradient-to-r from-red-500 to-rose-700",
  //   image:
  //     "https://www.honda2wheelersindia.com/_next/image?url=https%3A%2F%2Fedge.sitecorecloud.io%2Fhondamotorc388f-hmsi8ece-prodb777-e813%2Fmedia%2FProject%2FHONDA2WI%2Fhonda2wheelersindia%2Fmotorcycle%2Fshine-125%2Faccessories%2Fshine125-accessories.png%3Fh%3D810%26iar%3D0%26w%3D1920&w=1920&q=75&dpl=dpl_7QAtHS8A71WM9kk3t5UaGA2pRwqm",
  //   description: "First Prize",
  //   order: 6,
  // },
  {
    id: "honda-unicorn",
    name: "HONDA UNICORN",
    icon: <Bike className="w-6 h-6" />,
    winnerCount: 1,
    color: "bg-gradient-to-r from-amber-400 to-orange-600",
    image:
      "https://www.honda2wheelersindia.com/_next/image?url=https%3A%2F%2Fedge.sitecorecloud.io%2Fhondamotorc388f-hmsi8ece-prodb777-e813%2Fmedia%2FProject%2FHONDA2WI%2Fhonda2wheelersindia%2Fmotorcycle%2FUnicorn%2Faccessories%2Funicorn-accessories.png%3Fh%3D810%26iar%3D0%26w%3D1920&w=1920&q=75&dpl=dpl_7QAtHS8A71WM9kk3t5UaGA2pRwqm",
    description: "Premium Prize",
    order: 5,
  },
];

/* ======================= MAIN PAGE COMPONENT ======================= */
export default function CorporateLuckyDrawSystem() {
  /* ---------- State ---------- */
  const [dealerData, setDealerData] = useState<DealerData[]>([]);
  const [prizeCategories, setPrizeCategories] = useState<PrizeCategory[]>(
    corporatePrizes.sort((a, b) => a.order - b.order),
  );
  const [winners, setWinners] = useState<Winner[]>([]);
  const [drawnCoupons, setDrawnCoupons] = useState<Set<string>>(new Set());
  const [winningCustomers, setWinningCustomers] = useState<Set<string>>(
    new Set(),
  );
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [currentCategoryWinnerIndex, setCurrentCategoryWinnerIndex] =
    useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentWinner, setCurrentWinner] = useState<Winner | null>(null);
  const [drawTargetName, setDrawTargetName] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [isEventComplete, setIsEventComplete] = useState(false);

  const [activeTab, setActiveTab] = useState("draw");
  const [uploadStatus, setUploadStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const drawInFlight = useRef(false);
  const drawTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (drawTimer.current) clearTimeout(drawTimer.current);
    },
    [],
  );
  const [audioSettings, setAudioSettings] = useState({
    drawingMusicEnabled: true,
    winnerMusicEnabled: true,
    volume: 55,
    drawingMusicUrl: "/sounds/kbc.mp3",
    winnerMusicUrl: "",
  });

  /* ---------- Background Theme (persisted) ---------- */
  const [backgroundThemeId, setBackgroundThemeId] = useState(
    defaultBackgroundThemeId,
  );

  useEffect(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (
      saved &&
      (saved === CUSTOM_THEME_ID ||
        backgroundThemes.some((t) => t.id === saved))
    ) {
      setBackgroundThemeId(saved);
    }
  }, []);

  const handleBackgroundThemeChange = useCallback((themeId: string) => {
    setBackgroundThemeId(themeId);
    localStorage.setItem(THEME_STORAGE_KEY, themeId);
  }, []);

  /* Custom color — one picker that tints both the page background and the stage */
  const [customColor, setCustomColor] = useState(defaultCustomColor);

  useEffect(() => {
    const saved = localStorage.getItem(CUSTOM_COLOR_STORAGE_KEY);
    if (saved) {
      setCustomColor(saved);
    }
  }, []);

  const handleCustomColorChange = useCallback((hex: string) => {
    setCustomColor(hex);
    localStorage.setItem(CUSTOM_COLOR_STORAGE_KEY, hex);
    setBackgroundThemeId(CUSTOM_THEME_ID);
    localStorage.setItem(THEME_STORAGE_KEY, CUSTOM_THEME_ID);
  }, []);

  const isCustomTheme = backgroundThemeId === CUSTOM_THEME_ID;
  const activeBackgroundTheme =
    backgroundThemes.find((t) => t.id === backgroundThemeId) ??
    backgroundThemes[0];
  const accentHex = isCustomTheme ? customColor : activeBackgroundTheme.accent;
  const stageTheme = getStageTheme(accentHex);
  const outerBackdropStyle = isCustomTheme
    ? getOuterBackdropStyle(customColor)
    : null;

  /* ---------- File Upload ---------- */
  const loadFile = async (file: File) => {
    if (drawInFlight.current) return;
    if (
      winners.length &&
      !window.confirm(
        "Replace participant data and clear all draw results? Export your results first if you need them.",
      )
    )
      return;
    setIsUploading(true);
    setUploadStatus(null);
    try {
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      if (!ws)
        throw new Error(
          "This file has no worksheet. Choose an Excel or CSV file.",
        );
      const rows = XLSX.utils.sheet_to_json<DealerData>(ws);
      if (!rows.length)
        throw new Error(
          "This file is empty. Add participant rows below the column headers.",
        );
      const invalid = rows.findIndex(
        (row) =>
          !String(row.Name ?? "").trim() ||
          !String(row["Coupon Number"] ?? "").trim(),
      );
      if (invalid >= 0)
        throw new Error(
          `Row ${invalid + 2} needs a Name and Coupon Number. Check the column headers and try again.`,
        );
      const json = rows.map((row) => ({
        ...row,
        Name: String(row.Name).trim(),
        "Coupon Number": String(row["Coupon Number"]).trim(),
      }));
      setDealerData(json);
      setFileName(file.name);
      setWinners([]);
      setDrawnCoupons(new Set());
      setWinningCustomers(new Set());
      setCurrentCategoryIndex(0);
      setCurrentCategoryWinnerIndex(0);
      setCurrentWinner(null);
      setDrawTargetName(null);
      setIsEventComplete(false);
      setCurrentPage(1);
      setSearchTerm("");
      setSelectedColumn("all");
      setUploadStatus({
        type: "success",
        message: `${json.length.toLocaleString()} coupons imported. Your event is ready to begin.`,
      });
    } catch (error) {
      setUploadStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to read this file. Choose a valid Excel or CSV file.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        "Customer Id": "D001",
        Name: "Example Dealer",
        District: "Mumbai",
        "Coupon Number": "C001",
        "Count of Total Coupons": 3,
        "Row Number": 1,
      },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Participants");
    XLSX.writeFile(wb, "Lucky_Draw_Participant_Template.xlsx");
  };

  /* ---------- Helpers ---------- */
  const getEligibleCoupons = useCallback(
    (categoryId: string) => {
      let eligible = dealerData.filter((d) => {
        const isCouponDrawn = drawnCoupons.has(d["Coupon Number"]);
        const customerKey = d["Customer Id"]
          ? String(d["Customer Id"]).trim()
          : String(d.Name).trim();
        const hasCustomerWon =
          winningCustomers.has(customerKey) ||
          winningCustomers.has(String(d.Name).trim());
        return !isCouponDrawn && !hasCustomerWon;
      });
      // Mega prize categories keep the "high engagement" gate (at least 3 total coupons)
      if (categoryId === "honda-unicorn" || categoryId === "washing-machine") {
        eligible = eligible.filter(
          (d) => (Number(d["Count of Total Coupons"]) || 0) >= 3,
        );
      }
      return eligible;
    },
    [dealerData, drawnCoupons, winningCustomers],
  );

  /* ---------- Draw Logic ---------- */
  const performNextDraw = useCallback(async () => {
    if (
      drawInFlight.current ||
      isDrawing ||
      currentCategoryIndex >= prizeCategories.length
    )
      return;
    const category = prizeCategories[currentCategoryIndex];
    const eligible = getEligibleCoupons(category.id);
    if (!eligible.length) {
      alert("No eligible coupons remaining for this category!");
      return;
    }

    if (currentCategoryWinnerIndex >= category.winnerCount) return;
    drawInFlight.current = true;

    // Pick the winner up front so the reel can land precisely on them
    const selected = eligible[Math.floor(Math.random() * eligible.length)];
    setDrawTargetName(selected.Name);
    setIsDrawing(true);
    await new Promise<void>((resolve) => {
      drawTimer.current = setTimeout(resolve, DRAW_DURATION_MS);
    });

    const newWinner: Winner = {
      couponId: selected["Coupon Number"],
      dealerId: selected["Customer Id"],
      dealerName: selected.Name,
      category: category.name,
      timestamp: new Date(),
      district: selected.District,
    };

    setWinners((w) => [...w, newWinner]);
    setDrawnCoupons((s) => new Set(s).add(selected["Coupon Number"]));
    setWinningCustomers((s) => {
      const next = new Set(s);
      if (selected["Customer Id"])
        next.add(String(selected["Customer Id"]).trim());
      if (selected.Name) next.add(String(selected.Name).trim());
      return next;
    });
    setCurrentWinner(newWinner);
    setIsDrawing(false);
    drawInFlight.current = false;
    setCurrentCategoryWinnerIndex((i) => i + 1);
  }, [
    isDrawing,
    currentCategoryIndex,
    currentCategoryWinnerIndex,
    prizeCategories,
    getEligibleCoupons,
  ]);

  const moveToNextCategory = useCallback(() => {
    if (drawInFlight.current) return;
    setCurrentCategoryIndex((i) => {
      const next = i + 1;
      if (next >= prizeCategories.length) {
        setIsEventComplete(true);
      }
      return next;
    });
    setCurrentCategoryWinnerIndex(0);
    setCurrentWinner(null);
  }, [prizeCategories.length]);

  const resetSystem = useCallback(() => {
    if (drawInFlight.current) return;
    setWinners([]);
    setDrawnCoupons(new Set());
    setWinningCustomers(new Set());
    setCurrentCategoryIndex(0);
    setCurrentCategoryWinnerIndex(0);
    setCurrentWinner(null);
    setIsEventComplete(false);
  }, []);

  /* ---------- Data-view helpers ---------- */
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedColumn, setSelectedColumn] = useState("all");

  const filteredData = useMemo(() => {
    if (!dealerData.length) return [];
    return dealerData.filter((row) => {
      if (!searchTerm) return true;
      if (selectedColumn === "all")
        return Object.values(row).some((v) =>
          String(v).toLowerCase().includes(searchTerm.toLowerCase()),
        );
      return String(row[selectedColumn] || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    });
  }, [dealerData, searchTerm, selectedColumn]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const columns = dealerData.length ? Object.keys(dealerData[0]) : [];

  /* ---------- Top 10 dealers by coupon count ---------- */
  const topDealers = useMemo(() => {
    const byDealer = new Map<string, DealerData>();
    for (const row of dealerData) {
      const key = row["Customer Id"] || row.Name;
      const count = Number(row["Count of Total Coupons"]) || 0;
      const existing = byDealer.get(key);
      if (
        !existing ||
        count > (Number(existing["Count of Total Coupons"]) || 0)
      ) {
        byDealer.set(key, row);
      }
    }
    return Array.from(byDealer.values())
      .sort(
        (a, b) =>
          (Number(b["Count of Total Coupons"]) || 0) -
          (Number(a["Count of Total Coupons"]) || 0),
      )
      .slice(0, 10);
  }, [dealerData]);

  /* ---------- Export current view ---------- */
  const exportCurrentView = () => {
    if (!filteredData.length) {
      alert("No data to export!");
      return;
    }
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(filteredData);
    ws["!cols"] = columns.map(() => ({ wch: 20 }));
    XLSX.utils.book_append_sheet(wb, ws, "Filtered Data");
    const ts = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `Filtered_Data_${ts}.xlsx`);
  };

  /* ---------- Helpers ---------- */
  const getCurrentCategory = () =>
    currentCategoryIndex < prizeCategories.length
      ? prizeCategories[currentCategoryIndex]
      : null;

  const getProgress = () => {
    const total = prizeCategories.reduce((sum, c) => sum + c.winnerCount, 0);
    return {
      current: winners.length,
      total,
      percentage: total ? (winners.length / total) * 100 : 0,
    };
  };

  /* =================== RENDER =================== */
  return (
    <div
      className="event-app min-h-screen"
      style={
        {
          "--event-accent": accentHex,
          "--event-glow": stageTheme.glowRgb,
          ...(outerBackdropStyle
            ? { backgroundColor: outerBackdropStyle.backgroundColor }
            : {}),
        } as React.CSSProperties
      }
    >
      <div className="event-backdrop" aria-hidden="true" />
      <div className="event-container">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <div className="event-topbar">
            <a href="#main-content" className="skip-link">
              Skip to content
            </a>
            <div className="event-brand">
              <span className="brand-mark">
                <img src="/gromor-logo.png" alt="Gromor" />
              </span>
              <span>
                <strong>
                  SULPHAMAX<span className="brand-dot">.</span>
                </strong>
                <small>SMART LUCKY DRAW</small>
              </span>
            </div>
            <div className="event-session">
              <span
                className={isDrawing ? "status-dot is-live" : "status-dot"}
              />
              {isDrawing
                ? "Draw in progress"
                : isEventComplete
                  ? "Event complete"
                  : "Event control room"}
            </div>
          </div>
          <header className="event-hero">
            <div>
              <div className="eyebrow">
                <span /> A celebration of our partners
              </div>
              <h1>
                Great partnerships.
                <br />
                <em>Extraordinary rewards.</em>
              </h1>
              <p>A moment in the spotlight. A memory to take home.</p>
            </div>
            <div className="hero-seal" aria-hidden="true">
              <div className="seal-orbit" />
              <Trophy />
              <span>THE LUCKY DRAW EXPERIENCE</span>
            </div>
          </header>
          <div className="event-metrics" aria-label="Event overview">
            {[
              {
                label: "Coupons loaded",
                value: dealerData.length.toLocaleString(),
                icon: <Ticket />,
              },
              {
                label: "Prize categories",
                value: prizeCategories.length,
                icon: <Sparkles />,
              },
              {
                label: "Prizes to celebrate",
                value: getProgress().total,
                icon: <Trophy />,
              },
              {
                label: "Winners revealed",
                value: winners.length,
                icon: <Users />,
              },
            ].map((metric) => (
              <div key={metric.label} className="event-metric">
                {metric.icon}
                <div>
                  <strong>{metric.value}</strong>
                  <span>{metric.label}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="event-navigation">
            <TabsList className="event-tabs" aria-label="Event sections">
              {(
                [
                  ["draw", "Live draw", Trophy],
                  ["upload", "Data Upload", Upload],
                  ["dataview", "Data View", Eye],
                  ["leaderboard", "Top Dealers", Award],
                  ["prizes", "Prize Gallery", Sparkles],
                  ["manage", "Manage Prizes", Car],
                  ["results", "Results", Download],
                ] as const
              ).map(([value, label, Icon]) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  disabled={isDrawing && value !== "draw"}
                  className="event-tab"
                >
                  <Icon aria-hidden="true" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <main id="main-content" tabIndex={-1}>
            {/* --------------------- UPLOAD TAB --------------------- */}
            <TabsContent value="upload" className="space-y-6">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">01 / Prepare your event</span>
                  <h2>Every ticket is a possibility.</h2>
                  <p>
                    Bring your participants together. We’ll take care of their
                    moment.
                  </p>
                </div>
                <Button variant="outline" onClick={downloadTemplate}>
                  <Download /> Download template
                </Button>
              </div>
              <Card className="upload-card">
                <CardContent className="p-5 sm:p-8">
                  <div
                    className={`upload-dropzone ${isDragging ? "is-dragging" : ""}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (!isUploading && e.dataTransfer.files[0])
                        void loadFile(e.dataTransfer.files[0]);
                    }}
                  >
                    <span className="upload-icon">
                      <FileSpreadsheet />
                    </span>
                    <h3>Make room for the next winner</h3>
                    <p>Drag your participant file here, or browse to upload.</p>
                    <Label htmlFor="file" className="upload-browse">
                      {isUploading
                        ? "Reading your file…"
                        : "Choose participant file"}
                      <ArrowUpRight />
                    </Label>
                    <Input
                      id="file"
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      disabled={isUploading || isDrawing}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void loadFile(file);
                        e.target.value = "";
                      }}
                      className="sr-only"
                    />
                    <small>
                      Excel (.xlsx, .xls) or CSV · Your data stays in this
                      browser
                    </small>
                  </div>
                  {uploadStatus && (
                    <div
                      role={uploadStatus.type === "error" ? "alert" : "status"}
                      className={`upload-feedback ${uploadStatus.type}`}
                    >
                      {uploadStatus.type === "success" ? (
                        <CheckCircle2 />
                      ) : (
                        <AlertCircle />
                      )}
                      <span>{uploadStatus.message}</span>
                    </div>
                  )}
                  {fileName && (
                    <div className="upload-loaded">
                      <FileSpreadsheet />
                      <div>
                        <strong>{fileName}</strong>
                        <span>
                          {dealerData.length.toLocaleString()} coupons loaded
                        </span>
                      </div>
                      <Button onClick={() => setActiveTab("draw")}>
                        Go to live draw <ArrowUpRight />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              <div className="upload-guide">
                <div>
                  <span className="eyebrow">Your file, at a glance</span>
                  <h3>
                    A little preparation.
                    <br />A seamless celebration.
                  </h3>
                </div>
                <div>
                  <strong>Required columns</strong>
                  <p>Name · Coupon Number</p>
                  <strong>Additional columns</strong>
                  <p>
                    Customer Id · District · Count of Total Coupons · Row Number
                  </p>
                  <small>
                    For the refrigerator and Honda Unicorn prizes, include at
                    least 3 in Count of Total Coupons for eligible participants.
                    Importing a new file clears previous results.
                  </small>
                </div>
              </div>
            </TabsContent>

            {/* --------------------- DATA VIEW TAB --------------------- */}
            <TabsContent value="dataview" className="space-y-4">
              {dealerData.length === 0 ? (
                <Card className="bg-[#111723] border-white/10 backdrop-blur-sm">
                  <CardContent className="text-center py-16">
                    <Eye className="w-16 h-16 text-amber-200 mx-auto mb-4" />
                    <p className="text-xl text-slate-300">
                      No data uploaded yet. Please upload a file first.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-[#111723] border-white/10 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex flex-wrap items-center justify-between gap-3 text-white">
                      <span className="flex items-center gap-2">
                        <Eye className="w-5 h-5" /> Complete Data View
                      </span>
                      <span className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="bg-amber-700 text-white"
                        >
                          {filteredData.length} of {dealerData.length}
                        </Badge>
                        <Button
                          size="sm"
                          onClick={exportCurrentView}
                          className="bg-green-600 hover:bg-green-700"
                        >
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
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-200" />
                          <Input
                            id="search"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => {
                              setSearchTerm(e.target.value);
                              setCurrentPage(1);
                            }}
                            className="pl-10 bg-black/20 border-white/15 text-white"
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
                            setSelectedColumn(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="w-full p-2 bg-black/20 border-white/15 text-white rounded-md"
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
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          className="w-full p-2 bg-black/20 border-white/15 text-white rounded-md"
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
                    <div className="overflow-x-auto max-h-96 border border-white/10 rounded-lg">
                      <table className="min-w-full bg-black/20">
                        <thead className="bg-amber-700/20 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-medium text-white border-b border-white/10">
                              #
                            </th>
                            {columns.map((c) => (
                              <th
                                key={c}
                                className="px-4 py-2 text-left text-sm font-medium text-white border-b border-white/10"
                              >
                                {c}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedData.map((row, idx) => (
                            <tr
                              key={idx}
                              className="border-b border-orange-500/20 hover:bg-orange-500/10"
                            >
                              <td className="px-4 py-2 text-sm text-slate-300 font-mono">
                                {(currentPage - 1) * itemsPerPage + idx + 1}
                              </td>
                              {columns.map((c) => (
                                <td
                                  key={c}
                                  className="px-4 py-2 text-sm text-slate-300"
                                >
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
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="text-sm text-slate-300">
                          Showing {(currentPage - 1) * itemsPerPage + 1}–
                          {Math.min(
                            currentPage * itemsPerPage,
                            filteredData.length,
                          )}{" "}
                          of {filteredData.length}
                        </span>
                        <span className="flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={currentPage === 1}
                            onClick={() =>
                              setCurrentPage((p) => Math.max(1, p - 1))
                            }
                            className="border-orange-500 text-white hover:bg-orange-500/20"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            Prev
                          </Button>
                          {/* Simple page numbers (max 5) */}
                          {Array.from(
                            { length: Math.min(5, totalPages) },
                            (_, i) => {
                              const page =
                                Math.max(
                                  1,
                                  Math.min(totalPages - 4, currentPage - 2),
                                ) + i;
                              return (
                                <Button
                                  key={page}
                                  size="sm"
                                  variant={
                                    page === currentPage ? "default" : "outline"
                                  }
                                  onClick={() => setCurrentPage(page)}
                                  className={
                                    page === currentPage
                                      ? "bg-amber-700 text-white"
                                      : "border-orange-500 text-white hover:bg-orange-500/20"
                                  }
                                >
                                  {page}
                                </Button>
                              );
                            },
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={currentPage === totalPages}
                            onClick={() =>
                              setCurrentPage((p) => Math.min(totalPages, p + 1))
                            }
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
                    <p className="text-amber-100/70">
                      Upload participant data to see the top dealers.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {topDealers.map((dealer, idx) => (
                    <Card
                      key={dealer["Customer Id"] || dealer.Name}
                      className={`relative bg-white/[0.04] border-amber-400/20 backdrop-blur-md rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-amber-300/60 ${
                        idx === 0
                          ? "ring-1 ring-amber-300/60 shadow-[0_18px_50px_-18px_rgba(245,158,11,0.5)]"
                          : ""
                      }`}
                    >
                      <CardContent className="p-4 text-center space-y-2">
                        <div className="mx-auto grid h-9 w-9 place-items-center rounded-full border border-amber-400/40 bg-amber-400/10 font-display text-sm font-bold text-amber-200">
                          #{idx + 1}
                        </div>
                        <div
                          className="font-display text-base font-semibold text-white truncate"
                          title={dealer.Name}
                        >
                          {dealer.Name}
                        </div>
                        {dealer.District && (
                          <div className="text-xs text-amber-100/55 truncate">
                            {dealer.District}
                          </div>
                        )}
                        <Badge className="bg-gradient-to-r from-amber-400 to-orange-600 text-black font-semibold">
                          {Number(dealer["Count of Total Coupons"]) || 0}{" "}
                          Coupons
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
                              {p.winnerCount}{" "}
                              {p.winnerCount === 1 ? "Winner" : "Winners"}
                            </Badge>
                          </div>
                          <div className="relative overflow-hidden rounded-xl ring-1 ring-amber-400/15">
                            <img
                              src={p.image || "/prize-placeholder.svg"}
                              alt={p.name}
                              className="w-full h-48 object-contain bg-white p-4 transition-transform duration-700 group-hover:scale-110"
                              onError={(e) => {
                                // Fallback to placeholder if image fails to load
                                e.currentTarget.src = "/prize-placeholder.svg";
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          </div>
                          <h3 className="font-display text-xl font-semibold text-white tracking-wide">
                            {p.name}
                          </h3>
                          <p className="text-amber-100/70 text-sm">
                            {p.description}
                          </p>
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
                customColor={customColor}
                onCustomColorChange={handleCustomColorChange}
              />
            </TabsContent>

            {/* --------------------- LUCKY DRAW --------------------- */}
            <TabsContent value="draw" className="space-y-6">
              {dealerData.length === 0 ? (
                <div className="welcome-stage">
                  <div className="welcome-stage-art" aria-hidden="true">
                    <div className="stage-orbit orbit-one" />
                    <div className="stage-orbit orbit-two" />
                    <span className="welcome-trophy">
                      <Trophy />
                    </span>
                    <span className="stage-spark spark-one">✦</span>
                    <span className="stage-spark spark-two">✦</span>
                    <span className="stage-spark spark-three">✧</span>
                  </div>
                  <div className="welcome-stage-copy">
                    <span className="eyebrow">The spotlight is waiting</span>
                    <h2>
                      Someone’s lucky moment
                      <br />
                      starts right here.
                    </h2>
                    <p>
                      Upload your participants, set the stage, and let the
                      celebration begin.
                    </p>
                    <Button
                      className="gold-button"
                      onClick={() => setActiveTab("upload")}
                    >
                      <Upload /> Upload participants <ArrowUpRight />
                    </Button>
                    <button
                      className="text-button"
                      onClick={() => setActiveTab("prizes")}
                    >
                      Explore the prize collection <ChevronRight />
                    </button>
                  </div>
                  <div className="welcome-stage-footer">
                    <span>
                      <span className="status-dot" /> Ready when you are
                    </span>
                    <span>
                      {prizeCategories.length} categories ·{" "}
                      {getProgress().total} chances to celebrate
                    </span>
                  </div>
                </div>
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
                  onViewResults={() => setActiveTab("results")}
                  stageTheme={stageTheme}
                  audioSettings={audioSettings}
                />
              )}
            </TabsContent>

            {/* --------------------- RESULTS TAB --------------------- */}
            <TabsContent value="results">
              <div className="space-y-6">
                <ExportResults
                  winners={winners}
                  prizeCategories={prizeCategories}
                  dealerData={dealerData}
                />
                <WinnersList
                  winners={winners}
                  prizeCategories={prizeCategories}
                />
              </div>
            </TabsContent>
          </main>
          <footer className="event-footer">
            <span>
              SULPHAMAX <span className="brand-dot">/</span> PARTNERS IN GROWTH
            </span>
            <span>Made for moments that matter.</span>
          </footer>
        </Tabs>
      </div>
    </div>
  );
}
