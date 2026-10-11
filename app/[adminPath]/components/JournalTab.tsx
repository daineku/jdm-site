'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { s, Field, Toggle, ErrorBanner, EmptyState, api, useToast, MUTED, G, errorMessage } from './ui'
import { ImageUploadField } from './ImageUploadField'
import ArticleView from '@/components/studio/ArticleView'
import { ARTICLE_LIMITS, formatArticleDate, slugify, type Article } from '@/lib/journalShared'

// Studio Journal editor. Articles live in studio_articles; the public /journal pages and
// the homepage read them per request, so a save is visible on the site immediately.

type Form = Pick<Article, 'title' | 'slug' | 'excerpt' | 'body' | 'category' | 'cover_image_url' | 'cover_alt' | 'is_featured' | 'sort_order'>
const EMPTY: Form = { title: '', slug: '', excerpt: '', body: '', category: '', cover_image_url: null, cover_alt: '', is_featured: false, sort_order: 0 }
const SUGGESTED_CATEGORIES = ['Environment', 'Vehicle physics', 'Traffic systems', 'Lighting', 'Materials', 'Cinematic', 'Video', 'Experiments', 'The Kanjo']

const counter = (n: number, max: number) => (
  <span style={{ float: 'right', color: n > max ? '#e24b4a' : '#444', fontWeight: 400, letterSpacing: 0 }}>{n}/{max}</span>
)

export function JournalTab({ adminSecret }: { adminSecret: string }) {
  const [articles, setArticles] = useState<Article[]>([])
  const [loaded, setLoaded] = useState(false)
  const [form, setForm] = useState<Form>(EMPTY)
  const [editing, setEditing] = useState<Article | null>(null)
  const [slugTouched, setSlugTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(false)
  const [library, setLibrary] = useState<{ url: string }[] | null>(null)
  const { show, element: toastEl } = useToast()

  const load = useCallback(async () => {
    try {
      const d = await api<{ articles: Article[] }>('journal', 'GET', undefined, adminSecret)
      setArticles(d.articles); setError('')
    } catch (e) { setError(errorMessage(e)) }
    finally { setLoaded(true) }
  }, [adminSecret])
  useEffect(() => { load() }, [load])

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm(f => ({ ...f, [k]: v }))
  const reset = () => { setForm(EMPTY); setEditing(null); setSlugTouched(false); setPreview(false) }
  const edit = (a: Article) => {
    setForm({ title: a.title, slug: a.slug, excerpt: a.excerpt, body: a.body, category: a.category, cover_image_url: a.cover_image_url, cover_alt: a.cover_alt, is_featured: a.is_featured, sort_order: a.sort_order })
    setEditing(a); setSlugTouched(true); setPreview(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const categories = useMemo(
    () => [...new Set([...articles.map(a => a.category).filter(Boolean), ...SUGGESTED_CATEGORIES])],
    [articles],
  )

  /** publish: true = publish, false = unpublish / keep as draft, undefined = keep current state. */
  const save = async (publish?: boolean) => {
    if (!form.title.trim()) { show('Title is required', 'error'); return }
    if (!form.slug.trim()) { show('Slug is required', 'error'); return }
    if (publish && editing?.is_published === false && !confirm(`Publish "${form.title}"? It will appear on the public site immediately.`)) return
    if (publish === false && editing?.is_published && !confirm(`Unpublish "${form.title}"? It will disappear from the public site.`)) return
    if (editing?.is_published && editing.slug !== form.slug && !confirm('Changing the slug of a published article changes its address; the old link will stop working. Continue?')) return

    const is_published = publish ?? editing?.is_published ?? false
    setBusy(true)
    try {
      const body = { ...form, is_published }
      const d = editing
        ? await api<{ article: Article }>('journal', 'PUT', { id: editing.id, ...body }, adminSecret)
        : await api<{ article: Article }>('journal', 'POST', body, adminSecret)
      setEditing(d.article)
      show(publish === true ? 'Published' : publish === false && editing?.is_published ? 'Unpublished' : 'Saved')
      load()
    } catch (e) { show(errorMessage(e), 'error') }
    finally { setBusy(false) }
  }

  const del = async (a: Article) => {
    const warning = a.is_published ? ' It is published and will disappear from the public site.' : ''
    if (!confirm(`Delete "${a.title}" permanently?${warning} This cannot be undone.`)) return
    try {
      await api('journal', 'DELETE', { id: a.id }, adminSecret)
      if (editing?.id === a.id) reset()
      show('Deleted'); load()
    } catch (e) { show(errorMessage(e), 'error') }
  }

  const featured = articles.filter(a => a.is_featured).sort((a, b) => a.sort_order - b.sort_order)
  const move = async (index: number, dir: -1 | 1) => {
    const ids = featured.map(a => a.id)
    const j = index + dir
    if (j < 0 || j >= ids.length) return
    ;[ids[index], ids[j]] = [ids[j], ids[index]]
    try { await api('journal/order', 'PUT', { ids }, adminSecret); load() }
    catch (e) { show(errorMessage(e), 'error') }
  }

  const openLibrary = async () => {
    try {
      const d = await api<{ images: { url: string }[] }>('journal/media', 'GET', undefined, adminSecret)
      setLibrary(d.images)
    } catch (e) { show(errorMessage(e), 'error') }
  }

  const status = editing ? (editing.is_published ? 'Published' : 'Draft') : 'New article'

  return (
    <div>
      {toastEl}
      <ErrorBanner message={error} />
      <p style={s.secTitle}>{editing ? `Edit article — ${status}` : 'New article'}</p>
      <p style={{ fontSize: 11, color: MUTED, marginBottom: 12 }}>
        Articles appear at /journal and, once published, on the homepage (featured first, then newest; up to three).
        The body is Markdown: ## headings, **bold**, *italic*, [links](https://…), lists, &gt; quotes and ![images](https://…). HTML is not rendered.
      </p>

      <div style={s.card}>
        <div style={s.g2}>
          <Field label="Title">
            <input style={s.input} value={form.title} maxLength={ARTICLE_LIMITS.title} aria-label="Title"
              onChange={e => { set('title', e.target.value); if (!slugTouched) set('slug', slugify(e.target.value)) }}
              placeholder="Building a night expressway" />
          </Field>
          <Field label="Slug (address: /journal/…)">
            <input style={s.input} value={form.slug} maxLength={ARTICLE_LIMITS.slug} aria-label="Slug"
              onChange={e => { setSlugTouched(true); set('slug', e.target.value.toLowerCase()) }}
              placeholder="building-a-night-expressway" />
          </Field>
          <Field label="Category">
            <input style={s.input} value={form.category} list="journal-categories" maxLength={ARTICLE_LIMITS.category} aria-label="Category"
              onChange={e => set('category', e.target.value)} placeholder="Environment" />
            <datalist id="journal-categories">{categories.map(c => <option key={c} value={c} />)}</datalist>
          </Field>
          <div style={{ ...s.row, paddingTop: 18 }}>
            <Toggle value={form.is_featured} onChange={v => set('is_featured', v)} />
            <span style={{ fontSize: 11, color: MUTED }}>Featured on the homepage</span>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={s.label}>Excerpt — card and page summary {counter(form.excerpt.length, ARTICLE_LIMITS.excerpt)}</label>
          <textarea style={{ ...s.textarea, minHeight: 56 }} value={form.excerpt} aria-label="Excerpt"
            onChange={e => set('excerpt', e.target.value)} />
        </div>

        <div style={{ marginTop: 12 }}>
          <ImageUploadField label="Cover image" value={form.cover_image_url} onChange={v => set('cover_image_url', v)}
            adminSecret={adminSecret} uploadType="journal" hint="16:10 works best. JPEG, PNG or WebP, up to 4 MB." />
          <div style={{ ...s.row, marginTop: 8 }}>
            <button type="button" style={s.btn()} onClick={() => library ? setLibrary(null) : openLibrary()}>
              {library ? 'Close library' : 'Choose from uploaded images'}
            </button>
          </div>
          {library && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8, marginTop: 10 }}>
              {library.length === 0 && <span style={{ fontSize: 11, color: MUTED }}>No Journal images uploaded yet.</span>}
              {library.map(img => (
                <button key={img.url} type="button" onClick={() => { set('cover_image_url', img.url); setLibrary(null) }}
                  style={{ padding: 0, border: `1px solid ${form.cover_image_url === img.url ? G : '#2a2a2a'}`, background: '#111', cursor: 'pointer', aspectRatio: '16 / 10' }}
                  title="Use as cover">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </button>
              ))}
            </div>
          )}
          {form.cover_image_url && (
            <div style={{ marginTop: 10 }}>
              <label style={s.label}>Cover alt text — describe what the image shows {counter(form.cover_alt.length, ARTICLE_LIMITS.coverAlt)}</label>
              <input style={s.input} value={form.cover_alt} aria-label="Cover alt text" onChange={e => set('cover_alt', e.target.value)}
                placeholder="The expressway at night, seen from the driver's seat" />
            </div>
          )}
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={s.label}>Body (Markdown) {counter(form.body.length, ARTICLE_LIMITS.body)}</label>
          <textarea style={{ ...s.textarea, minHeight: 320, fontFamily: 'ui-monospace, Consolas, monospace', lineHeight: 1.6 }}
            value={form.body} aria-label="Body" onChange={e => set('body', e.target.value)} />
        </div>

        {editing?.published_at && (
          <p style={{ fontSize: 11, color: MUTED, marginTop: 10 }}>
            First published {formatArticleDate(editing.published_at)}.
            {editing.is_published && <> Live at <a href={`/journal/${editing.slug}`} target="_blank" rel="noopener" style={{ color: G }}>/journal/{editing.slug}</a>.</>}
          </p>
        )}

        <div style={{ ...s.row, marginTop: 14, justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <button type="button" style={s.btn()} onClick={() => setPreview(p => !p)}>{preview ? 'Close preview' : 'Preview'}</button>
          <div style={{ ...s.row, flexWrap: 'wrap' }}>
            {editing && <button type="button" style={s.btn()} onClick={reset}>New article</button>}
            {editing?.is_published ? (
              <>
                <button type="button" style={s.btn()} disabled={busy} onClick={() => save(false)}>Unpublish</button>
                <button type="button" style={s.btn('green')} disabled={busy} onClick={() => save()}>{busy ? 'Saving…' : 'Save changes'}</button>
              </>
            ) : (
              <>
                <button type="button" style={s.btn()} disabled={busy} onClick={() => save(false)}>{busy ? 'Saving…' : 'Save draft'}</button>
                <button type="button" style={s.btn('green')} disabled={busy} onClick={() => save(true)}>Publish</button>
              </>
            )}
          </div>
        </div>
      </div>

      {preview && (
        <div style={{ border: `1px solid ${G}`, marginBottom: 20 }} data-testid="journal-preview">
          <p style={{ ...s.secTitle, margin: 0, padding: '8px 12px', borderBottom: '1px solid #1a3a1a' }}>
            Preview — {editing?.is_published ? 'unsaved changes are not live yet' : 'not published'}
          </p>
          <div className="studio" style={{ background: 'var(--st-bg)', paddingBottom: 48 }}>
            <ArticleView preview article={{ ...form, published_at: editing?.published_at ?? new Date().toISOString() }} />
          </div>
        </div>
      )}

      {featured.length > 1 && (
        <>
          <p style={{ ...s.secTitle, marginTop: 28 }}>Featured order (homepage)</p>
          {featured.map((a, i) => (
            <div key={a.id} style={s.listItem}>
              <span style={{ color: MUTED, width: 18 }}>{i + 1}</span>
              <span style={{ flex: 1, fontWeight: 600 }}>{a.title}</span>
              {!a.is_published && <span style={s.badge(false)}>Draft</span>}
              <button style={s.btn()} disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move "${a.title}" up`}>↑</button>
              <button style={s.btn()} disabled={i === featured.length - 1} onClick={() => move(i, 1)} aria-label={`Move "${a.title}" down`}>↓</button>
            </div>
          ))}
        </>
      )}

      <p style={{ ...s.secTitle, marginTop: 28 }}>All articles ({articles.length})</p>
      {loaded && articles.length === 0 && !error && <EmptyState message="No articles yet. Write the first one above." />}
      {articles.map(a => (
        <div key={a.id} style={s.listItem} data-testid="journal-row">
          {a.cover_image_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={a.cover_image_url} alt="" style={{ width: 48, height: 30, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }} />
            : <span style={{ width: 48, height: 30, background: '#151515', borderRadius: 2, flexShrink: 0 }} />}
          <span style={{ flex: 1, fontWeight: 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</span>
          <span style={{ color: MUTED, fontSize: 11 }}>{a.category}</span>
          {a.is_featured && <span style={s.badge(true)}>Featured</span>}
          <span style={s.badge(a.is_published)}>{a.is_published ? 'Published' : 'Draft'}</span>
          <button style={s.btn()} onClick={() => edit(a)}>Edit</button>
          <button style={s.btn('danger')} onClick={() => del(a)}>Delete</button>
        </div>
      ))}
    </div>
  )
}
