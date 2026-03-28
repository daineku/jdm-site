import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAuthed } from '@/lib/adminAuth'

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await supabaseAdmin
    .from('gallery_photos')
    .select('*, car:cars(id, title, slug, brand)')
    .eq('show_on_home', true)
    .order('home_sort_order', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ photos: data || [] })
}

export async function PUT(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const allowed = ['caption', 'home_sort_order', 'show_on_home', 'alt_text']
  const safe: Record<string, any> = {}
  for (const k of allowed) {
    if (k in updates) safe[k] = updates[k]
  }
  if (Object.keys(safe).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  // When enabling show_on_home, assign next available sort order
  if (safe.show_on_home === true) {
    const { data: maxRow } = await supabaseAdmin
      .from('gallery_photos')
      .select('home_sort_order')
      .eq('show_on_home', true)
      .order('home_sort_order', { ascending: false })
      .limit(1)
      .single()
    safe.home_sort_order = maxRow ? maxRow.home_sort_order + 10 : 10
  }

  const { data, error } = await supabaseAdmin
    .from('gallery_photos')
    .update(safe)
    .eq('id', id)
    .select('*, car:cars(id, title, slug, brand)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ photo: data })
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { orders } = body
  if (!Array.isArray(orders) || orders.length === 0) {
    return NextResponse.json({ error: 'orders array is required' }, { status: 400 })
  }
  for (const entry of orders) {
    if (!entry.id || typeof entry.home_sort_order !== 'number') {
      return NextResponse.json({ error: 'Each entry needs id and home_sort_order (number)' }, { status: 400 })
    }
  }

  const errors: string[] = []
  for (const { id, home_sort_order } of orders) {
    const { error } = await supabaseAdmin
      .from('gallery_photos')
      .update({ home_sort_order })
      .eq('id', id)
    if (error) errors.push(`${id}: ${error.message}`)
  }

  if (errors.length > 0) return NextResponse.json({ error: 'Some updates failed', details: errors }, { status: 207 })
  return NextResponse.json({ success: true, updated: orders.length })
}
