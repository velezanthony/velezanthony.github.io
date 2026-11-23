---
seo:
  title: "El ORM de Django tipado"
  description: "Qué entienden mypy y Pyright del ORM de Django con django-stubs: el plugin, QuerySet[Model], annotate() y values() con TypedDict, y qué hacer sin plugin."
  schema:
    - '@type': TechArticle
      headline: "El ORM de Django tipado: lo que ve el comprobador y lo que no"
      description: "Qué entienden mypy y Pyright del ORM de Django con django-stubs: el plugin, QuerySet[Model], annotate() y values() con TypedDict, y qué hacer sin plugin."
      inLanguage: es
      datePublished: '2026-11-23'
      dateModified: '2026-11-23'
      author:
        '@type': Person
        '@id': https://velezanthony.github.io/#anthony
        name: Anthony Velez Tapia
        url: https://velezanthony.github.io/
---

# El ORM de Django tipado: lo que ve el comprobador y lo que no

Escribe `Product.objects.filter(nmae="x")`. El código arranca, los tests que no pasan por esa línea
siguen en verde, y el día que se ejecuta Django lanza esto:

```text
FieldError: Cannot resolve keyword 'nmae' into field. Choices are: id, name, price, seller, seller_id
```

El ORM de Django construye modelos, campos y consultas en tiempo de ejecución, y un comprobador de
tipos no ejecuta nada. Aquí cuento qué ve mypy y qué ve Pyright de ese ORM, paso a paso, y cómo
hacer que vean más, sobre los mismos modelos del artículo de las
[consultas N+1](../django/consultas-n-mas-1-django.md):

```python
class Seller(models.Model):
    name = models.CharField(max_length=100)


class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    seller = models.ForeignKey(Seller, on_delete=models.CASCADE, related_name="products")
```

Forma parte de la serie [Python estricto](stack-python-estricto.md).

:::note[Con qué versiones está comprobado]{collapsed}

Todos los resultados los he comprobado con Django 5.2, django-stubs 6.1.2, Pyright 1.1.414 y la
última versión de mypy, la 2.4.1. Django Cotton Gallery fija una anterior, la 1.20.2, en su proyecto.

:::

## 1. Sin nada: el comprobador no ve el ORM

Django no trae tipos. Sin más, Pyright ni siquiera sabe que `Product.objects` existe:

```text
error: Cannot access attribute "objects" for class "type[Product]"
```

Todo lo que sale de ahí es `Unknown`. Es como no tener comprobador.

## 2. django-stubs: los tipos de Django, y un plugin para mypy

[django-stubs](https://github.com/typeddjango/django-stubs) trae dos cosas:

- **Stubs**: archivos con los tipos de Django (`Manager`, `QuerySet`, cada campo). Los lee cualquier
  comprobador.
- **Un plugin para mypy**, que arranca tu proyecto, lee tus modelos y rellena lo que los stubs solos
  no pueden saber: qué campos tiene cada modelo y de qué tipo es cada uno.

Los stubs son el manual de Django; el plugin es alguien que, además, se ha leído **tus** modelos.

[Pyright no admite plugins](https://github.com/microsoft/pyright/blob/main/docs/mypy-comparison.md#plugins),
y django-stubs lo reconoce: soporte «completo» con mypy y «básico» con Pyright. La diferencia,
medida sobre el mismo código:

| Expresión | mypy con el plugin | Pyright con los stubs | Pyright sin stubs |
|---|---|---|---|
| `Product.objects` | `Manager[Product]` | `Manager[Product]` | error |
| `product.name` | `str` | `Unknown` | `Unknown` |
| `product.price` | `Decimal` | `Unknown` | `Unknown` |
| `product.seller` | `Seller` | `Unknown` | `Unknown` |
| `product.seller_id` | `int` | error: no existe | `Unknown` |
| `seller.products.all()` | `QuerySet[Product, Product]` | error: no existe | `Unknown` |

Con los stubs, Pyright conoce el ORM, pero no **tus** modelos. Los tipos de cada campo los pone el
plugin.

:::note[La configuración del plugin]{collapsed}

Se instala con `pip install "django-stubs[compatible-mypy]"`, y el plugin necesita saber qué
`settings` cargar. Así lo hace [Django Cotton Gallery](https://velezanthony.github.io/django-cotton-gallery/)
en su [`pyproject.toml`](https://github.com/velezanthony/django-cotton-gallery/blob/main/pyproject.toml):

```toml
[tool.mypy]
strict = true
plugins = ["mypy_django_plugin.main"]

[tool.django-stubs]
django_settings_module = "tests.settings"
```

:::

## 3. Lo que gana mypy con el plugin

El plugin no solo pone tipos: **valida los nombres de los campos** en las consultas. Las tres
erratas de este ejemplo genérico mypy las rechaza sin ejecutar nada, con el mismo mensaje que daría
Django:

```python
seller = Seller.objects.annotate(n_products=Count("products")).get()

Product.objects.values("nmae")      # error: Cannot resolve keyword 'nmae' into field
Product.objects.order_by("prise")   # error: Cannot resolve keyword 'prise' into field
seller.n_prodcts                    # error: has no attribute "n_prodcts"
```

Y deduce la forma de los resultados:

| Consulta | Tipo que deduce mypy |
|---|---|
| `Product.objects.values("name", "price").get()` | `TypedDict({'name': str, 'price': Decimal})` |
| `Seller.objects.annotate(n_products=Count("products")).get().n_products` | `int` |

:::warning[No lo ve todo]

En la misma prueba, `Product.objects.filter(seller__nmae="x")` pasó sin error: la errata en un campo
**de la relación** no la detectó. El plugin revisa el primer salto, no siempre los siguientes. Un
test que ejecute la consulta sigue siendo necesario.

:::

## 4. Sin plugin: decírselo tú

Si usas Pyright, en el editor o en el CI, puedes darle lo que el plugin deduciría: anotando los
campos con su tipo. Lo mejor es que mypy acepta exactamente el mismo código.

Vas a ver `if TYPE_CHECKING:`. Es una nota al margen que solo lee el comprobador: al ejecutar,
Python se la salta.

::::tabs
:::tab[Sin anotar]
```python
class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    seller = models.ForeignKey(Seller, on_delete=models.CASCADE, related_name="products")
```
:::
:::tab[Anotado para Pyright]
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

Con esto, Pyright deduce `str`, `Decimal`, `Seller`, `int` y `QuerySet[Product, Product]`, igual que
mypy con el plugin. Lo que no recupera es la validación de nombres en las consultas: eso solo lo
hace el plugin.

Los dos parámetros de cada campo son el tipo que **aceptas** al asignar y el que **obtienes** al
leer. Es una ventanilla de cambio: aceptas euros, dólares o libras, pero siempre te devuelve euros.

:::warning[El `from __future__ import annotations` no es decorativo]

En ejecución, `QuerySet` y `Manager` admiten `[...]`, pero `CharField` no:
`TypeError: type 'CharField' is not subscriptable`. Con esa primera línea, Python no evalúa las
anotaciones y no hay error. La alternativa es llamar a `django_stubs_ext.monkeypatch()` en los
`settings`, que hace subscriptibles las clases genéricas de Django.

:::

## 5. `annotate()`: los campos que no están en el modelo

`annotate()` añade atributos que el modelo no declara. Para decir en una función qué atributos trae
el resultado, django-stubs-ext ofrece `WithAnnotations`, con un `TypedDict` de los añadidos:

::::tabs
:::tab[Con WithAnnotations (solo mypy)]
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
:::tab[Con una subclase (mypy y Pyright)]
```python
from typing import TYPE_CHECKING, cast

from django.db.models import Count

if TYPE_CHECKING:

    class SellerWithCount(Seller):
        n_products: int


def busiest() -> "SellerWithCount":  # entre comillas: en ejecución no existe
    seller = Seller.objects.annotate(n_products=Count("products")).get(pk=1)
    return cast("SellerWithCount", seller)
```
:::
::::

`WithAnnotations` es un `Annotated` que solo entiende el plugin. Pyright lo rechaza
(`expected 1 but received 2`) y no ve `n_products`. La subclase dentro de `TYPE_CHECKING` no existe
en ejecución, pero los dos comprobadores la entienden y deducen `n_products: int`.

## 6. `values()` y los `TypedDict` fuera de Django

`values()` devuelve diccionarios. Con el plugin, mypy les pone forma; sin él, son
`dict[str, Any]`. Si esa forma sale de tu código, por ejemplo hacia una API, lo natural es
declararla con un `TypedDict`.

Ojo si ese `TypedDict` lo lee pydantic, como en Django Ninja o FastAPI: por debajo de Python 3.12,
pydantic exige el de `typing_extensions`. En SnakeORM eso pasó 826 commits sin que nadie lo viera;
lo cuento en [La matriz de CI](matriz-ci-python.md).

SnakeORM resuelve el tipado de su ORM de otra forma, sin plugins; lo cuento en
[Un ORM tipado sin generar código](../orm-tipado-sin-generar-codigo.md).

## En resumen: qué configuro

| Situación | Qué hacer |
|---|---|
| El CI pasa mypy | django-stubs con su plugin: tipos de los campos y nombres validados, sin tocar los modelos |
| Usas Pyright (VS Code) | django-stubs sin plugin, y anota los campos que más uses |
| Necesitas los dos | anota los campos: mypy acepta las anotaciones y Pyright las necesita |
| Funciones que devuelven `annotate()` | `WithAnnotations` si solo usas mypy; la subclase en `TYPE_CHECKING` si usas Pyright |
| `TypedDict` que lee pydantic | impórtalo de `typing_extensions` mientras admitas Python < 3.12 |

## Referencias

- [django-stubs](https://github.com/typeddjango/django-stubs)
- [django-stubs-ext](https://github.com/typeddjango/django-stubs/tree/master/ext)
- [Pyright: diferencias con mypy (plugins)](https://github.com/microsoft/pyright/blob/main/docs/mypy-comparison.md#plugins)
- [mypy: plugins](https://mypy.readthedocs.io/en/stable/extending_mypy.html)
- [Django: `QuerySet.annotate()`](https://docs.djangoproject.com/en/5.2/ref/models/querysets/#annotate)
- [Django: `QuerySet.values()`](https://docs.djangoproject.com/en/5.2/ref/models/querysets/#values)
- [Python: `TypedDict`](https://docs.python.org/3/library/typing.html#typing.TypedDict)
- [pydantic: `TypedDict`](https://docs.pydantic.dev/latest/concepts/types/#typeddict)
