import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

/**
 * The domain has one robots.txt and it lives HERE: a GitHub Pages project site is published under a
 * path (`/snake-orm/`), so it cannot serve its own. Every sitemap on the domain is declared from
 * this file or it is not declared at all.
 *
 * The docs sites build their own sitemaps — MkDocs writes one per site — so this only points at
 * them, and it reads the list off the same collection the pages are built from: adding a project
 * with documentation declares its sitemap by itself.
 */
export const GET: APIRoute = async ({ site }) => {
  const projects = await getCollection('projects', ({ id }) => id.startsWith('en/'));

  const docs = projects
    .sort((a, b) => a.data.order - b.data.order)
    .map(({ data }) => data.links.find((l) => /github\.io/.test(l.href))?.href)
    .filter((href): href is string => Boolean(href))
    .map((href) => new URL('sitemap.xml', href).href);

  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    ...[new URL('sitemap.xml', site).href, ...docs].map((url) => `Sitemap: ${url}`),
    // Not part of the robots spec: it is how a model that reads this file finds the map
    // written for it, instead of inferring the site from whatever page it landed on.
    `LLMs: ${new URL('llms.txt', site)}`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
