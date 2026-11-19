/** Runs git and returns its trimmed stdout. Throws when git fails, as `execFileSync` does. */
export type Git = (args: string[]) => string;

/**
 * The date of the last commit that touched a file, or undefined.
 *
 * Git runs on the first date asked for, not when this is created — importing the config is not a
 * reason to shell out. Without full history there is no date at all: shallow, `git log -- file`
 * answers with the one commit there is, which stamps every file with today. Wrong is worse than
 * missing.
 */
export function createCommitDates(git: Git) {
  let complete: boolean | undefined;
  const dates = new Map<string, string | undefined>();

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

  return (path: string): string | undefined => {
    if (!historyIsComplete()) return undefined;
    if (!dates.has(path)) {
      let date: string | undefined;
      try {
        date = git(['log', '-1', '--format=%cI', '--', path]) || undefined;
      } catch {
        date = undefined;
      }
      dates.set(path, date);
    }
    return dates.get(path);
  };
}
