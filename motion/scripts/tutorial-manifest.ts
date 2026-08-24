// Writes docs/motion/tutorials/manifest.json — the bridge between the Remotion
// project and the static site generator.
//
// The tutorial pages carry VideoObject structured data, which has to state a
// duration. Hand-copying that number is how schema quietly goes stale, so the
// duration is taken from the same beat list the video is rendered from and the
// page generator reads it from here. One source, two consumers.

import {mkdirSync, writeFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {TUTORIALS} from '../src/data/tutorials'
import {tutorialSeconds} from '../src/scenes/Tutorial'

const OUT = fileURLToPath(new URL('../../docs/motion/tutorials/', import.meta.url))
mkdirSync(OUT, {recursive: true})

/** Seconds → ISO 8601 duration, which is what schema.org wants. */
const iso = (s: number) => {
  const total = Math.round(s)
  const m = Math.floor(total / 60)
  const sec = total % 60
  return m > 0 ? `PT${m}M${sec}S` : `PT${sec}S`
}

const manifest = TUTORIALS.map((spec) => {
  const seconds = tutorialSeconds(spec)
  return {
    id: spec.id,
    title: spec.title,
    eyebrow: spec.eyebrow,
    seconds: Number(seconds.toFixed(2)),
    duration: iso(seconds),
    video: `/motion/tutorials/${spec.id}.mp4`,
    poster: `/motion/tutorials/${spec.id}.jpg`,
    /** The caption track, in order — the spoken shape of the recording. */
    captions: spec.beats.map((b) => b.caption).filter(Boolean),
  }
})

writeFileSync(OUT + 'manifest.json', `${JSON.stringify(manifest, null, 2)}\n`)
console.log(`Wrote manifest.json — ${manifest.length} tutorials`)
