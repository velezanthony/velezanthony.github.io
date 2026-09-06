import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

/**
 * `/llms.txt` — a curated map of this site for language models.
 *
 * It is GENERATED from the same collection the pages are built from, not written by hand: a
 * hand-kept copy would stop matching the site the day a project is added, and a map that lies is
 * worse than no map. Adding a project updates this file by itself.
 *
 * English only, and on purpose: the file is read by a model, not by a visitor, so the Spanish twin
 * would be the same facts twice. Each entry names the Spanish route anyway.
 */
export const GET: APIRoute = async ({ site }) => {
  const url = (path: string) => new URL(path, site).href;

  const entries = await getCollection('projects', ({ id }) => id.startsWith('en/'));
  const projects = entries.sort((a, b) => a.data.order - b.data.order);

  const lines: string[] = [
    '# Anthony Velez Tapia',
    '',
    '> Backend developer. Open source tools for Django, Python and Docker. This file lists every',
    '> page of the portfolio and, for each project, where its code, its package and its',
    '> documentation live.',
    '',
    '## Projects',
    '',
  ];

  for (const { data } of projects) {
    const link = (re: RegExp) => data.links.find((l) => re.test(l.href))?.href;
    const facts = [
      `write-up: ${url(`en/projects/${data.slug}/`)} (es: ${url(`proyectos/${data.slug}/`)})`,
      `code: ${link(/github\.com/) ?? 'not public'}`,
      `package: ${link(/pypi\.org|marketplace\.visualstudio\.com|npmjs\.com/) ?? 'not published'}`,
      `docs: ${link(/github\.io/) ?? 'none'}`,
      `status: ${data.status}`,
    ];
    lines.push(`- [${data.name}](${url(`en/projects/${data.slug}/`)}): ${data.tagline}`);
    for (const fact of facts) lines.push(`  - ${fact}`);
    lines.push('');
  }

  lines.push(
    '## Pages',
    '',
    `- [Home](${url('en/')}): who I am and the selected work (es: ${url('/')})`,
    `- [Projects](${url('en/projects/')}): every project (es: ${url('proyectos/')})`,
    `- [Experience](${url('en/experience/')}): roles and what was built (es: ${url('experiencia/')})`,
    `- [CV](${url('en/cv/')}): printable résumé (es: ${url('cv/')})`,
    '',
  );

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
