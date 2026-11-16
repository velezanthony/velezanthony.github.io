import { globSync, readFileSync, rmSync, statSync } from 'node:fs';

import type { AstroIntegration } from 'astro';

/** The assets whose file name appears nowhere in the built text. */
export function orphanAssets(files: string[], text: string): string[] {
  return files.filter((file) => {
    const name = file.split('/').pop();
    return name !== undefined && !text.includes(name);
  });
}

/* A content-collection image referenced from both a `<Image>` and a Markdown body gets its
   ORIGINAL copied into `_astro/` alongside the derivatives, even though nothing links to it.
   Every built text file is scanned before anything is removed, so an asset reached only from
   CSS or a script survives. */
export function pruneOrphanAssets(): AstroIntegration {
  return {
    name: 'prune-orphan-assets',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        const text = globSync('**/*.{html,css,js,xml,txt,json}', { cwd: dir })
          .map((file) => readFileSync(new URL(file, dir), 'utf8'))
          .join('\n');
        const assets = globSync('_astro/*.{png,jpg,jpeg,webp,avif,gif,svg}', { cwd: dir });

        let freed = 0;
        for (const file of orphanAssets(assets, text)) {
          const path = new URL(file, dir);
          freed += statSync(path).size;
          rmSync(path);
        }
        if (freed) logger.info(`pruned ${Math.round(freed / 1024)} KB of unreferenced assets`);
      },
    },
  };
}
