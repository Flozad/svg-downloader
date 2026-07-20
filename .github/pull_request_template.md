## What does this change?

<!-- A sentence or two. Link the issue it closes, if there is one. -->

## How did you verify it?

<!-- Which pages did you test against? Screenshots welcome for UI changes. -->

## Checklist

- [ ] `bun run test` passes
- [ ] `bun run lint` passes
- [ ] Tests added or updated for the behavior I changed
- [ ] No new permissions added to `manifest.json` (or explained below why one is needed)
- [ ] No untrusted SVG reaches an extension page as live markup — previews still go through `<img src="blob:…">` (see [SECURITY.md](../SECURITY.md))
