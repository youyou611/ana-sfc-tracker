"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // サイドバーの開閉状態
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname(); // 現在のURLを取得

  // トグルボタンを押した時の処理
  const toggleSidebar = () => setIsOpen(!isOpen);

  // メニューをクリックした時の処理（自動で閉じる）
  const handleMenuClick = () => {
     // スマホなどの狭い画面や、PCでも「クリックしたら閉じてほしい」場合に有効
     setIsOpen(false);
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans flex transition-colors duration-500">
      
      {/* サイドバー本体 
        transition-all duration-300 cubic-bezier(...) でヌルッとした動きを実現
      */}
      <aside
        className={`fixed left-0 top-0 h-full bg-[#002561] text-white z-50 flex flex-col border-r border-blue-900 shadow-2xl overflow-hidden
        transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${isOpen ? "w-72" : "w-20"} 
        `}
      >
        {/* ハンバーガーメニュー ＆ ロゴエリア */}
        <div className="h-20 flex items-center shrink-0 border-b border-blue-800/50 bg-[#001b47] relative px-0">
          
          {/* ハンバーガーボタン */}
          <button
            onClick={toggleSidebar}
            className="h-20 w-20 flex items-center justify-center hover:bg-white/10 transition-colors shrink-0 outline-none"
            title={isOpen ? "メニューを閉じる" : "メニューを開く"}
          >
            <div className="relative w-6 h-6 flex flex-col justify-center gap-1.5">
              {/* ハンバーガーアイコンのアニメーション */}
              <span className={`block h-0.5 w-6 bg-blue-300 rounded-full transition-transform duration-300 ${isOpen ? "rotate-45 translate-y-2" : ""}`}></span>
              <span className={`block h-0.5 w-6 bg-blue-300 rounded-full transition-opacity duration-300 ${isOpen ? "opacity-0" : ""}`}></span>
              <span className={`block h-0.5 w-6 bg-blue-300 rounded-full transition-transform duration-300 ${isOpen ? "-rotate-45 -translate-y-2" : ""}`}></span>
            </div>
          </button>

          {/* ロゴテキスト（遅延表示でスムーズに） */}
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
          <MenuItem 
            href="/" 
            iconPath="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" 
            label="ダッシュボード" 
            isOpen={isOpen} 
            isActive={pathname === "/"} 
            onClick={handleMenuClick} 
          />
          
          <MenuItem 
            href="/flight" 
            iconPath="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
            label="フライト予定・登録" 
            isOpen={isOpen} 
            isActive={pathname === "/flight"} 
            onClick={handleMenuClick} 
          />

          <div className="my-4 mx-4 border-t border-blue-800/50"></div>

          <MenuItem 
            href="/guide" 
            iconPath="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" 
            label="SFC修行とは？" 
            isOpen={isOpen} 
            isActive={pathname === "/guide"} 
            onClick={handleMenuClick} 
          />
          
          <MenuItem 
            href="/backup" 
            iconPath="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" 
            label="設定・バックアップ" 
            isOpen={isOpen} 
            isActive={pathname === "/backup"} 
            onClick={handleMenuClick} 
          />
        </nav>

        {/* フッター */}
        <div className={`p-6 border-t border-blue-800/50 bg-[#001b47] transition-opacity duration-300 delay-75 ${isOpen ? "opacity-100" : "opacity-0"}`}>
          <div className="whitespace-nowrap overflow-hidden">
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Version 1.1.0</p>
            <p className="text-[10px] text-slate-500 mt-1">Status: Platinum</p>
          </div>
        </div>
      </aside>

      {/* メインコンテンツエリア 
        サイドバーの幅に合わせて左マージンをアニメーションさせる
      */}
      <main 
        className={`flex-1 w-full relative transition-[margin] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isOpen ? "ml-72" : "ml-20"}`}
      >
        {children}
      </main>

      {/* スマホ用：サイドバーが開いている時の背景暗転（PCではクリックできないようにするレイヤーとしても機能） */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

// 共通メニューコンポーネント
function MenuItem({ 
  href, 
  iconPath, 
  label, 
  isOpen, 
  isActive, 
  onClick 
}: { 
  href: string; 
  iconPath: string; 
  label: string; 
  isOpen: boolean; 
  isActive: boolean;
  onClick: () => void;
}) {
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
      {/* アイコン */}
      <div className="w-14 flex justify-center shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
        </svg>
      </div>

      {/* ラベルテキスト（スムーズな表示） */}
      <span
        className={`text-sm font-bold whitespace-nowrap transition-all duration-300 origin-left ${
          isOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 w-0"
        }`}
      >
        {label}
      </span>
      
      {/* ホバー時の光るエフェクト（閉じてる時用） */}
      {!isOpen && !isActive && (
        <div className="absolute inset-y-0 right-0 w-1 bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity rounded-l-full"></div>
      )}
    </Link>
  );
}