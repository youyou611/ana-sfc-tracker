// app/ClientLayout.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // サイドバーの開閉状態（false=閉じている, true=開いている）
  const [isOpen, setIsOpen] = useState(false);

  // トグルボタンを押した時の処理
  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <div className="bg-slate-50 flex min-h-screen font-sans">
      {/* サイドバー 
        isOpenの状態によって幅(w-16 か w-64)が変わります
      */}
      <nav
        className={`fixed left-0 top-0 h-full bg-[#002561] text-white transition-all duration-300 z-50 flex flex-col border-r border-blue-900 shadow-2xl ${
          isOpen ? "w-64" : "w-16"
        }`}
      >
        {/* 上部：ハンバーガーメニュー ＆ ロゴエリア */}
        <div className="h-16 flex items-center px-0 border-b border-blue-800/50 whitespace-nowrap bg-[#001b47] relative">
          
          {/* ハンバーガーメニューボタン (三本線) */}
          <button
            onClick={toggleSidebar}
            className="h-16 w-16 flex items-center justify-center hover:bg-blue-800/50 transition-colors shrink-0 outline-none"
            aria-label="Toggle Menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-blue-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* ロゴ（開いている時だけ表示） */}
          <div
            className={`flex items-center transition-opacity duration-300 overflow-hidden ${
              isOpen ? "opacity-100 w-auto" : "opacity-0 w-0"
            }`}
          >
            <div className="ml-2">
              <span className="font-black tracking-widest text-sm block leading-none">
                SFC TRACKER
              </span>
              <span className="text-[8px] text-blue-400 font-bold uppercase tracking-widest">
                Personal Dashboard
              </span>
            </div>
          </div>
        </div>

        {/* 中央：メニューアイテム群 */}
        <div className="flex-1 py-4 space-y-1 overflow-x-hidden">
          <MenuItem href="/" iconPath="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" label="ダッシュボード" isOpen={isOpen} />
          
          <MenuItem href="/flight" iconPath="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" label="フライト予定・登録" isOpen={isOpen} />

          <div className="my-4 border-t border-blue-800/50 w-full"></div>

          <MenuItem href="/guide" iconPath="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" label="SFC修行とは？・使い方" isOpen={isOpen} />
          
          <MenuItem href="/backup" iconPath="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" label="データの保存・復元" isOpen={isOpen} />
        </div>

        {/* 下部：フッター情報（開いている時だけ表示） */}
        <div className={`p-5 border-t border-blue-800/50 whitespace-nowrap transition-opacity duration-300 bg-[#001b47] ${
            isOpen ? "opacity-100" : "opacity-0 hidden"
        }`}>
          <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">
            Version 1.1.0
          </p>
          <p className="text-[9px] text-slate-500 mt-1">
            Ready for 2026 Flight Log
          </p>
        </div>
      </nav>

      {/* 右側：メインコンテンツ 
        サイドバーの幅に合わせて左マージン(ml)を調整します
      */}
      <main className={`flex-1 w-full relative transition-all duration-300 ${
        isOpen ? "ml-64" : "ml-16"
      }`}>
        {children}
      </main>
    </div>
  );
}

// 共通のメニューアイテムコンポーネント
function MenuItem({ href, iconPath, label, isOpen }: { href: string; iconPath: string; label: string; isOpen: boolean }) {
  return (
    <Link
      href={href}
      className="flex items-center h-12 px-0 hover:bg-blue-800/50 transition-colors text-slate-300 hover:text-white group relative"
      title={!isOpen ? label : ""} // 閉じている時はツールチップとして表示
    >
      {/* アイコンは常に幅16 (w-16) の中心に配置 */}
      <div className="w-16 flex justify-center shrink-0">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={iconPath}
          />
        </svg>
      </div>

      {/* テキスト（開いている時だけ表示） */}
      <span
        className={`text-xs font-bold whitespace-nowrap transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
        }`}
      >
        {label}
      </span>
    </Link>
  );
}