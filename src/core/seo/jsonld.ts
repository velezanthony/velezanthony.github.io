import type { Locale } from '@core/i18n/locales';
import { path } from '@core/i18n/utils';
import { linkOf } from '@core/projects/links';
import type { Localized } from '@core/types';

/** What `person` needs to know about the owner, handed in by the caller. */
export interface PersonSource {
  profile: { name: string; headline: Localized };
  email: string;
  knowsAbout: string[];
  address: { locality: string; region: string; country: string };
  spokenLanguages: { code: string }[];
  contact: { href: string }[];
  education: { school: string }[];
  /** Newest first: the first is the current job. */
  experience: { role: Localized; company: string }[];
}

/** What `softwareSourceCode` and `techArticle` need to know about a project. */
export interface ProjectData {
  name: string;
  headline: string;
  tagline: string;
  stack: string[];
  targets: string[];
  compat: string[];
  links: { kind: string; href: string }[];
}

/** Where the site lives and the `@id` of its one Person. */
export interface SiteIdentity {
  site: URL;
  personId: string;
}

const context = 'https://schema.org';

/** The site's one Person, on every page. `@id` is what makes them one. */
export function person(
  {
    profile,
    email,
    knowsAbout,
    address,
    spokenLanguages,
    contact,
    education,
    experience,
  }: PersonSource,
  { site, personId }: SiteIdentity,
  lang: Locale,
  pageUrl: string,
) {
  const current = experience[0]!;
  return {
    '@context': context,
    '@type': 'Person',
    '@id': personId,
    mainEntityOfPage: pageUrl,
    name: profile.name,
    email: `mailto:${email}`,
    knowsAbout,
    description: profile.headline[lang],
    url: new URL(path(lang), site).href,
    image: new URL('/photo.png', site).href,
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
  { personId }: SiteIdentity,
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
    author: { '@id': personId },
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
  { personId }: SiteIdentity,
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
    author: { '@id': personId },
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
