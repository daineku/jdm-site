'use client'
import { useState, useEffect, useCallback } from 'react'
import { s, Field, Toggle, ErrorBanner, EmptyState, api, useToast, MUTED } from './ui'
import type { GlobalBuild } from '@/lib/types'

type Form = Omit<GlobalBuild, 'id' | 'created_at'>
const EMPTY: Form = {
  title: '', slug: '', description: null, page_description: null,
  logo_url: null, seo_title: null, seo_description: null, og_image_url: null,
  sort_order: 0, is_published: false,
}
const autoSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export function GlobalBuildsTab({ adminSecret }: { adminSecret: string }) {
  const [builds, setBuilds] = useState<GlobalBuild[]>([])
  const [form, setForm] = useState<Form>(EMPTY)
  const [editing, setEditing] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { show, element: toastEl } = useToast()

  const load = useCallback(async () => {
    try {
      const d = await api('global-builds', 'GET', undefined, adminSecret)
      setBuilds(d.globalBuilds || [])
    } catch (e: any) { setError(e.message) }
  }, [adminSecret])

  useEffect(() => { load() }, [load])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const cancel = () => { setForm(EMPTY); setEditing(null) }

  const save = async () => {
    if (!form.title.trim()) { show('Title is required', 'error'); return }
    if (!form.slug.trim()) { show('Slug is required', 'error'); return }
    setSaving(true)
    try {
      if (editing) await api('global-builds', 'PUT', { id: editing, ...form }, adminSecret)
      else await api('global-builds', 'POST', form, adminSecret)
      cancel(); load(); show('Saved')
    } catch (e: any) { show(e.message, 'error') }
    finally { setSaving(false) }
  }

  const del = async (id: string, title: string) => {
    if (!confirm(`Delete build "${title}"? All model assignments will be removed.`)) return
    try { await api('global-builds', 'DELETE', { id }, adminSecret); load(); show('Deleted') }
    catch (e: any) { show(e.message, 'error') }
  }

  const edit = (b: GlobalBuild) => {
    setForm({
      title: b.title, slug: b.slug, description: b.description,
      page_description: b.page_description, logo_url: b.logo_url,
      seo_title: b.seo_title, seo_description: b.seo_description,
      og_image_url: b.og_image_url, sort_order: b.sort_order, is_published: b.is_published,
    })
    setEditing(b.id)
  }

  return (
    <div>
      {toastEl}
      <ErrorBanner message={error} />
      <p style={s.secTitle}>{editing ? 'Edit Build' : 'Add Build'}</p>
      <p style={{ fontSize: 11, color: MUTED, marginBottom: 12 }}>
        Builds are global reusable entities assigned to multiple models. Each gets its own page at /build/[slug].
      </p>
      <div style={s.card}>
        <div style={s.g2}>
          <Field label="Title">
            <input style={s.input} value={form.title}
              onChange={e => { set('title', e.target.value); if (!editing) set('slug', autoSlug(e.target.value)) }}
              placeholder="Stage 2 Track Spec" />
          </Field>
          <Field label="Slug">
            <input style={s.input} value={form.slug || ''} onChange={e => set('slug', e.target.value)} placeholder="stage-2-track-spec" />
          </Field>
          <Field label="Logo / Hero Image URL">
            <input style={s.input} value={form.logo_url || ''} onChange={e => set('logo_url', e.target.value || null)} placeholder="https://…" />
          </Field>
          <Field label="Sort Order">
            <input style={s.input} type="number" value={form.sort_order} onChange={e => set('sort_order', parseInt(e.target.value) || 0)} />
          </Field>
        </div>
        <div style={{ marginTop: 10 }}>
          <Field label="Short Description (shown on model page cards)">
            <textarea style={{ ...s.textarea, minHeight: 50 }} value={form.description || ''} onChange={e => set('description', e.target.value || null)} placeholder="Brief description for cards and lists…" />
          </Field>
        </div>
        <div style={{ marginTop: 10 }}>
          <Field label="Page Description (shown on /build/[slug] page)">
            <textarea style={s.textarea} value={form.page_description || ''} onChange={e => set('page_description', e.target.value || null)} placeholder="Full editorial description for the build page…" />
          </Field>
        </div>
        <details style={{ marginTop: 10 }}>
          <summary style={{ fontSize: 10, color: MUTED, cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase' }}>SEO fields</summary>
          <div style={{ ...s.g2, marginTop: 10 }}>
            <Field label="SEO Title"><input style={s.input} value={form.seo_title || ''} onChange={e => set('seo_title', e.target.value || null)} /></Field>
            <Field label="SEO Description"><input style={s.input} value={form.seo_description || ''} onChange={e => set('seo_description', e.target.value || null)} /></Field>
            <Field label="OG Image URL"><input style={s.input} value={form.og_image_url || ''} onChange={e => set('og_image_url', e.target.value || null)} placeholder="https://…" /></Field>
          </div>
        </details>
        <div style={{ ...s.row, marginTop: 14, justifyContent: 'space-between' }}>
          <div style={s.row}><Toggle value={form.is_published} onChange={v => set('is_published', v)} /><span style={{ fontSize: 11, color: MUTED }}>Published (public page)</span></div>
          <div style={s.row}>
            {editing && <button style={s.btn()} onClick={cancel}>Cancel</button>}
            <button style={s.btn('green')} onClick={save} disabled={saving}>{saving ? 'Saving…' : editing ? 'Update' : 'Add Build'}</button>
          </div>
        </div>
      </div>

      <p style={{ ...s.secTitle, marginTop: 28 }}>All Builds ({builds.length})</p>
      {builds.length === 0 && <EmptyState message="No builds yet. Add your first build above." />}
      {[...builds].sort((a, b) => a.sort_order - b.sort_order).map(b => (
        <div key={b.id} style={s.listItem}>
          <span style={{ flex: 1, fontWeight: 600 }}>{b.title}</span>
          <span style={{ color: MUTED, fontSize: 11 }}>{b.slug}</span>
          <span style={s.badge(b.is_published)}>{b.is_published ? 'Published' : 'Draft'}</span>
          <button style={s.btn()} onClick={() => edit(b)}>Edit</button>
          <button style={s.btn('danger')} onClick={() => del(b.id, b.title)}>Delete</button>
        </div>
      ))}
    </div>
  )
}
