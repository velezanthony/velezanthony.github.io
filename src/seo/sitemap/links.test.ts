import { describe, expect, it, vi } from 'vitest';

import { createSerialize } from './links';

const site = 'https://velezanthony.github.io';

describe('createSerialize', () => {
  it('links a Spanish page to its English twin, with Spanish as x-default', () => {
    const item = createSerialize(() => undefined)({ url: `${site}/proyectos/snake-orm/` });
    expect(item.links).toEqual([
      { lang: 'es', url: `${site}/proyectos/snake-orm/` },
      { lang: 'en', url: `${site}/en/projects/snake-orm/` },
      { lang: 'x-default', url: `${site}/proyectos/snake-orm/` },
    ]);
  });

  it('links an English page back to Spanish', () => {
    const item = createSerialize(() => undefined)({ url: `${site}/en/experience/` });
    expect(item.links).toEqual([
      { lang: 'en', url: `${site}/en/experience/` },
      { lang: 'es', url: `${site}/experiencia/` },
      { lang: 'x-default', url: `${site}/experiencia/` },
    ]);
  });

  it('asks for the date by locale and canonical segments', () => {
    const lastmod = vi.fn(() => '2026-09-07T00:06:43+02:00');
    const item = createSerialize(lastmod)({ url: `${site}/en/projects/snake-orm/` });
    expect(lastmod).toHaveBeenCalledWith('en', ['projects', 'snake-orm']);
    expect(item.lastmod).toBe('2026-09-07T00:06:43+02:00');
  });

  it('leaves lastmod out when there is no date', () => {
    const item = createSerialize(() => undefined)({ url: `${site}/` });
    expect(item).not.toHaveProperty('lastmod');
  });
});
