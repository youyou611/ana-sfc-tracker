"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useFlightData } from "./hooks/useFlightData";

function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startVal = displayValue;
    const endVal = value;
    if (startVal === endVal) return;
    const duration = 800;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(startVal + (endVal - startVal) * ease));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <span className="tabular-nums">{displayValue.toLocaleString()}</span>;
}

const UPDATE_HISTORY = [
  {
    date: "2026.10.02",
    title: "ANA国際線PP計算に対応 ✈️",
    description: "ANA国際線のPP計算に対応しました。",
    isNew: true,
  },
  {
    date: "2026.10.01",
    title: "ANA国際線に対応しました ✈️",
    description: "フライト登録画面に「ANA 国際線」タブを追加しました。区間基本マイル・路線倍率・運賃種別ごとの積算率から、国際線のPPも自動で計算できます。",
  },
  {
    date: "2026.02.19",
    title: "フライトトラッカー サイト開設 🚀",
    description: "ベータ版としてANA国内線のダッシュボード、フライトPP計算機を公開しました。",
  },
];

const anaTargetOptions: Record<string, { label: string, pp: number }> = {
  bronze_ls: { label: "ブロンズ (LS)", pp: 15000 },
  bronze_std: { label: "ブロンズ (通常)", pp: 30000 },
  platinum_ls: { label: "プラチナ (LS)", pp: 30000 },
  platinum_std: { label: "プラチナ/SFC (通常)", pp: 50000 },
  diamond_ls_5m: { label: "ダイヤ (LS/500万)", pp: 50000 },
  diamond_ls_4m: { label: "ダイヤ (LS/400万)", pp: 80000 },
  diamond_std: { label: "ダイヤモンド (通常)", pp: 100000 },
};

export default function Home() {
  const router = useRouter();
  const { logs, settings, isLoaded, updateSettings } = useFlightData();

  if (!isLoaded) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-slate-400 font-bold text-sm">読み込み中...</p></div>;

  const currentYear = new Date().getFullYear();
  
  // Filter by year and airline
  const currentYearLogs = logs
    .filter(log => log.year === currentYear && log.airline === 'ANA')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingFlights = currentYearLogs.filter(log => log.date >= todayStr);
  const nextFlight = upcomingFlights.length > 0 ? upcomingFlights[0] : null;

  const currentPP = currentYearLogs.reduce((sum, log) => sum + log.pp, 0);
  const currentSpent = currentYearLogs.reduce((sum, log) => sum + log.price, 0);
  const avgPPPrice = currentPP > 0 ? (currentSpent / currentPP).toFixed(1) : "0.0";
  
  const targetOptions = anaTargetOptions;
  const targetType = settings.anaTargetType;
  const targetPP = targetOptions[targetType]?.pp || 50000;
  
  const progressPercent = Math.min((currentPP / targetPP) * 100, 100);
  const remainingPP = Math.max(targetPP - currentPP, 0);
  const isAchieved = currentPP >= targetPP;

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const themeColors = {
    bg: 'bg-gradient-to-br from-[#002561] to-[#001540]',
    accent: 'text-blue-400',
    accentLight: 'text-blue-200',
    circleBg: 'text-blue-900/50',
    unit: 'PP',
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
      className="min-h-screen bg-slate-50 text-slate-900 pb-24 font-sans"
    >
      
      {/* ヒーローセクション */}
      <motion.div 
        layout
        className={`text-white pt-6 pb-10 px-6 rounded-b-[2.5rem] shadow-lg relative overflow-hidden transition-colors duration-700 ${themeColors.bg}`}
      >
        <div className="relative z-10 flex flex-col items-center">
          
          <p className="text-xs font-black tracking-[0.25em] text-blue-200 mb-6">ANA SFC TRACKER</p>

          <div className="flex justify-between w-full items-center mb-4">
            <span className={`text-[10px] font-bold ${themeColors.accentLight} uppercase tracking-widest`}>{currentYear} STATUS</span>
            <select
              aria-label="目標ステータス"
              value={targetType}
              onChange={(event) => updateSettings({ anaTargetType: event.target.value })}
              className="max-w-[60%] bg-white/10 hover:bg-white/20 border border-white/15 rounded-full px-3 py-1.5 text-xs font-bold text-white outline-none"
            >
              {Object.entries(targetOptions).map(([value, option]) => <option key={value} value={value} className="text-slate-900">{option.label}</option>)}
            </select>
          </div>

          <div className="relative w-48 h-48 flex items-center justify-center">
            {/* ゲージ背面のアンビエントグロー */}
            <div className="absolute inset-4 rounded-full bg-blue-400/15 blur-xl pointer-events-none" />
            <svg className="transform -rotate-90 w-full h-full relative z-10" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className={themeColors.circleBg} />
              <motion.circle 
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, type: "spring", bounce: 0.2 }}
                cx="70" cy="70" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" 
                strokeDasharray={circumference} 
                className={`${themeColors.accent}`} strokeLinecap="round" 
              />
            </svg>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-20">
              <span className={`text-[10px] font-bold ${themeColors.accentLight} tracking-wider`}>CURRENT {themeColors.unit}</span>
              <motion.div 
                key={currentPP}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-4xl font-black tracking-tighter mt-1"
              >
                <AnimatedNumber value={currentPP} />
              </motion.div>
              {isAchieved ? (
                <span className="text-[10px] font-bold text-emerald-300 mt-1 bg-emerald-900/40 border border-emerald-400/30 px-2.5 py-0.5 rounded-full animate-glow-achievement">ACHIEVED 🎉</span>
              ) : (
                <span className={`text-[10px] font-bold ${themeColors.accentLight} mt-1 tabular-nums`}>/ {targetPP.toLocaleString()}</span>
              )}
            </div>
          </div>

          {!isAchieved && (
            <motion.div layout className="mt-4 text-center">
              <p className="text-xs text-blue-100">目標達成まで残り <span className="font-bold text-white text-base tabular-nums">{remainingPP.toLocaleString()}</span> {themeColors.unit}</p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* FAB (Floating Action Button) for Adding Flights */}
      <div className="px-6 -mt-6 relative z-20">
        <motion.button 
          whileTap={{ scale: 0.96 }}
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          onClick={() => router.push('/calc')}
          className="w-full bg-white rounded-2xl p-4 shadow-lg hover:shadow-xl border border-slate-100 flex items-center justify-between group transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center transition-colors bg-blue-50 text-[#003184] group-hover:bg-blue-100 group-hover:scale-105 duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            </div>
            <div className="text-left">
              <h3 className="font-black text-sm text-[#003184]">フライトを登録する</h3>
              <p className="text-[10px] font-bold text-slate-400">実績や今後の予定を追加</p>
            </div>
          </div>
          <div className="text-slate-300 group-hover:text-blue-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </div>
        </motion.button>
      </div>

      {/* 統計サマリー */}
      <div className="px-6 mt-8">
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">修行の効率 (Stats)</h3>
        <div className="grid grid-cols-2 gap-4">
          <motion.div 
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md border border-slate-100 flex flex-col justify-between transition-all"
          >
            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </span>
              平均 PP単価
            </span>
            <span className="text-2xl font-black mt-2 flex items-end gap-1 text-[#003184] tabular-nums tracking-tight">
              {avgPPPrice} <span className="text-[10px] font-bold text-slate-400 mb-1">円/{themeColors.unit}</span>
            </span>
          </motion.div>
          <motion.div 
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md border border-slate-100 flex flex-col justify-between transition-all"
          >
            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </span>
              累計費用
            </span>
            <span className="text-xl font-black mt-2 flex items-end gap-1 text-[#003184] tabular-nums tracking-tight">
              <span className="text-[14px] mb-0.5 font-bold text-slate-400">¥</span>{currentSpent.toLocaleString()}
            </span>
          </motion.div>
          
          <motion.div 
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md border border-slate-100 flex justify-between items-center col-span-2 transition-all"
          >
             <span className="text-[11px] font-bold text-slate-600 flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
               今年の搭乗回数
             </span>
             <span className="text-lg font-black text-[#003184] tabular-nums">{currentYearLogs.length} <span className="text-xs text-slate-400 font-bold">フライト</span></span>
          </motion.div>
        </div>
      </div>

      {/* 次のフライト */}
      <AnimatePresence>
        {nextFlight && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="px-6 mt-8">
            <div className="flex justify-between items-end mb-3 ml-1">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>Next Flight
              </h3>
              <Link href="/logs" className="text-[10px] font-bold text-blue-500 hover:underline">すべて見る →</Link>
            </div>
            <motion.div 
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md border border-slate-100 flex items-center gap-4 relative overflow-hidden transition-all group"
            >
              <div className="absolute top-0 right-0 w-2 h-full bg-blue-500"></div>
              {/* 出発日バッジ */}
              <div className="bg-gradient-to-b from-blue-50 to-blue-100/60 w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-xs shrink-0 border border-blue-200/50 text-[#003184]">
                <span className="text-[10px] font-black tracking-wider leading-none text-blue-600">{new Date(nextFlight.date).getMonth() + 1}月</span>
                <span className="text-xl font-black leading-none mt-1 tracking-tight">{new Date(nextFlight.date).getDate()}</span>
              </div>
              
              {/* ルート & 便名 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-black text-slate-800 text-base tracking-tight">{nextFlight.origin}</span>
                  {/* フライト航路アニメーション */}
                  <div className="flex items-center gap-1 flex-1 max-w-[120px] relative px-1">
                    <div className="h-[2px] w-full bg-slate-200 rounded-full relative overflow-hidden">
                      <div className="absolute inset-y-0 w-8 bg-blue-500 rounded-full animate-flight-line opacity-80" />
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-blue-500 shrink-0 transform rotate-90" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  </div>
                  <span className="font-black text-slate-800 text-base tracking-tight">{nextFlight.destination}</span>
                </div>
                
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-500 tabular-nums">
                    {nextFlight.pp.toLocaleString()} {themeColors.unit}
                  </span>
                  <span className="text-slate-300 text-xs">/</span>
                  <span className="text-[11px] font-bold text-slate-500 tabular-nums">
                    ¥{nextFlight.price.toLocaleString()}
                  </span>
                  {nextFlight.flightNumber && (
                    <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-mono font-bold border border-blue-100">
                      {nextFlight.flightNumber}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* インフォメーション & ベータ版について */}
      <div className="px-6 mt-8 space-y-4">
        <div>
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1 flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></span>Information
          </h3>
          <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50/40 border border-blue-200/70 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-[#003184] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">Beta</span>
              <h4 className="text-xs font-bold text-blue-900">SFC/JGC修行トラッカーへようこそ！</h4>
            </div>
            <p className="text-xs text-blue-950/80 leading-relaxed">
              ANAの修行記録とPP計算を管理できます。機材や座席などの搭乗メモも記録できます！
            </p>
          </div>
        </div>

        {/* アップデート履歴 */}
        <div>
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1 flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span>Update History
          </h3>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <ol className="relative border-l-2 border-slate-100 ml-1.5 space-y-4">
              {UPDATE_HISTORY.map((item) => (
                <li key={item.date + item.title} className="pl-5 relative">
                  <span className={`absolute -left-[7px] top-1 w-3 h-3 rounded-full border-2 border-white ${item.isNew ? "bg-emerald-500" : "bg-slate-300"}`}></span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400">{item.date}</span>
                    {item.isNew && (
                      <span className="bg-emerald-100 text-emerald-700 text-[9px] font-extrabold px-1.5 py-0.2 rounded">NEW</span>
                    )}
                  </div>
                  <h5 className="text-xs font-bold text-slate-800 mt-0.5">{item.title}</h5>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{item.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

    </motion.div>
  );
}


