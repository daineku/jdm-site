import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data } = await supabase
    .from('brands')
    .select('*')
    .eq('is_visible', true)
    .order('sort_order')
    .order('name')
  return NextResponse.json({ brands: data || [] })
}
