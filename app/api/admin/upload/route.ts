import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { uploadToR2, deleteFromR2 } from '@/lib/r2'
import { isAuthed } from '@/lib/adminAuth'

// Vercel hard limit is 4.5MB. Client compresses to max 2400px JPEG which is 0.5-3MB.
const MAX_SIZE_BYTES = 4.2 * 1024 * 1024
const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'webp']

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let formData: FormData
  try { formData = await req.formData() }
  catch { return NextResponse.json({ error: 'Failed to parse form data' }, { status: 400 }) }

  const file = formData.get('file') as File | null
  const carId = formData.get('car_id') as string | null
  const orientation = (formData.get('orientation') as string) || 'horizontal'

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!carId) return NextResponse.json({ error: 'car_id is required' }, { status: 400 })
  if (file.size === 0) return NextResponse.json({ error: 'File is empty' }, { status: 400 })

  const ext = (file.name.split('.').pop() || '').toLowerCase().replace(/[^a-z]/g, '')
  if (!ALLOWED_EXTS.includes(ext)) {
    return NextResponse.json({
      error: `Format .${ext} not accepted. Client should have converted this to JPEG before upload.`
    }, { status: 400 })
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({
      error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum is 4MB after compression. The browser should compress automatically — try again.`
    }, { status: 413 })
  }

  const { data: model } = await supabaseAdmin.from('cars').select('id').eq('id', carId).single()
  if (!model) return NextResponse.json({ error: 'Model not found' }, { status: 404 })

  let buffer: Buffer
  try { buffer = Buffer.from(await file.arrayBuffer()) }
  catch { return NextResponse.json({ error: 'Failed to read file' }, { status: 400 }) }

  // Verify R2 is configured
  if (!process.env.R2_ACCOUNT_ID || process.env.R2_ACCOUNT_ID === 'your-account-id' ||
      !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY ||
      !process.env.R2_BUCKET_NAME || !process.env.R2_PUBLIC_URL) {
    return NextResponse.json({
      error: 'R2 storage not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL in Vercel environment variables.'
    }, { status: 500 })
  }

  const ts = Date.now()
  const originalKey = `cars/${carId}/${ts}.jpg`
  const thumbKey = `cars/${carId}/${ts}_thumb.jpg`

  let originalUrl: string
  let thumbUrl: string
  let uploadedOriginalKey: string | null = null
  let uploadedThumbKey: string | null = null

  // Upload original
  try {
    originalUrl = await uploadToR2(buffer, originalKey, 'image/jpeg')
    uploadedOriginalKey = originalKey
  } catch (e: any) {
    return NextResponse.json({
      error: `R2 upload failed: ${e.message}. Check credentials and bucket name in Vercel env vars.`
    }, { status: 500 })
  }

  // Generate 800px thumbnail with sharp (non-fatal — fallback to original)
  thumbUrl = originalUrl
  try {
    const sharp = (await import('sharp')).default
    const thumbBuffer = await sharp(buffer)
      .rotate()
      .resize(800, undefined, { withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toBuffer()
    thumbUrl = await uploadToR2(thumbBuffer, thumbKey, 'image/jpeg')
    uploadedThumbKey = thumbKey
  } catch {
    // thumbnail failed — use original as thumb, continue
  }

  // Get correct sort_order for this model
  const { data: maxRows } = await supabaseAdmin
    .from('gallery_photos')
    .select('sort_order')
    .eq('car_id', carId)
    .order('sort_order', { ascending: false })
    .limit(1)
  const sortOrder = maxRows && maxRows.length > 0 ? maxRows[0].sort_order + 10 : 10

  // Save to DB — rollback R2 on failure
  const { data, error } = await supabaseAdmin.from('gallery_photos').insert({
    car_id: carId,
    url: originalUrl,
    thumb_url: thumbUrl,
    orientation,
    show_on_home: false,
    home_sort_order: 0,
    sort_order: sortOrder,
    is_visible: true,
    caption: null,
    alt_text: null,
  }).select().single()

  if (error) {
    try { if (uploadedOriginalKey) await deleteFromR2(uploadedOriginalKey) } catch {}
    try { if (uploadedThumbKey) await deleteFromR2(uploadedThumbKey) } catch {}
    return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 })
  }

  return NextResponse.json({ photo: data })
}
