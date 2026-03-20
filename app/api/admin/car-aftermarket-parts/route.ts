import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAuthed } from '@/lib/adminAuth'

// GET /api/admin/car-aftermarket-parts?car_id=xxx
export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const carId = req.nextUrl.searchParams.get('car_id')
  if (!carId) return NextResponse.json({ error: 'car_id is required' }, { status: 400 })
  const { data, error } = await supabaseAdmin
    .from('car_aftermarket_parts')
    .select('*')
    .eq('car_id', carId)
    .order('sort_order')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ parts: data || [] })
}

// POST /api/admin/car-aftermarket-parts — add a new aftermarket part
export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  if (!body.car_id) return NextResponse.json({ error: 'car_id is required' }, { status: 400 })
  if (!body.part_name?.trim()) return NextResponse.json({ error: 'part_name is required' }, { status: 400 })
  const { data, error } = await supabaseAdmin
    .from('car_aftermarket_parts')
    .insert({
      car_id: body.car_id,
      category: body.category || null,
      brand: body.brand || null,
      part_name: body.part_name.trim(),
      note: body.note || null,
      sort_order: body.sort_order ?? 0,
      is_hidden: body.is_hidden === true,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ part: data })
}

// PUT /api/admin/car-aftermarket-parts — update an existing part
export async function PUT(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  if (!body.id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  const { id, car_id, ...rest } = body
  // Strip car_id from update payload (immutable); sanitize strings
  const update: Record<string, any> = {}
  if ('category' in rest) update.category = rest.category || null
  if ('brand' in rest) update.brand = rest.brand || null
  if ('part_name' in rest) update.part_name = rest.part_name?.trim() || null
  if ('note' in rest) update.note = rest.note || null
  if ('sort_order' in rest) update.sort_order = rest.sort_order ?? 0
  if ('is_hidden' in rest) update.is_hidden = rest.is_hidden === true
  const { data, error } = await supabaseAdmin
    .from('car_aftermarket_parts')
    .update(update)
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ part: data })
}

// DELETE /api/admin/car-aftermarket-parts — delete a part
export async function DELETE(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  if (!body.id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  const { error } = await supabaseAdmin.from('car_aftermarket_parts').delete().eq('id', body.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
