#!/usr/bin/env node
/**
 * Favicons from the genuine DAINEKU "D" mark (public/images/brand/logo-mark.png).
 *
 *   node scripts/build-favicons.mjs
 *
 * Writes the Next.js app/ icon conventions, which Next turns into <link> tags itself:
 *   app/favicon.ico     16, 32 and 48 px, transparent (PNG-compressed ICO entries)
 *   app/icon.png        512 px, transparent — application / high-DPI icon
 *   app/apple-icon.png  180 px on the studio's dark green-black, because iOS fills
 *                       transparency with black and adds its own rounded mask
 *
 * The mark is trimmed to its visible alpha, then scaled uniformly (never stretched) to fit the
 * square and centred on its bounding box. It is 1.76:1, so it sits as a wide band in the square.
 */
import sharp from 'sharp'
import { writeFile } from 'node:fs/promises'

const SRC = 'public/images/brand/logo-mark.png'
const BG = { r: 8, g: 12, b: 9, alpha: 1 } // --st-bg #080c09
const CLEAR = { r: 0, g: 0, b: 0, alpha: 0 }

const trimmed = await sharp(SRC).trim({ threshold: 1 }).png().toBuffer()
const { width: mw, height: mh } = await sharp(trimmed).metadata()

/** The mark centred in a size×size square, inset by `padRatio` of the side on every edge. */
async function square(size, padRatio, background) {
  const inner = size - 2 * Math.round(size * padRatio)
  const scale = Math.min(inner / mw, inner / mh)
  const w = Math.max(1, Math.round(mw * scale))
  const h = Math.max(1, Math.round(mh * scale))
  const mark = await sharp(trimmed).resize(w, h, { kernel: sharp.kernel.lanczos3, fit: 'fill' }).png().toBuffer()
  return sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: mark, left: Math.floor((size - w) / 2), top: Math.floor((size - h) / 2) }])
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

const icoImages = []
for (const size of [16, 32, 48]) icoImages.push({ size, data: await square(size, size <= 16 ? 0 : 0.04, CLEAR) })
await writeFile('app/favicon.ico', ico(icoImages))
await writeFile('app/icon.png', await square(512, 0.06, CLEAR))
await writeFile('app/apple-icon.png', await square(180, 0.16, BG))
console.log(`mark ${mw}×${mh} → app/favicon.ico (16/32/48), app/icon.png (512), app/apple-icon.png (180)`)
