import type { Metadata } from 'next'
import './globals.css'
import ClientLayout from './ClientLayout'
import Script from 'next/script' // ← Next.js専用のスクリプト読み込み機能

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
        {/* AdSenseのコードはエラーを防ぐため、ここではなく下の <Script> で読み込みます */}
      </head>

      <body className="bg-slate-50">
        
        {/* Google AdSense の審査用コード */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7337147183489280"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />

        {/* サイドバーとメインコンテンツ */}
        <ClientLayout>
          {children}
        </ClientLayout>
        
      </body>
    </html>
  )
}