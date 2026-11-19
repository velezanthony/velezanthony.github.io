import { describe, expect, it, vi } from 'vitest';

import { createCommitDates } from './lastmod';

const fullHistory = {
  'rev-parse --is-inside-work-tree': 'true',
  'rev-parse --is-shallow-repository': 'false',
};

/** A git that knows the commit date of a few paths. Anything else it has never seen. */
function fakeGit(dates: Record<string, string>, repo: Record<string, string> = fullHistory) {
  return vi.fn((args: string[]): string => {
    const command = args.join(' ');
    if (command in repo) return repo[command]!;
    if (args[0] === 'log') return dates[args.at(-1)!] ?? '';
    throw new Error(`fatal: not a git repository`);
  });
}

describe('createCommitDates', () => {
  it('is the date of the last commit that touched the file', () => {
    const git = fakeGit({ 'a.md': '2026-08-08T14:01:37+02:00' });
    expect(createCommitDates(git)('a.md')).toBe('2026-08-08T14:01:37+02:00');
  });

  /* Shallow, `git log -- file` answers with the one commit there is: today, for any file. */
  it('gives no date on a shallow clone rather than a wrong one', () => {
    const git = fakeGit(
      { 'a.md': '2026-11-09T23:00:19+01:00' },
      { ...fullHistory, 'rev-parse --is-shallow-repository': 'true' },
    );
    expect(createCommitDates(git)('a.md')).toBeUndefined();
  });

  it('gives no date for a file git has never seen', () => {
    expect(createCommitDates(fakeGit({}))('new.md')).toBeUndefined();
  });
});
