import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAuthed } from '@/lib/adminAuth'
import { ModelPartAssignSchema } from '@/lib/validation/global-parts'

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const carId = req.nextUrl.searchParams.get('car_id')
  if (!carId) return NextResponse.json({ error: 'car_id required' }, { status: 400 })
  const { data, error } = await supabaseAdmin
    .from('model_parts')
    .select('part_id')
    .eq('car_id', carId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ partIds: (data || []).map((r: any) => r.part_id) })
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let raw: unknown
  try { raw = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const result = ModelPartAssignSchema.safeParse(raw)
  if (!result.success) return NextResponse.json({ error: result.error.issues[0]?.message ?? 'Invalid payload' }, { status: 400 })
  const { car_id, part_id } = result.data
  const { error } = await supabaseAdmin
    .from('model_parts')
    .upsert({ car_id, part_id }, { onConflict: 'car_id,part_id', ignoreDuplicates: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let raw: unknown
  try { raw = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const result = ModelPartAssignSchema.safeParse(raw)
  if (!result.success) return NextResponse.json({ error: result.error.issues[0]?.message ?? 'Invalid payload' }, { status: 400 })
  const { car_id, part_id } = result.data
  const { error } = await supabaseAdmin.from('model_parts').delete().eq('car_id', car_id).eq('part_id', part_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
