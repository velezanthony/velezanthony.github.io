import { execFileSync } from 'node:child_process';

import type { Git } from './lastmod';

/** The real git, quiet on stderr: a missing repository is an answer here, not an error. */
export const git: Git = (args) =>
  execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
