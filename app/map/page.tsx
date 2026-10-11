"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useFlightData } from "../hooks/useFlightData";
import type { FlightLogEx } from "../types";
import FlightDetailModal from "../components/FlightDetailModal";
import FlightCardImage from "../components/FlightCardImage";
import { getAircraftImagePath } from "../lib/aircraftImages";
import WorldRouteMap from "../components/WorldRouteMap";

export default function RouteMapPage() {
  const { logs, isLoaded, updateLog } = useFlightData();
  const [selectedYear, setSelectedYear] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<FlightLogEx | null>(null);

  const years = useMemo(() => [...new Set(logs.filter((log) => log.airline === "ANA").map((log) => log.year))].sort((a, b) => b - a), [logs]);
  const filteredLogs = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return logs
      .filter((log) => log.airline === "ANA")
      .filter((log) => selectedYear === "all" || String(log.year) === selectedYear)
      .filter((log) => !query || [log.date, log.origin, log.destination, log.via, log.flightNumber, log.aircraftType, log.registration, log.memo]
        .some((value) => String(value || "").toLocaleLowerCase().includes(query)))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [logs, selectedYear, search]);

  const updateSelectedLog = async (updated: FlightLogEx) => {
    await updateLog(updated);
    setSelectedLog(updated);
  };

  if (!isLoaded) return <div className="flex min-h-screen items-center justify-center bg-slate-50"><p className="text-sm font-bold text-slate-400">搭乗記録を読み込んでいます…</p></div>;

  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-900">
    <header className="bg-[#002561] px-5 pb-6 pt-6 text-white shadow-md md:px-8">
      <div className="mx-auto flex max-w-6xl items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-200">ANA FLIGHT JOURNAL</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight md:text-3xl">路線マップ</h1>
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-blue-100 md:text-sm">これまでに登録したフライトを、世界地図と一覧で振り返ります。</p>
        </div>
        <Link href="/logs" className="shrink-0 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold transition hover:bg-white/20">履歴一覧へ ↗</Link>
      </div>
    </header>

    <main className="mx-auto max-w-6xl space-y-5 px-3 py-5 md:px-6 md:py-7">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5" aria-label="路線マップのフィルター">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(140px,0.45fr)_minmax(0,1fr)]">
          <label className="block text-xs font-bold text-slate-600">搭乗年度
            <select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold text-[#003184] outline-none focus:ring-2 focus:ring-blue-200">
              <option value="all">すべての年度</option>
              {years.map((year) => <option key={year} value={String(year)}>{year}年</option>)}
            </select>
          </label>
          <label className="block text-xs font-bold text-slate-600">フライトを検索
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="空港コード、便名、機材、日付、メモで検索" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200" />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>フィルター対象：{filteredLogs.length.toLocaleString("ja-JP")} 件</span>
          {(selectedYear !== "all" || search) && <button type="button" onClick={() => { setSelectedYear("all"); setSearch(""); }} className="rounded-lg px-3 py-1.5 font-bold text-[#003184] hover:bg-blue-50">条件をクリア</button>}
        </div>
      </section>

      <WorldRouteMap flights={filteredLogs} onSelectFlight={setSelectedLog} />

      <section className="space-y-3" aria-label="路線に含まれる搭乗記録">
        <div className="flex items-end justify-between gap-3 px-1">
          <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">MATCHING FLIGHTS</p><h2 className="mt-1 text-lg font-black text-slate-800">搭乗記録一覧</h2></div>
          <span className="text-xs font-bold text-slate-400">新しい順</span>
        </div>
        {filteredLogs.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="font-bold text-slate-600">条件に一致する搭乗記録がありません</p><p className="mt-2 text-xs text-slate-400">検索条件を変えるか、フライトを登録してください。</p>
          <Link href="/calc" className="mt-5 inline-flex rounded-xl bg-[#003184] px-5 py-3 text-sm font-black text-white hover:bg-blue-900">フライトを登録する</Link>
        </div> : <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <AnimatePresence initial={false}>{filteredLogs.map((log) => <motion.button key={log.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} type="button" onClick={() => setSelectedLog(log)} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:border-blue-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300">
            <div className="flex min-w-0">
              <div className="relative h-32 w-32 shrink-0 overflow-hidden bg-slate-900 sm:h-36 sm:w-40"><FlightCardImage log={log} generatedImage={getAircraftImagePath(log)} /><div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent" /></div>
              <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2"><span className="text-[10px] font-bold text-slate-400">{log.date}</span><span className="rounded-full bg-blue-50 px-2 py-1 text-[9px] font-black text-[#003184]">{log.operatingCarrier && log.operatingCarrier !== "NH" ? `STAR · ${log.operatingCarrier}` : "ANA"}</span></div>
                <div className="min-w-0"><p className="break-words text-lg font-black tracking-tight text-slate-800 sm:text-xl">{log.origin} <span className="text-blue-300">→</span> {log.destination}</p>{log.via && <p className="mt-0.5 text-[10px] text-slate-400">経由：{log.via}</p>}<p className="mt-1 truncate text-[10px] font-semibold text-slate-500">{log.flightNumber || "便名未登録"}{log.aircraftType ? ` · ${log.aircraftType}` : ""}</p></div>
                <div className="flex items-end justify-between gap-2"><span className="text-[10px] font-bold text-slate-400">詳細を開く ↗</span><span className="text-right text-sm font-black text-[#003184]">{log.pp.toLocaleString("ja-JP")} <span className="text-[10px] text-slate-400">PP</span></span></div>
              </div>
            </div>
          </motion.button>)}</AnimatePresence>
        </div>}
      </section>
    </main>
    {selectedLog && <FlightDetailModal log={selectedLog} generatedImage={getAircraftImagePath(selectedLog)} onClose={() => setSelectedLog(null)} onUpdate={updateSelectedLog} />}
  </motion.div>;
}
