import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const adminPath = process.env.ADMIN_SECRET_PATH

  // Mark admin routes so the root layout can suppress the public header.
  // This is server-side — no client flickering.
  if (adminPath && request.nextUrl.pathname.startsWith(`/${adminPath}`)) {
    response.headers.set('x-is-admin', '1')
  }

  return response
}

export const config = {
  // Run on all routes except static assets and Next.js internals
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
