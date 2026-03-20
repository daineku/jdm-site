import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAuthed } from '@/lib/adminAuth'

// GET /api/admin/car-fitment?car_id=xxx
export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const carId = req.nextUrl.searchParams.get('car_id')
  if (!carId) return NextResponse.json({ error: 'car_id is required' }, { status: 400 })
  const { data, error } = await supabaseAdmin
    .from('car_fitment')
    .select('*')
    .eq('car_id', carId)
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ fitment: data })
}

// PUT /api/admin/car-fitment — upsert fitment for a car (admin always upserts by car_id)
export async function PUT(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  if (!body.car_id) return NextResponse.json({ error: 'car_id is required' }, { status: 400 })

  const payload = {
    car_id: body.car_id,
    fitment_style: body.fitment_style || null,
    ride_height: body.ride_height || null,
    camber_look: body.camber_look || null,
    best_wheel_style: body.best_wheel_style || null,
    best_diameter: body.best_diameter || null,
    observed_rim_guess: body.observed_rim_guess || null,
    popular_rim_option_1: body.popular_rim_option_1 || null,
    popular_rim_option_2: body.popular_rim_option_2 || null,
    summary: body.summary || null,
    is_visible: body.is_visible !== false,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabaseAdmin
    .from('car_fitment')
    .upsert(payload, { onConflict: 'car_id' })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ fitment: data })
}
