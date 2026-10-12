/**
 * Invariants of the projects data model (lib/projects.ts). Static image imports are mocked
 * out here because Node cannot import image files; everything else is the real module.
 * Run: npm run test:projects
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { register } from 'node:module'
import { pathToFileURL } from 'node:url'

// Resolve "@/…" to the repo root and turn image imports into StaticImageData-shaped objects.
register('data:text/javascript,' + encodeURIComponent(`
  export async function resolve(specifier, context, next) {
    if (/\\.(jpe?g|png|webp|avif)$/i.test(specifier)) return { url: 'image:' + specifier, shortCircuit: true }
    if (specifier.startsWith('@/')) return next(new URL(specifier.slice(2), ${JSON.stringify(pathToFileURL(process.cwd() + '/').href)}).href, context)
    return next(specifier, context)
  }
  export async function load(url, context, next) {
    if (url.startsWith('image:')) {
      const name = url.slice(6).split('/').pop()
      // Real pixel sizes of the committed masters, so the dimension checks below mean something.
      const dims = name.includes('mobile') ? [1560, 1248] : [2592, 1100]
      return { format: 'module', shortCircuit: true, source: 'export default ' + JSON.stringify({ src: '/images/projects/' + name, width: dims[0], height: dims[1] }) }
    }
    return next(url, context)
  }
`))

const projects = await import('./projects.ts')
const { PROJECTS, getFeaturedProject, getOtherProjects, getVisibleProjects, getProject, PROJECT_INDEX, KANJO_URL } = projects

test('exactly one visible featured project; the grid is empty while only it exists', () => {
  const featured = getFeaturedProject()
  assert.ok(featured)
  assert.equal(featured.slug, 'thekanjo')
  assert.equal(getVisibleProjects().filter(p => p.featured).length, 1)
  assert.deepEqual(getOtherProjects(), [])
})

test('slugs are unique, url-safe and resolvable; hidden projects are not resolvable', () => {
  const slugs = PROJECTS.map(p => p.slug)
  assert.equal(new Set(slugs).size, slugs.length)
  for (const s of slugs) assert.match(s, /^[a-z0-9]+(-[a-z0-9]+)*$/)
  for (const p of PROJECTS) assert.equal(getProject(p.slug)?.visible === true, p.visible)
  assert.equal(getProject('nope'), null)
  assert.deepEqual(PROJECT_INDEX.map(p => p.slug), slugs)
})

test('every visible project has real copy, a sharp enough cover and a single status label', () => {
  for (const p of getVisibleProjects()) {
    assert.ok(p.title.trim() && p.tagline.trim() && p.summary.length > 0 && p.summary.every(s => s.trim()))
    assert.ok(p.disciplines.length > 0)
    assert.ok(p.statusLabel.trim())
    assert.ok(p.cover.alt.length > 20, 'cover alt text describes the image')
    // 2× the 1296 px content column is the largest size the layout ever requests.
    assert.ok(p.cover.desktop.width >= 2592, `${p.slug} desktop cover is ${p.cover.desktop.width}px wide`)
    if (p.cover.mobile) assert.ok(p.cover.mobile.width >= 1170, 'mobile cover covers a 390 px phone at 3×')
    assert.ok(p.highlights.length === 0 || p.highlights.length === 4, 'four highlights fill the 2 × 2 grid')
    for (const h of p.highlights) assert.ok(!/in progress|implemented/i.test(h.body), 'no per-system status labels')
    if (p.link?.external) assert.match(p.link.href, /^https:\/\//)
  }
})

test('The Kanjo links to its verified public site', () => {
  assert.equal(KANJO_URL, 'https://www.thekanjo.com/')
  assert.equal(getFeaturedProject()?.link?.href, KANJO_URL)
})
