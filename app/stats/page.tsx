"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import CountUp from "react-countup";
import { useFlightData } from "../hooks/useFlightData";
import { FlightLogEx } from "../types";
import { getTravelClassPresentation } from "../lib/travelClass";

// Star Alliance airline IATA codes
const STAR_ALLIANCE_CODES = new Set([
  "UA", "SQ", "LH", "TG", "OZ", "BR", "TK", "AC", "LX", "OS", "NZ",
  "SN", "SA", "MS", "ET", "AI", "CM", "AV", "LO", "ZH", "A3", "TP", "EN",
]);

const ANA_TARGET_OPTIONS: Record<string, { label: string; pp: number }> = {
  bronze_ls: { label: "ブロンズ（LS）", pp: 15000 },
  bronze_std: { label: "ブロンズ（通常）", pp: 30000 },
  platinum_ls: { label: "プラチナ（LS）", pp: 30000 },
  platinum_std: { label: "プラチナ / SFC", pp: 50000 },
  diamond_ls_5m: { label: "ダイヤ（LS・500万）", pp: 50000 },
  diamond_ls_4m: { label: "ダイヤ（LS・400万）", pp: 80000 },
  diamond_std: { label: "ダイヤモンド", pp: 100000 },
};

type ViewMode = "monthly" | "yearly" | "all";

interface FilterState {
  carrier: "all" | "ana" | "star" | "partner";
  travelClass: "all" | "economy" | "premium-economy" | "business" | "first";
  mode: "all" | "domestic" | "international";
}

function classifyCarrier(carrier?: string): "ana" | "star" | "partner" {
  if (!carrier || carrier === "NH" || carrier === "ANA") return "ana";
  if (STAR_ALLIANCE_CODES.has(carrier.toUpperCase())) return "star";
  return "partner";
}

function AnimatedNumber({ value }: { value: number }) {
  const reduceMotion = useReducedMotion();
  return <CountUp end={value} duration={reduceMotion ? 0 : 0.65} separator="," preserveValue className="tabular-nums" />;
}

// Icons
function StatIcon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  const shared = {
    className,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    viewBox: "0 0 24 24",
    "aria-hidden": true as const,
  };

  switch (name) {
    case "database":
      return (
        <svg {...shared}>
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
      );
    case "wallet":
      return (
        <svg {...shared}>
          <rect x="3" y="5" width="18" height="15" rx="2.5" />
          <path d="M3 9h18M16 14h.01M7 5V3h10v2" />
        </svg>
      );
    case "trend":
      return (
        <svg {...shared}>
          <path d="M3 3v18h18" />
          <path d="m7 14 4-4 3 3 6-7" />
          <path d="M15 6h5v5" />
        </svg>
      );
    case "plane":
      return (
        <svg {...shared}>
          <path d="m2 16 8-2 3-10a2 2 0 0 1 2-1 1.5 1.5 0 0 1 .7 2.1L12 13l6 2 2.2-2.2a1 1 0 0 1 1.5 1.3L19 18l-8-1-4 3-1.5-.5 2-3.5L2 17z" />
        </svg>
      );
    case "chevron-left":
      return (
        <svg {...shared}>
          <path d="m15 18-6-6 6-6" />
        </svg>
      );
    case "chevron-right":
      return (
        <svg {...shared}>
          <path d="m9 18 6-6-6-6" />
        </svg>
      );
    case "filter":
      return (
        <svg {...shared}>
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...shared}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    default:
      return (
        <svg {...shared}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
}

export default function AnalyticsPage() {
  const { logs, settings, isLoaded, loadError, refreshLogs } = useFlightData();

  const currentCalendarYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentCalendarYear);
  const [viewMode, setViewMode] = useState<ViewMode>("monthly");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    carrier: "all",
    travelClass: "all",
    mode: "all",
  });

  // Hover states for chart tooltips
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(null);
  const [hoveredCostMonthIndex, setHoveredCostMonthIndex] = useState<number | null>(null);
  const [hoveredSpentMonthIndex, setHoveredSpentMonthIndex] = useState<number | null>(null);
  const [ppTrendMode, setPpTrendMode] = useState<"monthly" | "cumulative">("monthly");
  const [hoveredAirline, setHoveredAirline] = useState<string | null>(null);
  const [hoveredClass, setHoveredClass] = useState<string | null>(null);

  // Available recorded years
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(currentCalendarYear);
    logs.forEach((log) => {
      if (log.year) yearsSet.add(log.year);
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [logs, currentCalendarYear]);

  // Active filters count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.carrier !== "all") count++;
    if (filters.travelClass !== "all") count++;
    if (filters.mode !== "all") count++;
    return count;
  }, [filters]);

  // Filter application helper
  const applyFilters = useCallback(
    (flightLogs: FlightLogEx[]): FlightLogEx[] => {
      return flightLogs.filter((log) => {
        // Airline filter
        if (filters.carrier !== "all") {
          const cat = classifyCarrier(log.operatingCarrier);
          if (cat !== filters.carrier) return false;
        }
        // Travel class filter
        if (filters.travelClass !== "all") {
          const tc = log.travelClass || "economy";
          if (filters.travelClass === "economy" && tc !== "economy") return false;
          if (filters.travelClass === "premium-economy" && tc !== "premium-economy") return false;
          if (filters.travelClass === "business" && tc !== "business") return false;
          if (filters.travelClass === "first" && tc !== "first" && tc !== "premium-class") return false;
        }
        // Mode filter
        if (filters.mode !== "all") {
          if (log.flightMode && log.flightMode !== filters.mode) return false;
        }
        return true;
      });
    },
    [filters]
  );

  // Current scope logs
  const currentScopedLogs = useMemo((): FlightLogEx[] => {
    let baseLogs: FlightLogEx[] = [];
    if (viewMode === "monthly") {
      baseLogs = logs.filter((l) => l.year === selectedYear);
    } else {
      baseLogs = logs;
    }
    return applyFilters(baseLogs);
  }, [logs, selectedYear, viewMode, applyFilters]);

  // Previous scope logs (for comparison)
  const previousScopedLogs = useMemo((): FlightLogEx[] => {
    if (viewMode !== "monthly") return [];
    const prevYear = selectedYear - 1;
    const baseLogs = logs.filter((l) => l.year === prevYear);
    return applyFilters(baseLogs);
  }, [logs, selectedYear, viewMode, applyFilters]);

  // KPI calculations
  const kpiData = useMemo(() => {
    const totalPP = currentScopedLogs.reduce((sum, l) => sum + (l.pp || 0), 0);
    const totalSpent = currentScopedLogs.reduce((sum, l) => sum + (l.price || 0), 0);
    const avgPPPrice = totalPP > 0 ? totalSpent / totalPP : 0;
    const flightCount = currentScopedLogs.length;

    const prevPP = previousScopedLogs.reduce((sum, l) => sum + (l.pp || 0), 0);
    const prevSpent = previousScopedLogs.reduce((sum, l) => sum + (l.price || 0), 0);
    const prevAvgPPPrice = prevPP > 0 ? prevSpent / prevPP : 0;
    const prevCount = previousScopedLogs.length;

    const hasPrev = previousScopedLogs.length > 0;

    const ppDiff = totalPP - prevPP;
    const ppPercent = prevPP > 0 ? (ppDiff / prevPP) * 100 : null;

    const spentDiff = totalSpent - prevSpent;
    const spentPercent = prevSpent > 0 ? (spentDiff / prevSpent) * 100 : null;

    const avgDiff = avgPPPrice - prevAvgPPPrice;
    const avgPercent = prevAvgPPPrice > 0 ? (avgDiff / prevAvgPPPrice) * 100 : null;

    const countDiff = flightCount - prevCount;
    const countPercent = prevCount > 0 ? (countDiff / prevCount) * 100 : null;

    return {
      totalPP,
      totalSpent,
      avgPPPrice,
      flightCount,
      hasPrev,
      ppDiff,
      ppPercent,
      spentDiff,
      spentPercent,
      avgDiff,
      avgPercent,
      countDiff,
      countPercent,
    };
  }, [currentScopedLogs, previousScopedLogs]);

  // Monthly breakdown for temporal charts
  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    let runningPP = 0;
    return months.map((m) => {
      const monthLogs = currentScopedLogs.filter((l) => {
        if (!l.date) return false;
        const parts = l.date.split("-");
        const month = parseInt(parts[1], 10);
        return month === m;
      });

      const pp = monthLogs.reduce((sum, l) => sum + (l.pp || 0), 0);
      const spent = monthLogs.reduce((sum, l) => sum + (l.price || 0), 0);
      const avgPrice = pp > 0 ? spent / pp : 0;
      runningPP += pp;

      return {
        month: m,
        label: `${m}月`,
        pp,
        cumulativePP: runningPP,
        spent,
        spentMan: spent / 10000,
        avgPrice,
        count: monthLogs.length,
      };
    });
  }, [currentScopedLogs]);

  // Airline breakdown for donut chart
  const airlineBreakdown = useMemo(() => {
    let anaPP = 0;
    let starPP = 0;
    let partnerPP = 0;
    const otherPP = 0;

    currentScopedLogs.forEach((l) => {
      const cat = classifyCarrier(l.operatingCarrier);
      if (cat === "ana") anaPP += l.pp || 0;
      else if (cat === "star") starPP += l.pp || 0;
      else partnerPP += l.pp || 0;
    });

    const total = anaPP + starPP + partnerPP + otherPP;

    return [
      { id: "ana", label: "ANA", pp: anaPP, color: "#2878F0", percentage: total > 0 ? (anaPP / total) * 100 : 0 },
      { id: "star", label: "スターアライアンス", pp: starPP, color: "#15366C", percentage: total > 0 ? (starPP / total) * 100 : 0 },
      { id: "partner", label: "提携航空会社", pp: partnerPP, color: "#8AB4FF", percentage: total > 0 ? (partnerPP / total) * 100 : 0 },
      { id: "other", label: "その他", pp: otherPP, color: "#CBD5E1", percentage: total > 0 ? (otherPP / total) * 100 : 0 },
    ].filter((item) => total === 0 || item.pp > 0 || item.id === "ana");
  }, [currentScopedLogs]);

  // Top 5 Routes ranking
  const topRoutes = useMemo(() => {
    const routeMap = new Map<string, { origin: string; destination: string; pp: number; count: number; spent: number }>();
    currentScopedLogs.forEach((l) => {
      const key = `${l.origin} - ${l.destination}`;
      const existing = routeMap.get(key) || { origin: l.origin, destination: l.destination, pp: 0, count: 0, spent: 0 };
      existing.pp += l.pp || 0;
      existing.spent += l.price || 0;
      existing.count += 1;
      routeMap.set(key, existing);
    });

    return Array.from(routeMap.values())
      .sort((a, b) => b.pp - a.pp)
      .slice(0, 5);
  }, [currentScopedLogs]);

  // Cabin Class breakdown
  const classBreakdown = useMemo(() => {
    let eco = 0;
    let pye = 0;
    let biz = 0;
    let fst = 0;

    currentScopedLogs.forEach((l) => {
      const tc = l.travelClass || "economy";
      if (tc === "economy") eco++;
      else if (tc === "premium-economy") pye++;
      else if (tc === "business") biz++;
      else fst++;
    });

    const total = eco + pye + biz + fst;

    return [
      { id: "economy", label: "エコノミー", count: eco, color: "#2878F0", percentage: total > 0 ? (eco / total) * 100 : 0 },
      { id: "premium-economy", label: "プレミアムエコノミー", count: pye, color: "#0D9488", percentage: total > 0 ? (pye / total) * 100 : 0 },
      { id: "business", label: "ビジネス", count: biz, color: "#7C3AED", percentage: total > 0 ? (biz / total) * 100 : 0 },
      { id: "first", label: "ファースト", count: fst, color: "#D97706", percentage: total > 0 ? (fst / total) * 100 : 0 },
    ].filter((item) => total === 0 || item.count > 0 || item.id === "economy");
  }, [currentScopedLogs]);

  // Recent 5 flights
  const recentFlights = useMemo(() => {
    return [...currentScopedLogs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  }, [currentScopedLogs]);

  // Goal Progress
  const targetType = settings.anaTargetType || "platinum_std";
  const targetPP = ANA_TARGET_OPTIONS[targetType]?.pp || 50000;
  const progressPercent = Math.min((kpiData.totalPP / targetPP) * 100, 100);
  const remainingPP = Math.max(targetPP - kpiData.totalPP, 0);

  // Pace estimation
  const pacePrediction = useMemo(() => {
    if (kpiData.totalPP >= targetPP) return "目標達成！おめでとうございます";
    if (kpiData.totalPP === 0) return "フライト登録後に予測が表示されます";

    const currentMonth = new Date().getMonth() + 1;
    const monthlyRate = kpiData.totalPP / Math.max(1, currentMonth);
    const monthsRemaining = Math.ceil(remainingPP / monthlyRate);

    const projectedDate = new Date();
    projectedDate.setMonth(projectedDate.getMonth() + monthsRemaining);
    return `${projectedDate.getFullYear()}年 ${projectedDate.getMonth() + 1}月頃`;
  }, [kpiData.totalPP, targetPP, remainingPP]);

  // Year Navigation Handlers
  const handlePrevYear = () => {
    setSelectedYear((prev) => prev - 1);
  };

  const handleNextYear = () => {
    setSelectedYear((prev) => prev + 1);
  };

  if (!isLoaded) {
    return (
      <main className="mx-auto flex min-h-[65dvh] max-w-md items-center justify-center px-6 text-center" aria-live="polite">
        <div>
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <StatIcon name="trend" className="h-6 w-6" />
          </span>
          <p className="mt-4 text-sm font-semibold text-slate-700">統計データを集計しています</p>
          <p className="mt-1 text-xs text-slate-400">少々お待ちください</p>
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="mx-auto flex min-h-[65dvh] max-w-xl items-center justify-center px-5 py-10">
        <section role="alert" className="w-full rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <p className="text-sm font-bold text-slate-900">統計データを読み込めませんでした</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">保存されたデータの集計に失敗しました。再試行してください。</p>
          <button
            type="button"
            onClick={() => void refreshLogs()}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-bold text-white transition-colors hover:bg-blue-700 focus-visible:outline-offset-2"
          >
            もう一度読み込む
          </button>
        </section>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] pb-24 font-sans text-[#12213A] antialiased">
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7">
        
        {/* Layer 1: Header & Period / Filter Controls */}
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#0B1D40] sm:text-3xl">統計・分析</h1>
            <p className="mt-1 text-xs font-medium text-[#738198] sm:text-sm">
              これまでのフライトを多角的に分析し、SFC達成への進捗を可視化します。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Year Selector */}
            <div className="inline-flex items-center rounded-xl border border-[#E2E8F0] bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={handlePrevYear}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 active:scale-95"
                title="前年へ"
                aria-label="前年へ移動"
              >
                <StatIcon name="chevron-left" className="h-4 w-4" />
              </button>
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="cursor-pointer appearance-none bg-transparent py-1 pl-2 pr-6 text-xs font-bold text-[#12213A] outline-none"
                  aria-label="対象年を選択"
                >
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {viewMode === "monthly" ? `${yr}年1月 - 12月` : `${yr}年`}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-1 flex items-center text-slate-400">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <button
                type="button"
                onClick={handleNextYear}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 active:scale-95"
                title="翌年へ"
                aria-label="翌年へ移動"
              >
                <StatIcon name="chevron-right" className="h-4 w-4" />
              </button>
            </div>

            {/* View Mode Switcher Pills */}
            <div className="inline-flex rounded-xl border border-[#E2E8F0] bg-white p-1 shadow-sm" role="tablist" aria-label="集計期間単位">
              {(["monthly", "yearly", "all"] as ViewMode[]).map((mode) => {
                const label = mode === "monthly" ? "月別" : mode === "yearly" ? "年別" : "全期間";
                const isActive = viewMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setViewMode(mode)}
                    className={`relative rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      isActive ? "bg-[#2878F0] text-white shadow-sm" : "text-[#738198] hover:text-[#12213A]"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold shadow-sm transition-all active:scale-95 ${
                activeFilterCount > 0
                  ? "border-[#2878F0] bg-blue-50 text-[#2878F0]"
                  : "border-[#E2E8F0] bg-white text-slate-700 hover:bg-slate-50"
              }`}
              aria-label="フィルターを開く"
              aria-expanded={isFilterOpen}
            >
              <StatIcon name="filter" className="h-3.5 w-3.5" />
              <span>フィルター</span>
              {activeFilterCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#2878F0] text-[10px] text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Filter Drawer / Panel */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-6 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm"
              aria-label="データフィルター"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">絞り込み条件</h3>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilters({ carrier: "all", travelClass: "all", mode: "all" })}
                    className="text-xs font-bold text-[#2878F0] hover:underline"
                  >
                    条件をリセット
                  </button>
                )}
              </div>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">運航区分</label>
                  <select
                    value={filters.carrier}
                    onChange={(e) => setFilters((prev) => ({ ...prev, carrier: e.target.value as FilterState["carrier"] }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-400 focus:bg-white"
                  >
                    <option value="all">すべての運航会社</option>
                    <option value="ana">ANAグループ運航便</option>
                    <option value="star">スターアライアンス加盟各社</option>
                    <option value="partner">その他提携航空会社</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">搭乗クラス</label>
                  <select
                    value={filters.travelClass}
                    onChange={(e) => setFilters((prev) => ({ ...prev, travelClass: e.target.value as FilterState["travelClass"] }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-400 focus:bg-white"
                  >
                    <option value="all">すべてのクラス</option>
                    <option value="economy">エコノミークラス</option>
                    <option value="premium-economy">プレミアムエコノミー</option>
                    <option value="business">ビジネスクラス</option>
                    <option value="first">ファースト / プレミアムクラス</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">路線区分</label>
                  <select
                    value={filters.mode}
                    onChange={(e) => setFilters((prev) => ({ ...prev, mode: e.target.value as FilterState["mode"] }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-400 focus:bg-white"
                  >
                    <option value="all">国内線 / 国際線 全て</option>
                    <option value="domestic">国内線のみ</option>
                    <option value="international">国際線のみ</option>
                  </select>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Layer 2: KPI Summary Cards */}
        <section aria-label="KPIサマリー" className="mb-6">
          <div className="grid grid-cols-2 gap-3 min-[720px]:grid-cols-4 sm:gap-4">
            {/* KPI 1: Total PP */}
            <article className="flex flex-col justify-between rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_2px_8px_rgba(15,35,65,0.025)] sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#2878F0]">
                  <StatIcon name="database" />
                </span>
                {kpiData.hasPrev && kpiData.ppPercent !== null && (
                  <span
                    className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ${
                      kpiData.ppDiff >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {kpiData.ppDiff >= 0 ? "↑ +" : "↓ "}
                    {kpiData.ppPercent.toFixed(0)}%
                  </span>
                )}
              </div>
              <div className="mt-3">
                <p className="text-[11px] font-bold text-[#738198]">総獲得プレミアムポイント</p>
                <p className="mt-1 flex items-baseline gap-1 text-[clamp(1.35rem,2.8vw,1.9rem)] font-black tracking-tight text-[#0B1D40]">
                  <AnimatedNumber value={kpiData.totalPP} />
                  <span className="text-xs font-bold text-slate-500">PP</span>
                </p>
                <p className="mt-1 text-[10px] text-slate-400">
                  {kpiData.hasPrev ? (
                    <>前年比 {kpiData.ppDiff >= 0 ? `+${kpiData.ppDiff.toLocaleString()}` : kpiData.ppDiff.toLocaleString()} PP</>
                  ) : (
                    "初年度または比較データなし"
                  )}
                </p>
              </div>
            </article>

            {/* KPI 2: Total Spent */}
            <article className="flex flex-col justify-between rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_2px_8px_rgba(15,35,65,0.025)] sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <StatIcon name="wallet" />
                </span>
                {kpiData.hasPrev && kpiData.spentPercent !== null && (
                  <span
                    className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ${
                      kpiData.spentDiff >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {kpiData.spentDiff >= 0 ? "↑ +" : "↓ "}
                    {kpiData.spentPercent.toFixed(0)}%
                  </span>
                )}
              </div>
              <div className="mt-3">
                <p className="text-[11px] font-bold text-[#738198]">総費用</p>
                <p className="mt-1 text-[clamp(1.35rem,2.8vw,1.9rem)] font-black tracking-tight text-[#0B1D40] tabular-nums">
                  <span className="mr-0.5 text-sm font-bold text-slate-400">¥</span>
                  <AnimatedNumber value={kpiData.totalSpent} />
                </p>
                <p className="mt-1 text-[10px] text-slate-400">
                  {kpiData.hasPrev ? (
                    <>前年比 {kpiData.spentDiff >= 0 ? `+¥${kpiData.spentDiff.toLocaleString()}` : `-¥${Math.abs(kpiData.spentDiff).toLocaleString()}`}</>
                  ) : (
                    "航空券購入費用の総計"
                  )}
                </p>
              </div>
            </article>

            {/* KPI 3: Average PP Unit Cost */}
            <article className="flex flex-col justify-between rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_2px_8px_rgba(15,35,65,0.025)] sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-[#2878F0]">
                  <StatIcon name="trend" />
                </span>
                {kpiData.hasPrev && kpiData.avgPercent !== null && (
                  <span
                    className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ${
                      kpiData.avgDiff <= 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {kpiData.avgDiff <= 0 ? "↓ " : "↑ +"}
                    {Math.abs(kpiData.avgPercent).toFixed(0)}%
                  </span>
                )}
              </div>
              <div className="mt-3">
                <p className="text-[11px] font-bold text-[#738198]">PP単価（平均）</p>
                <p className="mt-1 flex items-baseline gap-1 text-[clamp(1.35rem,2.8vw,1.9rem)] font-black tracking-tight text-[#0B1D40]">
                  <span className="text-sm font-bold text-slate-400">¥</span>
                  <span className="tabular-nums">{kpiData.avgPPPrice.toFixed(2)}</span>
                  <span className="text-xs font-bold text-slate-500">/PP</span>
                </p>
                <p className="mt-1 text-[10px] text-slate-400">
                  {kpiData.hasPrev ? (
                    <>前年比 {kpiData.avgDiff >= 0 ? `+${kpiData.avgDiff.toFixed(2)}` : kpiData.avgDiff.toFixed(2)} 円</>
                  ) : (
                    "総費用 ÷ 総PP"
                  )}
                </p>
              </div>
            </article>

            {/* KPI 4: Flight Count */}
            <article className="flex flex-col justify-between rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_2px_8px_rgba(15,35,65,0.025)] sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#15366C]">
                  <StatIcon name="plane" />
                </span>
                {kpiData.hasPrev && kpiData.countPercent !== null && (
                  <span
                    className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ${
                      kpiData.countDiff >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {kpiData.countDiff >= 0 ? "↑ +" : "↓ "}
                    {kpiData.countPercent.toFixed(0)}%
                  </span>
                )}
              </div>
              <div className="mt-3">
                <p className="text-[11px] font-bold text-[#738198]">搭乗回数</p>
                <p className="mt-1 flex items-baseline gap-1 text-[clamp(1.35rem,2.8vw,1.9rem)] font-black tracking-tight text-[#0B1D40]">
                  <AnimatedNumber value={kpiData.flightCount} />
                  <span className="text-xs font-bold text-slate-500">回</span>
                </p>
                <p className="mt-1 text-[10px] text-slate-400">
                  {kpiData.hasPrev ? (
                    <>前年比 {kpiData.countDiff >= 0 ? `+${kpiData.countDiff}` : kpiData.countDiff} フライト</>
                  ) : (
                    "対象期間内の登録搭乗数"
                  )}
                </p>
              </div>
            </article>
          </div>
        </section>

        {/* Row 2: Full-width PP獲得推移 Area Chart */}
        <section className="mb-6 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_2px_8px_rgba(15,35,65,0.025)]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-[#0B1D40]">PP獲得推移</h2>
              <p className="text-xs text-[#738198]">
                {ppTrendMode === "monthly" ? "月別の獲得プレミアムポイント" : "年間の累計獲得プレミアムポイント"}
              </p>
            </div>

            {/* Segmented Toggle: 月別 / 累計 */}
            <div className="inline-flex rounded-xl border border-[#E2E8F0] bg-slate-50 p-1 shadow-sm" role="tablist" aria-label="集計表示形式">
              <button
                type="button"
                role="tab"
                aria-selected={ppTrendMode === "monthly"}
                onClick={() => setPpTrendMode("monthly")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  ppTrendMode === "monthly"
                    ? "bg-[#2878F0] text-white shadow-sm"
                    : "text-[#738198] hover:text-[#12213A]"
                }`}
              >
                月別
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={ppTrendMode === "cumulative"}
                onClick={() => setPpTrendMode("cumulative")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  ppTrendMode === "cumulative"
                    ? "bg-[#2878F0] text-white shadow-sm"
                    : "text-[#738198] hover:text-[#12213A]"
                }`}
              >
                累計
              </button>
            </div>
          </div>

          <div className="relative mt-2">
            <PPAreaChart
              data={monthlyData}
              mode={ppTrendMode}
              targetPP={targetPP}
              hoveredIndex={hoveredMonthIndex}
              setHoveredIndex={setHoveredMonthIndex}
            />
          </div>
        </section>

        {/* Row 3: 2-Column Charts Grid (月別の費用 Bar Chart & PP単価の推移 Line Chart) */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          
          {/* Card 1: 月別の費用 */}
          <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_2px_8px_rgba(15,35,65,0.025)]">
            <div className="mb-3 flex items-baseline justify-between">
              <div>
                <h2 className="text-base font-black text-[#0B1D40]">月別の費用</h2>
                <p className="text-xs text-[#738198]">フライト費用の月別推移</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-[#0B1D40] tabular-nums">
                  {(kpiData.totalSpent / 10000).toFixed(1)}
                </span>
                <span className="ml-0.5 text-xs font-bold text-slate-500">万円</span>
              </div>
            </div>

            <div className="mt-2">
              <MonthlySpentBarChart
                data={monthlyData}
                hoveredIndex={hoveredSpentMonthIndex}
                setHoveredIndex={setHoveredSpentMonthIndex}
              />
            </div>
          </section>

          {/* Card 2: PP単価の推移 */}
          <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_2px_8px_rgba(15,35,65,0.025)]">
            <div className="mb-3 flex items-baseline justify-between">
              <div>
                <h2 className="text-base font-black text-[#0B1D40]">PP単価の推移</h2>
                <p className="text-xs text-[#738198]">コストパフォーマンス推移</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-[#0B1D40] tabular-nums">
                  ¥{kpiData.avgPPPrice.toFixed(2)}
                </span>
                <span className="ml-0.5 text-xs font-bold text-slate-500">/PP</span>
              </div>
            </div>

            <div className="mt-2">
              <MonthlyCostTrendChart
                data={monthlyData}
                hoveredIndex={hoveredCostMonthIndex}
                setHoveredIndex={setHoveredCostMonthIndex}
              />
            </div>
          </section>
        </div>

        {/* Row 4: 3-Column Distribution Grid (路線別ランキング, 航空会社別, クラス別) */}
        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          
          {/* Card 1: 路線別 獲得PPランキング */}
          <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_2px_8px_rgba(15,35,65,0.025)]">
            <h2 className="text-base font-black text-[#0B1D40]">路線別 獲得PPランキング</h2>
            <p className="text-xs text-[#738198]">獲得ポイントが多い主要路線</p>

            <div className="mt-5 space-y-3.5">
              {topRoutes.length > 0 ? (
                topRoutes.map((route, index) => {
                  const maxPP = topRoutes[0]?.pp || 1;
                  const ratio = Math.max(15, (route.pp / maxPP) * 100);
                  return (
                    <div key={`${route.origin}-${route.destination}`} className="group">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 text-[10px] text-slate-600">
                            {index + 1}
                          </span>
                          <span className="text-slate-800">{route.origin} - {route.destination}</span>
                        </span>
                        <span className="tabular-nums text-[#0B1D40]">{route.pp.toLocaleString()} PP</span>
                      </div>
                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${ratio}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className="h-full rounded-full bg-gradient-to-r from-blue-400 to-[#2878F0]"
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  フライト記録がありません
                </div>
              )}
            </div>
          </section>

          {/* Card 2: 航空会社別 獲得PPの内訳 (Donut Chart) */}
          <section className="flex flex-col justify-between rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_2px_8px_rgba(15,35,65,0.025)]">
            <div>
              <h2 className="text-base font-black text-[#0B1D40]">航空会社別 獲得PPの内訳</h2>
              <p className="text-xs text-[#738198]">ANAグループ便と提携便のシェア</p>
            </div>

            <div className="my-auto py-3">
              <DonutChart
                items={airlineBreakdown.map((item) => ({
                  id: item.id,
                  label: item.label,
                  value: item.pp,
                  color: item.color,
                  percentage: item.percentage,
                }))}
                centerLabel="合計"
                centerValue={`${kpiData.totalPP.toLocaleString()}`}
                centerSub="PP"
                hoveredId={hoveredAirline}
                setHoveredId={setHoveredAirline}
              />
            </div>

            {/* Airline Legend Table */}
            <div className="mt-2 space-y-1.5 border-t border-slate-100 pt-3">
              {airlineBreakdown.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between text-xs transition-opacity ${
                    hoveredAirline && hoveredAirline !== item.id ? "opacity-40" : "opacity-100"
                  }`}
                  onMouseEnter={() => setHoveredAirline(item.id)}
                  onMouseLeave={() => setHoveredAirline(null)}
                >
                  <span className="flex items-center gap-1.5 font-bold text-slate-700">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.label}
                  </span>
                  <span className="tabular-nums font-semibold text-slate-900">
                    {item.pp.toLocaleString()} PP
                    <span className="ml-1 text-[11px] font-normal text-slate-400">
                      ({item.percentage.toFixed(1)}%)
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Card 3: クラス別 搭乗回数 (Donut Chart) */}
          <section className="flex flex-col justify-between rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_2px_8px_rgba(15,35,65,0.025)]">
            <div>
              <h2 className="text-base font-black text-[#0B1D40]">クラス別 搭乗回数</h2>
              <p className="text-xs text-[#738198]">予約キャビンクラスの内訳</p>
            </div>

            <div className="my-auto py-2">
              <DonutChart
                items={classBreakdown.map((item) => ({
                  id: item.id,
                  label: item.label,
                  value: item.count,
                  color: item.color,
                  percentage: item.percentage,
                }))}
                centerLabel="合計"
                centerValue={`${kpiData.flightCount}`}
                centerSub="回"
                hoveredId={hoveredClass}
                setHoveredId={setHoveredClass}
              />
            </div>

            {/* Class Legend Table */}
            <div className="mt-2 space-y-1.5 border-t border-slate-100 pt-3">
              {classBreakdown.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between text-xs transition-opacity ${
                    hoveredClass && hoveredClass !== item.id ? "opacity-40" : "opacity-100"
                  }`}
                  onMouseEnter={() => setHoveredClass(item.id)}
                  onMouseLeave={() => setHoveredClass(null)}
                >
                  <span className="flex items-center gap-1.5 font-bold text-slate-700">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.label}
                  </span>
                  <span className="tabular-nums font-semibold text-slate-900">
                    {item.count} 回
                    <span className="ml-1 text-[11px] font-normal text-slate-400">
                      ({item.percentage.toFixed(1)}%)
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Row 4: Recent Flights Table & Goal Progress */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* Table: 最近のフライト実績 */}
          <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_2px_8px_rgba(15,35,65,0.025)] lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-[#0B1D40]">最近のフライト実績</h2>
                <p className="text-xs text-[#738198]">直近の搭乗記録と獲得実績</p>
              </div>
              <Link
                href="/logs"
                className="text-xs font-bold text-[#2878F0] hover:underline"
              >
                すべてのフライトを見る →
              </Link>
            </div>

            {recentFlights.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400">
                      <th className="pb-2.5 font-bold">搭乗日</th>
                      <th className="pb-2.5 font-bold">出発地 → 到着地</th>
                      <th className="pb-2.5 font-bold">航空会社</th>
                      <th className="pb-2.5 font-bold">クラス</th>
                      <th className="pb-2.5 text-right font-bold">獲得PP</th>
                      <th className="pb-2.5 text-right font-bold">費用</th>
                      <th className="pb-2.5 text-right font-bold">PP単価</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {recentFlights.map((flight) => {
                      const travelClassPres = getTravelClassPresentation(flight.travelClass);
                      const unitCost = flight.pp > 0 ? (flight.price / flight.pp).toFixed(2) : "0.00";
                      const carrierName = flight.operatingCarrier || "ANA";

                      return (
                        <tr key={flight.id} className="transition-colors hover:bg-slate-50/70">
                          <td className="py-3 font-semibold text-slate-500 tabular-nums">{flight.date}</td>
                          <td className="py-3 font-bold text-[#0B1D40]">
                            {flight.origin} <span className="text-[#2878F0]">→</span> {flight.destination}
                          </td>
                          <td className="py-3">
                            <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                              {carrierName}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${travelClassPres.badge}`}>
                              {travelClassPres.label}
                            </span>
                          </td>
                          <td className="py-3 text-right font-bold text-[#0B1D40] tabular-nums">
                            {flight.pp.toLocaleString()} PP
                          </td>
                          <td className="py-3 text-right font-semibold text-slate-700 tabular-nums">
                            ¥{flight.price.toLocaleString()}
                          </td>
                          <td className="py-3 text-right font-bold text-blue-600 tabular-nums">
                            ¥{unitCost}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-10 text-center">
                <p className="text-xs text-slate-400">この期間のフライト実績はありません</p>
                <Link
                  href="/calc"
                  className="mt-3 inline-flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700"
                >
                  フライトを登録
                </Link>
              </div>
            )}
          </section>

          {/* Card: 目標達成の進捗 */}
          <section className="flex flex-col justify-between rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_2px_8px_rgba(15,35,65,0.025)]">
            <div>
              <h2 className="text-base font-black text-[#0B1D40]">目標達成の進捗</h2>
              <p className="text-xs text-[#738198]">
                SFC達成までの進捗状況（年間{targetPP.toLocaleString()}PP）
              </p>

              <div className="mt-5">
                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline gap-1 text-2xl font-black text-[#0B1D40] tabular-nums">
                    <span>{kpiData.totalPP.toLocaleString()}</span>
                    <span className="text-sm font-semibold text-slate-400">/ {targetPP.toLocaleString()} PP</span>
                  </div>
                  <span className="text-base font-black text-[#2878F0] tabular-nums">
                    {progressPercent.toFixed(1)}%
                  </span>
                </div>

                <div className="mt-2.5 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-[#8AB4FF] to-[#2878F0]"
                  />
                </div>

                <p className="mt-2 text-right text-xs font-bold text-slate-500 tabular-nums">
                  残り {remainingPP.toLocaleString()} PP
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/50 p-3.5">
              <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                <StatIcon name="calendar" className="h-3.5 w-3.5 text-[#2878F0]" />
                現在のペースでの達成予測
              </p>
              <p className="mt-1 text-base font-black text-[#0B1D40]">{pacePrediction}</p>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Interactive SVG PP Area Chart (Monthly / Cumulative)
// -------------------------------------------------------------
interface MonthlyDataPoint {
  month: number;
  label: string;
  pp: number;
  cumulativePP: number;
  spent: number;
  spentMan: number;
  avgPrice: number;
  count: number;
}

function PPAreaChart({
  data,
  mode,
  targetPP,
  hoveredIndex,
  setHoveredIndex,
}: {
  data: MonthlyDataPoint[];
  mode: "monthly" | "cumulative";
  targetPP: number;
  hoveredIndex: number | null;
  setHoveredIndex: (idx: number | null) => void;
}) {
  const values = data.map((d) => (mode === "cumulative" ? d.cumulativePP : d.pp));
  const rawMax = Math.max(1, ...values);
  
  let roundedMax: number;
  if (mode === "cumulative") {
    const ceiling = Math.max(targetPP, rawMax);
    roundedMax = Math.ceil(ceiling / 10000) * 10000;
  } else {
    roundedMax = Math.max(6000, Math.ceil(rawMax / 2000) * 2000);
  }

  const chartHeight = 220;
  const chartWidth = 600;
  const paddingLeft = 45;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 30;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;
  const stepX = innerWidth / data.length;

  const getY = (val: number) => {
    return paddingTop + innerHeight - (val / roundedMax) * innerHeight;
  };

  const points = data.map((d, i) => {
    const val = mode === "cumulative" ? d.cumulativePP : d.pp;
    const x = paddingLeft + i * stepX + stepX / 2;
    const y = getY(val);
    return { x, y, val, d, i };
  });

  const linePath = points.length > 0 ? `M ${points.map((p) => `${p.x},${p.y}`).join(" L ")}` : "";
  const areaPath = points.length > 0
    ? `M ${points[0].x},${paddingTop + innerHeight} L ${points.map((p) => `${p.x},${p.y}`).join(" L ")} L ${points[points.length - 1].x},${paddingTop + innerHeight} Z`
    : "";

  const activePoint = hoveredIndex !== null ? points[hoveredIndex] : null;
  const targetY = mode === "cumulative" && targetPP <= roundedMax ? getY(targetPP) : null;

  return (
    <div className="w-full select-none">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full h-auto overflow-visible font-sans"
        aria-label="PP獲得推移グラフ"
      >
        <defs>
          <linearGradient id="ppAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2878F0" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#2878F0" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Y Axis Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = paddingTop + innerHeight * (1 - ratio);
          const ppValue = Math.round(roundedMax * ratio);

          return (
            <g key={ratio}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={chartWidth - paddingRight}
                y2={y}
                stroke="#E2E8F0"
                strokeWidth={1}
                strokeDasharray={ratio > 0 ? "3 3" : undefined}
              />
              <text
                x={paddingLeft - 8}
                y={y + 3.5}
                textAnchor="end"
                className="fill-slate-400 text-[9px] tabular-nums font-semibold"
              >
                {ppValue.toLocaleString()}
              </text>
            </g>
          );
        })}

        {/* Target PP Line in cumulative mode */}
        {targetY !== null && (
          <g>
            <line
              x1={paddingLeft}
              y1={targetY}
              x2={chartWidth - paddingRight}
              y2={targetY}
              stroke="#F59E0B"
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
            <text
              x={chartWidth - paddingRight}
              y={targetY - 5}
              textAnchor="end"
              className="fill-amber-600 text-[8.5px] font-bold"
            >
              目標 {targetPP.toLocaleString()} PP
            </text>
          </g>
        )}

        {/* Axis Title */}
        <text x={paddingLeft - 8} y={paddingTop - 10} textAnchor="end" className="fill-slate-500 text-[8.5px] font-bold">
          PP
        </text>

        {/* Area Gradient Fill */}
        {areaPath && <path d={areaPath} fill="url(#ppAreaGradient)" />}

        {/* Line */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke="#2878F0"
            strokeWidth={2.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Points & Hit Areas */}
        {points.map((p) => {
          const isHovered = hoveredIndex === p.i;
          return (
            <g key={`pp-pt-${p.d.month}`}>
              <circle
                cx={p.x}
                cy={p.y}
                r={isHovered ? 5.5 : 3.5}
                fill={isHovered ? "#2878F0" : "#FFFFFF"}
                stroke="#2878F0"
                strokeWidth={isHovered ? 2.5 : 2}
                className="transition-all duration-150"
              />

              {/* X Axis Label */}
              <text
                x={p.x}
                y={chartHeight - paddingBottom + 16}
                textAnchor="middle"
                className={`text-[9.5px] font-bold transition-colors ${
                  isHovered ? "fill-[#2878F0] font-black" : "fill-slate-400"
                }`}
              >
                {p.d.label}
              </text>

              {/* Hit Area */}
              <rect
                x={paddingLeft + p.i * stepX}
                y={paddingTop}
                width={stepX}
                height={innerHeight + paddingBottom}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(p.i)}
                onMouseLeave={() => setHoveredIndex(null)}
                onTouchStart={() => setHoveredIndex(p.i)}
              />
            </g>
          );
        })}
      </svg>

      {/* Floating Tooltip */}
      {activePoint && (
        <div
          className="pointer-events-none mt-2 rounded-xl bg-[#0B1D40] p-2.5 text-white shadow-xl transition-all"
          style={{ maxWidth: "240px", margin: "0 auto" }}
        >
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-blue-200">{activePoint.d.month}月 {mode === "cumulative" ? "累計" : "実績"}</span>
            <span className="text-blue-300 tabular-nums">{activePoint.d.count} フライト</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs font-black">
            <span className="text-slate-300">{mode === "cumulative" ? "累計獲得PP:" : "獲得PP:"}</span>
            <span className="tabular-nums text-white text-sm">
              {activePoint.val.toLocaleString()} PP
            </span>
          </div>
          {mode === "cumulative" && targetPP > 0 && (
            <div className="mt-1 border-t border-white/10 pt-1 flex items-center justify-between text-[10px] text-slate-300 font-bold">
              <span>進捗率:</span>
              <span className="text-amber-300 tabular-nums">
                {((activePoint.val / targetPP) * 100).toFixed(1)}%
              </span>
            </div>
          )}
          {activePoint.d.spent > 0 && (
            <div className="mt-1 border-t border-white/10 pt-1 flex items-center justify-between text-[10px] text-slate-300">
              <span>月間支出:</span>
              <span className="font-semibold tabular-nums">¥{activePoint.d.spent.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Interactive SVG Monthly Spent Bar Chart
// -------------------------------------------------------------
function MonthlySpentBarChart({
  data,
  hoveredIndex,
  setHoveredIndex,
}: {
  data: MonthlyDataPoint[];
  hoveredIndex: number | null;
  setHoveredIndex: (idx: number | null) => void;
}) {
  const maxSpentMan = Math.max(30, ...data.map((d) => d.spentMan));
  const roundedMaxSpentMan = Math.ceil(maxSpentMan / 10) * 10;

  const chartHeight = 180;
  const chartWidth = 320;
  const paddingLeft = 35;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 30;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;
  const stepX = innerWidth / data.length;

  const activePoint = hoveredIndex !== null ? data[hoveredIndex] : null;

  return (
    <div className="w-full select-none">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full h-auto overflow-visible font-sans"
        aria-label="月別費用グラフ"
      >
        {/* Y Axis Grid */}
        {[0, 0.33, 0.66, 1].map((ratio) => {
          const y = paddingTop + innerHeight * (1 - ratio);
          const val = Math.round(roundedMaxSpentMan * ratio);

          return (
            <g key={ratio}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={chartWidth - paddingRight}
                y2={y}
                stroke="#E2E8F0"
                strokeWidth={1}
                strokeDasharray={ratio > 0 ? "3 3" : undefined}
              />
              <text
                x={paddingLeft - 6}
                y={y + 3.5}
                textAnchor="end"
                className="fill-slate-400 text-[8px] tabular-nums font-semibold"
              >
                {val}
              </text>
            </g>
          );
        })}

        <text x={paddingLeft - 8} y={paddingTop - 8} textAnchor="end" className="fill-slate-500 text-[8px] font-bold">
          万円
        </text>

        {/* Bars */}
        {data.map((d, i) => {
          const barWidth = Math.min(14, stepX * 0.55);
          const x = paddingLeft + i * stepX + stepX / 2 - barWidth / 2;
          const barHeight = Math.max(0, (d.spentMan / roundedMaxSpentMan) * innerHeight);
          const y = paddingTop + innerHeight - barHeight;
          const isHovered = hoveredIndex === i;

          return (
            <g key={`bar-${d.month}`}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={3}
                fill={isHovered ? "#2878F0" : "#8AB4FF"}
                className="transition-colors duration-150"
              />
              <text
                x={x + barWidth / 2}
                y={chartHeight - paddingBottom + 16}
                textAnchor="middle"
                className={`text-[8.5px] font-bold ${
                  isHovered ? "fill-[#2878F0] font-black" : "fill-slate-400"
                }`}
              >
                {d.label}
              </text>
              <rect
                x={paddingLeft + i * stepX}
                y={paddingTop}
                width={stepX}
                height={innerHeight + paddingBottom}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                onTouchStart={() => setHoveredIndex(i)}
              />
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {activePoint && (
        <div className="mt-2 rounded-lg bg-[#0B1D40] p-2 text-center text-white shadow-md text-xs">
          <span className="font-bold text-blue-200">{activePoint.month}月</span>
          <span className="ml-2 font-black tabular-nums">¥{activePoint.spent.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Interactive SVG Monthly PP Cost Trend Line Chart
// -------------------------------------------------------------
function MonthlyCostTrendChart({
  data,
  hoveredIndex,
  setHoveredIndex,
}: {
  data: MonthlyDataPoint[];
  hoveredIndex: number | null;
  setHoveredIndex: (idx: number | null) => void;
}) {
  const validData = data.filter((d) => d.avgPrice > 0);
  const maxPrice = Math.max(30, ...validData.map((d) => d.avgPrice));
  const roundedMaxPrice = Math.ceil(maxPrice / 10) * 10;

  const chartWidth = 320;
  const chartHeight = 180;
  const paddingLeft = 35;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;
  const stepX = innerWidth / data.length;

  const getY = (val: number) => {
    return paddingTop + innerHeight - (val / roundedMaxPrice) * innerHeight;
  };

  // Build points for months that have data
  const points = data
    .map((d, i) => {
      if (d.avgPrice === 0) return null;
      const x = paddingLeft + i * stepX + stepX / 2;
      const y = getY(d.avgPrice);
      return { x, y, month: d.month, price: d.avgPrice, index: i };
    })
    .filter(Boolean) as { x: number; y: number; month: number; price: number; index: number }[];

  const pathString = points.length > 0 ? `M ${points.map((p) => `${p.x},${p.y}`).join(" L ")}` : "";

  const activePoint = hoveredIndex !== null ? data[hoveredIndex] : null;

  return (
    <div className="w-full select-none">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full h-auto overflow-visible font-sans"
        aria-label="月別PP単価推移グラフ"
      >
        {/* Y Axis Grid */}
        {[0, 10, 20, 30].map((val) => {
          if (val > roundedMaxPrice) return null;
          const y = getY(val);
          return (
            <g key={val}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={chartWidth - paddingRight}
                y2={y}
                stroke="#E2E8F0"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <text
                x={paddingLeft - 6}
                y={y + 3.5}
                textAnchor="end"
                className="fill-slate-400 text-[8px] tabular-nums font-semibold"
              >
                {val}
              </text>
            </g>
          );
        })}

        <text x={paddingLeft - 8} y={paddingTop - 8} textAnchor="end" className="fill-slate-500 text-[8px] font-bold">
          ¥ / PP
        </text>

        {/* Trend Line */}
        {pathString && (
          <path
            d={pathString}
            fill="none"
            stroke="#2878F0"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Data Points */}
        {points.map((p) => {
          const isHovered = hoveredIndex === p.index;
          return (
            <g key={p.month}>
              <circle
                cx={p.x}
                cy={p.y}
                r={isHovered ? 4.5 : 3}
                fill={isHovered ? "#2878F0" : "#FFFFFF"}
                stroke="#2878F0"
                strokeWidth={2}
                className="transition-all"
              />
            </g>
          );
        })}

        {/* X Axis Labels & Hit Areas */}
        {data.map((d, i) => {
          const cx = paddingLeft + i * stepX + stepX / 2;
          const isHovered = hoveredIndex === i;

          return (
            <g key={d.month}>
              <text
                x={cx}
                y={chartHeight - paddingBottom + 16}
                textAnchor="middle"
                className={`text-[8.5px] font-bold ${
                  isHovered ? "fill-[#2878F0] font-black" : "fill-slate-400"
                }`}
              >
                {d.label}
              </text>
              <rect
                x={paddingLeft + i * stepX}
                y={paddingTop}
                width={stepX}
                height={innerHeight + paddingBottom}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                onTouchStart={() => setHoveredIndex(i)}
              />
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {activePoint && activePoint.avgPrice > 0 && (
        <div className="mt-2 rounded-lg bg-[#0B1D40] p-2 text-center text-white shadow-md text-xs">
          <span className="font-bold text-blue-200">{activePoint.month}月</span>
          <span className="ml-2 font-black tabular-nums">¥{activePoint.avgPrice.toFixed(2)} /PP</span>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Interactive SVG Donut Chart
// -------------------------------------------------------------
interface DonutItem {
  id: string;
  label: string;
  value: number;
  color: string;
  percentage: number;
}

function DonutChart({
  items,
  centerLabel,
  centerValue,
  centerSub,
  hoveredId,
  setHoveredId,
}: {
  items: DonutItem[];
  centerLabel: string;
  centerValue: string;
  centerSub: string;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
}) {
  const size = 180;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const segments = useMemo(() => {
    return items.map((item, index) => {
      const priorPercentage = items.slice(0, index).reduce((acc, curr) => acc + curr.percentage, 0);
      const rotation = -90 + (priorPercentage / 100) * 360;
      return {
        ...item,
        rotation,
      };
    });
  }, [items]);

  return (
    <div className="relative mx-auto flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible select-none">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F1F5F9"
          strokeWidth={strokeWidth}
        />

        {/* Segments */}
        {segments.map((item) => {
          if (item.value === 0) return null;
          const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
          const isHovered = hoveredId === item.id;

          return (
            <circle
              key={item.id}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={0}
              transform={`rotate(${item.rotation} ${size / 2} ${size / 2})`}
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              onTouchStart={() => setHoveredId(item.id)}
            />
          );
        })}
      </svg>

      {/* Center Label */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[10px] font-bold text-slate-400">{centerLabel}</span>
        <span className="text-xl font-black tracking-tight text-[#0B1D40] tabular-nums">
          {centerValue}
        </span>
        <span className="text-[10px] font-bold text-slate-400">{centerSub}</span>
      </div>
    </div>
  );
}
