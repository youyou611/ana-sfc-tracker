import type { Metadata, Viewport } from 'next'
import "@/shared/route-map/WorldRouteMap.css";
import './globals.css'
import ClientLayout from './ClientLayout'
import Script from 'next/script' // ← Next.js専用のスクリプト読み込み機能

export const metadata: Metadata = {
  title: 'SFC Tracker',
  description: '青組マイラーのためのプレミアムポイント計算・フライト記録ツール。ANAのSFC修行やプレミアムポイント（PP）管理に対応した非公式ツールです。',
  applicationName: 'SFC Tracker',
  keywords: ['SFC Tracker', 'SFC修行', 'ANA', 'プレミアムポイント', 'PP計算', 'フライト記録', '非公式ツール'],
  // iPhoneで「ホーム画面に追加」したときにアプリとして起動させる設定
  appleWebApp: {
    capable: true,
    title: 'SFC Tracker',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: { telephone: false },
}

// スマホのノッチ・ホームバー領域まで描画し、ブラウザUIの色をブランドカラーに合わせる
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#070F1E',
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

      <body className="bg-[#070F1E] antialiased" style={{ backgroundColor: '#070F1E' }}>
        
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

