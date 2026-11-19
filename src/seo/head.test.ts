import { describe, expect, it } from 'vitest';

import { pageHead, type PageHeadInput } from './head';

const site = new URL('https://velezanthony.github.io');

const input: PageHeadInput = {
  lang: 'es',
  title: 'Proyectos',
  description: 'Herramientas open source',
  alternates: { es: '/proyectos/', en: '/en/projects/' },
  pathname: '/proyectos/',
  site,
  generator: 'Astro v0',
};

const metas = (head: ReturnType<typeof pageHead>, key: 'name' | 'property', name: string) =>
  head.filter((tag) => tag.tag === 'meta' && tag.attrs[key] === name);
const links = (head: ReturnType<typeof pageHead>, rel: string) =>
  head.filter((tag) => tag.tag === 'link' && tag.attrs.rel === rel);

describe('pageHead', () => {
  describe('the title', () => {
    it('carries the site name as a suffix', () => {
      const [title] = pageHead(input);
      expect(title).toMatchObject({ tag: 'title', content: 'Proyectos | Anthony Velez Tapia' });
    });

    it('drops the suffix when the page asks for a bare title', () => {
      expect(pageHead({ ...input, bareTitle: true })[0]!.content).toBe('Proyectos');
    });

    it('does not repeat the name on the page that is the name', () => {
      expect(pageHead({ ...input, title: 'Anthony Velez Tapia' })[0]!.content).toBe(
        'Anthony Velez Tapia',
      );
    });
  });

  describe('an indexable page', () => {
    const head = pageHead(input);

    it('points its canonical at itself, absolute', () => {
      expect(links(head, 'canonical').map((tag) => tag.attrs.href)).toEqual([
        'https://velezanthony.github.io/proyectos/',
      ]);
    });

    it('lists every locale for hreflang, and the default one as x-default', () => {
      const languages = links(head, 'alternate').map((tag) => [tag.attrs.hreflang, tag.attrs.href]);
      expect(languages).toEqual([
        ['es', 'https://velezanthony.github.io/proyectos/'],
        ['en', 'https://velezanthony.github.io/en/projects/'],
        ['x-default', 'https://velezanthony.github.io/proyectos/'],
      ]);
    });

    it('is not marked noindex', () => {
      expect(metas(head, 'name', 'robots')).toEqual([]);
    });
  });

  describe('a noindex page', () => {
    const head = pageHead({ ...input, noindex: true });

    it('says so, and names no canonical or alternates', () => {
      expect(metas(head, 'name', 'robots')[0]!.attrs.content).toBe('noindex');
      expect(links(head, 'canonical')).toEqual([]);
      expect(links(head, 'alternate')).toEqual([]);
    });
  });

  describe('social tags', () => {
    const head = pageHead({ ...input, lang: 'en' });

    it('gives the page its own locale and names the other one', () => {
      expect(metas(head, 'property', 'og:locale')[0]!.attrs.content).toBe('en_GB');
      expect(metas(head, 'property', 'og:locale:alternate')[0]!.attrs.content).toBe('es_ES');
    });

    it('uses an absolute image, which crawlers need', () => {
      expect(metas(head, 'property', 'og:image')[0]!.attrs.content).toBe(
        'https://velezanthony.github.io/og.png',
      );
    });
  });

  describe('structured data', () => {
    const script = pageHead(input).find((tag) => tag.tag === 'script')!;

    it('is one Person as JSON', () => {
      expect(script.attrs.type).toBe('application/ld+json');
      expect(JSON.parse(script.content!)['@type']).toBe('Person');
    });

    it('cannot close the script tag it sits in', () => {
      expect(script.content).not.toContain('</');
    });
  });
});
