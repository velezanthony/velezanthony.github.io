import type { APIRoute } from 'astro';

/**
 * The domain has one robots.txt and it lives HERE: a GitHub Pages project site is published under
 * a path (`/snake-orm/`), so it cannot serve its own.
 *
 * One `Sitemap:` line is enough because `/sitemap.xml` is an index: it already names the
 * documentation sitemap of every project.
 */
export const GET: APIRoute = ({ site }) => {
  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${new URL('sitemap.xml', site)}`,
    // Commented out: no `LLMs:` directive exists, and llms.txt is found by path anyway.
    `# LLMs: ${new URL('llms.txt', site)}`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
