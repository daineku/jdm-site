import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAuthed } from '@/lib/adminAuth'

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const carId = req.nextUrl.searchParams.get('car_id')
  if (!carId) return NextResponse.json({ error: 'car_id required' }, { status: 400 })
  const { data, error } = await supabaseAdmin.from('builds').select('*, build_parts(*)').eq('car_id', carId).order('sort_order')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ builds: data })
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { build_parts, ...buildData } = body
  const { data: build, error } = await supabaseAdmin.from('builds').insert(buildData).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (build_parts && build_parts.length > 0) {
    const parts = build_parts.map((p: any, i: number) => ({ build_id: build.id, name: p.name, notes: p.notes || null, sort_order: i }))
    await supabaseAdmin.from('build_parts').insert(parts)
  }
  return NextResponse.json({ build })
}

export async function PUT(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { id, build_parts, ...updates } = body
  const { data, error } = await supabaseAdmin.from('builds').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (build_parts !== undefined) {
    await supabaseAdmin.from('build_parts').delete().eq('build_id', id)
    if (build_parts.length > 0) {
      const parts = build_parts.map((p: any, i: number) => ({ build_id: id, name: p.name, notes: p.notes || null, sort_order: i }))
      await supabaseAdmin.from('build_parts').insert(parts)
    }
  }
  return NextResponse.json({ build: data })
}

export async function DELETE(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  const { error } = await supabaseAdmin.from('builds').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
