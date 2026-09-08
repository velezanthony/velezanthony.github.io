import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { profile, spokenLanguages, stackGroups, contact } from '@data/profile';
import { experience } from '@data/experience';
import { path } from '@i18n/utils';

/** The CV renders `**bold**`; a model reading plain text only sees the asterisks. */
const plain = (text: string) => text.replaceAll('**', '');

/** `2025-10` with no end reads as the current role. */
const period = (start: string, end: string | null) => `${start} → ${end ?? 'present'}`;

/**
 * `/llms.txt` — a curated map of this site for language models.
 *
 * It is GENERATED from the same data and route map the pages are built from, not written by hand:
 * a hand-kept copy would stop matching the site the day a project is added or a route renamed, and
 * a map that lies is worse than no map.
 *
 * English only, and on purpose: the file is read by a model, not by a visitor, so the Spanish twin
 * would be the same facts twice. Each entry names the Spanish route anyway.
 */
export const GET: APIRoute = async ({ site }) => {
  /** Every route comes from `path()`, so renaming a segment moves this map with the site. */
  const url = (route: string) => new URL(route, site).href;
  const both = (route: (lang: 'es' | 'en') => string) => `${url(route('en'))} (es: ${url(route('es'))})`;

  const entries = await getCollection('projects', ({ id }) => id.startsWith('en/'));
  const projects = entries.sort((a, b) => a.data.order - b.data.order);

  const lines: string[] = [
    `# ${profile.name}`,
    '',
    `> ${plain(profile.headline.en)}`,
    '>',
    '> This file lists every page of the portfolio and, for each project, where its code, its',
    '> package and its documentation live.',
    '',
    '## Profile',
    '',
    `- location: ${profile.location}, Spain — ${profile.availability.en.replaceAll(' · ', ', ')}`,
    `- languages: ${spokenLanguages.map((l) => l.name.en).join(', ')}`,
    ...stackGroups.map((group) => `- ${group.label.en.toLowerCase()}: ${group.items}`),
    ...contact.map((link) => `- ${link.label.toLowerCase()}: ${link.handle}`),
    '',
    '## Experience',
    '',
  ];

  for (const job of experience) {
    const where = job.location ? `, ${job.location.en}` : '';
    lines.push(`### ${job.role.en} — ${job.company} (${period(job.start, job.end)}${where})`, '');
    for (const highlight of job.highlights.en) lines.push(`- ${plain(highlight)}`);
    lines.push(`- stack: ${job.stack.join(', ')}`, '');
  }

  lines.push('## Projects', '');

  for (const { data } of projects) {
    const link = (re: RegExp) => data.links.find((l) => re.test(l.href))?.href;
    const facts = [
      `write-up: ${both((lang) => path(lang, 'projects', data.slug))}`,
      `code: ${link(/github\.com/) ?? 'not public'}`,
      `package: ${link(/pypi\.org|marketplace\.visualstudio\.com|npmjs\.com/) ?? 'not published'}`,
      `docs: ${link(/github\.io/) ?? 'none'}`,
      `status: ${data.status}`,
    ];
    lines.push(`- [${data.name}](${url(path('en', 'projects', data.slug))}): ${data.tagline}`);
    for (const fact of facts) lines.push(`  - ${fact}`);
    lines.push('');
  }

  lines.push(
    '## Pages',
    '',
    `- Home: ${both((lang) => path(lang))} — who I am and the selected work`,
    `- Projects: ${both((lang) => path(lang, 'projects'))} — every project`,
    `- Experience: ${both((lang) => path(lang, 'experience'))} — roles and what was built`,
    `- CV: ${both((lang) => path(lang, 'cv'))} — printable résumé`,
    '',
  );

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
