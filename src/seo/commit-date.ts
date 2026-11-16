import { createCommitDates } from './sitemap/lastmod';
import { git } from './sitemap/git';

/** Shared across pages, so each file is asked of git once per build. */
export const commitDate = createCommitDates(git);
