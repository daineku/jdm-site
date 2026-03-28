'use client'
import { useState, useEffect, useCallback } from 'react'
import { s, api, useToast, Toggle, EmptyState, ErrorBanner, MUTED, G } from './ui'
import { BuildCategoriesTab } from './BuildCategoriesTab'

type BuildEntry = {
  id: string
  title: string
  setup_summary: string
  is_visible: boolean
  sort_order: number
  car?: { id: string; title: string; slug: string } | null
  category?: { id: string; name: string; slug: string } | null
  photos?: { build_id: string; photo_id: string; sort_order: number; photo?: { id: string; thumb_url: string | null; url: string } | null }[]
}

type InnerTab = 'categories' | 'builds'

export function BuildsSection({ adminSecret }: { adminSecret: string }) {
  const [tab, setTab] = useState<InnerTab>('categories')
  const [builds, setBuilds] = useState<BuildEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { show, element: toastEl } = useToast()

  const loadBuilds = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const d = await api('all-builds', 'GET', undefined, adminSecret)
      setBuilds(d.allBuilds || [])
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [adminSecret])

  useEffect(() => {
    if (tab === 'builds') loadBuilds()
  }, [tab, loadBuilds])

  const toggleVisibility = async (build: BuildEntry) => {
    try {
      await api('all-builds', 'PUT', { id: build.id, is_visible: !build.is_visible }, adminSecret)
      setBuilds(prev => prev.map(b => b.id === build.id ? { ...b, is_visible: !b.is_visible } : b))
    } catch (e: any) { show(e.message, 'error') }
  }

  const updateSortOrder = async (build: BuildEntry, val: number) => {
    try {
      await api('all-builds', 'PUT', { id: build.id, sort_order: val }, adminSecret)
      setBuilds(prev => prev.map(b => b.id === build.id ? { ...b, sort_order: val } : b))
      show('Order updated')
    } catch (e: any) { show(e.message, 'error') }
  }

  const featuredThumb = (b: BuildEntry) => {
    const sorted = (b.photos || []).sort((a, c) => a.sort_order - c.sort_order)
    return sorted[0]?.photo?.thumb_url || sorted[0]?.photo?.url || null
  }

  const TAB_STYLE = (active: boolean): React.CSSProperties => ({
    background: active ? '#1a1a1a' : 'none',
    color: active ? G : MUTED,
    border: 'none',
    borderBottom: active ? `2px solid ${G}` : '2px solid transparent',
    padding: '7px 18px',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    fontFamily: 'Manrope, sans-serif',
  })

  return (
    <div>
      {toastEl}
      {/* Inner tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1a1a1a', marginBottom: 20 }}>
        <button style={TAB_STYLE(tab === 'categories')} onClick={() => setTab('categories')}>
          Build Categories
        </button>
        <button style={TAB_STYLE(tab === 'builds')} onClick={() => setTab('builds')}>
          All Builds
        </button>
      </div>

      {tab === 'categories' && (
        <BuildCategoriesTab adminSecret={adminSecret} />
      )}

      {tab === 'builds' && (
        <div>
          <p style={s.secTitle}>All Builds</p>
          <div style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 3, padding: '10px 14px', marginBottom: 20 }}>
            <p style={{ fontSize: 11, color: MUTED, margin: 0 }}>
              Builds are created inside each model's <strong style={{ color: '#aaa' }}>Builds tab</strong>. This view is for managing visibility and display order across all builds.
            </p>
          </div>
          <ErrorBanner message={error} />
          {loading && <div style={{ color: MUTED, fontSize: 12, padding: 20 }}>Loading...</div>}
          {!loading && builds.length === 0 && (
            <EmptyState message="No builds created yet. Open a model and use its Builds tab to create the first build." />
          )}
          {[...builds].sort((a, b) => a.sort_order - b.sort_order).map(build => (
            <div key={build.id} style={{ ...s.listItem, alignItems: 'center', gap: 12 }}>
              {/* Featured photo thumb */}
              {featuredThumb(build) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={featuredThumb(build)!} alt="" style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }} />
              ) : (
                <div style={{ width: 52, height: 52, background: '#1a1a1a', borderRadius: 2, flexShrink: 0 }} />
              )}

              {/* Labels */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: '#fff' }}>{build.title}</span>
                  {build.category && (
                    <span style={{ fontSize: 10, color: G, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      {build.category.name}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                  {build.car && (
                    <span style={{ fontSize: 11, color: MUTED }}>{build.car.title}</span>
                  )}
                  {build.setup_summary && (
                    <span style={{ fontSize: 11, color: '#444' }}>· {build.setup_summary}</span>
                  )}
                </div>
              </div>

              {/* Sort order */}
              <input
                type="number"
                value={build.sort_order}
                onChange={e => updateSortOrder(build, parseInt(e.target.value) || 0)}
                style={{ ...s.input, width: 56, textAlign: 'center' as const, flexShrink: 0 }}
                title="Sort order"
              />

              {/* Visibility toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <Toggle value={build.is_visible} onChange={() => toggleVisibility(build)} />
                <span style={{ fontSize: 10, color: build.is_visible ? G : MUTED, width: 40 }}>
                  {build.is_visible ? 'Live' : 'Hidden'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
