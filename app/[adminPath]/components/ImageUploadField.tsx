'use client'
import { useRef, useState } from 'react'
import { MUTED, G } from './ui'

type Props = {
  label: string
  value: string | null
  onChange: (url: string | null) => void
  adminSecret: string
  uploadType?: string      // R2 folder prefix: 'categories' | 'settings' | 'builds' | 'parts'
  hint?: string            // optional helper text shown below the field
}

export function ImageUploadField({ label, value, onChange, adminSecret, uploadType = 'assets', hint }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setError('')
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('type', uploadType)
      const res = await fetch('/api/admin/upload-asset', {
        method: 'POST',
        headers: { 'x-admin-secret': adminSecret },
        body: fd,
      })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || 'Upload failed')
      onChange(data.url)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    color: MUTED,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: 6,
    display: 'block',
  }

  return (
    <div>
      <span style={labelStyle}>{label}</span>

      {/* Preview */}
      {value && (
        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="preview"
            style={{ width: 80, height: 56, objectFit: 'cover', borderRadius: 3, border: '1px solid #2a2a2a', background: '#111' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              style={{ fontSize: 10, color: G, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' as const }}
            >Replace image</button>
            <button
              type="button"
              onClick={() => onChange(null)}
              style={{ fontSize: 10, color: '#e24b4a', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' as const }}
            >Remove</button>
          </div>
        </div>
      )}

      {/* Upload button (shown when no image, or always) */}
      {!value && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{
            background: '#111',
            border: '1px dashed #2a2a2a',
            borderRadius: 3,
            color: uploading ? MUTED : G,
            cursor: uploading ? 'wait' : 'pointer',
            fontSize: 11,
            padding: '10px 16px',
            width: '100%',
            textAlign: 'center' as const,
          }}
        >
          {uploading ? 'Uploading…' : '+ Upload image'}
        </button>
      )}

      {error && <p style={{ fontSize: 10, color: '#e24b4a', marginTop: 4 }}>{error}</p>}
      {hint && <p style={{ fontSize: 10, color: '#444', marginTop: 4 }}>{hint}</p>}

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </div>
  )
}
