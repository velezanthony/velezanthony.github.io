---
slug: articles/development/python/strict/strict-python-stack
seo:
  title: "A stack for strict Python"
  description: "The tools that make a Python project fail before production: uv, Ruff, mypy and Pyright, type tests, Hypothesis, coverage, deptry and the CI matrix."
  schema:
    - '@type': TechArticle
      headline: "Strict Python: the tools that warn you before production"
      description: "The tools that make a Python project fail before production: uv, Ruff, mypy and Pyright, type tests, Hypothesis, coverage, deptry and the CI matrix."
      inLanguage: en
      datePublished: '2026-11-23'
      dateModified: '2026-11-23'
      author:
        '@type': Person
        '@id': https://velezanthony.github.io/#anthony
        name: Anthony Velez Tapia
        url: https://velezanthony.github.io/
---

# Strict Python: the tools that warn you before production

I come from .NET. There, if you call a method with the wrong type, the project does not compile and
you find out before running anything. Not in Python: the code starts, and the error shows up when
that line runs, sometimes in production.

Python accepts type annotations, but **does not check them**: at runtime, it ignores them. It is the
same as TypeScript, whose types disappear when it becomes JavaScript. The difference is that in
TypeScript the compiler checks them first; in Python you have to build that compiler yourself.

And the compiler is only the first safety net. You need others for the logic, for the dependencies,
for the package you publish and for every system it will run on. This is the list of the ones I use,
plus a few more worth knowing.

Here I explain how I set it up in
[Django Cotton Gallery](https://velezanthony.github.io/django-cotton-gallery/), a Django library with
its [source code public on GitHub](https://github.com/velezanthony/django-cotton-gallery). The
examples come from its repository, with a link to each file: which tool provides each piece, which
error it catches and when it runs.

:::note[Doesn't Python compile?]{collapsed}

It does, but to *bytecode*, the instructions its interpreter then runs. That step does not check
types or whether a function exists: it only translates. That is why a type error does not show until
the line runs.

:::

## 1. The base: a single configuration file

The whole project is described in one
[`pyproject.toml`](https://github.com/velezanthony/django-cotton-gallery/blob/main/pyproject.toml):
dependencies, Python version and the configuration of every tool.

For the environment, the classic way is `venv` and `pip`, which ship with Python: `python -m venv
.venv` creates the virtual environment and `pip install -e .` installs the project into it. It works,
but `pip` does not record the exact versions it installs: everyone pins them their own way, with a
`requirements.txt` or with another tool.

[uv](https://docs.astral.sh/uv/) does the same and more: it creates the environment, installs the
dependencies much faster, downloads the Python version you ask for and records the exact versions in
`uv.lock`. Whoever clones the repository gets exactly what you have.

| With `venv` and `pip` | With uv |
|---|---|
| `python -m venv .venv` | `uv venv` |
| `pip install -e ".[test]"` | `uv pip install -e ".[test]"` or `uv sync` |
| Exact versions: by hand (`pip freeze > requirements.txt`) | `uv.lock`, automatic |
| Python: whichever you have installed | `uv python install 3.12` |

Two structural details that help later:

- **The code lives in `src/`**, apart from the repository root. That way nothing accidentally imports
  a loose file at the root that is not part of the package.
- **An empty `py.typed` file** inside the package
  ([Django Cotton Gallery's](https://github.com/velezanthony/django-cotton-gallery/blob/main/src/django_cotton_gallery/py.typed))
  tells whoever uses it that it ships types. Without it, their type checker ignores yours.

## 2. Ruff: style and silly mistakes

[Ruff](https://docs.astral.sh/ruff/) does two jobs: it **formats** the code so everything has the
same style, and it **checks** rules that point out common mistakes. It is very fast, and it replaces
several tools that used to run separately (flake8, isort, pyupgrade…).

Each family of rules is turned on by its prefix. These are the ones
[Django Cotton Gallery](https://velezanthony.github.io/django-cotton-gallery/) turns on in its
[`pyproject.toml`](https://github.com/velezanthony/django-cotton-gallery/blob/main/pyproject.toml):

```toml
[tool.ruff.lint]
select = [
    "E", "W",  # style (pycodestyle)
    "F",       # logic errors: unused imports or variables (pyflakes)
    "I",       # import order
    "B",       # common traps (bugbear)
    "UP",      # modern syntax for your Python version
    "SIM",     # code that can be simplified
    "C4",      # better-written comprehensions
    "DJ",      # Django good practices
    "RUF",     # Ruff's own rules
]
```

A generic example of what `B` catches: a list as a default value. Python creates it **only once**,
so every call shares the same list:

```python
def add_tag(tag, tags=[]):  # B006: mutable default argument
    tags.append(tag)
    return tags
```

It works on your first try and fails on the second. Ruff flags it without running anything.

`assert` statements are a case of their own. Python removes them when it runs with `-O`, so they are
no good for checking anything important in application code. If you want Ruff to flag every
`assert` in your code, turn on rule `S101` and turn it off in the tests, where pytest needs them. If
not, add neither:

```toml
[tool.ruff.lint]
extend-select = ["S101"]

[tool.ruff.lint.per-file-ignores]
"tests/**" = ["S101"]
```

**In depth:** [Ruff: which rules to turn on, and how not to end up with three versions](ruff-reglas.md).

## 3. mypy in strict mode: the missing compiler

[mypy](https://mypy.readthedocs.io/) reads the annotations and checks that the code respects them.
It is the closest thing to the .NET compiler. With `strict = true` it stops being nice:

- every function must have its types annotated;
- you cannot return an untyped value (`Any`) where you promise a concrete one;
- it flags impossible comparisons and `# type: ignore` comments that are no longer needed.

The typical case is a value that can be `None` (another generic example):

```python
def find_component(name: str) -> Component | None: ...

component = find_component("button")
component.render()  # error: Item "None" of "Component | None" has no attribute "render"
```

At runtime, this only fails the day the component does not exist. mypy makes you decide what
happens in that case before it happens.

With Django you need [django-stubs](https://github.com/typeddjango/django-stubs), which teaches mypy
Django's types: models, `QuerySet`, requests. And strict mode can be relaxed where it does not pay
off. In [Django Cotton Gallery](https://velezanthony.github.io/django-cotton-gallery/), the
*templatetags* receive internal objects from the template engine without useful types, so I turn it
off for that module instead of filling it with `Any`
([`pyproject.toml`](https://github.com/velezanthony/django-cotton-gallery/blob/main/pyproject.toml)):

```toml
[tool.mypy]
strict = true
plugins = ["mypy_django_plugin.main"]

[[tool.mypy.overrides]]
module = "django_cotton_gallery.templatetags.*"
disallow_untyped_defs = false
```

:::tip[mypy or Pyright?]{collapsed}

[Pyright](https://microsoft.github.io/pyright/) does the same, and it is the engine VS Code (Pylance)
uses to underline errors while you type. Which one is faster? It depends on whether mypy has its
cache: it stores what it already checked in `.mypy_cache` and on the next run only looks at what
changed. Pyright keeps nothing between runs. Measured on
[Django Cotton Gallery](https://velezanthony.github.io/django-cotton-gallery/):

| | First run | Next runs |
|---|---|---|
| mypy | 5.2 s | 1.0 s |
| Pyright | 2.5 s | 2.5–2.9 s |

On your machine, with the cache already built, mypy wins. In CI, which starts from scratch, Pyright
wins, unless you keep the `.mypy_cache` folder between runs.

And you do not have to choose. In [SnakeORM](https://velezanthony.github.io/snake-orm/), an ORM, both
run on the same code, because the ORM promises to work with either of them
([`pyproject.toml`](https://github.com/velezanthony/snake-orm/blob/main/pyproject.toml)).

In a Django project, mypy also has the Django plugin, which understands things like a model's
fields. That is why the CI of
[Django Cotton Gallery](https://velezanthony.github.io/django-cotton-gallery/) uses mypy
([`lint.yml`](https://github.com/velezanthony/django-cotton-gallery/blob/main/.github/workflows/lint.yml)).

:::

**In depth:** [mypy and Pyright in strict mode](mypy-pyright-estricto.md) and
[the typed Django ORM](django-orm-tipado.md).

### Type tests: making the types say what they promise

If your code **is** a typed API, like an ORM, the types are tested too. In
[SnakeORM](https://velezanthony.github.io/snake-orm/) there are two files that never run; only mypy
and Pyright read them:

- **[`cases_positive.py`](https://github.com/velezanthony/snake-orm/blob/main/src/test/typing/cases_positive.py)**
  pins down with `assert_type` which type the checker must infer. If a change makes a query return
  `Any` instead of `list[Nomina]`, it fails.
- **[`cases_negative.py`](https://github.com/velezanthony/snake-orm/blob/main/src/test/typing/cases_negative.py)**
  contains errors on purpose, each one marked with the error it must produce:

```python
truck = Truck(id=1, model="Ibiza", maker_id=1)
truck.no_declarada  # EXPECT: attr-defined
model: str = truck.id  # EXPECT: assignment
```

[A test](https://github.com/velezanthony/snake-orm/blob/main/src/test/typing/test_type_checkers.py)
runs both checkers on those files and requires them to error **exactly** on those lines. If one day
the code stops rejecting `truck.no_declarada`, the typing has opened a hole and the test says so.

**In depth:** [Type tests](tests-de-tipos.md).

## 4. Tests: from the known cases to the ones you would never think of

Types do not tell you whether the code does the right thing. That is what tests are for, with
[pytest](https://docs.pytest.org/) and three add-ons:

- **[pytest-django](https://pytest-django.readthedocs.io/)** to test views and templates.
- **[Hypothesis](https://hypothesis.readthedocs.io/)** for the cases you would never think of.
  Instead of writing the inputs yourself, you describe what they look like and Hypothesis generates
  hundreds.
- **[Playwright](https://playwright.dev/python/)** to test the page in a real browser.

My best example is in another project, [SnakeORM](https://velezanthony.github.io/snake-orm/), an
ORM. The property is simple: **any value you save to the database must come back identical when you
read it**. Instead of me picking a few values,
[the test](https://github.com/velezanthony/snake-orm/blob/main/src/test/integration/test_round_trip_property.py)
asks Hypothesis for dozens per type, on Postgres and on SQLite: integers at the 64-bit edges, text
with any character, dates with microseconds, long decimals.

The interesting part is how the inputs are bounded:

```python
_INTEGERS = st.integers(min_value=-(2**63), max_value=2**63 - 1)
_TEXTS = st.text(alphabet=st.characters(codec="utf-8", exclude_characters="\x00"))
_FLOATS = st.floats(allow_nan=False, allow_infinity=False)
```

Each exclusion has its reason: a `NaN` cannot come back identical because `NaN != NaN`, and the null
character (`\x00`) does not fit in a text column in any database. Bounding inputs to what the
contract promises is fine; excluding something without a reason would be hiding a bug.

If Hypothesis finds a value that breaks it, it shrinks it to the shortest possible example before
showing it to you.

**In depth:** [pytest: from fixtures to tests that fail now and then](pytest-a-fondo.md).

### Coverage: which code nobody tests

[pytest-cov](https://pytest-cov.readthedocs.io/) measures which lines the tests run. In
[Django Cotton Gallery](https://velezanthony.github.io/django-cotton-gallery/) it also measures
branches (`branch = true` in its
[`pyproject.toml`](https://github.com/velezanthony/django-cotton-gallery/blob/main/pyproject.toml)):
going through an `if` is not enough, you have to go through both the yes and the no. CI uploads the
report to [Codecov](https://about.codecov.io/) from a single combination of the matrix
([`test.yml`](https://github.com/velezanthony/django-cotton-gallery/blob/main/.github/workflows/test.yml)).

### Mutation testing: do your tests test anything?

100 % coverage only says the tests **go through** the code, not that they check what it does.
Mutation testing measures it the other way round: it changes the code on purpose (a `>` for a `>=`,
a `True` for a `False`) and checks whether some test fails. If none fails, that change, that
"mutant", survives, and you have found a gap in your tests.

In Python, the tool is [mutmut](https://mutmut.readthedocs.io/), which works with pytest. I do not
use it in these projects yet, but I do use the same principle with
[Stryker](https://stryker-mutator.io/) in
[@velezanthony/design](https://velezanthony.github.io/design/), my documentation library, which is
TypeScript: the tool changes, the idea is the same.

:::warning[Careful: it multiplies test time]

Each mutant runs the tests again, so the cost is mutants times tests. Turn it on only for the modules
where a silent failure is expensive (business logic, calculations, validation), and not on every
commit.

In @velezanthony/design, mutating the whole library means about 12,000 mutants. In the
[last full run](https://github.com/velezanthony/design/actions/runs/44436499883), 12 machines took
**10 minutes** from start to finish, between 4 and 9 minutes each. Adding up the work of all of them,
about 70 minutes: what a single machine would take. This is how I split it:

| When | Machines | What it does |
|---|---|---|
| On every PR ([`mutation-incremental.yml`](https://github.com/velezanthony/design/blob/main/.github/workflows/mutation-incremental.yml)) | 2 | Starts from the cache and only reruns the mutants whose code or tests changed |
| By hand, on `main` ([`mutation.yml`](https://github.com/velezanthony/design/blob/main/.github/workflows/mutation.yml)) | 12 by default, up to 20 (I recommend no more than 16) | Runs every mutant and saves the new cache the PRs start from |

The full run goes on `main` because PRs cannot see the caches of other branches.

:::

**In depth:** [Mutation testing: the test that tests your tests](mutation-testing.md).

## 5. Dependencies: the code you do not write

A good share of the code running in production is not yours. Three tools keep an eye on it:

- **[Dependabot](https://docs.github.com/en/code-security/dependabot)** opens a PR whenever a new
  version of a dependency comes out. In
  [Django Cotton Gallery](https://velezanthony.github.io/django-cotton-gallery/) it checks the Python
  dependencies and the CI actions every week
  ([`dependabot.yml`](https://github.com/velezanthony/django-cotton-gallery/blob/main/.github/dependabot.yml)).
  Since every PR goes through CI, you know whether the update breaks anything before accepting it.
- **[deptry](https://deptry.com/)** compares what your code imports with what your `pyproject.toml`
  declares: it flags a dependency you use without declaring it (it works on your machine because you
  installed it some other way) and one you declare but no longer use.
- **[pip-audit](https://github.com/pypa/pip-audit)** looks up your dependencies in the databases of
  known vulnerabilities.

## 6. The matrix: every version and three systems

A library does not only run on your machine.
[Django Cotton Gallery](https://velezanthony.github.io/django-cotton-gallery/) supports Python 3.10
to 3.13 and Django 4.2 to 6.0, and the combinations have to be tested. I do it in two places.

**Locally, with [tox](https://tox.wiki/).** It creates an isolated environment per combination and
runs the tests in each one. One line in its
[`tox.ini`](https://github.com/velezanthony/django-cotton-gallery/blob/main/tox.ini) describes the
whole matrix:

```ini
[tox]
envlist =
    py310-django{42,50,51,52}
    py311-django{42,50,51,52}
    py312-django{42,50,51,52,60}
    py313-django{51,52,60}
```

**On GitHub Actions, with a matrix**
([`test.yml`](https://github.com/velezanthony/django-cotton-gallery/blob/main/.github/workflows/test.yml)).
The same combinations on Linux and, on top, a few on Windows and macOS: not all of them, which would
be over 50 jobs, but Python 3.12 with the long-term-support versions of Django.

Those few have already earned their place. A page of
[Django Cotton Gallery](https://velezanthony.github.io/django-cotton-gallery/) showed the path of the
components folder with `str(path)`, which on Windows uses backslashes (`C:\…\templates\cotton`). In
the [first PR](https://github.com/velezanthony/django-cotton-gallery/pull/1), every Linux and macOS
job passed and only the two Windows ones failed
([Django 4.2](https://github.com/velezanthony/django-cotton-gallery/actions/runs/28534007983/job/84590583389)
and
[Django 5.2](https://github.com/velezanthony/django-cotton-gallery/actions/runs/28534007983/job/84590583394)).
The [fix](https://github.com/velezanthony/django-cotton-gallery/commit/fcb8a9d0e0e76a9351f30e192af64ab1b47fe259)
was to change `str(path)` to `path.as_posix()`, which uses `/` on every system. Without Windows in
the matrix, a user would have found it.

**In depth:** [The CI matrix: what only fails on another version or another system](matriz-ci-python.md).

## 7. The package: check it before publishing

If you publish to PyPI, the package can also come out broken: a missing file, metadata PyPI rejects.
In [Django Cotton Gallery](https://velezanthony.github.io/django-cotton-gallery/), the release
workflow
([`release.yml`](https://github.com/velezanthony/django-cotton-gallery/blob/main/.github/workflows/release.yml))
builds the package with `python -m build` and validates it with `twine check` before uploading it.

The project itself has an example of why it matters. Version 1.32 of
[hatchling](https://hatch.pypa.io/), the tool that builds the package, generates metadata in a newer
format than `twine` accepts. That is why the
[`pyproject.toml`](https://github.com/velezanthony/django-cotton-gallery/blob/main/pyproject.toml)
caps it at `hatchling<1.32`, with a comment explaining why.

## 8. Everything passing before each commit

If the checks only run in CI, you find out late. With [pre-commit](https://pre-commit.com/)
([its configuration](https://github.com/velezanthony/django-cotton-gallery/blob/main/.pre-commit-config.yaml)),
Ruff runs on every `git commit` and fixes what it can before the change is saved. And so you do not
have to remember commands, a
[`Makefile`](https://github.com/velezanthony/django-cotton-gallery/blob/main/Makefile) with one per
task:

| Command | What it does |
|---|---|
| `make lint` | Ruff checks the code |
| `make typecheck` | mypy in strict mode |
| `make test` | the tests on your Python version |
| `make matrix` | tox with every combination |

A lesson from here: **the hook and CI versions must match**. In a
[PR](https://github.com/velezanthony/django-cotton-gallery/pull/6) of
[Django Cotton Gallery](https://velezanthony.github.io/django-cotton-gallery/), the pre-commit hook
used Ruff 0.15.12 and CI used 0.15.20. Locally the code passed formatting, but in CI the
["Check formatting" step failed](https://github.com/velezanthony/django-cotton-gallery/actions/runs/28680973089/job/85064209151).
I fixed it by
[reformatting with the CI version](https://github.com/velezanthony/django-cotton-gallery/commit/fa08fb2f499269c3547d8096cc90a6d7aeb34e8a)
and
[bumping the hook's](https://github.com/velezanthony/django-cotton-gallery/commit/41a5b69c27d7452d71a21fcb352608bcc2ff4be3),
which now carries a comment to keep them in sync.

## Others worth knowing

I do not use them in these projects, but they solve problems you will run into eventually:

- **[import-linter](https://import-linter.readthedocs.io/)** enforces architecture rules: for
  example, that the domain layer imports nothing from the web layer.
- **[nox](https://nox.thea.codes/)** does the same as tox, but its configuration is written in
  Python instead of an `.ini` file.

## Summary

| Layer | Tool | What it catches | When |
|---|---|---|---|
| Environment | uv | "it works on my machine" | on install |
| Style and traps | Ruff | mutable default arguments, unused imports | on every commit and in CI |
| Types | strict mypy and Pyright | unexpected `None`, types that do not fit | in the editor and in CI |
| Type contract | type tests | types that stop rejecting wrong code | in CI |
| Behaviour | pytest, Hypothesis, Playwright | broken logic, odd inputs, the page in the browser | locally and in CI |
| Test quality | coverage and mutation testing | untested code, tests that check nothing | in CI |
| Dependencies | Dependabot, deptry, pip-audit | old versions, undeclared dependencies, vulnerabilities | weekly and in CI |
| Compatibility | tox and the CI matrix | Python and Django versions, Windows and macOS | locally and in CI |
| Package | `build` and `twine check` | a package PyPI rejects | on release |

No layer replaces the others. Together they do what the compiler did in .NET, and quite a bit more.

## References

- [uv](https://docs.astral.sh/uv/)
- [Ruff: rules](https://docs.astral.sh/ruff/rules/)
- [mypy: strict mode](https://mypy.readthedocs.io/en/stable/command_line.html#cmdoption-mypy-strict)
- [django-stubs](https://github.com/typeddjango/django-stubs)
- [PEP 561: distributing typed packages (`py.typed`)](https://peps.python.org/pep-0561/)
- [Pyright](https://microsoft.github.io/pyright/)
- [pytest](https://docs.pytest.org/)
- [Hypothesis](https://hypothesis.readthedocs.io/)
- [Playwright for Python](https://playwright.dev/python/)
- [tox](https://tox.wiki/)
- [GitHub Actions: matrices](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/run-job-variations)
- [pre-commit](https://pre-commit.com/)
- [pytest-cov](https://pytest-cov.readthedocs.io/)
- [Stryker](https://stryker-mutator.io/)
- [mutmut](https://mutmut.readthedocs.io/)
- [Dependabot](https://docs.github.com/en/code-security/dependabot)
- [deptry](https://deptry.com/)
- [pip-audit](https://github.com/pypa/pip-audit)
- [twine](https://twine.readthedocs.io/)
- [import-linter](https://import-linter.readthedocs.io/)
- [nox](https://nox.thea.codes/)
