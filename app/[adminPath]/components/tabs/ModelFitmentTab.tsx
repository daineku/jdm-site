'use client'
import { useState, useEffect, useCallback } from 'react'
import { s, Field, Toggle, ErrorBanner, api, MUTED } from '../ui'
import type { CarFitment } from '@/lib/types'

type Props = { carId: string; adminSecret: string; onToast: (msg: string, type?: 'success' | 'error') => void }
type FormState = Omit<CarFitment, 'id' | 'car_id' | 'created_at' | 'updated_at'>

const EMPTY: FormState = {
  fitment_style: null, ride_height: null, camber_look: null,
  best_wheel_style: null, best_diameter: null,
  observed_rim_guess: null,
  popular_rim_option_1: null, popular_rim_option_2: null,
  editorial_summary: null,
  is_visible: true,
}

const FITMENT_STYLES = ['', 'flush', 'poke', 'stance', 'tucked']
const RIDE_HEIGHTS   = ['', 'slammed', 'low', 'daily', 'stock']
const CAMBER_LOOKS   = ['', 'aggressive', 'slight', 'zero']

const txt = (v: string | null) => v ?? ''
const nul = (v: string) => v.trim() || null

export function ModelFitmentTab({ carId, adminSecret, onToast }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = await api(`fitment?car_id=${carId}`, 'GET', undefined, adminSecret)
      if (d.fitment) {
        const { id, car_id, created_at, updated_at, ...rest } = d.fitment
        setForm(rest)
      }
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [carId, adminSecret])

  useEffect(() => { load() }, [load])

  const set = (k: keyof FormState, v: any) => setForm(f => ({ ...f, [k]: v }))
  const setTxt = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    set(k, nul(e.target.value))

  const save = async () => {
    setSaving(true)
    try {
      await api('fitment', 'PUT', { car_id: carId, ...form }, adminSecret)
      onToast('Fitment saved')
    } catch (e: any) { onToast(e.message, 'error') }
    finally { setSaving(false) }
  }

  if (loading) return <div style={{ color: MUTED, fontSize: 12, padding: 20 }}>Loading…</div>

  return (
    <div>
      <ErrorBanner message={error} />

      {/* Stance descriptors */}
      <p style={s.secTitle}>Stance &amp; Look</p>
      <div style={{ ...s.card, marginBottom: 14 }}>
        <div style={s.g3}>
          <Field label="Fitment Style">
            <select style={s.select} value={txt(form.fitment_style)} onChange={setTxt('fitment_style')}>
              {FITMENT_STYLES.map(v => <option key={v} value={v}>{v || '— not set —'}</option>)}
            </select>
          </Field>
          <Field label="Ride Height">
            <select style={s.select} value={txt(form.ride_height)} onChange={setTxt('ride_height')}>
              {RIDE_HEIGHTS.map(v => <option key={v} value={v}>{v || '— not set —'}</option>)}
            </select>
          </Field>
          <Field label="Camber Look">
            <select style={s.select} value={txt(form.camber_look)} onChange={setTxt('camber_look')}>
              {CAMBER_LOOKS.map(v => <option key={v} value={v}>{v || '— not set —'}</option>)}
            </select>
          </Field>
        </div>
      </div>

      {/* Wheel guidance */}
      <p style={s.secTitle}>Wheel Guidance</p>
      <div style={{ ...s.card, marginBottom: 14 }}>
        <div style={s.g2}>
          <Field label="Best Wheel Style">
            <input style={s.input} value={txt(form.best_wheel_style)} onChange={setTxt('best_wheel_style')} placeholder="mesh, multi-spoke, dish, split-spoke…" />
          </Field>
          <Field label="Best Diameter">
            <input style={s.input} value={txt(form.best_diameter)} onChange={setTxt('best_diameter')} placeholder={'17" | 18" | 19"'} />
          </Field>
          <Field label="Observed Rim (what's on it)">
            <input style={s.input} value={txt(form.observed_rim_guess)} onChange={setTxt('observed_rim_guess')} placeholder="Enkei RPF1 17x9 +35…" />
          </Field>
        </div>
      </div>

      {/* Popular options */}
      <p style={s.secTitle}>Popular Options</p>
      <div style={{ ...s.card, marginBottom: 14 }}>
        <div style={s.g2}>
          <Field label="Option 1">
            <input style={s.input} value={txt(form.popular_rim_option_1)} onChange={setTxt('popular_rim_option_1')} placeholder="Volk TE37 17×9 +22" />
          </Field>
          <Field label="Option 2">
            <input style={s.input} value={txt(form.popular_rim_option_2)} onChange={setTxt('popular_rim_option_2')} placeholder="Work Meister S1 17×9.5 +12" />
          </Field>
        </div>
      </div>

      {/* Editorial summary */}
      <p style={s.secTitle}>Editorial Summary</p>
      <div style={{ ...s.card, marginBottom: 14 }}>
        <Field label="Summary (supports **bold**, *italic*, blank line = new paragraph)">
          <textarea
            style={{ ...s.textarea, minHeight: 100 }}
            value={txt(form.editorial_summary)}
            onChange={setTxt('editorial_summary')}
            placeholder="Describe the fitment look and character of this car…"
          />
        </Field>
      </div>

      <div style={{ ...s.row, justifyContent: 'space-between' }}>
        <div style={s.row}>
          <Toggle value={form.is_visible} onChange={v => set('is_visible', v)} />
          <span style={{ fontSize: 11, color: MUTED }}>Visible on public page</span>
        </div>
        <button style={s.btn('green')} onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save Fitment'}
        </button>
      </div>
    </div>
  )
}
