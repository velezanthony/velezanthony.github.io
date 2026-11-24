/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

/* Through Astro's own Vite config, so the tsconfig aliases and `.astro`
   compilation resolve in tests exactly as they do in the build. */
export default getViteConfig({
  test: {
    include: ['src/**/*.test.ts', 'docs.config.test.ts', 'scripts/**/*.test.ts'],
    exclude: ['node_modules/**'],
  },
});
