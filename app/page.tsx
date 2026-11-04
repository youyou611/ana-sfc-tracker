"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import CountUp from "react-countup";
import { useFlightData } from "./hooks/useFlightData";
import { APP_NAME } from "./lib/appIdentity";

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
  const [showNotifications, setShowNotifications] = useState(false);

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
    <main className="flex h-[100dvh] min-h-[540px] flex-col overflow-hidden bg-[#070F1E] text-slate-900 font-sans">
      {/* ================= HERO SECTION (カンプ完全準拠: Full-bleed 机窓・富士山背景 + 透過ヘッダー + グラスゲージ) ================= */}
      <section className="relative flex min-h-0 flex-1 w-full flex-col bg-[#0A1428] text-white pt-[env(safe-area-inset-top)]">
        {/* 背景画像（機窓と富士山） */}
        <div className="absolute inset-0 h-full w-full z-0 overflow-hidden pointer-events-none">
          <Image
            src="/images/hero-wing-fuji.jpg"
              alt="機窓から見える富士山とANA機の主翼"
            fill
            priority
              className="object-cover object-[58%_center] opacity-90"
          />
          {/* 下方向へのダークグラデーションマスク */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#070F1E]/25 via-[#070F1E]/30 to-[#070F1E]/95" />
        </div>

        {/* 透過ヘッダー */}
        <header className="relative z-30 mx-auto flex w-full max-w-md shrink-0 items-center justify-between px-5 pt-3 pb-1 sm:max-w-xl">
          <div>
            <h1 className="text-sm sm:text-base font-black tracking-[0.14em] text-white/95">{APP_NAME}</h1>
          </div>
          <div className="relative flex items-center gap-2">
            <button
              type="button"
              aria-label="お知らせ"
              aria-expanded={showNotifications}
              aria-controls="home-notifications"
              onClick={() => setShowNotifications((current) => !current)}
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-[#0A1428]" />
            </button>
            {showNotifications && (
              <>
                <button type="button" aria-label="お知らせを閉じる" onClick={() => setShowNotifications(false)} className="fixed inset-0 z-30 cursor-default" />
                <section id="home-notifications" role="status" aria-label="お知らせ" className="absolute right-0 top-11 z-40 w-[min(19rem,calc(100vw-2.5rem))] rounded-2xl border border-slate-200/80 bg-white p-4 text-slate-900 shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-sm font-black">お知らせ</h2>
                    <button type="button" onClick={() => setShowNotifications(false)} aria-label="閉じる" className="rounded-lg px-2 py-1 text-lg leading-none text-slate-400 hover:bg-slate-100">×</button>
                  </div>
                  <div className="mt-3 rounded-xl bg-blue-50 p-3">
                    <p className="text-xs font-bold text-[#003184]">{APP_NAME} の使い方</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">フライトを登録すると、獲得PP・搭乗履歴・路線マップに反映されます。</p>
                    <Link href="/guide" onClick={() => setShowNotifications(false)} className="mt-2 inline-flex text-xs font-bold text-[#003184] underline underline-offset-2">ガイドを見る →</Link>
                  </div>
                  <p className="mt-3 text-[10px] leading-relaxed text-slate-400">現在、個別のお知らせはありません。</p>
                </section>
              </>
            )}
          </div>
        </header>

        {/* キャッチコピー */}
        <div className="relative z-10 mx-auto w-full max-w-md shrink-0 px-5 pt-1 pb-1 sm:max-w-xl">
          <p className="text-xs sm:text-sm font-medium text-white/80 leading-snug tracking-wide">
            SFCへの旅を、<br />
            もっと楽しく、もっと身近に。
          </p>
        </div>

        {/* ガラスモーフィック 円形ラジアルゲージ (カンプ中央プログレス) */}
        <div className="relative z-10 mx-auto flex w-full max-w-md shrink-0 flex-col items-center px-5 py-1 sm:max-w-xl">
          <div className="relative h-36 w-36 sm:h-40 sm:w-40 flex items-center justify-center">
            {/* 背景グラスサークル */}
            <div className="absolute inset-2 rounded-full bg-white/10 backdrop-blur-md border border-white/25 shadow-[0_8px_32px_rgba(0,0,0,0.36)]" />

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
        <div className="relative z-10 mx-auto w-full max-w-md shrink-0 space-y-2 px-5 pt-1 pb-2 sm:max-w-xl">
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
            className="w-full bg-[#2878F0] hover:bg-[#1E6AD8] text-white font-black py-3 px-4 rounded-2xl shadow-[0_8px_24px_rgba(40,120,240,0.35)] flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.98]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            フライトを登録
          </Link>
        </div>
      </section>

      {/* スクロールさせず、直近の1便だけをヒーロー内に表示 */}
      <section aria-labelledby="recent-heading" className="relative z-10 mx-auto mt-auto w-full max-w-md shrink-0 px-5 pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] sm:max-w-xl">
        <div className="mb-2 flex items-center justify-between">
          <h2 id="recent-heading" className="text-xs font-bold text-white/80">最近のフライト</h2>
          <Link href="/logs" className="text-[11px] font-bold text-sky-200 hover:text-white">一覧を見る →</Link>
        </div>
        {recentFlights[0] ? (
          <Link href="/logs" className="flex items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/10 p-2.5 text-white backdrop-blur-md hover:bg-white/15">
            <span className="min-w-0 truncate text-xs font-bold">{recentFlights[0].origin} → {recentFlights[0].destination}<span className="ml-2 text-[10px] font-medium text-white/60">{recentFlights[0].date} · {recentFlights[0].flightNumber || "便名未登録"}</span></span>
            <span className="shrink-0 text-xs font-black tabular-nums">+{recentFlights[0].pp.toLocaleString()} PP</span>
          </Link>
        ) : (
          <p className="rounded-2xl border border-white/15 bg-white/10 p-3 text-center text-[11px] text-white/70">フライトを登録すると、ここに表示されます。</p>
        )}
      </section>
    </main>
  );
}
