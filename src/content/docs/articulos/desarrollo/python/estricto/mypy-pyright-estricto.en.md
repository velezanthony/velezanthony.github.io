---
slug: articles/development/python/strict/strict-mypy-pyright
seo:
  title: "mypy and Pyright in strict mode"
  description: "What mypy --strict turns on, the cache, Pyright and its modes, running both at once, where to relax without giving up, and what Python 3.14 annotations changed."
  image:
    src: /og/articles/development/python/strict/strict-mypy-pyright.png
    alt: "mypy and Pyright in strict mode"
  schema:
    - '@type': TechArticle
      headline: "mypy and Pyright in depth: strict mode without surprises"
      description: "What mypy --strict turns on, the cache, Pyright and its modes, running both at once, where to relax without giving up, and what Python 3.14 annotations changed."
      image: https://velezanthony.github.io/og/articles/development/python/strict/strict-mypy-pyright.png
      inLanguage: en
      datePublished: '2026-11-23'
      dateModified: '2026-11-23'
      author:
        '@type': Person
        '@id': https://velezanthony.github.io/#anthony
        name: Anthony Velez Tapia
        url: https://velezanthony.github.io/
---

# mypy and Pyright in depth: strict mode without surprises

In [SnakeORM](https://velezanthony.github.io/snake-orm/), mypy passed green on a whole layer of
demos. And it had not checked a single type between its modules.

Turning strict mode on is one line: `strict = true`. The hard part comes after: errors where you did
not expect them, a slower CI, two checkers that do not always agree, and options that switch
checking off without telling you. I explain it with SnakeORM and
[Django Cotton Gallery](https://velezanthony.github.io/django-cotton-gallery/).

It is part of the [Strict Python](stack-python-estricto.md) series.

## 1. What `strict = true` turns on

`--strict` is not one rule: it is a bundle of rules, and it grows with every release. When mypy adds
a new strict check, it goes into `--strict`. That is why you should pin the mypy version, or an
update can fill your CI with new errors without you touching the code.

:::note[The `--strict` options in mypy 1.20]{collapsed}

It is the version Django Cotton Gallery pins. Grouped by what they require:

| What it requires | Options |
|---|---|
| Everything has types | `disallow_untyped_defs`, `disallow_incomplete_defs`, `disallow_untyped_calls`, `disallow_untyped_decorators`, `check_untyped_defs` |
| `Any` does not slip in | `disallow_any_generics` (no bare `list`), `disallow_subclassing_any`, `warn_return_any` |
| No leftovers | `warn_unused_ignores`, `warn_redundant_casts` |
| What is public is explicit | `no_implicit_reexport` |
| Comparisons make sense | `strict_equality`, `strict_bytes`, `extra_checks` |

:::

## 2. The first clash: what you import is no longer exported

Of all the options, `no_implicit_reexport` is the most surprising. Without it, if an `__init__.py`
imports a name, anyone can import it from there. With it, a name only counts as public if you say
so. The `__init__.py` becomes a shop window: only what you put in it is for sale, not what is in the
stockroom.

There are two ways to say it, and both are valid for mypy. Django Cotton Gallery is
[moving](https://github.com/velezanthony/django-cotton-gallery/commit/3506d82110e22368200527c762599146ffb2e8a2)
from the first to the second, on a branch that is not in `main` yet:

::::tabs
:::tab[With `__all__`]
```python
from .cache import CatalogCache
from .resolver import ComponentNotFound, resolve

__all__ = ["CatalogCache", "ComponentNotFound", "resolve"]
```
:::
:::tab[With `X as X`]
```python
from .cache import CatalogCache as CatalogCache
from .resolver import ComponentNotFound as ComponentNotFound
from .resolver import resolve as resolve
```
:::
::::

The redundant alias (`X as X`) is the explicit export defined by PEP 484. Its advantage over
`__all__`: there is no separate list of strings that can drift out of date. Whatever has no alias,
like internal modules, stays private
([the same change in the linter and the preview](https://github.com/velezanthony/django-cotton-gallery/commit/6abb8fc9d15ec7fe07750e0780d67d0d5058883a)).

## 3. The cache in CI

mypy stores what it already checked in `.mypy_cache`, and Pyright stores nothing (the timings are in
the [series article](stack-python-estricto.md)). On your machine the cache is always there; CI starts
from scratch, and there you pay for the first run on every push. The fix is to keep the folder
between runs (generic example):

```yaml
- uses: actions/cache@v4
  with:
    path: .mypy_cache
    key: mypy-${{ hashFiles('uv.lock') }}-${{ github.sha }}
    restore-keys: mypy-${{ hashFiles('uv.lock') }}-
```

The key includes `uv.lock`: if the dependencies change, the cache starts over.

## 4. Pyright: four modes and no plugins

[Pyright](https://microsoft.github.io/pyright/) has no yes-or-no `strict`, but four levels in
`typeCheckingMode`: `off`, `basic`, `standard` (the default) and `strict`. And it can change level
per file, with a comment at the very top:

```python
# pyright: strict
```

The differences that matter most compared with mypy:

| | mypy | Pyright |
|---|---|---|
| Plugins | Yes, like django-stubs' | No |
| Level per file | With `[[tool.mypy.overrides]]` | With `# pyright: strict` or `basic` |
| In the editor | With a separate extension | It is the engine of Pylance in VS Code |

The plugins point weighs a lot in Django: without django-stubs' plugin, Pyright sees less of your
models. What each one sees, with measured examples, is in
[The typed Django ORM](django-orm-tipado.md).

## 5. Both at once, each with its own job

SnakeORM runs both, but not with the same strictness or on the same code. Its
[CI](https://github.com/velezanthony/snake-orm/blob/main/.github/workflows/ci.yml) splits it like
this:

| Step | On what | Why |
|---|---|---|
| `mypy .` | The whole repository, without `--strict` | Nothing is broken, without forcing the tests to be typed in detail |
| `mypy --strict src/snakeorm/` | Only the package | The project's promise is zero `Any` in what it publishes |
| `pyright src/snakeorm/` | Only the package, in its default mode | What someone using the ORM from VS Code sees |

Why is Pyright not in `strict`? Because the ORM uses `Any` internally, on purpose, so the types its
users see come out exact. Strict Pyright would flag all of them; mypy already guarantees none of
them leaks into the public code.

Two more details from the same project:

- **mypy checks against the minimum Python version.** mypy assumes your code will run on the same
  Python you run mypy with. If CI uses 3.14, it lets through syntax that does not exist in 3.11, and
  3.11 is what the package promises. That is why that step pins Python 3.11. Django Cotton Gallery
  does the same with `python_version = "3.10"` in its
  [`pyproject.toml`](https://github.com/velezanthony/django-cotton-gallery/blob/main/pyproject.toml).
- **A `# type: ignore` one checker needs is unnecessary for the other.** With two checkers on the
  same code, flagging unnecessary ignores would give false positives. SnakeORM only turns on
  `reportUnnecessaryTypeIgnoreComment` in the folders that only Pyright reads
  ([`pyproject.toml`](https://github.com/velezanthony/snake-orm/blob/main/pyproject.toml)).

## 6. Relaxing without giving up

Sometimes strictness costs more than it gives. The key is to relax **just enough and in the right
place**, not the whole project.

Django Cotton Gallery's example, which relaxes only its *templatetags*, is in the
[series article](stack-python-estricto.md). Here is the opposite: an option that seems to relax
little and switches off a lot.

`ignore_missing_imports` tells mypy not to complain about an import it cannot find. But what it
cannot find becomes `Any`, and everything that depends on it stops being checked, silently. It is
taking the battery out of the smoke detector: it stops beeping, and it also stops watching.

That is what happened in SnakeORM, and its `pyproject.toml` documents it: some demos that were
checked from the wrong folder could not resolve their imports, and mypy walked that whole layer
without checking a single type between modules. Before adding `ignore_missing_imports`, check that
the import really cannot be resolved.

And when you do need a `# type: ignore`, give it the error code: `# type: ignore[assignment]`. That
way it does not hide other errors on the same line, and `warn_unused_ignores` will tell you the day
it is no longer needed.

## 7. When Python changes the rules: the 3.14 annotations

Python 3.14 brought [PEP 649](https://peps.python.org/pep-0649/): annotations are evaluated lazily,
only when someone asks for them. One consequence: they are no longer in the class `__dict__`.

SnakeORM read each column's type that way, and on 3.14 it started getting an empty dictionary. Every
column fell back to `object`, and the ORM rejected it with this error
([CI log](https://github.com/velezanthony/snake-orm/actions/runs/33892126213/job/101086262725)):

```text
SnakeModelDefinitionError: Quoter.id is declared with snake_int(), which only applies to a int
column, but its type is 'object'.
```

That was 7 failed tests and 11 errors, only on Python 3.14, on Postgres and on SQLite. The
[fix](https://github.com/velezanthony/snake-orm/commit/919d2bd66f248f6120cd79d917399491ebc6c79b)
was one line:

::::tabs
:::tab[Before]
```python
for attr, raw in vars(klass).get("__annotations__", {}).items():
```
:::
:::tab[After]
```python
for attr, raw in inspect.get_annotations(klass).items():
```
:::
::::

`inspect.get_annotations` works the same on every version the ORM supports. Neither mypy nor
Pyright could warn about this: the code was type-correct; what changed was Python's behaviour. The
CI matrix found it, because it was already testing 3.14.

## Summary

- **`--strict` is a bundle of rules** that grows with every mypy release: pin the version.
- **`no_implicit_reexport`** forces you to declare what is public, with `X as X` or with `__all__`.
- **In CI, keep `.mypy_cache`** or you will always pay for the first run.
- **Pyright has four modes and does not support plugins.**
- **Both at once work** if each has its own job and its own strictness.
- **Relax per module,** never across the whole project, and be wary of `ignore_missing_imports`: it
  switches checking off without telling you.
- **Types do not protect you from Python changing:** that is what the version matrix is for.

## References

- [mypy: command line options (`--strict`)](https://mypy.readthedocs.io/en/stable/command_line.html#cmdoption-mypy-strict)
- [mypy: `--no-implicit-reexport`](https://mypy.readthedocs.io/en/stable/command_line.html#cmdoption-mypy-no-implicit-reexport)
- [mypy: incremental mode and cache](https://mypy.readthedocs.io/en/stable/command_line.html#incremental-mode)
- [mypy: per-module configuration](https://mypy.readthedocs.io/en/stable/config_file.html#per-module-and-global-options)
- [Pyright: configuration and `typeCheckingMode`](https://microsoft.github.io/pyright/#/configuration)
- [Pyright: per-file comments](https://microsoft.github.io/pyright/#/comments)
- [Pyright: differences from mypy](https://microsoft.github.io/pyright/#/mypy-comparison)
- [PEP 484: explicit exports](https://peps.python.org/pep-0484/#stub-files)
- [PEP 649: deferred evaluation of annotations](https://peps.python.org/pep-0649/)
- [`inspect.get_annotations`](https://docs.python.org/3/library/inspect.html#inspect.get_annotations)
- [django-stubs](https://github.com/typeddjango/django-stubs)
- [GitHub Actions: `actions/cache`](https://github.com/actions/cache)
