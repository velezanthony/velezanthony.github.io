/** Runs git and returns its trimmed stdout. Throws when git fails, as `execFileSync` does. */
export type Git = (args: string[]) => string;

type SourcesOf = (locale: string, segments: string[]) => string[];

/**
 * A page's `<lastmod>`: the newest commit among the files it is built from.
 *
 * Git runs on the first date asked for, not when this is created — importing the config is not
 * a reason to shell out. Without full history there is no date at all: a shallow clone would
 * stamp every page with its one commit, which is wrong rather than missing.
 */
export function createLastmod(git: Git, sourcesOf: SourcesOf) {
  let complete: boolean | undefined;
  const dates = new Map<string, string | null>();

  const historyIsComplete = () => {
    if (complete === undefined) {
      try {
        complete =
          git(['rev-parse', '--is-inside-work-tree']) === 'true' &&
          git(['rev-parse', '--is-shallow-repository']) !== 'true';
      } catch {
        complete = false;
      }
    }
    return complete;
  };

  const lastCommit = (path: string): string | null => {
    let date = dates.get(path);
    if (date === undefined) {
      try {
        date = git(['log', '-1', '--format=%cI', '--', path]) || null;
      } catch {
        date = null;
      }
      dates.set(path, date);
    }
    return date;
  };

  return (locale: string, segments: string[]): string | undefined => {
    if (!historyIsComplete()) return undefined;
    return sourcesOf(locale, segments)
      .map(lastCommit)
      .filter((date): date is string => date !== null)
      .sort()
      .at(-1);
  };
}
