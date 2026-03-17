'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { s, Field, Toggle, ErrorBanner, EmptyState, api, useToast, MUTED, G, CARD, BORDER } from './ui'

type Brand = { id: string; name: string; slug: string }
type Car = { id: string; title: string; slug: string; description: string | null; subtitle: string | null; brand: string | null; brand_id: string | null; cover_image: string | null; is_published: boolean; sort_order: number; seo_title: string | null; seo_description: string | null; brand_data?: Brand | null }
type Photo = { id: string; car_id: string; url: string; thumb_url: string | null; orientation: string; show_on_home: boolean; home_sort_order: number; sort_order: number; is_visible: boolean; caption: string | null; alt_text: string | null }
type Build = { id: string; title: string; description: string | null; is_visible: boolean; sort_order: number; parts: string[]; build_parts?: { id: string; name: string; notes: string | null; sort_order: number }[] }
type Video = { id: string; tiktok_url: string; embed_id: string | null; title: string | null; sort_order: number; is_visible: boolean }
type Game = { id: string; game_title: string; game_logo_url: string | null; description: string | null; external_url: string | null; sort_order: number; is_visible: boolean }
type Block = { id: string; block_type: string; title: string | null; sort_order: number; is_visible: boolean; config: Record<string, any> }

const EMPTY_CAR = { title: '', slug: '', description: '', subtitle: '', brand: '', brand_id: '', cover_image: '', is_published: false, sort_order: 0, seo_title: '', seo_description: '' }
const autoSlug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const BLOCK_TYPES = ['gallery', 'builds', 'accessories', 'videos', 'racing_games', 'rich_text', 'media']

// ── Model List ──────────────────────────────────────────────
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
          <span style={s.badge(car.is_published)}>{car.is_published ? 'Live' : 'Draft'}</span>
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

// ── Model Form (create/edit) ────────────────────────────────
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
        <Field label="Cover Image URL">
          <input style={s.input} value={form.cover_image} onChange={e => set('cover_image', e.target.value)} placeholder="https://…" />
        </Field>
        <Field label="Sort Order">
          <input style={s.input} type="number" value={form.sort_order} onChange={e => set('sort_order', parseInt(e.target.value) || 0)} />
        </Field>
      </div>
      <div style={{ marginTop: 12 }}>
        <Field label="Description">
          <textarea style={s.textarea} value={form.description} onChange={e => set('description', e.target.value)} />
        </Field>
      </div>
      <details style={{ marginTop: 12 }}>
        <summary style={{ fontSize: 10, color: MUTED, cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase' }}>SEO fields</summary>
        <div style={{ ...s.g2, marginTop: 10 }}>
          <Field label="SEO Title"><input style={s.input} value={form.seo_title} onChange={e => set('seo_title', e.target.value)} /></Field>
          <Field label="SEO Description"><input style={s.input} value={form.seo_description} onChange={e => set('seo_description', e.target.value)} /></Field>
        </div>
      </details>
      <div style={{ ...s.row, marginTop: 16, justifyContent: 'space-between' }}>
        <div style={s.row}><Toggle value={form.is_published} onChange={v => set('is_published', v)} /><span style={{ fontSize: 11, color: MUTED }}>Published</span></div>
        <div style={s.row}>
          <button style={s.btn()} onClick={onCancel}>Cancel</button>
          <button style={s.btn('green')} onClick={save} disabled={saving}>{saving ? 'Saving…' : initial ? 'Update' : 'Create Model'}</button>
        </div>
      </div>
    </div>
  )
}

// ── Model Detail Page ───────────────────────────────────────
function ModelDetail({ car, brands, adminSecret, onBack, onUpdate, onToast }: {
  car: Car; brands: Brand[]; adminSecret: string
  onBack: () => void; onUpdate: (car: Car) => void
  onToast: (msg: string, type?: 'success' | 'error') => void
}) {
  type DetailTab = 'info' | 'gallery' | 'builds' | 'videos' | 'games' | 'blocks'
  const [activeTab, setActiveTab] = useState<DetailTab>('gallery')
  const [editing, setEditing] = useState(false)

  const DETAIL_TABS: { key: DetailTab; label: string }[] = [
    { key: 'gallery', label: 'Gallery' },
    { key: 'builds', label: 'Builds' },
    { key: 'videos', label: 'Videos' },
    { key: 'games', label: 'Games' },
    { key: 'blocks', label: 'Blocks' },
    { key: 'info', label: 'Info / SEO' },
  ]

  return (
    <div>
      {/* Back + header */}
      <div style={{ ...s.row, marginBottom: 20 }}>
        <button style={{ ...s.btn(), padding: '5px 12px' }} onClick={onBack}>← All Models</button>
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{car.title}</span>
          {(car.brand_data?.name || car.brand) && <span style={{ color: MUTED, fontSize: 12, marginLeft: 8 }}>{car.brand_data?.name || car.brand}</span>}
        </div>
        <a href={`/cars/${car.slug}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: G, textDecoration: 'none' }}>↗ View live</a>
        <span style={s.badge(car.is_published)}>{car.is_published ? 'Live' : 'Draft'}</span>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: '1px solid #1a1a1a', paddingBottom: 0, overflowX: 'auto' as const, flexShrink: 0 }}>
        {DETAIL_TABS.map(t => (
          <button key={t.key}
            style={{ background: activeTab === t.key ? '#1a1a1a' : 'none', color: activeTab === t.key ? G : MUTED, border: 'none', borderBottom: activeTab === t.key ? `2px solid ${G}` : '2px solid transparent', padding: '7px 14px', cursor: 'pointer', fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', fontFamily: 'Manrope, sans-serif' }}
            onClick={() => setActiveTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {activeTab === 'info' && (
        editing ? (
          <ModelForm brands={brands} adminSecret={adminSecret} initial={car}
            onSave={(updated) => { onUpdate(updated); setEditing(false); onToast('Saved') }}
            onCancel={() => setEditing(false)} onToast={onToast} />
        ) : (
          <div style={s.card}>
            <div style={{ ...s.row, marginBottom: 16, justifyContent: 'space-between' }}>
              <span style={{ color: MUTED, fontSize: 12 }}>Model information and SEO</span>
              <button style={s.btn()} onClick={() => setEditing(true)}>Edit</button>
            </div>
            <div style={s.g2}>
              {[['Title', car.title], ['Slug', car.slug], ['Brand', car.brand_data?.name || car.brand || '—'], ['Subtitle', car.subtitle || '—'], ['Cover Image', car.cover_image || '—'], ['Published', car.is_published ? 'Yes' : 'No']].map(([label, val]) => (
                <div key={label}><p style={s.label}>{label}</p><p style={{ fontSize: 12, color: '#ccc' }}>{val}</p></div>
              ))}
            </div>
            {car.description && <div style={{ marginTop: 12 }}><p style={s.label}>Description</p><p style={{ fontSize: 12, color: '#888', lineHeight: 1.6 }}>{car.description}</p></div>}
          </div>
        )
      )}
      {activeTab === 'gallery' && <ModelGallery carId={car.id} adminSecret={adminSecret} onToast={onToast} />}
      {activeTab === 'builds' && <ModelBuilds carId={car.id} adminSecret={adminSecret} onToast={onToast} />}
      {activeTab === 'videos' && <ModelVideos carId={car.id} adminSecret={adminSecret} onToast={onToast} />}
      {activeTab === 'games' && <ModelGames carId={car.id} adminSecret={adminSecret} onToast={onToast} />}
      {activeTab === 'blocks' && <ModelBlocks carId={car.id} adminSecret={adminSecret} onToast={onToast} />}
    </div>
  )
}

// ── Model Gallery ───────────────────────────────────────────
function ModelGallery({ carId, adminSecret, onToast }: { carId: string; adminSecret: string; onToast: (msg: string, type?: 'success' | 'error') => void }) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadQueue, setUploadQueue] = useState<{ name: string; status: 'pending' | 'done' | 'error' }[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const PAGE_SIZE = 24

  const load = useCallback(async (reset = false) => {
    const p = reset ? 0 : page
    if (reset) { setPage(0); setPhotos([]) }
    try {
      const d = await api(`photos?car_id=${carId}&offset=${p * PAGE_SIZE}&limit=${PAGE_SIZE}`, 'GET', undefined, adminSecret)
      const incoming: Photo[] = d.photos || []
      if (reset) { setPhotos(incoming) } else { setPhotos(prev => [...prev, ...incoming]) }
      setHasMore(incoming.length === PAGE_SIZE)
      if (!reset) setPage(p + 1)
    } catch (e: any) { onToast(e.message, 'error') }
    finally { setLoading(false) }
  }, [carId, adminSecret, page, onToast])

  useEffect(() => { load(true) }, [carId]) // eslint-disable-line

  // Infinite scroll sentinel
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return
    const obs = new IntersectionObserver(entries => { if (entries[0].isIntersecting) load() }, { threshold: 0.1 })
    obs.observe(sentinelRef.current)
    return () => obs.disconnect()
  }, [sentinelRef, hasMore, load])

  // ── Upload pipeline ─────────────────────────────────────────
  // Architecture: client-side HEIC conversion + canvas compression → POST to /api/admin/upload
  // heic2any converts HEIC to JPEG in browser (no server dependency)
  // Canvas resizes to max 2400px JPEG (typically 0.5–3MB, well under Vercel 4.5MB limit)
  // Server receives compressed JPEG, generates 800px thumbnail via sharp, saves both to R2+DB

  const blobToJpeg = (blob: Blob, maxDim: number, quality: number): Promise<{ blob: Blob; orientation: 'vertical' | 'horizontal' }> =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob)
      const img = document.createElement('img')
      img.onload = () => {
        URL.revokeObjectURL(url)
        const w = img.naturalWidth, h = img.naturalHeight
        const orientation: 'vertical' | 'horizontal' = h > w ? 'vertical' : 'horizontal'
        let outW = w, outH = h
        if (w > maxDim || h > maxDim) {
          if (w >= h) { outW = maxDim; outH = Math.round(h * maxDim / w) }
          else { outH = maxDim; outW = Math.round(w * maxDim / h) }
        }
        const canvas = document.createElement('canvas')
        canvas.width = outW; canvas.height = outH
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('Canvas not available')); return }
        ctx.drawImage(img, 0, 0, outW, outH)
        canvas.toBlob(
          out => out ? resolve({ blob: out, orientation }) : reject(new Error('Canvas compression failed')),
          'image/jpeg', quality
        )
      }
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')) }
      img.src = url
    })

  const prepareFile = async (file: File): Promise<{ blob: Blob; orientation: 'vertical' | 'horizontal' }> => {
    const ext = (file.name.split('.').pop() || '').toLowerCase()
    let source: Blob = file

    if (ext === 'heic' || ext === 'heif') {
      // Convert HEIC to JPEG in the browser — requires heic2any (bundled in package.json)
      try {
        const heic2any = (await import('heic2any')).default as any
        const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 })
        source = Array.isArray(result) ? result[0] : result
      } catch (e: any) {
        throw new Error(`HEIC conversion failed: ${e.message}. Try converting the file to JPEG first.`)
      }
    }

    // Compress to max 2400px JPEG — keeps file under Vercel limit
    return blobToJpeg(source, 2400, 0.88)
  }

  const uploadFiles = async (files: FileList) => {
    if (uploading) return
    const fileArr = Array.from(files)
    if (fileArr.length === 0) return

    const ALLOWED = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif']
    for (const f of fileArr) {
      const ext = (f.name.split('.').pop() || '').toLowerCase()
      if (!ALLOWED.includes(ext)) {
        onToast(`${f.name}: unsupported format (.${ext}). Use JPEG, PNG, WEBP, or HEIC.`, 'error')
        return
      }
    }

    setUploading(true)
    setUploadQueue(fileArr.map(f => ({ name: f.name, status: 'pending' as const })))

    let successCount = 0
    for (let i = 0; i < fileArr.length; i++) {
      const file = fileArr[i]
      try {
        // Prepare: convert HEIC if needed, compress via Canvas
        const { blob, orientation } = await prepareFile(file)

        // POST compressed JPEG to server (bypasses Vercel limit since blob is small)
        const fd = new FormData()
        fd.append('file', blob, 'photo.jpg')
        fd.append('car_id', carId)
        fd.append('orientation', orientation)

        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: { 'x-admin-secret': adminSecret },
          body: fd,
        })
        let json: any = {}
        try { json = await res.json() } catch { json = { error: `Server error ${res.status}` } }
        if (!res.ok) throw new Error(json.error || `Upload failed (${res.status})`)

        setUploadQueue(q => q.map((item, j) => j === i ? { ...item, status: 'done' as const } : item))
        successCount++
      } catch (e: any) {
        setUploadQueue(q => q.map((item, j) => j === i ? { ...item, status: 'error' as const } : item))
        onToast(`${file.name}: ${e.message}`, 'error')
      }
    }

    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
    if (successCount > 0) {
      onToast(
        successCount === fileArr.length
          ? `Uploaded ${successCount} photo${successCount !== 1 ? 's' : ''}`
          : `Uploaded ${successCount} of ${fileArr.length} — check errors above`
      )
      load(true)
    }
    setTimeout(() => setUploadQueue([]), 5000)
  }

    const updatePhoto = async (id: string, updates: Partial<Photo>) => {
    try {
      await api('photos', 'PUT', { id, ...updates }, adminSecret)
      setPhotos(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
      // Notify user to refresh homepage tab if home visibility changed
      if ('show_on_home' in updates) {
        onToast(updates.show_on_home ? 'Added to homepage — visit Homepage tab to set order & caption' : 'Removed from homepage')
      }
    } catch (e: any) { onToast(e.message, 'error') }
  }

  const delPhoto = async (photo: Photo) => {
    if (!confirm('Delete this photo? This cannot be undone.')) return
    try {
      await api('photos', 'DELETE', { id: photo.id, url: photo.url, thumb_url: photo.thumb_url }, adminSecret)
      setPhotos(prev => prev.filter(p => p.id !== photo.id))
      onToast('Deleted')
    } catch (e: any) { onToast(e.message, 'error') }
  }

  if (loading) return <div style={{ color: MUTED, fontSize: 12, padding: 20 }}>Loading…</div>

  return (
    <div>
      {/* Upload area */}
      <div style={{ ...s.row, marginBottom: 14, gap: 8 }}>
        <button style={s.btn('green')} onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? 'Uploading…' : '+ Upload Photos'}
        </button>
        <span style={{ fontSize: 11, color: MUTED }}>{photos.length} photo{photos.length !== 1 ? 's' : ''}</span>
        <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif" multiple style={{ display: 'none' }} onChange={e => e.target.files && uploadFiles(e.target.files)} />
      </div>

      <div
        style={{ border: `2px dashed ${dragOver ? G : '#1e1e1e'}`, borderRadius: 3, padding: '20px', textAlign: 'center', marginBottom: 16, cursor: 'pointer', transition: 'border-color 0.15s' }}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); e.dataTransfer.files && uploadFiles(e.dataTransfer.files) }}
        onClick={() => fileRef.current?.click()}
      >
        <p style={{ color: dragOver ? G : '#333', fontSize: 12, margin: 0 }}>
          {uploading ? 'Uploading…' : 'Drop photos here · JPEG · PNG · WEBP · HEIC — converted & compressed automatically'}
        </p>
      </div>

      {/* Upload queue */}
      {uploadQueue.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          {uploadQueue.map((item, i) => (
            <div key={i} style={{ ...s.row, padding: '4px 0', fontSize: 11 }}>
              <span style={{ color: item.status === 'done' ? G : item.status === 'error' ? '#e24b4a' : MUTED }}>
                {item.status === 'done' ? '✓' : item.status === 'error' ? '✗' : '…'}
              </span>
              <span style={{ color: '#888' }}>{item.name}</span>
            </div>
          ))}
        </div>
      )}

      {photos.length === 0 && <EmptyState message="No photos yet. Upload photos above." />}

      {/* Photo grid */}
      <div style={s.g3}>
        {photos.map(photo => (
          <div key={photo.id} style={{ ...s.card, padding: 0, overflow: 'hidden' }}>
            <div style={{ position: 'relative', aspectRatio: photo.orientation === 'vertical' ? '2/3' : '16/9', background: '#0a0a0a' }}>
              {(photo.thumb_url || photo.url) ? (
                <Image src={photo.thumb_url || photo.url} alt={photo.alt_text || ''} fill style={{ objectFit: 'cover' }} onError={() => {}} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 10, color: '#333' }}>No image</span>
                </div>
              )}
            </div>
            <div style={{ padding: '8px 10px' }}>
              <input
                style={{ ...s.input, fontSize: 10, marginBottom: 6 }}
                defaultValue={photo.caption || ''}
                placeholder="Caption…"
                onBlur={e => { if (e.target.value !== (photo.caption || '')) updatePhoto(photo.id, { caption: e.target.value || null }) }}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                <button style={s.badge(photo.show_on_home)} onClick={() => updatePhoto(photo.id, { show_on_home: !photo.show_on_home })} title="Show on homepage">
                  {photo.show_on_home ? '● Home' : '○ Home'}
                </button>
                <button style={s.badge(photo.is_visible)} onClick={() => updatePhoto(photo.id, { is_visible: !photo.is_visible })}>
                  {photo.is_visible ? 'Visible' : 'Hidden'}
                </button>
                <button
                  style={{ ...s.badge(false), color: '#666' }}
                  onClick={() => updatePhoto(photo.id, { orientation: photo.orientation === 'vertical' ? 'horizontal' : 'vertical' })}
                  title="Toggle orientation"
                >
                  {photo.orientation === 'vertical' ? '↕ V' : '↔ H'}
                </button>
                <button style={{ ...s.btn('danger'), padding: '3px 7px', fontSize: 10, marginLeft: 'auto' }} onClick={() => delPhoto(photo)}>✕</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMore && <div ref={sentinelRef} style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 16, height: 16, border: `2px solid #222`, borderTopColor: G, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /></div>}
    </div>
  )
}

// ── Model Builds ────────────────────────────────────────────
function ModelBuilds({ carId, adminSecret, onToast }: { carId: string; adminSecret: string; onToast: (msg: string, type?: 'success' | 'error') => void }) {
  const [builds, setBuilds] = useState<Build[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const emptyBuild = { title: '', description: '', is_visible: true, sort_order: 0 }
  const [form, setForm] = useState(emptyBuild)
  const [parts, setParts] = useState<{ name: string; notes: string }[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api(`builds?car_id=${carId}`, 'GET', undefined, adminSecret)
      .then((d: any) => setBuilds(d.builds || []))
      .catch((e: any) => onToast(e.message, 'error'))
      .finally(() => setLoading(false))
  }, [carId, adminSecret]) // eslint-disable-line

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    if (!form.title.trim()) { onToast('Title is required', 'error'); return }
    setSaving(true)
    try {
      const payload = { ...form, car_id: carId, build_parts: parts.filter(p => p.name.trim()).map((p, i) => ({ name: p.name.trim(), notes: p.notes || null, sort_order: i })) }
      let d
      if (editing) d = await api('builds', 'PUT', { id: editing, ...payload }, adminSecret)
      else d = await api('builds', 'POST', payload, adminSecret)
      const updated = d.build
      if (editing) setBuilds(prev => prev.map(b => b.id === editing ? { ...updated, build_parts: payload.build_parts } : b))
      else setBuilds(prev => [...prev, { ...updated, build_parts: payload.build_parts }])
      setForm(emptyBuild); setParts([]); setEditing(null)
      onToast('Saved')
    } catch (e: any) { onToast(e.message, 'error') }
    finally { setSaving(false) }
  }

  const del = async (id: string) => {
    if (!confirm('Delete this build?')) return
    try { await api('builds', 'DELETE', { id }, adminSecret); setBuilds(prev => prev.filter(b => b.id !== id)); onToast('Deleted') }
    catch (e: any) { onToast(e.message, 'error') }
  }

  const edit = (b: Build) => {
    setForm({ title: b.title, description: b.description || '', is_visible: b.is_visible, sort_order: b.sort_order })
    const bp = b.build_parts && b.build_parts.length > 0 ? b.build_parts.sort((a, b) => a.sort_order - b.sort_order).map(p => ({ name: p.name, notes: p.notes || '' })) : (b.parts || []).map(p => ({ name: p, notes: '' }))
    setParts(bp); setEditing(b.id)
  }

  if (loading) return <div style={{ color: MUTED, fontSize: 12, padding: 16 }}>Loading…</div>

  return (
    <div>
      <p style={s.secTitle}>{editing ? 'Edit Build' : 'Add Build'}</p>
      <div style={s.card}>
        <div style={s.g2}>
          <Field label="Title"><input style={s.input} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Stage 2 Track Build" /></Field>
          <Field label="Sort Order"><input style={s.input} type="number" value={form.sort_order} onChange={e => set('sort_order', parseInt(e.target.value) || 0)} /></Field>
        </div>
        <div style={{ marginTop: 10 }}><Field label="Description"><textarea style={s.textarea} value={form.description} onChange={e => set('description', e.target.value)} /></Field></div>
        <div style={{ marginTop: 14 }}>
          <div style={{ ...s.row, marginBottom: 8 }}>
            <p style={{ ...s.label, margin: 0 }}>Parts List</p>
            <button style={{ ...s.btn(), marginLeft: 'auto', fontSize: 10 }} onClick={() => setParts(p => [...p, { name: '', notes: '' }])}>+ Part</button>
          </div>
          {parts.map((part, i) => (
            <div key={i} style={{ ...s.row, marginBottom: 5 }}>
              <input style={s.input} value={part.name} onChange={e => setParts(p => { const n = [...p]; n[i] = { ...n[i], name: e.target.value }; return n })} placeholder="Part name" />
              <input style={{ ...s.input, maxWidth: 140 }} value={part.notes} onChange={e => setParts(p => { const n = [...p]; n[i] = { ...n[i], notes: e.target.value }; return n })} placeholder="Notes" />
              <button style={{ ...s.btn('danger'), padding: '6px 9px' }} onClick={() => setParts(p => p.filter((_, j) => j !== i))}>✕</button>
            </div>
          ))}
        </div>
        <div style={{ ...s.row, marginTop: 14, justifyContent: 'space-between' }}>
          <div style={s.row}><Toggle value={form.is_visible} onChange={v => set('is_visible', v)} /><span style={{ fontSize: 11, color: MUTED }}>Visible</span></div>
          <div style={s.row}>
            {editing && <button style={s.btn()} onClick={() => { setForm(emptyBuild); setParts([]); setEditing(null) }}>Cancel</button>}
            <button style={s.btn('green')} onClick={save} disabled={saving}>{saving ? 'Saving…' : editing ? 'Update' : 'Add Build'}</button>
          </div>
        </div>
      </div>

      {builds.length === 0 && <EmptyState message="No builds yet." />}
      {builds.map(build => (
        <div key={build.id} style={s.listItem}>
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 600 }}>{build.title}</span>
            {build.build_parts && build.build_parts.length > 0 && <span style={{ fontSize: 10, color: MUTED, marginLeft: 8 }}>{build.build_parts.length} parts</span>}
            {(!build.build_parts || build.build_parts.length === 0) && build.parts?.length > 0 && <span style={{ fontSize: 10, color: MUTED, marginLeft: 8 }}>{build.parts.length} parts (legacy)</span>}
          </div>
          <span style={s.badge(build.is_visible)}>{build.is_visible ? 'Visible' : 'Hidden'}</span>
          <button style={s.btn()} onClick={() => edit(build)}>Edit</button>
          <button style={s.btn('danger')} onClick={() => del(build.id)}>Del</button>
        </div>
      ))}
    </div>
  )
}

// ── Model Videos ────────────────────────────────────────────
function ModelVideos({ carId, adminSecret, onToast }: { carId: string; adminSecret: string; onToast: (msg: string, type?: 'success' | 'error') => void }) {
  const [videos, setVideos] = useState<Video[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const empty = { tiktok_url: '', embed_id: '', title: '', sort_order: 0, is_visible: true }
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  useEffect(() => { api(`videos?car_id=${carId}`, 'GET', undefined, adminSecret).then((d: any) => setVideos(d.videos || [])).catch((e: any) => onToast(e.message, 'error')) }, [carId, adminSecret]) // eslint-disable-line
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const extractId = (url: string) => { try { const m = url.match(/video\/(\d+)/); return m ? m[1] : '' } catch { return '' } }

  const save = async () => {
    if (!form.tiktok_url.trim()) { onToast('URL is required', 'error'); return }
    setSaving(true)
    try {
      const payload = { ...form, car_id: carId, embed_id: form.embed_id || extractId(form.tiktok_url) || null, tiktok_url: form.tiktok_url, title: form.title || null }
      let d
      if (editing) d = await api('videos', 'PUT', { id: editing, ...payload }, adminSecret)
      else d = await api('videos', 'POST', payload, adminSecret)
      if (editing) setVideos(prev => prev.map(v => v.id === editing ? d.video : v))
      else setVideos(prev => [...prev, d.video])
      setForm(empty); setEditing(null); onToast('Saved')
    } catch (e: any) { onToast(e.message, 'error') }
    finally { setSaving(false) }
  }

  const del = async (id: string) => { if (!confirm('Delete?')) return; try { await api('videos', 'DELETE', { id }, adminSecret); setVideos(prev => prev.filter(v => v.id !== id)); onToast('Deleted') } catch (e: any) { onToast(e.message, 'error') } }
  const edit = (v: Video) => { setForm({ tiktok_url: v.tiktok_url, embed_id: v.embed_id || '', title: v.title || '', sort_order: v.sort_order, is_visible: v.is_visible }); setEditing(v.id) }

  return (
    <div>
      <div style={s.card}>
        <div style={s.g2}>
          <Field label="TikTok URL"><input style={s.input} value={form.tiktok_url} onChange={e => set('tiktok_url', e.target.value)} placeholder="https://www.tiktok.com/@user/video/…" /></Field>
          <Field label="Title (optional)"><input style={s.input} value={form.title} onChange={e => set('title', e.target.value)} /></Field>
          <Field label="Sort Order"><input style={s.input} type="number" value={form.sort_order} onChange={e => set('sort_order', parseInt(e.target.value) || 0)} /></Field>
        </div>
        <div style={{ ...s.row, marginTop: 14, justifyContent: 'space-between' }}>
          <div style={s.row}><Toggle value={form.is_visible} onChange={v => set('is_visible', v)} /><span style={{ fontSize: 11, color: MUTED }}>Visible</span></div>
          <div style={s.row}>
            {editing && <button style={s.btn()} onClick={() => { setForm(empty); setEditing(null) }}>Cancel</button>}
            <button style={s.btn('green')} onClick={save} disabled={saving}>{saving ? 'Saving…' : editing ? 'Update' : 'Add Video'}</button>
          </div>
        </div>
      </div>
      {videos.length === 0 && <EmptyState message="No videos yet." />}
      {videos.map(v => (
        <div key={v.id} style={s.listItem}>
          <div style={{ flex: 1, minWidth: 0 }}><span style={{ fontWeight: 600 }}>{v.title || v.tiktok_url.slice(0, 50) + '…'}</span></div>
          <span style={s.badge(v.is_visible)}>{v.is_visible ? 'Visible' : 'Hidden'}</span>
          <button style={s.btn()} onClick={() => edit(v)}>Edit</button>
          <button style={s.btn('danger')} onClick={() => del(v.id)}>Del</button>
        </div>
      ))}
    </div>
  )
}

// ── Model Games ─────────────────────────────────────────────
function ModelGames({ carId, adminSecret, onToast }: { carId: string; adminSecret: string; onToast: (msg: string, type?: 'success' | 'error') => void }) {
  const [games, setGames] = useState<Game[]>([])
  const empty = { game_title: '', game_logo_url: '', description: '', external_url: '', sort_order: 0, is_visible: true }
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { api(`games?car_id=${carId}`, 'GET', undefined, adminSecret).then((d: any) => setGames(d.games || [])).catch((e: any) => onToast(e.message, 'error')) }, [carId, adminSecret]) // eslint-disable-line
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    if (!form.game_title.trim()) { onToast('Game title is required', 'error'); return }
    setSaving(true)
    try {
      const payload = { ...form, car_id: carId, game_logo_url: form.game_logo_url || null, description: form.description || null, external_url: form.external_url || null }
      let d
      if (editing) d = await api('games', 'PUT', { id: editing, ...payload }, adminSecret)
      else d = await api('games', 'POST', payload, adminSecret)
      if (editing) setGames(prev => prev.map(g => g.id === editing ? d.game : g))
      else setGames(prev => [...prev, d.game])
      setForm(empty); setEditing(null); onToast('Saved')
    } catch (e: any) { onToast(e.message, 'error') }
    finally { setSaving(false) }
  }

  const del = async (id: string) => { if (!confirm('Delete?')) return; try { await api('games', 'DELETE', { id }, adminSecret); setGames(prev => prev.filter(g => g.id !== id)); onToast('Deleted') } catch (e: any) { onToast(e.message, 'error') } }
  const edit = (g: Game) => { setForm({ game_title: g.game_title, game_logo_url: g.game_logo_url || '', description: g.description || '', external_url: g.external_url || '', sort_order: g.sort_order, is_visible: g.is_visible }); setEditing(g.id) }

  return (
    <div>
      <div style={s.card}>
        <div style={s.g2}>
          <Field label="Game Title"><input style={s.input} value={form.game_title} onChange={e => set('game_title', e.target.value)} placeholder="Gran Turismo 7" /></Field>
          <Field label="Logo URL"><input style={s.input} value={form.game_logo_url} onChange={e => set('game_logo_url', e.target.value)} placeholder="https://…" /></Field>
          <Field label="Link (optional)"><input style={s.input} value={form.external_url} onChange={e => set('external_url', e.target.value)} /></Field>
          <Field label="Sort Order"><input style={s.input} type="number" value={form.sort_order} onChange={e => set('sort_order', parseInt(e.target.value) || 0)} /></Field>
        </div>
        <div style={{ marginTop: 10 }}><Field label="Description"><textarea style={s.textarea} value={form.description} onChange={e => set('description', e.target.value)} /></Field></div>
        <div style={{ ...s.row, marginTop: 14, justifyContent: 'space-between' }}>
          <div style={s.row}><Toggle value={form.is_visible} onChange={v => set('is_visible', v)} /><span style={{ fontSize: 11, color: MUTED }}>Visible</span></div>
          <div style={s.row}>
            {editing && <button style={s.btn()} onClick={() => { setForm(empty); setEditing(null) }}>Cancel</button>}
            <button style={s.btn('green')} onClick={save} disabled={saving}>{saving ? 'Saving…' : editing ? 'Update' : 'Add Game'}</button>
          </div>
        </div>
      </div>
      {games.length === 0 && <EmptyState message="No games yet." />}
      {games.map(g => (
        <div key={g.id} style={s.listItem}>
          <span style={{ flex: 1, fontWeight: 600 }}>{g.game_title}</span>
          <span style={s.badge(g.is_visible)}>{g.is_visible ? 'Visible' : 'Hidden'}</span>
          <button style={s.btn()} onClick={() => edit(g)}>Edit</button>
          <button style={s.btn('danger')} onClick={() => del(g.id)}>Del</button>
        </div>
      ))}
    </div>
  )
}

// ── Model Blocks ────────────────────────────────────────────
function ModelBlocks({ carId, adminSecret, onToast }: { carId: string; adminSecret: string; onToast: (msg: string, type?: 'success' | 'error') => void }) {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [adding, setAdding] = useState(false)
  const [newType, setNewType] = useState('gallery')
  const [newTitle, setNewTitle] = useState('')

  useEffect(() => { api(`blocks?car_id=${carId}`, 'GET', undefined, adminSecret).then((d: any) => setBlocks(d.blocks || [])).catch((e: any) => onToast(e.message, 'error')) }, [carId, adminSecret]) // eslint-disable-line

  const sorted = [...blocks].sort((a, b) => a.sort_order - b.sort_order)

  const addBlock = async () => {
    const sort = sorted.length > 0 ? Math.max(...sorted.map(b => b.sort_order)) + 10 : 10
    try {
      const d = await api('blocks', 'POST', { car_id: carId, block_type: newType, title: newTitle || null, sort_order: sort, is_visible: true, config: {} }, adminSecret)
      setBlocks(prev => [...prev, d.block]); setAdding(false); setNewTitle(''); onToast('Block added')
    } catch (e: any) { onToast(e.message, 'error') }
  }

  const toggle = async (block: Block) => {
    try {
      await api('blocks', 'PUT', { id: block.id, is_visible: !block.is_visible }, adminSecret)
      setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, is_visible: !b.is_visible } : b))
    } catch (e: any) { onToast(e.message, 'error') }
  }

  const move = async (block: Block, dir: 'up' | 'down') => {
    const idx = sorted.findIndex(b => b.id === block.id)
    const swap = dir === 'up' ? sorted[idx - 1] : sorted[idx + 1]
    if (!swap) return
    try {
      await Promise.all([api('blocks', 'PUT', { id: block.id, sort_order: swap.sort_order }, adminSecret), api('blocks', 'PUT', { id: swap.id, sort_order: block.sort_order }, adminSecret)])
      setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, sort_order: swap.sort_order } : b.id === swap.id ? { ...b, sort_order: block.sort_order } : b))
    } catch (e: any) { onToast(e.message, 'error') }
  }

  const del = async (id: string) => { if (!confirm('Delete block?')) return; try { await api('blocks', 'DELETE', { id }, adminSecret); setBlocks(prev => prev.filter(b => b.id !== id)); onToast('Deleted') } catch (e: any) { onToast(e.message, 'error') } }

  return (
    <div>
      <div style={{ ...s.row, marginBottom: 16 }}>
        <p style={{ ...s.secTitle, margin: 0 }}>Page Layout Blocks</p>
        <button style={{ ...s.btn('green'), marginLeft: 'auto' }} onClick={() => setAdding(v => !v)}>{adding ? 'Cancel' : '+ Add Block'}</button>
      </div>

      {sorted.length === 0 && !adding && <EmptyState message="No blocks configured. All sections with content show in default order." />}

      {adding && (
        <div style={{ ...s.card, marginBottom: 14 }}>
          <div style={s.g2}>
            <Field label="Block Type">
              <select style={s.select} value={newType} onChange={e => setNewType(e.target.value)}>
                {BLOCK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Custom Title (optional)">
              <input style={s.input} value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Override section heading…" />
            </Field>
          </div>
          <div style={{ textAlign: 'right', marginTop: 12 }}><button style={s.btn('green')} onClick={addBlock}>Add</button></div>
        </div>
      )}

      {sorted.map((block, i) => (
        <div key={block.id} style={s.listItem}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <button style={{ ...s.btn(), padding: '2px 6px', fontSize: 9 }} onClick={() => move(block, 'up')} disabled={i === 0}>▲</button>
            <button style={{ ...s.btn(), padding: '2px 6px', fontSize: 9 }} onClick={() => move(block, 'down')} disabled={i === sorted.length - 1}>▼</button>
          </div>
          <span style={{ fontWeight: 600, flex: 1 }}>{block.title || block.block_type}</span>
          <span style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase' }}>{block.block_type}</span>
          <button style={s.badge(block.is_visible)} onClick={() => toggle(block)}>{block.is_visible ? 'Visible' : 'Hidden'}</button>
          <button style={s.btn('danger')} onClick={() => del(block.id)}>Del</button>
        </div>
      ))}
    </div>
  )
}
