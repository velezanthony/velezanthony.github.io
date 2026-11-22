import { parseHTML } from 'linkedom';
import { describe, expect, it, vi } from 'vitest';

import { bindMenu } from './menu';

/** What SiteHeader renders: the button, and the navigation it controls. */
function page(expanded = 'false') {
  const { document, Event } = parseHTML(
    `<header><button type="button" data-menu-toggle aria-controls="site-nav" aria-expanded="${expanded}">Menu</button><nav id="site-nav"><a href="/en/cv/">CV</a></nav></header>`,
  );
  const button = document.querySelector('button')!;
  const fire = (target: EventTarget, type: string, key?: string) => {
    const event = new Event(type, { bubbles: true });
    if (key) Object.defineProperty(event, 'key', { value: key });
    target.dispatchEvent(event);
  };
  return { document, button, fire, focus: vi.spyOn(button, 'focus') };
}

const expanded = (button: Element) => button.getAttribute('aria-expanded');

describe('bindMenu', () => {
  it('opens and closes the menu with the button', () => {
    const { document, button, fire } = page();
    bindMenu(document);
    fire(button, 'click');
    expect(expanded(button)).toBe('true');
    fire(button, 'click');
    expect(expanded(button)).toBe('false');
  });

  /* From a link inside the menu, Escape has to give focus somewhere: the button that opened it. */
  it('closes on Escape and hands focus back to the button', () => {
    const { document, button, fire, focus } = page('true');
    bindMenu(document);
    fire(document.querySelector('a')!, 'keydown', 'Escape');
    expect(expanded(button)).toBe('false');
    expect(focus).toHaveBeenCalledOnce();
  });

  /* Escape belongs to whatever else is open (a dialog, the cookie banner) when the menu is not. */
  it('leaves Escape alone while the menu is closed', () => {
    const { document, button, fire, focus } = page();
    bindMenu(document);
    fire(document, 'keydown', 'Escape');
    expect(expanded(button)).toBe('false');
    expect(focus).not.toHaveBeenCalled();
  });

  it('ignores other keys', () => {
    const { document, button, fire } = page('true');
    bindMenu(document);
    fire(document, 'keydown', 'Enter');
    expect(expanded(button)).toBe('true');
  });

  it('does nothing on a page without a menu', () => {
    const { document } = parseHTML('<main></main>');
    expect(() => bindMenu(document)).not.toThrow();
  });
});
