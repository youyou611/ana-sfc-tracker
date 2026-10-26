import type { MetadataRoute } from 'next'

// PWAマニフェスト：Android/Chromeで「アプリをインストール」できるようにする
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SFC Tracker',
    short_name: 'SFC Tracker',
    description: '青組マイラーのためのプレミアムポイント計算・フライト記録ツール。ANAのSFC修行やPP管理に対応した非公式ツールです。',
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

