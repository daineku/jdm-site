'use client'
import { useState, useEffect, useCallback } from 'react'
import { s, Field, Toggle, ErrorBanner, EmptyState, api, useToast, MUTED } from './ui'
import { ImageUploadField } from './ImageUploadField'
import type { BuildCategory } from '@/lib/types'

type Form = Omit<BuildCategory, 'id' | 'created_at'>
const EMPTY: Form = {
  name: '', slug: '',
  description: null, page_description: null,
  icon_ref: null,           // icon/symbol identifier — plain text, not a URL
  image_url: null,          // visual hero/listing image
  og_image_url: null,       // social/OG share override
  seo_title: null, seo_description: null,
  sort_order: 0, is_published: false,
}
const autoSlug = (n: string) => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export function BuildCategoriesTab({ adminSecret }: { adminSecret: string }) {
  const [categories, setCategories] = useState<BuildCategory[]>([])
  const [form, setForm] = useState<Form>(EMPTY)
  const [editing, setEditing] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { show, element: toastEl } = useToast()

  const load = useCallback(async () => {
    try {
      const d = await api('build-categories', 'GET', undefined, adminSecret)
      setCategories(d.buildCategories || [])
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
      if (editing) await api('build-categories', 'PUT', { id: editing, ...form }, adminSecret)
      else await api('build-categories', 'POST', form, adminSecret)
      cancel(); load(); show('Saved')
    } catch (e: any) { show(e.message, 'error') }
    finally { setSaving(false) }
  }

  const del = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"? Models using this category will be unlinked.`)) return
    try { await api('build-categories', 'DELETE', { id }, adminSecret); load(); show('Deleted') }
    catch (e: any) { show(e.message, 'error') }
  }

  const edit = (c: BuildCategory) => {
    setForm({
      name: c.name, slug: c.slug, description: c.description,
      page_description: c.page_description, icon_ref: c.icon_ref,
      image_url: c.image_url, og_image_url: c.og_image_url,
      seo_title: c.seo_title, seo_description: c.seo_description,
      sort_order: c.sort_order, is_published: c.is_published,
    })
    setEditing(c.id)
  }

  return (
    <div>
      {toastEl}
      <ErrorBanner message={error} />
      <p style={s.secTitle}>{editing ? 'Edit Category' : 'Add Category'}</p>
      <p style={{ fontSize: 11, color: MUTED, marginBottom: 12 }}>
        Build Categories are global page-bearing entities. Public pages live at /builds/[slug].
      </p>
      <div style={s.card}>
        <div style={s.g2}>
          <Field label="Name">
            <input style={s.input} value={form.name}
              onChange={e => { set('name', e.target.value); if (!editing) set('slug', autoSlug(e.target.value)) }}
              placeholder="Clean JDM" />
          </Field>
          <Field label="Slug">
            <input style={s.input} value={form.slug || ''} onChange={e => set('slug', e.target.value)} placeholder="clean-jdm" />
          </Field>
          <Field label="Sort Order">
            <input style={s.input} type="number" value={form.sort_order} onChange={e => set('sort_order', parseInt(e.target.value) || 0)} />
          </Field>
          <Field label="Icon Reference (identifier for future icon UI — not a URL)">
            <input style={s.input} value={form.icon_ref || ''} onChange={e => set('icon_ref', e.target.value || null)} placeholder="icon-clean-jdm" />
          </Field>
        </div>

        {/* Visual Identity */}
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: 10, color: MUTED, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Visual Identity</p>
          <ImageUploadField
            label="Category Image — shown on /builds listing + /builds/[slug] hero"
            value={form.image_url}
            onChange={v => set('image_url', v)}
            adminSecret={adminSecret}
            uploadType="categories"
            hint="Used as the visual identity of this category. Pages degrade gracefully if not set."
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <Field label="Short Description (shown in listing cards)">
            <textarea style={{ ...s.textarea, minHeight: 50 }} value={form.description || ''} onChange={e => set('description', e.target.value || null)} />
          </Field>
        </div>
        <div style={{ marginTop: 10 }}>
          <Field label="Page Description (editorial intro on /builds/[slug])">
            <textarea style={s.textarea} value={form.page_description || ''} onChange={e => set('page_description', e.target.value || null)} />
          </Field>
        </div>

        <details style={{ marginTop: 12 }}>
          <summary style={{ fontSize: 10, color: MUTED, cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase' }}>SEO / Social</summary>
          <div style={{ marginTop: 12 }}>
            <div style={s.g2}>
              <Field label="SEO Title"><input style={s.input} value={form.seo_title || ''} onChange={e => set('seo_title', e.target.value || null)} /></Field>
              <Field label="SEO Description"><input style={s.input} value={form.seo_description || ''} onChange={e => set('seo_description', e.target.value || null)} /></Field>
            </div>
            <div style={{ marginTop: 12 }}>
              <ImageUploadField
                label="OG Image Override — social/share override only (falls back to Category Image)"
                value={form.og_image_url}
                onChange={v => set('og_image_url', v)}
                adminSecret={adminSecret}
                uploadType="categories"
                hint="Only used for social share meta tags. Not rendered visibly on the page."
              />
            </div>
          </div>
        </details>

        <div style={{ ...s.row, marginTop: 14, justifyContent: 'space-between' }}>
          <div style={s.row}><Toggle value={form.is_published} onChange={v => set('is_published', v)} /><span style={{ fontSize: 11, color: MUTED }}>Published (public page)</span></div>
          <div style={s.row}>
            {editing && <button style={s.btn()} onClick={cancel}>Cancel</button>}
            <button style={s.btn('green')} onClick={save} disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Add Category'}</button>
          </div>
        </div>
      </div>

      <p style={{ ...s.secTitle, marginTop: 28 }}>All Categories ({categories.length})</p>
      {categories.length === 0 && <EmptyState message="No categories yet. Add your first above." />}
      {[...categories].sort((a, b) => a.sort_order - b.sort_order).map(c => (
        <div key={c.id} style={s.listItem}>
          {c.image_url && <img src={c.image_url} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }} />}
          <span style={{ flex: 1, fontWeight: 600 }}>{c.name}</span>
          <span style={{ color: MUTED, fontSize: 11 }}>{c.slug}</span>
          <span style={s.badge(c.is_published)}>{c.is_published ? 'Published' : 'Draft'}</span>
          <button style={s.btn()} onClick={() => edit(c)}>Edit</button>
          <button style={s.btn('danger')} onClick={() => del(c.id, c.name)}>Delete</button>
        </div>
      ))}
    </div>
  )
}
