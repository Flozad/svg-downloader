// Renders the fifteen tutorial recordings into ../../docs/motion/tutorials:
//
//   <slug>.mp4   the recording itself
//   <slug>.jpg   a poster frame, taken from the middle of the body (never the
//                title card and never the brand card — a poster showing a title
//                card tells a reader nothing they can't already read on the page)
//
// The list of tutorials comes from src/data/tutorials.ts, the same list Root.tsx
// registers compositions from, so this script can never render a video whose
// page doesn't exist or miss one that does.
//
// Pass slugs as args to render a subset:
//   bun run scripts/render-tutorials.ts copy-svg-from-website

import {existsSync, mkdirSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {$} from 'bun'
import {TUTORIALS} from '../src/data/tutorials'
import {INTRO, tutorialSeconds} from '../src/scenes/Tutorial'

// fileURLToPath, not `.pathname` — the repo lives under a directory with a space
// in its name, which a URL keeps percent-encoded.
const OUT = fileURLToPath(new URL('../../docs/motion/tutorials/', import.meta.url))
if (!existsSync(OUT)) mkdirSync(OUT, {recursive: true})

const SRC = 'src/index.ts'
const FPS = 30
const V = '--codec=h264 --crf=23 --jpeg-quality=90 --log=error'

const only = process.argv.slice(2)
const want = (id: string) => only.length === 0 || only.includes(id)

for (const spec of TUTORIALS) {
  if (!want(spec.id)) continue

  const id = `tut-${spec.id}`
  const seconds = tutorialSeconds(spec)

  // Poster: a third of the way into the body, so the popup is open and doing
  // something. Clamped inside the body so it can never land on either card.
  const poster = Math.round((INTRO + (seconds - INTRO) * 0.38) * FPS)

  console.log(`▶ poster ${spec.id} @ ${poster}`)
  await $`bunx remotion still ${SRC} ${id} ${OUT + spec.id + '.jpg'} --frame=${poster} --image-format=jpeg --jpeg-quality=92 --log=error`

  console.log(`▶ video  ${spec.id} — ${seconds.toFixed(1)}s`)
  await $`bunx remotion render ${SRC} ${id} ${OUT + spec.id + '.mp4'} ${{raw: V}}`
}

console.log(`\nDone → docs/motion/tutorials/ (${only.length || TUTORIALS.length} tutorials)`)
