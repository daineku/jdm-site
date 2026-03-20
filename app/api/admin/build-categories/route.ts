import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAuthed } from '@/lib/adminAuth'

// GET /api/admin/build-categories — list all global build categories
export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await supabaseAdmin
    .from('build_categories')
    .select('*')
    .order('sort_order')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ categories: data || [] })
}

// POST /api/admin/build-categories — create a new global build category
export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  if (!body.name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!body.slug?.trim()) body.slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const { data, error } = await supabaseAdmin
    .from('build_categories')
    .insert({
      name: body.name.trim(),
      slug: body.slug.trim(),
      description: body.description || null,
      icon_ref: body.icon_ref || null,
      sort_order: body.sort_order ?? 0,
      is_active: body.is_active !== false,
    })
    .select()
    .single()
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: `Slug "${body.slug}" already exists.` }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ category: data })
}

// PUT /api/admin/build-categories — update a global build category
export async function PUT(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  if (!body.id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  const { id, ...rest } = body
  const { data, error } = await supabaseAdmin
    .from('build_categories')
    .update(rest)
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ category: data })
}

// DELETE /api/admin/build-categories — delete a global build category
export async function DELETE(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  if (!body.id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  const { error } = await supabaseAdmin.from('build_categories').delete().eq('id', body.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
