import type { MetadataRoute } from 'next'

// PWAマニフェスト：Android/Chromeで「アプリをインストール」できるようにする
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SFC修行トラッカー',
    short_name: 'SFCトラッカー',
    description: 'ANA SFC修行のプレミアムポイントとフライト履歴を管理するパーソナルツール',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f8fafc',
    theme_color: '#002561',
    lang: 'ja',
    icons: [
      { src: '/icon/192', sizes: '192x192', type: 'image/png' },
      { src: '/icon/512', sizes: '512x512', type: 'image/png' },
      { src: '/icon/512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
