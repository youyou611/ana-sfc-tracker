import type { Metadata, Viewport } from 'next'
import "../shared/route-map/WorldRouteMap.css";
import './globals.css'
import ClientLayout from './ClientLayout'
import Script from 'next/script'
import { APP_NAME } from './lib/appIdentity'

export const metadata: Metadata = {
  title: APP_NAME,
  description: 'ANAのプレミアムポイント計算とフライト記録を管理する非公式ツールです。',
  applicationName: APP_NAME,
  keywords: [APP_NAME, 'SFC修行', 'ANA', 'プレミアムポイント', 'PP計算', 'フライト記録', '非公式ツール'],
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: 'black-translucent',
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0A1428',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head />
      <body className="bg-[#0A1428] antialiased" style={{ backgroundColor: '#0A1428' }}>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7337147183489280"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  )
}
