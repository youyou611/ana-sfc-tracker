import type { Metadata, Viewport } from 'next'
import './globals.css'
import ClientLayout from './ClientLayout'
import Script from 'next/script' // ← Next.js専用のスクリプト読み込み機能

export const metadata: Metadata = {
  title: 'SFC修行トラッカー 2026',
  description: 'ANA SFC修行のプレミアムポイントとフライト履歴を管理するパーソナルツール',
  applicationName: 'SFC修行トラッカー',
  // iPhoneで「ホーム画面に追加」したときにアプリとして起動させる設定
  appleWebApp: {
    capable: true,
    title: 'SFCトラッカー',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: { telephone: false },
}

// スマホのノッチ・ホームバー領域まで描画し、ブラウザUIの色をブランドカラーに合わせる
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#002561',
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