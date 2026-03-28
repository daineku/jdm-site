import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAuthed } from '@/lib/adminAuth'
import {
  GlobalPartCreateSchema,
  GlobalPartUpdateSchema,
  GlobalPartDeleteSchema,
} from '@/lib/validation/global-parts'

const SELECT = 'id, title, brand_name, notes, image_url, affiliate_url, price_range, key_specs, availability, is_featured, sort_order, is_published, created_at, part_category_id, category:part_categories(id, name, slug)'

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const categoryId = req.nextUrl.searchParams.get('category_id')
  let query = supabaseAdmin.from('global_parts').select(SELECT).order('sort_order')
  if (categoryId) query = query.eq('part_category_id', categoryId)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ globalParts: data || [] })
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let raw: unknown
  try { raw = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const result = GlobalPartCreateSchema.safeParse(raw)
  if (!result.success) return NextResponse.json({ error: result.error.issues[0]?.message ?? 'Invalid payload' }, { status: 400 })
  const { data, error } = await supabaseAdmin.from('global_parts').insert(result.data).select(SELECT).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ globalPart: data })
}

export async function PUT(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let raw: unknown
  try { raw = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const result = GlobalPartUpdateSchema.safeParse(raw)
  if (!result.success) return NextResponse.json({ error: result.error.issues[0]?.message ?? 'Invalid payload' }, { status: 400 })
  const { id, ...updates } = result.data
  const { data, error } = await supabaseAdmin.from('global_parts').update(updates).eq('id', id).select(SELECT).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ globalPart: data })
}

export async function DELETE(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let raw: unknown
  try { raw = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const result = GlobalPartDeleteSchema.safeParse(raw)
  if (!result.success) return NextResponse.json({ error: result.error.issues[0]?.message ?? 'Invalid payload' }, { status: 400 })
  // Remove model assignments first, then delete
  await supabaseAdmin.from('model_parts').delete().eq('part_id', result.data.id)
  const { error } = await supabaseAdmin.from('global_parts').delete().eq('id', result.data.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
