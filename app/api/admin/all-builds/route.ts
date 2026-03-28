import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAuthed } from '@/lib/adminAuth'
import { z } from 'zod'

// GET: list all build instances across all models
export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await supabaseAdmin
    .from('car_build_instances')
    .select(`
      id, title, setup_summary, is_visible, sort_order,
      car:cars(id, title, slug),
      category:build_categories(id, name, slug),
      photos:build_instance_photos(build_id, photo_id, sort_order, photo:gallery_photos(id, thumb_url, url))
    `)
    .order('sort_order')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ allBuilds: data || [] })
}

// PUT: update visibility or sort_order from the global management view
const UpdateSchema = z.object({
  id: z.string().uuid(),
  is_visible: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
})

export async function PUT(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let raw: unknown
  try { raw = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const result = UpdateSchema.safeParse(raw)
  if (!result.success) return NextResponse.json({ error: result.error.issues[0]?.message ?? 'Invalid payload' }, { status: 400 })
  const { id, ...updates } = result.data
  const { data, error } = await supabaseAdmin
    .from('car_build_instances')
    .update(updates)
    .eq('id', id)
    .select('id, is_visible, sort_order')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ build: data })
}
