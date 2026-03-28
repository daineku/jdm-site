import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAuthed } from '@/lib/adminAuth'
import { CarCreateSchema, CarUpdateSchema, CarDeleteSchema } from '@/lib/validation/cars'

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await supabaseAdmin
    .from('cars')
    .select('*, brand_data:brands(id,name,slug)')
    .order('sort_order')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ cars: data || [] })
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let raw: unknown
  try { raw = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const result = CarCreateSchema.safeParse(raw)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0]?.message ?? 'Invalid payload' }, { status: 400 })
  }

  // All new models are published by default — no publish workflow
  const payload = { ...result.data, is_published: true }
  const { data, error } = await supabaseAdmin.from('cars').insert(payload).select().single()
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: `Slug "${payload.slug}" is already taken. Choose a different slug.` }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ car: data })
}

export async function PUT(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let raw: unknown
  try { raw = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const result = CarUpdateSchema.safeParse(raw)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0]?.message ?? 'Invalid payload' }, { status: 400 })
  }

  const { id, ...updates } = result.data
  const { data, error } = await supabaseAdmin.from('cars').update(updates).eq('id', id).select().single()
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: `Slug "${updates.slug}" is already taken.` }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ car: data })
}

export async function DELETE(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let raw: unknown
  try { raw = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const result = CarDeleteSchema.safeParse(raw)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0]?.message ?? 'Invalid payload' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('cars').delete().eq('id', result.data.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
