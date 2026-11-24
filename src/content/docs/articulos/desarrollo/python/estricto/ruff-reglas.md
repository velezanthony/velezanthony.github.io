---
seo:
  title: "Ruff: qué reglas activar y por qué"
  description: "Qué familias de reglas de Ruff activar, arreglos seguros e inseguros, excepciones por carpeta y cómo evitar tres versiones de Ruff distintas en un proyecto."
  image:
    src: /og/articulos/desarrollo/python/estricto/ruff-reglas.png
    alt: "Ruff: qué reglas activar y por qué"
  schema:
    - '@type': TechArticle
      headline: "Ruff a fondo: qué reglas activar y cómo no tener tres versiones"
      description: "Qué familias de reglas de Ruff activar, arreglos seguros e inseguros, excepciones por carpeta y cómo evitar tres versiones de Ruff distintas en un proyecto."
      image: https://velezanthony.github.io/og/articulos/desarrollo/python/estricto/ruff-reglas.png
      inLanguage: es
      datePublished: '2026-11-23'
      dateModified: '2026-11-23'
      author:
        '@type': Person
        '@id': https://velezanthony.github.io/#anthony
        name: Anthony Velez Tapia
        url: https://velezanthony.github.io/
---

# Ruff a fondo: qué reglas activar y cómo no tener tres versiones

[SnakeORM](https://velezanthony.github.io/snake-orm/) pasa [Ruff](https://docs.astral.sh/ruff/)
limpio con la versión que tiene fijada. Con una versión más nueva, sin tocar una línea de código,
salen **1.872 avisos**.

Ruff es la capa más fácil de poner: se instala y en un segundo te ha revisado todo. Lo difícil es lo
de después: qué reglas activas, qué arreglos dejas que haga solo y qué versión corre en cada sitio.
Lo cuento con SnakeORM y con
[Django Cotton Gallery](https://velezanthony.github.io/django-cotton-gallery/), que lo configuran de
forma muy distinta.

Forma parte de la serie [Python estricto](stack-python-estricto.md).

## 1. Las familias de reglas

:::note[Las familias más útiles]{collapsed}

| Prefijo | Familia | Qué atrapa |
|---|---|---|
| `F` | Pyflakes | imports y variables sin usar, nombres sin definir |
| `E`, `W` | pycodestyle | estilo y avisos, como secuencias de escape inválidas |
| `I` | isort | el orden de los imports |
| `B` | flake8-bugbear | trampas habituales, como un valor por defecto mutable |
| `UP` | pyupgrade | sintaxis antigua para tu versión de Python |
| `SIM` | flake8-simplify | código que se puede simplificar |
| `C4` | flake8-comprehensions | comprensiones mal escritas |
| `DJ` | flake8-django | malas prácticas de Django |
| `S` | flake8-bandit | problemas de seguridad |
| `RUF` | Ruff | reglas propias de Ruff |

:::

Las reglas de Ruff se agrupan en familias, cada una con su prefijo (`F`, `E`, `B`…). Si no eliges
ninguna, Ruff usa su conjunto por defecto. Y ese conjunto **cambió en la versión 0.16**: pasó de 59
reglas a 413.

| Versión de Ruff | Reglas activadas sin configurar nada |
|---|---|
| 0.15.20 | 59 (`E4`, `E7`, `E9` y `F`) |
| 0.16.0 | 413 |
| 0.17.0 | 407 |

## 2. `select` o `extend-select`: la diferencia que te puede romper el CI

Hay dos formas de decir qué reglas quieres:

- **`select` sustituye** el conjunto por defecto. Solo se revisa lo que está en tu lista.
- **`extend-select` lo amplía.** Se revisa el conjunto por defecto de tu versión de Ruff, más lo tuyo.

`select` es pedir a la carta: solo te traen lo que pides. `extend-select` es el menú del día con tus
extras: si el cocinero cambia el menú, te llegan platos nuevos.

Mis dos proyectos usan una cada uno:

::::tabs
:::tab[Django Cotton Gallery: select]
```toml
[tool.ruff]
line-length = 100
target-version = "py310"

[tool.ruff.lint]
select = ["E", "W", "F", "I", "B", "UP", "SIM", "C4", "DJ", "RUF"]
```
:::
:::tab[SnakeORM: extend-select]
```toml
[tool.ruff.lint]
extend-select = ["W605"]
```
:::
::::

[El de SnakeORM](https://github.com/velezanthony/snake-orm/blob/main/pyproject.toml) parece pobre, pero cada línea tiene su motivo escrito en un
comentario:

- **`W605`, una secuencia de escape inválida**, como un `\d` suelto dentro de un texto. Hoy Python
  solo avisa (`SyntaxWarning`), pero dejará de aceptarlo. En SnakeORM apareció al probar con Python 3.14.
- **Sin `I`, a propósito.** Se probó, y el arreglo automático reordenó los imports de un archivo de
  tests donde el **orden de registro** es justo lo que se prueba. Además, el generador de migraciones
  escribe sus propios bloques de imports, que dejarían de pasar la revisión.

El problema es que `extend-select` hereda el conjunto por defecto, y ese conjunto depende de la
versión. SnakeORM tiene fijada la 0.15.20 en su
[`uv.lock`](https://github.com/velezanthony/snake-orm/blob/main/uv.lock), y con ella pasa limpio. Con la 0.17.6, el mismo código da **1.872 avisos**:

| Regla | Avisos | Qué es |
|---|---|---|
| `PLC0414` | 941 | un import con alias igual a su nombre (`X as X`) |
| `I001` | 500 | imports desordenados: la regla que SnakeORM decidió **no** activar |
| `RUF100` | 161 | comentarios `# noqa` que ya no silencian nada |
| otras | 270 | |

Nadie ha tocado la configuración. Basta con que una actualización suba Ruff, por ejemplo una PR de
Dependabot o un `uv lock --upgrade`, para que el CI se ponga en rojo. Django Cotton Gallery no tiene
este riesgo: con `select`, las reglas nuevas del conjunto por defecto no le afectan.

La lección: si usas `extend-select`, fija la versión de Ruff y revisa el cambio de reglas al
actualizarla. Si prefieres no depender de lo que Ruff decida por defecto, usa `select`.

## 3. Arreglos seguros y arreglos inseguros

Ruff no solo avisa: muchas reglas saben arreglarse solas. Pero separa los arreglos en dos tipos:

- **Seguros:** no cambian lo que hace el código. `--fix` los aplica.
- **Inseguros:** pueden cambiar su comportamiento. Solo se aplican si añades `--unsafe-fixes`.

Es como un corrector que arregla una tilde sin preguntarte, pero te pregunta antes de cambiar una
palabra por otra.

Un ejemplo genérico con tres errores:

::::tabs
:::tab[El código]
```python
import os


def add_tag(tag, tags=[]):
    tags.append(tag)
    return tags


PATTERN = "\d+"
```
:::
:::tab[ruff check --fix]
```diff
-import os
 ...
-PATTERN = "\d+"
+PATTERN = r"\d+"
```

Quita el import (`F401`) y convierte el texto en uno *raw* (`W605`). El `tags=[]` (`B006`) lo deja:
su arreglo es inseguro.
:::
:::tab[ruff check --fix --unsafe-fixes]
```diff
-def add_tag(tag, tags=[]):
+def add_tag(tag, tags=None):
+    if tags is None:
+        tags = []
```

Ahora sí arregla `B006`. Es inseguro porque cambia el comportamiento: si algún código contaba con
que la lista se compartiera entre llamadas, deja de hacerlo.
:::
::::

El hook de pre-commit de Django Cotton Gallery usa solo `--fix`: los arreglos inseguros se quedan
para aplicarlos a mano, viendo el cambio.

## 4. Excepciones: por carpeta y por línea

Una regla no siempre tiene sentido en todo el proyecto. Para eso están las excepciones por carpeta
(`per-file-ignores`) y, para un caso suelto, `# noqa: <código>` en la línea.

Hay una trampa: **Ruff no avisa de una excepción que no hace nada**. En Django Cotton Gallery, la
configuración desactiva en los tests la regla de los `assert`:

```toml
[tool.ruff.lint.per-file-ignores]
"src/tests/**" = ["S101"]
```

Pero `S101` es de la familia `S`, que no está en `select`. La regla nunca se activa, así que la
excepción no hace nada. Si la activas sin la excepción, salen **754 avisos**, uno por cada `assert` de
los tests. El código de la librería no tiene ninguno.

:::tip[`RUF100`: los `noqa` que sobran]

Con `RUF100`, Ruff sí avisa de un `# noqa` que ya no silencia nada. Para `per-file-ignores` no hay
equivalente: revísalos a mano cuando cambies `select`.

:::

## 5. El formateador

`ruff format` deja todo el código con el mismo estilo, compatible con Black. Lo único que suele
cambiar entre proyectos es el ancho de línea: Django Cotton Gallery usa 100 y SnakeORM, el de serie,
88.

También se puede excluir algún archivo. SnakeORM no formatea sus tests de tipos, porque en ellos **la
posición de cada línea es el contrato**: cada comentario `# EXPECT:` marca la línea exacta que debe
dar error, y reformatear la movería.

Y el formateador también cambia con las versiones. Desde la 0.16, `ruff format` formatea además los
bloques de código Python que hay dentro de los archivos Markdown. En SnakeORM, con la 0.15.20 todo
está formateado; con la 0.17.6, `ruff format --check .` pide reformatear **54 archivos, todos `.md`
de la documentación**. Si no quieres que toque la documentación, limita el formateador a tu código
(`ruff format src`) o excluye los `.md`.

## 6. Una versión, no tres

Ruff cambia de una versión a otra: reglas nuevas, conjuntos por defecto nuevos, el formateador que
decide distinto. Si cada sitio usa una versión, lo que pasa en tu máquina falla en el
CI.

En Django Cotton Gallery ya pasó una vez: en una
[PR](https://github.com/velezanthony/django-cotton-gallery/pull/6), el hook y el CI usaban versiones
distintas y
[falló el formateo en el CI](https://github.com/velezanthony/django-cotton-gallery/actions/runs/28680973089/job/85064209151)
(lo cuento en el [artículo de la serie](stack-python-estricto.md)). Al revisarlo para este artículo,
el problema seguía ahí, solo que dormido:

| Dónde | De dónde sale la versión | Versión |
|---|---|---|
| Tu máquina (`make lint`) | [`uv.lock`](https://github.com/velezanthony/django-cotton-gallery/blob/main/uv.lock) | 0.15.12 |
| El hook de pre-commit | [`.pre-commit-config.yaml`](https://github.com/velezanthony/django-cotton-gallery/blob/main/.pre-commit-config.yaml) | 0.15.20 |
| El CI | `ruff>=0.15` en el `pyproject.toml` | [0.17.6](https://github.com/velezanthony/django-cotton-gallery/actions/runs/45062929972/job/137332651662) |

El CI usa la acción oficial de Ruff, que lee el `pyproject.toml` e instala **la última versión que
cumpla** `>=0.15`. Hoy es la 0.17.6. Las tres versiones pasan hoy sobre el mismo código, pero por
suerte: la próxima versión de Ruff que cambie el formateo volverá a romper el CI.

El arreglo es fijar **una sola versión exacta**:

```toml
[project.optional-dependencies]
dev = ["ruff==0.15.20"]
```

Con `==`, la acción del CI instala justo esa, y `uv.lock` también. Queda el hook, que tiene su propia
versión: o la cambias a mano a la vez, o haces que el hook use el Ruff del proyecto en lugar de
descargar el suyo:

```yaml
- repo: local
  hooks:
    - id: ruff
      name: ruff
      entry: uv run ruff check --fix
      language: system
      types: [python]
```

## 7. Una configuración para empezar

Para un proyecto nuevo, este es un buen punto de partida, basado en el de Django Cotton Gallery.
Quita o añade reglas según lo que te encuentres, como hizo SnakeORM con `I`.

```toml
[tool.ruff]
line-length = 100
target-version = "py312"  # tu versión mínima de Python

[tool.ruff.lint]
select = ["E", "W", "F", "I", "B", "UP", "SIM", "C4", "RUF"]  # y "DJ" en un proyecto Django

[tool.ruff.lint.per-file-ignores]
# Solo si activas "S" (o "S101"); si no, esta excepción no hace nada.
"tests/**" = ["S101"]
```

## En resumen

| Decisión | Recomendación |
|---|---|
| Qué reglas activar | Empieza por `E`, `W`, `F`, `I`, `B`, `UP`, `SIM`, `C4` y `RUF`, y quita las que choquen con tu proyecto |
| `select` o `extend-select` | `select` para no depender del conjunto por defecto; con `extend-select`, revisa las reglas nuevas al subir de versión |
| Arreglos automáticos | `--fix` en el hook; los inseguros, a mano |
| Excepciones | Por carpeta o por línea, y revisa que la regla esté activada |
| Versiones | Una sola versión exacta (`==`) para tu máquina, el hook y el CI |

## Referencias

- [Ruff: reglas](https://docs.astral.sh/ruff/rules/)
- [Ruff: configuración](https://docs.astral.sh/ruff/configuration/)
- [Ruff: reglas activadas por defecto](https://docs.astral.sh/ruff/default-rules/)
- [Ruff 0.16: el nuevo conjunto por defecto y el formateo de Markdown](https://github.com/astral-sh/ruff/blob/main/changelogs/0.16.x.md)
- [Ruff: arreglos seguros e inseguros](https://docs.astral.sh/ruff/linter/#fix-safety)
- [Ruff: el formateador](https://docs.astral.sh/ruff/formatter/)
- [Ruff: `RUF100`](https://docs.astral.sh/ruff/rules/unused-noqa/)
- [ruff-action: elegir la versión](https://github.com/astral-sh/ruff-action#install-specific-versions)
- [ruff-pre-commit](https://github.com/astral-sh/ruff-pre-commit)
- [pre-commit: hooks locales](https://pre-commit.com/#repository-local-hooks)
