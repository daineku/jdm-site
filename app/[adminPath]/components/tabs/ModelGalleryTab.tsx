'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { s, EmptyState, api, MUTED, G } from '../ui'

type Photo = {
  id: string; car_id: string; url: string; thumb_url: string | null; original_url?: string | null
  orientation: string; show_on_home: boolean; home_sort_order: number
  sort_order: number; is_visible: boolean; caption: string | null; alt_text: string | null
}

type Props = { carId: string; adminSecret: string; onToast: (msg: string, type?: 'success' | 'error') => void }

export function ModelGalleryTab({ carId, adminSecret, onToast }: Props) {
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

  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return
    const obs = new IntersectionObserver(entries => { if (entries[0].isIntersecting) load() }, { threshold: 0.1 })
    obs.observe(sentinelRef.current)
    return () => obs.disconnect()
  }, [sentinelRef, hasMore, load])

  // ── Upload pipeline ─────────────────────────────────────────────────────────
  // Client-side HEIC conversion + canvas compression → POST to /api/admin/upload
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
      try {
        const heic2any = (await import('heic2any')).default as any
        const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 })
        source = Array.isArray(result) ? result[0] : result
      } catch (e: any) {
        throw new Error(`HEIC conversion failed: ${e.message}. Try converting the file to JPEG first.`)
      }
    }
    return blobToJpeg(source, 2400, 0.88)
  }

  const uploadFiles = async (files: FileList) => {
    if (uploading) return
    const fileArr = Array.from(files)
    if (fileArr.length === 0) return
    const ALLOWED = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif']
    for (const f of fileArr) {
      const ext = (f.name.split('.').pop() || '').toLowerCase()
      if (!ALLOWED.includes(ext)) { onToast(`${f.name}: unsupported format (.${ext}). Use JPEG, PNG, WEBP, or HEIC.`, 'error'); return }
    }
    setUploading(true)
    setUploadQueue(fileArr.map(f => ({ name: f.name, status: 'pending' as const })))
    let successCount = 0
    for (let i = 0; i < fileArr.length; i++) {
      const file = fileArr[i]
      try {
        const { blob, orientation } = await prepareFile(file)
        const fd = new FormData()
        fd.append('file', blob, 'photo.jpg')
        fd.append('car_id', carId)
        fd.append('orientation', orientation)
        const res = await fetch('/api/admin/upload', { method: 'POST', headers: { 'x-admin-secret': adminSecret }, body: fd })
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
      onToast(successCount === fileArr.length ? `Uploaded ${successCount} photo${successCount !== 1 ? 's' : ''}` : `Uploaded ${successCount} of ${fileArr.length} — check errors above`)
      load(true)
    }
    setTimeout(() => setUploadQueue([]), 5000)
  }

  const updatePhoto = async (id: string, updates: Partial<Photo>) => {
    try {
      await api('photos', 'PUT', { id, ...updates }, adminSecret)
      setPhotos(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
      if ('show_on_home' in updates) {
        onToast(updates.show_on_home ? 'Added to homepage — visit Homepage tab to set order & caption' : 'Removed from homepage')
      }
    } catch (e: any) { onToast(e.message, 'error') }
  }

  const delPhoto = async (photo: Photo) => {
    if (!confirm('Delete this photo? This cannot be undone.')) return
    try {
      await api('photos', 'DELETE', { id: photo.id, url: photo.url, thumb_url: photo.thumb_url, original_url: photo.original_url }, adminSecret)
      setPhotos(prev => prev.filter(p => p.id !== photo.id))
      onToast('Deleted')
    } catch (e: any) { onToast(e.message, 'error') }
  }

  if (loading) return <div style={{ color: MUTED, fontSize: 12, padding: 20 }}>Loading…</div>

  return (
    <div>
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

      <div style={s.g3}>
        {photos.map(photo => (
          <div key={photo.id} style={{ ...s.card, padding: 0, overflow: 'hidden' }}>
            <div style={{ position: 'relative', aspectRatio: photo.orientation === 'vertical' ? '2/3' : '16/9', background: '#0a0a0a' }}>
              {(photo.thumb_url || photo.url) ? (
                <div
                  onClick={async () => {
                    // Fetch a short-lived signed URL for the clean original (admin-only)
                    try {
                      const d = await api(`original-url?photo_id=${photo.id}`, 'GET', undefined, adminSecret)
                      const target = d.signedUrl || photo.url
                      window.open(target, '_blank', 'noopener,noreferrer')
                    } catch {
                      window.open(photo.url, '_blank', 'noopener,noreferrer')
                    }
                  }}
                  title="View original (admin only)"
                  style={{ cursor: 'pointer', display: 'block', position: 'absolute', inset: 0 }}
                >
                  <Image src={photo.thumb_url || photo.url} alt={photo.alt_text || ''} fill style={{ objectFit: 'cover' }} onError={() => {}} />
                </div>
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
