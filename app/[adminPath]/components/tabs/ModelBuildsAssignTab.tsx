'use client'
import { useState, useEffect, useCallback } from 'react'
import { s, EmptyState, ErrorBanner, api, MUTED, G } from '../ui'
import type { GlobalBuild } from '@/lib/types'

type Props = { carId: string; adminSecret: string; onToast: (msg: string, type?: 'success' | 'error') => void }

export function ModelBuildsAssignTab({ carId, adminSecret, onToast }: Props) {
  const [allBuilds, setAllBuilds] = useState<GlobalBuild[]>([])
  const [assigned, setAssigned] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [buildsRes, assignRes] = await Promise.all([
        api('global-builds', 'GET', undefined, adminSecret),
        api(`car-builds?car_id=${carId}`, 'GET', undefined, adminSecret),
      ])
      setAllBuilds(buildsRes.globalBuilds || [])
      setAssigned(new Set(assignRes.buildIds || []))
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [carId, adminSecret])

  useEffect(() => { load() }, [load])

  const toggle = async (buildId: string) => {
    if (toggling) return
    setToggling(buildId)
    const isAssigned = assigned.has(buildId)
    try {
      if (isAssigned) {
        await api('car-builds', 'DELETE', { car_id: carId, build_id: buildId }, adminSecret)
        setAssigned(prev => { const n = new Set(prev); n.delete(buildId); return n })
      } else {
        await api('car-builds', 'POST', { car_id: carId, build_id: buildId }, adminSecret)
        setAssigned(prev => new Set([...prev, buildId]))
      }
    } catch (e: any) { onToast(e.message, 'error') }
    finally { setToggling(null) }
  }

  if (loading) return <div style={{ color: MUTED, fontSize: 12, padding: 20 }}>Loading…</div>

  return (
    <div>
      <ErrorBanner message={error} />
      <p style={{ ...s.secTitle, marginBottom: 8 }}>Assign Builds</p>
      <p style={{ fontSize: 11, color: MUTED, marginBottom: 16 }}>
        Toggle builds to assign them to this model. Changes save immediately.
        Manage build content in Global → Builds.
      </p>

      {allBuilds.length === 0 && (
        <EmptyState message="No builds created yet. Add them in Global → Builds." />
      )}

      {[...allBuilds].sort((a, b) => a.sort_order - b.sort_order).map(build => {
        const isOn = assigned.has(build.id)
        const busy = toggling === build.id
        return (
          <div key={build.id}
            style={{
              ...s.listItem,
              cursor: busy ? 'wait' : 'pointer',
              opacity: busy ? 0.6 : 1,
              borderLeft: isOn ? `2px solid ${G}` : '2px solid transparent',
              transition: 'border-color 0.15s, opacity 0.15s',
            }}
            onClick={() => !busy && toggle(build.id)}
          >
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 600, color: isOn ? '#fff' : '#888' }}>{build.title}</span>
              {build.description && (
                <span style={{ fontSize: 11, color: MUTED, marginLeft: 8 }}>{build.description}</span>
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
          {assigned.size} build{assigned.size === 1 ? '' : 's'} assigned
        </p>
      )}
    </div>
  )
}
