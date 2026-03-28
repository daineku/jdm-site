import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAuthed } from '@/lib/adminAuth'
import { CarFitmentUpsertSchema } from '@/lib/validation/fitment'

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const carId = req.nextUrl.searchParams.get('car_id')
  if (!carId) return NextResponse.json({ error: 'car_id required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('car_fitment')
    .select('*')
    .eq('car_id', carId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ fitment: data ?? null })
}

export async function PUT(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let raw: unknown
  try { raw = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const result = CarFitmentUpsertSchema.safeParse(raw)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0]?.message ?? 'Invalid payload' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('car_fitment')
    .upsert({ ...result.data, updated_at: new Date().toISOString() }, { onConflict: 'car_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ fitment: data })
}
