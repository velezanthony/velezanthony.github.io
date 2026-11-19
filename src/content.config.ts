import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { collections as designCollections } from '@velezanthony/design/content';

import { privacySchema } from '@adapters/privacy-schema';
import { projectSchema } from '@adapters/project-schema';

const projects = defineCollection({
  loader: glob({
    base: './src/data/projects',
    pattern: '**/*.md',
    /* The default drops the directory, so es/foo and en/foo would collide. */
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: projectSchema,
});

/* One file per locale; the file name is the id (`es`, `en`). */
const privacies = defineCollection({
  loader: glob({ base: './src/data/privacies', pattern: '*.md' }),
  schema: privacySchema,
});

export const collections = { ...designCollections, projects, privacies };
