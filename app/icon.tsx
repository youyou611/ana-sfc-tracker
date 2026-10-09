import { ImageResponse } from 'next/og'

// PWA用アイコン（/icon/192, /icon/512）をビルド時に生成
export function generateImageMetadata() {
  return [
    { id: '192', size: { width: 192, height: 192 }, contentType: 'image/png' },
    { id: '512', size: { width: 512, height: 512 }, contentType: 'image/png' },
  ]
}

export default async function Icon({ id }: { id: Promise<string> | string }) {
  const size = Number(await id)
  return new ImageResponse(<AppIcon size={size} />, { width: size, height: size })
}

export function AppIcon({ size }: { size: number }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #002561 0%, #003184 55%, #0050b3 100%)',
        color: 'white',
      }}
    >
      <svg width={size * 0.42} height={size * 0.42} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
      <div style={{ fontSize: size * 0.16, fontWeight: 900, letterSpacing: size * 0.01, marginTop: size * 0.04 }}>SFC</div>
    </div>
  )
}
