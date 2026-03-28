'use client'
import { useState, useEffect } from 'react'
import { s, Field, EmptyState, api } from '../ui'

type Block = { id: string; block_type: string; title: string | null; sort_order: number; is_visible: boolean; config: Record<string, any> }
type Props = { carId: string; adminSecret: string; onToast: (msg: string, type?: 'success' | 'error') => void }

const BLOCK_TYPES = ['gallery', 'builds', 'accessories', 'videos', 'racing_games', 'rich_text', 'media']

export function ModelBlocksTab({ carId, adminSecret, onToast }: Props) {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [adding, setAdding] = useState(false)
  const [newType, setNewType] = useState('gallery')
  const [newTitle, setNewTitle] = useState('')

  useEffect(() => {
    api(`blocks?car_id=${carId}`, 'GET', undefined, adminSecret)
      .then((d: any) => setBlocks(d.blocks || []))
      .catch((e: any) => onToast(e.message, 'error'))
  }, [carId, adminSecret]) // eslint-disable-line

  const sorted = [...blocks].sort((a, b) => a.sort_order - b.sort_order)

  const addBlock = async () => {
    const sort = sorted.length > 0 ? Math.max(...sorted.map(b => b.sort_order)) + 10 : 10
    try {
      const d = await api('blocks', 'POST', { car_id: carId, block_type: newType, title: newTitle || null, sort_order: sort, is_visible: true, config: {} }, adminSecret)
      setBlocks(prev => [...prev, d.block]); setAdding(false); setNewTitle(''); onToast('Block added')
    } catch (e: any) { onToast(e.message, 'error') }
  }

  const toggle = async (block: Block) => {
    try {
      await api('blocks', 'PUT', { id: block.id, is_visible: !block.is_visible }, adminSecret)
      setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, is_visible: !b.is_visible } : b))
    } catch (e: any) { onToast(e.message, 'error') }
  }

  const move = async (block: Block, dir: 'up' | 'down') => {
    const idx = sorted.findIndex(b => b.id === block.id)
    const swap = dir === 'up' ? sorted[idx - 1] : sorted[idx + 1]
    if (!swap) return
    try {
      await Promise.all([
        api('blocks', 'PUT', { id: block.id, sort_order: swap.sort_order }, adminSecret),
        api('blocks', 'PUT', { id: swap.id, sort_order: block.sort_order }, adminSecret),
      ])
      setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, sort_order: swap.sort_order } : b.id === swap.id ? { ...b, sort_order: block.sort_order } : b))
    } catch (e: any) { onToast(e.message, 'error') }
  }

  const del = async (id: string) => {
    if (!confirm('Delete block?')) return
    try { await api('blocks', 'DELETE', { id }, adminSecret); setBlocks(prev => prev.filter(b => b.id !== id)); onToast('Deleted') }
    catch (e: any) { onToast(e.message, 'error') }
  }

  return (
    <div>
      <div style={{ ...s.row, marginBottom: 16 }}>
        <p style={{ ...s.secTitle, margin: 0 }}>Page Layout Blocks</p>
        <button style={{ ...s.btn('green'), marginLeft: 'auto' }} onClick={() => setAdding(v => !v)}>{adding ? 'Cancel' : '+ Add Block'}</button>
      </div>

      {sorted.length === 0 && !adding && <EmptyState message="No blocks configured. All sections with content show in default order." />}

      {adding && (
        <div style={{ ...s.card, marginBottom: 14 }}>
          <div style={s.g2}>
            <Field label="Block Type">
              <select style={s.select} value={newType} onChange={e => setNewType(e.target.value)}>
                {BLOCK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Custom Title (optional)">
              <input style={s.input} value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Override section heading…" />
            </Field>
          </div>
          <div style={{ textAlign: 'right', marginTop: 12 }}><button style={s.btn('green')} onClick={addBlock}>Add</button></div>
        </div>
      )}

      {sorted.map((block, i) => (
        <div key={block.id} style={s.listItem}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <button style={{ ...s.btn(), padding: '2px 6px', fontSize: 9 }} onClick={() => move(block, 'up')} disabled={i === 0}>▲</button>
            <button style={{ ...s.btn(), padding: '2px 6px', fontSize: 9 }} onClick={() => move(block, 'down')} disabled={i === sorted.length - 1}>▼</button>
          </div>
          <span style={{ fontWeight: 600, flex: 1 }}>{block.title || block.block_type}</span>
          <span style={{ fontSize: 10, color: '#555', textTransform: 'uppercase' }}>{block.block_type}</span>
          <button style={s.badge(block.is_visible)} onClick={() => toggle(block)}>{block.is_visible ? 'Visible' : 'Hidden'}</button>
          <button style={s.btn('danger')} onClick={() => del(block.id)}>Del</button>
        </div>
      ))}
    </div>
  )
}
