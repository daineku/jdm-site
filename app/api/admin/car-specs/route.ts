import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAuthed } from '@/lib/adminAuth'

// GET /api/admin/car-specs?car_id=xxx
export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const carId = req.nextUrl.searchParams.get('car_id')
  if (!carId) return NextResponse.json({ error: 'car_id is required' }, { status: 400 })
  const { data, error } = await supabaseAdmin
    .from('car_specs')
    .select('*')
    .eq('car_id', carId)
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ specs: data })
}

// PUT /api/admin/car-specs — upsert specs for a car (upserts by car_id)
export async function PUT(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  if (!body.car_id) return NextResponse.json({ error: 'car_id is required' }, { status: 400 })

  const payload = {
    car_id: body.car_id,
    wheel_size_oem: body.wheel_size_oem || null,
    wheel_size_aftermarket: body.wheel_size_aftermarket || null,
    wheel_diameter_oem: body.wheel_diameter_oem || null,
    wheel_diameter_aftermarket: body.wheel_diameter_aftermarket || null,
    tire_size_oem: body.tire_size_oem || null,
    tire_size_aftermarket: body.tire_size_aftermarket || null,
    offset_oem: body.offset_oem || null,
    offset_aftermarket: body.offset_aftermarket || null,
    notes: body.notes || null,
    is_visible: body.is_visible !== false,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabaseAdmin
    .from('car_specs')
    .upsert(payload, { onConflict: 'car_id' })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ specs: data })
}
