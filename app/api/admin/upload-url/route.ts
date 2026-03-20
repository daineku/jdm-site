import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { isAuthed } from '@/lib/adminAuth'

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { carId, fileName } = body
  if (!carId || !fileName) {
    return NextResponse.json({ error: 'carId and fileName are required' }, { status: 400 })
  }

  if (!process.env.R2_ACCOUNT_ID || process.env.R2_ACCOUNT_ID === 'your-account-id' ||
      !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY ||
      !process.env.R2_BUCKET_NAME || !process.env.R2_PUBLIC_URL) {
    return NextResponse.json({
      error: 'R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL in Vercel environment variables.'
    }, { status: 500 })
  }

  const timestamp = Date.now()
  // fileName is always .jpg (client converts everything to JPEG)
  const originalKey = `cars/${carId}/${timestamp}.jpg`
  const thumbKey = `cars/${carId}/${timestamp}_thumb.jpg`

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })

  try {
    const [originalUploadUrl, thumbUploadUrl] = await Promise.all([
      getSignedUrl(client, new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: originalKey,
        ContentType: 'image/jpeg',
      }), { expiresIn: 300 }),
      getSignedUrl(client, new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: thumbKey,
        ContentType: 'image/jpeg',
      }), { expiresIn: 300 }),
    ])

    return NextResponse.json({
      originalUploadUrl,
      thumbUploadUrl,
      originalPublicUrl: `${process.env.R2_PUBLIC_URL}/${originalKey}`,
      thumbPublicUrl: `${process.env.R2_PUBLIC_URL}/${thumbKey}`,
    })
  } catch (e: any) {
    return NextResponse.json({ error: `Failed to generate upload URLs: ${e.message}` }, { status: 500 })
  }
}
