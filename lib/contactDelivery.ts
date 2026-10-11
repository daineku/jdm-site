/**
 * Server-side enquiry delivery through Resend (https://resend.com), called with plain
 * fetch — no SDK. Server code only: the API key never reaches the browser, and the
 * recipient is fixed by configuration, never taken from the request.
 *
 *   RESEND_API_KEY      provider key (secret)
 *   CONTACT_FROM_EMAIL  sender on a domain verified in Resend, e.g. "DAINEKU <studio@your-domain>"
 *   CONTACT_TO_EMAIL    inbox that receives enquiries; defaults to the public CONTACT_EMAIL
 */
import { enquirySubject, enquiryText, isEmail, type Enquiry } from './contact'
import { getContactEmail } from './social'

const DEFAULT_ENDPOINT = 'https://api.resend.com/emails'

type DeliveryConfig = { apiKey: string; from: string; to: string; endpoint: string }

/** The sender may be "Name <address>" or a bare address; the address part must be valid. */
function plausibleSender(from: string): boolean {
  const m = from.match(/<([^>]+)>\s*$/)
  return isEmail((m ? m[1] : from).trim()) && !/[\r\n]/.test(from)
}

export function getDeliveryConfig(): DeliveryConfig | null {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from = process.env.CONTACT_FROM_EMAIL?.trim()
  const toRaw = process.env.CONTACT_TO_EMAIL?.trim()
  const to = toRaw && isEmail(toRaw) ? toRaw : getContactEmail()
  if (!apiKey || !from || !plausibleSender(from) || !to) return null
  // RESEND_API_URL exists only so the smoke suite can point delivery at a local mock provider.
  const endpoint = process.env.RESEND_API_URL?.trim() || DEFAULT_ENDPOINT
  return { apiKey, from, to, endpoint }
}

export function isDeliveryConfigured(): boolean {
  return getDeliveryConfig() !== null
}

export type DeliveryResult = { ok: true } | { ok: false; reason: 'not_configured' | 'provider_error' }

/** Resolves ok only when the provider has accepted the message (2xx with an id). */
export async function deliverEnquiry(enquiry: Enquiry): Promise<DeliveryResult> {
  const cfg = getDeliveryConfig()
  if (!cfg) return { ok: false, reason: 'not_configured' }

  try {
    const res = await fetch(cfg.endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: cfg.from,
        to: [cfg.to],
        reply_to: enquiry.email,
        subject: enquirySubject(enquiry),
        text: enquiryText(enquiry),
      }),
      signal: AbortSignal.timeout(10_000),
      cache: 'no-store',
    })
    const body: unknown = await res.json().catch(() => null)
    const accepted = res.ok && typeof body === 'object' && body !== null && typeof (body as { id?: unknown }).id === 'string'
    if (!accepted) {
      // Status only — never log the enquiry, the visitor's address or the key.
      console.error(`[contact] provider rejected the enquiry (HTTP ${res.status})`)
      return { ok: false, reason: 'provider_error' }
    }
    return { ok: true }
  } catch (e) {
    console.error(`[contact] provider request failed: ${e instanceof Error ? e.name : 'unknown error'}`)
    return { ok: false, reason: 'provider_error' }
  }
}
