import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function uploadToR2(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  await r2Client.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }))
  return `${process.env.R2_PUBLIC_URL}/${key}`
}

export async function deleteFromR2(key: string): Promise<void> {
  await r2Client.send(new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
  }))
}

export function getKeyFromUrl(url: string): string {
  const publicUrl = process.env.R2_PUBLIC_URL!
  return url.replace(`${publicUrl}/`, '')
}

/**
 * Generate a short-lived signed URL for a private/original object.
 * Use only from admin-authenticated endpoints.
 * @param key  R2 object key (e.g. "cars/xxx/123_orig.jpg")
 * @param expiresIn  seconds until expiry (default 900 = 15 minutes)
 */
export async function getOriginalSignedUrl(key: string, expiresIn = 900): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
  })
  return getSignedUrl(r2Client, command, { expiresIn })
}
