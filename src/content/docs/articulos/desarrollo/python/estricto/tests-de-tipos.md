---
seo:
  title: "Tests de tipos en Python"
  description: "Cómo probar que tus tipos aceptan lo correcto y rechazan lo incorrecto: assert_type, errores esperados y mypy y Pyright ejecutados desde pytest."
  schema:
    - '@type': TechArticle
      headline: "Tests de tipos: que los tipos digan lo que prometen"
      description: "Cómo probar que tus tipos aceptan lo correcto y rechazan lo incorrecto: assert_type, errores esperados y mypy y Pyright ejecutados desde pytest."
      inLanguage: es
      datePublished: '2026-11-23'
      dateModified: '2026-11-23'
      author:
        '@type': Person
        '@id': https://velezanthony.github.io/#anthony
        name: Anthony Velez Tapia
        url: https://velezanthony.github.io/
---

# Tests de tipos: que los tipos digan lo que prometen

Durante un tiempo, el test de tipos de [SnakeORM](https://velezanthony.github.io/snake-orm/) pasó en
verde sin leer ni un solo error de mypy. Al final cuento por qué; antes, qué es un test de tipos.

En la mayoría de proyectos, los tipos ayudan a escribir el código. En SnakeORM, un ORM, los tipos **son** el producto: la idea
es que una consulta mal escrita no pase el comprobador de tipos, igual que no compilaría en C#. Lo
cuento en [Un ORM tipado sin generar código](../orm-tipado-sin-generar-codigo.md).

Si los tipos son el producto, se prueban como el producto. Con tests normales no se puede: los tipos
no existen al ejecutar. Hace falta otra clase de test, una que lea el comprobador de tipos.

Forma parte de la serie [Python estricto](stack-python-estricto.md).

## 1. Qué hay que probar

Un tipo puede fallar de dos maneras, y hay que vigilar las dos:

| Fallo | Ejemplo | Cómo se nota |
|---|---|---|
| **Deja de aceptar lo correcto** | una consulta válida ahora da error de tipos | se nota enseguida: el código de todos se pone rojo |
| **Deja de rechazar lo incorrecto** | `truck.atributo_inventado` ya no da error | **no se nota**: todo sigue en verde y el agujero queda abierto |

El segundo es el peligroso. Un test que solo comprueba lo que funciona no prueba nada: lo que hay que
demostrar es que lo prohibido sigue prohibido. Es como probar una cerradura: no basta con que tu
llave abra; hay que comprobar que las demás no.

## 2. Los casos positivos: `assert_type`

[`assert_type`](https://docs.python.org/es/3/library/typing.html#typing.assert_type) le pide al
comprobador que confirme el tipo exacto de un valor. Al ejecutar no hace nada: devuelve el valor tal
cual. Su trabajo es estático.

SnakeORM tiene un archivo,
[`cases_positive.py`](https://github.com/velezanthony/snake-orm/blob/main/src/test/typing/cases_positive.py),
lleno de funciones que nadie llama. Solo están ahí para que mypy y Pyright las lean:

```python
def check_call_returns_a_typed_list_of_rows(session: SnakeSession) -> None:
    rows = session.call("calcular_nomina", [1234], into=Nomina)
    assert_type(rows, list[Nomina])
    assert_type(rows[0].bruto, Decimal)
```

Si un cambio hace que `rows` pase a ser `list[Any]`, `assert_type` da error. Ojo: compara el tipo
**exacto**, sin aceptar subtipos. Si solo te importa que el valor sirva para algo, por ejemplo para
un `filter()`, anótalo en una variable: eso acepta también los subtipos.

```python
comparison: SnakeCondition = Truck.id > 3
like: SnakeCondition = Truck.model.like("Ib%")
```

## 3. Los casos negativos: errores esperados

El otro archivo,
[`cases_negative.py`](https://github.com/velezanthony/snake-orm/blob/main/src/test/typing/cases_negative.py),
contiene errores **a propósito**. Cada línea que debe fallar lleva un comentario con el código de
error que tiene que dar. El más interesante es una operación que no tiene sentido:

```python
Truck.id.like("3%")  # EXPECT: misc
```

`like()` sobre una columna numérica no tiene sentido en SQL, y el tipo de la columna lo impide antes
de que la consulta llegue a la base de datos. Los otros casos son más sencillos:

::::tabs
:::tab[Un atributo que no existe]
```python
truck = Truck(id=1, model="Ibiza", maker_id=1)
truck.no_declarada  # EXPECT: attr-defined
```
:::
:::tab[Un tipo que no encaja]
```python
truck = Truck(id=1, model="Ibiza", maker_id=1)
model: str = truck.id  # EXPECT: assignment
```
:::
::::

## 4. El test que lo une todo

[`test_type_checkers.py`](https://github.com/velezanthony/snake-orm/blob/main/src/test/typing/test_type_checkers.py)
es un test de pytest normal que **ejecuta mypy y Pyright** sobre esos dos archivos y lee lo que
dicen:

| Archivo | mypy | Pyright |
|---|---|---|
| `cases_positive.py` | cero errores | cero errores |
| `cases_negative.py` | un error en cada línea `# EXPECT:`, con ese código exacto, y en ninguna otra | error en las mismas líneas |

Los dos comprobadores tienen que coincidir en **qué líneas** rechazan. Los códigos solo se comparan
con mypy, porque Pyright usa otros nombres para los mismos errores.

El núcleo es corto: saca las líneas esperadas de los comentarios y las compara con la salida de mypy.

```python
_EXPECT = re.compile(r"#\s*EXPECT:\s*(?P<code>[a-z-]+)\s*$")


def test_negative_cases_fail_mypy_exactly_where_expected() -> None:
    assert _mypy_errors(NEGATIVE) == _expected_errors(NEGATIVE)
```

`_mypy_errors` ejecuta mypy y lee cada línea con el formato `archivo:línea: error: mensaje [código]`.
Para Pyright pide la salida en JSON (`--outputjson`), que es más fácil de leer que el texto.

:::note[Son lentos: van aparte]{collapsed}

Lanzar dos comprobadores de tipos tarda más que un test normal. Por eso llevan la marca `typecheck`,
declarada en el `pyproject.toml`, y se pueden saltar con `pytest -m 'not typecheck'` mientras
trabajas. En el CI corren siempre.

:::

## 5. Lo que estos tests ya han cazado

El propio archivo de tests guarda en sus comentarios dos problemas reales, y por eso es como es.

**Un test en verde que no comprobaba nada.** mypy respeta la variable `FORCE_COLOR`, que muchos
terminales y servidores de CI activan. Con ella, cada línea de mypy llega envuelta en códigos de
color y la expresión regular no la reconoce. Resultado: ningún error leído, que el test interpretaba
como «el comprobador acepta código que no debería compilar». Desde entonces se pide salida sin color
(`--no-color-output`) y, además, se comprueba que mypy **llegó a ejecutarse**:

```python
assert result.returncode in (0, 1), "mypy did not run"
```

Una lista vacía puede significar «no hay errores» o «el comprobador no arrancó». Es un teléfono que no
suena: puede que nadie llame, o que no tengas cobertura.

**Una comprobación que nadie ejecutaba.** Al principio, los tests revisaban solo los dos archivos de
casos, y Pyright sobre el resto del paquete dependía de que alguien escribiera `make pyright`. Mientras
nadie lo hizo, un cambio en una función asíncrona hizo que los drivers asíncronos dejaran de cumplir
su contrato, y nadie lo vio porque Pyright no los revisaba.
Ahora la suite pasa Pyright sobre todo el paquete, y otro test comprueba que el `Makefile` revisa
exactamente lo mismo, para que las dos redes no se separen sin avisar.

## 6. Otras formas de hacerlo

No hace falta montarlo a mano:

- **[typeshed](https://github.com/python/typeshed)**, el repositorio de tipos de la librería
  estándar, usa `assert_type` para los casos positivos y `# type: ignore` para los negativos. Con
  `--warn-unused-ignores` en mypy (o `reportUnnecessaryTypeIgnoreComment` en Pyright), un
  `# type: ignore` que ya no hace falta es un error: si una línea deja de fallar, el test lo dice.
- **[pytest-mypy-plugins](https://github.com/typeddjango/pytest-mypy-plugins)**, del equipo de
  django-stubs, describe cada caso en un YAML con el código y la salida esperada de mypy.

La ventaja del enfoque de SnakeORM es que pasa los **dos** comprobadores y exige que coincidan.

## En resumen

- Si tus tipos son parte de lo que entregas, **pruébalos**: lo que aceptan y, sobre todo, lo que
  rechazan.
- **Casos positivos** con `assert_type`, que fija el tipo exacto.
- **Casos negativos** con errores esperados marcados línea a línea.
- **Un test de pytest** que ejecuta mypy y Pyright, compara su salida y comprueba que llegaron a
  ejecutarse.

## Referencias

- [Python: `typing.assert_type`](https://docs.python.org/es/3/library/typing.html#typing.assert_type)
- [Typing: probar los tipos con `assert_type` y `--warn-unused-ignores`](https://typing.readthedocs.io/en/latest/source/quality.html#testing-using-assert-type-and-warn-unused-ignores)
- [typeshed: tests de regresión](https://github.com/python/typeshed/blob/main/tests/REGRESSION.md)
- [pytest-mypy-plugins](https://github.com/typeddjango/pytest-mypy-plugins)
- [mypy: `--warn-unused-ignores`](https://mypy.readthedocs.io/en/stable/command_line.html#cmdoption-mypy-warn-unused-ignores)
- [Pyright: opciones de línea de comandos](https://microsoft.github.io/pyright/#/command-line)
- [pytest: marcas](https://docs.pytest.org/en/stable/how-to/mark.html)
