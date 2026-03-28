import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAuthed } from '@/lib/adminAuth'
import {
  AftermarketPartCreateSchema,
  AftermarketPartUpdateSchema,
  AftermarketPartDeleteSchema,
} from '@/lib/validation/car-aftermarket-parts'

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const carId = req.nextUrl.searchParams.get('car_id')
  if (!carId) return NextResponse.json({ error: 'car_id required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('car_aftermarket_parts')
    .select('*, category:part_categories(id, name, slug, icon_ref)')
    .eq('car_id', carId)
    .order('sort_order')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ parts: data || [] })
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let raw: unknown
  try { raw = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const result = AftermarketPartCreateSchema.safeParse(raw)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0]?.message ?? 'Invalid payload' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin.from('car_aftermarket_parts').insert(result.data).select('*, category:part_categories(id, name, slug, icon_ref)').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ part: data })
}

export async function PUT(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let raw: unknown
  try { raw = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const result = AftermarketPartUpdateSchema.safeParse(raw)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0]?.message ?? 'Invalid payload' }, { status: 400 })
  }

  const { id, ...updates } = result.data
  const { data, error } = await supabaseAdmin.from('car_aftermarket_parts').update(updates).eq('id', id).select('*, category:part_categories(id, name, slug, icon_ref)').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ part: data })
}

export async function DELETE(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let raw: unknown
  try { raw = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const result = AftermarketPartDeleteSchema.safeParse(raw)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0]?.message ?? 'Invalid payload' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('car_aftermarket_parts').delete().eq('id', result.data.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
