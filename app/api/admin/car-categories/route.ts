import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAuthed } from '@/lib/adminAuth'

// GET /api/admin/car-categories?car_id=xxx — list category assignments for a car
export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const carId = req.nextUrl.searchParams.get('car_id')
  if (!carId) return NextResponse.json({ error: 'car_id is required' }, { status: 400 })
  const { data, error } = await supabaseAdmin
    .from('car_build_categories')
    .select('category_id')
    .eq('car_id', carId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ assignments: data || [] })
}

// POST /api/admin/car-categories — assign a category to a car
export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  if (!body.car_id || !body.category_id) return NextResponse.json({ error: 'car_id and category_id are required' }, { status: 400 })
  const { error } = await supabaseAdmin
    .from('car_build_categories')
    .upsert({ car_id: body.car_id, category_id: body.category_id }, { onConflict: 'car_id,category_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE /api/admin/car-categories — remove a category assignment from a car
export async function DELETE(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  if (!body.car_id || !body.category_id) return NextResponse.json({ error: 'car_id and category_id are required' }, { status: 400 })
  const { error } = await supabaseAdmin
    .from('car_build_categories')
    .delete()
    .eq('car_id', body.car_id)
    .eq('category_id', body.category_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
