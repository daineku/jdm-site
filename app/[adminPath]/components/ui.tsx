'use client'
import React from 'react'

export const G = '#39FF14'
export const BG = '#0a0a0a'
export const CARD = '#111'
export const BORDER = '#1e1e1e'
export const MUTED = '#555'

export const s = {
  card: { background: CARD, border: `1px solid ${BORDER}`, borderRadius: 3, padding: 18, marginBottom: 14 },
  row: { display: 'flex', alignItems: 'center', gap: 10 } as React.CSSProperties,
  label: { fontSize: 10, color: '#444', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase' as const, display: 'block', marginBottom: 5 },
  input: { width: '100%', background: '#0a0a0a', border: '1px solid #252525', color: '#fff', padding: '7px 10px', borderRadius: 2, fontSize: 12, fontFamily: 'Manrope, sans-serif', outline: 'none', boxSizing: 'border-box' as const },
  textarea: { width: '100%', background: '#0a0a0a', border: '1px solid #252525', color: '#fff', padding: '7px 10px', borderRadius: 2, fontSize: 12, fontFamily: 'Manrope, sans-serif', outline: 'none', resize: 'vertical' as const, boxSizing: 'border-box' as const, minHeight: 70 },
  select: { width: '100%', background: '#0a0a0a', border: '1px solid #252525', color: '#fff', padding: '7px 10px', borderRadius: 2, fontSize: 12, fontFamily: 'Manrope, sans-serif', outline: 'none', boxSizing: 'border-box' as const },
  btn: (v?: string): React.CSSProperties => ({
    background: v === 'green' ? G : v === 'danger' ? 'transparent' : '#1a1a1a',
    color: v === 'green' ? '#000' : v === 'danger' ? '#c44' : '#ccc',
    border: v === 'danger' ? '1px solid #3a1515' : v === 'green' ? 'none' : '1px solid #2a2a2a',
    padding: '6px 14px', borderRadius: 2, cursor: 'pointer', fontSize: 11, fontWeight: 700,
    letterSpacing: '0.06em', fontFamily: 'Manrope, sans-serif', whiteSpace: 'nowrap',
  }),
  g2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 } as React.CSSProperties,
  g3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 } as React.CSSProperties,
  secTitle: { fontSize: 10, color: G, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 16, marginTop: 4 },
  listItem: { background: CARD, border: `1px solid ${BORDER}`, borderRadius: 3, padding: '10px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 } as React.CSSProperties,
  badge: (on: boolean): React.CSSProperties => ({ fontSize: 10, fontWeight: 700, color: on ? G : MUTED, background: on ? '#0a1a0a' : '#151515', border: `1px solid ${on ? '#1a3a1a' : '#222'}`, padding: '3px 7px', borderRadius: 2, cursor: 'pointer', letterSpacing: '0.05em' }),
}

export function Toast({ msg, type = 'success' }: { msg: string; type?: 'success' | 'error' }) {
  if (!msg) return null
  const color = type === 'error' ? '#e24b4a' : G
  const borderColor = type === 'error' ? '#3a1515' : G
  return (
    <div style={{ position: 'fixed', top: 16, right: 16, background: '#111', border: `1px solid ${borderColor}`, color, padding: '9px 18px', borderRadius: 3, fontSize: 12, fontWeight: 600, zIndex: 9999, fontFamily: 'Manrope, sans-serif', maxWidth: 320 }}>
      {msg}
    </div>
  )
}

export function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const st: React.CSSProperties = { width: 32, height: 18, borderRadius: 9, background: value ? G : '#333', position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s' }
  return (
    <div style={st} onClick={() => onChange(!value)}>
      <div style={{ position: 'absolute', top: 2, left: value ? 16 : 2, width: 14, height: 14, borderRadius: 7, background: value ? '#000' : '#666', transition: 'left 0.2s' }} />
    </div>
  )
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={s.label}>{label}</label>{children}</div>
}

export function Spinner() {
  return <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #222', borderTopColor: G, animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ padding: '40px 0', textAlign: 'center', color: MUTED, fontSize: 12, letterSpacing: '0.05em' }}>
      {message}
    </div>
  )
}

export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null
  return (
    <div style={{ background: '#1a0a0a', border: '1px solid #3a1515', color: '#e24b4a', padding: '10px 14px', borderRadius: 3, fontSize: 12, marginBottom: 14 }}>
      {message}
    </div>
  )
}

// Safe API helper with typed error handling
export async function api(path: string, method = 'GET', body?: unknown, secret?: string): Promise<any> {
  const res = await fetch(`/api/admin/${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret || '' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({ error: res.statusText }))
  if (!res.ok) throw new Error(json.error || `Request failed: ${res.status}`)
  return json
}

export function useToast() {
  const [toast, setToast] = React.useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const show = React.useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])
  const element = toast ? <Toast msg={toast.msg} type={toast.type} /> : null
  return { show, element }
}
