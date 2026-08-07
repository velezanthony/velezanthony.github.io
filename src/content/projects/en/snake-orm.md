---
slug: snake-orm
name: SnakeORM
headline: Typed relation traversal ORM for Python
tagline: Python ORM with deeply typed relation navigation. No codegen, no type-checker plugin and no runtime typing — mypy, Pyright and Pylance resolve it natively.
status: experimental
role: Author
order: 4
now: false
featured: false
stack:
  - Python
  - Type system
  - PostgreSQL
compat:
  - 'Python ≥ 3.11'
  - 'PostgreSQL'
quality:
  - 'Validated against both mypy and pyright'
  - '120+ test files'
  - 'Its own benchmarks'
  - 'MIT licence'
constraints:
  - 'No code generation: no build step that writes stubs.'
  - 'No type-checker plugin: mypy, Pyright and Pylance resolve it with what they already ship.'
  - 'No runtime typing: the types live in the annotations, not in checks performed while running.'
  - 'No complaints from mypy or ruff in strict mode.'
links:
  - label: Source
    href: https://github.com/velezanthony/laboratorio-snake-orm
todo: []
---

## The problem

Django's ORM works on magic strings:

```python
Truck.objects.filter(maker__nation__name="España")
```

That is text. The type checker does not know whether `maker` exists, whether `nation` hangs off it,
or whether `name` is the right field. Rename a field and the `filter` still compiles. The error
turns up at runtime — or worse, it does not: it just returns nothing.

Working with Django daily, that was the part I disliked. The question was whether you can have an
ORM where relation navigation is **actually typed**, and that also passes mypy and ruff in strict
mode without complaining.

## What it is

An experimental Python ORM whose goal is that relation navigation stays **typed all the way down
the chain**:

```python
Truck.maker.nation.name == "España"
```

The type checker knows the type of `maker`, of `nation` and of `name`, and complains if the chain
does not exist.

## Constraints

The four constraints are the whole project:

- **No code generation.** There is no build step writing stubs from the schema.
- **No type-checker plugin.** mypy, Pyright and Pylance resolve it with what they ship by default.
- **No runtime typing.** No type validation while running: the type checker does the work up front,
  and execution pays nothing for it.
- **Clean under strict mode.** mypy and ruff both pass.

Any one alone is easy. All four at once is the interesting problem.

## Decisions

### Declare models the SQLAlchemy way

**Context.** For the type checker to know a column's type, that type has to be written somewhere it
reads. With no codegen and no plugin, the only place left is the annotations.

**Decision.** Declare models the way SQLAlchemy 2.0 does: the annotation carries the type, the
descriptor carries the configuration.

```python
@snake_model(table="ex_authors")
class ExAuthor(SnakeModel):
    id: SnakeColumn[int] = snake_auto()
    name: SnakeColumn[str] = snake_column()
    public_id: SnakeColumn[uuid.UUID] = snake_column(unique=True, default_factory=uuid.uuid4)
    book_authors: SnakeToMany[ExBookAuthor] = snake_reverse("author")
```

`SnakeColumn[int]` is what makes everything else possible: the generic parameter travels down the
relation chain and survives to the end. Underneath they are **dataclasses**; the types do not exist
at runtime.

### None of this was possible when Django's ORM was born

And that is not a criticism of Django — it is a question of dates.

What holds the typed declaration up is **`dataclass_transform` (PEP 681), which landed in Python
3.11**. It lets a library tell the type checker that its own decorator behaves like `@dataclass`, so
the checker understands the declared fields without anyone generating stubs. It is the same piece
SQLAlchemy 2.0 and Pydantic v2 stand on.

SnakeORM requires **Python 3.11 or newer** and has used it from day one. Django's ORM is from 2005:
it does not just predate `dataclass_transform`, it predates variable annotations entirely. And it
cannot migrate without breaking every model written in twenty years.

**Backwards compatibility is a virtue in Django and a constraint I do not have to carry.** Starting
from scratch in 2026 means being able to assume a Python that did not exist back then.

**Consequences.** It is **extremely verbose compared to Django**. Every field is two pieces instead
of one: the annotation carrying the type and the descriptor carrying the configuration.

```python
# Django
name = models.CharField(max_length=100)

# SnakeORM
name: SnakeColumn[str] = snake_column(max_length=100)
```

Multiply that by every field of every model. That is the price of the typing, and it is paid in
full: with no codegen and no plugin, the only way the type checker knows the type is if it is
written down.

### Fail instead of guessing

Touching a relation that was never loaded does not fire a query behind your back: it raises
`SnakeRelationNotLoaded`. Same with `SnakeUnsupportedFeature` and `SnakeEmitError`.

That is not a shortcoming, it is a decision: **a silent N+1 is worse than a loud error**.

## What is inside

More than the word "laboratory" suggests: dialects and drivers kept separate (PostgreSQL over
psycopg), a query compiler, expressions and functions, migrations with `diff`, model inheritance,
relation prefetching, a CLI and benchmarks.

`examples/tour.py` is an executable tour against a real Postgres that prints, for every operation,
**the SQL it emitted and the result the database returned**. Documentation that cannot go stale,
because it runs.

## Limits

**It is far more verbose than Django.** This is not a side effect that can be polished away: it
follows directly from the constraints. If you want the type without generating code and without a
plugin, you write the type. Anyone coming from Django will feel it on the first model.

**It is not ready for a serious project, and it does not pretend to be.**

It has the basics. I maintain it on my own, so the surface it covers is the surface it covers. It is
a laboratory and I would rather say so than sell it as something else.

What it does have: **over 120 test files**, and every solution written from scratch.

And by "from scratch" I do not mean in a vacuum: **I leaned on studying how others solve it**,
because writing it meant understanding it first. It is not a fork of anything, but it did not come
out of nowhere either — it came out of reading, trying and learning how.

## Status

Experimental, in local development and not published yet. Open source, MIT licensed.
