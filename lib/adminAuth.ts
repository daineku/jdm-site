import { NextRequest } from 'next/server'

// ── In-memory rate limiting ───────────────────────────────────────────────────
// This is a minimum friction layer against accidental hammering and basic scripted
// probing. It is NOT a complete defense against distributed attacks — it is
// per-serverless-instance and lost on cold starts.
// For production-grade rate limiting, use Vercel Edge Middleware with KV storage.
const RATE_WINDOW_MS = 60_000   // 1 minute
const RATE_MAX = 60             // max requests per window per IP

const attempts = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = attempts.get(ip)

  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }

  if (entry.count >= RATE_MAX) return false

  entry.count++
  return true
}

export function isAuthed(req: NextRequest): boolean {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  if (!checkRateLimit(ip)) {
    return false  // 429 handled by callers checking isAuthed return value
  }

  const secret = req.headers.get('x-admin-secret')
  return !!secret && secret === process.env.ADMIN_SECRET_PATH
}
