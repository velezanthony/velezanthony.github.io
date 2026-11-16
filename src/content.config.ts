import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

import { projectSchema } from '@/schemas/project';

const projects = defineCollection({
  loader: glob({
    base: './src/content/projects',
    pattern: '**/*.md',
    /* The default drops the directory, so es/foo and en/foo would collide. */
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: projectSchema,
});

export const collections = { projects };
