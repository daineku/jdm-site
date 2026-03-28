import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { uploadToR2, deleteFromR2 } from '@/lib/r2'
import { isAuthed } from '@/lib/adminAuth'

// Vercel hard limit is 4.5MB. Client compresses before upload.
const MAX_SIZE_BYTES = 4.2 * 1024 * 1024
const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'webp']

// Watermark PNG inlined as base64 — loaded at module init, no filesystem access.
// This eliminates the ENOENT error in Vercel serverless where public/ is not
// included in the function bundle. The constant is compiled into the JS module.
const WATERMARK_PNG_B64 =
  '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'

const WATERMARK_PNG = Buffer.from(WATERMARK_PNG_B64, 'base64')

/**
 * Apply the pre-rendered watermark PNG onto an image buffer.
 *
 * The watermark PNG is inlined as a base64 constant above. It is compiled
 * into the JS bundle at build time, so no filesystem access is needed at
 * runtime. This fixes the ENOENT error that occurred in Vercel serverless
 * functions where process.cwd()/public/ is not part of the function bundle.
 *
 * Scaling: watermark is resized to 42% of the target image width and placed
 * at left=10%, top=14% — upper third, slightly left of center.
 * Opacity: applied by scaling the PNG alpha channel to 45%.
 */
async function applyWatermark(sharp: any, inputBuffer: Buffer): Promise<Buffer> {
  const meta = await sharp(inputBuffer).metadata()
  const w = meta.width  || 1200
  const h = meta.height || 800

  // Scale: 0.42 * 1.75 = 0.735 of image width. No height constraint.
  const targetW = Math.round(w * 0.20)
  const wmScaled = await sharp(WATERMARK_PNG)
    .resize(targetW, null, { withoutEnlargement: false })
    .png()
    .toBuffer()

  const wmMeta = await sharp(wmScaled).metadata()
  const wmH = wmMeta.height || 40

  // Single shared edge offset: top === left, exactly.
  const edgeOffset = Math.max(14, Math.round(h * 0.025))
  const topOffset  = edgeOffset
  const leftOffset = edgeOffset

  // Opacity: 0.263 * 0.80 = 0.210 — softer, still readable.
  const rawWm = await sharp(wmScaled).raw().ensureAlpha().toBuffer()
  const opacity = 0.210
  for (let i = 3; i < rawWm.length; i += 4) {
    rawWm[i] = Math.round(rawWm[i] * opacity)
  }
  const wmWithOpacity = await sharp(rawWm, { raw: { width: targetW, height: wmH, channels: 4 } })
    .png()
    .toBuffer()

  return sharp(inputBuffer)
    .composite([{ input: wmWithOpacity, left: leftOffset, top: topOffset, blend: 'over' }])
    .jpeg({ quality: 88, progressive: true })
    .toBuffer()
}

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
      error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum is 4MB after compression.`
    }, { status: 413 })
  }

  const { data: model } = await supabaseAdmin.from('cars').select('id').eq('id', carId).single()
  if (!model) return NextResponse.json({ error: 'Model not found' }, { status: 404 })

  let rawBuffer: Buffer
  try { rawBuffer = Buffer.from(await file.arrayBuffer()) }
  catch { return NextResponse.json({ error: 'Failed to read file' }, { status: 400 }) }

  if (!process.env.R2_ACCOUNT_ID || process.env.R2_ACCOUNT_ID === 'your-account-id' ||
      !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY ||
      !process.env.R2_BUCKET_NAME || !process.env.R2_PUBLIC_URL) {
    return NextResponse.json({ error: 'R2 storage not configured.' }, { status: 500 })
  }

  const ts = Date.now()
  // Key naming: deterministic prefixes per image role
  const originalKey  = `cars/${carId}/${ts}_orig.jpg`     // clean original — admin only
  const publicKey    = `cars/${carId}/${ts}_pub.jpg`      // watermarked — public lightbox
  const thumbKey     = `cars/${carId}/${ts}_thumb.jpg`    // clean thumbnail — grids/previews

  let uploadedKeys: string[] = []

  try {
    const sharp = (await import('sharp')).default

    // 1. ORIGINAL — orient, strip metadata, no resize, no watermark
    const originalBuffer = await sharp(rawBuffer)
      .rotate()          // normalize EXIF orientation
      .jpeg({ quality: 92, progressive: true })
      .toBuffer()

    const originalUrl = await uploadToR2(originalBuffer, originalKey, 'image/jpeg')
    uploadedKeys.push(originalKey)
    // Store the R2 key, not the public URL — originals are admin-only, served via signed URL

    // 2. PUBLIC LIGHTBOX — watermarked, same dimensions as original
    // This step MUST succeed. There is no silent fallback to a clean image.
    // If watermarking fails for any reason, the entire upload is rolled back and
    // a 500 is returned. A clean image must never silently land in `url`.
    console.log('[upload] Starting watermark step for', publicKey)
    let publicUrl: string
    let watermarkedBuffer: Buffer
    try {
      watermarkedBuffer = await applyWatermark(sharp, originalBuffer)
      console.log('[upload] Watermark buffer created, size:', watermarkedBuffer.length)
    } catch (wmErr: any) {
      console.error('[upload] applyWatermark FAILED — rolling back. Error:', wmErr?.message ?? wmErr)
      for (const key of uploadedKeys) { try { await deleteFromR2(key) } catch {} }
      return NextResponse.json({
        error: `Watermark generation failed: ${wmErr?.message ?? 'unknown error'}. Upload rolled back.`
      }, { status: 500 })
    }
    try {
      publicUrl = await uploadToR2(watermarkedBuffer, publicKey, 'image/jpeg')
      uploadedKeys.push(publicKey)
      console.log('[upload] Watermarked file uploaded to', publicKey)
    } catch (upErr: any) {
      console.error('[upload] Watermarked upload FAILED — rolling back. Error:', upErr?.message ?? upErr)
      for (const key of uploadedKeys) { try { await deleteFromR2(key) } catch {} }
      return NextResponse.json({
        error: `Watermarked image upload failed: ${upErr?.message ?? 'unknown error'}. Upload rolled back.`
      }, { status: 500 })
    }

    // 3. THUMBNAIL — clean, 800px wide max.
    // Fallback to originalUrl (clean) if thumb generation fails — never to publicUrl.
    let thumbUrl = originalUrl
    try {
      const thumbBuffer = await sharp(originalBuffer)
        .resize(800, undefined, { withoutEnlargement: true })
        .jpeg({ quality: 80, progressive: true })
        .toBuffer()
      thumbUrl = await uploadToR2(thumbBuffer, thumbKey, 'image/jpeg')
      uploadedKeys.push(thumbKey)
    } catch {
      // Thumbnail failed — fall back to originalUrl (clean original), not publicUrl
    }

    // Get sort_order
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
      url: publicUrl,           // watermarked — public lightbox
      thumb_url: thumbUrl,      // clean thumbnail
      original_url: originalKey, // R2 key only — served via admin-only signed URL endpoint
      orientation,
      show_on_home: false,
      home_sort_order: 0,
      sort_order: sortOrder,
      is_visible: true,
      caption: null,
      alt_text: null,
    }).select().single()

    if (error) {
      // Rollback all uploaded R2 files
      for (const key of uploadedKeys) {
        try { await deleteFromR2(key) } catch {}
      }
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ photo: data })

  } catch (e: any) {
    // Rollback any partially uploaded files
    for (const key of uploadedKeys) {
      try { await deleteFromR2(key) } catch {}
    }
    return NextResponse.json({ error: `Processing failed: ${e.message}` }, { status: 500 })
  }
}
