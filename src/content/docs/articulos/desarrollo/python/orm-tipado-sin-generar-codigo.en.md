---
slug: articles/development/python/typed-orm-without-code-generation
seo:
  title: "A typed Python ORM without codegen"
  description: "How to make mypy and Pyright understand a Python ORM without code generation or plugins: descriptors with overloaded __get__, generics and dataclass_transform."
---

# A typed ORM without code generation

In most Python ORMs, the type checker sees little more than `Any`. You write
`filter(seller__country__name="Spain")` and neither mypy nor Pyright can tell you whether `country`
exists, whether `name` is a string or whether you've made a typo. The error shows up at runtime.

This article explains the technique I use in [SnakeORM](https://velezanthony.github.io/snake-orm/),
an open-source ORM I'm writing that is still **in beta**, so that mypy and Pyright understand
models, columns, relations and queries **without code generation and without type checker
plugins**. Just with standard tools from Python's type system.

## The problem: a dynamic ORM returns `Any`

A dynamic ORM builds its attributes at runtime: metaclasses, `__getattr__`, field names as
strings. The type checker doesn't run the code, so the only thing it can infer is `Any`. And `Any`
isn't a type: it switches the checker off.

```python
def __getattr__(self, name: str) -> Any: ...

row.total * 2            # no error
label: str = row.total   # no error either: the same value, now "a str"
```

There are two usual ways out: generate stubs or code from the models, or write a mypy plugin
(which Pyright doesn't run). SnakeORM's idea is the third one: design the API so that the types
can be expressed with what the language already has.

## Step 1: the annotation is the source of truth

Each column is declared with a generic annotation. The Python type comes from the annotation; the
function on the right only adds SQL information (unique, index, default value):

```python
@snake_model(table="sellers")
class Seller(SnakeModel):
    id: SnakeColumn[int] = snake_auto()
    name: SnakeColumn[str] = snake_str(unique=True)
    country_id: SnakeColumn[int] = snake_int()
    country: SnakeToOne[Country] = snake_to_one(country_id)
    products: SnakeToMany[Product] = snake_to_many("seller")
```

`SnakeColumn[T]`, `SnakeToOne[M]` and `SnakeToMany[M]` are generic classes (`Generic[T]`). The
checker knows `T` and `M` without running anything.

## Step 2: descriptors with an overloaded `__get__`

The central piece is a descriptor whose `__get__` returns a different type depending on whether it
is accessed from the class or from an instance. `@overload` explains this to the checker:

```python
class SnakeColumn(Generic[T]):
    @overload
    def __get__(self, instance: None, owner: Any) -> SnakeExpr[T]: ...
    @overload
    def __get__(self, instance: object, owner: Any) -> T: ...
    def __get__(self, instance: object | None, owner: Any) -> Any:
        if instance is None:
            return SnakeExpr(...)  # class access: a SQL expression
        return ...                 # instance access: the loaded value
```

So the same declaration has two readings, both typed:

```python
seller.name          # instance -> str
Seller.name          # class    -> SnakeExpr[str]
Seller.name == "x"   # SnakeExpr.__eq__ returns a condition, not a bool
```

`SnakeExpr[T]` overloads the comparison operators to return a SQL condition. The ordering
comparisons (`<`, `<=`, `>`, `>=`) use the same `T` in their signature, so ordering a string
against an integer is a type error. `==` and `!=` aren't: Python requires `__eq__` and `__ne__` to
accept any `object` (so that `col == None` translates to `IS NULL`, for example), and there the
checker can't help.

```python
Seller.name > 3    # type error: __gt__ expects a str
Seller.name == 3   # no type error: __eq__ takes any object
```

## Step 3: deep navigation with `type[M]`

For "to-one" relations, the trick lies in what class access returns. The descriptor declares that
`Seller.country` returns `type[Country]`:

```python
class SnakeToOne(Generic[M]):
    @overload
    def __get__(self, instance: None, owner: Any) -> type[M]: ...
    @overload
    def __get__(self, instance: object, owner: Any) -> M: ...
```

Since the result is "the `Country` class", accessing `.name` on it triggers the class-level
`__get__` of `Country`'s descriptors again. Navigation chains by itself, to any depth, and every
link is typed:

```python
Product.seller.country.name == "Spain"   # SnakeExpr[str] -> condition
```

At runtime, class access doesn't return the real class but an object that accumulates the path
(`seller → country → name`) to generate the JOINs. The declared type and the real object differ on
purpose: the type describes what you can write, and the runtime object translates it into SQL.

There is a subtle detail with optional relations. `SnakeToOne[Country | None]` would give
`type[Country | None]`, which has no columns. SnakeORM adds an earlier overload that applies to
`self: SnakeToOne[N | None]` and returns `type[N]`, so navigation works and instance access is
still `Country | None`. The order of the overloads matters: if the narrow one comes after the
general one, it is never chosen, and there is no warning. The project has a specific test to catch
this.

## Step 4: collections don't expose columns

A "to-many" relation changes the number of rows, so its class access doesn't return `type[M]` but
a `SnakeCollection[M]`, which only offers collection operations:

```python
Country.sellers.name == "x"
# error: "SnakeCollection[Seller]" has no attribute "name"

query.filter(Country.sellers.any(Seller.name == "x"))   # EXISTS
query.filter(Country.sellers.count() > 3)               # scalar subquery
```

In a string-based ORM, the equivalent compiles, runs and can silently duplicate rows. Here it is a
type error.

## Step 5: `dataclass_transform` for the constructor

`Seller(name="...")` still needs typing. That is what `typing.dataclass_transform` (PEP 681) is
for: a decorator marked with it tells the checker that the decorated class behaves like a
dataclass, and that certain functions are *field specifiers*. This is `snake_model`'s signature
(simplified):

```python
@dataclass_transform(
    kw_only_default=True,
    field_specifiers=(snake_column, snake_auto, snake_int, snake_str, ...),
)
def snake_model(cls: type[T] | None = None, **options) -> Any: ...  # simplified
```

With that, mypy and Pyright synthesise an `__init__` with keyword arguments and types taken from
the annotations. The real `__init__` is installed by the decorator at runtime. The class's
configuration attributes are declared as `ClassVar` so they aren't mistaken for columns.

## Step 6: generic queries and results

The query is `SnakeQuery[T]`, immutable, and every method returns another `SnakeQuery[T]`. The
session takes a `SnakeQuery[T]` and returns `list[T]`, so the model's type travels from the query
all the way to the result.

Annotations (`annotate`) are the hard case: "a `Seller` plus a `product_count: int`" would be an
intersection type, and Python doesn't have them. Instead of returning `Any`, SnakeORM asks you to
declare the result class:

```python
@snake_result
class SellerStats(SnakeResult[Seller]):
    seller: Seller
    product_count: int
```

For truly dynamic names, access returns `object` instead of `Any`, which forces an explicit
`cast`.

## The type contract is a test

The types are the API, so they get tested. The project has one file of cases that **must** type
check (with `assert_type`) and another of cases that **must not** compile, each line with its
expected error code. The test runs mypy and Pyright on them and requires exactly those errors on
exactly those lines. If a change opens a hole, the error disappears and the test fails.

## Limitations and trade-offs

- **The declared type isn't the real object.** `type[M]` on class access is a useful fiction; it
  needs to be documented well for whoever reads the ORM's code.
- **An expression doesn't carry its model in the type.** `Seller.id` and `Product.id` are both
  `SnakeExpr[int]`; encoding the owner would break deep navigation. Where it matters, it is
  validated at runtime.
- **Unions of several models** in a relation make mypy and Pyright disagree, so the ORM rejects
  them and polymorphism is expressed with a base class.
- **More work on the API.** Every signature has to be designed with the checker in mind, with
  overloads whose order matters. It is more work for whoever writes the ORM and less for whoever
  uses it.

## Summary

You can have an ORM that mypy and Pyright understand without code generation or plugins: generic
annotations as the source of truth, descriptors with an overloaded `__get__` to separate class
access (SQL expressions) from instance access (values), `type[M]` to chain navigation,
`dataclass_transform` for the constructor and a test that pins down the type contract. The full
documentation is at [velezanthony.github.io/snake-orm](https://velezanthony.github.io/snake-orm/).

## References

- [SnakeORM: documentation](https://velezanthony.github.io/snake-orm/)
- [Python: descriptor guide](https://docs.python.org/3/howto/descriptor.html)
- [Python: `typing.overload`](https://docs.python.org/3/library/typing.html#typing.overload)
- [Python: `typing.dataclass_transform`](https://docs.python.org/3/library/typing.html#typing.dataclass_transform)
- [PEP 681: Data Class Transforms](https://peps.python.org/pep-0681/)
- [Typing specification: dataclasses](https://typing.python.org/en/latest/spec/dataclasses.html)
