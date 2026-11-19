import type { CollectionEntry } from 'astro:content';

import { address, contact, email, knowsAbout, profile, spokenLanguages } from '@/data/profile';
import { education } from '@/data/education';
import { experience } from '@/data/experience';
import type { Locale } from '@/core/i18n/locales';
import { path } from '@/core/i18n/utils';
import { linkOf } from '@/adapters/project-schema';
import { PERSON_ID, SITE } from '@/site';

export type ProjectData = CollectionEntry<'projects'>['data'];

const context = 'https://schema.org';
const author = { '@id': PERSON_ID };

/** The site's one Person, on every page. `@id` is what makes them one. */
export function person(lang: Locale, pageUrl: string) {
  const current = experience[0]!;
  return {
    '@context': context,
    '@type': 'Person',
    '@id': PERSON_ID,
    mainEntityOfPage: pageUrl,
    name: profile.name,
    email: `mailto:${email}`,
    knowsAbout,
    description: profile.headline[lang],
    url: new URL(path(lang), SITE).href,
    image: new URL('/photo.png', SITE).href,
    jobTitle: current.role[lang],
    address: {
      '@type': 'PostalAddress',
      addressLocality: address.locality,
      addressRegion: address.region,
      addressCountry: address.country,
    },
    knowsLanguage: spokenLanguages.map((language) => language.code),
    alumniOf: education.map((study) => ({
      '@type': 'EducationalOrganization',
      name: study.school,
    })),
    worksFor: { '@type': 'Organization', name: current.company },
    sameAs: contact.filter((c) => c.href.startsWith('http')).map((c) => c.href),
  };
}

/**
 * The project itself. This page is the entity; every declared link is the same thing elsewhere.
 * Without `sameAs` a search engine has no way to tie the write-up to the published package, so
 * the package and the page compete instead of reinforcing each other.
 */
export function softwareSourceCode(
  data: ProjectData,
  pageUrl: string,
  dateModified: string | undefined,
) {
  return {
    '@context': context,
    '@type': 'SoftwareSourceCode',
    name: data.name,
    description: data.tagline,
    codeRepository: linkOf(data.links, 'source'),
    programmingLanguage: data.stack,
    license: 'https://opensource.org/licenses/MIT',
    author,
    url: pageUrl,
    sameAs: data.links.map((l) => l.href),
    runtimePlatform: data.compat,
    keywords: [...data.stack, ...data.targets].join(', ') || undefined,
    dateModified,
  };
}

/** The write-up IS an article, and saying so is what lets an answer engine quote it as one
    instead of treating the page as a repository listing. */
export function techArticle(
  data: ProjectData,
  lang: Locale,
  pageUrl: string,
  dateModified: string | undefined,
) {
  return {
    '@context': context,
    '@type': 'TechArticle',
    headline: `${data.name} · ${data.headline}`,
    description: data.tagline,
    url: pageUrl,
    inLanguage: lang,
    dateModified,
    author,
    about: { '@type': 'SoftwareSourceCode', name: data.name },
  };
}

export function breadcrumb(trail: { name: string; url: string }[]) {
  return {
    '@context': context,
    '@type': 'BreadcrumbList',
    itemListElement: trail.map(({ name, url }, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: url,
    })),
  };
}
