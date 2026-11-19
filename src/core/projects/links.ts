/** The first link of a kind: the repository, the docs, the package. */
export function linkOf(links: { kind: string; href: string }[], kind: string): string | undefined {
  return links.find((l) => l.kind === kind)?.href;
}
