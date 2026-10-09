"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useFlightData } from "../hooks/useFlightData";
import { FlightLogEx } from "../types";

export default function LogsPage() {
  const { logs: flightLogs, isLoaded, removeLog, addLog, settings } = useFlightData();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const activeMode = settings.activeMode;
  const isJal = activeMode === 'JAL';

  const deleteLog = async (id: string) => {
    if (!confirm("このフライト履歴を削除しますか？")) return;
    await removeLog(id);
  };

  const copyLog = async (log: FlightLogEx) => {
    const newLog = { ...log, id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() };
    await addLog(newLog);
  };

  if (!isLoaded) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-slate-400 font-bold text-sm">読み込み中...</p></div>;

  const currentYearLogs = flightLogs
    .filter(log => log.year === selectedYear && log.airline === activeMode)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Available years for dropdown
  const years = Array.from(new Set(flightLogs.map(l => l.year))).sort((a, b) => b - a);
  if (!years.includes(new Date().getFullYear())) years.unshift(new Date().getFullYear());

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-slate-50 text-slate-900 pb-24 font-sans">
      <div className={`${isJal ? 'bg-red-900' : 'bg-[#002561]'} text-white pt-6 pb-6 px-6 relative shadow-md transition-colors duration-500`}>
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight">フライト履歴</h1>
          <select 
            className={`${isJal ? 'bg-red-950 border-red-800' : 'bg-[#001b47] border-blue-800'} text-white rounded-lg px-3 py-1.5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-400 transition-colors duration-500`}
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
            <p className="text-slate-400 text-xs mt-2 mb-6">フライトを登録して{isJal ? 'FOP' : 'PP'}を管理しましょう</p>
          </div>
        ) : (
          <AnimatePresence>
            {currentYearLogs.map((log) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                key={log.id} 
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-3 relative overflow-hidden"
              >
                {/* Boarding Pass Notch styling */}
                <div className="absolute top-1/2 -left-2 w-4 h-4 bg-slate-50 rounded-full border-r border-slate-100 transform -translate-y-1/2"></div>
                <div className="absolute top-1/2 -right-2 w-4 h-4 bg-slate-50 rounded-full border-l border-slate-100 transform -translate-y-1/2"></div>
                
                <div className="flex justify-between items-center border-b border-dashed border-slate-200 pb-3">
                  <div className="flex gap-2 items-center">
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{log.date}</span>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${log.airline === 'JAL' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{log.airline}</span>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => copyLog(log)} className="text-xs text-blue-500 font-bold hover:underline">複製</button>
                    <button onClick={() => deleteLog(log.id)} className="text-xs text-red-500 font-bold hover:underline">削除</button>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-1">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-black text-slate-800 text-xl">{log.origin}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${log.airline === 'JAL' ? 'text-red-300' : 'text-blue-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      {log.via && (
                         <>
                           <span className="font-bold text-slate-400 text-sm">{log.via}</span>
                           <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${log.airline === 'JAL' ? 'text-red-300' : 'text-blue-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                         </>
                      )}
                      <span className="font-black text-slate-800 text-xl">{log.destination}</span>
                    </div>
                    <div className="flex gap-2 items-center mt-2 flex-wrap">
                      {log.flightNumber && <span className="text-[10px] text-slate-600 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">便名 {log.flightNumber}</span>}
                      {log.aircraftType && <span className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">機材 {log.aircraftType}</span>}
                      {log.seat && <span className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">Seat {log.seat}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`block font-black text-2xl ${log.airline === 'JAL' ? 'text-red-700' : 'text-[#003184]'}`}>
                      {log.pp.toLocaleString()} <span className="text-[10px] font-bold text-slate-400">{log.airline === 'JAL' ? 'FOP' : 'PP'}</span>
                    </span>
                    {log.airline === 'JAL' && log.lsp > 0 && (
                      <span className="block text-xs font-bold text-emerald-600">{log.lsp} <span className="text-[10px] text-slate-400">LSP</span></span>
                    )}
                    <span className="text-[10px] font-bold text-slate-400 block mt-1">¥{log.price.toLocaleString()} ({log.pp > 0 ? (log.price / log.pp).toFixed(1) : "0.0"} 円/{log.airline === 'JAL' ? 'FOP' : 'PP'})</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* 画面右下のFAB (Floating Action Button) */}
      <Link href="/calc" className={`fixed bottom-24 right-6 w-14 h-14 ${isJal ? 'bg-red-700 shadow-red-900/40' : 'bg-[#003184] shadow-[#003184]/40'} text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-30`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
      </Link>
    </motion.div>
  );
}
