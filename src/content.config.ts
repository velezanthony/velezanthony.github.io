import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { collections as designCollections } from '@velezanthony/design/content';

import { projectSchema } from '@adapters/project-schema';

const projects = defineCollection({
  loader: glob({
    base: './src/content/projects',
    pattern: '**/*.md',
    /* The default drops the directory, so es/foo and en/foo would collide. */
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: projectSchema,
});

export const collections = { ...designCollections, projects };
