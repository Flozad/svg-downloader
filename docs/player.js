// Two jobs, both gated on the viewport, both respecting reduced-motion.
//
//   1. Clips play only while they're on screen — nothing decodes off-screen, and
//      the page never has more than a couple of videos running at once. A clip
//      carrying data-poster gets its poster fetched a screen early instead of at
//      load, so the initial page pulls one poster rather than five.
//   2. Sections marked .reveal rise as they enter, once.
//
// External + deferred so the site's CSP needs no 'unsafe-inline'.

(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

  // ── Deferred posters ─────────────────────────────────────────────────────
  // A poster is fetched eagerly even under preload="none", so the below-the-fold
  // clips park theirs in data-poster and claim it a screenful ahead of arrival.
  const deferred = document.querySelectorAll('video[data-poster]')
  const claim = (v) => {
    if (!v.dataset.poster) return
    v.poster = v.dataset.poster
    delete v.dataset.poster
  }
  if (!('IntersectionObserver' in window)) {
    deferred.forEach(claim)
  } else {
    const posters = new IntersectionObserver(
      (entries, obs) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          claim(e.target)
          obs.unobserve(e.target)
        }
      },
      {rootMargin: '100% 0px'},
    )
    deferred.forEach((v) => posters.observe(v))
  }

  // ── Clips ────────────────────────────────────────────────────────────────
  const videos = document.querySelectorAll('video')
  if (reduced) {
    // Give the user real controls instead of silent autoplay they can't stop.
    videos.forEach((v) => {
      claim(v)
      v.removeAttribute('loop')
      v.controls = true
      v.preload = 'metadata'
    })
  } else {
    const play = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const v = e.target
          if (e.isIntersecting) {
            if (v.preload !== 'auto') v.preload = 'auto'
            v.play().catch(() => {})
          } else {
            v.pause()
          }
        }
      },
      {threshold: 0.35},
    )
    videos.forEach((v) => play.observe(v))
  }

  // ── Reveals ──────────────────────────────────────────────────────────────
  const reveals = document.querySelectorAll('.reveal')
  if (reduced || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('in'))
  } else {
    const show = new IntersectionObserver(
      (entries, obs) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            obs.unobserve(e.target)
          }
        }
      },
      {threshold: 0.12, rootMargin: '0px 0px -8% 0px'},
    )
    reveals.forEach((el) => show.observe(el))
  }
})()
