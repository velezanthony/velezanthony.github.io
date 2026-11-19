import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { parseHTML } from 'linkedom';

type Component = Parameters<AstroContainer['renderToString']>[0];
type Options = NonNullable<Parameters<AstroContainer['renderToString']>[1]>;

let container: AstroContainer | undefined;

/** Renders a component the way a page would and hands back a queryable document. `slots` are
    HTML fragments (`default` is the unnamed slot). */
export async function render(
  component: Component,
  props: Options['props'] = {},
  slots: Options['slots'] = {},
) {
  container ??= await AstroContainer.create();
  const html = await container.renderToString(component, { props, slots });
  return parseHTML(`<!doctype html><html><body>${html}</body></html>`).document;
}

type Node = { textContent: string | null };

/** Visible text with whitespace collapsed, as a reader would see it. A document's own
    `textContent` is always null by spec, so it reads the body's. */
export const text = (node: Node | { body: Node } | null) => {
  const source = node && 'body' in node ? node.body : node;
  return source?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
};
