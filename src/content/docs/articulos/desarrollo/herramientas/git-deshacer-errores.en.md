---
slug: articles/development/tools/git-undo-mistakes
seo:
  title: "Git: how to undo a commit"
  description: "Undo mistakes in Git without losing work, case by case: restore, reset --soft/--mixed/--hard, commit --amend, revert, stash, and reflog to recover."
---

# How to undo mistakes in Git without losing work

You are adding discounts to a shop. You commit, and then you notice you were on `main` and not on
your branch. You try to fix it with a `git reset --hard` you found somewhere, and the commit
disappears. Breathe: almost everything in Git can be undone, as long as you know what each command
touched.

## The three areas

Almost all of these commands move changes between three places:

- **The working tree**: your files, as you see them in the editor.
- **The staging area** (*staging* or index): what you have added with `git add` and will go into
  the next commit.
- **The history**: the commits. `HEAD` is the commit you are on, and `HEAD~1` the previous one.

## "I changed a file and want it back as it was"

You touched `cart.py` to try something and you are not convinced:

```bash
git restore cart.py            # discard changes in the working tree
git restore --staged cart.py   # unstage it, keeping the changes
```

Plain `git restore` **discards** the changes: there is no going back. `--staged` is the opposite of
`git add`: it takes the file out of the staging area and leaves your changes intact. I use
`restore` instead of the old `git checkout -- file`, which does the same but shares a command with
switching branches.

## "I want to undo the last commit but keep the changes"

You committed too early: a test is missing, or you mixed two things.

```bash
git reset --soft HEAD~1    # undo the commit, changes stay staged
git reset --mixed HEAD~1   # undo the commit, changes stay unstaged (default)
```

`git reset` moves the branch to another commit. What changes is what it does with your files:

| Mode | History | Staging area | Your files |
|---|---|---|---|
| `--soft` | Goes back | Kept | Kept |
| `--mixed` | Goes back | Emptied | Kept |
| `--hard` | Goes back | Emptied | **Overwritten** |

With `--soft` you can redo the commit as it was; with `--mixed` you choose again what to add.
`--hard` is the only one that deletes work.

If you only wanted to fix the message or add a forgotten file, it is simpler with `--amend`:

```bash
git add tests/test_discounts.py
git commit --amend --no-edit       # same message, new content
git commit --amend -m "feat: add volume discounts"
```

`--amend` does not edit the commit: it **replaces** it.

:::warning[Only with commits you have not pushed]

`reset` and `--amend` rewrite history. If the commit is already on the remote and someone has it,
rewriting it forces them to reconcile their copy. For anything already published, use `revert`.

:::

## "I committed to the wrong branch"

The case from the start: the discounts commit is on `main` and should be on `feat/discounts`. As
long as you have not pushed it:

```bash
git branch feat/discounts   # new branch pointing at the current commit
git reset --hard HEAD~1     # move main back one commit
git switch feat/discounts   # carry on where you were
```

The order matters: the new branch already points at your commit, so the `reset --hard` loses
nothing; it just puts `main` back where it was. Mind you, only with no pending changes: those the
`--hard` does take with it.

## "I already pushed it and it is wrong"

The discounts commit reached `main` on the remote and breaks the basket. Here I do not rewrite
anything:

```bash
git revert a1b2c3d
git push
```

`git revert` creates a **new** commit that applies the opposite changes. History is not rewritten,
so nobody who already has the commit needs to do anything special.

## "I have half-done changes and need to switch branches"

You are halfway through the discounts and someone asks for an urgent fix on another branch. You do
not want to commit something half-done:

```bash
git stash push -u -m "discounts: WIP"   # save changes, including new files
git switch hotfix/login
# ... fix, commit ...
git switch feat/discounts
git stash pop                            # bring the changes back
```

`stash` saves your changes on a separate stack and leaves the working tree clean. Without `-u`, new
files Git does not track yet stay behind and come with you to the other branch. `pop` applies what
was saved and removes it from the stack, unless there are conflicts: then it keeps it.

## "I deleted something with `reset --hard`"

Your safety net is `git reflog`: Git records every movement of `HEAD` (commits, resets, branch
switches), even if the commit is no longer on any branch:

```console
$ git reflog
f4e5d6c HEAD@{0}: reset: moving to HEAD~1
a1b2c3d HEAD@{1}: commit: feat: add volume discounts
```

The lost commit is `HEAD@{1}`. You recover it on a branch:

```bash
git branch rescue/discounts a1b2c3d
```

I prefer a branch to another `reset --hard`: I look at what I recovered calmly without moving
anything else. Reflog entries last 90 days by default (30 if the commit is no longer reachable from
any branch), so do not wait months.

The limit: the reflog only knows about **commits**. If the lost changes never made it into one but
you had added them with `git add`, `git fsck --lost-found` dumps the orphaned files into
`.git/lost-found/other/`, unnamed, for you to search through. If not even that, they are gone. That
is why, when in doubt, make a commit or a `stash` before any `--hard`.

## Which command I use

| Situation | Command |
|---|---|
| Discard changes to a file | `git restore <file>` |
| Take a file out of the staging area | `git restore --staged <file>` |
| Fix the last commit (not pushed) | `git commit --amend` |
| Undo the last commit keeping the changes | `git reset --soft HEAD~1` |
| Commit on the wrong branch (not pushed) | `git branch`, `git reset --hard HEAD~1` |
| Undo a commit already pushed | `git revert <commit>` |
| Switch branches with half-done work | `git stash push -u` |
| Recover a lost commit | `git reflog` and `git branch <branch> <commit>` |

## In summary

- Before undoing, think about which area the command touches: files, staging area or history.
- What you have not pushed can be rewritten with `reset` or `--amend`; what you have pushed is
  corrected with `revert`.
- `reset --hard` and `restore` are the only ones on the list that delete uncommitted work.
- A lost commit is almost never lost: `git reflog` finds it.

## References

- [Git: `git restore`](https://git-scm.com/docs/git-restore)
- [Git: `git reset`](https://git-scm.com/docs/git-reset)
- [Git: `git commit`](https://git-scm.com/docs/git-commit)
- [Git: `git revert`](https://git-scm.com/docs/git-revert)
- [Git: `git stash`](https://git-scm.com/docs/git-stash)
- [Git: `git reflog`](https://git-scm.com/docs/git-reflog)
- [Git: `git fsck`](https://git-scm.com/docs/git-fsck)
- [Pro Git: undoing things](https://git-scm.com/book/en/v2/Git-Basics-Undoing-Things)
