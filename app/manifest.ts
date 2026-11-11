import type { MetadataRoute } from 'next'
import { APP_NAME } from './lib/appIdentity'

// PWAマニフェスト：Android/Chromeで「アプリをインストール」できるようにする
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: 'ANAのプレミアムポイント計算とフライト記録を管理する非公式ツールです。',
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

