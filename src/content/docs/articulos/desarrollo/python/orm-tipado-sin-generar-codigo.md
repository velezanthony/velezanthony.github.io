---
seo:
  title: "ORM tipado en Python sin generar código"
  description: "Cómo hacer que mypy y Pyright entiendan un ORM de Python sin generar código ni plugins: descriptores con __get__ sobrecargado, genéricos y dataclass_transform."
---

# Un ORM tipado sin generar código

En la mayoría de ORMs de Python, el comprobador de tipos ve poco más que `Any`. Escribes
`filter(seller__country__name="España")` y ni mypy ni Pyright pueden decirte si `country` existe,
si `name` es un texto o si te has equivocado al escribirlo. El error aparece en ejecución.

Este artículo explica la técnica que uso en [SnakeORM](https://velezanthony.github.io/snake-orm/),
un ORM de código abierto que escribo y que todavía está **en beta**, para que mypy y Pyright entiendan modelos, columnas,
relaciones y consultas **sin generar código y sin plugins del comprobador de tipos**. Solo con
herramientas estándar del sistema de tipos de Python.

## El problema: un ORM dinámico devuelve `Any`

Un ORM dinámico construye sus atributos en tiempo de ejecución: metaclases, `__getattr__`,
nombres de campo como cadenas. El comprobador de tipos no ejecuta el código, así que lo único que
puede deducir es `Any`. Y `Any` no es un tipo: es apagar el comprobador.

```python
def __getattr__(self, name: str) -> Any: ...

row.total * 2            # no error
label: str = row.total   # no error either: the same value, now "a str"
```

Las salidas habituales son dos: generar stubs o código a partir de los modelos, o escribir un
plugin para mypy (que Pyright no ejecuta). La idea de SnakeORM es la tercera: diseñar la API para
que los tipos se puedan expresar con lo que el lenguaje ya tiene.

## Paso 1: la anotación es la fuente de verdad

Cada columna se declara con una anotación genérica. El tipo de Python sale de la anotación; la
función de la derecha solo añade información SQL (único, índice, valor por defecto):

```python
@snake_model(table="sellers")
class Seller(SnakeModel):
    id: SnakeColumn[int] = snake_auto()
    name: SnakeColumn[str] = snake_str(unique=True)
    country_id: SnakeColumn[int] = snake_int()
    country: SnakeToOne[Country] = snake_to_one(country_id)
    products: SnakeToMany[Product] = snake_to_many("seller")
```

`SnakeColumn[T]`, `SnakeToOne[M]` y `SnakeToMany[M]` son clases genéricas (`Generic[T]`). El
comprobador conoce `T` y `M` sin ejecutar nada.

## Paso 2: descriptores con `__get__` sobrecargado

La pieza central es un descriptor cuyo `__get__` devuelve un tipo distinto según se acceda desde la
clase o desde una instancia. Con `@overload` se le explica al comprobador:

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

Así, la misma declaración tiene dos lecturas, ambas tipadas:

```python
seller.name          # instance -> str
Seller.name          # class    -> SnakeExpr[str]
Seller.name == "x"   # SnakeExpr.__eq__ returns a condition, not a bool
```

`SnakeExpr[T]` sobrecarga los operadores de comparación para devolver una condición SQL. Las
comparaciones de orden (`<`, `<=`, `>`, `>=`) usan el mismo `T` en su firma, así que ordenar un texto
contra un entero es un error de tipos. `==` y `!=` no lo son: Python obliga a que `__eq__` y `__ne__`
acepten cualquier `object` (para que `col == None` se traduzca a `IS NULL`, por ejemplo), y ahí el
comprobador no puede ayudar.

```python
Seller.name > 3    # type error: __gt__ expects a str
Seller.name == 3   # no type error: __eq__ takes any object
```

## Paso 3: navegación profunda con `type[M]`

Para las relaciones «hacia uno», el truco está en qué devuelve el acceso por clase. El descriptor
declara que `Seller.country` devuelve `type[Country]`:

```python
class SnakeToOne(Generic[M]):
    @overload
    def __get__(self, instance: None, owner: Any) -> type[M]: ...
    @overload
    def __get__(self, instance: object, owner: Any) -> M: ...
```

Como el resultado es «la clase `Country`», acceder a `.name` sobre él vuelve a disparar el
`__get__` por clase de los descriptores de `Country`. La navegación se encadena sola, a cualquier
profundidad, y cada eslabón está tipado:

```python
Product.seller.country.name == "España"   # SnakeExpr[str] -> condition
```

En ejecución, el acceso por clase no devuelve la clase real sino un objeto que acumula la ruta
(`seller → country → name`) para generar los JOIN. El tipo declarado y el objeto real difieren a
propósito: el tipo describe lo que se puede escribir, y el objeto de ejecución lo traduce a SQL.

Hay un detalle sutil con las relaciones opcionales. `SnakeToOne[Country | None]` daría
`type[Country | None]`, que no tiene columnas. SnakeORM añade una sobrecarga previa que se aplica a
`self: SnakeToOne[N | None]` y devuelve `type[N]`, de modo que la navegación funciona y el acceso
por instancia sigue siendo `Country | None`. El orden de las sobrecargas importa: si la estrecha va
después de la general, nunca se elige, y no hay aviso. El proyecto tiene un test específico para
detectarlo.

## Paso 4: las colecciones no exponen columnas

Una relación «hacia muchos» cambia el número de filas, así que su acceso por clase no devuelve
`type[M]` sino una `SnakeCollection[M]`, que solo ofrece operaciones de colección:

```python
Country.sellers.name == "x"
# error: "SnakeCollection[Seller]" has no attribute "name"

query.filter(Country.sellers.any(Seller.name == "x"))   # EXISTS
query.filter(Country.sellers.count() > 3)               # scalar subquery
```

En un ORM basado en cadenas, el equivalente compila, se ejecuta y puede duplicar filas en
silencio. Aquí es un error de tipos.

## Paso 5: `dataclass_transform` para el constructor

Falta tipar `Seller(name="...")`. Para eso está `typing.dataclass_transform` (PEP 681): un
decorador marcado con él indica al comprobador que la clase decorada se comporta como una
dataclass, y que ciertas funciones son *field specifiers*. Esta es la firma de `snake_model`
(simplificada):

```python
@dataclass_transform(
    kw_only_default=True,
    field_specifiers=(snake_column, snake_auto, snake_int, snake_str, ...),
)
def snake_model(cls: type[T] | None = None, **options) -> Any: ...  # simplified
```

Con eso, mypy y Pyright sintetizan un `__init__` con argumentos por nombre y tipos tomados de las
anotaciones. El `__init__` real lo instala el decorador en ejecución. Los atributos de
configuración de la clase se declaran como `ClassVar` para que no se confundan con columnas.

## Paso 6: consultas y resultados genéricos

La consulta es `SnakeQuery[T]`, inmutable, y cada método devuelve otra `SnakeQuery[T]`. La sesión
recibe una `SnakeQuery[T]` y devuelve `list[T]`, así que el tipo del modelo viaja desde la consulta
hasta el resultado.

Las anotaciones (`annotate`) son el caso difícil: «un `Seller` más un `product_count: int`» sería un
tipo intersección, y Python no los tiene. En lugar de devolver `Any`, SnakeORM pide declarar la
clase del resultado:

```python
@snake_result
class SellerStats(SnakeResult[Seller]):
    seller: Seller
    product_count: int
```

Para los nombres realmente dinámicos, el acceso devuelve `object` en vez de `Any`, lo que obliga a
un `cast` explícito.

## El contrato de tipos es un test

Los tipos son la API, así que se testean. El proyecto tiene un fichero de casos que **deben**
tipar (con `assert_type`) y otro de casos que **no deben** compilar, cada línea con el código de
error esperado. El test ejecuta mypy y Pyright sobre ellos y exige exactamente esos errores en
exactamente esas líneas. Si un cambio abre un agujero, el error desaparece y el test falla.

## Limitaciones y compromisos

- **El tipo declarado no es el objeto real.** `type[M]` en el acceso por clase es una ficción útil;
  hay que documentarlo bien para quien lea el código del ORM.
- **Una expresión no lleva su modelo en el tipo.** `Seller.id` y `Product.id` son
  `SnakeExpr[int]` ambos; codificar el propietario rompería la navegación profunda. Donde importa,
  se valida en ejecución.
- **Las uniones de varios modelos** en una relación hacen que mypy y Pyright discrepen, así que el
  ORM las rechaza y la polimorfia se expresa con una clase base.
- **Más trabajo en la API.** Hay que pensar cada firma pensando en el comprobador, con sobrecargas
  cuyo orden importa. Es más trabajo para quien escribe el ORM y menos para quien lo usa.

## En resumen

Se puede tener un ORM que mypy y Pyright entiendan sin generar código ni plugins: anotaciones
genéricas como fuente de verdad, descriptores con `__get__` sobrecargado para separar el acceso por
clase (expresiones SQL) del acceso por instancia (valores), `type[M]` para encadenar la navegación,
`dataclass_transform` para el constructor y un test que fije el contrato de tipos. La documentación
completa está en [velezanthony.github.io/snake-orm](https://velezanthony.github.io/snake-orm/).

## Referencias

- [SnakeORM: documentación](https://velezanthony.github.io/snake-orm/)
- [Python: guía de descriptores](https://docs.python.org/3/howto/descriptor.html)
- [Python: `typing.overload`](https://docs.python.org/3/library/typing.html#typing.overload)
- [Python: `typing.dataclass_transform`](https://docs.python.org/3/library/typing.html#typing.dataclass_transform)
- [PEP 681: Data Class Transforms](https://peps.python.org/pep-0681/)
- [Especificación del sistema de tipos: dataclasses](https://typing.python.org/en/latest/spec/dataclasses.html)
