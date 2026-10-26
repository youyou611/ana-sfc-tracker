"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useFlightData } from "../hooks/useFlightData";
import { FlightLogEx } from "../types";
import { getAircraftImagePath } from "../lib/aircraftImages";
import { getImage, saveImage } from "../lib/db";
import FlightDetailModal from "../components/FlightDetailModal";
import FlightCardImage from "../components/FlightCardImage";
import { getTravelClassPresentation } from "../lib/travelClass";

type StatusFilter = "all" | "flown" | "upcoming";

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "flown", label: "搭乗済み" },
  { value: "upcoming", label: "予定" },
];

/** ローカル日付の YYYY-MM-DD（表示用ステータス判定にのみ使用） */
function getLocalTodayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export default function LogsPage() {
  const { logs: flightLogs, isLoaded, removeLog, addLog, updateLog } = useFlightData();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedLog, setSelectedLog] = useState<FlightLogEx | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "pp-desc">("date-desc");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const deleteLog = async (id: string) => {
    if (!confirm("このフライト履歴を削除しますか？")) return;
    await removeLog(id);
  };

  const copyLog = async (log: FlightLogEx) => {
    const id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
    const newLog: FlightLogEx = { ...log, id, imageId: undefined };
    if (log.imageId) {
      const image = await getImage(log.imageId);
      if (image) {
        newLog.imageId = `flight-${id}-${Date.now()}`;
        await saveImage(newLog.imageId, image);
      }
    }
    await addLog(newLog);
  };

  const updateSelectedLog = async (log: FlightLogEx) => {
    await updateLog(log);
    setSelectedLog(log);
  };

  if (!isLoaded) return <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center"><p className="text-slate-400 font-bold text-sm">読み込み中...</p></div>;

  const todayStr = getLocalTodayString();
  const isUpcoming = (log: FlightLogEx) => log.date >= todayStr;

  const currentYearLogs = flightLogs.filter(log => log.year === selectedYear && log.airline === 'ANA');
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
  const displayedLogs = currentYearLogs
    .filter(log => {
      if (statusFilter === "flown") return !isUpcoming(log);
      if (statusFilter === "upcoming") return isUpcoming(log);
      return true;
    })
    .filter(log => {
      if (!normalizedQuery) return true;
      const searchableFields = [log.origin, log.destination, log.via, log.flightNumber, log.bookingClass, log.operatingCarrier, log.aircraftType, log.registration, log.seat];
      return searchableFields.some(value => value?.toLocaleLowerCase().includes(normalizedQuery));
    })
    .sort((a, b) => {
      if (sortBy === "pp-desc") return b.pp - a.pp || b.date.localeCompare(a.date);
      const dateDifference = new Date(a.date).getTime() - new Date(b.date).getTime();
      return sortBy === "date-desc" ? -dateDifference : dateDifference;
    });

  // Available years for dropdown
  const currentYear = new Date().getFullYear();
  const firstYear = Math.min(2010, ...flightLogs.map((log) => log.year));
  const years = Array.from({ length: currentYear + 5 - firstYear + 1 }, (_, index) => currentYear + 5 - index);
  for (const log of flightLogs) if (!years.includes(log.year)) years.push(log.year);
  years.sort((a, b) => b - a);

  const currentYearPP = currentYearLogs.reduce((sum, log) => sum + log.pp, 0);
  const isFiltered = statusFilter !== "all" || normalizedQuery.length > 0;

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };

  const toggleSearch = () => {
    if (isSearchOpen) setSearchQuery("");
    setIsSearchOpen(!isSearchOpen);
  };

  const iconButton = (active: boolean) =>
    `relative flex h-11 w-11 items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${active ? "bg-[#003184] text-white" : "text-slate-600 hover:bg-slate-200/70"}`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#F4F7FB] text-slate-900 pb-28 font-sans">
      {/* ヘッダー */}
      <header className="sticky top-0 z-20 bg-[#F4F7FB]/90 backdrop-blur border-b border-slate-200/70">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-2 px-3 sm:px-4 h-14">
          <span className="w-11 sm:hidden" aria-hidden="true" />
          <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 sm:pl-1">フライト履歴</h1>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={toggleSearch}
              aria-label={isSearchOpen ? "検索を閉じる" : "フライト履歴を検索"}
              aria-expanded={isSearchOpen}
              aria-controls="flight-history-search"
              className={iconButton(isSearchOpen)}
            >
              <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="11" cy="11" r="7" strokeWidth={2} /><path strokeWidth={2} strokeLinecap="round" d="m16 16 4 4" /></svg>
            </button>
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              aria-label="対象年と並び替え"
              aria-expanded={isFilterOpen}
              aria-controls="flight-history-filters"
              className={iconButton(isFilterOpen)}
            >
              <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M4 5h16l-6 8v5l-4 2v-7L4 5z" /></svg>
              {sortBy !== "date-desc" && <span aria-hidden="true" className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-400" />}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-3 sm:px-4 pt-3 space-y-3">
        {/* 検索 */}
        {isSearchOpen && (
          <div id="flight-history-search" className="relative">
            <svg aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="11" cy="11" r="7" strokeWidth={2} />
              <path strokeWidth={2} strokeLinecap="round" d="m16 16 4 4" />
            </svg>
            <input type="search" autoFocus value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="区間・空港コード・便名・機材で検索" aria-label="フライト履歴を検索" className="w-full min-h-11 rounded-xl border border-slate-200 bg-white pl-10 pr-11 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            {searchQuery && <button type="button" onClick={() => setSearchQuery("")} aria-label="検索条件をクリア" className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">×</button>}
          </div>
        )}

        {/* 対象年・並び替え */}
        {isFilterOpen && (
          <section id="flight-history-filters" aria-label="対象年と並び替え" className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm">
            <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-500">
              <span>対象年</span>
              <select
                id="flight-history-year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-[#003184] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                {years.map(y => <option key={y} value={y}>{y}年</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-500">
              <span>並び替え</span>
              <select value={sortBy} onChange={event => setSortBy(event.target.value as typeof sortBy)} aria-label="フライト履歴の並び替え" className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-[#003184] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                <option value="date-desc">搭乗日が新しい順</option>
                <option value="date-asc">搭乗日が古い順</option>
                <option value="pp-desc">獲得PPが多い順</option>
              </select>
            </label>
          </section>
        )}

        {/* ステータスタブ */}
        <div role="group" aria-label="ステータスで絞り込み" className="grid grid-cols-3 gap-1 rounded-full bg-white p-1 shadow-sm border border-slate-200/80">
          {STATUS_TABS.map(tab => {
            const active = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                aria-pressed={active}
                onClick={() => setStatusFilter(tab.value)}
                className={`min-h-11 rounded-full text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${active ? "bg-blue-50 text-[#003184] ring-1 ring-[#003184]/30" : "text-slate-500 hover:text-slate-800"}`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 年次集計バー */}
        <div className="flex items-center justify-between gap-2 px-1 text-sm tabular-nums" aria-live="polite">
          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            aria-label={`対象年 ${selectedYear}年（変更する）`}
            className="-ml-1 min-h-11 rounded-lg px-1 font-black text-slate-900 hover:bg-slate-200/60"
          >
            {selectedYear}年
          </button>
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs text-slate-500 whitespace-nowrap">
              {isFiltered && <span className="font-bold text-slate-700">{displayedLogs.length} / </span>}
              {currentYearLogs.length}フライト
            </span>
            <span className="h-3 w-px bg-slate-300" aria-hidden="true" />
            <span className="font-black text-[#003184] whitespace-nowrap">
              {currentYearPP.toLocaleString()} <span className="text-[10px] font-bold text-slate-500">PP</span>
            </span>
          </div>
        </div>

        {currentYearLogs.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80 shadow-sm">
            <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-[#003184]">
              <svg aria-hidden="true" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </div>
            <p className="text-slate-800 font-black text-base">{selectedYear}年のフライト履歴がありません</p>
            <p className="text-slate-500 text-xs mt-1.5 mb-6">搭乗予定や実績を登録して、プレミアムポイントを記録しましょう。</p>
            <Link
              href="/calc"
              className="inline-flex min-h-11 items-center gap-2 bg-[#003184] hover:bg-[#002561] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-blue-900/15 transition-all active:scale-[0.98]"
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              <span>フライトを登録する (PP計算機へ)</span>
            </Link>
          </div>
        ) : displayedLogs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#003184]">
              <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="11" cy="11" r="7" strokeWidth={1.8} /><path strokeWidth={1.8} strokeLinecap="round" d="m16 16 4 4" /></svg>
            </div>
            <p className="font-black text-slate-800">条件に一致するフライトがありません</p>
            <p className="mt-1 text-xs text-slate-500">
              {normalizedQuery
                ? "空港コード、便名、機材名などで検索してください。"
                : statusFilter === "upcoming" ? `${selectedYear}年の搭乗予定はありません。` : `${selectedYear}年の搭乗済みフライトはありません。`}
            </p>
            <button type="button" onClick={resetFilters} className="mt-4 min-h-11 rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-[#003184] hover:bg-blue-100">条件をクリア</button>
          </div>
        ) : (
          <ul className="bg-white rounded-2xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
            <AnimatePresence initial={false}>
              {displayedLogs.map((log) => {
                const upcoming = isUpcoming(log);
                const isPartner = !!log.operatingCarrier && log.operatingCarrier !== "NH";
                const travelClass = getTravelClassPresentation(log.travelClass);
                const menuOpen = openMenuId === log.id;
                return (
                  <motion.li
                    layout
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.12 } }}
                  >
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        aria-label={`${log.date} ${log.origin}から${log.destination} ${log.flightNumber || ""} ${upcoming ? "予定" : "搭乗済み"} ${log.pp}PP の詳細を開く`}
                        className="group flex min-w-0 flex-1 items-center gap-3 py-3 pl-3 sm:pl-4 pr-1 text-left hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400"
                      >
                        <div className="relative w-14 h-14 shrink-0 rounded-xl overflow-hidden bg-slate-200">
                          <FlightCardImage log={log} generatedImage={getAircraftImagePath(log)} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-black tracking-tight text-slate-900" title={`${log.origin}${log.via ? ` → ${log.via}` : ""} → ${log.destination}`}>
                            {log.origin}{log.via ? <span className="text-slate-400"> → {log.via}</span> : null}<span className="text-slate-400"> → </span>{log.destination}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] text-slate-500 tabular-nums">
                            <span>{log.date.replaceAll("-", "/")}</span>
                            <span className="ml-2">{isPartner ? log.operatingCarrier : "ANA"} {log.flightNumber}</span>
                          </p>
                          <div className="mt-1 flex items-center gap-1 overflow-hidden">
                            <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${upcoming ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>
                              {upcoming ? "予定" : "搭乗済み"}
                            </span>
                            {log.travelClass && log.travelClass !== "economy" && (
                              <span className={`truncate rounded-md px-1.5 py-0.5 text-[10px] font-bold ${travelClass.badge}`}>{travelClass.label}</span>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[15px] font-black text-slate-900 tabular-nums whitespace-nowrap">
                            {log.pp.toLocaleString()} <span className="text-[10px] font-bold text-slate-500">PP</span>
                          </p>
                          <p className="text-[10px] text-slate-400 tabular-nums whitespace-nowrap">¥{log.price.toLocaleString()}</p>
                        </div>
                        <svg aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m9 5 7 7-7 7" /></svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => setOpenMenuId(menuOpen ? null : log.id)}
                        aria-label={`${log.origin}から${log.destination}のその他の操作`}
                        aria-expanded={menuOpen}
                        className="mr-1 flex h-11 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                      >
                        <svg aria-hidden="true" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" /></svg>
                      </button>
                    </div>
                    {menuOpen && (
                      <div className="flex justify-end gap-2 bg-slate-50 px-3 py-1.5">
                        <button type="button" onClick={() => { setOpenMenuId(null); copyLog(log); }} className="min-h-11 rounded-lg px-4 text-xs font-bold text-[#003184] hover:bg-blue-50">複製</button>
                        <button type="button" onClick={() => { setOpenMenuId(null); deleteLog(log.id); }} className="min-h-11 rounded-lg px-4 text-xs font-bold text-slate-600 hover:bg-red-50 hover:text-red-600">削除</button>
                      </div>
                    )}
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>

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
    </motion.div>
  );
}
