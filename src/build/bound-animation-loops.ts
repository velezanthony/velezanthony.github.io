import { globSync, readFileSync, writeFileSync } from 'node:fs';

import type { AstroIntegration } from 'astro';

/** Offset of the loop count inside the RIFF `ANIM` chunk: tag, size, background colour. */
const LOOP_COUNT = 12;

/**
 * Rewrites an infinite WebP animation to play once, in place. True when it changed anything.
 * Zero is "forever"; any other count already stops, and a still image has no `ANIM` chunk.
 */
export function boundLoop(buf: Buffer): boolean {
  const at = buf.indexOf('ANIM');
  if (at === -1 || buf.readUInt16LE(at + LOOP_COUNT) !== 0) return false;
  buf.writeUInt16LE(1, at + LOOP_COUNT);
  return true;
}

/* Sharp drops the source GIF's loop count and re-encodes every animated WebP as infinite. A
   demo that never stops is motion the visitor cannot escape (WCAG 2.2.2), so the loop field is
   rewritten to one pass once the assets are on disk. No checksum to invalidate. */
export function boundAnimationLoops(): AstroIntegration {
  return {
    name: 'bound-animation-loops',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        let patched = 0;
        for (const file of globSync('**/*.webp', { cwd: dir })) {
          const path = new URL(file, dir);
          const buf = readFileSync(path);
          if (!boundLoop(buf)) continue;
          writeFileSync(path, buf);
          patched++;
        }
        if (patched) logger.info(`bounded ${patched} looping animation(s)`);
      },
    },
  };
}
