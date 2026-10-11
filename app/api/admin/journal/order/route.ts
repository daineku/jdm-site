import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAuthed } from '@/lib/adminAuth'
import { TABLE } from '@/lib/journal'
import { ArticleOrderSchema } from '@/lib/validation/journal'

// Featured order: body { ids } in display order; each article's sort_order becomes its index.
export async function PUT(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let raw: unknown
  try { raw = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const parsed = ArticleOrderSchema.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid order' }, { status: 400 })

  const ids = [...new Set(parsed.data.ids)]
  for (const [i, id] of ids.entries()) {
    const { error } = await supabaseAdmin.from(TABLE).update({ sort_order: i }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
