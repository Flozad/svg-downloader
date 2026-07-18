// Renders every Chrome Web Store asset into ../store-assets:
//
//   promo.mp4                    the promo video
//   01..05-*.png                 screenshots, 1280×800
//   promo-tile-440x280.png       the small promo tile
//   marquee-tile-1400x560.png    the marquee promo tile
//
// Screenshots and tiles are `remotion still` (one frame); the promo is a
// `remotion render`. Pass ids as args to render a subset, e.g.
//   bun run scripts/render-all.ts promo
//   bun run scripts/render-all.ts shot-01 shot-02

import {existsSync, mkdirSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {$} from 'bun'

// fileURLToPath, not `.pathname` — the repo lives under a directory with a space
// in its name, which a URL keeps percent-encoded.
const OUT = fileURLToPath(new URL('../../store-assets/', import.meta.url))
if (!existsSync(OUT)) mkdirSync(OUT, {recursive: true})

type Still = {id: string; file: string}

const STILLS: Still[] = [
  {id: 'shot-01', file: '01-find-every-svg.png'},
  {id: 'shot-02', file: '02-preview-each.png'},
  {id: 'shot-03', file: '03-page-through.png'},
  {id: 'shot-04', file: '04-download-current.png'},
  {id: 'shot-05', file: '05-download-all-zip.png'},
  {id: 'shot-brand', file: '06-brand.png'},
  {id: 'promo-tile', file: 'promo-tile-440x280.png'},
  {id: 'marquee-tile', file: 'marquee-tile-1400x560.png'},
]

const only = process.argv.slice(2)
const want = (id: string) => only.length === 0 || only.includes(id)

for (const s of STILLS) {
  if (!want(s.id)) continue
  console.log(`\n▶ still ${s.id} → ${s.file}`)
  await $`bunx remotion still src/index.ts ${s.id} ${OUT + s.file} --image-format=png --log=error`
  console.log(`✓ ${s.file}`)
}

if (want('promo')) {
  console.log(`\n▶ video promo → promo.mp4`)
  await $`bunx remotion render src/index.ts promo ${OUT + 'promo.mp4'} \
    --codec=h264 --crf=23 --jpeg-quality=90 --log=error`
  console.log(`✓ promo.mp4`)
}

console.log(`\nDone → store-assets/`)
