import { NextRequest, NextResponse } from 'next/server'

const ADMIN_FLAG = 'x-is-admin'

export function middleware(request: NextRequest) {
  const adminPath = process.env.ADMIN_SECRET_PATH

  // Mark admin routes so the root layout can suppress the public header/footer.
  // The flag is forwarded on the *request* (the documented Next.js mechanism) —
  // headers() in the layout reads request headers. It is never set on the
  // response, and any client-supplied value is discarded so a visitor cannot
  // spoof it on public pages.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.delete(ADMIN_FLAG)

  const { pathname } = request.nextUrl
  if (adminPath && (pathname === `/${adminPath}` || pathname.startsWith(`/${adminPath}/`))) {
    requestHeaders.set(ADMIN_FLAG, '1')
  }

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  // Run on all routes except static assets and Next.js internals
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
