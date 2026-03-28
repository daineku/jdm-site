'use client'
import { useState, useEffect, useCallback } from 'react'
import { s, Field, Toggle, EmptyState, ErrorBanner, api, useToast, MUTED, G } from './ui'
import { ImageUploadField } from './ImageUploadField'
import { PartCategoriesTab } from './PartCategoriesTab'
import type { GlobalPart, PartCategory } from '@/lib/types'

type InnerTab = 'categories' | 'parts'

type KeySpec = { label: string; value: string }
type Form = {
  title: string; brand_name: string; notes: string
  image_url: string | null; affiliate_url: string; price_range: string
  key_specs: KeySpec[]; availability: string; is_featured: boolean
  sort_order: number; is_published: boolean; part_category_id: string
}
const EMPTY: Form = {
  title: '', brand_name: '', notes: '',
  image_url: null, affiliate_url: '', price_range: '',
  key_specs: [], availability: '', is_featured: false,
  sort_order: 0, is_published: false, part_category_id: '',
}

const AVAIL_LABELS: Record<string, string> = { in_stock: 'In Stock', limited: 'Limited', discontinued: 'Discontinued' }

export function PartsSection({ adminSecret }: { adminSecret: string }) {
  const [tab, setTab] = useState<InnerTab>('categories')
  const [parts, setParts] = useState<GlobalPart[]>([])
  const [categories, setCategories] = useState<PartCategory[]>([])
  const [form, setForm] = useState<Form>(EMPTY)
  const [editing, setEditing] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { show, element: toastEl } = useToast()

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [partsRes, catRes] = await Promise.all([
        api('global-parts', 'GET', undefined, adminSecret),
        api('part-categories', 'GET', undefined, adminSecret),
      ])
      setParts(partsRes.globalParts || [])
      setCategories(catRes.partCategories || [])
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [adminSecret])

  useEffect(() => { if (tab === 'parts') load() }, [tab, load])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const cancel = () => { setForm(EMPTY); setEditing(null) }

  const addSpec = () => setForm(f => ({ ...f, key_specs: [...f.key_specs, { label: '', value: '' }] }))
  const removeSpec = (i: number) => setForm(f => ({ ...f, key_specs: f.key_specs.filter((_, j) => j !== i) }))
  const updateSpec = (i: number, k: 'label' | 'value', v: string) =>
    setForm(f => { const specs = [...f.key_specs]; specs[i] = { ...specs[i], [k]: v }; return { ...f, key_specs: specs } })

  const save = async () => {
    if (!form.title.trim()) { show('Title is required', 'error'); return }
    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        brand_name: form.brand_name.trim() || null,
        notes: form.notes.trim() || null,
        image_url: form.image_url || null,
        affiliate_url: form.affiliate_url.trim() || null,
        price_range: form.price_range.trim() || null,
        key_specs: form.key_specs.filter(s => s.label.trim() && s.value.trim()),
        availability: (form.availability as any) || null,
        is_featured: form.is_featured,
        sort_order: form.sort_order,
        is_published: form.is_published,
        part_category_id: form.part_category_id || null,
      }
      if (editing) await api('global-parts', 'PUT', { id: editing, ...payload }, adminSecret)
      else await api('global-parts', 'POST', payload, adminSecret)
      cancel(); load(); show('Saved')
    } catch (e: any) { show(e.message, 'error') }
    finally { setSaving(false) }
  }

  const del = async (id: string, title: string) => {
    if (!confirm(`Delete part "${title}"? All model assignments will be removed.`)) return
    try { await api('global-parts', 'DELETE', { id }, adminSecret); load(); show('Deleted') }
    catch (e: any) { show(e.message, 'error') }
  }

  const edit = (p: GlobalPart) => {
    setForm({
      title: p.title, brand_name: p.brand_name || '', notes: p.notes || '',
      image_url: p.image_url, affiliate_url: p.affiliate_url || '',
      price_range: p.price_range || '', key_specs: p.key_specs || [],
      availability: p.availability || '', is_featured: p.is_featured,
      sort_order: p.sort_order, is_published: p.is_published,
      part_category_id: p.part_category_id || '',
    })
    setEditing(p.id)
  }

  const TAB_STYLE = (active: boolean): React.CSSProperties => ({
    background: active ? '#1a1a1a' : 'none', color: active ? G : MUTED,
    border: 'none', borderBottom: active ? `2px solid ${G}` : '2px solid transparent',
    padding: '7px 18px', cursor: 'pointer', fontSize: 11, fontWeight: 600,
    letterSpacing: '0.07em', textTransform: 'uppercase', fontFamily: 'Manrope, sans-serif',
  })

  return (
    <div>
      {toastEl}
      <div style={{ display: 'flex', borderBottom: '1px solid #1a1a1a', marginBottom: 20 }}>
        <button style={TAB_STYLE(tab === 'categories')} onClick={() => setTab('categories')}>Part Categories</button>
        <button style={TAB_STYLE(tab === 'parts')} onClick={() => setTab('parts')}>Parts</button>
      </div>

      {tab === 'categories' && <PartCategoriesTab adminSecret={adminSecret} />}

      {tab === 'parts' && (
        <div>
          <ErrorBanner message={error} />
          <p style={s.secTitle}>{editing ? 'Edit Part' : 'Add Part'}</p>
          <p style={{ fontSize: 11, color: MUTED, marginBottom: 14 }}>
            Parts are global affiliate/product entries. Assign them to models via each model's Parts tab.
          </p>
          <div style={s.card}>
            <div style={s.g2}>
              <Field label="Category">
                <select style={s.select} value={form.part_category_id} onChange={e => set('part_category_id', e.target.value)}>
                  <option value="">— No category —</option>
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
              <Field label="Part Title *">
                <input style={s.input} value={form.title} onChange={e => set('title', e.target.value)} placeholder="B8 Performance Plus Coilovers" />
              </Field>
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
            <div style={{ marginTop: 10 }}>
              <Field label="Notes / Editorial">
                <input style={s.input} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Front and rear, street-biased valving" />
              </Field>
            </div>
            <div style={{ marginTop: 14 }}>
              <ImageUploadField label="Product Image" value={form.image_url} onChange={v => set('image_url', v)} adminSecret={adminSecret} uploadType="parts" />
            </div>

            {/* Key specs repeater */}
            <div style={{ marginTop: 14 }}>
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
            </div>

            <div style={{ ...s.row, marginTop: 14, justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={s.row}>
                  <input type="checkbox" checked={form.is_featured} onChange={e => set('is_featured', e.target.checked)} id="feat" />
                  <label htmlFor="feat" style={{ fontSize: 11, color: MUTED, cursor: 'pointer', marginLeft: 4 }}>Featured</label>
                </div>
                <div style={s.row}>
                  <Toggle value={form.is_published} onChange={v => set('is_published', v)} />
                  <span style={{ fontSize: 11, color: MUTED }}>Published</span>
                </div>
              </div>
              <div style={s.row}>
                {editing && <button style={s.btn()} onClick={cancel}>Cancel</button>}
                <button style={s.btn('green')} onClick={save} disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Add Part'}</button>
              </div>
            </div>
          </div>

          <p style={{ ...s.secTitle, marginTop: 28 }}>All Parts ({parts.length})</p>
          {loading && <div style={{ color: MUTED, fontSize: 12, padding: 12 }}>Loading...</div>}
          {!loading && parts.length === 0 && <EmptyState message="No parts yet. Add your first part above." />}
          {[...parts].sort((a, b) => a.sort_order - b.sort_order).map(p => (
            <div key={p.id} style={s.listItem}>
              {p.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image_url} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                {p.brand_name && <span style={{ fontWeight: 700, color: '#ccc' }}>{p.brand_name} </span>}
                <span style={{ color: '#aaa' }}>{p.title}</span>
                {p.category && <span style={{ fontSize: 11, color: MUTED, marginLeft: 8 }}>{p.category.name}</span>}
                {p.price_range && <span style={{ fontSize: 11, color: G, marginLeft: 8 }}>{p.price_range}</span>}
                {p.availability && <span style={{ fontSize: 10, color: MUTED, marginLeft: 8 }}>{AVAIL_LABELS[p.availability]}</span>}
              </div>
              {p.is_featured && <span style={{ fontSize: 9, color: G, fontWeight: 700, letterSpacing: '0.08em' }}>FEAT</span>}
              <span style={s.badge(p.is_published)}>{p.is_published ? 'Published' : 'Draft'}</span>
              <button style={s.btn()} onClick={() => edit(p)}>Edit</button>
              <button style={s.btn('danger')} onClick={() => del(p.id, p.title)}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
