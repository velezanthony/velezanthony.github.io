/**
 * The header's menu button, below md. The markup and the CSS already do the rest: the button
 * only shows where scripts run, and the navigation hides while it says `aria-expanded="false"`.
 * Without JavaScript neither applies and the navigation stays in view, so nothing here is needed
 * to reach a page.
 */
export function bindMenu(root: Document) {
  const button = root.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  if (!button) return;

  const isOpen = () => button.getAttribute('aria-expanded') === 'true';
  const set = (open: boolean) => button.setAttribute('aria-expanded', String(open));

  button.addEventListener('click', () => set(!isOpen()));

  /* On the document: focus may be on any link of the menu, or already back on the button. */
  root.addEventListener('keydown', (event) => {
    if ((event as KeyboardEvent).key !== 'Escape' || !isOpen()) return;
    set(false);
    button.focus();
  });
}
