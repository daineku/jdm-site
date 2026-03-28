'use client'
import { useState, useEffect, useCallback } from 'react'
import { s, Field, ErrorBanner, api, useToast, MUTED } from './ui'
import { ImageUploadField } from './ImageUploadField'

type Settings = {
  id: string
  site_title: string
  logo_url: string | null
  favicon_url: string | null
  tiktok_url: string
  youtube_url: string
  instagram_url: string
  nav_links: { label: string; href: string }[]
  default_seo_description: string | null
  default_og_image: string | null
  ga4_measurement_id: string | null
  search_console_verification: string | null
}

export function SettingsTab({ adminSecret }: { adminSecret: string }) {
  const [form, setForm] = useState<Settings | null>(null)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const { show, element: toastEl } = useToast()

  const load = useCallback(async () => {
    setLoadError('')
    try {
      const d = await api('settings', 'GET', undefined, adminSecret)
      if (!d.settings) { setLoadError('No settings found. Run migration_v2_final.sql in Supabase.'); return }
      setForm(d.settings)
    } catch (e: any) { setLoadError(e.message) }
  }, [adminSecret])

  useEffect(() => { load() }, [load])

  if (loadError) return (
    <div>
      <p style={{ fontSize: 10, color: '#e24b4a', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Failed to load settings</p>
      <div style={{ background: '#1a0a0a', border: '1px solid #3a1515', color: '#e24b4a', padding: '12px 16px', borderRadius: 3, fontSize: 12, marginBottom: 16 }}>{loadError}</div>
    </div>
  )
  if (!form) return <div style={{ color: '#555', fontSize: 12, padding: 20 }}>Loading...</div>

  const set = (k: keyof Settings, v: any) => setForm((f: any) => ({ ...f, [k]: v }))
  const updateNav = (i: number, k: string, v: string) => {
    const l = [...form.nav_links]; l[i] = { ...l[i], [k]: v }; set('nav_links', l)
  }

  const save = async () => {
    if (!form.site_title.trim()) { show('Site title is required', 'error'); return }
    setSaving(true)
    try {
      await api('settings', 'PUT', {
        id: form.id,
        site_title: form.site_title,
        logo_url: form.logo_url || null,
        favicon_url: form.favicon_url || null,
        tiktok_url: form.tiktok_url || '',
        youtube_url: form.youtube_url || '',
        instagram_url: form.instagram_url || '',
        nav_links: form.nav_links,
        default_seo_description: form.default_seo_description || null,
        default_og_image: form.default_og_image || null,
        ga4_measurement_id: form.ga4_measurement_id || null,
        search_console_verification: form.search_console_verification || null,
      }, adminSecret)
      show('Settings saved')
    } catch (e: any) { show('Save failed: ' + e.message, 'error') }
    finally { setSaving(false) }
  }

  return (
    <div>
      {toastEl}

      {/* ── BRANDING ─────────────────────────────────────────── */}
      <p style={s.secTitle}>Branding</p>
      <div style={s.card}>
        <div style={s.g2}>
          <Field label="Site Title">
            <input style={s.input} value={form.site_title} onChange={e => set('site_title', e.target.value)} />
          </Field>
          <div>
            <ImageUploadField label="Logo" value={form.logo_url} onChange={v => set('logo_url', v)} adminSecret={adminSecret} uploadType="settings" />
          </div>
          <div>
            <ImageUploadField label="Favicon" value={form.favicon_url} onChange={v => set('favicon_url', v)} adminSecret={adminSecret} uploadType="settings" hint="Falls back to app/favicon.ico if not set." />
          </div>
          <Field label="TikTok URL">
            <input style={s.input} value={form.tiktok_url || ''} onChange={e => set('tiktok_url', e.target.value)} />
          </Field>
          <Field label="YouTube URL">
            <input style={s.input} value={form.youtube_url || ''} onChange={e => set('youtube_url', e.target.value)} />
          </Field>
          <Field label="Instagram URL">
            <input style={s.input} value={form.instagram_url || ''} onChange={e => set('instagram_url', e.target.value)} />
          </Field>
        </div>
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
            <p style={{ ...s.label, margin: 0 }}>Navigation Links</p>
            <button style={{ ...s.btn(), marginLeft: 'auto', fontSize: 10 }}
              onClick={() => set('nav_links', [...(form.nav_links || []), { label: '', href: '' }])}>+ Add</button>
          </div>
          {(form.nav_links || []).map((link, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
              <input style={{ ...s.input, width: 120 }} value={link.label} onChange={e => updateNav(i, 'label', e.target.value)} placeholder="Label" />
              <input style={s.input} value={link.href} onChange={e => updateNav(i, 'href', e.target.value)} placeholder="/page" />
              <button style={{ ...s.btn('danger'), padding: '6px 10px', flexShrink: 0 }}
                onClick={() => set('nav_links', form.nav_links.filter((_: any, j: number) => j !== i))}>x</button>
            </div>
          ))}
        </div>
      </div>

      {/* ── SEO DEFAULTS ─────────────────────────────────────── */}
      <p style={{ ...s.secTitle, marginTop: 28 }}>SEO Defaults</p>
      <p style={{ fontSize: 11, color: MUTED, marginBottom: 12 }}>
        Fallback values for pages without specific SEO overrides. Per-model SEO is in each model's Info tab.
        The canonical base URL is set via <code style={{ color: '#39FF14', fontSize: 10 }}>NEXT_PUBLIC_SITE_URL</code> env var.
      </p>
      <div style={s.card}>
        <Field label="Default SEO Description (fallback for pages without a specific description, max 160 chars in meta)">
          <textarea style={{ ...s.textarea, minHeight: 60 }} value={form.default_seo_description || ''}
            onChange={e => set('default_seo_description', e.target.value || null)}
            placeholder="A JDM automotive archive..." maxLength={500} />
          <p style={{ fontSize: 10, color: '#444', marginTop: 3 }}>
            {(form.default_seo_description || '').length}/500 stored, truncated to 160 in meta tags
          </p>
        </Field>
        <div style={{ marginTop: 12 }}>
          <div>
            <ImageUploadField label="Default OG Image (shown when sharing pages with no cover photo)" value={form.default_og_image} onChange={v => set('default_og_image', v)} adminSecret={adminSecret} uploadType="settings" />
          </div>
        </div>
      </div>

      {/* ── INTEGRATIONS ─────────────────────────────────────── */}
      <p style={{ ...s.secTitle, marginTop: 28 }}>Integrations</p>
      <p style={{ fontSize: 11, color: MUTED, marginBottom: 12 }}>
        Only structured fields are stored here — no script injection.
      </p>
      <div style={s.card}>
        <Field label="Google Analytics 4 — Measurement ID">
          <input style={s.input} value={form.ga4_measurement_id || ''}
            onChange={e => set('ga4_measurement_id', e.target.value || null)}
            placeholder="G-XXXXXXXXXX" />
          <p style={{ fontSize: 10, color: '#444', marginTop: 3 }}>
            GA4 Admin → Data Streams → Web → Measurement ID. Leave blank to disable.
          </p>
        </Field>
        <div style={{ marginTop: 14 }}>
          <Field label="Google Search Console — Verification Code">
            <input style={s.input} value={form.search_console_verification || ''}
              onChange={e => set('search_console_verification', e.target.value || null)}
              placeholder="abc123xyz..." />
            <p style={{ fontSize: 10, color: '#444', marginTop: 3 }}>
              Search Console → Settings → Ownership Verification → HTML tag → paste the <code style={{ fontSize: 10 }}>content=</code> value only.
            </p>
          </Field>
        </div>
      </div>

      <div style={{ marginTop: 20, textAlign: 'right' as const }}>
        <button style={s.btn('green')} onClick={save} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
