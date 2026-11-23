---
slug: articles/development/python/strict/ruff-rules
seo:
  title: "Ruff: which rules to enable and why"
  description: "Which Ruff rule families to enable, safe and unsafe fixes, per-folder exceptions and how to avoid running three different Ruff versions in one project."
  schema:
    - '@type': TechArticle
      headline: "Ruff in depth: which rules to enable and how not to run three versions"
      description: "Which Ruff rule families to enable, safe and unsafe fixes, per-folder exceptions and how to avoid running three different Ruff versions in one project."
      inLanguage: en
      datePublished: '2026-11-23'
      dateModified: '2026-11-23'
      author:
        '@type': Person
        '@id': https://velezanthony.github.io/#anthony
        name: Anthony Velez Tapia
        url: https://velezanthony.github.io/
---

# Ruff in depth: which rules to enable and how not to run three versions

[SnakeORM](https://velezanthony.github.io/snake-orm/) passes [Ruff](https://docs.astral.sh/ruff/)
cleanly with the version it pins. With a newer version, without touching a line of code, it gets
**1,872 warnings**.

Ruff is the easiest layer to add: you install it and a second later it has checked everything. The
hard part comes after: which rules you enable, which fixes you let it apply on its own and which
version runs where. I explain it with SnakeORM and
[Django Cotton Gallery](https://velezanthony.github.io/django-cotton-gallery/), which configure it
very differently.

It is part of the [Strict Python](stack-python-estricto.md) series.

## 1. Rule families

:::note[The most useful families]{collapsed}

| Prefix | Family | What it catches |
|---|---|---|
| `F` | Pyflakes | unused imports and variables, undefined names |
| `E`, `W` | pycodestyle | style and warnings, such as invalid escape sequences |
| `I` | isort | import order |
| `B` | flake8-bugbear | common traps, such as a mutable default argument |
| `UP` | pyupgrade | outdated syntax for your Python version |
| `SIM` | flake8-simplify | code that can be simplified |
| `C4` | flake8-comprehensions | badly written comprehensions |
| `DJ` | flake8-django | Django bad practices |
| `S` | flake8-bandit | security issues |
| `RUF` | Ruff | Ruff's own rules |

:::

Ruff's rules are grouped into families, each with its prefix (`F`, `E`, `B`…). If you pick none,
Ruff uses its default set. And that set **changed in version 0.16**: it went from 59 rules to 413.

| Ruff version | Rules enabled with no configuration |
|---|---|
| 0.15.20 | 59 (`E4`, `E7`, `E9` and `F`) |
| 0.16.0 | 413 |
| 0.17.0 | 407 |

## 2. `select` or `extend-select`: the difference that can break your CI

There are two ways to say which rules you want:

- **`select` replaces** the default set. Only what is in your list gets checked.
- **`extend-select` extends it.** The default set of your Ruff version gets checked, plus yours.

`select` is ordering à la carte: you only get what you ask for. `extend-select` is the set menu plus
your extras: if the chef changes the menu, new dishes show up at your table.

My two projects use one each:

::::tabs
:::tab[Django Cotton Gallery: select]
```toml
[tool.ruff]
line-length = 100
target-version = "py310"

[tool.ruff.lint]
select = ["E", "W", "F", "I", "B", "UP", "SIM", "C4", "DJ", "RUF"]
```
:::
:::tab[SnakeORM: extend-select]
```toml
[tool.ruff.lint]
extend-select = ["W605"]
```
:::
::::

[SnakeORM's](https://github.com/velezanthony/snake-orm/blob/main/pyproject.toml) looks thin, but
every line has its reason written in a comment:

- **`W605`, an invalid escape sequence**, such as a bare `\d` inside a string. Today Python only
  warns (`SyntaxWarning`), but it will stop accepting it. In SnakeORM it showed up when testing with
  Python 3.14.
- **No `I`, on purpose.** It was tried, and the automatic fix reordered the imports of a test file
  where the **registration order** is exactly what is being tested. Besides, the migration generator
  writes its own import blocks, which would stop passing the check.

The problem is that `extend-select` inherits the default set, and that set depends on the version.
SnakeORM pins 0.15.20 in its [`uv.lock`](https://github.com/velezanthony/snake-orm/blob/main/uv.lock),
and with it everything passes. With 0.17.6, the same code gives **1,872 warnings**:

| Rule | Warnings | What it is |
|---|---|---|
| `PLC0414` | 941 | an import aliased to its own name (`X as X`) |
| `I001` | 500 | unsorted imports: the rule SnakeORM chose **not** to enable |
| `RUF100` | 161 | `# noqa` comments that no longer silence anything |
| others | 270 | |

Nobody touched the configuration. An update that bumps Ruff is enough, for example a Dependabot PR
or a `uv lock --upgrade`, to turn CI red. Django Cotton Gallery does not have this risk: with
`select`, new rules in the default set do not affect it.

The lesson: if you use `extend-select`, pin the Ruff version and review the rule changes when you
upgrade. If you would rather not depend on what Ruff decides by default, use `select`.

## 3. Safe fixes and unsafe fixes

Ruff does not just warn: many rules know how to fix themselves. But it splits fixes into two kinds:

- **Safe:** they do not change what the code does. `--fix` applies them.
- **Unsafe:** they can change its behaviour. They only apply if you add `--unsafe-fixes`.

It is like a spell checker that fixes a missing accent without asking, but asks before swapping one
word for another.

A generic example with three mistakes:

::::tabs
:::tab[The code]
```python
import os


def add_tag(tag, tags=[]):
    tags.append(tag)
    return tags


PATTERN = "\d+"
```
:::
:::tab[ruff check --fix]
```diff
-import os
 ...
-PATTERN = "\d+"
+PATTERN = r"\d+"
```

It removes the import (`F401`) and turns the string into a *raw* one (`W605`). It leaves
`tags=[]` (`B006`) alone: that fix is unsafe.
:::
:::tab[ruff check --fix --unsafe-fixes]
```diff
-def add_tag(tag, tags=[]):
+def add_tag(tag, tags=None):
+    if tags is None:
+        tags = []
```

Now it does fix `B006`. It is unsafe because it changes behaviour: if some code relied on the list
being shared between calls, it no longer is.
:::
::::

Django Cotton Gallery's pre-commit hook only uses `--fix`: unsafe fixes are left to be applied by
hand, looking at the change.

## 4. Exceptions: per folder and per line

A rule does not always make sense across the whole project. That is what per-folder exceptions
(`per-file-ignores`) are for and, for a one-off case, `# noqa: <code>` on the line.

There is a trap: **Ruff does not warn about an exception that does nothing**. In Django Cotton
Gallery, the configuration turns off the `assert` rule in the tests:

```toml
[tool.ruff.lint.per-file-ignores]
"src/tests/**" = ["S101"]
```

But `S101` belongs to the `S` family, which is not in `select`. The rule never turns on, so the
exception does nothing. If you enable it without the exception, you get **754 warnings**, one per
`assert` in the tests. The library code has none.

:::tip[`RUF100`: leftover `noqa` comments]

With `RUF100`, Ruff does warn about a `# noqa` that no longer silences anything. There is no
equivalent for `per-file-ignores`: review them by hand when you change `select`.

:::

## 5. The formatter

`ruff format` gives all the code the same style, compatible with Black. The only thing that usually
changes between projects is the line length: Django Cotton Gallery uses 100 and SnakeORM the
default, 88.

You can also exclude some files. SnakeORM does not format its type tests, because in them **the
position of each line is the contract**: every `# EXPECT:` comment marks the exact line that must
error, and reformatting would move it.

And the formatter changes between versions too. Since 0.16, `ruff format` also formats the Python
code blocks inside Markdown files. In SnakeORM, with 0.15.20 everything is formatted; with 0.17.6,
`ruff format --check .` asks to reformat **54 files, all of them documentation `.md` files**. If you
do not want it touching the docs, limit the formatter to your code (`ruff format src`) or exclude
the `.md` files.

## 6. One version, not three

Ruff changes from one version to the next: new rules, new default sets, a formatter that decides
differently. If every place uses a different version, what passes on your machine fails in CI.

In Django Cotton Gallery it already happened once: in a
[PR](https://github.com/velezanthony/django-cotton-gallery/pull/6), the hook and CI used different
versions and
[formatting failed in CI](https://github.com/velezanthony/django-cotton-gallery/actions/runs/28680973089/job/85064209151)
(I tell the story in the [series article](stack-python-estricto.md)). Checking it for this article,
the problem was still there, just dormant:

| Where | Where the version comes from | Version |
|---|---|---|
| Your machine (`make lint`) | [`uv.lock`](https://github.com/velezanthony/django-cotton-gallery/blob/main/uv.lock) | 0.15.12 |
| The pre-commit hook | [`.pre-commit-config.yaml`](https://github.com/velezanthony/django-cotton-gallery/blob/main/.pre-commit-config.yaml) | 0.15.20 |
| CI | `ruff>=0.15` in `pyproject.toml` | [0.17.6](https://github.com/velezanthony/django-cotton-gallery/actions/runs/45062929972/job/137332651662) |

CI uses the official Ruff action, which reads `pyproject.toml` and installs **the latest version
that satisfies** `>=0.15`. Today that is 0.17.6. All three versions pass on the same code today, but
by luck: the next Ruff version that changes formatting will break CI again.

The fix is to pin **a single exact version**:

```toml
[project.optional-dependencies]
dev = ["ruff==0.15.20"]
```

With `==`, the CI action installs exactly that one, and so does `uv.lock`. That leaves the hook,
which has its own version: either you change it by hand at the same time, or you make the hook use
the project's Ruff instead of downloading its own:

```yaml
- repo: local
  hooks:
    - id: ruff
      name: ruff
      entry: uv run ruff check --fix
      language: system
      types: [python]
```

## 7. A configuration to start with

For a new project, this is a good starting point, based on Django Cotton Gallery's. Remove or add
rules as you go, as SnakeORM did with `I`.

```toml
[tool.ruff]
line-length = 100
target-version = "py312"  # your minimum Python version

[tool.ruff.lint]
select = ["E", "W", "F", "I", "B", "UP", "SIM", "C4", "RUF"]  # plus "DJ" in a Django project

[tool.ruff.lint.per-file-ignores]
# Only if you enable "S" (or "S101"); otherwise this exception does nothing.
"tests/**" = ["S101"]
```

## Summary

| Decision | Recommendation |
|---|---|
| Which rules to enable | Start with `E`, `W`, `F`, `I`, `B`, `UP`, `SIM`, `C4` and `RUF`, and drop the ones that clash with your project |
| `select` or `extend-select` | `select` so you do not depend on the default set; with `extend-select`, review the new rules when you upgrade |
| Automatic fixes | `--fix` in the hook; unsafe ones by hand |
| Exceptions | Per folder or per line, and check that the rule is actually enabled |
| Versions | A single exact version (`==`) for your machine, the hook and CI |

## References

- [Ruff: rules](https://docs.astral.sh/ruff/rules/)
- [Ruff: configuration](https://docs.astral.sh/ruff/configuration/)
- [Ruff: rules enabled by default](https://docs.astral.sh/ruff/default-rules/)
- [Ruff 0.16: the new default set and Markdown formatting](https://github.com/astral-sh/ruff/blob/main/changelogs/0.16.x.md)
- [Ruff: safe and unsafe fixes](https://docs.astral.sh/ruff/linter/#fix-safety)
- [Ruff: the formatter](https://docs.astral.sh/ruff/formatter/)
- [Ruff: `RUF100`](https://docs.astral.sh/ruff/rules/unused-noqa/)
- [ruff-action: choosing the version](https://github.com/astral-sh/ruff-action#install-specific-versions)
- [ruff-pre-commit](https://github.com/astral-sh/ruff-pre-commit)
- [pre-commit: local hooks](https://pre-commit.com/#repository-local-hooks)
