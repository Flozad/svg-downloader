import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        url: 'http://localhost/',
      },
    },
    include: ['test/**/*.test.js'],
    coverage: {
      provider: 'v8',
      // Only the shipped extension source. `lib/` is vendored JSZip — someone
      // else's code, and instrumenting a minified bundle is pure noise.
      include: ['extension/**/*.js'],
      exclude: ['extension/lib/**'],
      reporter: ['text', 'html'],
      // A ratchet, not an aspiration: pinned just under the numbers the suite
      // actually achieves, so a coverage regression fails the build while an
      // honest refactor does not. Raise these as coverage rises; never lower
      // them to make a red build go green.
      // preview.js is the one file well below the rest (its canvas-sampling
      // dark-plate heuristic is untested), which is what holds the global
      // numbers down from the ~95% the other files reach.
      thresholds: {
        statements: 90,
        branches: 83,
        functions: 92,
        lines: 93,
      },
    },
  },
});
