"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFlightData } from "../hooks/useFlightData";
import type { FlightLogEx } from "../types";
import FlightDetailModal from "../components/FlightDetailModal";
import { getAircraftImagePath } from "../lib/aircraftImages";
import WorldRouteMap from "../components/WorldRouteMap";

export default function RouteMapPage() {
  const { logs, isLoaded, loadError, updateLog, refreshLogs } = useFlightData();
  const [selectedYear, setSelectedYear] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<FlightLogEx | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [viewMode, setViewMode] = useState<"globe" | "2d">("globe");

  // HUD drawer/sheet state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const years = useMemo(
    () => [...new Set(logs.filter((log) => log.airline === "ANA").map((log) => log.year))].sort((a, b) => b - a),
    [logs]
  );

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return logs
      .filter((log) => log.airline === "ANA")
      .filter((log) => selectedYear === "all" || String(log.year) === selectedYear)
      .filter((log) => !query || [log.date, log.origin, log.destination, log.via, log.flightNumber, log.aircraftType, log.registration, log.memo]
        .some((value) => String(value || "").toLocaleLowerCase().includes(query)))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [logs, selectedYear, search]);

  // HUD Stats
  const visitedAirportsCount = useMemo(() => {
    const set = new Set<string>();
    filteredLogs.forEach((log) => {
      if (log.origin) set.add(log.origin.trim().toUpperCase());
      if (log.destination) set.add(log.destination.trim().toUpperCase());
      if (log.via) set.add(log.via.trim().toUpperCase());
    });
    return set.size;
  }, [filteredLogs]);

  const totalDistanceKm = useMemo(() => {
    return filteredLogs.reduce((acc, log) => {
      // 概算km: TPM基本マイル相当から換算 (1マイル ≈ 1.609km)
      const approxMiles = log.pp > 0 ? Math.round(log.pp * 0.8) : 600;
      return acc + Math.round(approxMiles * 1.609);
    }, 0);
  }, [filteredLogs]);

  const updateSelectedLog = async (updated: FlightLogEx) => {
    await updateLog(updated);
    setSelectedLog(updated);
  };

  if (!isLoaded || isRetrying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050B14] text-white">
        <div className="text-center">
          <div className="h-10 w-10 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-sky-200">路線マップを読み込み中…</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050B14] px-4 text-white">
        <section role="alert" className="w-full max-w-md rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl p-6 text-center shadow-xl">
          <h1 className="text-base font-black">搭乗記録を読み込めませんでした</h1>
          <button
            type="button"
            disabled={isRetrying}
            onClick={async () => {
              setIsRetrying(true);
              await refreshLogs();
              setIsRetrying(false);
            }}
            className="mt-4 min-h-11 rounded-xl bg-[#2878f0] px-5 text-sm font-bold text-white"
          >
            {isRetrying ? "再読み込み中…" : "再試行"}
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[100dvh] bg-[#050B14] overflow-hidden select-none font-sans">
      
      {/* ================= 1. FULL-SCREEN 3D GLOBE / 2D MAP CANVAS ================= */}
      <div className="absolute inset-0 z-0">
        <WorldRouteMap
          flights={filteredLogs}
          onSelectFlight={setSelectedLog}
        />
      </div>

      {/* ================= 2. TOP HUD: 3D地球儀 / 2D地図 TOGGLE PILL ================= */}
      <div className="absolute top-4 inset-x-0 z-20 flex justify-center pointer-events-none px-4 pt-[env(safe-area-inset-top)]">
        <div className="pointer-events-auto flex items-center p-1 rounded-full bg-[#050B14]/75 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <button
            type="button"
            onClick={() => setViewMode("globe")}
            className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${
              viewMode === "globe"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-white/70 hover:text-white"
            }`}
          >
            3D地球儀
          </button>
          <button
            type="button"
            onClick={() => setViewMode("2d")}
            className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${
              viewMode === "2d"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-white/70 hover:text-white"
            }`}
          >
            2D地図
          </button>
        </div>
      </div>

      {/* ================= 3. RIGHT HUD: 3連 GLASSMORPHIC FABs (検索・レイヤー・フィルタ) ================= */}
      <div className="absolute top-20 right-4 z-20 flex flex-col gap-2.5">
        {/* 検索ボタン */}
        <button
          type="button"
          aria-label="フライトを検索"
          onClick={() => setIsSearchOpen(!isSearchOpen)}
          className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-xl border border-white/20 shadow-lg text-white transition-all active:scale-95 ${
            isSearchOpen || search ? "bg-[#2878F0]" : "bg-[#050B14]/65 hover:bg-white/20"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        {/* フィルターボタン (年度選択) */}
        <button
          type="button"
          aria-label="年度フィルター"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-xl border border-white/20 shadow-lg text-white transition-all active:scale-95 ${
            isFilterOpen || selectedYear !== "all" ? "bg-[#2878F0]" : "bg-[#050B14]/65 hover:bg-white/20"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </button>

        {/* レイヤー/視点リセットボタン */}
        <button
          type="button"
          aria-label="視点をリセット"
          onClick={() => {
            setSelectedYear("all");
            setSearch("");
          }}
          title="条件クリア"
          className="w-10 h-10 rounded-full bg-[#050B14]/65 hover:bg-white/20 backdrop-blur-xl border border-white/20 shadow-lg text-white flex items-center justify-center transition-all active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* 検索・フィルターのオーバーレイパネル */}
      <AnimatePresence>
        {(isSearchOpen || isFilterOpen) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-20 right-16 z-30 w-64 p-3 rounded-2xl bg-[#050B14]/90 backdrop-blur-2xl border border-white/20 shadow-2xl text-white space-y-2.5"
          >
            {isSearchOpen && (
              <div>
                <label className="text-[10px] font-bold text-white/60 block mb-1">フライト検索</label>
                <input
                  type="text"
                  placeholder="空港コード、便名、機材等"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
            )}
            {isFilterOpen && (
              <div>
                <label className="text-[10px] font-bold text-white/60 block mb-1">搭乗年度</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:ring-2 focus:ring-sky-400"
                >
                  <option value="all" className="bg-[#050B14] text-white">すべての年度</option>
                  {years.map((y) => (
                    <option key={y} value={String(y)} className="bg-[#050B14] text-white">
                      {y}年
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex justify-between items-center pt-1 border-t border-white/10 text-[10px]">
              <span className="text-white/60">{filteredLogs.length}件のフライト</span>
              <button
                type="button"
                onClick={() => {
                  setIsSearchOpen(false);
                  setIsFilterOpen(false);
                }}
                className="font-bold text-sky-300"
              >
                閉じる
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= 4. BOTTOM HUD: 3-COLUMN TRANSLUCENT STATS CARDS ================= */}
      <div
        className="absolute inset-x-4 z-20 flex justify-center pointer-events-none"
        style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="pointer-events-auto max-w-md w-full grid grid-cols-3 gap-2 p-2 rounded-2xl bg-[#050B14]/75 backdrop-blur-xl border border-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.6)] text-center text-white">
          <div className="p-2">
            <span className="text-[10px] text-white/60 font-semibold block">訪問した空港</span>
            <span className="text-lg sm:text-xl font-black text-white tabular-nums tracking-tight mt-0.5 block">
              {visitedAirportsCount}
            </span>
          </div>
          <div className="p-2 border-x border-white/10">
            <span className="text-[10px] text-white/60 font-semibold block">総飛行距離</span>
            <span className="text-lg sm:text-xl font-black text-sky-300 tabular-nums tracking-tight mt-0.5 block">
              {totalDistanceKm.toLocaleString()}
            </span>
            <span className="text-[9px] text-white/50 -mt-0.5 block">km</span>
          </div>
          <div className="p-2">
            <span className="text-[10px] text-white/60 font-semibold block">総フライト数</span>
            <span className="text-lg sm:text-xl font-black text-white tabular-nums tracking-tight mt-0.5 block">
              {filteredLogs.length}
            </span>
          </div>
        </div>
      </div>

      {/* ================= 5. FLIGHT DETAIL MODAL ================= */}
      <AnimatePresence>
        {selectedLog && (
          <FlightDetailModal
            log={selectedLog}
            generatedImage={getAircraftImagePath(selectedLog)}
            onClose={() => setSelectedLog(null)}
            onUpdate={updateSelectedLog}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
