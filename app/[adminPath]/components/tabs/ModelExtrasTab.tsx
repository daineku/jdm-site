'use client'
import { useState, useEffect } from 'react'
import { s, Field, Toggle, EmptyState, api, MUTED } from '../ui'

// Extras = Videos only.
// Videos are optional supplementary content — supplementary to Gallery, Story, and the v5 content tabs.
// Games are a future global page-bearing entity and are managed separately via global Games admin.

type Video = {
  id: string
  tiktok_url: string
  embed_id: string | null
  title: string | null
  sort_order: number
  is_visible: boolean
}

type Props = { carId: string; adminSecret: string; onToast: (msg: string, type?: 'success' | 'error') => void }

export function ModelExtrasTab({ carId, adminSecret, onToast }: Props) {
  const [videos, setVideos] = useState<Video[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const empty = { tiktok_url: '', embed_id: '', title: '', sort_order: 0, is_visible: true }
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api(`videos?car_id=${carId}`, 'GET', undefined, adminSecret)
      .then((d: any) => setVideos(d.videos || []))
      .catch((e: any) => onToast(e.message, 'error'))
  }, [carId, adminSecret]) // eslint-disable-line

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const extractId = (url: string) => {
    try { const m = url.match(/video\/(\d+)/); return m ? m[1] : '' } catch { return '' }
  }

  const save = async () => {
    if (!form.tiktok_url.trim()) { onToast('URL is required', 'error'); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        car_id: carId,
        embed_id: form.embed_id || extractId(form.tiktok_url) || null,
        title: form.title || null,
      }
      let d
      if (editing) d = await api('videos', 'PUT', { id: editing, ...payload }, adminSecret)
      else d = await api('videos', 'POST', payload, adminSecret)
      if (editing) setVideos(prev => prev.map(v => v.id === editing ? d.video : v))
      else setVideos(prev => [...prev, d.video])
      setForm(empty); setEditing(null); onToast('Saved')
    } catch (e: any) { onToast(e.message, 'error') }
    finally { setSaving(false) }
  }

  const del = async (id: string) => {
    if (!confirm('Delete this video?')) return
    try {
      await api('videos', 'DELETE', { id }, adminSecret)
      setVideos(prev => prev.filter(v => v.id !== id))
      onToast('Deleted')
    } catch (e: any) { onToast(e.message, 'error') }
  }

  const edit = (v: Video) => {
    setForm({ tiktok_url: v.tiktok_url, embed_id: v.embed_id || '', title: v.title || '', sort_order: v.sort_order, is_visible: v.is_visible })
    setEditing(v.id)
  }

  return (
    <div>
      <p style={s.secTitle}>Videos</p>
      <p style={{ fontSize: 11, color: MUTED, marginBottom: 14 }}>
        TikTok videos for this model. Optional supplementary content.
      </p>

      <div style={s.card}>
        <div style={s.g2}>
          <Field label="TikTok URL">
            <input style={s.input} value={form.tiktok_url} onChange={e => set('tiktok_url', e.target.value)} placeholder="https://www.tiktok.com/@user/video/…" />
          </Field>
          <Field label="Title (optional)">
            <input style={s.input} value={form.title} onChange={e => set('title', e.target.value)} />
          </Field>
          <Field label="Sort Order">
            <input style={s.input} type="number" value={form.sort_order} onChange={e => set('sort_order', parseInt(e.target.value) || 0)} />
          </Field>
        </div>
        <div style={{ ...s.row, marginTop: 14, justifyContent: 'space-between' }}>
          <div style={s.row}>
            <Toggle value={form.is_visible} onChange={v => set('is_visible', v)} />
            <span style={{ fontSize: 11, color: MUTED }}>Visible</span>
          </div>
          <div style={s.row}>
            {editing && <button style={s.btn()} onClick={() => { setForm(empty); setEditing(null) }}>Cancel</button>}
            <button style={s.btn('green')} onClick={save} disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Update' : 'Add Video'}
            </button>
          </div>
        </div>
      </div>

      {videos.length === 0 && <EmptyState message="No videos yet." />}
      {videos.map(v => (
        <div key={v.id} style={s.listItem}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontWeight: 600 }}>{v.title || v.tiktok_url.slice(0, 50) + '…'}</span>
          </div>
          <span style={s.badge(v.is_visible)}>{v.is_visible ? 'Visible' : 'Hidden'}</span>
          <button style={s.btn()} onClick={() => edit(v)}>Edit</button>
          <button style={s.btn('danger')} onClick={() => del(v.id)}>Del</button>
        </div>
      ))}
    </div>
  )
}
