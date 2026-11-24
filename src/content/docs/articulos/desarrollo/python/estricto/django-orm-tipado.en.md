---
slug: articles/development/python/strict/typed-django-orm
seo:
  title: "A typed Django ORM"
  description: "What mypy and Pyright understand of the Django ORM with django-stubs: the plugin, QuerySet[Model], annotate() and values() with TypedDict, and no plugin."
  image:
    src: /og/articles/development/python/strict/typed-django-orm.png
    alt: "A typed Django ORM"
  schema:
    - '@type': TechArticle
      headline: "A typed Django ORM: what the type checker sees and what it does not"
      description: "What mypy and Pyright understand of the Django ORM with django-stubs: the plugin, QuerySet[Model], annotate() and values() with TypedDict, and no plugin."
      image: https://velezanthony.github.io/og/articles/development/python/strict/typed-django-orm.png
      inLanguage: en
      datePublished: '2026-11-23'
      dateModified: '2026-11-23'
      author:
        '@type': Person
        '@id': https://velezanthony.github.io/#anthony
        name: Anthony Velez Tapia
        url: https://velezanthony.github.io/
---

# A typed Django ORM: what the type checker sees and what it does not

Write `Product.objects.filter(nmae="x")`. The code starts, the tests that never reach that line stay
green, and the day it runs Django throws this:

```text
FieldError: Cannot resolve keyword 'nmae' into field. Choices are: id, name, price, seller, seller_id
```

The Django ORM builds models, fields and queries at runtime, and a type checker runs nothing. Here I
explain what mypy sees and what Pyright sees of that ORM, step by step, and how to make them see
more, on the same models as the article on
[N+1 queries](../django/consultas-n-mas-1-django.md):

```python
class Seller(models.Model):
    name = models.CharField(max_length=100)


class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    seller = models.ForeignKey(Seller, on_delete=models.CASCADE, related_name="products")
```

It is part of the [Strict Python](stack-python-estricto.md) series.

:::note[Which versions it was checked with]{collapsed}

I checked every result with Django 5.2, django-stubs 6.1.2, Pyright 1.1.414 and the latest mypy,
2.4.1. Django Cotton Gallery pins an older one, 1.20.2, in its project.

:::

## 1. With nothing: the checker does not see the ORM

Django ships no types. Out of the box, Pyright does not even know that `Product.objects` exists:

```text
error: Cannot access attribute "objects" for class "type[Product]"
```

Everything that comes out of it is `Unknown`. It is like having no checker at all.

## 2. django-stubs: Django's types, and a plugin for mypy

[django-stubs](https://github.com/typeddjango/django-stubs) brings two things:

- **Stubs**: files with Django's types (`Manager`, `QuerySet`, every field). Any checker reads them.
- **A plugin for mypy**, which starts your project, reads your models and fills in what the stubs
  alone cannot know: which fields each model has and what type each one is.

The stubs are Django's manual; the plugin is someone who has also read **your** models.

[Pyright does not support plugins](https://github.com/microsoft/pyright/blob/main/docs/mypy-comparison.md#plugins),
and django-stubs says so: "full" support with mypy and "basic" support with Pyright. The
difference, measured on the same code:

| Expression | mypy with the plugin | Pyright with the stubs | Pyright without stubs |
|---|---|---|---|
| `Product.objects` | `Manager[Product]` | `Manager[Product]` | error |
| `product.name` | `str` | `Unknown` | `Unknown` |
| `product.price` | `Decimal` | `Unknown` | `Unknown` |
| `product.seller` | `Seller` | `Unknown` | `Unknown` |
| `product.seller_id` | `int` | error: does not exist | `Unknown` |
| `seller.products.all()` | `QuerySet[Product, Product]` | error: does not exist | `Unknown` |

With the stubs, Pyright knows the ORM, but not **your** models. The type of each field comes from the
plugin.

:::note[The plugin's configuration]{collapsed}

Install it with `pip install "django-stubs[compatible-mypy]"`, and the plugin needs to know which
`settings` to load. This is how
[Django Cotton Gallery](https://velezanthony.github.io/django-cotton-gallery/) does it in its
[`pyproject.toml`](https://github.com/velezanthony/django-cotton-gallery/blob/main/pyproject.toml):

```toml
[tool.mypy]
strict = true
plugins = ["mypy_django_plugin.main"]

[tool.django-stubs]
django_settings_module = "tests.settings"
```

:::

## 3. What mypy gains with the plugin

The plugin does not only add types: it **validates field names** in queries. mypy rejects the three
typos of this generic example without running anything, with the same message Django would give:

```python
seller = Seller.objects.annotate(n_products=Count("products")).get()

Product.objects.values("nmae")      # error: Cannot resolve keyword 'nmae' into field
Product.objects.order_by("prise")   # error: Cannot resolve keyword 'prise' into field
seller.n_prodcts                    # error: has no attribute "n_prodcts"
```

And it infers the shape of the results:

| Query | Type mypy infers |
|---|---|
| `Product.objects.values("name", "price").get()` | `TypedDict({'name': str, 'price': Decimal})` |
| `Seller.objects.annotate(n_products=Count("products")).get().n_products` | `int` |

:::warning[It does not see everything]

In the same test, `Product.objects.filter(seller__nmae="x")` passed without an error: it did not
catch the typo in a field **of the relation**. The plugin checks the first hop, not always the
following ones. A test that runs the query is still needed.

:::

## 4. Without the plugin: tell it yourself

If you use Pyright, in the editor or in CI, you can give it what the plugin would infer, by
annotating the fields with their type. The best part is that mypy accepts exactly the same code.

You will see `if TYPE_CHECKING:`. It is a margin note only the checker reads: at runtime, Python
skips it.

::::tabs
:::tab[Not annotated]
```python
class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    seller = models.ForeignKey(Seller, on_delete=models.CASCADE, related_name="products")
```
:::
:::tab[Annotated for Pyright]
```python
from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

from django.db import models

if TYPE_CHECKING:
    from django.db.models.fields.related_descriptors import RelatedManager


class Seller(models.Model):
    name: models.CharField[str, str] = models.CharField(max_length=100)
    if TYPE_CHECKING:
        products: RelatedManager[Product]


class Product(models.Model):
    name: models.CharField[str, str] = models.CharField(max_length=200)
    price: models.DecimalField[Decimal, Decimal] = models.DecimalField(max_digits=8, decimal_places=2)
    seller: models.ForeignKey[Seller, Seller] = models.ForeignKey(
        Seller, on_delete=models.CASCADE, related_name="products"
    )
    seller_id: int
```
:::
::::

With this, Pyright infers `str`, `Decimal`, `Seller`, `int` and `QuerySet[Product, Product]`, just
like mypy with the plugin. What it does not get back is the validation of names in queries: only the
plugin does that.

The two parameters of each field are the type you **accept** when assigning and the one you **get**
when reading. It is a currency exchange desk: it accepts euros, dollars or pounds, but always gives
you euros back.

:::warning[The `from __future__ import annotations` is not decorative]

At runtime, `QuerySet` and `Manager` accept `[...]`, but `CharField` does not:
`TypeError: type 'CharField' is not subscriptable`. With that first line, Python does not evaluate
the annotations and there is no error. The alternative is calling `django_stubs_ext.monkeypatch()`
in the `settings`, which makes Django's generic classes subscriptable.

:::

## 5. `annotate()`: the fields that are not on the model

`annotate()` adds attributes the model does not declare. To state in a function which attributes the
result carries, django-stubs-ext offers `WithAnnotations`, with a `TypedDict` of the added ones:

::::tabs
:::tab[With WithAnnotations (mypy only)]
```python
from typing import TypedDict

from django.db.models import Count
from django_stubs_ext import WithAnnotations


class SellerCounts(TypedDict):
    n_products: int


def busiest() -> WithAnnotations[Seller, SellerCounts]:
    return Seller.objects.annotate(n_products=Count("products")).get(pk=1)
```
:::
:::tab[With a subclass (mypy and Pyright)]
```python
from typing import TYPE_CHECKING, cast

from django.db.models import Count

if TYPE_CHECKING:

    class SellerWithCount(Seller):
        n_products: int


def busiest() -> "SellerWithCount":  # in quotes: it does not exist at runtime
    seller = Seller.objects.annotate(n_products=Count("products")).get(pk=1)
    return cast("SellerWithCount", seller)
```
:::
::::

`WithAnnotations` is an `Annotated` only the plugin understands. Pyright rejects it
(`expected 1 but received 2`) and does not see `n_products`. The subclass inside `TYPE_CHECKING`
does not exist at runtime, but both checkers understand it and infer `n_products: int`.

## 6. `values()` and `TypedDict` outside Django

`values()` returns dictionaries. With the plugin, mypy gives them a shape; without it, they are
`dict[str, Any]`. If that shape leaves your code, for example towards an API, the natural thing is to
declare it with a `TypedDict`.

Careful if pydantic reads that `TypedDict`, as in Django Ninja or FastAPI: below Python 3.12,
pydantic requires the one from `typing_extensions`. In SnakeORM that went unnoticed for 826 commits;
I tell the story in [The CI matrix](matriz-ci-python.md).

SnakeORM solves the typing of its ORM another way, without plugins; I explain it in
[A typed ORM without code generation](../orm-tipado-sin-generar-codigo.md).

## Summary: what to configure

| Situation | What to do |
|---|---|
| CI runs mypy | django-stubs with its plugin: field types and validated names, without touching the models |
| You use Pyright (VS Code) | django-stubs without the plugin, and annotate the fields you use most |
| You need both | annotate the fields: mypy accepts the annotations and Pyright needs them |
| Functions that return `annotate()` | `WithAnnotations` if you only use mypy; the subclass in `TYPE_CHECKING` if you use Pyright |
| A `TypedDict` that pydantic reads | import it from `typing_extensions` while you support Python < 3.12 |

## References

- [django-stubs](https://github.com/typeddjango/django-stubs)
- [django-stubs-ext](https://github.com/typeddjango/django-stubs/tree/master/ext)
- [Pyright: differences from mypy (plugins)](https://github.com/microsoft/pyright/blob/main/docs/mypy-comparison.md#plugins)
- [mypy: plugins](https://mypy.readthedocs.io/en/stable/extending_mypy.html)
- [Django: `QuerySet.annotate()`](https://docs.djangoproject.com/en/5.2/ref/models/querysets/#annotate)
- [Django: `QuerySet.values()`](https://docs.djangoproject.com/en/5.2/ref/models/querysets/#values)
- [Python: `TypedDict`](https://docs.python.org/3/library/typing.html#typing.TypedDict)
- [pydantic: `TypedDict`](https://docs.pydantic.dev/latest/concepts/types/#typeddict)
