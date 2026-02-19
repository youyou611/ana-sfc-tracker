import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'SFC修行トラッカー 2026',
  description: 'ANA SFC修行のプレミアムポイントとフライト履歴を管理するパーソナルツール',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="bg-slate-50 flex min-h-screen font-sans">
        
        {/* Gemini風 ホバーで開くサイドバー */}
        <nav className="fixed left-0 top-0 h-full bg-[#002561] text-white transition-all duration-300 w-16 hover:w-64 z-50 overflow-hidden group shadow-2xl flex flex-col border-r border-blue-900">
          
          {/* 上部：ロゴエリア */}
          <div className="h-20 flex items-center px-5 border-b border-blue-800/50 w-64 whitespace-nowrap bg-[#001b47]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
            </svg>
            <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
              <span className="font-black tracking-widest text-sm block leading-none">SFC TRACKER</span>
              <span className="text-[8px] text-blue-400 font-bold uppercase tracking-widest">Personal Dashboard</span>
            </div>
          </div>

          {/* 中央：メニューアイテム群 */}
          <div className="flex-1 py-6 space-y-2 w-64">
            
            {/* 1. ダッシュボード */}
            <Link href="/" className="flex items-center px-5 py-3 hover:bg-blue-800/50 transition-colors text-slate-300 hover:text-white group/item">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 group-hover/item:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              <span className="ml-4 text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">ダッシュボード</span>
            </Link>

            {/* 2. フライト登録 */}
            <Link href="/flight" className="flex items-center px-5 py-3 hover:bg-blue-800/50 transition-colors text-slate-300 hover:text-white group/item">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 group-hover/item:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              <span className="ml-4 text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">フライト予定・登録</span>
            </Link>

            <div className="my-4 border-t border-blue-800/50 w-full"></div>

            {/* 3. ガイド/説明ページ */}
            <Link href="/guide" className="flex items-center px-5 py-3 hover:bg-blue-800/50 transition-colors text-slate-300 hover:text-white group/item">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 group-hover/item:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              <span className="ml-4 text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">SFC修行とは？・使い方</span>
            </Link>

            {/* 4. データ保存（バックアップ） */}
            <Link href="/backup" className="flex items-center px-5 py-3 hover:bg-blue-800/50 transition-colors text-slate-300 hover:text-white group/item">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 group-hover/item:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
              <span className="ml-4 text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">データの保存・復元</span>
            </Link>

          </div>
          
          {/* 下部：フッター情報 */}
          <div className="p-5 border-t border-blue-800/50 w-64 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[#001b47]">
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Version 1.1.0</p>
            <p className="text-[9px] text-slate-500 mt-1">Ready for 2026 Flight Log</p>
          </div>
        </nav>

        {/* 右側：メインコンテンツ */}
        {/* サイドバーが閉じている時(16px=4rem)の幅分だけ margin-left を開ける */}
        <main className="flex-1 ml-16 w-full relative">
          {children}
        </main>

      </body>
    </html>
  )
}