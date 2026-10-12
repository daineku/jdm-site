#!/usr/bin/env node
/**
 * Project artwork → web masters for next/image.
 *
 *   node scripts/prepare-project-media.mjs <source-image> [--out public/images/projects] [--name thekanjo-hero]
 *
 * Produces, from one high-resolution source:
 *   <name>.jpg          desktop master — the full composition, 2592 px wide (2× the 1296 px content
 *                       column, the largest size any layout requests), JPEG q94 with 4:4:4 chroma
 *   <name>-mobile.jpg   portrait-leaning crop (5:4) around the subject for phones, 1560 px wide
 *                       (4× a 390 px viewport is never needed; 3× is 1170 — this leaves headroom)
 *   <name>.json         what was generated and from which source (dimensions, sha256)
 *
 * Why JPEG 4:4:4 and not WebP: the masters are read by Next's image optimizer, which re-encodes
 * them (AVIF/WebP) per requested width. Lossy WebP is always 4:2:0 chroma, and red tail lamps on
 * near-black are exactly where subsampling shows, so the master keeps full chroma and only the
 * final delivered file is subsampled once (AVIF is 4:4:4; WebP falls back to 4:2:0).
 *
 * No sharpening, no auto levels, Lanczos3 resize — night frames band and ring under both.
 * The source is never committed; it lives in the project that owns the artwork.
 */
import sharp from 'sharp'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const args = process.argv.slice(2)
const source = args.find(a => !a.startsWith('--'))
if (!source) {
  console.error('usage: node scripts/prepare-project-media.mjs <source-image> [--out dir] [--name base] [--mobile-focus 0.68] [--mobile-aspect 1.25]')
  process.exit(1)
}
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d }
const out = opt('out', 'public/images/projects')
const name = opt('name', 'thekanjo-hero')
const DESKTOP_WIDTH = Number(opt('desktop-width', 2592))
const MOBILE_WIDTH = Number(opt('mobile-width', 1560))
const MOBILE_ASPECT = Number(opt('mobile-aspect', 1.25)) // width / height
const MOBILE_FOCUS = Number(opt('mobile-focus', 0.68))   // horizontal centre of the subject, 0..1
const JPEG = { quality: 94, chromaSubsampling: '4:4:4', mozjpeg: true, progressive: true }

await mkdir(out, { recursive: true })
const input = await readFile(source)
const meta = await sharp(input).metadata()
if (!meta.width || !meta.height) throw new Error('could not read source dimensions')
const sha256 = createHash('sha256').update(input).digest('hex')
console.log(`source ${path.basename(source)}: ${meta.width}×${meta.height} ${meta.format}, sha256 ${sha256.slice(0, 12)}…`)

const resize = (w) => ({ width: w, kernel: sharp.kernel.lanczos3, withoutEnlargement: true })

// Desktop: the whole approved composition, never re-cut.
const desktopPath = path.join(out, `${name}.jpg`)
const desktop = await sharp(input).resize(resize(DESKTOP_WIDTH)).jpeg(JPEG).toFile(desktopPath)
console.log(`desktop  ${desktop.width}×${desktop.height}  ${(desktop.size / 1024).toFixed(0)} KB  → ${desktopPath}`)

// Mobile: full source height, a window of width = height × aspect centred on the subject.
const cropW = Math.min(meta.width, Math.round(meta.height * MOBILE_ASPECT))
const left = Math.max(0, Math.min(meta.width - cropW, Math.round(meta.width * MOBILE_FOCUS - cropW / 2)))
const mobilePath = path.join(out, `${name}-mobile.jpg`)
const mobile = await sharp(input).extract({ left, top: 0, width: cropW, height: meta.height }).resize(resize(MOBILE_WIDTH)).jpeg(JPEG).toFile(mobilePath)
console.log(`mobile   ${mobile.width}×${mobile.height}  ${(mobile.size / 1024).toFixed(0)} KB  (source window x ${left}–${left + cropW}) → ${mobilePath}`)

await writeFile(path.join(out, `${name}.json`), JSON.stringify({
  source: { file: path.basename(source), width: meta.width, height: meta.height, sha256 },
  generated: new Date().toISOString().slice(0, 10),
  desktop: { file: path.basename(desktopPath), width: desktop.width, height: desktop.height, bytes: desktop.size },
  mobile: { file: path.basename(mobilePath), width: mobile.width, height: mobile.height, bytes: mobile.size, sourceWindow: { left, top: 0, width: cropW, height: meta.height } },
  encoding: JPEG,
}, null, 2) + '\n')
