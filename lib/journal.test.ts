/**
 * Unit tests for Journal article validation (admin API) and slug suggestion.
 * Run: npm run test:journal   (Node's built-in test runner; Node strips the TS types)
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ArticleCreateSchema, ArticleOrderSchema, ArticleUpdateSchema, articleSlug, publicationProblem, slugify } from './validation/journal.ts'

test('slugify turns a title into a valid slug', () => {
  assert.equal(slugify('Building a Night Expressway'), 'building-a-night-expressway')
  assert.equal(slugify('  Light & Materials: Part 2!  '), 'light-and-materials-part-2')
  assert.equal(slugify('Café Racer'), 'cafe-racer')
  assert.equal(slugify('x'.repeat(300)).length, 120)
  assert.ok(articleSlug.safeParse(slugify('— Traffic —  systems —')).success)
})

test('slug rules: lowercase words joined by single hyphens, max 120', () => {
  for (const ok of ['a', 'night-lighting', 'v2-traffic-notes']) assert.ok(articleSlug.safeParse(ok).success, ok)
  for (const bad of ['', 'Upper', 'two  words', '-lead', 'trail-', 'double--hyphen', 'ünïcode', 'a/b', 'x'.repeat(121)]) {
    assert.ok(!articleSlug.safeParse(bad).success, bad)
  }
})

test('create applies safe defaults and rejects unknown fields', () => {
  const r = ArticleCreateSchema.safeParse({ title: 'T', slug: 't' })
  assert.ok(r.success)
  assert.equal(r.data.is_published, false)
  assert.equal(r.data.cover_image_url, null)
  assert.ok(!ArticleCreateSchema.safeParse({ title: 'T', slug: 't', is_admin: true }).success)
  assert.ok(!ArticleCreateSchema.safeParse({ title: ' ', slug: 't' }).success)
  assert.ok(!ArticleCreateSchema.safeParse({ title: 'T', slug: 't', excerpt: 'x'.repeat(401) }).success)
})

test('cover images must come from the media origin (HTTPS when it is not configured)', () => {
  delete process.env.R2_PUBLIC_URL
  assert.ok(ArticleCreateSchema.safeParse({ title: 'T', slug: 't', cover_image_url: 'https://media.example/journal/1.jpg' }).success)
  assert.ok(!ArticleCreateSchema.safeParse({ title: 'T', slug: 't', cover_image_url: 'http://media.example/1.jpg' }).success)
  assert.ok(!ArticleCreateSchema.safeParse({ title: 'T', slug: 't', cover_image_url: 'javascript:alert(1)' }).success)
  process.env.R2_PUBLIC_URL = 'https://media.daineku.example/'
  assert.ok(ArticleCreateSchema.safeParse({ title: 'T', slug: 't', cover_image_url: 'https://media.daineku.example/journal/1.jpg' }).success)
  assert.ok(!ArticleCreateSchema.safeParse({ title: 'T', slug: 't', cover_image_url: 'https://elsewhere.example/1.jpg' }).success)
  assert.ok(!ArticleCreateSchema.safeParse({ title: 'T', slug: 't', cover_image_url: 'https://media.daineku.example.evil.com/1.jpg' }).success)
  delete process.env.R2_PUBLIC_URL
})

test('publishing needs an excerpt and a body; a cover needs alt text', () => {
  assert.equal(publicationProblem({ title: 'T', is_published: false }), null)
  assert.match(publicationProblem({ title: 'T', is_published: true, body: 'b' })!, /excerpt/i)
  assert.match(publicationProblem({ title: 'T', is_published: true, excerpt: 'e', body: '  ' })!, /body/i)
  assert.match(publicationProblem({ title: 'T', cover_image_url: 'https://x/y.jpg', cover_alt: '' })!, /alt text/i)
  assert.equal(publicationProblem({ title: 'T', is_published: true, excerpt: 'e', body: 'b', cover_image_url: 'https://x/y.jpg', cover_alt: 'A car' }), null)
})

test('update needs a valid id; order needs uuids', () => {
  assert.ok(!ArticleUpdateSchema.safeParse({ id: 'nope', title: 'T' }).success)
  assert.ok(ArticleUpdateSchema.safeParse({ id: '6f1c7a52-3b0e-4f4e-9d38-2b6f7c3f1a10', title: 'T' }).success)
  assert.ok(!ArticleOrderSchema.safeParse({ ids: [] }).success)
  assert.ok(!ArticleOrderSchema.safeParse({ ids: ['1'] }).success)
})
