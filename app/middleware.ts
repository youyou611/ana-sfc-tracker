import { NextRequest, NextResponse } from 'next/server'

export const config = {
  // 制限をかけるページ（全ページ対象）
  matcher: ['/:path*'],
}

export function middleware(req: NextRequest) {
  const basicAuth = req.headers.get('authorization')

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1]
    const [user, pwd] = atob(authValue).split(':')

    // ↓ここでIDとパスワードを設定（好きな文字に変えてください）
    if (user === 'admin' && pwd === 'sfcjgc2026') {
      return NextResponse.next()
    }
  }

  return new NextResponse('Auth Required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  })
}