// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import ClientLayout from './ClientLayout' // 手順1で作ったファイルを読み込み

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
      <head>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7337147183489280" crossOrigin="anonymous"></script>
      </head>

      <body className="bg-slate-50">
        {/* クライアント側の動きは全てここで処理 */}
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  )
}