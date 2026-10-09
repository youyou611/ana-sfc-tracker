"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// メニュー定義（サイドバーとボトムタブで共通）
const NAV_ITEMS = [
  { href: "/", label: "ダッシュボード", shortLabel: "ホーム", iconPath: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" },
  { href: "/logs", label: "フライト履歴", shortLabel: "フライト", iconPath: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8" },
  { href: "/calc", label: "PP計算ツール", shortLabel: "計算機", iconPath: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" },
  { href: "/settings", label: "設定・バックアップ", shortLabel: "設定", iconPath: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
];

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => setIsOpen(!isOpen);
  const handleMenuClick = () => setIsOpen(false);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const currentItem = NAV_ITEMS.find(item => isActive(item.href));

  return (
    <div className="bg-slate-50 min-h-screen font-sans flex transition-colors duration-500">
      
      {/* サイドバー本体（PCのみ） */}
      <aside
        className={`hidden md:flex fixed left-0 top-0 h-full bg-[#002561] text-white z-50 flex-col border-r border-blue-900 shadow-2xl overflow-hidden
        transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${isOpen ? "w-72" : "w-20"} 
        `}
      >
        {/* ハンバーガーメニュー ＆ ロゴエリア */}
        <div className="h-20 flex items-center shrink-0 border-b border-blue-800/50 bg-[#001b47] relative px-0">
          <button
            onClick={toggleSidebar}
            className="h-20 w-20 flex items-center justify-center hover:bg-white/10 transition-colors shrink-0 outline-none"
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
        <nav className="flex-1 py-6 space-y-2 overflow-y-auto overflow-x-hidden">
          {NAV_ITEMS.slice(0, 2).map(item => (
            <MenuItem key={item.href} href={item.href} iconPath={item.iconPath} label={item.label} isOpen={isOpen} isActive={isActive(item.href)} onClick={handleMenuClick} />
          ))}
          
          <div className="my-4 mx-4 border-t border-blue-800/50"></div>

          {NAV_ITEMS.slice(2).map(item => (
            <MenuItem key={item.href} href={item.href} iconPath={item.iconPath} label={item.label} isOpen={isOpen} isActive={isActive(item.href)} onClick={handleMenuClick} />
          ))}
        </nav>

        {/* フッター */}
        <div className={`p-6 border-t border-blue-800/50 bg-[#001b47] transition-opacity duration-300 delay-75 ${isOpen ? "opacity-100" : "opacity-0"}`}>
          <div className="whitespace-nowrap overflow-hidden">
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Version 1.1.0</p>
            <p className="text-[10px] text-slate-500 mt-1">Status: Platinum</p>
          </div>
        </div>
      </aside>

      {/* メインコンテンツエリア */}
      <main className={`flex-1 w-full min-w-0 relative transition-[margin] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ml-0 ${isOpen ? "md:ml-72" : "md:ml-20"}
        pb-[calc(7rem+env(safe-area-inset-bottom))] md:pb-0`}>

        {/* スマホ用トップバー */}
        <header className="md:hidden sticky top-0 z-40 bg-[#002561]/95 backdrop-blur-md text-white pt-[env(safe-area-inset-top)] shadow-md">
          <div className="h-12 px-4 flex items-center justify-between">
            <Link href="/" className="flex items-baseline gap-2">
              <span className="font-black tracking-widest text-sm">SFC TRACKER</span>
            </Link>
            <span className="text-[11px] font-bold text-blue-200">{currentItem?.label ?? ""}</span>
          </div>
        </header>

        {children}
      </main>

      {/* スマホ用 リキッド・フローティング タブバー */}
      <nav
        className="md:hidden fixed inset-x-0 z-50 flex justify-center pointer-events-none px-4"
        style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
        aria-label="メインメニュー"
      >
        <div className="pointer-events-auto w-full max-w-sm bg-white/80 backdrop-blur-2xl border border-white/60 shadow-[0_12px_36px_rgba(0,37,97,0.18),0_2px_8px_rgba(0,0,0,0.06)] rounded-full p-1.5 flex items-center justify-between gap-1">
          {NAV_ITEMS.map(item => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                  active
                    ? "bg-gradient-to-r from-[#002b70] via-[#003d99] to-[#0050b3] text-white shadow-[0_4px_16px_rgba(0,49,132,0.35)] scale-[1.03]"
                    : "text-slate-400 hover:text-slate-700 active:scale-90"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <span className="flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 transition-transform duration-300 ${active ? "scale-110 drop-shadow" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.4 : 2} d={item.iconPath} />
                  </svg>
                </span>
                <span className={`text-[10px] mt-0.5 tracking-tight transition-all leading-none ${active ? "font-black" : "font-semibold"}`}>
                  {item.shortLabel}
                </span>
              </Link>
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
    <Link
      href={href}
      onClick={onClick}
      className={`
        flex items-center h-14 mx-3 rounded-xl transition-all duration-200 group relative overflow-hidden
        ${isActive ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:bg-white/10 hover:text-white"}
      `}
      title={!isOpen ? label : ""}
    >
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
  );
}