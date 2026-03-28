import { NextRequest, NextResponse } from 'next/server'
import { isAuthed } from '@/lib/adminAuth'

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  return NextResponse.json({
    r2: {
      account_id: process.env.R2_ACCOUNT_ID ? '✓ set' : '✗ missing',
      access_key: process.env.R2_ACCESS_KEY_ID ? '✓ set' : '✗ missing',
      secret_key: process.env.R2_SECRET_ACCESS_KEY ? '✓ set' : '✗ missing',
      bucket: process.env.R2_BUCKET_NAME || '✗ missing',
      public_url: process.env.R2_PUBLIC_URL || '✗ missing',
    },
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ set' : '✗ missing',
      anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ set' : '✗ missing',
      service_role: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ set' : '✗ missing',
    },
    admin_path: process.env.ADMIN_SECRET_PATH ? '✓ set' : '✗ missing',
  })
}
