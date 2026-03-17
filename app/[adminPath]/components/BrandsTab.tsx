'use client'
import { useState, useEffect, useCallback } from 'react'
import { s, Field, Toggle, ErrorBanner, EmptyState, api, useToast, MUTED, G } from './ui'

type Brand = { id: string; name: string; slug: string; logo_url: string | null; sort_order: number; is_visible: boolean }

const EMPTY: Omit<Brand, 'id'> = { name: '', slug: '', logo_url: null, sort_order: 0, is_visible: true }
const autoSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export function BrandsTab({ adminSecret }: { adminSecret: string }) {
  const [brands, setBrands] = useState<Brand[]>([])
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { show, element: toastEl } = useToast()

  const load = useCallback(async () => {
    try {
      const d = await api('brands', 'GET', undefined, adminSecret)
      setBrands(d.brands || [])
    } catch (e: any) { setError(e.message) }
  }, [adminSecret])

  useEffect(() => { load() }, [load])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const cancel = () => { setForm(EMPTY); setEditing(null) }

  const save = async () => {
    if (!form.name.trim()) { show('Name is required', 'error'); return }
    if (!form.slug.trim()) { show('Slug is required', 'error'); return }
    setSaving(true)
    try {
      if (editing) await api('brands', 'PUT', { id: editing, ...form }, adminSecret)
      else await api('brands', 'POST', { ...form, logo_url: form.logo_url || null }, adminSecret)
      cancel(); load(); show('Saved')
    } catch (e: any) { show(e.message, 'error') }
    finally { setSaving(false) }
  }

  const del = async (id: string, name: string) => {
    if (!confirm(`Delete brand "${name}"? Models using this brand will be unlinked.`)) return
    try { await api('brands', 'DELETE', { id }, adminSecret); load(); show('Deleted') }
    catch (e: any) { show(e.message, 'error') }
  }

  const edit = (b: Brand) => {
    setForm({ name: b.name, slug: b.slug, logo_url: b.logo_url, sort_order: b.sort_order, is_visible: b.is_visible })
    setEditing(b.id)
  }

  return (
    <div>
      {toastEl}
      <ErrorBanner message={error} />
      <p style={s.secTitle}>{editing ? 'Edit Brand' : 'Add Brand'}</p>
      <div style={s.card}>
        <div style={s.g2}>
          <Field label="Name">
            <input style={s.input} value={form.name}
              onChange={e => { set('name', e.target.value); if (!editing) set('slug', autoSlug(e.target.value)) }}
              placeholder="Honda" />
          </Field>
          <Field label="Slug">
            <input style={s.input} value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="honda" />
          </Field>
          <Field label="Logo URL (optional)">
            <input style={s.input} value={form.logo_url || ''} onChange={e => set('logo_url', e.target.value || null)} placeholder="https://…" />
          </Field>
          <Field label="Sort Order">
            <input style={s.input} type="number" value={form.sort_order} onChange={e => set('sort_order', parseInt(e.target.value) || 0)} />
          </Field>
        </div>
        <div style={{ ...s.row, marginTop: 14, justifyContent: 'space-between' }}>
          <div style={s.row}><Toggle value={form.is_visible} onChange={v => set('is_visible', v)} /><span style={{ fontSize: 11, color: MUTED }}>Visible in filter</span></div>
          <div style={s.row}>
            {editing && <button style={s.btn()} onClick={cancel}>Cancel</button>}
            <button style={s.btn('green')} onClick={save} disabled={saving}>{saving ? 'Saving…' : editing ? 'Update' : 'Add Brand'}</button>
          </div>
        </div>
      </div>

      <p style={{ ...s.secTitle, marginTop: 28 }}>All Brands ({brands.length})</p>
      {brands.length === 0 && <EmptyState message="No brands yet. Add your first brand above." />}
      {brands.map(b => (
        <div key={b.id} style={s.listItem}>
          <span style={{ flex: 1, fontWeight: 600 }}>{b.name}</span>
          <span style={{ color: MUTED, fontSize: 11 }}>{b.slug}</span>
          <span style={s.badge(b.is_visible)}>{b.is_visible ? 'Visible' : 'Hidden'}</span>
          <button style={s.btn()} onClick={() => edit(b)}>Edit</button>
          <button style={s.btn('danger')} onClick={() => del(b.id, b.name)}>Delete</button>
        </div>
      ))}
    </div>
  )
}
