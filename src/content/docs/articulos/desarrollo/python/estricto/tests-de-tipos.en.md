---
slug: articles/development/python/strict/type-tests
seo:
  title: "Type tests in Python"
  description: "How to prove your types accept what is right and reject what is wrong: assert_type, expected errors, and mypy and Pyright run from pytest."
  image:
    src: /og/articles/development/python/strict/type-tests.png
    alt: "Type tests in Python"
  schema:
    - '@type': TechArticle
      headline: "Type tests: making the types say what they promise"
      description: "How to prove your types accept what is right and reject what is wrong: assert_type, expected errors, and mypy and Pyright run from pytest."
      image: https://velezanthony.github.io/og/articles/development/python/strict/type-tests.png
      inLanguage: en
      datePublished: '2026-11-23'
      dateModified: '2026-11-23'
      author:
        '@type': Person
        '@id': https://velezanthony.github.io/#anthony
        name: Anthony Velez Tapia
        url: https://velezanthony.github.io/
---

# Type tests: making the types say what they promise

For a while, the type test of [SnakeORM](https://velezanthony.github.io/snake-orm/) passed in green
without reading a single mypy error. I explain why at the end; first, what a type test is.

In most projects, types help you write the code. In SnakeORM, an ORM, the types **are** the product:
the idea is that a badly written query does not get past the type checker, just as it would not
compile in C#. I explain it in [A typed ORM without code generation](../orm-tipado-sin-generar-codigo.md).

If the types are the product, they are tested like the product. Normal tests cannot do it: types do
not exist at runtime. You need another kind of test, one that reads the type checker.

It is part of the [Strict Python](stack-python-estricto.md) series.

## 1. What needs testing

A type can fail in two ways, and both need watching:

| Failure | Example | How you notice |
|---|---|---|
| **It stops accepting what is right** | a valid query now raises a type error | right away: everyone's code turns red |
| **It stops rejecting what is wrong** | `truck.made_up_attribute` no longer errors | **you don't**: everything stays green and the hole stays open |

The second one is the dangerous one. A test that only checks what works proves nothing: what you
must show is that what is forbidden stays forbidden. It is like testing a lock: it is not enough
that your key opens it; you have to check the others don't.

## 2. Positive cases: `assert_type`

[`assert_type`](https://docs.python.org/3/library/typing.html#typing.assert_type) asks the checker to
confirm the exact type of a value. At runtime it does nothing: it returns the value as is. Its job is
static.

SnakeORM has a file,
[`cases_positive.py`](https://github.com/velezanthony/snake-orm/blob/main/src/test/typing/cases_positive.py),
full of functions nobody calls. They are only there for mypy and Pyright to read:

```python
def check_call_returns_a_typed_list_of_rows(session: SnakeSession) -> None:
    rows = session.call("calcular_nomina", [1234], into=Nomina)
    assert_type(rows, list[Nomina])
    assert_type(rows[0].bruto, Decimal)
```

If a change turns `rows` into `list[Any]`, `assert_type` errors. Careful: it compares the **exact**
type and does not accept subtypes. If all you care about is that the value is usable for something,
say a `filter()`, annotate it in a variable: that also accepts subtypes.

```python
comparison: SnakeCondition = Truck.id > 3
like: SnakeCondition = Truck.model.like("Ib%")
```

## 3. Negative cases: expected errors

The other file,
[`cases_negative.py`](https://github.com/velezanthony/snake-orm/blob/main/src/test/typing/cases_negative.py),
contains errors **on purpose**. Every line that must fail carries a comment with the error code it
has to produce. The most interesting one is an operation that makes no sense:

```python
Truck.id.like("3%")  # EXPECT: misc
```

`like()` on a numeric column makes no sense in SQL, and the column's type stops it before the query
reaches the database. The other cases are simpler:

::::tabs
:::tab[An attribute that does not exist]
```python
truck = Truck(id=1, model="Ibiza", maker_id=1)
truck.no_declarada  # EXPECT: attr-defined
```
:::
:::tab[A type that does not fit]
```python
truck = Truck(id=1, model="Ibiza", maker_id=1)
model: str = truck.id  # EXPECT: assignment
```
:::
::::

## 4. The test that ties it all together

[`test_type_checkers.py`](https://github.com/velezanthony/snake-orm/blob/main/src/test/typing/test_type_checkers.py)
is a normal pytest test that **runs mypy and Pyright** on those two files and reads what they say:

| File | mypy | Pyright |
|---|---|---|
| `cases_positive.py` | zero errors | zero errors |
| `cases_negative.py` | one error on every `# EXPECT:` line, with that exact code, and on no other line | an error on the same lines |

Both checkers must agree on **which lines** they reject. The codes are only compared with mypy,
because Pyright uses other names for the same errors.

The core is short: it pulls the expected lines out of the comments and compares them with mypy's
output.

```python
_EXPECT = re.compile(r"#\s*EXPECT:\s*(?P<code>[a-z-]+)\s*$")


def test_negative_cases_fail_mypy_exactly_where_expected() -> None:
    assert _mypy_errors(NEGATIVE) == _expected_errors(NEGATIVE)
```

`_mypy_errors` runs mypy and reads every line in the `file:line: error: message [code]` format. For
Pyright it asks for JSON output (`--outputjson`), which is easier to read than the text.

:::note[They are slow: they run apart]{collapsed}

Running two type checkers takes longer than a normal test. That is why they carry the `typecheck`
marker, declared in `pyproject.toml`, and can be skipped with `pytest -m 'not typecheck'` while you
work. In CI they always run.

:::

## 5. What these tests have already caught

The test file itself keeps two real problems in its comments, and that is why it is the way it is.

**A green test that checked nothing.** mypy honours the `FORCE_COLOR` variable, which many terminals
and CI servers turn on. With it, every mypy line arrives wrapped in colour codes and the regular
expression does not recognise it. Result: no errors read, which the test took as "the checker
accepts code that should not compile". Since then it asks for output without colour
(`--no-color-output`) and also checks that mypy **actually ran**:

```python
assert result.returncode in (0, 1), "mypy did not run"
```

An empty list can mean "no errors" or "the checker never started". It is a phone that does not ring:
maybe nobody is calling, or maybe you have no signal.

**A check nobody ran.** At first, the tests only checked the two case files, and Pyright on the rest
of the package depended on someone typing `make pyright`. While nobody did, a change in an async
function made the async drivers stop meeting their contract, and nobody saw it because Pyright was
not checking them. Now the suite runs Pyright on the whole package, and another test checks that the
`Makefile` checks exactly the same, so the two safety nets cannot drift apart unnoticed.

## 6. Other ways to do it

You do not have to build it by hand:

- **[typeshed](https://github.com/python/typeshed)**, the repository of types for the standard
  library, uses `assert_type` for positive cases and `# type: ignore` for negative ones. With
  `--warn-unused-ignores` in mypy (or `reportUnnecessaryTypeIgnoreComment` in Pyright), a
  `# type: ignore` that is no longer needed is an error: if a line stops failing, the test says so.
- **[pytest-mypy-plugins](https://github.com/typeddjango/pytest-mypy-plugins)**, from the
  django-stubs team, describes each case in YAML with the code and mypy's expected output.

The advantage of SnakeORM's approach is that it runs **both** checkers and requires them to agree.

## Summary

- If your types are part of what you ship, **test them**: what they accept and, above all, what they
  reject.
- **Positive cases** with `assert_type`, which pins down the exact type.
- **Negative cases** with expected errors marked line by line.
- **A pytest test** that runs mypy and Pyright, compares their output and checks they actually ran.

## References

- [Python: `typing.assert_type`](https://docs.python.org/3/library/typing.html#typing.assert_type)
- [Typing: testing with `assert_type` and `--warn-unused-ignores`](https://typing.readthedocs.io/en/latest/source/quality.html#testing-using-assert-type-and-warn-unused-ignores)
- [typeshed: regression tests](https://github.com/python/typeshed/blob/main/tests/REGRESSION.md)
- [pytest-mypy-plugins](https://github.com/typeddjango/pytest-mypy-plugins)
- [mypy: `--warn-unused-ignores`](https://mypy.readthedocs.io/en/stable/command_line.html#cmdoption-mypy-warn-unused-ignores)
- [Pyright: command-line options](https://microsoft.github.io/pyright/#/command-line)
- [pytest: markers](https://docs.pytest.org/en/stable/how-to/mark.html)
