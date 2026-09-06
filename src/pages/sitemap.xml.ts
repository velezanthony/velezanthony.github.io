import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

/**
 * `/sitemap.xml` — the one entry point for the whole domain.
 *
 * The portfolio is not the only site here: every project publishes its documentation to
 * `velezanthony.github.io/<project>/`, each with a sitemap MkDocs writes on its own. This indexes
 * them so a single submission covers all of them.
 *
 * The portfolio's own URLs live in `sitemap-pages.xml`, written by the sitemap integration — it is
 * the one that knows the routes, their translations and their commit dates. This file only points.
 *
 * The list of documentation sites is READ off the projects collection, never typed here: a
 * hand-kept copy stops matching the day a project is added, and an index that names a sitemap
 * nobody publishes is reported as a fetch error against this domain.
 */
export const GET: APIRoute = async ({ site }) => {
  const projects = await getCollection('projects', ({ id }) => id.startsWith('en/'));

  const docs = projects
    .sort((a, b) => a.data.order - b.data.order)
    .map(({ data }) => data.links.find((l) => /github\.io/.test(l.href))?.href)
    .filter((href): href is string => Boolean(href))
    .map((href) => new URL('sitemap.xml', href).href);

  const sitemaps = [new URL('sitemap-pages.xml', site).href, ...docs];

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<?xml-stylesheet type="text/xsl" href="sitemap-style.xml"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...sitemaps.map((loc) => `<sitemap><loc>${loc}</loc></sitemap>`),
    '</sitemapindex>',
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
