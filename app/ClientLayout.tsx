"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

// メインメニュー（ホーム / フライト / マップ / 統計 / 計算機 / 設定）
const NAV_ITEMS = [
  {
    href: "/",
    label: "ホーム",
    shortLabel: "ホーム",
    iconPath: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    href: "/logs",
    label: "フライト管理",
    shortLabel: "フライト",
    iconPath: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8",
  },
  {
    href: "/map",
    label: "路線マップ",
    shortLabel: "マップ",
    iconPath: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
  },
  {
    href: "/stats",
    label: "統計・分析",
    shortLabel: "統計",
    iconPath: "M3 3v18h18M8 15l4-4 4 3 5-7M8 9h.01M12 5h.01",
  },
  {
    href: "/calc",
    label: "PP計算機",
    shortLabel: "計算機",
    iconPath: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z",
  },
  {
    href: "/settings",
    label: "設定",
    shortLabel: "設定",
    iconPath: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  },
];

// ガイドはホームと設定からアクセス。メインナビは6項目。
const MOBILE_NAV_ITEMS = NAV_ITEMS;

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => setIsOpen(!isOpen);
  const handleMenuClick = () => setIsOpen(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/stats") return pathname.startsWith("/stats") || pathname.startsWith("/analytics");
    return pathname.startsWith(href);
  };

  return (
    <div className="sfc-app-shell bg-[#070F1E] min-h-screen font-sans flex transition-colors duration-300">
      
      {/* サイドバー本体（PCのみ） */}
      <aside
        className={`hidden md:flex fixed left-0 top-0 h-[100dvh] bg-[#001b47] text-white z-50 flex-col border-r border-white/10 shadow-[8px_0_32px_rgba(0,18,52,0.18)] overflow-hidden
        transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${isOpen ? "w-72" : "w-20"} 
        `}
      >
        {/* ハンバーガーメニュー ＆ ロゴエリア */}
        <div className="h-[4.5rem] flex items-center shrink-0 border-b border-white/10 bg-[#001438] relative px-0">
          <button
            onClick={toggleSidebar}
            className="h-[4.5rem] w-20 flex items-center justify-center hover:bg-white/10 focus-visible:bg-white/10 transition-colors shrink-0 outline-none"
            title={isOpen ? "メニューを閉じる" : "メニューを開く"}
          >
            <div className="relative w-6 h-6 flex flex-col justify-center gap-1.5">
              <span className={`block h-0.5 w-6 bg-blue-300 rounded-full transition-transform duration-300 ${isOpen ? "rotate-45 translate-y-2" : ""}`}></span>
              <span className={`block h-0.5 w-6 bg-blue-300 rounded-full transition-opacity duration-300 ${isOpen ? "opacity-0" : ""}`}></span>
              <span className={`block h-0.5 w-6 bg-blue-300 rounded-full transition-transform duration-300 ${isOpen ? "-rotate-45 -translate-y-2" : ""}`}></span>
            </div>
          </button>

          <div className={`transition-opacity duration-300 delay-100 absolute left-20 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
            <span className="font-black tracking-widest text-lg block leading-none whitespace-nowrap">
              SFC TRACKER
            </span>
            <span className="text-[9px] text-blue-400 font-bold uppercase tracking-[0.2em] whitespace-nowrap">
              Personal Dashboard
            </span>
          </div>
        </div>

        {/* メニューリスト */}
        <nav aria-label="メインメニュー" className="flex-1 py-5 space-y-1.5 overflow-y-auto overflow-x-hidden">
          {NAV_ITEMS.map(item => (
            <MenuItem key={item.href} href={item.href} iconPath={item.iconPath} label={item.label} isOpen={isOpen} isActive={isActive(item.href)} onClick={handleMenuClick} />
          ))}
        </nav>

        {/* フッター */}
        <div className={`p-6 border-t border-white/10 bg-[#001438] transition-opacity duration-300 delay-75 ${isOpen ? "opacity-100" : "opacity-0"}`}>
          <div className="whitespace-nowrap overflow-hidden">
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Version 2.0</p>
            <p className="text-[10px] text-slate-400 mt-1">Status: Platinum / SFC</p>
          </div>
        </div>
      </aside>

      {/* メインコンテンツエリア: 各ページがフルブリードで描画できるようFOUC防止背景とシームレスなトランジション */}
        <main id="main-content" className={`flex-1 w-full min-w-0 relative transition-[margin] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ml-0 ${isOpen ? "md:ml-72" : "md:ml-20"} bg-[#070F1E]`}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="min-w-0 min-h-screen bg-[#070F1E]"
            style={{ touchAction: "pan-y" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* スマホ用 リキッド・フローティング タブバー (カンプ準拠: 5項目固定) */}
      <nav
        className="md:hidden fixed inset-x-0 z-50 flex justify-center pointer-events-none px-3"
        style={{ bottom: "calc(0.6rem + env(safe-area-inset-bottom, 0px))" }}
        aria-label="メインメニュー"
      >
        <div className="pointer-events-auto w-full max-w-md bg-[#0B1D33]/95 backdrop-blur-2xl border border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.35)] rounded-[1.6rem] p-1.5 flex items-center justify-between gap-1">
          {MOBILE_NAV_ITEMS.map(item => {
            const active = isActive(item.href);
            return (
              <div key={item.href} className="relative flex-1 min-w-0">
                <Link
                  href={item.href}
                  className={`relative flex min-h-[46px] flex-col items-center justify-center py-1.5 px-0.5 rounded-2xl transition-all duration-200 ${
                    active ? "text-white" : "text-slate-400 hover:text-slate-200 active:scale-95"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {active && (
                    <motion.div
                      layoutId="ana-active-tab-indicator"
                      className="absolute inset-0 rounded-2xl bg-[#2878F0]/25 border border-[#78B7FF]/30"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-[1.25rem] w-[1.25rem] transition-transform duration-200 ${active ? "scale-105 stroke-[#8AB4FF]" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.3 : 1.8} d={item.iconPath} />
                    </svg>
                  </span>
                  <span className={`relative z-10 mt-0.5 text-[10px] tracking-tight leading-none whitespace-nowrap ${active ? "font-bold text-white" : "font-medium text-slate-400"}`}>
                    {item.shortLabel}
                  </span>
                </Link>
              </div>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

// 共通メニューコンポーネント
function MenuItem({ href, iconPath, label, isOpen, isActive, onClick }: { href: string; iconPath: string; label: string; isOpen: boolean; isActive: boolean; onClick: () => void; }) {
  return (
    <motion.div
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`
        flex items-center h-[3.25rem] mx-2.5 rounded-xl transition-[background-color,color] duration-200 group relative overflow-hidden
        ${isActive ? "bg-white/12 text-white shadow-[inset_3px_0_0_#78b7ff]" : "text-blue-100/70 hover:bg-white/[0.07] hover:text-white"}
      `}
      title={!isOpen ? label : ""}
    >
    <Link href={href} onClick={onClick} className="flex w-full items-center h-full rounded-xl focus-visible:outline-white" aria-current={isActive ? "page" : undefined}>
      <div className="w-14 flex justify-center shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
        </svg>
      </div>
      <span
        className={`text-sm font-bold whitespace-nowrap transition-all duration-300 origin-left ${
          isOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 w-0"
        }`}
      >
        {label}
      </span>
      {!isOpen && !isActive && (
        <div className="absolute inset-y-0 right-0 w-1 bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity rounded-l-full"></div>
      )}
    </Link>
    </motion.div>
  );
}
