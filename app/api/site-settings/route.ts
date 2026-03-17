import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase.from('site_settings').select('*').single()
  if (error) return NextResponse.json({ settings: null })
  return NextResponse.json({ settings: data })
}
