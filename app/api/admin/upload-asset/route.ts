import { NextRequest, NextResponse } from 'next/server'
import { uploadToR2 } from '@/lib/r2'
import { isAuthed } from '@/lib/adminAuth'

// Generic asset upload — clean, optimized, no watermark.
// Used for: category images, settings images, build/part/cover images.
// Gallery photos use /api/admin/upload (3-output pipeline with watermark).

const MAX_SIZE_BYTES = 4.2 * 1024 * 1024
const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'webp']

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let formData: FormData
  try { formData = await req.formData() }
  catch { return NextResponse.json({ error: 'Failed to parse form data' }, { status: 400 }) }

  const file = formData.get('file') as File | null
  const type = (formData.get('type') as string | null) || 'assets'

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (file.size === 0) return NextResponse.json({ error: 'File is empty' }, { status: 400 })

  const ext = (file.name.split('.').pop() || '').toLowerCase().replace(/[^a-z]/g, '')
  if (!ALLOWED_EXTS.includes(ext)) {
    return NextResponse.json({ error: `Format .${ext} not accepted. Use JPEG, PNG, or WebP.` }, { status: 400 })
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 4MB.` }, { status: 413 })
  }

  if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID ||
      !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET_NAME || !process.env.R2_PUBLIC_URL) {
    return NextResponse.json({ error: 'R2 storage not configured.' }, { status: 500 })
  }

  let rawBuffer: Buffer
  try { rawBuffer = Buffer.from(await file.arrayBuffer()) }
  catch { return NextResponse.json({ error: 'Failed to read file' }, { status: 400 }) }

  const ts = Date.now()
  const key = `${type}/${ts}.jpg`

  try {
    // Optimize with sharp: orient, compress for web, no watermark, preserve dimensions
    const sharp = (await import('sharp')).default
    const optimized = await sharp(rawBuffer)
      .rotate()   // normalize EXIF orientation
      .jpeg({ quality: 88, progressive: true })
      .toBuffer()

    const url = await uploadToR2(optimized, key, 'image/jpeg')
    return NextResponse.json({ url })
  } catch {
    // sharp failed — fall back to raw upload (non-fatal, keep pipeline stable)
    try {
      const url = await uploadToR2(rawBuffer, key, 'image/jpeg')
      return NextResponse.json({ url })
    } catch (e: any) {
      return NextResponse.json({ error: `Upload failed: ${e.message}` }, { status: 500 })
    }
  }
}
