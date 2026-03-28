/**
 * Regenerate the watermark asset: public/watermark.png
 *
 * Run from project root: node --input-type=module scripts/generate-watermark.mjs
 *
 * The output is a transparent PNG that gets composited at upload time.
 * No font rendering happens at upload time — this script runs once locally
 * (or in CI) and the resulting PNG is committed to the repository.
 *
 * Style target: matches site header wordmark (Manrope 800, letterSpacing 0.15em)
 * using Liberation Sans Bold as the closest available server-side font.
 *
 * To adjust: change W, fontSize, letterSpacing, colors, or shadow offset below.
 */
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outPath = path.join(__dirname, '..', 'public', 'watermark.png')

const W = 1600
const H = 140
const fontSize = 68
const letterSpacing = Math.round(fontSize * 0.15)  // 0.15em matches header

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <!-- Dark drop-shadow — baked in for readability on light backgrounds -->
  <text x="${W / 2 + 3}" y="90"
    text-anchor="middle" dominant-baseline="auto"
    font-family="Liberation Sans, FreeSans, DejaVu Sans, sans-serif"
    font-size="${fontSize}px" font-weight="700"
    fill="black" opacity="0.65" letter-spacing="${letterSpacing}">DAINEKU.COM</text>
  <!-- White foreground text -->
  <text x="${W / 2}" y="87"
    text-anchor="middle" dominant-baseline="auto"
    font-family="Liberation Sans, FreeSans, DejaVu Sans, sans-serif"
    font-size="${fontSize}px" font-weight="700"
    fill="white" opacity="1.0" letter-spacing="${letterSpacing}">DAINEKU.COM</text>
</svg>`

const png = await sharp(Buffer.from(svg)).png().toBuffer()
const raw = await sharp(png).raw().toBuffer()
const visible = Array.from({length: raw.length/4}, (_,i) => raw[i*4+3]).filter(a => a > 10).length

fs.writeFileSync(outPath, png)
console.log(`Written: ${outPath}`)
console.log(`Dimensions: ${W}x${H}, visible pixels: ${visible}`)
console.log('Commit public/watermark.png to apply the change.')
