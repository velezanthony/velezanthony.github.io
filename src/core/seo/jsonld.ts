import type { Locale } from '@core/i18n/locales';
import { path } from '@core/i18n/utils';
import { caseStudyTitle } from '@core/projects/case-study';
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

/** What `techArticle` needs to know about a project. */
export interface ProjectData {
  name: string;
  /** The case study's meta description. */
  summary: string;
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
 * The case study, as an article ABOUT the software. The software's own home is its documentation
 * site, which answers the "what is it, how do I use it" searches: declaring this page as the
 * software would make the two compete for them. So `about` points at the docs (the repository when
 * there are none), and every other declared link is the same software elsewhere.
 */
export function techArticle(
  data: ProjectData,
  { personId }: SiteIdentity,
  lang: Locale,
  pageUrl: string,
  dateModified: string | undefined,
) {
  const home = linkOf(data.links, 'docs') ?? linkOf(data.links, 'source');
  return {
    '@context': context,
    '@type': 'TechArticle',
    headline: caseStudyTitle(data.name, lang),
    description: data.summary,
    url: pageUrl,
    inLanguage: lang,
    dateModified,
    author: { '@id': personId },
    about: {
      '@type': 'SoftwareSourceCode',
      name: data.name,
      url: home,
      codeRepository: linkOf(data.links, 'source'),
      sameAs: data.links.map((l) => l.href).filter((href) => href !== home),
    },
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
