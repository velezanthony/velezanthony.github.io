---
seo:
  title: "pytest a fondo: fixtures y flaky tests"
  description: "pytest más allá de lo básico: fixtures tipadas, pytest-django, Hypothesis con st.data(), Playwright sin esperas fijas y avisos que se cuelan en tus tests."
  schema:
    - '@type': TechArticle
      headline: "pytest a fondo: de las fixtures a los tests que fallan a veces"
      description: "pytest más allá de lo básico: fixtures tipadas, pytest-django, Hypothesis con st.data(), Playwright sin esperas fijas y avisos que se cuelan en tus tests."
      inLanguage: es
      datePublished: '2026-11-23'
      dateModified: '2026-11-23'
      author:
        '@type': Person
        '@id': https://velezanthony.github.io/#anthony
        name: Anthony Velez Tapia
        url: https://velezanthony.github.io/
---

# pytest a fondo: de las fixtures a los tests que fallan a veces

En la release 1.0.0 de [Django Cotton Gallery](https://velezanthony.github.io/django-cotton-gallery/),
un test falló en un solo trabajo de los 20 de la matriz. Lo relanzas, sale verde, y el problema sigue
ahí.

Un test que falla siempre es fácil: lo lees y lo arreglas. El que da guerra es el que falla **a
veces**. Aquí cuento dos reales, ese y otro de [SnakeORM](https://velezanthony.github.io/snake-orm/),
qué tenían en común y, antes, las piezas de pytest que usan.

Forma parte de la serie [Python estricto](stack-python-estricto.md).

## 1. Fixtures: preparar el terreno, con tipos

Una fixture es una función que prepara lo que el test necesita y lo recoge después. Con `yield`, lo
que va antes prepara y lo que va después limpia, aunque el test falle.

En SnakeORM, una fixture abre una sesión contra la base de datos, crea la tabla y la cierra al
terminar ([`test_round_trip_property.py`](https://github.com/velezanthony/snake-orm/blob/main/src/test/integration/test_round_trip_property.py)):

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

Tres detalles en cuatro líneas:

| Detalle | Qué hace |
|---|---|
| `scope="module"` | Una sesión para todos los tests del archivo, no una por test |
| `params=[...]` | Cada test que la usa se ejecuta dos veces: una con Postgres y otra con SQLite |
| `-> Iterator[SnakeSession]` | El tipo de lo que entrega `yield`. mypy y el editor saben qué recibe el test |

Tipar las fixtures cuesta una línea y te da autocompletado en cada test que las usa.

## 2. pytest-django: un servidor de verdad para el navegador

[pytest-django](https://pytest-django.readthedocs.io/) trae fixtures listas para Django. Los tests de
navegador de Django Cotton Gallery encadenan cuatro
([`conftest.py`](https://github.com/velezanthony/django-cotton-gallery/blob/main/src/tests/e2e/conftest.py)):

```python
@pytest.fixture
def live_gallery(transactional_db, live_server, cotton_tree, settings):
    settings.TEMPLATES = [...]  # la galería lee una carpeta temporal de componentes
    ...
```

- **`live_server`** arranca un servidor de Django en un puerto libre, al que entra el navegador.
- **`transactional_db`** da una base de datos que ese servidor, en otro hilo, puede ver.
- **`settings`** cambia la configuración solo durante el test y la restaura después.
- **`cotton_tree`** es propia: crea en `tmp_path` una carpeta de componentes de prueba.

:::note[Playwright y Django en hilos distintos]{collapsed}

Playwright ejecuta su bucle de eventos en otro hilo, y Django se niega a cerrar conexiones desde un
contexto asíncrono (`SynchronousOnlyOperation`). El `conftest.py` de la galería pone
`DJANGO_ALLOW_ASYNC_UNSAFE=true` antes de importar Django, solo en los tests.

:::

## 3. Hypothesis con fixtures: `st.data()`

En el [artículo de la serie](stack-python-estricto.md) conté el test de ida y vuelta de SnakeORM, que
usa la fixture `session` de arriba:
cualquier valor que guardes tiene que volver idéntico. Su firma tiene tres piezas que merecen
explicación:

```python
@pytest.mark.parametrize("field", sorted(_FIELDS), ids=str)
@given(data=st.data())
@settings(max_examples=60, suppress_health_check=[HealthCheck.function_scoped_fixture])
def test_any_value_of_the_type_round_trips(field, session, data) -> None:
    value = data.draw(_FIELDS[field], label=field)
    ...
```

| Pieza | Por qué |
|---|---|
| `st.data()` y `data.draw(...)` | La estrategia depende de `field`, que llega de `parametrize`. Con `st.data()` se elige el valor **dentro** del test, cuando ya sabes qué columna toca |
| `max_examples=60` | Por defecto son 100 ejemplos; aquí, 60. Cada uno escribe y lee en una base de datos real, en dos motores y para cada tipo |
| `suppress_health_check` | Hypothesis avisa cuando un test con `@given` usa una fixture por función, porque esa fixture se reinicia una vez por test, **no** una vez por ejemplo. Aquí se silencia a sabiendas |

Como ninguna fixture se reinicia entre ejemplos, el test limpia a mano: cada ejemplo termina con un
`rollback`, aunque falle, para que los cientos de ejemplos no se pisen. En Postgres, además, una sentencia fallida deja la
transacción inservible, y sin ese `rollback` el siguiente ejemplo moriría por eso y no por su propio
error.

## 4. El test que fallaba en uno de veinte

Con el servidor de pytest-django, un test comprobaba que la página de comparar componentes pinta cada panel en su propio
`iframe`. En la release 1.0.0 falló en
[un solo trabajo de la matriz](https://github.com/velezanthony/django-cotton-gallery/actions/runs/34703673399/job/103579742357),
Python 3.10 con Django 5.2. Los otros diecinueve pasaron:

```text
FAILED test_compare_isolation.py::test_both_panels_render_in_their_own_document
AssertionError: assert 1 == 2
```

El fallo estaba en una línea que parece inocente:

::::tabs
:::tab[Antes]
```python
expect(page.locator(FRAME).first).to_be_attached(timeout=5000)
assert page.locator(FRAME).count() == page.locator(PANEL).count()
```
:::
:::tab[Después]
```python
# `count()` lee una vez; el segundo panel puede seguir llegando.
expect(page.locator(FRAME)).to_have_count(page.locator(PANEL).count(), timeout=10000)
```
:::
::::

`count()` es una foto; `expect()` es mirar por la ventana hasta que llegue quien esperas. `count()`
cuenta **una vez** y no espera. La primera línea esperaba al primer `iframe`, pero no al
segundo: en una máquina algo más lenta, el segundo aún no había llegado y el test vio 1 de 2.
`expect(...).to_have_count(...)` **reintenta** hasta que el número coincide o se agota el tiempo.

El [arreglo](https://github.com/velezanthony/django-cotton-gallery/commit/00ca74c7e9c5f8f0f1898fe9df6ffeb5b798e2c2)
([PR #14](https://github.com/velezanthony/django-cotton-gallery/pull/14)) cambió seis comprobaciones
con la misma forma, y de paso quitó un `wait_for_timeout(1500)`: en lugar de dormir un segundo y
medio, espera a que la página cambie.

:::tip[La regla de Playwright]

Comprueba con `expect(...)`, que reintenta, y no con valores leídos una vez (`count()`,
`text_content()`, `is_visible()`). Y no duermas: `wait_for_timeout` es poner la alarma a ciegas, o
esperas de más o te levantas antes de tiempo.

La única espera fija que tiene sentido es la que comprueba que algo **no** ocurre: un reintento
no puede demostrar una ausencia. Por eso la galería conserva solo esas.

:::

## 5. El aviso que no era nuestro

El segundo caso no dependía de la máquina, sino del recolector de basura. En SnakeORM, un test
comprueba que una escritura masiva lanza un aviso, y lo cuenta con `catch_warnings`. En Python 3.14
[falló](https://github.com/velezanthony/snake-orm/actions/runs/33928219907/job/101201418466):

```text
AssertionError: assert 2 == 1
  where 2 = len([<WarningMessage {message : ResourceWarning('unclosed database in <sqlite3.Connection ...>')
```

`catch_warnings(record=True)` guarda **todo** lo que avisa durante ese bloque, sea de quien sea: es
un micrófono abierto en la sala, que graba tu voz y también la tos del vecino. Y
justo entonces el recolector cerró la conexión SQLite que otro test había dejado abierta, y Python
avisó. En local nunca pasó, porque depende de cuándo se ejecuta el recolector.

::::tabs
:::tab[Antes]
```python
assert len(recorded) == 1
```
:::
:::tab[Después]
```python
# Solo los NUESTROS: catch_warnings registra todo lo que cae en la ventana.
ours = [one for one in recorded if issubclass(one.category, SnakeWarning)]
assert len(ours) == 1
```
:::
::::

El [arreglo](https://github.com/velezanthony/snake-orm/commit/239a11cf9a073baac79ea27a9bc95c76b3fa2193)
filtra por la clase de aviso que el test mide. Para estos casos pytest trae
[`pytest.warns(SnakeWarning)`](https://docs.pytest.org/en/stable/how-to/capture-warnings.html),
que comprueba un tipo concreto.

## 6. Lo que tienen en común

Los dos tests leían el estado **en un instante** y daban por hecho que nada más estaba pasando: un
segundo panel que aún llegaba, un aviso ajeno que caía en la ventana. Un test que falla a veces casi
nunca es mala suerte: un test estable espera a lo que busca y mide solo lo suyo.


## En resumen

| Problema | Qué hacer |
|---|---|
| Preparar y limpiar | Fixtures con `yield`, tipadas, con el `scope` justo |
| Probar contra varios motores | `params` en la fixture |
| Un test de navegador que falla a veces | `expect(...)` que reintenta; nada de `count()` ni `wait_for_timeout` |
| Un recuento de avisos que falla a veces | Filtra por tu clase de aviso o usa `pytest.warns` |
| Hypothesis con estrategias que dependen de otro parámetro | `st.data()` y `data.draw()` |
| Hypothesis con fixtures | Limpia en cada ejemplo, que la fixture no lo hace |

## Referencias

- [pytest: fixtures](https://docs.pytest.org/en/stable/how-to/fixtures.html)
- [pytest: avisos y `pytest.warns`](https://docs.pytest.org/en/stable/how-to/capture-warnings.html)
- [pytest-django: fixtures](https://pytest-django.readthedocs.io/en/latest/helpers.html)
- [Playwright para Python: aserciones](https://playwright.dev/python/docs/test-assertions)
- [Hypothesis: `st.data()`](https://hypothesis.readthedocs.io/en/latest/reference/strategies.html#hypothesis.strategies.data)
- [Hypothesis: comprobaciones de salud](https://hypothesis.readthedocs.io/en/latest/reference/api.html#hypothesis.HealthCheck)
- [Python: `warnings.catch_warnings`](https://docs.python.org/es/3/library/warnings.html#warnings.catch_warnings)
