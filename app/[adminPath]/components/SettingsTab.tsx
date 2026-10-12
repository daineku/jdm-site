'use client'
import { useState, useEffect, useCallback } from 'react'
import { s, Field, Toggle, api, useToast, MUTED, errorMessage } from './ui'
import { ImageUploadField } from './ImageUploadField'
import { PROJECT_INDEX } from '@/lib/projects'
import { SUPPORT_DEFAULTS, SUPPORT_LIMITS, isSupportUrl } from '@/lib/support'

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
  // Support module (migration_v11a). Present on the row only once that migration has run.
  support_enabled?: boolean | null
  support_url?: string | null
  support_title?: string | null
  support_body?: string | null
  support_cta?: string | null
  support_image_url?: string | null
  support_image_alt?: string | null
  support_project?: string | null
  support_placement?: 'project' | 'home' | null
}

/** The row carries the Support columns only after migration_v11a; without them the section is read-only. */
const hasSupportColumns = (row: Settings) => 'support_enabled' in row

export function SettingsTab({ adminSecret }: { adminSecret: string }) {
  const [form, setForm] = useState<Settings | null>(null)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const { show, element: toastEl } = useToast()

  const load = useCallback(async () => {
    setLoadError('')
    try {
      const d = await api<{ settings?: Settings | null }>('settings', 'GET', undefined, adminSecret)
      if (!d.settings) { setLoadError('No settings found. Run migration_v2_final.sql in Supabase.'); return }
      setForm(d.settings)
    } catch (e) { setLoadError(errorMessage(e)) }
  }, [adminSecret])

  useEffect(() => { load() }, [load])

  if (loadError) return (
    <div>
      <p style={{ fontSize: 10, color: '#e24b4a', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Failed to load settings</p>
      <div style={{ background: '#1a0a0a', border: '1px solid #3a1515', color: '#e24b4a', padding: '12px 16px', borderRadius: 3, fontSize: 12, marginBottom: 16 }}>{loadError}</div>
    </div>
  )
  if (!form) return <div style={{ color: '#555', fontSize: 12, padding: 20 }}>Loading...</div>

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setForm(f => ({ ...f, [k]: v }) as Settings)
  const updateNav = (i: number, k: string, v: string) => {
    const l = [...form.nav_links]; l[i] = { ...l[i], [k]: v }; set('nav_links', l)
  }

  const supportReady = hasSupportColumns(form)
  const supportUrlProblem = form.support_url && !isSupportUrl(form.support_url)
    ? 'Must be a creator page on patreon.com, e.g. https://www.patreon.com/your-page (no query string)'
    : form.support_enabled && !form.support_url ? 'Enabled, but no Patreon page is set — nothing will be shown until it is' : ''

  const save = async () => {
    if (!form.site_title.trim()) { show('Site title is required', 'error'); return }
    if (supportReady && form.support_url && !isSupportUrl(form.support_url)) { show('Support URL must be a patreon.com creator page', 'error'); return }
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
        // Only sent when the columns exist, so saving never fails on a database without migration_v11a.
        ...(supportReady ? {
          support_enabled: !!form.support_enabled,
          support_url: form.support_url?.trim() || null,
          support_title: form.support_title?.trim() || null,
          support_body: form.support_body?.trim() || null,
          support_cta: form.support_cta?.trim() || null,
          support_image_url: form.support_image_url || null,
          support_image_alt: form.support_image_alt?.trim() || null,
          support_project: form.support_project || null,
          support_placement: form.support_placement === 'home' ? 'home' : 'project',
        } : {}),
      }, adminSecret)
      show('Settings saved')
    } catch (e) { show('Save failed: ' + errorMessage(e), 'error') }
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
                onClick={() => set('nav_links', form.nav_links.filter((_, j) => j !== i))}>x</button>
            </div>
          ))}
        </div>
      </div>

      {/* ── SEO DEFAULTS ─────────────────────────────────────── */}
      <p style={{ ...s.secTitle, marginTop: 28 }}>SEO Defaults</p>
      <p style={{ fontSize: 11, color: MUTED, marginBottom: 12 }}>
        Fallback values for pages without specific SEO overrides. Per-model SEO is in each model&apos;s Info tab.
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

      {/* ── SUPPORT MODULE (PATREON) ─────────────────────────── */}
      <p style={{ ...s.secTitle, marginTop: 28 }}>Support module (Patreon)</p>
      <p style={{ fontSize: 11, color: MUTED, marginBottom: 12 }}>
        An optional block on the homepage inviting visitors to support a project on Patreon. It is a native, studio-designed
        block that links to your Patreon page — no Patreon script or iframe is loaded (Patreon offers no official embed for
        creator pages). Shown only while enabled <em>and</em> a patreon.com page is set. Never describe tiers, prices or
        benefits that do not exist on the Patreon page itself.
      </p>
      <div style={s.card} data-testid="support-settings">
        {!supportReady ? (
          <p style={{ fontSize: 11, color: '#c9a227', margin: 0 }}>
            Not available yet: apply <code style={{ fontSize: 10 }}>supabase/migration_v11a_support_module.sql</code> in Supabase, then reload.
            Until then the module can only be configured through the <code style={{ fontSize: 10 }}>PATREON_URL</code> environment variable.
          </p>
        ) : (
          <>
            <div style={{ ...s.row, marginBottom: 14 }}>
              <Toggle value={!!form.support_enabled} onChange={v => set('support_enabled', v)} />
              <span style={{ fontSize: 11, color: form.support_enabled ? '#39FF14' : MUTED }}>{form.support_enabled ? 'Enabled — shown on the site' : 'Disabled — nothing is shown'}</span>
            </div>
            <div style={s.g2}>
              <Field label="Patreon page URL">
                <input style={s.input} value={form.support_url || ''} aria-label="Patreon page URL"
                  onChange={e => set('support_url', e.target.value || null)} placeholder="https://www.patreon.com/your-page" />
                {supportUrlProblem && <p style={{ fontSize: 10, color: '#e24b4a', marginTop: 3 }}>{supportUrlProblem}</p>}
              </Field>
              <Field label="Project (optional — adds the project's artwork and name)">
                <select style={s.select} value={form.support_project || ''} aria-label="Support project" onChange={e => set('support_project', e.target.value || null)}>
                  <option value="">The studio in general</option>
                  {PROJECT_INDEX.map(p => <option key={p.slug} value={p.slug}>{p.title}</option>)}
                </select>
              </Field>
              <Field label={`Title (optional, max ${SUPPORT_LIMITS.title})`}>
                <input style={s.input} value={form.support_title || ''} maxLength={SUPPORT_LIMITS.title} aria-label="Support title"
                  onChange={e => set('support_title', e.target.value || null)} placeholder={SUPPORT_DEFAULTS.title} />
              </Field>
              <Field label={`Button label (optional, max ${SUPPORT_LIMITS.cta})`}>
                <input style={s.input} value={form.support_cta || ''} maxLength={SUPPORT_LIMITS.cta} aria-label="Support button label"
                  onChange={e => set('support_cta', e.target.value || null)} placeholder={SUPPORT_DEFAULTS.cta} />
              </Field>
              <Field label="Placement">
                <select style={s.select} value={form.support_placement === 'home' ? 'home' : 'project'} aria-label="Support placement" onChange={e => set('support_placement', e.target.value === 'home' ? 'home' : 'project')}>
                  <option value="project">Under the project case study</option>
                  <option value="home">Own section, after the Journal</option>
                </select>
              </Field>
              <div>
                <ImageUploadField label="Image (optional — otherwise the project's own artwork is used)" value={form.support_image_url ?? null}
                  onChange={v => set('support_image_url', v)} adminSecret={adminSecret} uploadType="support" hint="5:4 works best. JPEG, PNG or WebP, up to 4 MB." />
                {form.support_image_url && (
                  <input style={{ ...s.input, marginTop: 6 }} value={form.support_image_alt || ''} maxLength={SUPPORT_LIMITS.imageAlt} aria-label="Support image alt text"
                    onChange={e => set('support_image_alt', e.target.value || null)} placeholder="Describe the image (alt text)" />
                )}
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={s.label}>What supporters are funding (optional, max {SUPPORT_LIMITS.body})</label>
              <textarea style={{ ...s.textarea, minHeight: 56 }} value={form.support_body || ''} maxLength={SUPPORT_LIMITS.body} aria-label="Support description"
                onChange={e => set('support_body', e.target.value || null)} placeholder={SUPPORT_DEFAULTS.body} />
            </div>
          </>
        )}
      </div>

      <div style={{ marginTop: 20, textAlign: 'right' as const }}>
        <button style={s.btn('green')} onClick={save} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
