---
seo:
  title: "Stack para un Python estricto"
  description: "Las herramientas para que un proyecto Python falle antes de producción: uv, Ruff, mypy y Pyright, tests de tipos, Hypothesis, cobertura, deptry y CI."
  image:
    src: /og/articulos/desarrollo/python/estricto/stack-python-estricto.png
    alt: "Stack para un Python estricto"
  schema:
    - '@type': TechArticle
      headline: "Python estricto: las herramientas que te avisan antes de producción"
      description: "Las herramientas para que un proyecto Python falle antes de producción: uv, Ruff, mypy y Pyright, tests de tipos, Hypothesis, cobertura, deptry y CI."
      image: https://velezanthony.github.io/og/articulos/desarrollo/python/estricto/stack-python-estricto.png
      inLanguage: es
      datePublished: '2026-11-23'
      dateModified: '2026-11-23'
      author:
        '@type': Person
        '@id': https://velezanthony.github.io/#anthony
        name: Anthony Velez Tapia
        url: https://velezanthony.github.io/
---

# Python estricto: las herramientas que te avisan antes de producción

Vengo de .NET. Allí, si llamas a un método con el tipo equivocado, el proyecto no compila y te
enteras antes de ejecutar nada. En Python no: el código arranca, y el error aparece cuando esa línea
se ejecuta, a veces en producción.

Python acepta anotaciones de tipos, pero **no las comprueba**: al ejecutar, las ignora. Es lo mismo
que TypeScript, cuyos tipos desaparecen al convertirse en JavaScript. La diferencia es que en
TypeScript el compilador los revisa antes; en Python ese compilador lo tienes que montar tú.

Y el compilador es solo la primera red. Hacen falta otras para la lógica, para las dependencias, para
el paquete que publicas y para cada sistema donde se va a ejecutar. Esta es la lista de las que uso,
y de alguna más que conviene conocer.

Aquí cuento cómo lo monté en [Django Cotton Gallery](https://velezanthony.github.io/django-cotton-gallery/),
una librería para Django con el [código público en GitHub](https://github.com/velezanthony/django-cotton-gallery). Los ejemplos salen de su
repositorio, con enlace a cada archivo: qué herramienta pone cada pieza, qué error atrapa y cuándo se ejecuta.

:::note[¿Python no compila?]{collapsed}

Sí compila, pero a *bytecode*, las instrucciones que luego ejecuta su intérprete. Ese paso no revisa
tipos ni comprueba que una función exista: solo traduce. Por eso un error de tipos no se ve hasta que
la línea se ejecuta.

:::

## 1. La base: un solo archivo de configuración

Todo el proyecto se describe en un [`pyproject.toml`](https://github.com/velezanthony/django-cotton-gallery/blob/main/pyproject.toml): dependencias, versión de Python y la
configuración de cada herramienta.

Para el entorno, lo de siempre es `venv` y `pip`, que vienen con Python: `python -m venv .venv` crea
el entorno virtual y `pip install -e .` instala el proyecto en él. Funciona, pero `pip` no guarda las
versiones exactas de lo que instala: cada uno las fija a su manera, con un `requirements.txt` o con
otra herramienta.

[uv](https://docs.astral.sh/uv/) hace lo mismo y más: crea el entorno, instala las dependencias
mucho más rápido, descarga la versión de Python que pidas y guarda las versiones exactas en
`uv.lock`. Quien clone el repositorio tiene lo mismo que tú.

| Con `venv` y `pip` | Con uv |
|---|---|
| `python -m venv .venv` | `uv venv` |
| `pip install -e ".[test]"` | `uv pip install -e ".[test]"` o `uv sync` |
| Versiones exactas: a mano (`pip freeze > requirements.txt`) | `uv.lock`, automático |
| Python: el que tengas instalado | `uv python install 3.12` |

Dos detalles de estructura que ayudan después:

- **El código vive en `src/`**, separado de la raíz del repositorio. Así nada importa por accidente
  un archivo suelto de la raíz que no forma parte del paquete.
- **Un archivo vacío `py.typed`** dentro del paquete ([el de la galería](https://github.com/velezanthony/django-cotton-gallery/blob/main/src/django_cotton_gallery/py.typed)) avisa a quien lo use de que trae tipos. Sin él,
  su comprobador de tipos ignora los tuyos.

## 2. Ruff: el estilo y los errores tontos

[Ruff](https://docs.astral.sh/ruff/) hace dos trabajos: **formatea** el código para que todo tenga el
mismo estilo y **revisa** reglas que señalan errores habituales. Es muy rápido, y sustituye a varias
herramientas que antes iban por separado (flake8, isort, pyupgrade…).

Cada familia de reglas se activa por su prefijo. Estas son las que activa [Django Cotton Gallery](https://velezanthony.github.io/django-cotton-gallery/) en su
[`pyproject.toml`](https://github.com/velezanthony/django-cotton-gallery/blob/main/pyproject.toml):

```toml
[tool.ruff.lint]
select = [
    "E", "W",  # estilo (pycodestyle)
    "F",       # errores lógicos: imports o variables sin usar (pyflakes)
    "I",       # orden de los imports
    "B",       # trampas habituales (bugbear)
    "UP",      # sintaxis moderna para tu versión de Python
    "SIM",     # código que se puede simplificar
    "C4",      # comprensiones de listas mejor escritas
    "DJ",      # buenas prácticas de Django
    "RUF",     # reglas propias de Ruff
]
```

Un ejemplo genérico de lo que atrapa `B`: una lista como valor por defecto. Python la crea **una sola vez**,
así que todas las llamadas comparten la misma lista:

```python
def add_tag(tag, tags=[]):  # B006: valor por defecto mutable
    tags.append(tag)
    return tags
```

Funciona en tu primera prueba y falla en la segunda. Ruff lo marca sin ejecutar nada.

Un caso aparte son los `assert`. Python los elimina si se ejecuta con `-O`, así que no sirven para
comprobar nada importante en el código de la aplicación. Si quieres que Ruff avise de cada `assert`
en tu código, activa la regla `S101` y desactívala en los tests, donde pytest los necesita. Si no,
no pongas ninguna de las dos:

```toml
[tool.ruff.lint]
extend-select = ["S101"]

[tool.ruff.lint.per-file-ignores]
"tests/**" = ["S101"]
```

**A fondo:** [Ruff: qué reglas activar y cómo no tener tres versiones](ruff-reglas.md).

## 3. mypy en modo estricto: el compilador que faltaba

[mypy](https://mypy.readthedocs.io/) lee las anotaciones y comprueba que el código las respeta. Es lo
más parecido al compilador de .NET. Con `strict = true` deja de ser amable:

- toda función tiene que tener sus tipos anotados;
- no puedes devolver un valor sin tipo (`Any`) donde prometes uno concreto;
- avisa de comparaciones imposibles y de `# type: ignore` que ya no hacen falta.

El caso típico es un valor que puede ser `None` (otro ejemplo genérico):

```python
def find_component(name: str) -> Component | None: ...

component = find_component("button")
component.render()  # error: "None" no tiene el atributo "render"
```

En ejecución, esto solo falla el día en que el componente no existe. mypy obliga a decidir qué pasa
en ese caso antes de que ocurra.

Con Django hace falta [django-stubs](https://github.com/typeddjango/django-stubs), que le enseña a
mypy los tipos de Django: modelos, `QuerySet`, peticiones. Y el modo estricto también se puede
relajar donde no compensa. En [Django Cotton Gallery](https://velezanthony.github.io/django-cotton-gallery/), los *templatetags* reciben objetos internos del motor de
plantillas sin tipos útiles, y ahí lo desactivo para ese módulo, en lugar de llenarlo de `Any`
([`pyproject.toml`](https://github.com/velezanthony/django-cotton-gallery/blob/main/pyproject.toml)):

```toml
[tool.mypy]
strict = true
plugins = ["mypy_django_plugin.main"]

[[tool.mypy.overrides]]
module = "django_cotton_gallery.templatetags.*"
disallow_untyped_defs = false
```

:::tip[¿mypy o Pyright?]{collapsed}

[Pyright](https://microsoft.github.io/pyright/) hace lo mismo y es el motor que usa VS Code
(Pylance) para subrayarte los errores mientras escribes. ¿Cuál es más rápido? Depende de si mypy
tiene su caché: guarda lo que ya revisó en `.mypy_cache` y en la siguiente pasada solo mira lo que
cambió. Pyright no guarda nada entre una ejecución y otra. Medido sobre [Django Cotton Gallery](https://velezanthony.github.io/django-cotton-gallery/):

| | Primera ejecución | Siguientes |
|---|---|---|
| mypy | 5,2 s | 1,0 s |
| Pyright | 2,5 s | 2,5–2,9 s |

En tu máquina, con la caché ya hecha, mypy gana. En el CI, que empieza de cero, gana Pyright, salvo
que guardes la carpeta `.mypy_cache` entre ejecuciones.

Y no tienes por qué elegir. En [SnakeORM](https://velezanthony.github.io/snake-orm/), un ORM, pasan los dos sobre el mismo código, porque el
ORM promete funcionar con cualquiera de ellos ([`pyproject.toml`](https://github.com/velezanthony/snake-orm/blob/main/pyproject.toml)).

En un proyecto Django, mypy tiene además el plugin de Django, que entiende cosas como los campos de
un modelo. Por eso el CI de [Django Cotton Gallery](https://velezanthony.github.io/django-cotton-gallery/) usa mypy ([`lint.yml`](https://github.com/velezanthony/django-cotton-gallery/blob/main/.github/workflows/lint.yml)).

:::

**A fondo:** [mypy y Pyright en modo estricto](mypy-pyright-estricto.md) y
[el ORM de Django tipado](django-orm-tipado.md).

### Tests de tipos: que los tipos digan lo que prometen

Si tu código **es** una API con tipos, como un ORM, los tipos también se prueban. En [SnakeORM](https://velezanthony.github.io/snake-orm/) hay dos
archivos que nunca se ejecutan, solo los leen mypy y Pyright:

- **[`cases_positive.py`](https://github.com/velezanthony/snake-orm/blob/main/src/test/typing/cases_positive.py)** fija con `assert_type` qué tipo
  tiene que deducir el comprobador. Si un cambio hace que una consulta devuelva `Any` en lugar de
  `list[Nomina]`, falla.
- **[`cases_negative.py`](https://github.com/velezanthony/snake-orm/blob/main/src/test/typing/cases_negative.py)** contiene errores a propósito, cada
  uno marcado con el que debe dar:

```python
truck = Truck(id=1, model="Ibiza", maker_id=1)
truck.no_declarada  # EXPECT: attr-defined
model: str = truck.id  # EXPECT: assignment
```

[Un test](https://github.com/velezanthony/snake-orm/blob/main/src/test/typing/test_type_checkers.py) pasa los dos comprobadores sobre esos archivos y
exige que den error **exactamente** en esas líneas. Si un día el código deja de rechazar
`truck.no_declarada`, el tipado ha abierto un agujero y el test lo dice.

**A fondo:** [Tests de tipos](tests-de-tipos.md).

## 4. Los tests: de los casos conocidos a los que no se te ocurren

Los tipos no dicen si el código hace lo correcto. Para eso están los tests, con
[pytest](https://docs.pytest.org/) y tres complementos:

- **[pytest-django](https://pytest-django.readthedocs.io/)** para probar vistas y plantillas.
- **[Hypothesis](https://hypothesis.readthedocs.io/)** para los casos que no se te ocurren. En lugar
  de escribir tú las entradas, describes cómo son y Hypothesis genera cientos.
- **[Playwright](https://playwright.dev/python/)** para probar la página en un navegador de verdad.

El mejor ejemplo lo tengo en otro proyecto, [SnakeORM](https://velezanthony.github.io/snake-orm/), un
ORM. La propiedad es sencilla: **cualquier valor que guardes en la base de datos tiene que volver
idéntico al leerlo**. En lugar de elegir yo unos pocos valores,
[el test](https://github.com/velezanthony/snake-orm/blob/main/src/test/integration/test_round_trip_property.py) le pide a Hypothesis decenas por cada tipo, en Postgres y en SQLite: enteros en el
límite de los 64 bits, textos con cualquier carácter, fechas con microsegundos, decimales largos.

Lo interesante es cómo se acotan las entradas:

```python
_INTEGERS = st.integers(min_value=-(2**63), max_value=2**63 - 1)
_TEXTS = st.text(alphabet=st.characters(codec="utf-8", exclude_characters="\x00"))
_FLOATS = st.floats(allow_nan=False, allow_infinity=False)
```

Cada exclusión tiene su motivo: un `NaN` no puede volver idéntico porque `NaN != NaN`, y el carácter
nulo (`\x00`) no cabe en un texto en ninguna base de datos. Acotar a lo que el contrato promete está
bien; excluir algo sin motivo sería esconder un error.

Si Hypothesis encuentra un valor que lo rompe, lo reduce al ejemplo más corto posible antes de
enseñártelo.

**A fondo:** [pytest: de las fixtures a los tests que fallan a veces](pytest-a-fondo.md).

### Cobertura: qué código no prueba nadie

[pytest-cov](https://pytest-cov.readthedocs.io/) mide qué líneas ejecutan los tests. En [Django Cotton Gallery](https://velezanthony.github.io/django-cotton-gallery/) mide
también las ramas (`branch = true` en su [`pyproject.toml`](https://github.com/velezanthony/django-cotton-gallery/blob/main/pyproject.toml)): no basta con
pasar por un `if`, hay que pasar por el sí y por el no. El CI sube el informe a
[Codecov](https://about.codecov.io/) desde una sola combinación de la matriz
([`test.yml`](https://github.com/velezanthony/django-cotton-gallery/blob/main/.github/workflows/test.yml)).

### Mutation testing: ¿tus tests prueban algo?

Una cobertura del 100 % solo dice que los tests **pasan** por el código, no que comprueben lo que
hace. El mutation testing lo mide al revés: cambia el código a propósito (un `>` por un `>=`, un
`True` por un `False`) y mira si algún test falla. Si ninguno falla, ese cambio, ese «mutante»,
sobrevive, y has encontrado un hueco en tus tests.

En Python, la herramienta es [mutmut](https://mutmut.readthedocs.io/), que funciona con pytest. En
estos proyectos aún no la uso, pero sí uso el mismo principio con [Stryker](https://stryker-mutator.io/)
en [@velezanthony/design](https://velezanthony.github.io/design/), mi librería de documentación, que
es TypeScript: la herramienta cambia, la idea es la misma.

:::warning[Ojo: multiplica el tiempo de los tests]

Cada mutante vuelve a pasar los tests, así que el coste es mutantes por tests. Actívalo solo en los
módulos donde un fallo silencioso sale caro (lógica de negocio, cálculos, validación) y no en cada
commit.

En @velezanthony/design, mutar toda la librería son unos 12.000 mutantes. En la
[última pasada completa](https://github.com/velezanthony/design/actions/runs/44436499883), 12 máquinas
tardaron **10 minutos** de principio a fin, entre 4 y 9 minutos cada una. Sumando lo que trabajaron
todas, unos 70 minutos: lo que tardaría una sola máquina. Lo reparto así:

| Cuándo | Máquinas | Qué hace |
|---|---|---|
| En cada PR ([`mutation-incremental.yml`](https://github.com/velezanthony/design/blob/main/.github/workflows/mutation-incremental.yml)) | 2 | Parte de la caché y solo repite los mutantes cuyo código o tests han cambiado |
| A mano, sobre `main` ([`mutation.yml`](https://github.com/velezanthony/design/blob/main/.github/workflows/mutation.yml)) | 12 por defecto, hasta 20 (recomiendo no pasar de 16) | Pasa todos los mutantes y guarda la caché nueva de la que parten las PR |

La pasada completa va sobre `main` porque las PR no ven las cachés de otras ramas.

:::

**A fondo:** [Mutation testing: el test que prueba tus tests](mutation-testing.md).

## 5. Las dependencias: lo que no escribes tú

Buena parte del código que se ejecuta en producción no es tuyo. Tres herramientas lo vigilan:

- **[Dependabot](https://docs.github.com/es/code-security/dependabot)** abre una PR cada vez que sale
  una versión nueva de una dependencia. En [Django Cotton Gallery](https://velezanthony.github.io/django-cotton-gallery/) revisa cada semana las de Python y las acciones
  del CI ([`dependabot.yml`](https://github.com/velezanthony/django-cotton-gallery/blob/main/.github/dependabot.yml)). Como cada PR pasa por el CI, sabes si la
  actualización rompe algo antes de aceptarla.
- **[deptry](https://deptry.com/)** compara lo que importa tu código con lo que declara tu
  `pyproject.toml`: avisa de una dependencia que usas sin declarar (en tu máquina funciona porque la
  tienes instalada por otra vía) y de una que declaras y ya no usas.
- **[pip-audit](https://github.com/pypa/pip-audit)** busca tus dependencias en las bases de datos de
  vulnerabilidades conocidas.

## 6. La matriz: todas las versiones y tres sistemas

Una librería no se ejecuta solo en tu máquina. [Django Cotton Gallery](https://velezanthony.github.io/django-cotton-gallery/) admite Python 3.10 a 3.13 y Django 4.2 a
6.0, y hay que probar las combinaciones. Lo hago en dos sitios.

**En local, con [tox](https://tox.wiki/).** Crea un entorno aislado por combinación y pasa los tests
en cada uno. Una línea de su [`tox.ini`](https://github.com/velezanthony/django-cotton-gallery/blob/main/tox.ini) describe toda la matriz:

```ini
[tox]
envlist =
    py310-django{42,50,51,52}
    py311-django{42,50,51,52}
    py312-django{42,50,51,52,60}
    py313-django{51,52,60}
```

**En GitHub Actions, con una matriz** ([`test.yml`](https://github.com/velezanthony/django-cotton-gallery/blob/main/.github/workflows/test.yml)). Las mismas combinaciones en Linux y, además, unas pocas en
Windows y macOS: no todas, que serían más de 50 trabajos, sino Python 3.12 con las versiones de
Django con soporte largo.

Esas pocas ya han pagado su sitio. Una página de [Django Cotton Gallery](https://velezanthony.github.io/django-cotton-gallery/) enseñaba la ruta de la carpeta de
componentes con `str(path)`, que en Windows usa barras invertidas (`C:\…\templates\cotton`). En la
[primera PR](https://github.com/velezanthony/django-cotton-gallery/pull/1), todos los trabajos de Linux y macOS pasaron y solo fallaron los dos de
Windows ([Django 4.2](https://github.com/velezanthony/django-cotton-gallery/actions/runs/28534007983/job/84590583389) y
[Django 5.2](https://github.com/velezanthony/django-cotton-gallery/actions/runs/28534007983/job/84590583394)). El
[arreglo](https://github.com/velezanthony/django-cotton-gallery/commit/fcb8a9d0e0e76a9351f30e192af64ab1b47fe259) fue cambiar `str(path)` por
`path.as_posix()`, que usa `/` en cualquier sistema. Sin Windows en la matriz, lo habría descubierto
un usuario.

**A fondo:** [La matriz de CI: lo que solo falla en otra versión o en otro sistema](matriz-ci-python.md).

## 7. El paquete: comprobarlo antes de publicarlo

Si publicas en PyPI, el paquete también puede salir roto: un archivo que falta, metadatos que PyPI
rechaza. En [Django Cotton Gallery](https://velezanthony.github.io/django-cotton-gallery/), el workflow de publicación ([`release.yml`](https://github.com/velezanthony/django-cotton-gallery/blob/main/.github/workflows/release.yml))
construye el paquete con `python -m build` y lo valida con `twine check` antes de subirlo.

El propio proyecto tiene un ejemplo de por qué importa. La versión 1.32 de [hatchling](https://hatch.pypa.io/), la herramienta
que construye el paquete, genera metadatos en un formato más nuevo del que `twine` acepta. Por eso el
[`pyproject.toml`](https://github.com/velezanthony/django-cotton-gallery/blob/main/pyproject.toml) la limita a `hatchling<1.32`, con un comentario que explica
el motivo.

## 8. Que todo pase antes de cada commit

Si las comprobaciones solo corren en el CI, te enteras tarde. Con
[pre-commit](https://pre-commit.com/) ([su configuración](https://github.com/velezanthony/django-cotton-gallery/blob/main/.pre-commit-config.yaml)), Ruff se ejecuta en cada `git commit` y corrige lo que puede
antes de guardar el cambio. Y para no recordar comandos, un [`Makefile`](https://github.com/velezanthony/django-cotton-gallery/blob/main/Makefile) con uno por tarea:

| Comando | Qué hace |
|---|---|
| `make lint` | Ruff revisa el código |
| `make typecheck` | mypy en modo estricto |
| `make test` | los tests en tu versión de Python |
| `make matrix` | tox con todas las combinaciones |

Una lección de aquí: **las versiones del hook y del CI tienen que coincidir**. En una
[PR](https://github.com/velezanthony/django-cotton-gallery/pull/6) de [Django Cotton Gallery](https://velezanthony.github.io/django-cotton-gallery/), el hook de pre-commit usaba Ruff 0.15.12 y el CI la 0.15.20. En local
el código pasaba el formateo, pero en el CI
[falló el paso «Check formatting»](https://github.com/velezanthony/django-cotton-gallery/actions/runs/28680973089/job/85064209151). Lo arreglé
[reformateando con la versión del CI](https://github.com/velezanthony/django-cotton-gallery/commit/fa08fb2f499269c3547d8096cc90a6d7aeb34e8a) y
[subiendo la del hook](https://github.com/velezanthony/django-cotton-gallery/commit/41a5b69c27d7452d71a21fcb352608bcc2ff4be3), que ahora lleva un
comentario para mantenerlas iguales.

## Otras que conviene conocer

No las uso en estos proyectos, pero resuelven problemas que acabarás teniendo:

- **[import-linter](https://import-linter.readthedocs.io/)** impone reglas de arquitectura: por
  ejemplo, que la capa de dominio no importe nada de la web.
- **[nox](https://nox.thea.codes/)** hace lo mismo que tox, pero la configuración se escribe en
  Python en lugar de en un `.ini`.

## En resumen

| Capa | Herramienta | Qué atrapa | Cuándo |
|---|---|---|---|
| Entorno | uv | «en mi máquina funciona» | al instalar |
| Estilo y trampas | Ruff | valores por defecto mutables, imports sin usar | en cada commit y en el CI |
| Tipos | mypy estricto y Pyright | `None` inesperados, tipos que no encajan | en el editor y en el CI |
| Contrato de tipos | tests de tipos | tipos que dejan de rechazar código incorrecto | en el CI |
| Comportamiento | pytest, Hypothesis, Playwright | lógica rota, entradas raras, la página en el navegador | en local y en el CI |
| Calidad de los tests | cobertura y mutation testing | código sin probar, tests que no comprueban nada | en el CI |
| Dependencias | Dependabot, deptry, pip-audit | versiones viejas, dependencias sin declarar, vulnerabilidades | cada semana y en el CI |
| Compatibilidad | tox y la matriz del CI | versiones de Python y Django, Windows y macOS | en local y en el CI |
| Paquete | `build` y `twine check` | un paquete que PyPI rechaza | al publicar |

Ninguna capa sustituye a las demás. Juntas hacen lo que en .NET hacía el compilador, y bastante más.

## Referencias

- [uv](https://docs.astral.sh/uv/)
- [Ruff: reglas](https://docs.astral.sh/ruff/rules/)
- [mypy: modo estricto](https://mypy.readthedocs.io/en/stable/command_line.html#cmdoption-mypy-strict)
- [django-stubs](https://github.com/typeddjango/django-stubs)
- [PEP 561: distribuir paquetes con tipos (`py.typed`)](https://peps.python.org/pep-0561/)
- [Pyright](https://microsoft.github.io/pyright/)
- [pytest](https://docs.pytest.org/)
- [Hypothesis](https://hypothesis.readthedocs.io/)
- [Playwright para Python](https://playwright.dev/python/)
- [tox](https://tox.wiki/)
- [GitHub Actions: matrices](https://docs.github.com/es/actions/how-tos/write-workflows/choose-what-workflows-do/run-job-variations)
- [pre-commit](https://pre-commit.com/)
- [pytest-cov](https://pytest-cov.readthedocs.io/)
- [Stryker](https://stryker-mutator.io/)
- [mutmut](https://mutmut.readthedocs.io/)
- [Dependabot](https://docs.github.com/es/code-security/dependabot)
- [deptry](https://deptry.com/)
- [pip-audit](https://github.com/pypa/pip-audit)
- [twine](https://twine.readthedocs.io/)
- [import-linter](https://import-linter.readthedocs.io/)
- [nox](https://nox.thea.codes/)
