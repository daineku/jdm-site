import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAuthed } from '@/lib/adminAuth'
import { deleteFromR2, getKeyFromUrl } from '@/lib/r2'

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = req.nextUrl
  const carId = searchParams.get('car_id')
  const offset = parseInt(searchParams.get('offset') || '0')
  const limit = Math.min(parseInt(searchParams.get('limit') || '24'), 48)

  let query = supabaseAdmin
    .from('gallery_photos')
    .select('*')
    .order('sort_order', { ascending: true })
    .range(offset, offset + limit - 1)

  if (carId) query = query.eq('car_id', carId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ photos: data || [] })
}

export async function PUT(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { data, error } = await supabaseAdmin.from('gallery_photos').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ photo: data })
}

export async function DELETE(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const { id, url, thumb_url } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  // R2 cleanup (non-fatal)
  if (process.env.R2_PUBLIC_URL) {
    try { if (url?.startsWith(process.env.R2_PUBLIC_URL)) await deleteFromR2(getKeyFromUrl(url)) } catch (e) { console.error('R2 delete (orig) failed:', e) }
    try { if (thumb_url && thumb_url !== url && thumb_url.startsWith(process.env.R2_PUBLIC_URL)) await deleteFromR2(getKeyFromUrl(thumb_url)) } catch (e) { console.error('R2 delete (thumb) failed:', e) }
  }

  const { error } = await supabaseAdmin.from('gallery_photos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
