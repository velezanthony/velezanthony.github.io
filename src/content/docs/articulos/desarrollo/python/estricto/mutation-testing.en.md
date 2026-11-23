---
slug: articles/development/python/strict/mutation-testing
seo:
  title: "Mutation testing in Python with mutmut"
  description: "Why 100 % coverage is not enough: mutation testing with mutmut, a real surviving mutant, and how to split it in CI with parallel shards and a cache."
  schema:
    - '@type': TechArticle
      headline: "Mutation testing: the test that tests your tests"
      description: "Why 100 % coverage is not enough: mutation testing with mutmut, a real surviving mutant, and how to split it in CI with parallel shards and a cache."
      inLanguage: en
      datePublished: '2026-11-23'
      dateModified: '2026-11-23'
      author:
        '@type': Person
        '@id': https://velezanthony.github.io/#anthony
        name: Anthony Velez Tapia
        url: https://velezanthony.github.io/
---

# Mutation testing: the test that tests your tests

You have 100 % coverage and everything is green. And there may still be a bug no test would see.
Coverage tells you which lines the tests **go through**, not whether they **check** what those lines
do.

Mutation testing measures it the other way round: it breaks your code on purpose and checks whether
any test complains. I explain it with a Python example I actually ran, and with the setup I use in
the CI of my library [@velezanthony/design](https://velezanthony.github.io/design/).

It is part of the [Strict Python](stack-python-estricto.md) series.

## 1. The idea: break the code and see who complains

It is a fire drill: you start a small fire on purpose and check whether the alarm goes off. The tool
makes small changes to your code, one at a time. Each changed version is a **mutant**. Some typical
examples:

| Original | Mutant |
|---|---|
| `if total >= 100:` | `if total > 100:` |
| `return total * 0.9` | `return total / 0.9` |
| `return True` | `return False` |

For each mutant it runs your tests:

- **Some test fails**: the mutant dies. Your tests protect that piece.
- **They all pass**: the mutant survives. You have found a change in behaviour that no test detects.

The score is the percentage of killed mutants.

## 2. A mutant that survives, for real

A 10 % discount from 100 € upwards, with its tests. It is a generic example, but I ran it with
[mutmut](https://mutmut.readthedocs.io/) 3.8.1:

::::tabs
:::tab[discount.py]
```python
def discount(total: float) -> float:
    """10 % off from 100 euros upwards."""
    if total >= 100:
        return total * 0.9
    return total
```
:::
:::tab[test_discount.py]
```python
def test_big_order_gets_discount() -> None:
    assert discount(200) == 180


def test_small_order_pays_full_price() -> None:
    assert discount(50) == 50
```
:::
::::

Both tests pass and coverage is 100 %: both branches of the `if` run. mutmut generates four mutants,
kills two and **two survive**:

```diff
-    if total >= 100:
+    if total > 100:
```

```diff
-    if total >= 100:
+    if total >= 101:
```

No test checks **exactly** 100 €, the boundary. If someone changes `>=` to `>`, a customer who spends
100 € loses their discount and everything stays green. One more test, and all four mutants die:

```python
def test_exactly_100_gets_discount() -> None:
    assert discount(100) == 90
```

That is the value of mutation testing: it does not tell you which lines are uncovered, it tells you
**which specific case** you are not testing.

## 3. mutmut: the minimal setup

In Python, the tool is mutmut, and it works with pytest. It is configured in `pyproject.toml`:

```toml
[tool.mutmut]
source_paths = ["src/shop/"]
pytest_add_cli_args_test_selection = ["tests/"]
```

And it is used with three commands:

| Command | What it does |
|---|---|
| `mutmut run` | Generates the mutants and runs the tests against each one |
| `mutmut results` | Lists the mutants that survived |
| `mutmut show <name>` | Shows a mutant's change, like the `diff` above |

:::warning[The old names are deprecated]

Many examples online use `paths_to_mutate` and `tests_dir`. In mutmut 3.8 they still work, but they
warn that they are deprecated: they are now `source_paths` and `pytest_add_cli_args_test_selection`.

:::

## 4. The problem: time

Each mutant runs the tests again, so the cost is **mutants times tests**. In the example there are 4
mutants and you do not notice. In a real project, you do.

I do not use mutmut in my Python projects yet, but I do use the same principle with
[Stryker](https://stryker-mutator.io/), the equivalent tool for TypeScript, in @velezanthony/design.
There, mutating the whole library means about 12,000 mutants. To give you an idea: a single machine
of the last full run, with 885 mutants, took 7 min 24 s.

Multiply that by the whole project and it does not fit in every PR. It has to be split.

## 5. The setup: parallel shards and a cache

I solved it with two workflows and a shared cache: on every PR, 2 machines that only rerun what
changed
([`mutation-incremental.yml`](https://github.com/velezanthony/design/blob/main/.github/workflows/mutation-incremental.yml)),
and by hand on `main`, a full run on 12 machines that rebuilds the cache
([`mutation.yml`](https://github.com/velezanthony/design/blob/main/.github/workflows/mutation.yml)).
The figures of that run are in the [series overview](stack-python-estricto.md); here is how the work
is split.

A small program,
[`scripts/mutation/cli.ts`](https://github.com/velezanthony/design/blob/main/scripts/mutation/cli.ts),
acts as the conductor:

1. **`plan`** splits the files across the machines. It weighs each file by its lines of code,
   because mutants grow with them, and places them from heaviest to lightest so every machine takes
   about as long
   ([`shards.ts`](https://github.com/velezanthony/design/blob/main/scripts/mutation/shards.ts)). Like
   loading suitcases into several cars: the big ones first, each into the emptiest car.
2. Each machine runs Stryker on its own files only and saves its result.
3. **`merge`** joins everyone's results into a single report, which is saved as the cache.

:::note[Why the full run goes on `main`]

A PR can only read the caches of its own branch, its target branch and the default branch, never
those of a sibling branch. If the full run were started from another branch, PRs would not see its
cache and would have to mutate everything.

:::

## 6. An easy mistake: testing the enum with the enum itself

It looks harmless: the code returns a `StrEnum` and the test compares it with the same enum.

```python
class Status(StrEnum):
    PAID = "paid"
    PENDING = "pending"


def test_paid_when_fully_paid():
    assert status_for(100, 100) == Status.PAID
```

The problem is the value, `"paid"`. It is what gets stored in the database or sent by the API, and if
someone changes it, it breaks data that already exists. But nobody sees that change:

- **Not the test**, because it compares the enum with itself, like measuring a ruler against itself:
  if `"paid"` becomes `"payed"`, both sides change at once and it stays green.
- **Not mutation testing either**, because it never tries it. I checked: mutmut 3.8 only mutates the
  code inside functions and leaves the enum values as they are. Stryker does the same in TypeScript:
  it skips `enum` and `as const`.

The way out is to freeze those values **in the tests**, written by hand in a module of their own, and
import them from there instead of from the code:

::::tabs
:::tab[tests/frozen.py]
```python
"""Values that leave the system (database, API). Changing them breaks stored data."""

STATUS_PAID = "paid"
STATUS_PENDING = "pending"
```
:::
:::tab[tests/test_orders.py]
```python
from shop.orders import Status, status_for
from tests import frozen


def test_status_values_are_the_stored_ones():
    assert {status.name: status.value for status in Status} == {
        "PAID": frozen.STATUS_PAID,
        "PENDING": frozen.STATUS_PENDING,
    }


def test_paid_when_fully_paid():
    assert status_for(100, 100) == frozen.STATUS_PAID
```
:::
::::

If someone changes `"paid"` in the code, both tests fail. I checked: with the test that compared the
enum with itself, the change passed in green. And if the change is intentional, it shows in the PR,
because `frozen.py` has to be touched.

The same goes for `IntEnum`: the number you store is the contract, and it is frozen in the tests.

## 7. When it is worth it

Do not turn it on for the whole project or on every commit. Pick the modules where a silent failure is
expensive:

| Yes | Not so much |
|---|---|
| Business logic: prices, discounts, permissions | Templates and views that only display data |
| Calculations and conversions | Configuration |
| Input validation | Generated code |

In mutmut, that means narrowing `source_paths` to those folders.

## Summary

- Coverage tells you which code runs; mutation testing tells you whether the tests **check**
  anything.
- A surviving mutant points to a specific untested case, like the 100 € boundary in the example.
- In Python, the tool is mutmut: `source_paths` in `pyproject.toml` and `mutmut run`.
- It costs mutants times tests. Narrow it to what is critical and, if it grows, split it in CI with
  parallel shards and a cache that only reruns what changed.
- Neither mutmut nor Stryker mutates enum values. If they are stored or published, freeze them in a
  test module and compare against it.

## References

- [mutmut](https://mutmut.readthedocs.io/)
- [Stryker](https://stryker-mutator.io/)
- [Stryker: incremental mode](https://stryker-mutator.io/docs/stryker-js/incremental/)
- [GitHub Actions: restrictions for accessing a cache](https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching#restrictions-for-accessing-a-cache)
- [@velezanthony/design: `mutation.yml`](https://github.com/velezanthony/design/blob/main/.github/workflows/mutation.yml)
- [@velezanthony/design: `mutation-incremental.yml`](https://github.com/velezanthony/design/blob/main/.github/workflows/mutation-incremental.yml)
- [@velezanthony/design: `scripts/mutation/`](https://github.com/velezanthony/design/tree/main/scripts/mutation)
