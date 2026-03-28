import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAuthed } from '@/lib/adminAuth'
import {
  BuildCategoryCreateSchema,
  BuildCategoryUpdateSchema,
  BuildCategoryDeleteSchema,
} from '@/lib/validation/build-categories'

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await supabaseAdmin
    .from('build_categories')
    .select('id, name, slug, description, page_description, seo_title, seo_description, og_image_url, icon_ref, sort_order, is_published, created_at')
    .order('sort_order')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ buildCategories: data || [] })
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let raw: unknown
  try { raw = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const result = BuildCategoryCreateSchema.safeParse(raw)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0]?.message ?? 'Invalid payload' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin.from('build_categories').insert(result.data).select().single()
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: `Slug "${result.data.slug}" is already taken.` }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ buildCategory: data })
}

export async function PUT(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let raw: unknown
  try { raw = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const result = BuildCategoryUpdateSchema.safeParse(raw)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0]?.message ?? 'Invalid payload' }, { status: 400 })
  }

  const { id, ...updates } = result.data
  const { data, error } = await supabaseAdmin.from('build_categories').update(updates).eq('id', id).select().single()
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: `Slug "${updates.slug}" is already taken.` }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ buildCategory: data })
}

export async function DELETE(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let raw: unknown
  try { raw = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const result = BuildCategoryDeleteSchema.safeParse(raw)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0]?.message ?? 'Invalid payload' }, { status: 400 })
  }

  // Delete assignments first, then the category
  await supabaseAdmin.from('car_build_categories').delete().eq('category_id', result.data.id)
  const { error } = await supabaseAdmin.from('build_categories').delete().eq('id', result.data.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
