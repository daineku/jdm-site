/**
 * Local stand-in for Supabase (PostgREST) and Cloudflare R2 (S3), used only by the smoke
 * suite. The app is pointed at it through SUPABASE_URL_OVERRIDE / R2_ENDPOINT /
 * R2_PUBLIC_URL. It never talks to the real services.
 *
 *   /rest/v1/studio_articles  — the subset of PostgREST that supabase-js uses for the Journal:
 *                               select / eq / lte / order / limit, insert, update, delete,
 *                               Prefer: return=representation, single-object Accept.
 *                               Emulates the migration's access model: the anon key sees only
 *                               published rows and cannot write; the service key can do anything.
 *                               Unique slug → 409 23505, like Postgres.
 *   /rest/v1/<other table>    — 404 PGRST205, i.e. "no legacy data" (same as no Supabase at all).
 *   /s3/<bucket>/<key>        — PutObject; GET /s3/<bucket>?list-type=2&prefix= — ListObjectsV2.
 *   /media/<key>              — the bucket's public origin (serves uploaded files).
 *   /__health
 *
 * Proves the app's own code paths; the real SQL/RLS is verified separately by
 * scripts/verify-db-security.sh on PostgreSQL.
 */
import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'

const PORT = Number(process.env.MOCK_BACKEND_PORT || 3498)
const SERVICE_KEY = process.env.MOCK_SERVICE_KEY || 'smoke-service-key'
const articles = []
const objects = new Map() // key -> { body, type, modified }

const DEFAULTS = { excerpt: '', body: '', category: '', cover_image_url: null, cover_alt: '', is_published: false, is_featured: false, sort_order: 0, published_at: null }
const isPublic = a => a.is_published && a.published_at && Date.parse(a.published_at) <= Date.now()

function json(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...headers })
  res.end(body === undefined ? '' : JSON.stringify(body))
}

function readBody(req) {
  return new Promise(resolve => {
    const chunks = []
    req.on('data', c => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks)))
  })
}

/** PostgREST horizontal filters: col=op.value (eq, neq, lt, lte, gt, gte, in). */
function applyFilters(rows, params) {
  const cmp = (a, b) => {
    const da = Date.parse(a), db = Date.parse(b)
    if (typeof a === 'string' && !Number.isNaN(da) && !Number.isNaN(db) && /\d{4}-\d{2}-\d{2}T/.test(a)) return da - db
    if (typeof a === 'number') return a - Number(b)
    return String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0
  }
  for (const [col, raw] of params) {
    if (['select', 'order', 'limit', 'offset', 'on_conflict', 'columns'].includes(col)) continue
    const dot = raw.indexOf('.')
    const op = raw.slice(0, dot), v = raw.slice(dot + 1)
    rows = rows.filter(r => {
      const x = r[col]
      switch (op) {
        case 'eq': return String(x) === v
        case 'neq': return String(x) !== v
        case 'lt': return x != null && cmp(x, v) < 0
        case 'lte': return x != null && cmp(x, v) <= 0
        case 'gt': return x != null && cmp(x, v) > 0
        case 'gte': return x != null && cmp(x, v) >= 0
        case 'in': return v.replace(/^\(|\)$/g, '').split(',').includes(String(x))
        default: return true
      }
    })
  }
  return rows
}

function shape(rows, params) {
  const order = params.get('order')
  if (order) {
    const keys = order.split(',').map(k => { const [c, d] = k.split('.'); return { c, desc: d === 'desc' } })
    rows = [...rows].sort((a, b) => {
      for (const { c, desc } of keys) {
        const x = a[c], y = b[c]
        if (x === y) continue
        const r = x == null ? 1 : y == null ? -1 : x < y ? -1 : 1
        return desc ? -r : r
      }
      return 0
    })
  }
  const limit = params.get('limit')
  if (limit) rows = rows.slice(0, Number(limit))
  const select = params.get('select')
  if (select && select !== '*') {
    const cols = select.split(',').map(s => s.trim())
    rows = rows.map(r => Object.fromEntries(cols.map(c => [c, r[c]])))
  }
  return rows
}

function reply(req, res, status, rows) {
  const single = (req.headers.accept || '').includes('vnd.pgrst.object')
  if (single) {
    if (rows.length !== 1) return json(res, 406, { code: 'PGRST116', message: `JSON object requested, multiple (or no) rows returned`, details: `The result contains ${rows.length} rows` })
    return json(res, status, rows[0])
  }
  return json(res, status, rows)
}

function validate(row) {
  if (articles.some(a => a.slug === row.slug && a.id !== row.id)) return { status: 409, code: '23505', message: 'duplicate key value violates unique constraint "studio_articles_slug_key"' }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(row.slug || '')) return { status: 400, code: '23514', message: 'new row violates check constraint "studio_articles_slug_format"' }
  if (row.is_published && !row.published_at) return { status: 400, code: '23514', message: 'new row violates check constraint "studio_articles_published_date"' }
  return null
}

async function rest(req, res, url) {
  const table = url.pathname.slice('/rest/v1/'.length)
  if (table !== 'studio_articles') return json(res, 404, { code: 'PGRST205', message: `Could not find the table 'public.${table}' in the schema cache` })
  const service = req.headers.apikey === SERVICE_KEY
  const params = url.searchParams
  const wantRows = (req.headers.prefer || '').includes('return=representation')

  if (req.method === 'GET' || req.method === 'HEAD') {
    const visible = service ? articles : articles.filter(isPublic)
    return reply(req, res, 200, shape(applyFilters(visible, params), params))
  }
  if (!service) return json(res, 401, { code: '42501', message: 'permission denied for table studio_articles' })

  if (req.method === 'POST') {
    const input = JSON.parse((await readBody(req)).toString() || '{}')
    const now = new Date().toISOString()
    const created = []
    for (const item of Array.isArray(input) ? input : [input]) {
      const row = { id: randomUUID(), ...DEFAULTS, ...item, created_at: now, updated_at: now }
      const problem = validate(row)
      if (problem) return json(res, problem.status, { code: problem.code, message: problem.message })
      articles.push(row); created.push(row)
    }
    return wantRows ? reply(req, res, 201, shape(created, params)) : json(res, 201)
  }
  if (req.method === 'PATCH') {
    const patch = JSON.parse((await readBody(req)).toString() || '{}')
    const targets = applyFilters(articles, params)
    for (const t of targets) {
      const next = { ...t, ...patch, id: t.id, updated_at: new Date().toISOString() }
      const problem = validate(next)
      if (problem) return json(res, problem.status, { code: problem.code, message: problem.message })
      Object.assign(t, next)
    }
    return wantRows ? reply(req, res, 200, shape(targets, params)) : json(res, 204)
  }
  if (req.method === 'DELETE') {
    const targets = applyFilters(articles, params)
    for (const t of targets) articles.splice(articles.indexOf(t), 1)
    return wantRows ? reply(req, res, 200, shape(targets, params)) : json(res, 204)
  }
  json(res, 405, { message: 'method not allowed' })
}

function xml(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;') }

async function s3(req, res, url) {
  const [, , bucket, ...rest] = url.pathname.split('/')
  const key = decodeURIComponent(rest.join('/'))
  if (req.method === 'PUT' && key) {
    objects.set(key, { body: await readBody(req), type: req.headers['content-type'] || 'application/octet-stream', modified: new Date() })
    res.writeHead(200, { ETag: '"mock"' }); return res.end()
  }
  if (req.method === 'GET' && !key && url.searchParams.get('list-type') === '2') {
    const prefix = url.searchParams.get('prefix') || ''
    const items = [...objects.entries()].filter(([k]) => k.startsWith(prefix))
    const contents = items.map(([k, o]) => `<Contents><Key>${xml(k)}</Key><LastModified>${o.modified.toISOString()}</LastModified><Size>${o.body.length}</Size><StorageClass>STANDARD</StorageClass></Contents>`).join('')
    res.writeHead(200, { 'Content-Type': 'application/xml' })
    return res.end(`<?xml version="1.0" encoding="UTF-8"?><ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><Name>${xml(bucket)}</Name><Prefix>${xml(prefix)}</Prefix><KeyCount>${items.length}</KeyCount><MaxKeys>1000</MaxKeys><IsTruncated>false</IsTruncated>${contents}</ListBucketResult>`)
  }
  if (req.method === 'DELETE' && key) { objects.delete(key); res.writeHead(204); return res.end() }
  res.writeHead(400); res.end()
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://127.0.0.1:${PORT}`)
    if (url.pathname === '/__health') return json(res, 200, { ok: true })
    if (url.pathname.startsWith('/rest/v1/')) return await rest(req, res, url)
    if (url.pathname.startsWith('/s3/')) return await s3(req, res, url)
    if (url.pathname.startsWith('/media/')) {
      const o = objects.get(decodeURIComponent(url.pathname.slice('/media/'.length)))
      if (!o) { res.writeHead(404); return res.end() }
      res.writeHead(200, { 'Content-Type': o.type, 'Cache-Control': 'no-store' }); return res.end(o.body)
    }
    json(res, 404, { message: 'not found' })
  } catch (e) {
    json(res, 500, { message: String(e) })
  }
}).listen(PORT, '127.0.0.1')
