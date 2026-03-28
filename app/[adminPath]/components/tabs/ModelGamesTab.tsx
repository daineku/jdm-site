'use client'
import { useState, useEffect } from 'react'
import { s, Field, Toggle, EmptyState, api, MUTED } from '../ui'

type Game = { id: string; game_title: string; game_logo_url: string | null; description: string | null; external_url: string | null; sort_order: number; is_visible: boolean }
type Props = { carId: string; adminSecret: string; onToast: (msg: string, type?: 'success' | 'error') => void }

export function ModelGamesTab({ carId, adminSecret, onToast }: Props) {
  const [games, setGames] = useState<Game[]>([])
  const empty = { game_title: '', game_logo_url: '', description: '', external_url: '', sort_order: 0, is_visible: true }
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api(`games?car_id=${carId}`, 'GET', undefined, adminSecret)
      .then((d: any) => setGames(d.games || []))
      .catch((e: any) => onToast(e.message, 'error'))
  }, [carId, adminSecret]) // eslint-disable-line

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    if (!form.game_title.trim()) { onToast('Game title is required', 'error'); return }
    setSaving(true)
    try {
      const payload = { ...form, car_id: carId, game_logo_url: form.game_logo_url || null, description: form.description || null, external_url: form.external_url || null }
      let d
      if (editing) d = await api('games', 'PUT', { id: editing, ...payload }, adminSecret)
      else d = await api('games', 'POST', payload, adminSecret)
      if (editing) setGames(prev => prev.map(g => g.id === editing ? d.game : g))
      else setGames(prev => [...prev, d.game])
      setForm(empty); setEditing(null); onToast('Saved')
    } catch (e: any) { onToast(e.message, 'error') }
    finally { setSaving(false) }
  }

  const del = async (id: string) => {
    if (!confirm('Delete?')) return
    try { await api('games', 'DELETE', { id }, adminSecret); setGames(prev => prev.filter(g => g.id !== id)); onToast('Deleted') }
    catch (e: any) { onToast(e.message, 'error') }
  }

  const edit = (g: Game) => {
    setForm({ game_title: g.game_title, game_logo_url: g.game_logo_url || '', description: g.description || '', external_url: g.external_url || '', sort_order: g.sort_order, is_visible: g.is_visible })
    setEditing(g.id)
  }

  return (
    <div>
      <div style={s.card}>
        <div style={s.g2}>
          <Field label="Game Title"><input style={s.input} value={form.game_title} onChange={e => set('game_title', e.target.value)} placeholder="Gran Turismo 7" /></Field>
          <Field label="Logo URL"><input style={s.input} value={form.game_logo_url} onChange={e => set('game_logo_url', e.target.value)} placeholder="https://…" /></Field>
          <Field label="Link (optional)"><input style={s.input} value={form.external_url} onChange={e => set('external_url', e.target.value)} /></Field>
          <Field label="Sort Order"><input style={s.input} type="number" value={form.sort_order} onChange={e => set('sort_order', parseInt(e.target.value) || 0)} /></Field>
        </div>
        <div style={{ marginTop: 10 }}><Field label="Description"><textarea style={s.textarea} value={form.description ?? ''} onChange={e => set('description', e.target.value)} /></Field></div>
        <div style={{ ...s.row, marginTop: 14, justifyContent: 'space-between' }}>
          <div style={s.row}><Toggle value={form.is_visible} onChange={v => set('is_visible', v)} /><span style={{ fontSize: 11, color: MUTED }}>Visible</span></div>
          <div style={s.row}>
            {editing && <button style={s.btn()} onClick={() => { setForm(empty); setEditing(null) }}>Cancel</button>}
            <button style={s.btn('green')} onClick={save} disabled={saving}>{saving ? 'Saving…' : editing ? 'Update' : 'Add Game'}</button>
          </div>
        </div>
      </div>
      {games.length === 0 && <EmptyState message="No games yet." />}
      {games.map(g => (
        <div key={g.id} style={s.listItem}>
          <span style={{ flex: 1, fontWeight: 600 }}>{g.game_title}</span>
          <span style={s.badge(g.is_visible)}>{g.is_visible ? 'Visible' : 'Hidden'}</span>
          <button style={s.btn()} onClick={() => edit(g)}>Edit</button>
          <button style={s.btn('danger')} onClick={() => del(g.id)}>Del</button>
        </div>
      ))}
    </div>
  )
}
