'use client'
import { useState, useEffect, useCallback } from 'react'
import { s, EmptyState, ErrorBanner, api, MUTED, G } from '../ui'
import type { BuildCategory } from '@/lib/types'

type Props = { carId: string; adminSecret: string; onToast: (msg: string, type?: 'success' | 'error') => void }

export function ModelStyleTab({ carId, adminSecret, onToast }: Props) {
  const [allCategories, setAllCategories] = useState<BuildCategory[]>([])
  const [assigned, setAssigned] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [catRes, assignRes] = await Promise.all([
        api('build-categories', 'GET', undefined, adminSecret),
        api(`car-categories?car_id=${carId}`, 'GET', undefined, adminSecret),
      ])
      setAllCategories(catRes.buildCategories || [])
      setAssigned(new Set(assignRes.categoryIds || []))
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [carId, adminSecret])

  useEffect(() => { load() }, [load])

  const toggle = async (categoryId: string) => {
    if (toggling) return
    setToggling(categoryId)
    const isAssigned = assigned.has(categoryId)
    try {
      if (isAssigned) {
        await api('car-categories', 'DELETE', { car_id: carId, category_id: categoryId }, adminSecret)
        setAssigned(prev => { const n = new Set(prev); n.delete(categoryId); return n })
      } else {
        await api('car-categories', 'POST', { car_id: carId, category_id: categoryId }, adminSecret)
        setAssigned(prev => new Set([...prev, categoryId]))
      }
    } catch (e: any) { onToast(e.message, 'error') }
    finally { setToggling(null) }
  }

  if (loading) return <div style={{ color: MUTED, fontSize: 12, padding: 20 }}>Loading…</div>

  return (
    <div>
      <ErrorBanner message={error} />
      <p style={{ ...s.secTitle, marginBottom: 8 }}>Build Categories</p>
      <p style={{ fontSize: 11, color: MUTED, marginBottom: 16 }}>
        Toggle categories for this model. Changes save immediately.
      </p>

      {allCategories.length === 0 && (
        <EmptyState message="No build categories yet. Add them in Build Categories → Global admin." />
      )}

      {[...allCategories].sort((a, b) => a.sort_order - b.sort_order).map(cat => {
        const isOn = assigned.has(cat.id)
        const busy = toggling === cat.id
        return (
          <div
            key={cat.id}
            style={{
              ...s.listItem,
              cursor: busy ? 'wait' : 'pointer',
              opacity: busy ? 0.6 : 1,
              borderLeft: isOn ? `2px solid ${G}` : '2px solid transparent',
              transition: 'border-color 0.15s, opacity 0.15s',
            }}
            onClick={() => !busy && toggle(cat.id)}
          >
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 600, color: isOn ? '#fff' : '#888' }}>{cat.name}</span>
              {cat.description && (
                <span style={{ fontSize: 11, color: MUTED, marginLeft: 8 }}>{cat.description}</span>
              )}
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '3px 8px', borderRadius: 2,
              color: isOn ? '#000' : MUTED,
              background: isOn ? G : '#1a1a1a',
              border: isOn ? 'none' : '1px solid #2a2a2a',
            }}>
              {busy ? '…' : isOn ? 'Assigned' : 'Add'}
            </span>
          </div>
        )
      })}

      {assigned.size > 0 && (
        <p style={{ fontSize: 11, color: MUTED, marginTop: 12 }}>
          {assigned.size} categor{assigned.size === 1 ? 'y' : 'ies'} assigned
        </p>
      )}
    </div>
  )
}
