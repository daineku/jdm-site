'use client'
import { useState, useEffect, useCallback } from 'react'
import { s, Field, EmptyState, ErrorBanner, api, MUTED, G } from '../ui'
import { ImageUploadField } from '../ImageUploadField'
import type { PartCategory } from '@/lib/types'

type KeySpec = { label: string; value: string }

type Part = {
  id: string; name: string; brand_name: string | null; notes: string | null
  sort_order: number; category_id: string | null
  category?: { id: string; name: string } | null
  // product fields
  image_url: string | null
  affiliate_url: string | null
  price_range: string | null
  key_specs: KeySpec[]
  availability: 'in_stock' | 'limited' | 'discontinued' | null
  is_featured: boolean
}

type Props = { carId: string; adminSecret: string; onToast: (msg: string, type?: 'success' | 'error') => void }

const EMPTY_FORM = {
  name: '', brand_name: '', notes: '', sort_order: 0, category_id: '',
  image_url: null as string | null, affiliate_url: '', price_range: '',
  key_specs: [] as KeySpec[], availability: '' as string, is_featured: false,
}

const AVAIL_LABELS: Record<string, string> = {
  in_stock: 'In Stock', limited: 'Limited', discontinued: 'Discontinued',
}

export function ModelModsTab({ carId, adminSecret, onToast }: Props) {
  const [parts, setParts] = useState<Part[]>([])
  const [categories, setCategories] = useState<PartCategory[]>([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editing, setEditing] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [partsRes, catRes] = await Promise.all([
        api(`car-aftermarket-parts?car_id=${carId}`, 'GET', undefined, adminSecret),
        api('part-categories', 'GET', undefined, adminSecret),
      ])
      setParts(partsRes.parts || [])
      setCategories(catRes.partCategories || [])
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [carId, adminSecret])

  useEffect(() => { load() }, [load])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const cancel = () => { setForm(EMPTY_FORM); setEditing(null) }

  const addSpec = () => setForm(f => ({ ...f, key_specs: [...f.key_specs, { label: '', value: '' }] }))
  const removeSpec = (i: number) => setForm(f => ({ ...f, key_specs: f.key_specs.filter((_, j) => j !== i) }))
  const updateSpec = (i: number, k: 'label' | 'value', v: string) =>
    setForm(f => { const s = [...f.key_specs]; s[i] = { ...s[i], [k]: v }; return { ...f, key_specs: s } })

  const save = async () => {
    if (!form.name.trim()) { onToast('Name is required', 'error'); return }
    setSaving(true)
    try {
      const payload = {
        car_id: carId,
        name: form.name.trim(),
        brand_name: form.brand_name.trim() || null,
        notes: form.notes.trim() || null,
        sort_order: form.sort_order,
        category_id: form.category_id || null,
        image_url: form.image_url || null,
        affiliate_url: form.affiliate_url.trim() || null,
        price_range: form.price_range.trim() || null,
        key_specs: form.key_specs.filter(s => s.label.trim() && s.value.trim()),
        availability: (form.availability as any) || null,
        is_featured: form.is_featured,
      }
      let d
      if (editing) d = await api('car-aftermarket-parts', 'PUT', { id: editing, ...payload }, adminSecret)
      else d = await api('car-aftermarket-parts', 'POST', payload, adminSecret)
      const updated = d.part
      if (editing) setParts(prev => prev.map(p => p.id === editing ? updated : p))
      else setParts(prev => [...prev, updated])
      cancel(); onToast('Saved')
    } catch (e: any) { onToast(e.message, 'error') }
    finally { setSaving(false) }
  }

  const del = async (id: string) => {
    if (!confirm('Delete this part?')) return
    try { await api('car-aftermarket-parts', 'DELETE', { id }, adminSecret); setParts(prev => prev.filter(p => p.id !== id)); onToast('Deleted') }
    catch (e: any) { onToast(e.message, 'error') }
  }

  const edit = (p: Part) => {
    setForm({
      name: p.name, brand_name: p.brand_name || '', notes: p.notes || '',
      sort_order: p.sort_order, category_id: p.category_id || '',
      image_url: p.image_url, affiliate_url: p.affiliate_url || '',
      price_range: p.price_range || '', key_specs: p.key_specs || [],
      availability: p.availability || '', is_featured: p.is_featured,
    })
    setEditing(p.id)
  }

  if (loading) return <div style={{ color: MUTED, fontSize: 12, padding: 20 }}>Loading...</div>

  const byCat = new Map<string, { label: string; items: Part[] }>()
  parts.forEach(p => {
    const key = p.category_id ?? '__none'
    const label = p.category?.name ?? 'Uncategorised'
    if (!byCat.has(key)) byCat.set(key, { label, items: [] })
    byCat.get(key)!.items.push(p)
  })

  return (
    <div>
      <ErrorBanner message={error} />
      <p style={s.secTitle}>{editing ? 'Edit Part' : 'Add Part'}</p>
      <div style={s.card}>
        {/* Core fields */}
        <div style={s.g2}>
          <Field label="Category">
            <select style={s.select} value={form.category_id} onChange={e => set('category_id', e.target.value)}>
              <option value="">— Uncategorised —</option>
              {[...categories].sort((a, b) => a.sort_order - b.sort_order).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Sort Order">
            <input style={s.input} type="number" value={form.sort_order} onChange={e => set('sort_order', parseInt(e.target.value) || 0)} />
          </Field>
          <Field label="Brand / Manufacturer">
            <input style={s.input} value={form.brand_name} onChange={e => set('brand_name', e.target.value)} placeholder="Bilstein" />
          </Field>
          <Field label="Part Name">
            <input style={s.input} value={form.name} onChange={e => set('name', e.target.value)} placeholder="B8 coilovers" />
          </Field>
        </div>
        <div style={{ marginTop: 10 }}>
          <Field label="Notes / Editorial">
            <input style={s.input} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Front and rear, valved for track use" />
          </Field>
        </div>

        {/* Product/affiliate fields */}
        <details style={{ marginTop: 14 }}>
          <summary style={{ fontSize: 10, color: MUTED, cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Product / Affiliate fields</summary>
          <div style={{ marginTop: 12 }}>
            <ImageUploadField label="Product Image" value={form.image_url} onChange={v => set('image_url', v)} adminSecret={adminSecret} uploadType="parts" />
            <div style={{ ...s.g2, marginTop: 12 }}>
              <Field label="Affiliate / Buy Link">
                <input style={s.input} value={form.affiliate_url} onChange={e => set('affiliate_url', e.target.value)} placeholder="https://amzn.to/..." />
              </Field>
              <Field label="Price Range (editorial)">
                <input style={s.input} value={form.price_range} onChange={e => set('price_range', e.target.value)} placeholder="$450–$600" />
              </Field>
              <Field label="Availability">
                <select style={s.select} value={form.availability} onChange={e => set('availability', e.target.value)}>
                  <option value="">— Not set —</option>
                  <option value="in_stock">In Stock</option>
                  <option value="limited">Limited</option>
                  <option value="discontinued">Discontinued</option>
                </select>
              </Field>
            </div>

            {/* Key specs repeater */}
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <p style={{ ...s.label, margin: 0 }}>Key Specs</p>
                {form.key_specs.length < 8 && (
                  <button style={{ ...s.btn(), marginLeft: 'auto', fontSize: 10 }} onClick={addSpec}>+ Add spec</button>
                )}
              </div>
              {form.key_specs.map((spec, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                  <input style={{ ...s.input, width: 130, flexShrink: 0 }} value={spec.label} onChange={e => updateSpec(i, 'label', e.target.value)} placeholder="Label" />
                  <input style={s.input} value={spec.value} onChange={e => updateSpec(i, 'value', e.target.value)} placeholder="Value" />
                  <button style={{ ...s.btn('danger'), padding: '6px 10px', flexShrink: 0 }} onClick={() => removeSpec(i)}>×</button>
                </div>
              ))}
              {form.key_specs.length === 0 && <p style={{ fontSize: 10, color: '#444' }}>No specs added. Used for product cards and schema.org markup.</p>}
            </div>

            <div style={{ ...s.row, marginTop: 10, gap: 8 }}>
              <input type="checkbox" checked={form.is_featured} onChange={e => set('is_featured', e.target.checked)} id="is_featured" />
              <label htmlFor="is_featured" style={{ fontSize: 11, color: MUTED, cursor: 'pointer' }}>Featured product</label>
            </div>
          </div>
        </details>

        <div style={{ ...s.row, marginTop: 14, justifyContent: 'flex-end' }}>
          {editing && <button style={{ ...s.btn(), marginRight: 8 }} onClick={cancel}>Cancel</button>}
          <button style={s.btn('green')} onClick={save} disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Add Part'}</button>
        </div>
      </div>

      {parts.length === 0 && !loading && <EmptyState message="No mods yet. Add your first part above." />}
      {Array.from(byCat.values()).map(group => (
        <div key={group.label} style={{ marginTop: 20 }}>
          <p style={{ ...s.secTitle, marginBottom: 8 }}>{group.label}</p>
          {group.items.map(p => (
            <div key={p.id} style={s.listItem}>
              {p.image_url && <img src={p.image_url} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                {p.brand_name && <span style={{ fontWeight: 700, color: '#ccc' }}>{p.brand_name} </span>}
                <span style={{ color: '#aaa' }}>{p.name}</span>
                {p.notes && <span style={{ fontSize: 11, color: MUTED }}> — {p.notes}</span>}
                {p.price_range && <span style={{ fontSize: 11, color: G, marginLeft: 8 }}>{p.price_range}</span>}
                {p.availability && <span style={{ fontSize: 10, color: MUTED, marginLeft: 8 }}>{AVAIL_LABELS[p.availability]}</span>}
              </div>
              {p.is_featured && <span style={{ fontSize: 9, color: G, fontWeight: 700, letterSpacing: '0.08em' }}>FEAT</span>}
              <button style={s.btn()} onClick={() => edit(p)}>Edit</button>
              <button style={s.btn('danger')} onClick={() => del(p.id)}>Del</button>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
