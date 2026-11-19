import { createCountsCache } from './downloads';

/** The build's one cache of store counts: read by the server, pypistats included, once per project
    for every page that shows it. Never imported by browser code. */
export const buildCountsOf = createCountsCache(fetch, 'build');
