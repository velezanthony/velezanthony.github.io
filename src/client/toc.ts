/**
 * The section being read: the last one whose heading has passed the reading line, a little below
 * the top of the viewport. Before the first heading it is the first section, so the index always
 * marks one. At the bottom of the page it is the last: a short last section ends the page before
 * its heading can reach the line, and would otherwise never be marked.
 */
export function currentHeading(
  sections: { id: string; top: number }[],
  readingLine: number,
  { atBottom = false }: { atBottom?: boolean } = {},
): string | undefined {
  if (atBottom) return sections.at(-1)?.id;
  let current = sections[0]?.id;
  for (const section of sections) {
    if (section.top <= readingLine) current = section.id;
  }
  return current;
}

/**
 * Keeps the index's `aria-current` on the section being read. One read of the headings' positions
 * per frame, on scroll only; links without a heading on the page are ignored.
 */
export function trackSections(nav: Element, readingLine = 120) {
  const links = [...nav.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')];
  const targets = links
    .map((link) => document.getElementById(decodeURIComponent(link.hash.slice(1))))
    .filter((el): el is HTMLElement => el !== null);
  if (!targets.length) return;

  let queued = false;
  const update = () => {
    queued = false;
    const page = document.documentElement;
    const id = currentHeading(
      targets.map((el) => ({ id: el.id, top: el.getBoundingClientRect().top })),
      readingLine,
      /* A pixel of slack: zoom and fractional scroll positions rarely land exactly on the end. */
      { atBottom: scrollY + innerHeight >= page.scrollHeight - 1 },
    );
    for (const link of links) {
      const here = decodeURIComponent(link.hash.slice(1)) === id;
      if (here) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  };

  addEventListener(
    'scroll',
    () => {
      if (!queued) {
        queued = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  update();
}
