import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${new URL('sitemap.xml', site)}`,
    // Not part of the robots spec: it is how a model that reads this file finds the map
    // written for it, instead of inferring the site from whatever page it landed on.
    `LLMs: ${new URL('llms.txt', site)}`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
