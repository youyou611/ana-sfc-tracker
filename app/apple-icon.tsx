import { ImageResponse } from 'next/og'
import { AppIcon } from './icon'

// iPhoneの「ホーム画面に追加」用アイコン
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(<AppIcon size={180} />, size)
}
