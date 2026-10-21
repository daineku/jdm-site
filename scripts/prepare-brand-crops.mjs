// Cuts the two capability-card details out of the studio key visual (public/images/brand/hero.png)
// as their own files. The cards used to show these regions by scaling the whole 1672 px hero
// inside a 4:5 frame, which made the browser download the full hero a second and third time at
// other candidate widths (a measured 96–114 KB per card on top of the LCP image). Each region is
// only 432 px wide in the source, so a file holding just that region is the same pixels at a
// fraction of the bytes. Re-run after replacing hero.png: `npm run media:brand`.
//
// Regions are in source pixels and must match the frame's aspect ratio (4:5), see StudioServices.
import sharp from 'sharp'
import { statSync } from 'node:fs'

const SRC = 'public/images/brand/hero.png'
const REGIONS = {
  urban: { left: 990, top: 0, width: 432, height: 540 },
  frame: { left: 1200, top: 400, width: 433, height: 541 },
}

for (const [name, region] of Object.entries(REGIONS)) {
  const out = `public/images/brand/hero-crop-${name}.jpg`
  // Same master settings as the project artwork (scripts/prepare-project-media.mjs): q94, 4:4:4.
  await sharp(SRC).extract(region).jpeg({ quality: 94, chromaSubsampling: '4:4:4', mozjpeg: true }).toFile(out)
  const { width, height } = await sharp(out).metadata()
  console.log(`${out}: ${width}×${height}, ${Math.round(statSync(out).size / 1024)} KB`)
}
