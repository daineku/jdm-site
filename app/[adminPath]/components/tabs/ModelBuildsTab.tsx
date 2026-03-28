'use client'
import { useState, useEffect, useCallback } from 'react'
import { s, Field, Toggle, EmptyState, ErrorBanner, api, MUTED, G } from '../ui'
import type { CarBuildInstance, BuildCategory, GalleryPhoto } from '@/lib/types'

type Props = { carId: string; adminSecret: string; onToast: (msg: string, type?: 'success' | 'error') => void }

const EMPTY_WHEEL = { wheel_brand: '', wheel_model: '', wheel_size_front: '', wheel_size_rear: '', offset_front: '', offset_rear: '', tire_front: '', tire_rear: '' }
const EMPTY_FORM = { category_id: '', title: '', description: '', setup_summary: '', is_visible: true, sort_order: 0, photo_ids: [] as string[], ...EMPTY_WHEEL }

export function ModelBuildsTab({ carId, adminSecret, onToast }: Props) {
  const [instances, setInstances] = useState<CarBuildInstance[]>([])
  const [categories, setCategories] = useState<BuildCategory[]>([])
  const [photos, setPhotos] = useState<GalleryPhoto[]>([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editing, setEditing] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [instRes, catRes, photoRes] = await Promise.all([
        api(`car-build-instances?car_id=${carId}`, 'GET', undefined, adminSecret),
        api('build-categories', 'GET', undefined, adminSecret),
        api(`photos?car_id=${carId}`, 'GET', undefined, adminSecret),
      ])
      setInstances(instRes.buildInstances || [])
      setCategories((catRes.buildCategories || []).filter((c: BuildCategory) => c.is_published || editing))
      setPhotos(photoRes.photos || [])
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [carId, adminSecret, editing])

  useEffect(() => { load() }, [load])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const cancel = () => { setForm(EMPTY_FORM); setEditing(null) }

  const togglePhoto = (photoId: string) => {
    setForm(f => ({
      ...f,
      photo_ids: f.photo_ids.includes(photoId)
        ? f.photo_ids.filter(id => id !== photoId)
        : [...f.photo_ids, photoId]
    }))
  }

  const validate = (): string | null => {
    if (!form.category_id) return 'A Build Category is required'
    if (!form.title.trim()) return 'Title is required'
    if (!form.description.trim()) return 'Description is required'
    if (!form.setup_summary.trim()) return 'Setup summary is required'
    if (form.photo_ids.length === 0) return 'At least one photo must be selected'
    return null
  }

  const save = async () => {
    const err = validate()
    if (err) { onToast(err, 'error'); return }
    setSaving(true)
    try {
      const payload = {
        car_id: carId,
        category_id: form.category_id,
        title: form.title.trim(),
        description: form.description.trim(),
        setup_summary: form.setup_summary.trim(),
        is_visible: form.is_visible,
        sort_order: form.sort_order,
        photo_ids: form.photo_ids,
        wheel_brand: form.wheel_brand || null,
        wheel_model: form.wheel_model || null,
        wheel_size_front: form.wheel_size_front || null,
        wheel_size_rear: form.wheel_size_rear || null,
        offset_front: form.offset_front || null,
        offset_rear: form.offset_rear || null,
        tire_front: form.tire_front || null,
        tire_rear: form.tire_rear || null,
      }
      if (editing) await api('car-build-instances', 'PUT', { id: editing, ...payload }, adminSecret)
      else await api('car-build-instances', 'POST', payload, adminSecret)
      cancel(); load(); onToast('Saved')
    } catch (e: any) { onToast(e.message, 'error') }
    finally { setSaving(false) }
  }

  const del = async (id: string, title: string) => {
    if (!confirm(`Delete build "${title}"?`)) return
    try { await api('car-build-instances', 'DELETE', { id }, adminSecret); load(); onToast('Deleted') }
    catch (e: any) { onToast(e.message, 'error') }
  }

  const edit = (b: CarBuildInstance) => {
    setForm({
      category_id: b.category_id,
      title: b.title,
      description: b.description,
      setup_summary: b.setup_summary,
      is_visible: b.is_visible,
      sort_order: b.sort_order,
      photo_ids: (b.photos || []).sort((a, b) => a.sort_order - b.sort_order).map(p => p.photo_id),
      wheel_brand: b.wheel_brand || '',
      wheel_model: b.wheel_model || '',
      wheel_size_front: b.wheel_size_front || '',
      wheel_size_rear: b.wheel_size_rear || '',
      offset_front: b.offset_front || '',
      offset_rear: b.offset_rear || '',
      tire_front: b.tire_front || '',
      tire_rear: b.tire_rear || '',
    })
    setEditing(b.id)
  }

  if (loading) return <div style={{ color: MUTED, fontSize: 12, padding: 20 }}>Loading...</div>

  const featuredPhoto = (b: CarBuildInstance) => {
    const sorted = (b.photos || []).sort((a, c) => a.sort_order - c.sort_order)
    return sorted[0]?.photo?.thumb_url || sorted[0]?.photo?.url || null
  }

  return (
    <div>
      <ErrorBanner message={error} />
      <p style={s.secTitle}>{editing ? 'Edit Build' : 'Add Build'}</p>
      <p style={{ fontSize: 11, color: MUTED, marginBottom: 14 }}>
        A build is a specific configuration of this car, tagged with a Build Category.
        Select photos from this model's gallery — the first selected photo is the featured image.
      </p>

      <div style={s.card}>
        <div style={s.g2}>
          <Field label="Build Category *">
            <select style={s.select} value={form.category_id} onChange={e => set('category_id', e.target.value)}>
              <option value="">— Select a category —</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {categories.length === 0 && (
              <p style={{ fontSize: 10, color: '#e24b4a', marginTop: 3 }}>No published categories. Create and publish one in Global → Build Categories first.</p>
            )}
          </Field>
          <Field label="Title">
            <input style={s.input} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Track Spec — 2023" />
          </Field>
        </div>
        <div style={{ marginTop: 10 }}>
          <Field label="Setup Summary * — one-line config label">
            <input style={s.input} value={form.setup_summary} onChange={e => set('setup_summary', e.target.value)} placeholder="Slammed · Bilstein coilovers · 18×9.5 +22" />
          </Field>
        </div>
        <div style={{ marginTop: 10 }}>
          <Field label="Description * — build story and notes">
            <textarea style={s.textarea} value={form.description} onChange={e => set('description', e.target.value)} placeholder="The story behind this specific build..." />
          </Field>
        </div>

        {/* Photo selector */}
        <div style={{ marginTop: 14 }}>
          <p style={s.label}>
            Photos * — select from this model's gallery
            {form.photo_ids.length > 0 && <span style={{ color: G }}> ({form.photo_ids.length} selected — first is featured)</span>}
          </p>
          {photos.length === 0 ? (
            <p style={{ fontSize: 11, color: MUTED }}>No photos yet. Upload photos in the Gallery tab first.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
              {photos.map(photo => {
                const isSelected = form.photo_ids.includes(photo.id)
                const selectedIdx = form.photo_ids.indexOf(photo.id)
                return (
                  <div key={photo.id}
                    onClick={() => togglePhoto(photo.id)}
                    style={{
                      position: 'relative', width: 72, height: 72,
                      cursor: 'pointer', borderRadius: 3, overflow: 'hidden',
                      border: isSelected ? `2px solid ${G}` : '2px solid transparent',
                      background: '#111',
                      flexShrink: 0,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.thumb_url || photo.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {isSelected && (
                      <div style={{ position: 'absolute', top: 2, right: 2, background: G, color: '#000', fontSize: 9, fontWeight: 800, padding: '1px 4px', borderRadius: 2, lineHeight: 1.4 }}>
                        {selectedIdx === 0 ? '★' : selectedIdx + 1}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Wheel setup */}
        <details style={{ marginTop: 14 }}>
          <summary style={{ fontSize: 10, color: MUTED, cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Wheel Setup (optional)</summary>
          <div style={{ ...s.g2, marginTop: 10 }}>
            <Field label="Wheel Brand"><input style={s.input} value={form.wheel_brand} onChange={e => set('wheel_brand', e.target.value)} placeholder="Enkei" /></Field>
            <Field label="Wheel Model"><input style={s.input} value={form.wheel_model} onChange={e => set('wheel_model', e.target.value)} placeholder="RPF1" /></Field>
            <Field label="Size — Front"><input style={s.input} value={form.wheel_size_front} onChange={e => set('wheel_size_front', e.target.value)} placeholder={'18×9.5'} /></Field>
            <Field label="Size — Rear"><input style={s.input} value={form.wheel_size_rear} onChange={e => set('wheel_size_rear', e.target.value)} placeholder={'18×10.5'} /></Field>
            <Field label="Offset — Front"><input style={s.input} value={form.offset_front} onChange={e => set('offset_front', e.target.value)} placeholder="+22" /></Field>
            <Field label="Offset — Rear"><input style={s.input} value={form.offset_rear} onChange={e => set('offset_rear', e.target.value)} placeholder="+15" /></Field>
            <Field label="Tire — Front"><input style={s.input} value={form.tire_front} onChange={e => set('tire_front', e.target.value)} placeholder="255/35/18" /></Field>
            <Field label="Tire — Rear"><input style={s.input} value={form.tire_rear} onChange={e => set('tire_rear', e.target.value)} placeholder="265/35/18" /></Field>
          </div>
        </details>

        <div style={{ ...s.row, marginTop: 14, justifyContent: 'space-between' }}>
          <div style={{ ...s.row, gap: 12 }}>
            <Toggle value={form.is_visible} onChange={v => set('is_visible', v)} />
            <span style={{ fontSize: 11, color: MUTED }}>Visible</span>
          </div>
          <div style={s.row}>
            {editing && <button style={s.btn()} onClick={cancel}>Cancel</button>}
            <button style={s.btn('green')} onClick={save} disabled={saving}>{saving ? 'Saving...' : editing ? 'Update Build' : 'Add Build'}</button>
          </div>
        </div>
      </div>

      <p style={{ ...s.secTitle, marginTop: 28 }}>Builds ({instances.length})</p>
      {instances.length === 0 && <EmptyState message="No builds yet. Add your first build above." />}
      {instances.map(b => (
        <div key={b.id} style={s.listItem}>
          {featuredPhoto(b) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={featuredPhoto(b)!} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontWeight: 600 }}>{b.title}</span>
            {b.category && <span style={{ fontSize: 11, color: MUTED, marginLeft: 8 }}>{b.category.name}</span>}
            <p style={{ fontSize: 11, color: '#555', margin: '2px 0 0' }}>{b.setup_summary}</p>
          </div>
          <span style={s.badge(b.is_visible)}>{b.is_visible ? 'Visible' : 'Hidden'}</span>
          <button style={s.btn()} onClick={() => edit(b)}>Edit</button>
          <button style={s.btn('danger')} onClick={() => del(b.id, b.title)}>Delete</button>
        </div>
      ))}
    </div>
  )
}
