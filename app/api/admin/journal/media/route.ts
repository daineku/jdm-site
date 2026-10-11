import { NextRequest, NextResponse } from 'next/server'
import { ListObjectsV2Command } from '@aws-sdk/client-s3'
import { r2Client } from '@/lib/r2'
import { isAuthed } from '@/lib/adminAuth'

// Journal media library: images previously uploaded for articles (R2 prefix "journal/"),
// newest first, so a cover can be re-used instead of uploaded again.
export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const bucket = process.env.R2_BUCKET_NAME
  const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/+$/, '')
  if (!bucket || !publicUrl || !process.env.R2_ACCOUNT_ID) {
    return NextResponse.json({ error: 'R2 storage not configured.' }, { status: 500 })
  }
  try {
    const out = await r2Client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: 'journal/', MaxKeys: 200 }))
    const images = (out.Contents ?? [])
      .filter(o => o.Key && /\.(jpe?g|png|webp)$/i.test(o.Key))
      .sort((a, b) => (b.LastModified?.getTime() ?? 0) - (a.LastModified?.getTime() ?? 0))
      .map(o => ({ url: `${publicUrl}/${o.Key}`, uploadedAt: o.LastModified?.toISOString() ?? null }))
    return NextResponse.json({ images })
  } catch (e) {
    return NextResponse.json({ error: `Could not list media: ${e instanceof Error ? e.message : String(e)}` }, { status: 502 })
  }
}
