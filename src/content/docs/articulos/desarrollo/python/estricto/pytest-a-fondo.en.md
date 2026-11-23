---
slug: articles/development/python/strict/pytest-in-depth
seo:
  title: "pytest in depth: fixtures, flaky tests"
  description: "pytest beyond the basics: typed fixtures, pytest-django, Hypothesis with st.data(), Playwright without fixed waits, and warnings that sneak into your tests."
  schema:
    - '@type': TechArticle
      headline: "pytest in depth: from fixtures to tests that fail sometimes"
      description: "pytest beyond the basics: typed fixtures, pytest-django, Hypothesis with st.data(), Playwright without fixed waits, and warnings that sneak into your tests."
      inLanguage: en
      datePublished: '2026-11-23'
      dateModified: '2026-11-23'
      author:
        '@type': Person
        '@id': https://velezanthony.github.io/#anthony
        name: Anthony Velez Tapia
        url: https://velezanthony.github.io/
---

# pytest in depth: from fixtures to tests that fail sometimes

In the 1.0.0 release of [Django Cotton Gallery](https://velezanthony.github.io/django-cotton-gallery/),
a test failed in just one of the 20 jobs in the matrix. You rerun it, it goes green, and the problem
is still there.

A test that always fails is easy: you read it and fix it. The troublesome one is the test that fails
**sometimes**. Here I go through two real ones, that one and another from
[SnakeORM](https://velezanthony.github.io/snake-orm/), what they had in common and, first, the pytest
pieces they use.

It is part of the [Strict Python](stack-python-estricto.md) series.

## 1. Fixtures: setting the stage, with types

A fixture is a function that prepares what the test needs and tidies up afterwards. With `yield`,
what comes before prepares and what comes after cleans up, even if the test fails.

In SnakeORM, a fixture opens a session against the database, creates the table and closes it at the
end ([`test_round_trip_property.py`](https://github.com/velezanthony/snake-orm/blob/main/src/test/integration/test_round_trip_property.py)):

```python
@pytest.fixture(scope="module", params=["postgres", "sqlite"])
def session(request: pytest.FixtureRequest) -> Iterator[SnakeSession]:
    driver, dialect = _connect(request.param)
    ...
    try:
        yield SnakeSession(driver, dialect)
    finally:
        driver.close()
```

Three details in four lines:

| Detail | What it does |
|---|---|
| `scope="module"` | One session for every test in the file, not one per test |
| `params=[...]` | Each test that uses it runs twice: once with Postgres and once with SQLite |
| `-> Iterator[SnakeSession]` | The type of what `yield` hands over. mypy and the editor know what the test receives |

Typing fixtures costs one line and gives you autocompletion in every test that uses them.

## 2. pytest-django: a real server for the browser

[pytest-django](https://pytest-django.readthedocs.io/) ships ready-made fixtures for Django. The
browser tests in Django Cotton Gallery chain four of them
([`conftest.py`](https://github.com/velezanthony/django-cotton-gallery/blob/main/src/tests/e2e/conftest.py)):

```python
@pytest.fixture
def live_gallery(transactional_db, live_server, cotton_tree, settings):
    settings.TEMPLATES = [...]  # the gallery reads a temporary components folder
    ...
```

- **`live_server`** starts a Django server on a free port, which the browser connects to.
- **`transactional_db`** provides a database that this server, on another thread, can see.
- **`settings`** changes the configuration only for the duration of the test and restores it
  afterwards.
- **`cotton_tree`** is a custom one: it creates a folder of test components in `tmp_path`.

:::note[Playwright and Django on different threads]{collapsed}

Playwright runs its event loop on another thread, and Django refuses to close connections from an
async context (`SynchronousOnlyOperation`). The gallery's `conftest.py` sets
`DJANGO_ALLOW_ASYNC_UNSAFE=true` before importing Django, only in the tests.

:::

## 3. Hypothesis with fixtures: `st.data()`

In the [series overview](stack-python-estricto.md) I described SnakeORM's round-trip test, which uses
the `session` fixture above: any value you save must come back identical. Its signature has three
pieces worth explaining:

```python
@pytest.mark.parametrize("field", sorted(_FIELDS), ids=str)
@given(data=st.data())
@settings(max_examples=60, suppress_health_check=[HealthCheck.function_scoped_fixture])
def test_any_value_of_the_type_round_trips(field, session, data) -> None:
    value = data.draw(_FIELDS[field], label=field)
    ...
```

| Piece | Why |
|---|---|
| `st.data()` and `data.draw(...)` | The strategy depends on `field`, which comes from `parametrize`. With `st.data()` the value is picked **inside** the test, once you know which column it is |
| `max_examples=60` | The default is 100 examples; here, 60. Each one writes to and reads from a real database, on two engines and for every type |
| `suppress_health_check` | Hypothesis warns when a test with `@given` uses a function-scoped fixture, because that fixture is reset once per test, **not** once per example. It is silenced here on purpose |

Since no fixture is reset between examples, the test cleans up by hand: every example ends with a
`rollback`, even if it fails, so the hundreds of examples do not step on each other. On Postgres, a
failed statement also leaves the transaction unusable, and without that `rollback` the next example
would die because of it rather than because of its own error.

## 4. The test that failed in one of twenty

Using pytest-django's server, a test checked that the component comparison page renders each panel in
its own `iframe`. In the 1.0.0 release it failed in
[just one job of the matrix](https://github.com/velezanthony/django-cotton-gallery/actions/runs/34703673399/job/103579742357),
Python 3.10 with Django 5.2. The other nineteen passed:

```text
FAILED test_compare_isolation.py::test_both_panels_render_in_their_own_document
AssertionError: assert 1 == 2
```

The bug was in a line that looks harmless:

::::tabs
:::tab[Before]
```python
expect(page.locator(FRAME).first).to_be_attached(timeout=5000)
assert page.locator(FRAME).count() == page.locator(PANEL).count()
```
:::
:::tab[After]
```python
# `count()` reads once; the second panel may still be on its way.
expect(page.locator(FRAME)).to_have_count(page.locator(PANEL).count(), timeout=10000)
```
:::
::::

`count()` is a snapshot; `expect()` is watching from the window until the person you are waiting for
arrives. `count()` counts **once** and does not wait. The first line waited for the first `iframe`,
but not for the second: on a slightly slower machine, the second had not arrived yet and the test
saw 1 of 2. `expect(...).to_have_count(...)` **retries** until the number matches or time runs out.

The [fix](https://github.com/velezanthony/django-cotton-gallery/commit/00ca74c7e9c5f8f0f1898fe9df6ffeb5b798e2c2)
([PR #14](https://github.com/velezanthony/django-cotton-gallery/pull/14)) changed six checks with the
same shape, and along the way removed a `wait_for_timeout(1500)`: instead of sleeping for a second
and a half, it waits for the page to change.

:::tip[The Playwright rule]

Check with `expect(...)`, which retries, and not with values read once (`count()`,
`text_content()`, `is_visible()`). And do not sleep: `wait_for_timeout` is setting an alarm blind,
you either wait too long or wake up too early.

The only fixed wait that makes sense is one that checks that something does **not** happen: a retry
cannot prove an absence. That is why the gallery keeps only those.

:::

## 5. The warning that was not ours

The second case did not depend on the machine, but on the garbage collector. In SnakeORM, a test
checks that a bulk write raises a warning, and counts it with `catch_warnings`. On Python 3.14 it
[failed](https://github.com/velezanthony/snake-orm/actions/runs/33928219907/job/101201418466):

```text
AssertionError: assert 2 == 1
  where 2 = len([<WarningMessage {message : ResourceWarning('unclosed database in <sqlite3.Connection ...>')
```

`catch_warnings(record=True)` stores **everything** that warns during that block, whoever it comes
from: it is an open microphone in the room, recording your voice and the neighbour's cough too. And
right then the garbage collector closed the SQLite connection another test had left open, and Python
warned. It never happened locally, because it depends on when the collector runs.

::::tabs
:::tab[Before]
```python
assert len(recorded) == 1
```
:::
:::tab[After]
```python
# Only OURS: catch_warnings records everything that lands in the window.
ours = [one for one in recorded if issubclass(one.category, SnakeWarning)]
assert len(ours) == 1
```
:::
::::

The [fix](https://github.com/velezanthony/snake-orm/commit/239a11cf9a073baac79ea27a9bc95c76b3fa2193)
filters by the warning class the test measures. For these cases pytest ships
[`pytest.warns(SnakeWarning)`](https://docs.pytest.org/en/stable/how-to/capture-warnings.html), which
checks for one specific type.

## 6. What they have in common

Both tests read the state **at one instant** and assumed nothing else was going on: a second panel
still on its way, a foreign warning landing in the window. A test that fails sometimes is almost
never bad luck: a stable test waits for what it is looking for and measures only its own.

## Summary

| Problem | What to do |
|---|---|
| Set up and clean up | Fixtures with `yield`, typed, with the right `scope` |
| Test against several engines | `params` on the fixture |
| A browser test that fails sometimes | `expect(...)`, which retries; no `count()` or `wait_for_timeout` |
| A warning count that fails sometimes | Filter by your warning class or use `pytest.warns` |
| Hypothesis with strategies that depend on another parameter | `st.data()` and `data.draw()` |
| Hypothesis with fixtures | Clean up in every example, because the fixture does not |

## References

- [pytest: fixtures](https://docs.pytest.org/en/stable/how-to/fixtures.html)
- [pytest: warnings and `pytest.warns`](https://docs.pytest.org/en/stable/how-to/capture-warnings.html)
- [pytest-django: fixtures](https://pytest-django.readthedocs.io/en/latest/helpers.html)
- [Playwright for Python: assertions](https://playwright.dev/python/docs/test-assertions)
- [Hypothesis: `st.data()`](https://hypothesis.readthedocs.io/en/latest/reference/strategies.html#hypothesis.strategies.data)
- [Hypothesis: health checks](https://hypothesis.readthedocs.io/en/latest/reference/api.html#hypothesis.HealthCheck)
- [Python: `warnings.catch_warnings`](https://docs.python.org/3/library/warnings.html#warnings.catch_warnings)
