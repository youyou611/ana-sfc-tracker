"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type FlightLog = { id: string; date: string; year: number; origin: string; destination: string; via: string; pp: number; price: number; };

export default function Home() {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [flightLogs, setFlightLogs] = useState<FlightLog[]>([]);
  const [targetType, setTargetType] = useState<string>("platinum_std");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ date: string; price: number; pp: number }>({ date: "", price: 0, pp: 0 });

  const targetOptions: { [key: string]: { label: string, pp: number } } = {
    bronze_ls: { label: "ブロンズ (LS)", pp: 15000 },
    bronze_std: { label: "ブロンズ (通常)", pp: 30000 },
    platinum_ls: { label: "プラチナ (LS)", pp: 30000 },
    platinum_std: { label: "プラチナ/SFC (通常)", pp: 50000 },
    diamond_ls_5m: { label: "ダイヤ (LS/500万)", pp: 50000 },
    diamond_ls_4m: { label: "ダイヤ (LS/400万)", pp: 80000 },
    diamond_std: { label: "ダイヤモンド (通常)", pp: 100000 },
  };

  useEffect(() => {
    const savedLogs = localStorage.getItem("sfc_flight_logs");
    if (savedLogs) setFlightLogs(JSON.parse(savedLogs));
    const savedTarget = localStorage.getItem("sfc_target_type");
    if (savedTarget) setTargetType(savedTarget);
  }, []);

  const handleTargetChange = (val: string) => { setTargetType(val); localStorage.setItem("sfc_target_type", val); };

  const deleteLog = (id: string) => {
    if (!confirm("このフライト履歴を削除しますか？")) return;
    const newLogs = flightLogs.filter(log => log.id !== id);
    setFlightLogs(newLogs);
    localStorage.setItem("sfc_flight_logs", JSON.stringify(newLogs));
  };

  const copyLog = (log: FlightLog) => {
    const newLog = { ...log, id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() };
    const newLogs = [...flightLogs, newLog];
    setFlightLogs(newLogs);
    localStorage.setItem("sfc_flight_logs", JSON.stringify(newLogs));
  };

  const startEdit = (log: FlightLog) => { setEditingId(log.id); setEditForm({ date: log.date, price: log.price, pp: log.pp }); };

  const saveEdit = () => {
    const newLogs = flightLogs.map(log => log.id === editingId ? { ...log, date: editForm.date, year: new Date(editForm.date).getFullYear(), price: editForm.price, pp: editForm.pp } : log);
    setFlightLogs(newLogs);
    localStorage.setItem("sfc_flight_logs", JSON.stringify(newLogs));
    setEditingId(null);
  };

  const currentYearLogs = flightLogs.filter(log => log.year === selectedYear).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const currentPP = currentYearLogs.reduce((sum, log) => sum + log.pp, 0);
  const currentSpent = currentYearLogs.reduce((sum, log) => sum + log.price, 0);
  const avgPPPrice = currentPP > 0 ? (currentSpent / currentPP).toFixed(1) : "0.0";
  const targetPP = targetOptions[targetType].pp;
  const progressPercent = Math.min((currentPP / targetPP) * 100, 100);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-sans pb-20">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:justify-between md:items-end border-b border-slate-200 pb-4 gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#003184]">SFC修行 フライトログ</h1>
            <div className="flex items-center gap-2 mt-2">
              <select className="bg-slate-200 border-none text-xs font-bold text-slate-600 rounded px-2 py-1 outline-none cursor-pointer" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}年度</option>)}
              </select>
            </div>
          </div>
          <Link href="/flight" className="inline-flex items-center px-6 py-2 bg-[#003184] hover:bg-blue-800 text-white text-xs font-bold rounded shadow-sm transition-all">
            ＋ 新しいフライトを登録
          </Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-12 bg-white rounded-lg p-6 md:p-8 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="absolute top-0 right-0 p-4 text-slate-50 font-black text-8xl pointer-events-none select-none">{selectedYear}</div>
            <div className="w-full md:w-1/2 relative z-10">
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-2">積算プレミアムポイント</label>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-black text-[#003184] tracking-tighter">{currentPP.toLocaleString()}</span>
                <span className="text-xl font-bold text-slate-300">/ {targetPP.toLocaleString()} PP</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-4 overflow-hidden">
                <div className="bg-[#003184] h-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
              </div>
              <p className="text-[10px] font-bold text-[#003184] mt-2">達成率: {progressPercent.toFixed(1)}%</p>
            </div>
            <div className="w-full md:w-1/2 flex gap-4 relative z-10 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8">
              <div className="flex-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">目標ステータス</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs font-medium text-slate-700 outline-none" value={targetType} onChange={(e) => handleTargetChange(e.target.value)}>
                  {Object.keys(targetOptions).map(k => <option key={k} value={k}>{targetOptions[k].label}</option>)}
                </select>
              </div>
              <div className="flex-1 bg-slate-50 rounded p-3 border border-slate-100">
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">平均PP単価</label>
                <p className="text-lg font-bold text-slate-700">¥ {avgPPPrice}</p>
                <p className="text-[9px] text-slate-400 mt-1">累計: ¥ {currentSpent.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="md:col-span-12">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center">
              <span className="w-2 h-2 rounded-full bg-[#003184] mr-2"></span>{selectedYear}年度 フライト履歴
            </h2>
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              {currentYearLogs.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-sm font-medium">
                  <p>まだフライト履歴がありません。</p>
                  <p className="text-xs mt-2">「＋ 新しいフライトを登録」から予定を追加してください。</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {currentYearLogs.map((log) => (
                    <div key={log.id} className="p-4 md:p-6 hover:bg-slate-50 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group">
                      {editingId === log.id ? (
                        <div className="w-full flex flex-col md:flex-row gap-4 items-center bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                          <div className="flex flex-col gap-1 w-full md:w-auto">
                            <label className="text-[9px] font-bold text-slate-500 uppercase">搭乗日</label>
                            <input type="date" className="p-2 rounded border border-slate-300 text-sm font-bold text-[#003184]" value={editForm.date} onChange={(e) => setEditForm({...editForm, date: e.target.value})} />
                          </div>
                          <div className="flex flex-col gap-1 flex-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase">ルート (変更不可)</label>
                            <p className="p-2 text-sm font-bold text-slate-500 bg-slate-100 rounded border border-slate-200">{log.origin} {log.via && `→ ${log.via}`} → {log.destination}</p>
                          </div>
                          <div className="flex flex-col gap-1 w-full md:w-24">
                            <label className="text-[9px] font-bold text-slate-500 uppercase">獲得PP</label>
                            <input type="number" className="p-2 rounded border border-slate-300 text-sm font-bold" value={editForm.pp} onChange={(e) => setEditForm({...editForm, pp: Number(e.target.value)})} />
                          </div>
                          <div className="flex flex-col gap-1 w-full md:w-32">
                            <label className="text-[9px] font-bold text-slate-500 uppercase">金額 (円)</label>
                            <input type="number" className="p-2 rounded border border-slate-300 text-sm font-bold" value={editForm.price} onChange={(e) => setEditForm({...editForm, price: Number(e.target.value)})} />
                          </div>
                          <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0 pt-2">
                            <button onClick={saveEdit} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-sm">保存</button>
                            <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded">戻る</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-4 md:w-1/3">
                            <div className="bg-[#003184] text-white rounded p-2 text-center min-w-[3rem]">
                              <p className="text-[9px] font-bold uppercase opacity-80">{log.date.split('-')[1]}月</p>
                              <p className="text-lg font-black leading-none">{log.date.split('-')[2]}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold mb-0.5">{log.date}</p>
                              <p className="text-sm font-black text-slate-800 flex items-center">{log.origin} {log.via && <span className="text-slate-300 mx-1 text-xs">→ {log.via} →</span>} {!log.via && <span className="text-slate-300 mx-2 text-xs">→</span>} {log.destination}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:w-2/3 text-left md:text-right relative">
                            <div><p className="text-[9px] text-slate-400 font-bold uppercase">獲得PP</p><p className="text-sm font-bold text-[#003184]">{log.pp} <span className="text-[10px] font-normal">PP</span></p></div>
                            <div><p className="text-[9px] text-slate-400 font-bold uppercase">航空券代</p><p className="text-sm font-bold text-slate-700">¥{log.price.toLocaleString()}</p></div>
                            <div><p className="text-[9px] text-slate-400 font-bold uppercase">PP単価</p><p className="text-sm font-bold text-slate-500">¥{(log.price / log.pp).toFixed(1)}</p></div>
                            <div className="flex justify-end items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all">
                              <button onClick={() => copyLog(log)} className="text-[10px] text-blue-500 font-bold hover:text-blue-700 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded transition-colors" title="複製">複製</button>
                              <button onClick={() => startEdit(log)} className="text-[10px] text-slate-500 font-bold hover:text-slate-700 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded transition-colors" title="編集">編集</button>
                              <button onClick={() => deleteLog(log.id)} className="text-[10px] text-red-400 font-bold hover:text-red-600 px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded transition-colors" title="削除">削除</button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}