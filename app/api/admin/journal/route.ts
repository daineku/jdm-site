import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'
import { isAuthed } from '@/lib/adminAuth'
import { JOURNAL_TAG, TABLE } from '@/lib/journal'
import {
  ArticleCreateSchema,
  ArticleDeleteSchema,
  ArticleUpdateSchema,
  publicationProblem,
} from '@/lib/validation/journal'

// Studio Journal — admin CRUD. Same auth as every other admin route (x-admin-secret);
// writes use the service-role client, which is server-only. Every successful write purges the
// journal data cache (lib/journal.ts), so the homepage, /journal, /journal/[slug], the feed and
// the sitemap reflect it on their next request.

const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })

function dbError(error: { code?: string; message: string }, slug?: string) {
  if (error.code === '23505') return bad(`The slug "${slug}" is already used by another article.`, 409)
  if (error.code === '42P01' || error.code === 'PGRST205') return bad('The studio_articles table does not exist yet — apply supabase/migration_v10a_studio_articles.sql.', 503)
  if (error.code === '23514') return bad('The database rejected the article (a field is too long or malformed).', 400)
  return bad(error.message, 500)
}

async function readJson(req: NextRequest): Promise<unknown | undefined> {
  try { return await req.json() } catch { return undefined }
}

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return unauthorized()
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select('*')
    .order('is_featured', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('updated_at', { ascending: false })
  if (error) return dbError(error)
  return NextResponse.json({ articles: data ?? [] })
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return unauthorized()
  const raw = await readJson(req)
  if (raw === undefined) return bad('Invalid JSON')
  const parsed = ArticleCreateSchema.safeParse(raw)
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? 'Invalid article')

  const article = { ...parsed.data }
  const problem = publicationProblem(article)
  if (problem) return bad(problem, 422)
  if (article.is_published && !article.published_at) article.published_at = new Date().toISOString()

  const { data, error } = await supabaseAdmin.from(TABLE).insert(article).select().single()
  if (error) return dbError(error, article.slug)
  revalidateTag(JOURNAL_TAG)
  return NextResponse.json({ article: data }, { status: 201 })
}

export async function PUT(req: NextRequest) {
  if (!isAuthed(req)) return unauthorized()
  const raw = await readJson(req)
  if (raw === undefined) return bad('Invalid JSON')
  const parsed = ArticleUpdateSchema.safeParse(raw)
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? 'Invalid article')

  const { id, ...updates } = parsed.data
  const { data: current, error: readError } = await supabaseAdmin.from(TABLE).select('*').eq('id', id).maybeSingle()
  if (readError) return dbError(readError)
  if (!current) return bad('Article not found', 404)

  const merged = { ...current, ...updates }
  const problem = publicationProblem(merged)
  if (problem) return bad(problem, 422)
  // First publication stamps the date; unpublishing keeps it so a re-publish keeps its original date.
  if (merged.is_published && !merged.published_at) updates.published_at = new Date().toISOString()

  const { data, error } = await supabaseAdmin.from(TABLE).update(updates).eq('id', id).select().single()
  if (error) return dbError(error, updates.slug)
  revalidateTag(JOURNAL_TAG)
  return NextResponse.json({ article: data })
}

export async function DELETE(req: NextRequest) {
  if (!isAuthed(req)) return unauthorized()
  const raw = await readJson(req)
  if (raw === undefined) return bad('Invalid JSON')
  const parsed = ArticleDeleteSchema.safeParse(raw)
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? 'Invalid request')

  const { data, error } = await supabaseAdmin.from(TABLE).delete().eq('id', parsed.data.id).select('slug')
  if (error) return dbError(error)
  if (!data?.length) return bad('Article not found', 404)
  revalidateTag(JOURNAL_TAG)
  return NextResponse.json({ success: true })
}
