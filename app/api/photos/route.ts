import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Public columns — original_url is intentionally excluded (admin-only via signed URL)
const PUBLIC_SELECT =
  'id, car_id, url, thumb_url, orientation, sort_order, home_sort_order, show_on_home, is_visible, caption, alt_text, width, height, created_at, car:cars(id,title,slug,brand,brand_id)'

const PUBLIC_SELECT_INNER =
  'id, car_id, url, thumb_url, orientation, sort_order, home_sort_order, show_on_home, is_visible, caption, alt_text, width, height, created_at, car:cars!inner(id,title,slug,brand,brand_id)'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const offset = parseInt(searchParams.get('offset') || '0')
  const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 48)
  const brand = searchParams.get('brand')

  let query = supabase
    .from('gallery_photos')
    .select(PUBLIC_SELECT)
    .eq('show_on_home', true)
    .eq('is_visible', true)
    .order('home_sort_order', { ascending: true })
    .range(offset, offset + limit - 1)

  if (brand) {
    // Get brand id first
    const { data: brandData } = await supabase
      .from('brands')
      .select('id')
      .eq('slug', brand)
      .single()
    if (brandData) {
      // filter by brand via car join
      query = supabase
        .from('gallery_photos')
        .select(PUBLIC_SELECT_INNER)
        .eq('show_on_home', true)
        .eq('is_visible', true)
        .eq('car.brand_id', brandData.id)
        .order('home_sort_order', { ascending: true })
        .range(offset, offset + limit - 1)
    }
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ photos: data || [] })
}
