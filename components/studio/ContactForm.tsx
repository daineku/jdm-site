'use client'
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { LIMITS, enquirySubject, enquiryText, validateEnquiry, type EnquiryErrors, type EnquiryFields } from '@/lib/contact'
import { PROJECT_TYPES } from './content'

export type ContactDelivery = 'server' | 'mailto'

type Status =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'sent' }
  | { kind: 'opened' }
  | { kind: 'error'; message: string }

const EMPTY: EnquiryFields = { name: '', email: '', projectType: '', timeline: '', message: '' }
const ORDER: (keyof EnquiryFields)[] = ['name', 'email', 'projectType', 'timeline', 'message']

const SERVER_ERRORS: Record<string, string> = {
  too_fast: 'That was quick — please wait a moment and send it again.',
  rate_limited: 'Several enquiries were just sent from this connection. Please try again a little later.',
}

/**
 * Project enquiry form.
 *  - 'server': posts to /api/contact, which delivers to the studio inbox. Success is shown
 *    only after the server confirms the email provider accepted the message.
 *  - 'mailto': no delivery provider configured — drafts the enquiry in the visitor's own
 *    email app and says exactly that.
 */
export default function ContactForm({ email, delivery, cta }: { email: string | null; delivery: ContactDelivery; cta: string }) {
  const uid = useId()
  const [fields, setFields] = useState<EnquiryFields>(EMPTY)
  const [errors, setErrors] = useState<EnquiryErrors>({})
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const shownAt = useRef(0)
  const honeypot = useRef<HTMLInputElement>(null)
  const statusRef = useRef<HTMLDivElement>(null)

  useEffect(() => { shownAt.current = performance.now() }, [])

  const set = (k: keyof EnquiryFields) => (ev: { target: { value: string } }) => {
    setFields(f => ({ ...f, [k]: ev.target.value }))
    if (errors[k]) setErrors(e => ({ ...e, [k]: undefined }))
  }

  const showErrors = (found: EnquiryErrors) => {
    setErrors(found)
    const firstBad = ORDER.find(k => found[k])
    if (firstBad) document.getElementById(`${uid}-${firstBad}`)?.focus()
  }

  const onSubmit = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault()
    if (status.kind === 'sending') return
    const { errors: found, value } = validateEnquiry(fields)
    if (!value) return showErrors(found)
    setErrors({})

    if (delivery === 'mailto') {
      if (!email) return
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(enquirySubject(value))}&body=${encodeURIComponent(enquiryText(value))}`
      setStatus({ kind: 'opened' })
      return
    }

    setStatus({ kind: 'sending' })
    let next: Status
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...value,
          website: honeypot.current?.value ?? '',
          elapsedMs: Math.round(performance.now() - shownAt.current),
        }),
      })
      const body = (await res.json().catch(() => null)) as { ok?: boolean; error?: string; fields?: EnquiryErrors } | null
      if (res.ok && body?.ok) {
        next = { kind: 'sent' }
        setFields(EMPTY)
      } else if (body?.error === 'invalid_fields' && body.fields) {
        setStatus({ kind: 'idle' })
        return showErrors(body.fields)
      } else {
        next = { kind: 'error', message: (body?.error && SERVER_ERRORS[body.error]) || 'Your enquiry could not be sent. Please try again.' }
      }
    } catch {
      next = { kind: 'error', message: 'Your enquiry could not be sent — check your connection and try again.' }
    }
    setStatus(next)
    requestAnimationFrame(() => statusRef.current?.focus())
  }

  const field = (k: keyof EnquiryFields, label: string, control: (common: Record<string, unknown>) => ReactNode) => {
    const id = `${uid}-${k}`
    const err = errors[k]
    const common = {
      id,
      name: k,
      value: fields[k],
      onChange: set(k),
      'aria-invalid': err ? true : undefined,
      'aria-describedby': err ? `${id}-err` : undefined,
    }
    return (
      <div className="st-field" data-invalid={err ? 'true' : undefined}>
        <label htmlFor={id}>{label}</label>
        {control(common)}
        {err && <span id={`${id}-err`} className="st-field__error">{err}</span>}
      </div>
    )
  }

  const emailLink = email && <a href={`mailto:${email}`} style={{ textDecoration: 'underline' }}>{email}</a>
  const sending = status.kind === 'sending'

  return (
    <form className="st-form" onSubmit={onSubmit} noValidate aria-label="Project enquiry" aria-busy={sending || undefined}>
      <div className="st-form__row">
        {field('name', 'Name', c => <input {...c} required autoComplete="name" maxLength={LIMITS.name} placeholder="Your name" />)}
        {field('email', 'Email', c => <input {...c} required type="email" autoComplete="email" maxLength={LIMITS.email} placeholder="you@company.com" />)}
      </div>
      <div className="st-form__row">
        {field('projectType', 'Project type', c => (
          <select {...c} required>
            <option value="" disabled>Select…</option>
            {PROJECT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        ))}
        {field('timeline', 'Timeline (optional)', c => <input {...c} maxLength={LIMITS.timeline} placeholder="e.g. Spring 2027" />)}
      </div>
      {field('message', 'Project description', c => (
        <textarea {...c} required maxLength={LIMITS.message} placeholder="What are you creating, who is it for and what do you need delivered?" />
      ))}

      {/* Honeypot — hidden from people and assistive tech; bots tend to fill every field. */}
      <div className="st-visually-hidden" aria-hidden="true">
        <label htmlFor={`${uid}-website`}>Leave this field empty</label>
        <input ref={honeypot} id={`${uid}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      <div className="st-form__foot">
        <p className="st-form__note">
          {delivery === 'server'
            ? 'Your details are used only to reply to this enquiry. They are emailed to the studio and not stored on this website.'
            : <>Opens your email app with the enquiry drafted to {emailLink}. Nothing is stored on this website.</>}
        </p>
        <button type="submit" className="st-btn st-btn--gold" disabled={sending}>
          {sending ? 'Sending…' : cta} <span className="st-btn__arrow" aria-hidden="true">→</span>
        </button>
      </div>

      <div aria-live="polite" ref={statusRef} tabIndex={-1} style={{ outline: 'none' }}>
        {status.kind === 'sent' && (
          <p className="st-form__status" data-status="sent">
            Thank you — your enquiry has been sent to the studio. We&rsquo;ll reply to the email address you gave.
          </p>
        )}
        {status.kind === 'opened' && (
          <p className="st-form__status" data-status="opened">
            Your email app should now be open with the enquiry drafted — send it from there.
            If nothing opened, write to {emailLink}.
          </p>
        )}
        {status.kind === 'error' && (
          <p className="st-form__status st-form__status--error" data-status="error">
            {status.message}{email && <> You can also write to {emailLink}.</>}
          </p>
        )}
      </div>
    </form>
  )
}
