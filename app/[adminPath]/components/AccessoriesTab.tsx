'use client'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { s, Field, Toggle, EmptyState, api, useToast, MUTED } from './ui'

type Car = { id: string; title: string }
type Accessory = {
  id: string; title: string; description: string | null
  image_url: string | null; buy_url: string | null
  store: string; category: string | null; sort_order: number
  is_active: boolean
  hidden_for_car_ids: string[]  // NEW: hide for specific models
}

const EMPTY = {
  title: '', description: '', image_url: '', buy_url: '',
  store: 'amazon', category: '', sort_order: 0,
  is_active: true, hidden_for_car_ids: [] as string[],
}

export function AccessoriesTab({ adminSecret }: { adminSecret: string }) {
  const [accessories, setAccessories] = useState<Accessory[]>([])
  const [cars, setCars] = useState<Car[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const { show, element: toastEl } = useToast()

  const load = useCallback(async () => {
    try {
      const [a, c] = await Promise.all([
        api('accessories', 'GET', undefined, adminSecret).then((d: any) => d.accessories || []),
        api('cars', 'GET', undefined, adminSecret).then((d: any) => d.cars || []),
      ])
      setAccessories(a); setCars(c)
    } catch (e: any) { show(e.message, 'error') }
  }, [adminSecret, show])

  useEffect(() => { load() }, [load])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  // Toggle whether this accessory is HIDDEN for a specific model
  const toggleHide = (carId: string) => {
    setForm(f => ({
      ...f,
      hidden_for_car_ids: f.hidden_for_car_ids.includes(carId)
        ? f.hidden_for_car_ids.filter(x => x !== carId)
        : [...f.hidden_for_car_ids, carId]
    }))
  }

  const save = async () => {
    if (!form.title.trim()) { show('Title is required', 'error'); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        image_url: form.image_url || null,
        buy_url: form.buy_url || null,
        description: form.description || null,
        category: form.category || null,
      }
      if (editing) await api('accessories', 'PUT', { id: editing, ...payload }, adminSecret)
      else await api('accessories', 'POST', payload, adminSecret)
      setForm(EMPTY); setEditing(null); load(); show('Saved')
    } catch (e: any) { show(e.message, 'error') }
    finally { setSaving(false) }
  }

  const del = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return
    try { await api('accessories', 'DELETE', { id }, adminSecret); load(); show('Deleted') }
    catch (e: any) { show(e.message, 'error') }
  }

  const edit = (a: Accessory) => {
    setForm({
      title: a.title, description: a.description || '',
      image_url: a.image_url || '', buy_url: a.buy_url || '',
      store: a.store, category: a.category || '',
      sort_order: a.sort_order, is_active: a.is_active,
      hidden_for_car_ids: a.hidden_for_car_ids || [],
    })
    setEditing(a.id)
  }

  return (
    <div>
      {toastEl}

      {/* Explanation */}
      <div style={{ background: '#0d1a0d', border: '1px solid #1a3a1a', borderRadius: 3, padding: '10px 14px', marginBottom: 20 }}>
        <p style={{ fontSize: 11, color: '#3a6a3a', margin: 0 }}>
          Accessories show on <strong style={{ color: '#39FF14' }}>all models by default</strong>.
          Use "Hide for models" to exclude specific models.
        </p>
      </div>

      <p style={s.secTitle}>{editing ? 'Edit Accessory' : 'Add Accessory'}</p>
      <div style={s.card}>
        <div style={s.g2}>
          <Field label="Title">
            <input style={s.input} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Tein Flex Z Coilovers" />
          </Field>
          <Field label="Store">
            <select style={s.select} value={form.store} onChange={e => set('store', e.target.value)}>
              <option value="amazon">Amazon</option>
              <option value="ebay">eBay</option>
              <option value="jegs">JEGS</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Buy URL">
            <input style={s.input} value={form.buy_url} onChange={e => set('buy_url', e.target.value)} placeholder="https://…" />
          </Field>
          <Field label="Image URL">
            <input style={s.input} value={form.image_url} onChange={e => set('image_url', e.target.value)} placeholder="https://…" />
          </Field>
          <Field label="Category">
            <input style={s.input} value={form.category} onChange={e => set('category', e.target.value)} placeholder="Suspension" />
          </Field>
          <Field label="Sort Order">
            <input style={s.input} type="number" value={form.sort_order} onChange={e => set('sort_order', parseInt(e.target.value) || 0)} />
          </Field>
        </div>

        <div style={{ marginTop: 10 }}>
          <Field label="Description">
            <textarea style={s.textarea} value={form.description} onChange={e => set('description', e.target.value)} />
          </Field>
        </div>

        {/* Hide for specific models */}
        {cars.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <p style={{ ...s.label, marginBottom: 8 }}>
              Hide for models
              <span style={{ color: MUTED, fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 6 }}>
                (checked = hidden for that model)
              </span>
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
              {cars.map(car => {
                const isHidden = form.hidden_for_car_ids.includes(car.id)
                return (
                  <button
                    key={car.id}
                    style={{
                      fontSize: 10, fontWeight: 700,
                      color: isHidden ? '#e24b4a' : MUTED,
                      background: isHidden ? '#1a0a0a' : '#151515',
                      border: `1px solid ${isHidden ? '#3a1515' : '#222'}`,
                      padding: '3px 8px', borderRadius: 2, cursor: 'pointer', letterSpacing: '0.05em',
                    }}
                    onClick={() => toggleHide(car.id)}
                  >
                    {isHidden ? '✕ ' : ''}{car.title}
                  </button>
                )
              })}
            </div>
            {form.hidden_for_car_ids.length > 0 && (
              <p style={{ fontSize: 10, color: '#e24b4a', marginTop: 6 }}>
                Hidden for {form.hidden_for_car_ids.length} model{form.hidden_for_car_ids.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}

        <div style={{ ...s.row, marginTop: 16, justifyContent: 'space-between' }}>
          <div style={s.row}>
            <Toggle value={form.is_active} onChange={v => set('is_active', v)} />
            <span style={{ fontSize: 11, color: MUTED }}>Active (show everywhere)</span>
          </div>
          <div style={s.row}>
            {editing && <button style={s.btn()} onClick={() => { setForm(EMPTY); setEditing(null) }}>Cancel</button>}
            <button style={s.btn('green')} onClick={save} disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Update' : 'Add'}
            </button>
          </div>
        </div>
      </div>

      <p style={{ ...s.secTitle, marginTop: 24 }}>All Accessories ({accessories.length})</p>
      {accessories.length === 0 && <EmptyState message="No accessories yet. Add accessories above — they'll show on all models by default." />}

      {accessories.map(acc => (
        <div key={acc.id} style={s.listItem}>
          {acc.image_url && (
            <div style={{ width: 40, height: 40, position: 'relative', flexShrink: 0, borderRadius: 2, overflow: 'hidden', background: '#0a0a0a' }}>
              <Image src={acc.image_url} alt={acc.title} fill style={{ objectFit: 'cover' }} onError={() => {}} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontWeight: 600 }}>{acc.title}</span>
            <span style={{ fontSize: 10, color: MUTED, marginLeft: 8, textTransform: 'uppercase' as const }}>{acc.store}</span>
            {acc.hidden_for_car_ids?.length > 0 && (
              <span style={{ fontSize: 10, color: '#e24b4a', marginLeft: 8 }}>
                hidden for {acc.hidden_for_car_ids.length} model{acc.hidden_for_car_ids.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <span style={s.badge(acc.is_active)}>{acc.is_active ? 'Active' : 'Off'}</span>
          <button style={s.btn()} onClick={() => edit(acc)}>Edit</button>
          <button style={s.btn('danger')} onClick={() => del(acc.id, acc.title)}>Del</button>
        </div>
      ))}
    </div>
  )
}
