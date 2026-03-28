'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { s, Field, ErrorBanner, EmptyState, api, useToast, MUTED, G, CARD, BORDER } from './ui'

type HomePhoto = {
  id: string
  url: string
  thumb_url: string | null
  caption: string | null
  alt_text: string | null
  home_sort_order: number
  show_on_home: boolean
  orientation: string
  car: { id: string; title: string; slug: string; brand: string | null } | null
}

export function HomepageTab({ adminSecret }: { adminSecret: string }) {
  const [photos, setPhotos] = useState<HomePhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState<string | null>(null) // id of photo being saved
  const { show, element: toastEl } = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const d = await api('homepage', 'GET', undefined, adminSecret)
      setPhotos(d.photos || [])
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [adminSecret])

  useEffect(() => { load() }, [load])

  // Inline save for caption/alt_text
  const saveField = async (photo: HomePhoto, field: 'caption' | 'alt_text', value: string) => {
    setSaving(photo.id)
    try {
      const d = await api('homepage', 'PUT', { id: photo.id, [field]: value || null }, adminSecret)
      setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, ...d.photo } : p))
    } catch (e: any) { show(e.message, 'error') }
    finally { setSaving(null) }
  }

  // Remove from homepage
  const removeFromHome = async (photo: HomePhoto) => {
    if (!confirm(`Remove "${photo.caption || photo.car?.title || 'this photo'}" from homepage?`)) return
    setSaving(photo.id)
    try {
      await api('homepage', 'PUT', { id: photo.id, show_on_home: false }, adminSecret)
      setPhotos(prev => prev.filter(p => p.id !== photo.id))
      show('Removed from homepage')
    } catch (e: any) { show(e.message, 'error') }
    finally { setSaving(null) }
  }

  // Move photo up or down — swap sort orders
  const move = async (idx: number, dir: 'up' | 'down') => {
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= photos.length) return

    const a = photos[idx]
    const b = photos[swapIdx]

    // Optimistic update
    const next = [...photos]
    next[idx] = { ...b }
    next[swapIdx] = { ...a }
    // Swap sort orders
    const aOrder = a.home_sort_order
    const bOrder = b.home_sort_order
    next[idx].home_sort_order = aOrder
    next[swapIdx].home_sort_order = bOrder
    setPhotos(next)

    try {
      await api('homepage', 'POST', {
        orders: [
          { id: a.id, home_sort_order: bOrder },
          { id: b.id, home_sort_order: aOrder },
        ]
      }, adminSecret)
    } catch (e: any) {
      // Revert on failure
      setPhotos(photos)
      show('Reorder failed: ' + e.message, 'error')
    }
  }

  // Save the current display order as the fixed sequence.
  // Assigns clean sequential home_sort_order values (10, 20, 30…).
  // After saving: first 6 cards on homepage will keep this exact order.
  const saveOrder = async () => {
    const orders = photos.map((p, i) => ({ id: p.id, home_sort_order: (i + 1) * 10 }))
    try {
      await api('homepage', 'POST', { orders }, adminSecret)
      setPhotos(prev => prev.map((p, i) => ({ ...p, home_sort_order: (i + 1) * 10 })))
      show('Order saved — first 6 cards will stay fixed on homepage')
    } catch (e: any) { show(e.message, 'error') }
  }

  if (loading) return <div style={{ color: MUTED, fontSize: 12, padding: 20 }}>Loading…</div>

  return (
    <div>
      {toastEl}
      <ErrorBanner message={error} />

      <div style={{ ...s.row, marginBottom: 20, justifyContent: 'space-between' }}>
        <div>
          <p style={{ ...s.secTitle, margin: 0 }}>Homepage Feed ({photos.length} photos)</p>
          <p style={{ color: MUTED, fontSize: 11, marginTop: 4 }}>
            First 6 cards stay in fixed order. Rest are shown in random order each visit. Use ↑↓ to arrange, then Save Order.
          </p>
        </div>
        <div style={s.row}>
          <button style={s.btn()} onClick={load}>↺ Refresh</button>
          {photos.length > 1 && (
            <button style={s.btn('green')} onClick={saveOrder}>Save Order</button>
          )}
        </div>
      </div>

      {photos.length === 0 && (
        <EmptyState message="No photos on homepage yet. Go to a model's gallery and enable 'Show on Home' for photos." />
      )}

      {photos.map((photo, idx) => (
        <HomePhotoRow
          key={photo.id}
          photo={photo}
          idx={idx}
          total={photos.length}
          saving={saving === photo.id}
          onMove={move}
          onRemove={removeFromHome}
          onSaveField={saveField}
        />
      ))}
    </div>
  )
}

function HomePhotoRow({
  photo, idx, total, saving, onMove, onRemove, onSaveField
}: {
  photo: HomePhoto
  idx: number
  total: number
  saving: boolean
  onMove: (idx: number, dir: 'up' | 'down') => void
  onRemove: (photo: HomePhoto) => void
  onSaveField: (photo: HomePhoto, field: 'caption' | 'alt_text', value: string) => void
}) {
  const [caption, setCaption] = useState(photo.caption || '')
  const [editingCaption, setEditingCaption] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const commitCaption = () => {
    setEditingCaption(false)
    if (caption !== (photo.caption || '')) {
      onSaveField(photo, 'caption', caption)
    }
  }

  return (
    <div style={{ ...s.listItem, alignItems: 'flex-start', gap: 12, padding: '12px 14px', opacity: saving ? 0.6 : 1 }}>
      {/* Position badge */}
      <div style={{ width: 28, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, paddingTop: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: G }}>{idx + 1}</span>
        <button
          style={{ background: 'none', border: '1px solid #252525', color: '#555', padding: '2px 5px', borderRadius: 2, cursor: 'pointer', fontSize: 9, lineHeight: 1 }}
          onClick={() => onMove(idx, 'up')}
          disabled={idx === 0 || saving}
        >▲</button>
        <button
          style={{ background: 'none', border: '1px solid #252525', color: '#555', padding: '2px 5px', borderRadius: 2, cursor: 'pointer', fontSize: 9, lineHeight: 1 }}
          onClick={() => onMove(idx, 'down')}
          disabled={idx === total - 1 || saving}
        >▼</button>
      </div>

      {/* Thumbnail */}
      <div style={{ width: 72, flexShrink: 0, borderRadius: 2, overflow: 'hidden', background: '#0a0a0a', aspectRatio: photo.orientation === 'vertical' ? '2/3' : '16/9', position: 'relative' }}>
        {(photo.thumb_url || photo.url) ? (
          <Image
            src={photo.thumb_url || photo.url}
            alt={photo.caption || photo.car?.title || ''}
            fill
            style={{ objectFit: 'cover' }}
            onError={() => {}} // fail silently
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 9, color: '#333' }}>No img</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Caption — inline editable */}
        {editingCaption ? (
          <input
            ref={inputRef}
            style={{ ...s.input, fontSize: 12, marginBottom: 4 }}
            value={caption}
            onChange={e => setCaption(e.target.value)}
            onBlur={commitCaption}
            onKeyDown={e => { if (e.key === 'Enter') commitCaption(); if (e.key === 'Escape') { setCaption(photo.caption || ''); setEditingCaption(false) } }}
            autoFocus
            placeholder="Hover title shown on homepage…"
          />
        ) : (
          <div
            style={{ fontSize: 12, fontWeight: 600, color: caption ? '#fff' : '#444', marginBottom: 4, cursor: 'text', padding: '3px 0' }}
            onClick={() => setEditingCaption(true)}
            title="Click to edit caption"
          >
            {caption || <span style={{ fontStyle: 'italic', color: '#333' }}>No caption — click to add</span>}
            <span style={{ fontSize: 9, color: '#333', marginLeft: 6 }}>✎</span>
          </div>
        )}

        {/* Model link */}
        {photo.car ? (
          <div style={{ fontSize: 11, color: MUTED }}>
            → <a href={`/cars/${photo.car.slug}`} target="_blank" style={{ color: '#39FF14', textDecoration: 'none' }}>{photo.car.title}</a>
            {photo.car.brand && <span style={{ color: '#333', marginLeft: 6 }}>{photo.car.brand}</span>}
          </div>
        ) : (
          <div style={{ fontSize: 11, color: '#3a1515' }}>⚠ Model not found</div>
        )}

        <div style={{ fontSize: 10, color: '#333', marginTop: 2 }}>
          order: {photo.home_sort_order} · {photo.orientation}
        </div>
      </div>

      {/* Actions */}
      <button
        style={{ ...s.btn('danger'), padding: '5px 10px', flexShrink: 0 }}
        onClick={() => onRemove(photo)}
        disabled={saving}
        title="Remove from homepage"
      >Remove</button>
    </div>
  )
}
