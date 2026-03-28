import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Fail-fast: if service role key is missing, admin writes would silently use
// the anon key, which lacks write permissions. Crash early rather than fail silently.
if (typeof window === 'undefined' && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('[supabase] SUPABASE_SERVICE_ROLE_KEY is not set — admin writes will use anon key (read-only). Set this env var in production.')
}
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey

// Public client — for frontend reads
export const supabase = createClient(supabaseUrl, supabaseKey)

// Server/admin client — bypasses RLS for writes
export const supabaseAdmin = createClient(supabaseUrl, serviceKey)

// Re-export types for backward compatibility
export type { Model as Car, GalleryPhoto, Build, Accessory, Video, RacingGame, SiteSettings, Brand, ModelBlock } from './types'
