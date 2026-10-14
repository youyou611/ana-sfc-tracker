"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import CountUp from "react-countup";
import { useFlightData } from "./hooks/useFlightData";

const anaTargetOptions: Record<string, { label: string; pp: number }> = {
  bronze_ls: { label: "ブロンズ（LS）", pp: 15000 },
  bronze_std: { label: "ブロンズ（通常）", pp: 30000 },
  platinum_ls: { label: "プラチナ（LS）", pp: 30000 },
  platinum_std: { label: "プラチナ / SFC", pp: 50000 },
  diamond_ls_5m: { label: "ダイヤ（LS・500万）", pp: 50000 },
  diamond_ls_4m: { label: "ダイヤ（LS・400万）", pp: 80000 },
  diamond_std: { label: "ダイヤモンド", pp: 100000 },
};

function AnimatedNumber({ value }: { value: number }) {
  const reduceMotion = useReducedMotion();
  return <CountUp end={value} duration={reduceMotion ? 0 : 0.55} separator="," preserveValue className="tabular-nums" />;
}

export default function Home() {
  const { logs, settings, isLoaded, loadError, refreshLogs } = useFlightData();

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-[#0A1428] flex items-center justify-center text-white" aria-live="polite">
        <div className="text-center">
          <div className="h-10 w-10 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-sky-200">フライトデータを同期中...</p>
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="min-h-screen bg-[#0A1428] flex items-center justify-center p-6 text-white">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl text-center">
          <p className="text-sm font-bold">データを読み込めませんでした</p>
          <button
            type="button"
            onClick={() => void refreshLogs()}
            className="mt-4 px-5 py-2.5 bg-[#2878F0] rounded-xl text-xs font-bold"
          >
            再読み込み
          </button>
        </div>
      </main>
    );
  }

  const currentYear = new Date().getFullYear();
  const currentYearLogs = logs
    .filter((log) => log.year === currentYear && log.airline === "ANA")
    .sort((a, b) => a.date.localeCompare(b.date));
  const currentPP = currentYearLogs.reduce((sum, log) => sum + log.pp, 0);
  const currentSpent = currentYearLogs.reduce((sum, log) => sum + log.price, 0);
  const avgPPPrice = currentPP > 0 ? (currentSpent / currentPP).toFixed(1) : "0.0";
  const targetType = settings.anaTargetType;
  const targetPP = anaTargetOptions[targetType]?.pp || 50000;
  const progressPercent = Math.min((currentPP / targetPP) * 100, 100);
  const remainingPP = Math.max(targetPP - currentPP, 0);

  // SVG Gauge calculations
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // Recent flights (newest first)
  const recentFlights = [...currentYearLogs].reverse().slice(0, 3);

  return (
    <main className="min-h-screen bg-[#F4F7FB] text-slate-900 pb-28 font-sans">
      {/* ================= HERO SECTION (カンプ完全準拠: Full-bleed 机窓・富士山背景 + 透過ヘッダー + グラスゲージ) ================= */}
      <section className="relative w-full bg-[#0A1428] overflow-hidden text-white pt-[env(safe-area-inset-top)]">
        {/* 背景画像（機窓と富士山） */}
        <div className="absolute inset-0 h-[480px] sm:h-[520px] w-full z-0 overflow-hidden pointer-events-none">
          <Image
            src="/images/hero-wing-fuji.jpg"
            alt="机窓からの富士山と主翼"
            fill
            priority
            className="object-cover object-center opacity-85"
          />
          {/* 下方向へのダークグラデーションマスク */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A1428]/40 via-[#0A1428]/60 to-[#0A1428]" />
        </div>

        {/* 透過ヘッダー */}
        <header className="relative z-10 max-w-md sm:max-w-xl mx-auto px-5 pt-4 pb-2 flex items-center justify-between">
          <div>
            <h1 className="text-sm sm:text-base font-black tracking-[0.14em] text-white/95">ANA SFC TRACKER</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/settings"
              aria-label="通知と設定"
              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-[#0A1428]" />
            </Link>
          </div>
        </header>

        {/* キャッチコピー */}
        <div className="relative z-10 max-w-md sm:max-w-xl mx-auto px-5 pt-2 pb-4">
          <p className="text-xs sm:text-sm font-medium text-white/80 leading-relaxed tracking-wide">
            SFCへの旅を、<br />
            もっと楽しく、もっと身近に。
          </p>
        </div>

        {/* ガラスモーフィック 円形ラジアルゲージ (カンプ中央プログレス) */}
        <div className="relative z-10 max-w-md sm:max-w-xl mx-auto px-5 py-2 flex flex-col items-center">
          <div className="relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center">
            {/* 背景グラスサークル */}
            <div className="absolute inset-2 rounded-full bg-[#0A1428]/45 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.36)]" />

            {/* SVG Progress Circle */}
            <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 148 148">
              <defs>
                <linearGradient id="sfcGaugeGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="100%" stopColor="#2563EB" />
                </linearGradient>
              </defs>
              <circle
                cx="74"
                cy="74"
                r={radius}
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth="7"
                fill="none"
              />
              <motion.circle
                cx="74"
                cy="74"
                r={radius}
                stroke="url(#sfcGaugeGrad)"
                strokeWidth="7"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              />
            </svg>

            {/* ゲージ中央テキスト */}
            <div className="absolute z-20 flex flex-col items-center text-center">
              <span className="text-[10px] font-bold text-sky-200 tracking-wider">達成率</span>
              <span className="text-3xl sm:text-4xl font-black text-white tracking-tight tabular-nums mt-0.5">
                {progressPercent.toFixed(1)}<span className="text-lg font-bold">%</span>
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold text-white/70 tabular-nums mt-1">
                {currentPP.toLocaleString()} / {targetPP.toLocaleString()} PP
              </span>
            </div>
          </div>
        </div>

        {/* 3-Column Bento KPI Grid & Primary CTA (ゲージ直下) */}
        <div className="relative z-10 max-w-md sm:max-w-xl mx-auto px-5 pt-3 pb-8 space-y-3.5">
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-white/15 text-center">
              <span className="text-[10px] sm:text-xs font-semibold text-white/70 block">残り</span>
              <span className="text-sm sm:text-base font-black text-white tabular-nums mt-1 block">
                <AnimatedNumber value={remainingPP} />
              </span>
              <span className="text-[9px] font-bold text-sky-300">PP</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-white/15 text-center">
              <span className="text-[10px] sm:text-xs font-semibold text-white/70 block">平均PP単価</span>
              <span className="text-sm sm:text-base font-black text-white tabular-nums mt-1 block">
                {avgPPPrice}
              </span>
              <span className="text-[9px] font-bold text-sky-300">円/PP</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-white/15 text-center">
              <span className="text-[10px] sm:text-xs font-semibold text-white/70 block">累計費用</span>
              <span className="text-sm sm:text-base font-black text-white tabular-nums mt-1 block">
                <AnimatedNumber value={currentSpent} />
              </span>
              <span className="text-[9px] font-bold text-sky-300">円</span>
            </div>
          </div>

          {/* Primary CTA (+ フライトを登録) */}
          <Link
            href="/calc"
            className="w-full bg-[#2878F0] hover:bg-[#1E6AD8] text-white font-black py-3.5 px-4 rounded-2xl shadow-[0_8px_24px_rgba(40,120,240,0.35)] flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.98]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            フライトを登録
          </Link>
        </div>
      </section>

      {/* ================= CONTENT SECTION (最近のフライト ＆ サブウィジェット) ================= */}
      <div className="max-w-md sm:max-w-xl mx-auto px-5 pt-6 space-y-6">
        
        {/* 最近のフライト (カンプ準拠) */}
        <section aria-labelledby="recent-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="recent-heading" className="text-sm font-bold text-slate-900 tracking-tight">最近のフライト</h2>
            <Link href="/logs" className="text-xs font-bold text-[#003184] hover:text-blue-700">
              すべて見る →
            </Link>
          </div>

          {recentFlights.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden shadow-sm">
              {recentFlights.map((flight) => (
                <Link
                  key={flight.id}
                  href="/logs"
                  className="p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 relative overflow-hidden shrink-0 flex items-center justify-center text-white">
                      <Image
                        src="/images/hero-wing-fuji.jpg"
                        alt={flight.destination}
                        fill
                        className="object-cover opacity-80"
                      />
                      <span className="relative z-10 text-[10px] font-black">{flight.destination}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {flight.origin} → {flight.destination}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {flight.date} {flight.operatingCarrier || "ANA"} {flight.flightNumber || ""}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-xs sm:text-sm font-black text-[#003184] tabular-nums block">
                      +{flight.pp.toLocaleString()} PP
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-xs text-slate-500">
              まだ登録されたフライトがありません。「+ フライトを登録」から追加してください。
            </div>
          )}
        </section>

        {/* サブビューへのショートカット（カンプ下段4連: 統計・分析 / 空港コレクション / SFCガイド / 設定） */}
        <section aria-labelledby="subwidgets-heading" className="space-y-3">
          <h2 id="subwidgets-heading" className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            アナリティクス ＆ ツール
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            <Link
              href="/stats"
              className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between group"
            >
              <div>
                <span className="p-2 rounded-xl bg-blue-50 text-[#003184] inline-block mb-2 group-hover:scale-105 transition-transform">
                  📊
                </span>
                <h3 className="text-xs font-bold text-slate-800">統計・分析</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">修行のコスパや傾向を可視化</p>
              </div>
              <span className="text-[10px] font-bold text-blue-600 mt-2">開く →</span>
            </Link>

            <Link
              href="/guide"
              className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between group"
            >
              <div>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 inline-block mb-2 group-hover:scale-105 transition-transform">
                  🗺️
                </span>
                <h3 className="text-xs font-bold text-slate-800">空港コレクション</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">訪れた空港を地図と一覧で記録</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 mt-2">開く →</span>
            </Link>

            <Link
              href="/guide"
              className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between group"
            >
              <div>
                <span className="p-2 rounded-xl bg-amber-50 text-amber-700 inline-block mb-2 group-hover:scale-105 transition-transform">
                  📖
                </span>
                <h3 className="text-xs font-bold text-slate-800">SFCガイド</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">最新ルール・ラウンジ情報を確認</p>
              </div>
              <span className="text-[10px] font-bold text-amber-600 mt-2">開く →</span>
            </Link>

            <Link
              href="/settings"
              className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between group"
            >
              <div>
                <span className="p-2 rounded-xl bg-slate-100 text-slate-700 inline-block mb-2 group-hover:scale-105 transition-transform">
                  ⚙️
                </span>
                <h3 className="text-xs font-bold text-slate-800">設定・データ管理</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">目標変更とバックアップ</p>
              </div>
              <span className="text-[10px] font-bold text-slate-600 mt-2">開く →</span>
            </Link>
          </div>
        </section>

      </div>
    </main>
  );
}
