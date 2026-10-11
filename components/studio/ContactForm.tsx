'use client'
import { useId, useState, type FormEvent } from 'react'

type Fields = { name: string; email: string; message: string }
type Errors = Partial<Record<keyof Fields, string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(f: Fields): Errors {
  const e: Errors = {}
  if (f.name.trim().length < 2) e.name = 'Please enter your name.'
  if (!EMAIL_RE.test(f.email.trim())) e.email = 'Please enter a valid email address.'
  if (f.message.trim().length < 10) e.message = 'Tell us a little about the project (at least 10 characters).'
  return e
}

/**
 * Composes the enquiry in the visitor's own email app (mailto:). Nothing is sent
 * from this site, so the confirmation says exactly that — no fake "message sent".
 */
export default function ContactForm({ email, cta }: { email: string; cta: string }) {
  const uid = useId()
  const [fields, setFields] = useState<Fields>({ name: '', email: '', message: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [opened, setOpened] = useState(false)

  const set = (k: keyof Fields) => (ev: { target: { value: string } }) => {
    setFields(f => ({ ...f, [k]: ev.target.value }))
    if (errors[k]) setErrors(e => ({ ...e, [k]: undefined }))
  }

  const onSubmit = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault()
    const found = validate(fields)
    setErrors(found)
    const firstBad = (Object.keys(found) as (keyof Fields)[])[0]
    if (firstBad) {
      document.getElementById(`${uid}-${firstBad}`)?.focus()
      return
    }
    const subject = `Project enquiry — ${fields.name.trim()}`
    const body = `${fields.message.trim()}\n\n— ${fields.name.trim()}\n${fields.email.trim()}`
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    setOpened(true)
  }

  const field = (k: keyof Fields, label: string, el: 'input' | 'textarea', extra: Record<string, string> = {}) => {
    const id = `${uid}-${k}`
    const err = errors[k]
    const common = {
      id,
      name: k,
      value: fields[k],
      onChange: set(k),
      'aria-invalid': err ? true : undefined,
      'aria-describedby': err ? `${id}-err` : undefined,
      ...extra,
    }
    return (
      <div className="st-field" data-invalid={err ? 'true' : undefined}>
        <label htmlFor={id}>{label}</label>
        {el === 'input' ? <input {...common} /> : <textarea {...common} />}
        {err && <span id={`${id}-err`} className="st-field__error">{err}</span>}
      </div>
    )
  }

  return (
    <form className="st-form" onSubmit={onSubmit} noValidate aria-label="Project enquiry">
      <div className="st-form__row">
        {field('name', 'Name', 'input', { autoComplete: 'name', placeholder: 'Your name' })}
        {field('email', 'Email', 'input', { type: 'email', autoComplete: 'email', placeholder: 'you@company.com' })}
      </div>
      {field('message', 'Project / Message', 'textarea', { placeholder: 'What are you building?' })}
      <div className="st-form__foot">
        <p className="st-form__note">Opens your email app with the message ready to send to {email}.</p>
        <button type="submit" className="st-btn st-btn--gold">
          {cta} <span className="st-btn__arrow" aria-hidden="true">→</span>
        </button>
      </div>
      <div aria-live="polite">
        {opened && (
          <p className="st-form__status">
            Your email app should now be open with the message drafted — send it from there.
            If nothing opened, write to <a href={`mailto:${email}`} style={{ textDecoration: 'underline' }}>{email}</a>.
          </p>
        )}
      </div>
    </form>
  )
}
