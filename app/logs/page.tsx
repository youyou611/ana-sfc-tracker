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

export default function LogsPage() {
  const { logs: flightLogs, isLoaded, removeLog, addLog, updateLog } = useFlightData();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedLog, setSelectedLog] = useState<FlightLogEx | null>(null);

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

  if (!isLoaded) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-slate-400 font-bold text-sm">読み込み中...</p></div>;

  const currentYearLogs = flightLogs
    .filter(log => log.year === selectedYear && log.airline === 'ANA')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Available years for dropdown
  const currentYear = new Date().getFullYear();
  const firstYear = Math.min(2010, ...flightLogs.map((log) => log.year));
  const years = Array.from({ length: currentYear + 5 - firstYear + 1 }, (_, index) => currentYear + 5 - index);
  for (const log of flightLogs) if (!years.includes(log.year)) years.push(log.year);
  years.sort((a, b) => b - a);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-slate-50 text-slate-900 pb-24 font-sans">
      <div className="bg-[#002561] text-white pt-6 pb-6 px-6 relative shadow-md">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight">フライト履歴</h1>
          <select 
            className="bg-[#001b47] border border-blue-800 text-white rounded-lg px-3 py-1.5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-400"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {years.map(y => <option key={y} value={y}>{y}年</option>)}
          </select>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {currentYearLogs.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm mt-8">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </div>
            <p className="text-slate-500 font-bold text-sm">フライト履歴がありません</p>
            <p className="text-slate-400 text-xs mt-2 mb-6">フライトを登録してPPを管理しましょう</p>
          </div>
        ) : (
          <AnimatePresence>
            {currentYearLogs.map((log) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
                key={log.id} 
                role="button"
                tabIndex={0}
                aria-label={`${log.date} ${log.origin}から${log.destination}のフライト詳細を開く`}
                onClick={() => setSelectedLog(log)}
                onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); setSelectedLog(log); } }}
                className={`group ${getTravelClassPresentation(log.travelClass).ticket} rounded-2xl p-4 shadow-sm hover:shadow-md border border-slate-100 border-t-4 ${getTravelClassPresentation(log.travelClass).border} flex flex-col gap-3 relative overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 transition-shadow`}
              >
                <div className="relative -mx-4 -mt-4 h-40 overflow-hidden bg-slate-900">
                  <FlightCardImage log={log} generatedImage={getAircraftImagePath(log)} />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-white">
                    <div><p className="text-[10px] font-bold text-white/75">{log.date} ・ {log.flightNumber || "便名未登録"}</p><p className="text-xl font-black">{log.origin} → {log.destination}</p></div>
                    <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-black backdrop-blur">詳細を見る</span>
                  </div>
                </div>
                {/* Boarding Pass Notch styling */}
                <div className="absolute top-1/2 -left-2 w-4 h-4 bg-slate-50 rounded-full border-r border-slate-100 transform -translate-y-1/2"></div>
                <div className="absolute top-1/2 -right-2 w-4 h-4 bg-slate-50 rounded-full border-l border-slate-100 transform -translate-y-1/2"></div>
                
                <div className="flex justify-between items-center border-b border-dashed border-slate-200 pb-3">
                  <div className="flex gap-2 items-center">
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{log.date}</span>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${log.operatingCarrier && log.operatingCarrier !== "NH" ? "bg-slate-900 text-white" : "bg-blue-100 text-blue-700"}`}>{log.operatingCarrier && log.operatingCarrier !== "NH" ? `STAR ALLIANCE · ${log.operatingCarrier}` : "ANA"}</span>
                    {log.travelClass && <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${getTravelClassPresentation(log.travelClass).badge}`}>{getTravelClassPresentation(log.travelClass).label}</span>}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={(event) => { event.stopPropagation(); copyLog(log); }} className="text-xs text-blue-500 font-bold hover:underline">複製</button>
                    <button onClick={(event) => { event.stopPropagation(); deleteLog(log.id); }} className="text-xs text-red-500 font-bold hover:underline">削除</button>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-1">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-black text-slate-800 text-xl tracking-tight">{log.origin}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400 transform rotate-90" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                      </svg>
                      {log.via && (
                         <>
                           <span className="font-bold text-slate-400 text-sm">{log.via}</span>
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400 transform rotate-90" viewBox="0 0 20 20" fill="currentColor">
                             <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                           </svg>
                         </>
                      )}
                      <span className="font-black text-slate-800 text-xl tracking-tight">{log.destination}</span>
                    </div>
                    <div className="flex gap-2 items-center mt-2 flex-wrap">
                      {log.flightNumber && <span className="text-[10px] text-slate-600 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">便名 {log.flightNumber}</span>}
                      {log.bookingClass && <span className="text-[10px] text-slate-600 font-mono bg-white/75 px-1.5 py-0.5 rounded border border-slate-200">予約 {log.bookingClass}</span>}
                      {log.operatingCarrier && log.operatingCarrier !== "NH" && log.accrualRate !== undefined && <span className="text-[10px] text-slate-600 bg-white/75 px-1.5 py-0.5 rounded border border-slate-200">AMC積算率 {log.accrualRate}%</span>}
                      {log.aircraftType && <span className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">機材 {log.aircraftType}</span>}
                      {log.seat && <span className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">Seat {log.seat}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block font-black text-2xl text-[#003184] tabular-nums tracking-tight">
                      {log.pp.toLocaleString()} <span className="text-[10px] font-bold text-slate-400">PP</span>
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 block mt-1 tabular-nums">¥{log.price.toLocaleString()} ({log.pp > 0 ? (log.price / log.pp).toFixed(1) : "0.0"} 円/PP)</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
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

      {/* 画面右下のFAB (Floating Action Button) */}
      <Link href="/calc" className="fixed bottom-24 right-6 w-14 h-14 bg-[#003184] shadow-[#003184]/40 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-30">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
      </Link>
    </motion.div>
  );
}


