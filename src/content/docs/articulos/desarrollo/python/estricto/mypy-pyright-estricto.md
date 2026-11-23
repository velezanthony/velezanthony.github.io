---
seo:
  title: "mypy y Pyright en modo estricto"
  description: "Qué activa mypy --strict, la caché, Pyright y sus modos, usar los dos a la vez, dónde relajar sin rendirse y qué cambió con las anotaciones de Python 3.14."
  schema:
    - '@type': TechArticle
      headline: "mypy y Pyright a fondo: el modo estricto sin sorpresas"
      description: "Qué activa mypy --strict, la caché, Pyright y sus modos, usar los dos a la vez, dónde relajar sin rendirse y qué cambió con las anotaciones de Python 3.14."
      inLanguage: es
      datePublished: '2026-11-23'
      dateModified: '2026-11-23'
      author:
        '@type': Person
        '@id': https://velezanthony.github.io/#anthony
        name: Anthony Velez Tapia
        url: https://velezanthony.github.io/
---

# mypy y Pyright a fondo: el modo estricto sin sorpresas

En [SnakeORM](https://velezanthony.github.io/snake-orm/), mypy pasaba en verde sobre una capa entera
de demos. Y no había comprobado ni un solo tipo entre sus módulos.

Activar el modo estricto es una línea: `strict = true`. Lo difícil viene después: errores donde no
los esperabas, un CI más lento, dos comprobadores que no siempre opinan lo mismo y opciones que
apagan la comprobación sin avisar. Lo cuento con SnakeORM y con
[Django Cotton Gallery](https://velezanthony.github.io/django-cotton-gallery/).

Forma parte de la serie [Python estricto](stack-python-estricto.md).

## 1. Qué enciende `strict = true`

`--strict` no es una regla: es un paquete de reglas, y crece con cada versión. Cuando mypy añade una
comprobación estricta nueva, entra en `--strict`. Por eso conviene fijar la versión de mypy, o una
actualización puede llenarte el CI de errores nuevos sin que hayas tocado el código.

:::note[Las opciones de `--strict` en mypy 1.20]{collapsed}

Es la versión que fija Django Cotton Gallery. Agrupadas por lo que exigen:

| Qué exige | Opciones |
|---|---|
| Que todo tenga tipos | `disallow_untyped_defs`, `disallow_incomplete_defs`, `disallow_untyped_calls`, `disallow_untyped_decorators`, `check_untyped_defs` |
| Que `Any` no se cuele | `disallow_any_generics` (nada de `list` a secas), `disallow_subclassing_any`, `warn_return_any` |
| Que no haya restos | `warn_unused_ignores`, `warn_redundant_casts` |
| Que lo público sea explícito | `no_implicit_reexport` |
| Que las comparaciones tengan sentido | `strict_equality`, `strict_bytes`, `extra_checks` |

:::

## 2. El primer choque: lo que importas ya no se exporta

De todas las opciones, `no_implicit_reexport` es la que más sorprende. Sin ella, si un `__init__.py`
importa un nombre, cualquiera puede importarlo desde ahí. Con ella, solo cuenta como público si lo
dices. El `__init__.py` pasa a ser un escaparate: solo se vende lo que pones en él, no lo que hay en
el almacén.

Hay dos formas de decirlo, y las dos son válidas para mypy. Django Cotton Gallery está
[pasando](https://github.com/velezanthony/django-cotton-gallery/commit/3506d82110e22368200527c762599146ffb2e8a2)
de la primera a la segunda, en una rama que aún no está en `main`:

::::tabs
:::tab[Con `__all__`]
```python
from .cache import CatalogCache
from .resolver import ComponentNotFound, resolve

__all__ = ["CatalogCache", "ComponentNotFound", "resolve"]
```
:::
:::tab[Con `X as X`]
```python
from .cache import CatalogCache as CatalogCache
from .resolver import ComponentNotFound as ComponentNotFound
from .resolver import resolve as resolve
```
:::
::::

El alias redundante (`X as X`) es la exportación explícita que define la PEP 484. La ventaja frente
a `__all__`: no hay una lista de textos aparte que se pueda quedar desfasada. Lo que no lleva alias,
como los módulos internos, sigue siendo privado
([el mismo cambio en el linter y la vista previa](https://github.com/velezanthony/django-cotton-gallery/commit/6abb8fc9d15ec7fe07750e0780d67d0d5058883a)).

## 3. La caché en el CI

mypy guarda en `.mypy_cache` lo que ya revisó y Pyright no guarda nada (las medidas están en el
[artículo de la serie](stack-python-estricto.md)). En tu máquina la caché siempre está; el CI empieza
de cero, y ahí pagas la primera ejecución en cada push. Se arregla guardando la carpeta entre
ejecuciones (ejemplo genérico):

```yaml
- uses: actions/cache@v4
  with:
    path: .mypy_cache
    key: mypy-${{ hashFiles('uv.lock') }}-${{ github.sha }}
    restore-keys: mypy-${{ hashFiles('uv.lock') }}-
```

La clave incluye `uv.lock`: si cambian las dependencias, la caché empieza de nuevo.

## 4. Pyright: cuatro modos y ningún plugin

[Pyright](https://microsoft.github.io/pyright/) no tiene un `strict` de sí o no, sino cuatro niveles
en `typeCheckingMode`: `off`, `basic`, `standard` (el de por defecto) y `strict`. Y puede cambiar de
nivel por archivo, con un comentario arriba del todo:

```python
# pyright: strict
```

Las diferencias que más pesan frente a mypy:

| | mypy | Pyright |
|---|---|---|
| Plugins | Sí, como el de django-stubs | No |
| Nivel por archivo | Con `[[tool.mypy.overrides]]` | Con `# pyright: strict` o `basic` |
| En el editor | Con una extensión aparte | Es el motor de Pylance en VS Code |

Lo de los plugins decide mucho en Django: sin el de django-stubs, Pyright ve menos de tus modelos.
Qué ve cada uno, con ejemplos medidos, está en [El ORM de Django tipado](django-orm-tipado.md).

## 5. Los dos a la vez, cada uno con su trabajo

SnakeORM pasa los dos, pero no con la misma severidad ni sobre el mismo código. Su
[CI](https://github.com/velezanthony/snake-orm/blob/main/.github/workflows/ci.yml) lo reparte así:

| Paso | Sobre qué | Por qué |
|---|---|---|
| `mypy .` | Todo el repositorio, sin `--strict` | Que nada esté roto, sin obligar a tipar los tests al detalle |
| `mypy --strict src/snakeorm/` | Solo el paquete | La promesa del proyecto es cero `Any` en lo que se publica |
| `pyright src/snakeorm/` | Solo el paquete, en su modo por defecto | Lo que ve quien usa el ORM desde VS Code |

¿Por qué Pyright no va en `strict`? Porque el ORM usa `Any` por dentro, a propósito, para que los
tipos que ve quien lo usa salgan exactos. Pyright estricto los marcaría todos; mypy ya garantiza que
ninguno se escapa al código público.

Dos detalles más del mismo proyecto:

- **mypy revisa contra la versión mínima de Python.** mypy da por hecho que tu código correrá en el
  mismo Python con el que ejecutas mypy. Si el CI usa 3.14, deja pasar sintaxis que no existe en
  3.11, y 3.11 es lo que el paquete promete. Por eso ese paso fija Python 3.11. Django Cotton Gallery
  hace lo mismo con `python_version = "3.10"` en su
  [`pyproject.toml`](https://github.com/velezanthony/django-cotton-gallery/blob/main/pyproject.toml).
- **Un `# type: ignore` que uno necesita, al otro le sobra.** Con dos comprobadores sobre el mismo
  código, avisar de los ignores innecesarios daría falsos positivos. SnakeORM solo activa
  `reportUnnecessaryTypeIgnoreComment` en las carpetas que lee únicamente Pyright
  ([`pyproject.toml`](https://github.com/velezanthony/snake-orm/blob/main/pyproject.toml)).

## 6. Relajar sin rendirse

A veces lo estricto cuesta más de lo que da. La clave es relajar **lo justo y donde toca**, no todo
el proyecto.

El ejemplo de Django Cotton Gallery, que relaja solo sus *templatetags*, está en el
[artículo de la serie](stack-python-estricto.md). Aquí va lo contrario: una opción que parece
relajar poco y apaga mucho.

`ignore_missing_imports` le dice a mypy que no se queje de un import que no encuentra. Pero lo que no
encuentra pasa a ser `Any`, y todo lo que dependa de ello deja de comprobarse en silencio. Es
quitarle la pila al detector de humo: deja de pitar, y también de vigilar.

Es lo que pasó en SnakeORM, y su `pyproject.toml` lo documenta: unas demos que se revisaban desde la
carpeta equivocada no resolvían sus imports, y mypy recorría toda esa capa sin comprobar un solo tipo
entre módulos. Antes de poner `ignore_missing_imports`, comprueba que el import de verdad no se puede
resolver.

Y cuando haga falta un `# type: ignore`, que sea con el código del error: `# type: ignore[assignment]`.
Así no tapa otros errores de la misma línea, y `warn_unused_ignores` te avisará el día que sobre.

## 7. Cuando Python cambia las reglas: las anotaciones de 3.14

Python 3.14 trajo la [PEP 649](https://peps.python.org/pep-0649/): las anotaciones se evalúan tarde,
solo cuando alguien las pide. Una consecuencia: ya no están en el `__dict__` de la clase.

SnakeORM leía los tipos de cada columna así, y en 3.14 empezó a recibir un diccionario vacío. Cada
columna caía a `object`, y el ORM lo rechazaba con este error
([log del CI](https://github.com/velezanthony/snake-orm/actions/runs/33892126213/job/101086262725)):

```text
SnakeModelDefinitionError: Quoter.id is declared with snake_int(), which only applies to a int
column, but its type is 'object'.
```

Fueron 7 tests fallidos y 11 errores, solo en Python 3.14, en Postgres y en SQLite. El
[arreglo](https://github.com/velezanthony/snake-orm/commit/919d2bd66f248f6120cd79d917399491ebc6c79b)
fue una línea:

::::tabs
:::tab[Antes]
```python
for attr, raw in vars(klass).get("__annotations__", {}).items():
```
:::
:::tab[Después]
```python
for attr, raw in inspect.get_annotations(klass).items():
```
:::
::::

`inspect.get_annotations` funciona igual en todas las versiones que el ORM admite. Ni mypy ni Pyright
podían avisar de esto: el código era correcto en tipos, lo que cambió fue el comportamiento de
Python. Lo encontró la matriz del CI, que ya probaba 3.14.

## En resumen

- **`--strict` es un paquete de reglas** que crece con cada versión de mypy: fija la versión.
- **`no_implicit_reexport`** obliga a declarar lo público, con `X as X` o con `__all__`.
- **En el CI, guarda `.mypy_cache`** o pagarás la primera ejecución siempre.
- **Pyright tiene cuatro modos y no admite plugins.**
- **Los dos a la vez funcionan** si cada uno tiene su trabajo y su severidad.
- **Relaja por módulo,** nunca en todo el proyecto, y desconfía de `ignore_missing_imports`: apaga la
  comprobación sin avisar.
- **Los tipos no te protegen de que Python cambie:** para eso está la matriz de versiones.

## Referencias

- [mypy: opciones de la línea de comandos (`--strict`)](https://mypy.readthedocs.io/en/stable/command_line.html#cmdoption-mypy-strict)
- [mypy: `--no-implicit-reexport`](https://mypy.readthedocs.io/en/stable/command_line.html#cmdoption-mypy-no-implicit-reexport)
- [mypy: modo incremental y caché](https://mypy.readthedocs.io/en/stable/command_line.html#incremental-mode)
- [mypy: configuración por módulo](https://mypy.readthedocs.io/en/stable/config_file.html#per-module-and-global-options)
- [Pyright: configuración y `typeCheckingMode`](https://microsoft.github.io/pyright/#/configuration)
- [Pyright: comentarios por archivo](https://microsoft.github.io/pyright/#/comments)
- [Pyright: diferencias con mypy](https://microsoft.github.io/pyright/#/mypy-comparison)
- [PEP 484: exportaciones explícitas](https://peps.python.org/pep-0484/#stub-files)
- [PEP 649: evaluación diferida de anotaciones](https://peps.python.org/pep-0649/)
- [`inspect.get_annotations`](https://docs.python.org/3/library/inspect.html#inspect.get_annotations)
- [django-stubs](https://github.com/typeddjango/django-stubs)
- [GitHub Actions: `actions/cache`](https://github.com/actions/cache)
