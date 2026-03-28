'use client'
import { useState, useEffect, useCallback } from 'react'
import { s, EmptyState, ErrorBanner, api, MUTED, G } from '../ui'
import type { GlobalGame } from '@/lib/types'

type Props = { carId: string; adminSecret: string; onToast: (msg: string, type?: 'success' | 'error') => void }

export function ModelGamesAssignTab({ carId, adminSecret, onToast }: Props) {
  const [allGames, setAllGames] = useState<GlobalGame[]>([])
  const [assigned, setAssigned] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [gamesRes, assignRes] = await Promise.all([
        api('global-games', 'GET', undefined, adminSecret),
        api(`car-games?car_id=${carId}`, 'GET', undefined, adminSecret),
      ])
      setAllGames(gamesRes.globalGames || [])
      setAssigned(new Set(assignRes.gameIds || []))
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [carId, adminSecret])

  useEffect(() => { load() }, [load])

  const toggle = async (gameId: string) => {
    if (toggling) return
    setToggling(gameId)
    const isAssigned = assigned.has(gameId)
    try {
      if (isAssigned) {
        await api('car-games', 'DELETE', { car_id: carId, game_id: gameId }, adminSecret)
        setAssigned(prev => { const n = new Set(prev); n.delete(gameId); return n })
      } else {
        await api('car-games', 'POST', { car_id: carId, game_id: gameId }, adminSecret)
        setAssigned(prev => new Set([...prev, gameId]))
      }
    } catch (e: any) { onToast(e.message, 'error') }
    finally { setToggling(null) }
  }

  if (loading) return <div style={{ color: MUTED, fontSize: 12, padding: 20 }}>Loading…</div>

  return (
    <div>
      <ErrorBanner message={error} />
      <p style={{ ...s.secTitle, marginBottom: 8 }}>Assign Games</p>
      <p style={{ fontSize: 11, color: MUTED, marginBottom: 16 }}>
        Toggle games to assign them to this model. Changes save immediately.
        Manage game content in Global → Games.
      </p>

      {allGames.length === 0 && (
        <EmptyState message="No games created yet. Add them in Global → Games." />
      )}

      {[...allGames].sort((a, b) => a.sort_order - b.sort_order).map(game => {
        const isOn = assigned.has(game.id)
        const busy = toggling === game.id
        return (
          <div key={game.id}
            style={{
              ...s.listItem,
              cursor: busy ? 'wait' : 'pointer',
              opacity: busy ? 0.6 : 1,
              borderLeft: isOn ? `2px solid ${G}` : '2px solid transparent',
              transition: 'border-color 0.15s, opacity 0.15s',
            }}
            onClick={() => !busy && toggle(game.id)}
          >
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 600, color: isOn ? '#fff' : '#888' }}>{game.title}</span>
              {game.description && (
                <span style={{ fontSize: 11, color: MUTED, marginLeft: 8 }}>{game.description}</span>
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
          {assigned.size} game{assigned.size === 1 ? '' : 's'} assigned
        </p>
      )}
    </div>
  )
}
