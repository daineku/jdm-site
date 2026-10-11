import { NextResponse, type NextRequest } from 'next/server'
import { validateEnquiry } from '@/lib/contact'
import { deliverEnquiry } from '@/lib/contactDelivery'

export const dynamic = 'force-dynamic'

const MAX_BODY_BYTES = 16_000
// A person needs more than this to fill in the form; scripted posts usually don't wait.
const MIN_FILL_MS = 2_500
// Best-effort per server instance (serverless instances don't share memory). It stops
// bursts from one client; it is not a global quota.
const WINDOW_MS = 10 * 60_000
const MAX_PER_WINDOW = 5
const hits = new Map<string, number[]>()

function rateLimited(key: string, now: number): boolean {
  const recent = (hits.get(key) ?? []).filter(t => now - t < WINDOW_MS)
  recent.push(now)
  hits.set(key, recent)
  if (hits.size > 5_000) {
    for (const [k, ts] of hits) if (ts.every(t => now - t >= WINDOW_MS)) hits.delete(k)
  }
  return recent.length > MAX_PER_WINDOW
}

function clientKey(req: NextRequest): string {
  return req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

function sameSite(origin: string, req: NextRequest): boolean {
  let host: string
  try { host = new URL(origin).host } catch { return false }
  return host === req.nextUrl.host || host === (req.headers.get('x-forwarded-host') || req.headers.get('host'))
}

const fail = (status: number, error: string, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ ok: false, error, ...extra }, { status, headers: { 'Cache-Control': 'no-store' } })

export async function POST(req: NextRequest) {
  // Browsers always send Origin on a cross-origin POST; refuse submissions from other sites.
  const origin = req.headers.get('origin')
  if (origin && !sameSite(origin, req)) return fail(403, 'forbidden')
  if (!req.headers.get('content-type')?.includes('application/json')) return fail(415, 'unsupported_media_type')

  const raw = await req.text()
  if (raw.length > MAX_BODY_BYTES) return fail(413, 'too_large')
  let data: Record<string, unknown>
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return fail(400, 'invalid_request')
    data = parsed as Record<string, unknown>
  } catch {
    return fail(400, 'invalid_request')
  }

  // Honeypot: a hidden field people never see. Answer as if accepted so bots learn nothing.
  if (typeof data.website === 'string' && data.website.trim() !== '') {
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  }

  // Measured by the form itself, so client/server clock skew cannot matter.
  const elapsedMs = typeof data.elapsedMs === 'number' ? data.elapsedMs : NaN
  if (!Number.isFinite(elapsedMs) || elapsedMs < MIN_FILL_MS) return fail(400, 'too_fast')
  if (rateLimited(clientKey(req), Date.now())) return fail(429, 'rate_limited')

  const { errors, value } = validateEnquiry(data)
  if (!value) return fail(422, 'invalid_fields', { fields: errors })

  const result = await deliverEnquiry(value)
  if (!result.ok) return fail(result.reason === 'not_configured' ? 503 : 502, result.reason)
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
}
