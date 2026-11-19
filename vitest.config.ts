/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

/* Through Astro's own Vite config, so the `@/*` alias and `.astro`
   compilation resolve in tests exactly as they do in the build. */
export default getViteConfig({
  test: {
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules/**'],
  },
});
