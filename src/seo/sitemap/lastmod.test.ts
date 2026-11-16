import { describe, expect, it, vi } from 'vitest';

import { createLastmod } from './lastmod';

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

const sources = (_: string, segments: string[]) => segments;

describe('createLastmod', () => {
  it('is the newest commit among the sources', () => {
    const git = fakeGit({ a: '2026-08-08T14:01:37+02:00', b: '2026-09-07T00:06:43+02:00' });
    expect(createLastmod(git, sources)('es', ['a', 'b'])).toBe('2026-09-07T00:06:43+02:00');
  });

  it('ignores a source with no commits, and is undefined when none has one', () => {
    const git = fakeGit({ a: '2026-08-08T14:01:37+02:00' });
    const lastmod = createLastmod(git, sources);
    expect(lastmod('es', ['a', 'never-committed'])).toBe('2026-08-08T14:01:37+02:00');
    expect(lastmod('es', ['never-committed'])).toBeUndefined();
  });

  it('treats a path git fails on as having no date', () => {
    const git = vi.fn((args: string[]): string => {
      if (args[0] === 'log') throw new Error('bad revision');
      return fullHistory[args.join(' ') as keyof typeof fullHistory];
    });
    expect(createLastmod(git, sources)('es', ['a'])).toBeUndefined();
  });

  /* A shallow clone's dates are those of its one commit: wrong, not missing. */
  it('gives no date at all on a shallow clone', () => {
    const git = fakeGit(
      { a: '2026-08-08T14:01:37+02:00' },
      { ...fullHistory, 'rev-parse --is-shallow-repository': 'true' },
    );
    expect(createLastmod(git, sources)('es', ['a'])).toBeUndefined();
    expect(git).not.toHaveBeenCalledWith(expect.arrayContaining(['log']));
  });

  it('gives no date outside a git repository', () => {
    const git = fakeGit({}, {});
    expect(createLastmod(git, sources)('es', ['a'])).toBeUndefined();
  });

  it('does not run git until a date is asked for', () => {
    const git = fakeGit({});
    createLastmod(git, sources);
    expect(git).not.toHaveBeenCalled();
  });

  it('asks git once per path, however many pages share it', () => {
    const git = fakeGit({ shared: '2026-08-08T14:01:37+02:00' });
    const lastmod = createLastmod(git, sources);
    lastmod('es', ['shared']);
    lastmod('en', ['shared']);
    const logs = git.mock.calls.filter(([args]) => args[0] === 'log');
    expect(logs).toHaveLength(1);
  });
});
