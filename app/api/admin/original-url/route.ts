import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getOriginalSignedUrl } from '@/lib/r2'
import { isAuthed } from '@/lib/adminAuth'

/**
 * Admin-only: returns a short-lived signed URL for a photo's clean original.
 * original_url in DB stores the R2 key, not a public URL.
 * Signed URL expires in 15 minutes.
 *
 * GET /api/admin/original-url?photo_id=<uuid>
 */
export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const photoId = req.nextUrl.searchParams.get('photo_id')
  if (!photoId) return NextResponse.json({ error: 'photo_id required' }, { status: 400 })

  const { data: photo, error } = await supabaseAdmin
    .from('gallery_photos')
    .select('id, url, original_url')
    .eq('id', photoId)
    .single()

  if (error || !photo) return NextResponse.json({ error: 'Photo not found' }, { status: 404 })

  // original_url is an R2 key for new uploads, null for legacy rows
  if (!photo.original_url) {
    // Legacy record: fall back to the public url (already accessible)
    return NextResponse.json({ signedUrl: photo.url, isLegacy: true })
  }

  try {
    const signedUrl = await getOriginalSignedUrl(photo.original_url, 900) // 15 min
    return NextResponse.json({ signedUrl, isLegacy: false })
  } catch (e: any) {
    // If signing fails, fall back to public url rather than erroring out
    console.error('[original-url] Signing failed:', e.message)
    return NextResponse.json({ signedUrl: photo.url, isLegacy: true })
  }
}
