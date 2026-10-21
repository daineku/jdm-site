#!/usr/bin/env node
/**
 * Favicons from the genuine DAINEKU "D" mark (public/images/brand/logo-mark.png).
 *
 *   npm run icons                              # writes into app/
 *   node scripts/build-favicons.mjs <outDir>   # writes somewhere else, for comparison
 *
 * Writes the Next.js app/ icon conventions, which Next turns into <link> tags itself:
 *   app/favicon.ico     16, 32 and 48 px (PNG-compressed ICO entries)
 *   app/icon1.png       16 px
 *   app/icon2.png       32 px
 *   app/icon.png        512 px — application / high-DPI icon
 *   app/apple-icon.png  180 px, full-bleed, because iOS applies its own rounded mask
 *
 * ── WHY THE MARK SITS ON A TILE ──────────────────────────────────────────────
 *
 * The mark is a white "D" with a thin dark-green keyline, and it is 1.76:1. The first
 * version scaled it onto a TRANSPARENT square, which left a wide white band about half the
 * square's height: at 16 px a 7-pixel sliver whose only edge is a one-pixel green line. On
 * a light browser tab (Chrome #f1f3f4, Safari white) the white fill vanishes into the tab
 * and the icon reads as a faint outline, if at all.
 *
 * So every icon now carries the mark on the studio's own near-black (--st-bg #080c09), the
 * ground the apple-icon already used. White on near-black holds at 16 px on light and dark
 * tabs alike. The mark itself is unchanged — trimmed to its visible alpha, scaled uniformly
 * (never stretched), centred on its bounding box — and gets nearly the full width of the
 * tile, with a small inset so it never touches the edge.
 */
import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const SRC = 'public/images/brand/logo-mark.png'
const OUT = process.argv[2] ?? 'app'
const BG = { r: 8, g: 12, b: 9, alpha: 1 } // --st-bg #080c09

const trimmed = await sharp(SRC).trim({ threshold: 1 }).png().toBuffer()
const { width: mw, height: mh } = await sharp(trimmed).metadata()

/**
 * The mark centred on a size×size tile.
 *
 * `inset` is the gap in pixels between the mark and the tile's left and right edges.
 * `radius` rounds the tile's corners as a fraction of its side; 0 is a full-bleed square.
 */
async function tile(size, inset, radius) {
  const inner = size - 2 * inset
  const scale = Math.min(inner / mw, inner / mh)
  const w = Math.max(1, Math.round(mw * scale))
  const h = Math.max(1, Math.round(mh * scale))
  const mark = await sharp(trimmed).resize(w, h, { kernel: sharp.kernel.lanczos3, fit: 'fill' }).png().toBuffer()

  let ground = await sharp({ create: { width: size, height: size, channels: 4, background: BG } }).png().toBuffer()
  if (radius > 0) {
    // Corners are cut with an alpha mask so they stay transparent on any tab colour.
    const r = Math.round(size * radius)
    const mask = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" ry="${r}"/></svg>`,
    )
    ground = await sharp(ground).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer()
  }
  return sharp(ground)
    .composite([{ input: mark, left: Math.round((size - w) / 2), top: Math.round((size - h) / 2) }])
    .png({ compressionLevel: 9 })
    .toBuffer()
}

/** ICO container with PNG payloads (supported by every current browser and Windows Vista+). */
function ico(images) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(images.length, 4)
  const entries = []
  let offset = 6 + 16 * images.length
  for (const { size, data } of images) {
    const e = Buffer.alloc(16)
    e.writeUInt8(size >= 256 ? 0 : size, 0)
    e.writeUInt8(size >= 256 ? 0 : size, 1)
    e.writeUInt8(0, 2) // palette
    e.writeUInt8(0, 3)
    e.writeUInt16LE(1, 4) // colour planes
    e.writeUInt16LE(32, 6) // bits per pixel
    e.writeUInt32LE(data.length, 8)
    e.writeUInt32LE(offset, 12)
    offset += data.length
    entries.push(e)
  }
  return Buffer.concat([header, ...entries, ...images.map(i => i.data)])
}

// Inset (px) and corner radius per small size. The inset stays at one to three pixels so the
// mark gets every pixel of width it can; the radius is modest so the tile still reads as a
// square at 16 px rather than a blob.
const SMALL = { 16: [1, 0.19], 32: [2, 0.19], 48: [3, 0.19] }

const icoImages = []
for (const size of [16, 32, 48]) icoImages.push({ size, data: await tile(size, ...SMALL[size]) })

await mkdir(OUT, { recursive: true })
await writeFile(path.join(OUT, 'favicon.ico'), ico(icoImages))
await writeFile(path.join(OUT, 'icon1.png'), icoImages[0].data)
await writeFile(path.join(OUT, 'icon2.png'), icoImages[1].data)
await writeFile(path.join(OUT, 'icon.png'), await tile(512, 40, 0.19))
await writeFile(path.join(OUT, 'apple-icon.png'), await tile(180, 22, 0))
console.log(
  `mark ${mw}×${mh} → ${OUT}/favicon.ico (16/32/48), icon1.png (16), icon2.png (32), icon.png (512), apple-icon.png (180)`,
)
