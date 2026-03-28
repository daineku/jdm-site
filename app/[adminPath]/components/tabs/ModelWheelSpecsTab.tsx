'use client'
import { useState, useEffect, useCallback } from 'react'
import { s, Field, ErrorBanner, api, MUTED, G } from '../ui'
import type { CarWheelSpecs } from '@/lib/types'

type Props = { carId: string; adminSecret: string; onToast: (msg: string, type?: 'success' | 'error') => void }

type FormState = Omit<CarWheelSpecs, 'id' | 'car_id' | 'created_at' | 'updated_at'>

const EMPTY: FormState = {
  oem_wheel_size_front: null, oem_wheel_size_rear: null,
  oem_offset_front: null, oem_offset_rear: null,
  oem_tire_front: null, oem_tire_rear: null,
  oem_notes: null,
  am_wheel_brand: null, am_wheel_model: null,
  am_wheel_size_front: null, am_wheel_size_rear: null,
  am_offset_front: null, am_offset_rear: null,
  am_tire_front: null, am_tire_rear: null,
  am_notes: null,
}

const txt = (v: string | null) => v ?? ''
const nul = (v: string) => v.trim() || null

export function ModelWheelSpecsTab({ carId, adminSecret, onToast }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = await api(`wheel-specs?car_id=${carId}`, 'GET', undefined, adminSecret)
      if (d.wheelSpecs) {
        const { id, car_id, created_at, updated_at, ...rest } = d.wheelSpecs
        setForm(rest)
      }
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [carId, adminSecret])

  useEffect(() => { load() }, [load])

  const set = (k: keyof FormState, v: string) => setForm(f => ({ ...f, [k]: nul(v) }))

  const save = async () => {
    setSaving(true)
    try {
      await api('wheel-specs', 'PUT', { car_id: carId, ...form }, adminSecret)
      onToast('Wheel specs saved')
    } catch (e: any) { onToast(e.message, 'error') }
    finally { setSaving(false) }
  }

  if (loading) return <div style={{ color: MUTED, fontSize: 12, padding: 20 }}>Loading…</div>

  const colLabel: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: G, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 0 10px' }
  const rowLabel: React.CSSProperties = { ...s.label, minWidth: 110, flexShrink: 0, paddingTop: 8 }
  const cell: React.CSSProperties = { flex: 1, minWidth: 0 }

  return (
    <div>
      <ErrorBanner message={error} />

      {/* Comparison table layout: label | OEM | Aftermarket */}
      <div style={{ overflowX: 'auto' as const }}>
        <div style={{ minWidth: 520 }}>

          {/* Header row */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 8, paddingLeft: 122 }}>
            <div style={{ ...colLabel, flex: 1 }}>OEM / Stock</div>
            <div style={{ ...colLabel, flex: 1 }}>Aftermarket / Current</div>
          </div>

          {/* Wheel brand + model (aftermarket only) */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
            <span style={rowLabel}>Brand / Model</span>
            <div style={{ ...cell, display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#333', fontStyle: 'italic' }}>—</span>
            </div>
            <div style={{ ...cell, display: 'flex', gap: 6 }}>
              <input style={{ ...s.input, flex: 1 }} value={txt(form.am_wheel_brand)} onChange={e => set('am_wheel_brand', e.target.value)} placeholder="Enkei" />
              <input style={{ ...s.input, flex: 1 }} value={txt(form.am_wheel_model)} onChange={e => set('am_wheel_model', e.target.value)} placeholder="RPF1" />
            </div>
          </div>

          {/* Wheel size front */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
            <span style={rowLabel}>Wheel — Front</span>
            <div style={cell}><input style={s.input} value={txt(form.oem_wheel_size_front)} onChange={e => set('oem_wheel_size_front', e.target.value)} placeholder="16×6.5" /></div>
            <div style={cell}><input style={s.input} value={txt(form.am_wheel_size_front)} onChange={e => set('am_wheel_size_front', e.target.value)} placeholder="17×9" /></div>
          </div>

          {/* Wheel size rear */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
            <span style={rowLabel}>Wheel — Rear</span>
            <div style={cell}><input style={s.input} value={txt(form.oem_wheel_size_rear)} onChange={e => set('oem_wheel_size_rear', e.target.value)} placeholder="16×6.5" /></div>
            <div style={cell}><input style={s.input} value={txt(form.am_wheel_size_rear)} onChange={e => set('am_wheel_size_rear', e.target.value)} placeholder="17×9.5" /></div>
          </div>

          {/* Offset front */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
            <span style={rowLabel}>Offset — Front</span>
            <div style={cell}><input style={s.input} value={txt(form.oem_offset_front)} onChange={e => set('oem_offset_front', e.target.value)} placeholder="+45" /></div>
            <div style={cell}><input style={s.input} value={txt(form.am_offset_front)} onChange={e => set('am_offset_front', e.target.value)} placeholder="+30" /></div>
          </div>

          {/* Offset rear */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
            <span style={rowLabel}>Offset — Rear</span>
            <div style={cell}><input style={s.input} value={txt(form.oem_offset_rear)} onChange={e => set('oem_offset_rear', e.target.value)} placeholder="+45" /></div>
            <div style={cell}><input style={s.input} value={txt(form.am_offset_rear)} onChange={e => set('am_offset_rear', e.target.value)} placeholder="+22" /></div>
          </div>

          {/* Tire front */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
            <span style={rowLabel}>Tire — Front</span>
            <div style={cell}><input style={s.input} value={txt(form.oem_tire_front)} onChange={e => set('oem_tire_front', e.target.value)} placeholder="205/55R16" /></div>
            <div style={cell}><input style={s.input} value={txt(form.am_tire_front)} onChange={e => set('am_tire_front', e.target.value)} placeholder="215/40R17" /></div>
          </div>

          {/* Tire rear */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
            <span style={rowLabel}>Tire — Rear</span>
            <div style={cell}><input style={s.input} value={txt(form.oem_tire_rear)} onChange={e => set('oem_tire_rear', e.target.value)} placeholder="205/55R16" /></div>
            <div style={cell}><input style={s.input} value={txt(form.am_tire_rear)} onChange={e => set('am_tire_rear', e.target.value)} placeholder="225/40R17" /></div>
          </div>

          {/* Notes */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
            <span style={rowLabel}>Notes</span>
            <div style={cell}><textarea style={{ ...s.textarea, minHeight: 50 }} value={txt(form.oem_notes)} onChange={e => set('oem_notes', e.target.value)} placeholder="OEM configuration notes…" /></div>
            <div style={cell}><textarea style={{ ...s.textarea, minHeight: 50 }} value={txt(form.am_notes)} onChange={e => set('am_notes', e.target.value)} placeholder="Aftermarket notes, spacers, camber…" /></div>
          </div>

        </div>
      </div>

      <div style={{ ...s.row, justifyContent: 'flex-end', marginTop: 8 }}>
        <button style={s.btn('green')} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Wheel Specs'}</button>
      </div>
    </div>
  )
}
