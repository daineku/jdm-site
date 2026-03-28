import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAuthed } from '@/lib/adminAuth'
import { z } from 'zod'

const SingleAssignSchema = z.object({
  car_id: z.string().uuid('Invalid car ID'),
  category_id: z.string().uuid('Invalid category ID'),
})

// GET: fetch assigned category IDs for a car
export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const carId = req.nextUrl.searchParams.get('car_id')
  if (!carId) return NextResponse.json({ error: 'car_id required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('car_build_categories')
    .select('category_id')
    .eq('car_id', carId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ categoryIds: (data || []).map((r: any) => r.category_id) })
}

// POST: add a single category assignment (idempotent)
export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let raw: unknown
  try { raw = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const result = SingleAssignSchema.safeParse(raw)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0]?.message ?? 'Invalid payload' }, { status: 400 })
  }

  const { car_id, category_id } = result.data
  const { error } = await supabaseAdmin
    .from('car_build_categories')
    .upsert({ car_id, category_id }, { onConflict: 'car_id,category_id', ignoreDuplicates: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// DELETE: remove a single category assignment
export async function DELETE(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let raw: unknown
  try { raw = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const result = SingleAssignSchema.safeParse(raw)
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0]?.message ?? 'Invalid payload' }, { status: 400 })
  }

  const { car_id, category_id } = result.data
  const { error } = await supabaseAdmin
    .from('car_build_categories')
    .delete()
    .eq('car_id', car_id)
    .eq('category_id', category_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
