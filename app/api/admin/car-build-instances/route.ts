import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAuthed } from '@/lib/adminAuth'
import {
  BuildInstanceCreateSchema,
  BuildInstanceUpdateSchema,
  BuildInstanceDeleteSchema,
} from '@/lib/validation/build-instances'

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const carId = req.nextUrl.searchParams.get('car_id')
  if (!carId) return NextResponse.json({ error: 'car_id required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('car_build_instances')
    .select(`
      *,
      category:build_categories(id, name, slug),
      photos:build_instance_photos(build_id, photo_id, sort_order, photo:gallery_photos(id, url, thumb_url, orientation))
    `)
    .eq('car_id', carId)
    .order('sort_order')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ buildInstances: data || [] })
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let raw: unknown
  try { raw = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const result = BuildInstanceCreateSchema.safeParse(raw)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0]?.message ?? 'Invalid payload' }, { status: 400 })
  }

  // photo_ids is passed alongside the build data but stored in build_instance_photos
  const { photo_ids, ...buildData } = result.data as any

  const { data, error } = await supabaseAdmin
    .from('car_build_instances')
    .insert(buildData)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Insert photo associations if provided
  if (photo_ids && Array.isArray(photo_ids) && photo_ids.length > 0) {
    const photoRows = photo_ids.map((pid: string, i: number) => ({
      build_id: data.id,
      photo_id: pid,
      sort_order: i * 10,
    }))
    await supabaseAdmin.from('build_instance_photos').insert(photoRows)
  }

  return NextResponse.json({ buildInstance: data })
}

export async function PUT(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let raw: unknown
  try { raw = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const result = BuildInstanceUpdateSchema.safeParse(raw)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0]?.message ?? 'Invalid payload' }, { status: 400 })
  }

  const { id, photo_ids, ...updates } = result.data as any

  const { data, error } = await supabaseAdmin
    .from('car_build_instances')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // If photo_ids supplied, replace all photos
  if (photo_ids !== undefined && Array.isArray(photo_ids)) {
    await supabaseAdmin.from('build_instance_photos').delete().eq('build_id', id)
    if (photo_ids.length > 0) {
      const photoRows = photo_ids.map((pid: string, i: number) => ({
        build_id: id,
        photo_id: pid,
        sort_order: i * 10,
      }))
      await supabaseAdmin.from('build_instance_photos').insert(photoRows)
    }
  }

  return NextResponse.json({ buildInstance: data })
}

export async function DELETE(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let raw: unknown
  try { raw = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const result = BuildInstanceDeleteSchema.safeParse(raw)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0]?.message ?? 'Invalid payload' }, { status: 400 })
  }

  // Photos cascade via FK
  const { error } = await supabaseAdmin
    .from('car_build_instances')
    .delete()
    .eq('id', result.data.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
