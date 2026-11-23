---
slug: articles/development/python/strict/python-ci-matrix
seo:
  title: "Python CI matrix: real failures"
  description: "How to build a CI matrix with tox and GitHub Actions for Python, Django, databases, Windows and macOS, told through the real failures it uncovered."
  schema:
    - '@type': TechArticle
      headline: "The CI matrix: what only fails on another version or another system"
      description: "How to build a CI matrix with tox and GitHub Actions for Python, Django, databases, Windows and macOS, told through the real failures it uncovered."
      inLanguage: en
      datePublished: '2026-11-23'
      dateModified: '2026-11-23'
      author:
        '@type': Person
        '@id': https://velezanthony.github.io/#anthony
        name: Anthony Velez Tapia
        url: https://velezanthony.github.io/
---

# The CI matrix: what only fails on another version or another system

`requires-python = ">=3.10"` is a promise: "I work on 3.10, 3.11, 3.12 and 3.13". The only way to
keep it is to test it on all of them, and on every system it will run on. That is a **CI matrix**:
the same tests, repeated for every combination.

Here I tell it through the real failures it found in
[Django Cotton Gallery](https://velezanthony.github.io/django-cotton-gallery/) and
[SnakeORM](https://velezanthony.github.io/snake-orm/), starting with the most awkward one: a matrix
that lied.

It is part of the [Strict Python](stack-python-estricto.md) series.

## 1. The matrix that lied

The first version of Django Cotton Gallery's CI had combinations for Python 3.10, 3.11, 3.12 and
3.13. In the
[first run](https://github.com/velezanthony/django-cotton-gallery/actions/runs/28533252434) almost
every job failed while installing. The
[log of the 3.10 job](https://github.com/velezanthony/django-cotton-gallery/actions/runs/28533252434/job/84587968951)
explains it in three lines:

```text
Installed Python 3.10.20 in 1.04s
Using Python 3.12.3 environment at: /usr
error: The interpreter at /usr is externally managed
```

It installed Python 3.10 and then **installed the project into the system's Python 3.12**, with
`uv pip install --system`. Ubuntu marks that Python as externally managed
([PEP 668](https://peps.python.org/pep-0668/)) and forbids installing packages into it, so it failed.

The worst part is not the error but what was behind it: even if the install had worked, every job
would have tested Python 3.12. It was an exam with four names at the top and the same student
answering all four.

[The fix](https://github.com/velezanthony/django-cotton-gallery/commit/06cb6ec6df9db18e0218cae1643bea371b53465c)
was to create a virtual environment with each combination's version and run everything inside it:

::::tabs
:::tab[Before]
```yaml
- run: uv python install ${{ matrix.python }}
- run: uv pip install --system -e ".[test]"
```
:::
:::tab[After]
```yaml
- run: uv venv --python ${{ matrix.python }}
- run: uv pip install -e ".[test]"
- name: Show resolved versions
  run: |
    uv run --no-sync python --version
    uv run --no-sync python -c "import django; print(django.get_version())"
```
:::
::::

:::tip[Print the versions]

The "Show resolved versions" step costs a second and answers the only question that matters in a
matrix: does this job really test what its name says?

:::

## 2. How to build it without it blowing up

Django Cotton Gallery supports 4 Python versions and 5 Django versions. All against all is 20
combinations; on three systems, 60. Two tools trim them:

- **`exclude`** removes what does not exist: Django 6.0 requires Python 3.12, and Django 4.2 and 5.0
  do not support 3.13.
- **`include`** adds only what is worth it: Windows and macOS do not repeat everything, only Python
  3.12 with the two long-term-support Django versions.

The result: 16 jobs on Linux and 4 on Windows and macOS:

```yaml
strategy:
  fail-fast: false
  matrix:
    os: [ubuntu-latest]
    python: ["3.10", "3.11", "3.12", "3.13"]
    django: ["4.2", "5.0", "5.1", "5.2", "6.0"]
    exclude:
      - { python: "3.10", django: "6.0" }
      - { python: "3.11", django: "6.0" }
      - { python: "3.13", django: "4.2" }
      - { python: "3.13", django: "5.0" }
    include:
      - { os: windows-latest, python: "3.12", django: "4.2" }
      - { os: windows-latest, python: "3.12", django: "5.2" }
      - { os: macos-latest, python: "3.12", django: "4.2" }
      - { os: macos-latest, python: "3.12", django: "5.2" }
```

It is trimmed; the full one is
[`test.yml`](https://github.com/velezanthony/django-cotton-gallery/blob/main/.github/workflows/test.yml).
Locally, [`tox.ini`](https://github.com/velezanthony/django-cotton-gallery/blob/main/tox.ini)
describes the same matrix in four lines.

`fail-fast: false` matters. By default, GitHub cancels the rest of the matrix as soon as one job
fails, and you never learn whether the failure is in one version or in all of them.

SnakeORM takes another approach, because its risk is in the database rather than the framework
([`ci.yml`](https://github.com/velezanthony/snake-orm/blob/main/.github/workflows/ci.yml)):

| | Django Cotton Gallery | SnakeORM |
|---|---|---|
| Axes | Python × Django, and operating system | Python × engine (Postgres and SQLite) |
| Trimming | `exclude` and `include` | None: full product, 4 × 2 |
| Before the matrix | — | A lint and types job that takes 30 seconds; if it fails, no database is started |

That first job is the best way to save time: the cheap things first. A type error does not need
eight databases to be found.

## 3. What only fails on Windows

The four Windows and macOS jobs look like few. They have caught two failures Linux would never have
seen. The first, the backslashes of `str(path)`, is in the
[series overview](stack-python-estricto.md). The second is sneakier.

**The encoding.** A test wrote a template with `write_text()` without saying which encoding, and the
template contained an em dash (`—`). On Linux, Python usually writes UTF-8; on Windows, the system
code page. Django reads templates as UTF-8, so on Windows
[three Playwright tests failed](https://github.com/velezanthony/django-cotton-gallery/actions/runs/36460206483/job/109056586911)
without finding the page.
[The fix](https://github.com/velezanthony/django-cotton-gallery/commit/c589f52eb26269e3fe62da8d6578389ca51c3448)
([PR #16](https://github.com/velezanthony/django-cotton-gallery/pull/16)):

```python
(atoms / "button.html").write_text(template, encoding="utf-8")
```

:::note[This changes in Python 3.15]

[PEP 686](https://peps.python.org/pep-0686/) makes Python use UTF-8 by default on every system from
3.15 on. Until then, always pass `encoding` when reading or writing text.

:::

## 4. What only fails on one version

**Python 3.14 annotations.** With PEP 649, SnakeORM stopped finding the types of its columns and
broke 18 tests, only on 3.14. I tell it in [mypy and Pyright](mypy-pyright-estricto.md).

**A foreign warning.** A SnakeORM test counted warnings and, only on Python 3.14, got one more that
was not its own. I tell it in [pytest in depth](pytest-a-fondo.md).

**826 commits without noticing.** SnakeORM promises Python 3.11 or later, and pydantic rejects
`typing`'s `TypedDict` below 3.12: it requires the one from `typing_extensions`. The development
machine had Python 3.13, where everything works, so **826 commits** went by without anything
warning, until the FastAPI demo stopped starting in CI. The
[fix](https://github.com/velezanthony/snake-orm/commit/081c3d23a1b2eb4396a31792259e6587da628c3e)
was to change the import:

```python
from typing_extensions import TypedDict  # not `from typing import TypedDict`
```

**Seven at once.** When the SnakeORM matrix was widened to every version it promises,
[seven failures came out in one commit](https://github.com/velezanthony/snake-orm/commit/54066912c773e3888943d97641850a2f2c8814e1).
Some of them:

| Failure | Depends on |
|---|---|
| A test assumed SQLite rejects a `CHECK` on an existing table; that is only true below SQLite 3.53 | the SQLite version |
| A documentation example with a docstring: Python 3.13 strips its indentation when compiling it, 3.11 and 3.12 do not | the Python version |
| `async def` routes without a single `await`: FastAPI opened the connection in one thread and used it in another, and SQLite does not allow that | the framework |

## 5. What only fails in CI

The matrix also compares your machine with a clean one. Whatever you have and CI does not fails
there.

- **An environment variable.** SnakeORM's documentation opens a second connection, which needs
  `SNAKEORM_DSN_ANALYTICS`. Every machine had it in its `.env`; CI did not.
  [Only the test that runs the documentation examples noticed](https://github.com/velezanthony/snake-orm/commit/7493b1712776724bbb1edaee9dfd647dd7546350).
- **A file that was not in the repository.** A `lib/` rule in `.gitignore`, without a leading slash,
  ignored **any** `lib` folder, including one with real code. Locally it built, because the files
  were on disk; in CI it failed with 20 import errors.
  [The fix](https://github.com/velezanthony/snake-orm/commit/1777f62ca656113e8c7fc4837e4cd3610ba1bd18):
  `/lib/`, anchored to the root.

## Summary

| What fails | Real example | What catches it |
|---|---|---|
| The matrix itself | every job tested Python 3.12 | printing the versions in each job |
| The operating system | `str(path)` and the encoding on Windows | a few jobs on Windows and macOS |
| The version | 3.14 annotations, `TypedDict` on 3.11, SQLite 3.53, 3.13 docstrings | every version you promise |
| Your machine | environment variables, ignored files | a CI that starts from scratch |

- Trim with `exclude` and `include`, not by testing fewer versions than you promise.
- Put a cheap lint and types job first.
- Use `fail-fast: false` to see every failure at once.

## References

- [GitHub Actions: matrices](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/run-job-variations)
- [tox](https://tox.wiki/)
- [uv: virtual environments](https://docs.astral.sh/uv/pip/environments/)
- [PEP 668: externally managed environments](https://peps.python.org/pep-0668/)
- [PEP 686: UTF-8 by default](https://peps.python.org/pep-0686/)
- [`pathlib.PurePath.as_posix`](https://docs.python.org/3/library/pathlib.html#pathlib.PurePath.as_posix)
- [Python 3.13: docstring changes](https://docs.python.org/3/whatsnew/3.13.html)
- [Git: `.gitignore` patterns](https://git-scm.com/docs/gitignore#_pattern_format)
