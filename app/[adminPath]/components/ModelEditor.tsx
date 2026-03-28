'use client'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { s, Field, Toggle, ErrorBanner, EmptyState, api, useToast, MUTED, G } from './ui'
import { ModelGalleryTab } from './tabs/ModelGalleryTab'
import { ModelStoryTab } from './tabs/ModelStoryTab'
import { ModelStyleTab } from './tabs/ModelStyleTab'
import { ModelWheelSpecsTab } from './tabs/ModelWheelSpecsTab'
import { ModelFitmentTab } from './tabs/ModelFitmentTab'
import { ModelModsTab } from './tabs/ModelModsTab'
import { ModelPartsAssignTab } from './tabs/ModelPartsAssignTab'
import { ModelExtrasTab } from './tabs/ModelExtrasTab'
import { ModelBlocksTab } from './tabs/ModelBlocksTab'
import { ModelBuildsTab } from './tabs/ModelBuildsTab'
import { isAdminEnabled } from '@/lib/features'

type Brand = { id: string; name: string; slug: string }
type Car = { id: string; title: string; slug: string; description: string | null; subtitle: string | null; brand: string | null; brand_id: string | null; cover_image: string | null; is_published: boolean; sort_order: number; seo_title: string | null; seo_description: string | null; brand_data?: Brand | null }

const EMPTY_CAR = { title: '', slug: '', description: '', subtitle: '', brand: '', brand_id: '', cover_image: '', is_published: true, sort_order: 0, seo_title: '', seo_description: '' }
const autoSlug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// ── Model List ──────────────────────────────────────────────────────────────
export function ModelEditor({ adminSecret }: { adminSecret: string }) {
  const [cars, setCars] = useState<Car[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [selected, setSelected] = useState<Car | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const { show, element: toastEl } = useToast()

  const load = useCallback(async () => {
    try {
      const [c, b] = await Promise.all([
        api('cars', 'GET', undefined, adminSecret).then((d: any) => d.cars || []),
        api('brands', 'GET', undefined, adminSecret).then((d: any) => d.brands || []),
      ])
      setCars(c); setBrands(b)
    } catch (e: any) { setError(e.message) }
  }, [adminSecret])

  useEffect(() => { load() }, [load])

  if (selected) {
    return (
      <ModelDetail
        car={selected}
        brands={brands}
        adminSecret={adminSecret}
        onBack={() => { setSelected(null); load() }}
        onUpdate={(updated) => setSelected(updated)}
        onToast={show}
      />
    )
  }

  return (
    <div>
      {toastEl}
      <ErrorBanner message={error} />
      <div style={{ ...s.row, marginBottom: 20, justifyContent: 'space-between' }}>
        <p style={{ ...s.secTitle, margin: 0 }}>Models ({cars.length})</p>
        <button style={s.btn('green')} onClick={() => setCreating(v => !v)}>{creating ? 'Cancel' : '+ New Model'}</button>
      </div>

      {creating && (
        <ModelForm
          brands={brands}
          adminSecret={adminSecret}
          onSave={(car) => { setCreating(false); setSelected(car); load() }}
          onCancel={() => setCreating(false)}
          onToast={show}
        />
      )}

      {cars.length === 0 && !creating && <EmptyState message="No models yet. Create your first model above." />}

      {cars.map(car => (
        <div key={car.id} style={{ ...s.listItem, cursor: 'pointer' }} onClick={() => setSelected(car)}>
          {car.cover_image && (
            <div style={{ width: 56, height: 36, position: 'relative', flexShrink: 0, borderRadius: 2, overflow: 'hidden', background: '#0a0a0a' }}>
              <Image src={car.cover_image} alt={car.title} fill style={{ objectFit: 'cover' }} onError={() => {}} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontWeight: 600, fontSize: 13 }}>{car.title}</span>
            {(car.brand_data?.name || car.brand) && (
              <span style={{ fontSize: 11, color: MUTED, marginLeft: 8 }}>{car.brand_data?.name || car.brand}</span>
            )}
          </div>
          <a href={`/cars/${car.slug}`} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 10, color: MUTED, textDecoration: 'none' }}
            onClick={e => e.stopPropagation()}>↗ view</a>
          <button
            style={{ ...s.btn('danger'), padding: '4px 10px', fontSize: 10 }}
            onClick={async e => {
              e.stopPropagation()
              if (!confirm(`Delete "${car.title}"? This will also delete all photos, builds, and videos.`)) return
              try {
                await api('cars', 'DELETE', { id: car.id }, adminSecret)
                load()
                show('Deleted')
              } catch (ex: any) { show(ex.message, 'error') }
            }}
          >Del</button>
          <span style={{ fontSize: 10, color: '#333' }}>›</span>
        </div>
      ))}
    </div>
  )
}

// ── Model Form (create / edit) ──────────────────────────────────────────────
function ModelForm({ brands, adminSecret, onSave, onCancel, onToast, initial }: {
  brands: Brand[]
  adminSecret: string
  onSave: (car: Car) => void
  onCancel: () => void
  onToast: (msg: string, type?: 'success' | 'error') => void
  initial?: Car
}) {
  const [form, setForm] = useState(initial ? {
    title: initial.title, slug: initial.slug, description: initial.description || '',
    subtitle: initial.subtitle || '', brand: initial.brand || '', brand_id: initial.brand_id || '',
    cover_image: initial.cover_image || '', is_published: initial.is_published,
    sort_order: initial.sort_order, seo_title: initial.seo_title || '', seo_description: initial.seo_description || ''
  } : EMPTY_CAR)
  const [saving, setSaving] = useState(false)

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    if (!form.title.trim()) { onToast('Title is required', 'error'); return }
    if (!form.slug.trim()) { onToast('Slug is required', 'error'); return }
    setSaving(true)
    try {
      const payload = { ...form, is_published: form.is_published === true, brand_id: form.brand_id || null, brand: form.brand || null, description: form.description || null, subtitle: form.subtitle || null, cover_image: form.cover_image || null, seo_title: form.seo_title || null, seo_description: form.seo_description || null }
      let d
      if (initial) d = await api('cars', 'PUT', { id: initial.id, ...payload }, adminSecret)
      else d = await api('cars', 'POST', payload, adminSecret)
      if (!d?.car) throw new Error('Server did not return model data')
      onSave(d.car)
      onToast('Saved')
    } catch (e: any) { onToast(e.message, 'error') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ ...s.card, marginBottom: 20 }}>
      <div style={s.g2}>
        <Field label="Title">
          <input style={s.input} value={form.title}
            onChange={e => { set('title', e.target.value); if (!initial) set('slug', autoSlug(e.target.value)) }}
            placeholder="Honda S2000" />
        </Field>
        <Field label="Slug">
          <input style={s.input} value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="honda-s2000" />
        </Field>
        <Field label="Brand">
          <select style={s.select} value={form.brand_id} onChange={e => { const b = brands.find(b => b.id === e.target.value); set('brand_id', e.target.value); set('brand', b?.name || '') }}>
            <option value="">— No brand —</option>
            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </Field>
        <Field label="Subtitle">
          <input style={s.input} value={form.subtitle} onChange={e => set('subtitle', e.target.value)} placeholder="Short tagline" />
        </Field>
        {/* Cover image is derived from first gallery photo — cover_image field is legacy override only */}
        {form.cover_image ? (
          <div style={{ gridColumn: '1 / -1' }}>
            <p style={s.label}>Cover Image Override (legacy)</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, color: '#666', flex: 1, wordBreak: 'break-all' as const }}>{form.cover_image.slice(0, 80)}{form.cover_image.length > 80 ? '…' : ''}</span>
              <button style={{ ...s.btn('danger'), fontSize: 10, padding: '4px 10px', flexShrink: 0 }} type="button"
                onClick={() => set('cover_image', '')}>Clear override</button>
            </div>
            <p style={{ fontSize: 10, color: '#444', marginTop: 3 }}>Clearing this will use the first gallery photo as cover.</p>
          </div>
        ) : null}        <Field label="Sort Order">
          <input style={s.input} type="number" value={form.sort_order} onChange={e => set('sort_order', parseInt(e.target.value) || 0)} />
        </Field>
      </div>
      <div style={{ marginTop: 12 }}>
        <Field label="Description">
          <textarea style={s.textarea} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Supports formatting: **bold**, *italic*, blank line = new paragraph" />
          <p style={{ fontSize: 10, color: '#444', marginTop: 4, lineHeight: 1.5 }}>
            Formatting: <code style={{ color: G, background: '#111', padding: '0 4px', borderRadius: 2 }}>**bold**</code>{' '}
            <code style={{ color: G, background: '#111', padding: '0 4px', borderRadius: 2 }}>*italic*</code>{' '}
            blank line = new paragraph · single line break = line break
          </p>
        </Field>
      </div>
      <details style={{ marginTop: 12 }}>
        <summary style={{ fontSize: 10, color: MUTED, cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase' }}>SEO fields</summary>
        <div style={{ ...s.g2, marginTop: 10 }}>
          <Field label="SEO Title"><input style={s.input} value={form.seo_title} onChange={e => set('seo_title', e.target.value)} /></Field>
          <Field label="SEO Description"><input style={s.input} value={form.seo_description} onChange={e => set('seo_description', e.target.value)} /></Field>
        </div>
      </details>
      <div style={{ ...s.row, marginTop: 16, justifyContent: 'flex-end' }}>
        <div style={s.row}>
          <button style={s.btn()} onClick={onCancel}>Cancel</button>
          <button style={s.btn('green')} onClick={save} disabled={saving}>{saving ? 'Saving…' : initial ? 'Update' : 'Create Model'}</button>
        </div>
      </div>
    </div>
  )
}

// ── Model Detail — tab router ───────────────────────────────────────────────
// Canonical tab order: Gallery → Story → Style → Specs → Fitment → Mods → Builds → Games → Extras → Info
// Builds and Games are placeholder tabs until global entity slices ship.
// Legacy local builds/games tabs are hidden; data is preserved and shown in Advanced section.
function ModelDetail({ car, brands, adminSecret, onBack, onUpdate, onToast }: {
  car: Car; brands: Brand[]; adminSecret: string
  onBack: () => void; onUpdate: (car: Car) => void
  onToast: (msg: string, type?: 'success' | 'error') => void
}) {
  type DetailTab =
    | 'gallery' | 'story' | 'style' | 'specs' | 'fitment'
    | 'mods' | 'builds' | 'extras' | 'info'
    | 'blocks-advanced'  // advanced/legacy — not in default tab bar

  const [activeTab, setActiveTab] = useState<DetailTab>('gallery')
  const [editing, setEditing] = useState(false)

  // Canonical tab order — all always visible, no feature flags
  const TABS: { key: DetailTab; label: string }[] = [
    { key: 'gallery', label: 'Gallery' },
    { key: 'story',   label: 'Story' },
    { key: 'style',   label: 'Style' },
    { key: 'specs',   label: 'Specs' },
    { key: 'fitment', label: 'Fitment' },
    { key: 'mods',    label: 'Mods' },
    { key: 'builds',  label: 'Builds' },
    { key: 'extras',  label: 'Extras' },
    { key: 'info',    label: 'Info' },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ ...s.row, marginBottom: 20 }}>
        <button style={{ ...s.btn(), padding: '5px 12px' }} onClick={onBack}>← All Models</button>
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{car.title}</span>
          {(car.brand_data?.name || car.brand) && <span style={{ color: MUTED, fontSize: 12, marginLeft: 8 }}>{car.brand_data?.name || car.brand}</span>}
        </div>
        <a href={`/cars/${car.slug}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: G, textDecoration: 'none' }}>↗ View live</a>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: '1px solid #1a1a1a', overflowX: 'auto' as const, flexShrink: 0 }}>
        {TABS.map(t => (
          <button key={t.key}
            style={{ background: activeTab === t.key ? '#1a1a1a' : 'none', color: activeTab === t.key ? G : MUTED, border: 'none', borderBottom: activeTab === t.key ? `2px solid ${G}` : '2px solid transparent', padding: '7px 14px', cursor: 'pointer', fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', fontFamily: 'Manrope, sans-serif', whiteSpace: 'nowrap' }}
            onClick={() => setActiveTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {/* ── Tab content ─────────────────────────────────────────────────── */}
      {activeTab === 'gallery'  && <ModelGalleryTab    carId={car.id} adminSecret={adminSecret} onToast={onToast} />}
      {activeTab === 'story'    && <ModelStoryTab       carId={car.id} adminSecret={adminSecret} initialDescription={car.description} onToast={onToast} />}
      {activeTab === 'style'    && <ModelStyleTab       carId={car.id} adminSecret={adminSecret} onToast={onToast} />}
      {activeTab === 'specs'    && <ModelWheelSpecsTab  carId={car.id} adminSecret={adminSecret} onToast={onToast} />}
      {activeTab === 'fitment'  && <ModelFitmentTab     carId={car.id} adminSecret={adminSecret} onToast={onToast} />}
      {activeTab === 'mods' && (
        <ModelModsSwitcher carId={car.id} adminSecret={adminSecret} onToast={onToast} />
      )}
      {activeTab === 'extras'   && <ModelExtrasTab      carId={car.id} adminSecret={adminSecret} onToast={onToast} />}

      {activeTab === 'builds' && <ModelBuildsTab carId={car.id} adminSecret={adminSecret} onToast={onToast} />}

      {/* Info / SEO */}
      {activeTab === 'info' && (
        editing ? (
          <ModelForm brands={brands} adminSecret={adminSecret} initial={car}
            onSave={(updated) => { onUpdate(updated); setEditing(false); onToast('Saved') }}
            onCancel={() => setEditing(false)} onToast={onToast} />
        ) : (
          <div>
            <div style={s.card}>
              <div style={{ ...s.row, marginBottom: 16, justifyContent: 'space-between' }}>
                <span style={{ color: MUTED, fontSize: 12 }}>Model identity and SEO</span>
                <button style={s.btn()} onClick={() => setEditing(true)}>Edit</button>
              </div>
              <div style={s.g2}>
                {([
                  ['Title', car.title],
                  ['Slug', car.slug],
                  ['Brand', car.brand_data?.name || car.brand || '—'],
                  ['Subtitle', car.subtitle || '—'],
                ] as [string, string][]).map(([label, val]) => (
                  <div key={label}><p style={s.label}>{label}</p><p style={{ fontSize: 12, color: '#ccc' }}>{val}</p></div>
                ))}
              </div>
              {/* Cover image — shows legacy override status */}
              <div style={{ marginTop: 12 }}>
                <p style={s.label}>Cover Image</p>
                {car.cover_image ? (
                  <p style={{ fontSize: 11, color: '#666' }}>
                    Manual override active:{' '}
                    <span style={{ color: '#888', wordBreak: 'break-all' }}>{car.cover_image.slice(0, 60)}{car.cover_image.length > 60 ? '…' : ''}</span>
                  </p>
                ) : (
                  <p style={{ fontSize: 11, color: '#444' }}>Derived from first gallery photo (normal)</p>
                )}
              </div>
            </div>

            {/* Advanced / Legacy section */}
            <details style={{ marginTop: 20 }}>
              <summary style={{ fontSize: 10, color: '#444', cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase', userSelect: 'none', padding: '8px 0' }}>
                Advanced / Legacy
              </summary>
              <div style={{ marginTop: 12 }}>
                <div style={{ ...s.card, marginBottom: 10 }}>
                  <p style={{ fontSize: 11, color: MUTED, marginBottom: 10 }}>Page Layout Blocks</p>
                  <p style={{ fontSize: 11, color: '#555', lineHeight: 1.6, marginBottom: 12 }}>
                    Block configuration controls section order overrides. The default canonical order (Gallery → Story → Style → Specs → Fitment → Mods → Extras) is used when no blocks are configured.
                  </p>
                  <button style={s.btn()} onClick={() => setActiveTab('blocks-advanced')}>Configure blocks →</button>
                </div>
              </div>
            </details>
          </div>
        )
      )}

      {/* Blocks — advanced/legacy, accessible from Info tab only */}
      {activeTab === 'blocks-advanced' && (
        <div>
          <div style={{ ...s.row, marginBottom: 16 }}>
            <button style={{ ...s.btn(), fontSize: 10 }} onClick={() => setActiveTab('info')}>← Back to Info</button>
            <span style={{ fontSize: 11, color: MUTED, marginLeft: 8 }}>Advanced: Page Layout Blocks</span>
          </div>
          <ModelBlocksTab carId={car.id} adminSecret={adminSecret} onToast={onToast} />
        </div>
      )}
    </div>
  )
}

// ── ModelModsSwitcher ─────────────────────────────────────────────────────────
// Internal switcher inside the Mods tab.
// "Legacy Mods" = per-car car_aftermarket_parts (existing flow)
// "Assign Parts" = toggle global_parts onto this model (new Phase 1 flow)
function ModelModsSwitcher({ carId, adminSecret, onToast }: {
  carId: string; adminSecret: string
  onToast: (msg: string, type?: 'success' | 'error') => void
}) {
  const [modsView, setModsView] = useState<'legacy' | 'assign'>('legacy')
  const btnStyle = (active: boolean): React.CSSProperties => ({
    background: active ? '#1a1a1a' : 'none',
    color: active ? G : MUTED,
    border: 'none',
    borderBottom: active ? `2px solid ${G}` : '2px solid transparent',
    padding: '6px 14px',
    cursor: 'pointer',
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    fontFamily: 'Manrope, sans-serif',
  })
  return (
    <div>
      <div style={{ display: 'flex', borderBottom: '1px solid #1a1a1a', marginBottom: 16 }}>
        <button style={btnStyle(modsView === 'legacy')} onClick={() => setModsView('legacy')}>Legacy Mods</button>
        <button style={btnStyle(modsView === 'assign')} onClick={() => setModsView('assign')}>Assign Parts (Global)</button>
      </div>
      {modsView === 'legacy' && <ModelModsTab carId={carId} adminSecret={adminSecret} onToast={onToast} />}
      {modsView === 'assign' && <ModelPartsAssignTab carId={carId} adminSecret={adminSecret} onToast={onToast} />}
    </div>
  )
}
