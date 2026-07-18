// Renders every asset the marketing site needs, all from the Remotion project —
// "everything is Remotion". Output lands in ../docs/motion.
//
//   hero.mp4          the full 24s promo (the main video)
//   hero.jpg          a poster frame for it
//   poster-*.jpg      poster frames for the clips (named by frame number)
//   clip-detect.mp4   open + detect beat            (frames 100-212)
//   clip-page.mp4     page-through beat             (frames 208-386)
//   clip-download.mp4 download-one beat             (frames 376-488)
//   clip-zip.mp4      download-all-as-zip beat      (frames 484-572)
//   shot-01..05.png   the five step stills
//   shot-brand.png    the closing brand still
//
// Run:  bun run scripts/render-site.ts

import {existsSync, mkdirSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {$} from 'bun'

const OUT = fileURLToPath(new URL('../../docs/motion/', import.meta.url))
if (!existsSync(OUT)) mkdirSync(OUT, {recursive: true})

const SRC = 'src/index.ts'
const V = '--codec=h264 --crf=23 --jpeg-quality=90 --log=error'

// Stills first — cheap, and a safety net if the videos choke.
const STILLS: [string, string][] = [
  ['shot-01', '01-find.png'],
  ['shot-02', '02-preview.png'],
  ['shot-03', '03-page.png'],
  ['shot-04', '04-download.png'],
  ['shot-05', '05-zip.png'],
  ['shot-brand', '06-brand.png'],
]
for (const [id, file] of STILLS) {
  console.log(`▶ still ${id} → ${file}`)
  await $`bunx remotion still ${SRC} ${id} ${OUT + file} --image-format=png --log=error`
}

// Focused loop clips — frame ranges of the one promo composition.
const CLIPS: [string, string][] = [
  ['100-212', 'clip-detect.mp4'],
  ['208-386', 'clip-page.mp4'],
  ['376-488', 'clip-download.mp4'],
  ['484-572', 'clip-zip.mp4'],
]
for (const [range, file] of CLIPS) {
  console.log(`▶ clip ${range} → ${file}`)
  await $`bunx remotion render ${SRC} promo ${OUT + file} --frames=${range} ${{raw: V}}`
}

// Poster frames: one for the hero, one per clip (the frame each clip's page
// <video> shows before it plays — keep these in sync with the clip ranges).
const POSTERS: [number, string][] = [
  [300, 'hero.jpg'],
  [150, 'poster-150.jpg'],
  [430, 'poster-430.jpg'],
  [520, 'poster-520.jpg'],
]
for (const [frame, file] of POSTERS) {
  console.log(`▶ poster ${frame} → ${file}`)
  await $`bunx remotion still ${SRC} promo ${OUT + file} --frame=${frame} --image-format=jpeg --jpeg-quality=92 --log=error`
}

// The main video, last (slowest).
console.log('▶ video promo → hero.mp4')
await $`bunx remotion render ${SRC} promo ${OUT + 'hero.mp4'} ${{raw: V}}`

console.log('Done → docs/motion/')
