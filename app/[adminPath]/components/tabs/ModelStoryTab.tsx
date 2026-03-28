'use client'
import { useState, useEffect, useCallback } from 'react'
import { s, Field, ErrorBanner, api, MUTED, G } from '../ui'

type Props = {
  carId: string
  adminSecret: string
  initialDescription: string | null
  onToast: (msg: string, type?: 'success' | 'error') => void
}

export function ModelStoryTab({ carId, adminSecret, initialDescription, onToast }: Props) {
  const [description, setDescription] = useState(initialDescription || '')
  const [saving, setSaving] = useState(false)

  // Sync if parent updates (e.g. on tab re-mount)
  useEffect(() => { setDescription(initialDescription || '') }, [initialDescription])

  const save = async () => {
    setSaving(true)
    try {
      await api('cars', 'PUT', {
        id: carId,
        description: description.trim() || null,
      }, adminSecret)
      onToast('Story saved')
    } catch (e: any) { onToast(e.message, 'error') }
    finally { setSaving(false) }
  }

  return (
    <div>
      <p style={s.secTitle}>Story / Description</p>
      <p style={{ fontSize: 11, color: MUTED, marginBottom: 14 }}>
        The editorial description shown on the model page immediately after the gallery.
      </p>

      <div style={s.card}>
        <Field label="Description">
          <textarea
            style={{ ...s.textarea, minHeight: 200 }}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Write about this car's character, history, and significance…"
          />
          <p style={{ fontSize: 10, color: '#444', marginTop: 4, lineHeight: 1.6 }}>
            Formatting:{' '}
            <code style={{ color: G, background: '#111', padding: '0 4px', borderRadius: 2 }}>**bold**</code>{' '}
            <code style={{ color: G, background: '#111', padding: '0 4px', borderRadius: 2 }}>*italic*</code>{' '}
            blank line = new paragraph · single line break = line break
          </p>
        </Field>
      </div>

      <div style={{ textAlign: 'right', marginTop: 4 }}>
        <button style={s.btn('green')} onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save Story'}
        </button>
      </div>
    </div>
  )
}
