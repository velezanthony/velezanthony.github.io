---
slug: snake-orm
name: SnakeORM
headline: Typed Python ORM for mypy and Pyright
tagline: "A Python ORM that shouts instead of guessing: deeply typed relation navigation, no codegen, no type-checker plugin. mypy and Pyright read it natively."
cvLine: "A Python ORM with typed relation navigation that mypy and Pyright resolve with no codegen."
status: maintained
role: Author
order: 1
now: false
featured: true
stack:
  - Python
  - Type system
  - PostgreSQL
targets:
  - mypy
  - Pyright
  - Pylance
  - Django
  - Flask
  - FastAPI
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
    href: https://github.com/velezanthony/snake-orm
  - label: PyPI
    href: https://pypi.org/project/snake-orm/
  - label: Documentation
    href: https://velezanthony.github.io/snake-orm/
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
    book_authors: SnakeToMany[ExBookAuthor] = snake_to_many("author")
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

### How the others solve it: with stubs and with plugins

This is the comparison that gives the constraints their point, because **the two big Python ORMs
need outside help to be typed** — or they used to.

**Django ships no types.** There is no `py.typed`, so a type checker has nowhere to get them: you
install `django-stubs`, a separate package, maintained by other people, trailing every release.

And that is not academic. The demos in this very project use Django, and I measured it:

```
the three demos under pyright, WITHOUT stubs:  382 errors
the three demos under pyright, WITH stubs:     132 errors
```

**The 250 in between were not defects in my code: they were Django untyped.** Without the stubs,
`request.POST.get()` comes out `type[Empty] | Unknown | list[Unknown] | Any`, and `self.client.get()`
comes out `WSGIRequest` — a request where there is a response.

**SQLAlchemy did both, and stopped doing them.** 1.x needed stubs (`sqlalchemy-stubs`, later
`sqlalchemy2-stubs`) **and** a mypy plugin on top. 2.0 threw both away. Its own documentation says
so without hedging:

> *"The SQLAlchemy Mypy Plugin is **DEPRECATED**, and will be removed in the SQLAlchemy 2.1
> release."*
>
> *"No stubs should be installed and packages like `sqlalchemy-stubs` and `sqlalchemy2-stubs`
> should be **fully uninstalled**."*

What allowed it? Exactly the piece above: `dataclass_transform`. The moment the language could say
"this decorator behaves like `@dataclass`", the plugin and the stubs stopped being needed.

**That is the road SnakeORM takes, and has taken since day one.** No stubs, no plugin, no codegen:
the type is written in the annotation and any checker reads it with what it already ships. The price
is the verbosity above — and it is a price, not an oversight.

### The catalogue that blows up at import

**Context.** A multi-engine ORM has to know what each engine CANNOT do. The two big ones solve it
with flags, and both implementations **fail open**: I measured it in their code.

```
SQLAlchemy  SuiteRequirements, 250 properties
            114 return exclusions.closed() BY DEFAULT
            -> a dialect that forgets to declare a capability inherits "unsupported"
               and its tests SKIP in silence. Nothing compares your class to the catalogue.

Django      BaseDatabaseFeatures, ~161 flags, ~137 plain booleans
            no NotImplementedError, no ABC, no check
            -> a backend that does not answer inherits the default
```

**Decision.** The dialect answers the **whole** catalogue — `Full()`, `Degraded(reason)` or
`Nope(reason)` — and **forgetting one blows up at import**. It fails closed.

**Why not a flag with a default.** Because a default is an answer nobody gave. The difference
between "this engine cannot" and "nobody remembered to look" is exactly the one that decides whether
a test checks anything, and a defaulted flag erases it for good.

**Price.** Adding a new capability breaks the three dialects at once, and you go to all three to
answer it. That is deliberate: that work is what guarantees nobody inherits an answer they never
thought about.

**And out of it comes something neither of them gives**: because the catalogue is complete, the
session can walk it and warn at startup about what your engine will not manage with the models you
declared. In Django `connection.features` is reported by no command; in SQLAlchemy there is no API
that enumerates capabilities.

### What I decided NOT to build

**Context.** SQLAlchemy ships an identity map, a unit of work and lazy loading. They are half of
what people use its `Session` for, so leaving them out is the most expensive decision in the project
and the one that costs me the most users.

**Decision.** None of the three goes in.

**Why.** All three share a property: **they fix your problem without telling you.** Lazy loading
turns a loop into N queries and you find out in production. The unit of work reorders and batches
your writes, so the SQL that runs is not the SQL you wrote. The identity map makes two queries
return the same object, which is convenient until the day you do not understand it.

The ORM's rule is **shout, never fix it behind my back**. Those three are exactly the opposite, and
adding them would have been two doctrines fighting inside one package.

**Price.** With no identity map, two queries against the same row return two objects: `a == b` is
`True` by primary key, but `a is b` is `False`. It is written on the limits page, because a limit
the user discovers alone is a bug by another name.

**Good consequence.** The silent N+1 stops being possible by construction rather than by discipline.

### Two axes that never mix

**Context.** Supporting several engines usually gets solved with conditionals scattered through the
emitter. That works with two and rots with three.

**Decision.** Separate the **dialect** (how the SQL is *written*: placeholders, quoting, `LIMIT`,
`RETURNING`, upsert) from the **driver** (how it is *executed*: the library, the connection, the
transaction). Two distinct `Protocol`s that never touch, and a metadata graph **100% engine
agnostic**.

**The prediction, which is what makes the decision checkable.** If the seam was in the right place,
a new engine had to be **one new file in `dialects/` and one in `drivers/`, never a refactor**. It
was written down before the second engine existed.

**Result.** It held for MySQL/MariaDB and it held for SQLite. And the same seam absorbed the
asynchronous colour: generating SQL does not execute, so it **has no colour** and is reused as is —
`AsyncSession` went in without touching the compiler or the dialect.

Getting a separation right before you have the second case is the hard part. With three engines in
front of you, anybody can see the line.

### The composite `IN`: why the obvious solution was the bad one

**Context.** If composite primary keys are first class, asking for a set of them is the everyday
query. With a simple key it is `User.id.in_([7, 12, 30])` and done. With a composite one, all the
API let you write was an `in_()` per column:

```sql
WHERE warehouse_id IN (7, 9) AND product_id IN (3, 1)
```

You ask for two rows — `(7,3)` and `(9,1)` — and four arrive. That is the **cartesian product**: you
crossed "the warehouses I care about" with "the products I care about", which is a different
question. And on a small fixture the two answers coincide, so it goes through unseen.

**The first design, and the two measurements that sank it.** The natural thing is a positional
tuple:

```python
snake_tuple(Stock.warehouse_id, Stock.product_id).in_([(7, 3)])
```

1. **When both columns share a type, the swap is invisible.** `[(3, 7)]` instead of `[(7, 3)]`
   passes mypy **and** pyright without a complaint, and returns the wrong rows in silence. With
   equal types, position is the only information and the checker has nothing to compare.
2. **It has a ceiling.** A positional signature needs **one overload per arity**: one for two
   columns, another for three, another for four, written by hand until you get tired. And in this
   ORM identifying relationships widen the key level by level — 2, 3, 4, N — so the ceiling lands
   right on top of the usual case.

**Decision.** No positions at all.

```python
snake_keys(Stock).in_([
    snake_key(Stock).set(Stock.warehouse_id, 7).set(Stock.product_id, 3),
])
# WHERE (warehouse_id, product_id) IN ((?, ?))
```

Every value sits against its column. **The swap stops being an error to detect and becomes a
sentence you cannot write.** And `set()` is ONE signature called N times, so arity does not live in
the type: there is no maximum written anywhere. Verified under mypy and pyright with keys of 2, 3, 4
and 6 columns.

Slipping in a column of another model is caught by the **invariance** of `SnakeKey[M]`, without
putting the model inside the expression — which would have rejected legitimate two-table expressions
in a `join`.

### Fail instead of guessing

Touching a relation that was never loaded does not fire a query behind your back: it raises
`SnakeRelationshipNotLoaded`. Same with `SnakeUnsupportedFeature` and `SnakeEmitError`.

That is not a shortcoming, it is a decision: **a silent N+1 is worse than a loud error**.

## What went wrong

### The bug that could not fail

SQLite does not accept parentheses around the branches of a `UNION`, so it reads them left to right.
With a nested compound, that **changes the meaning**:

```
a.union(b.except_(c))

Postgres and MySQL  ->  []
SQLite              ->  [1, 4]
```

The same line of Python answering two different sets depending on the engine. Valid SQL, no errors,
nothing complains anywhere.

And what makes it interesting to me: **a test comparing SQL strings never sees it**, because the SQL
emitted is correct. It only shows up running the same expression against the three engines and
comparing the **rows**.

### A belief of mine, knocked down by a measurement of mine

The ORM had been saying, in its own docstring, *"if the tree can have cycles, give it a `limit()`"*.
I measured it against Postgres with a three-row cycle:

```
UNION ALL + limit(3), no order:   OK          <- it worked by accident
UNION ALL + order_by + limit(3):  NEVER RETURNS
```

The advice only held where the engine streams the result. With `order_by()` — that is, the normal
way to ask for a hierarchy — the sort has to produce every row before emitting one, and the limit
never gets its turn.

The fix was not correcting the sentence. It was **exposing the operator** so that whoever has cycles
can choose. A warning tells you that you have a problem; a parameter solves it.

### The defect none of my own tests could see

Somebody migrated a real product onto it: Django 6.0 with PostGIS, 60 tables, every data function
ported one at a time and compared against the ORM it replaced. Sixteen findings came out of that.
The worst one raised no error at all.

Navigating a relation that may have no partner emitted `INNER JOIN`. Rows whose key was `NULL`
disappeared — including the ones the query matched through another branch of an `OR`:

```
django    :  16 rows
snake-orm :   7 rows
```

No exception, no warning. Fewer rows.

And what makes it a sibling of the two above: **not one domain in my suite declared an optional
relation**. Every one I had was paired on both sides, so the wrong join type and the right one
returned exactly the same rows on every fixture I had written. The net was green because it could
not see the colour.

A defect a test domain **cannot express** is a defect no test can catch.

Fixing it took an afternoon. Finding out that my suite could not see it took somebody else's
product.

## What is inside

More than the word "laboratory" suggests: dialects and drivers kept separate (PostgreSQL over
psycopg), a query compiler, expressions and functions, migrations with `diff`, model inheritance,
relation prefetching, a CLI and benchmarks.

`examples/tour.py` is an executable tour against a real Postgres that prints, for every operation,
**the SQL it emitted and the result the database returned**. Documentation that cannot go stale,
because it runs.

## The demos are not a showcase: they are the test bench

An ORM is used from inside a framework, so testing it only from `pytest` leaves out the half the
user touches. There are **four applications** running on the same domain and the same data model:

- **Django, Flask and FastAPI**, each serving the same pages in HTML and **the same API in JSON** —
  `/api/something` is the mirror of `/something`.
- **A React client** that renders itself, carries its own routing, and talks to **any of the three**
  backends without changing a line.

And that fourth one is what turns parity into something checkable: **if a single client can point at
the three interchangeably, then the three APIs really are the same one.** Said in a README it means
nothing; with a client that switches backends, it does.

Three frameworks are also three different ways of integrating — WSGI, ASGI and Django's middleware —
so the integration seam gets tested in all three at once instead of in whichever I happened to be
using that day.

### The debug panel, and why there are five channels and not one

The interesting part is not that there is a panel: it is that **the channel is chosen by the tools
whoever is looking already has**, and that was the decision.

| channel | for whom |
|---|---|
| `ssr` | an HTML panel injected into the page, when what comes back is HTML |
| `envelope` | a block in the JSON and a table in text, for somebody in Postman **with no tooling** |
| `timing` | a `Server-Timing` header, for somebody who **does** have the browser devtools |
| `sidecar` | a token and its own page, for when the response cannot be touched |
| `otel` | spans over OTLP to a **Jaeger** or a Grafana, for somebody who already has a real tracer |

The HTML one carries a constraint that decides its whole implementation: **it is injected into
somebody else's page.** So it cannot request a single external resource — everything goes inline,
CSS and JavaScript — nor dirty anybody's DOM: it enters as one container of its own right before
`</body>`, and that marker is the **injection contract** the tests verify across the three
integrations.

That a debug panel cannot depend on the network is one of those things that look like a detail until
you deploy it behind a CSP.

## Limits

**It is far more verbose than Django.** This is not a side effect that can be polished away: it
follows directly from the constraints. If you want the type without generating code and without a
plugin, you write the type. Anyone coming from Django will feel it on the first model.

**It is published as a beta, and I maintain it on my own.**

That is the risk of using it, and I would rather say it that way than sell it as something else. Not
that it is half-finished — it works, and the suite proves it against the three real engines — but
that the surface it covers is one person's. Next to Django or SQLAlchemy you feel it the moment you
ask for something that is not there.

What it does have: a suite that **runs against the three engines for real**, with two switches that
turn "skipped, no server" into a failure — because without them a large part is skipped and the
suite comes out green anyway. And every solution written from scratch.

And by "from scratch" I do not mean in a vacuum: **I leaned on studying how others solve it**,
because writing it meant understanding it first. It is not a fork of anything, but it did not come
out of nowhere either — it came out of reading, trying and learning how.

## What I learned

**Reading does not find bugs. Running does.** I audited the query builder's surface by reading it
end to end and it came out clean. Running the operator matrix against the three engines produced
three silent-corruption defects. Since then, in this repository **a review by reading does not count
as verification**.

**Comparing engines has a blind spot.** That same net could not see a fourth bug: the ORM emitted
the **same wrong SQL** on all three, so all three agreed — and "all three agree" was the criterion.
The right witness was another one: what the same expression means in a flat query. **Every bug needs
its own independent oracle.**

**The symptom of a badly placed rule is not a red test.** It is that it **asks for something nobody
can justify**. A guard of mine forced a migration in one domain to declare a view belonging to a
different domain. That grated before anything failed, and I read it as "a datum is missing" instead
of "the criterion is wrong".

**Writing too much is debt.** Every sentence of a comment is a claim somebody has to keep true. When
the code goes stale a test turns red; when the prose goes stale, **nothing happens** — it stays
there, with the same authority, lying.

And the thread through all of it: in a mature codebase the failure is rarely absence. It is the
**false claim with authority**. A test whose name promises more than its body checks. A guide that
teaches a road that no longer works. A gate that measures something else and says *Success*.

## Status

Published on PyPI as a beta —`pip install --pre snake-orm`— and under active development. It has
not run in production yet. Open source, MIT licensed.
