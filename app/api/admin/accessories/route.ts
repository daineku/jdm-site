import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAuthed } from '@/lib/adminAuth'

// Unvalidated admin payload (legacy route, no Zod schema): known keys typed, rest passed through.
type AccessoryBody = {
  id?: string
  title?: string
  hidden_for_car_ids?: string[]
  car_ids?: unknown
  [key: string]: unknown
}

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await supabaseAdmin
    .from('accessories')
    .select('*')
    .order('sort_order')
    .order('title')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ accessories: data || [] })
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let body: AccessoryBody
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  if (!body.title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

  // Strip legacy car_ids — new system uses hidden_for_car_ids
  const rest: AccessoryBody = { ...body }
  delete rest.car_ids
  const payload = {
    ...rest,
    hidden_for_car_ids: rest.hidden_for_car_ids || [],
  }

  const { data, error } = await supabaseAdmin.from('accessories').insert(payload).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ accessory: data })
}

export async function PUT(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let body: AccessoryBody
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const { id, ...updates } = body
  delete updates.car_ids
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  const { data, error } = await supabaseAdmin.from('accessories').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ accessory: data })
}

export async function DELETE(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let body: AccessoryBody
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const { id } = body
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  const { error } = await supabaseAdmin.from('accessories').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
