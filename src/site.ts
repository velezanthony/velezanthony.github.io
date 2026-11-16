/* No imports: `astro.config.mjs` reads this before the tsconfig aliases exist. */

export const SITE = 'https://velezanthony.github.io';
export const SITE_HOST = new URL(SITE).host;

/** This site's own repository. */
export const SITE_SOURCE = 'https://github.com/velezanthony/velezanthony.github.io';

/** The Person's `@id`. One value on every page: without it a search engine sees one person per
    page instead of one person with many mentions. */
export const PERSON_ID = new URL('/#anthony', SITE).href;
