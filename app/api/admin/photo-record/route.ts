import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAuthed } from '@/lib/adminAuth'

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { carId, originalUrl, thumbUrl, orientation, caption, altText } = body
  if (!carId || !originalUrl) return NextResponse.json({ error: 'carId and originalUrl are required' }, { status: 400 })

  const { data: model } = await supabaseAdmin.from('cars').select('id').eq('id', carId).single()
  if (!model) return NextResponse.json({ error: 'Model not found' }, { status: 404 })

  // Get max sort_order for this model's photos — use limit(1) not single() to avoid error when empty
  const { data: maxRows } = await supabaseAdmin
    .from('gallery_photos')
    .select('sort_order')
    .eq('car_id', carId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const maxOrder = maxRows && maxRows.length > 0 ? maxRows[0].sort_order : 0
  const sortOrder = maxOrder + 10

  const { data, error } = await supabaseAdmin.from('gallery_photos').insert({
    car_id: carId,
    url: originalUrl,
    thumb_url: thumbUrl || originalUrl,
    orientation: orientation || 'horizontal',
    show_on_home: false,
    home_sort_order: 0,
    sort_order: sortOrder,
    is_visible: true,
    caption: caption || null,
    alt_text: altText || null,
  }).select().single()

  if (error) return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 })
  return NextResponse.json({ photo: data })
}
