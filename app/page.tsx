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

  const handleTargetChange = (val: string) => { 
    setTargetType(val); 
    localStorage.setItem("sfc_target_type", val); 
  };

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

  const startEdit = (log: FlightLog) => { 
    setEditingId(log.id); 
    setEditForm({ date: log.date, price: log.price, pp: log.pp }); 
  };

  const saveEdit = () => {
    const newLogs = flightLogs.map(log => 
      log.id === editingId ? { ...log, date: editForm.date, year: new Date(editForm.date).getFullYear(), price: editForm.price, pp: editForm.pp } : log
    );
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
        
        {/* ヘッダーエリア */}
        <header className="flex flex-col md:flex-row md:justify-between md:items-end border-b border-slate-200 pb-4 gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#003184]">ANAステータス修行僧のためのダッシュボード</h1>
            <div className="flex items-center gap-2 mt-2">
              <select className="bg-slate-200 border-none text-xs font-bold text-slate-600 rounded px-2 py-1 outline-none cursor-pointer" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}年度</option>)}
              </select>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest ml-2">Flight Log</span>
            </div>
          </div>
          <Link href="/flight" className="inline-flex items-center px-6 py-2 bg-[#003184] hover:bg-blue-800 text-white text-xs font-bold rounded shadow-sm transition-colors">
            ＋ フライトを登録
          </Link>
        </header>

        {/* ご挨拶＆ベータ版アナウンス */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Beta</span>
            <h2 className="text-sm font-bold text-blue-900">飛行機ステータス修行用フライトログをご利用いただきありがとうございます！</h2>
          </div>
          <p className="text-xs text-blue-800/80 leading-relaxed">
            当サイトは現在ベータ版として公開しております。ANAすべての修行僧の皆様のお役に立てるよう、今後も機能拡張のアップデートをどんどん行っていきます！もちろん、JAL修行僧のためのサイトも作成予定です！個人開発で運営しておりますので、よろしければSNS等でシェアして応援していただけると開発の励みになります。よろしくお願いいたします🙇‍♂️
          </p>
        </div>

        <div className="space-y-6">
          
          {/* 修行進捗パネル */}
          <div className="bg-white rounded-xl p-6 md:p-8 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-4 text-slate-50 font-black text-8xl pointer-events-none select-none opacity-20 md:opacity-100">{selectedYear}</div>
            <div className="relative z-10 w-full md:w-2/3">
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-2">現在のプレミアムポイント</label>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl md:text-6xl font-black text-[#003184] tracking-tighter">{currentPP.toLocaleString()}</span>
                <span className="text-lg md:text-xl font-bold text-slate-300">/ {targetPP.toLocaleString()} PP</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 mt-5 overflow-hidden shadow-inner">
                <div className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
              </div>
              <p className="text-[11px] font-bold text-[#003184] mt-2 tracking-tight">達成率: {progressPercent.toFixed(1)}%</p>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50 flex flex-col md:flex-row gap-6 relative z-10 w-full">
              <div className="flex-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-2">目標ステータス</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm font-bold text-slate-700 outline-none" value={targetType} onChange={(e) => handleTargetChange(e.target.value)}>
                  {Object.keys(targetOptions).map(k => <option key={k} value={k}>{targetOptions[k].label}</option>)}
                </select>
              </div>
              <div className="flex-1 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">平均PP単価 / 累計</label>
                <p className="text-lg font-bold text-slate-700 tracking-tight">¥ {avgPPPrice} <span className="text-[11px] font-normal text-slate-400 ml-2">(¥{currentSpent.toLocaleString()})</span></p>
              </div>
            </div>
          </div>

          {/* フライト履歴リスト */}
          <div>
             <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center">
               <span className="w-1.5 h-1.5 rounded-full bg-[#003184] mr-2"></span>Recent Flight History
             </h2>
             <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
                {currentYearLogs.length === 0 ? (
                  <p className="p-12 text-center text-slate-400 text-sm font-bold uppercase tracking-widest">No Records</p>
                ) : (
                  currentYearLogs.map(log => (
                    <div key={log.id} className="p-4 md:px-6 flex flex-col md:flex-row justify-between items-start md:items-center group hover:bg-slate-50 transition-colors gap-4">
                      {editingId === log.id ? (
                        // 編集モード
                        <div className="w-full bg-blue-50/50 p-4 rounded-lg border border-blue-100 flex flex-col md:flex-row gap-4 items-end">
                          <div className="w-full md:flex-1">
                             <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">搭乗日</label>
                             <input type="date" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} className="w-full p-2 text-sm border border-slate-300 rounded font-bold text-[#003184]" />
                          </div>
                          <div className="w-full md:w-24">
                             <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">獲得PP</label>
                             <input type="number" value={editForm.pp} onChange={e => setEditForm({...editForm, pp: Number(e.target.value)})} className="w-full p-2 text-sm border border-slate-300 rounded font-bold" />
                          </div>
                          <div className="w-full md:w-32">
                             <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">金額 (円)</label>
                             <input type="number" value={editForm.price} onChange={e => setEditForm({...editForm, price: Number(e.target.value)})} className="w-full p-2 text-sm border border-slate-300 rounded font-bold" />
                          </div>
                          <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                            <button onClick={saveEdit} className="flex-1 md:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-sm">保存</button>
                            <button onClick={() => setEditingId(null)} className="flex-1 md:flex-none px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded">戻る</button>
                          </div>
                        </div>
                      ) : (
                        // 通常表示モード
                        <>
                          <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="bg-slate-100 p-2 rounded text-center min-w-[3.5rem] shrink-0">
                              <p className="text-[9px] font-bold text-slate-500 uppercase">{log.date.split('-')[1]}月</p>
                              <p className="text-xl font-black text-slate-800 leading-none">{log.date.split('-')[2]}</p>
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-base font-black text-slate-800 tracking-tight truncate">
                                {log.origin} 
                                {log.via ? <span className="text-slate-400 text-xs mx-1">→ {log.via} →</span> : <span className="text-slate-400 text-xs mx-2">→</span>}
                                {log.destination}
                              </p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">{log.date}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap md:flex-nowrap gap-4 md:gap-8 items-center w-full md:w-auto justify-between md:justify-end mt-2 md:mt-0 pl-[4.5rem] md:pl-0">
                            <div className="text-left md:text-right">
                              <p className="text-[9px] text-slate-400 font-bold uppercase">Points</p>
                              <p className="text-base font-black text-[#003184]">{log.pp.toLocaleString()} <span className="text-[9px] font-normal">PP</span></p>
                            </div>
                            <div className="text-left md:text-right">
                              <p className="text-[9px] text-slate-400 font-bold uppercase">Price</p>
                              <p className="text-sm font-bold text-slate-700">¥{log.price.toLocaleString()}</p>
                            </div>
                            <div className="text-left md:text-right hidden sm:block">
                              <p className="text-[9px] text-slate-400 font-bold uppercase">Rate</p>
                              <p className="text-sm font-bold text-slate-500">¥{(log.pp > 0 ? log.price / log.pp : 0).toFixed(1)}</p>
                            </div>
                            
                            {/* アクションボタン */}
                            <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all">
                              <button onClick={() => copyLog(log)} className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg bg-blue-50/50 transition-colors" title="複製">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                              </button>
                              <button onClick={() => startEdit(log)} className="p-2 text-slate-500 hover:bg-slate-200 rounded-lg bg-slate-100 transition-colors" title="編集">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              </button>
                              <button onClick={() => deleteLog(log.id)} className="p-2 text-red-400 hover:bg-red-100 hover:text-red-600 rounded-lg bg-red-50/50 transition-colors" title="削除">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
             </div>
          </div>

          {/* 更新履歴 */}
          <div className="mt-4">
             <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span>Update History
             </h2>
             <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <ul className="space-y-4">
                  <li className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                    <div className="bg-slate-100 text-slate-500 text-[10px] font-mono font-bold px-3 py-1 rounded w-fit">
                      2026.02.19
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-700">SFC修行トラッカー サイト開設 🚀</p>
                      <p className="text-xs text-slate-500 mt-1">ベータ版としてダッシュボード、フライトPP計算機を公開しました。</p>
                    </div>
                  </li>
                </ul>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}