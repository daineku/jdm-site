'use client'
import { useState, useEffect, useCallback } from 'react'
import { s, Field, ErrorBanner, api, useToast } from './ui'

type Settings = {
  id: string
  site_title: string
  logo_url: string | null
  tiktok_url: string
  youtube_url: string
  instagram_url: string
  nav_links: { label: string; href: string }[]
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
      if (!d.settings) {
        setLoadError('No settings found. Run migration_v2_final.sql in Supabase.')
        return
      }
      setForm(d.settings)
    } catch (e: any) {
      setLoadError(e.message)
    }
  }, [adminSecret])

  useEffect(() => { load() }, [load])

  if (loadError) return (
    <div>
      <p style={{ fontSize: 10, color: '#e24b4a', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Failed to load settings</p>
      <div style={{ background: '#1a0a0a', border: '1px solid #3a1515', color: '#e24b4a', padding: '12px 16px', borderRadius: 3, fontSize: 12, marginBottom: 16 }}>
        {loadError}
      </div>
      <p style={{ fontSize: 12, color: '#666' }}>
        If you see "RLS" or "permission denied" — go to Supabase → SQL Editor and run:
        <br /><br />
        <code style={{ background: '#111', padding: '8px 12px', display: 'block', marginTop: 8, borderRadius: 2, color: '#39FF14', fontSize: 11 }}>
          alter table site_settings disable row level security;
        </code>
      </p>
    </div>
  )

  if (!form) return <div style={{ color: '#555', fontSize: 12, padding: 20 }}>Loading…</div>

  const set = (k: keyof Settings, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  const updateNav = (i: number, k: string, v: string) => {
    const l = [...form.nav_links]
    l[i] = { ...l[i], [k]: v }
    set('nav_links', l)
  }

  const save = async () => {
    if (!form.site_title.trim()) { show('Site title is required', 'error'); return }
    setSaving(true)
    try {
      const payload = {
        id: form.id,
        site_title: form.site_title,
        logo_url: form.logo_url || null,
        tiktok_url: form.tiktok_url || '',
        youtube_url: form.youtube_url || '',
        instagram_url: form.instagram_url || '',
        nav_links: form.nav_links,
      }
      await api('settings', 'PUT', payload, adminSecret)
      show('Settings saved')
    } catch (e: any) {
      show('Save failed: ' + e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {toastEl}
      <p style={s.secTitle}>Site Settings</p>
      <div style={s.card}>
        <div style={s.g2}>
          <Field label="Site Title">
            <input style={s.input} value={form.site_title} onChange={e => set('site_title', e.target.value)} />
          </Field>
          <Field label="Logo URL">
            <input style={s.input} value={form.logo_url || ''} onChange={e => set('logo_url', e.target.value || null)} placeholder="https://…" />
          </Field>
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
            <button
              style={{ ...s.btn(), marginLeft: 'auto', fontSize: 10 }}
              onClick={() => set('nav_links', [...(form.nav_links || []), { label: '', href: '' }])}
            >+ Add</button>
          </div>
          {(form.nav_links || []).map((link, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
              <input style={{ ...s.input, width: 120 }} value={link.label} onChange={e => updateNav(i, 'label', e.target.value)} placeholder="Label" />
              <input style={s.input} value={link.href} onChange={e => updateNav(i, 'href', e.target.value)} placeholder="/page" />
              <button style={{ ...s.btn('danger'), padding: '6px 10px', flexShrink: 0 }} onClick={() => set('nav_links', form.nav_links.filter((_: any, j: number) => j !== i))}>✕</button>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, textAlign: 'right' as const }}>
          <button style={s.btn('green')} onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}
