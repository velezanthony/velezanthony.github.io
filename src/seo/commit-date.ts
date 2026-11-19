import { createCommitDates } from './lastmod';
import { git } from './git';

/** Shared across pages, so each file is asked of git once per build. */
export const commitDate = createCommitDates(git);
