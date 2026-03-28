'use client'
import { useState, useEffect, useCallback } from 'react'
import { s, EmptyState, ErrorBanner, api, MUTED, G } from '../ui'
import type { GlobalPart, PartCategory } from '@/lib/types'

type Props = { carId: string; adminSecret: string; onToast: (msg: string, type?: 'success' | 'error') => void }

export function ModelPartsAssignTab({ carId, adminSecret, onToast }: Props) {
  const [allParts, setAllParts] = useState<GlobalPart[]>([])
  const [categories, setCategories] = useState<PartCategory[]>([])
  const [assigned, setAssigned] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [partsRes, catRes, assignRes] = await Promise.all([
        api('global-parts', 'GET', undefined, adminSecret),
        api('part-categories', 'GET', undefined, adminSecret),
        api(`model-parts?car_id=${carId}`, 'GET', undefined, adminSecret),
      ])
      setAllParts(partsRes.globalParts || [])
      setCategories(catRes.partCategories || [])
      setAssigned(new Set(assignRes.partIds || []))
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [carId, adminSecret])

  useEffect(() => { load() }, [load])

  const toggle = async (partId: string) => {
    if (toggling) return
    setToggling(partId)
    const isAssigned = assigned.has(partId)
    try {
      if (isAssigned) {
        await api('model-parts', 'DELETE', { car_id: carId, part_id: partId }, adminSecret)
        setAssigned(prev => { const n = new Set(prev); n.delete(partId); return n })
      } else {
        await api('model-parts', 'POST', { car_id: carId, part_id: partId }, adminSecret)
        setAssigned(prev => new Set([...prev, partId]))
      }
    } catch (e: any) { onToast(e.message, 'error') }
    finally { setToggling(null) }
  }

  if (loading) return <div style={{ color: MUTED, fontSize: 12, padding: 20 }}>Loading...</div>

  const publishedParts = allParts.filter(p => p.is_published)
  const filtered = activeCategory === 'all'
    ? publishedParts
    : publishedParts.filter(p => p.part_category_id === activeCategory)

  const usedCatIds = new Set(publishedParts.map(p => p.part_category_id).filter(Boolean))
  const usedCategories = categories.filter(c => usedCatIds.has(c.id))

  return (
    <div>
      <ErrorBanner message={error} />
      <p style={{ ...s.secTitle, marginBottom: 8 }}>Assign Parts</p>
      <p style={{ fontSize: 11, color: MUTED, marginBottom: 14 }}>
        Toggle to assign global parts to this model. Create and manage parts in Global → Parts.
        Only published parts are shown here.
      </p>

      {publishedParts.length === 0 && (
        <EmptyState message="No published parts yet. Add parts in Global → Parts, then mark them as Published." />
      )}

      {publishedParts.length > 0 && (
        <>
          {/* Category filter */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            <button
              onClick={() => setActiveCategory('all')}
              style={{ ...s.btn(), fontSize: 10, background: activeCategory === 'all' ? '#1a1a1a' : 'none', color: activeCategory === 'all' ? G : MUTED, border: activeCategory === 'all' ? `1px solid ${G}` : '1px solid #2a2a2a' }}
            >
              All ({publishedParts.length})
            </button>
            {usedCategories.map(cat => {
              const count = publishedParts.filter(p => p.part_category_id === cat.id).length
              return (
                <button key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  style={{ ...s.btn(), fontSize: 10, background: activeCategory === cat.id ? '#1a1a1a' : 'none', color: activeCategory === cat.id ? G : MUTED, border: activeCategory === cat.id ? `1px solid ${G}` : '1px solid #2a2a2a' }}
                >
                  {cat.name} ({count})
                </button>
              )
            })}
          </div>

          {/* Parts list */}
          {filtered.map(part => {
            const isOn = assigned.has(part.id)
            const busy = toggling === part.id
            return (
              <div key={part.id}
                onClick={() => !busy && toggle(part.id)}
                style={{
                  ...s.listItem, cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.6 : 1,
                  borderLeft: isOn ? `2px solid ${G}` : '2px solid transparent',
                  transition: 'border-color 0.15s',
                }}
              >
                {part.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={part.image_url} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {part.brand_name && <span style={{ fontWeight: 700, color: isOn ? '#fff' : '#888' }}>{part.brand_name} </span>}
                  <span style={{ color: isOn ? '#ddd' : '#666' }}>{part.title}</span>
                  {part.price_range && <span style={{ fontSize: 11, color: '#555', marginLeft: 8 }}>{part.price_range}</span>}
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                  padding: '3px 8px', borderRadius: 2,
                  color: isOn ? '#000' : MUTED,
                  background: isOn ? G : '#1a1a1a',
                  border: isOn ? 'none' : '1px solid #2a2a2a',
                  flexShrink: 0,
                }}>
                  {busy ? '…' : isOn ? 'Assigned' : 'Add'}
                </span>
              </div>
            )
          })}

          {assigned.size > 0 && (
            <p style={{ fontSize: 11, color: MUTED, marginTop: 12 }}>
              {assigned.size} part{assigned.size === 1 ? '' : 's'} assigned to this model
            </p>
          )}
        </>
      )}
    </div>
  )
}
