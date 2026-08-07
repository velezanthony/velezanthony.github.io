---
slug: snake-orm
name: SnakeORM
headline: ORM en Python con relaciones tipadas
tagline: "ORM en Python con navegación de relaciones profundamente tipada. Sin codegen ni plugins de type-checker: mypy, Pyright y Pylance lo resuelven de forma nativa."
status: experimental
role: Autor
order: 4
now: false
featured: false
stack:
  - Python
  - Sistema de tipos
  - PostgreSQL
compat:
  - 'Python ≥ 3.11'
  - 'PostgreSQL'
quality:
  - 'Validado contra mypy y pyright, los dos'
  - '120+ ficheros de test'
  - 'Benchmarks propios'
  - 'Licencia MIT'
constraints:
  - 'Sin generación de código: nada de un paso de build que escriba stubs.'
  - 'Sin plugin de type-checker: mypy, Pyright y Pylance lo resuelven con lo que ya traen.'
  - 'Sin tipado en runtime: los tipos viven en las anotaciones, no en comprobaciones al ejecutar.'
  - 'Sin quejas de mypy ni de ruff en estricto.'
links:
  - label: Código
    href: https://github.com/velezanthony/laboratorio-snake-orm
todo: []
---

## El problema

El ORM de Django funciona con cadenas mágicas:

```python
Truck.objects.filter(maker__nation__name="España")
```

Eso es texto. El type-checker no sabe si `maker` existe, si `nation` cuelga de ahí o si `name` es
el campo correcto. Renombras un campo y el `filter` sigue compilando. El error aparece en tiempo de
ejecución, o peor, no aparece: devuelve vacío.

Trabajando a diario con Django, esa era la parte que no me gustaba. La pregunta era si se puede
tener un ORM donde la navegación de relaciones esté **tipada de verdad**, y que además pase mypy y
ruff en estricto sin protestar.

## Qué es

Un ORM experimental en Python cuyo objetivo es que la navegación de relaciones esté **tipada hasta
el final de la cadena**:

```python
Truck.maker.nation.name == "España"
```

El type-checker conoce el tipo de `maker`, el de `nation` y el de `name`, y se queja si la cadena
no existe.

## Restricciones

Las cuatro restricciones son el proyecto entero:

- **Sin generación de código.** No hay un paso de build que escriba stubs a partir del esquema.
- **Sin plugin de type-checker.** mypy, Pyright y Pylance lo resuelven con lo que ya traen de serie.
- **Sin tipado en runtime.** No hay validación de tipos al ejecutar: el trabajo lo hace el
  type-checker antes, y en ejecución no se paga nada por ello.
- **Sin quejas en estricto.** mypy y ruff pasan limpio.

Cualquiera por separado es fácil. Las cuatro a la vez son el problema interesante.

## Decisiones

### La declaración, al estilo de SQLAlchemy

**Contexto.** Para que el type-checker sepa el tipo de una columna, ese tipo tiene que estar escrito
en algún sitio que él lea. Sin codegen y sin plugin, el único sitio que queda son las anotaciones.

**Decisión.** Declarar los modelos como lo hace SQLAlchemy 2.0: la anotación lleva el tipo, y el
descriptor lleva la configuración.

```python
@snake_model(table="ex_authors")
class ExAuthor(SnakeModel):
    id: SnakeColumn[int] = snake_auto()
    name: SnakeColumn[str] = snake_column()
    public_id: SnakeColumn[uuid.UUID] = snake_column(unique=True, default_factory=uuid.uuid4)
    book_authors: SnakeToMany[ExBookAuthor] = snake_reverse("author")
```

`SnakeColumn[int]` es lo que hace posible todo lo demás: el parámetro genérico viaja por la cadena
de relaciones y llega hasta el final. Por dentro son **dataclasses**; los tipos no existen en
ejecución.

### Esto no se podía hacer cuando nació el ORM de Django

Y no es una crítica a Django: es una cuestión de fechas.

Lo que sostiene la declaración tipada es **`dataclass_transform` (PEP 681), que llegó en Python
3.11**. Permite decirle al type-checker que un decorador propio se comporta como `@dataclass`, de
modo que entiende los campos declarados sin que nadie genere stubs. Es la misma pieza sobre la que
se apoyan SQLAlchemy 2.0 y Pydantic v2.

SnakeORM pide **Python 3.11 o superior** y usa eso desde el primer día. El ORM de Django es de
2005: no solo es anterior a `dataclass_transform`, es anterior a las anotaciones de variables
enteras. Y no puede migrar sin romper todos los modelos escritos en veinte años.

**La retrocompatibilidad es una virtud de Django y una restricción de la que yo no tengo que
cargar.** Partir de cero en 2026 significa poder asumir un Python que en su momento no existía.

**Consecuencias.** Es **extremadamente verboso comparado con Django**. Cada campo son dos piezas en
vez de una: la anotación que lleva el tipo y el descriptor que lleva la configuración.

```python
# Django
name = models.CharField(max_length=100)

# SnakeORM
name: SnakeColumn[str] = snake_column(max_length=100)
```

Multiplícalo por cada campo de cada modelo. Ese es el precio del tipado, y se paga entero: sin
codegen y sin plugin, la única forma de que el type-checker sepa el tipo es que esté escrito.

### Fallar en vez de adivinar

Acceder a una relación que no se ha cargado no dispara una consulta a escondidas: lanza
`SnakeRelationNotLoaded`. Lo mismo con `SnakeUnsupportedFeature` y `SnakeEmitError`.

No es un fallo, es una decisión: **un N+1 silencioso es peor que un error ruidoso**.

## Qué hay dentro

Más de lo que sugiere la palabra «laboratorio»: dialectos y drivers separados (PostgreSQL sobre
psycopg), compilador de consultas, expresiones y funciones, migraciones con `diff`, herencia de
modelos, prefetch de relaciones, CLI y benchmarks.

`examples/tour.py` es un recorrido ejecutable contra un Postgres real que imprime, para cada
operación, **el SQL emitido y el resultado que devuelve la base de datos**. Documentación que no
puede quedarse desfasada porque se ejecuta.

## Límites

**Es mucho más verboso que Django.** No es un efecto secundario que se pueda pulir: es la
consecuencia directa de las restricciones. Si quieres el tipo sin generar código y sin plugin, el
tipo lo escribes tú. Quien venga de Django lo va a notar en el primer modelo.

**No está listo para un proyecto serio, y no lo pretende.**

Tiene las funcionalidades básicas. Lo mantengo yo solo, así que la superficie que cubre es
la que cubre. Es un laboratorio y prefiero decirlo así que venderlo como otra cosa.

Lo que sí tiene: **más de 120 ficheros de test** y cada solución escrita desde cero.

Y con «desde cero» no quiero decir en el vacío: **me apoyé en investigar cómo lo resuelven otros**,
porque para escribirlo había que entenderlo primero. No es un fork de nada, pero tampoco salió de
la nada — salió de leer, probar y aprender a hacerlo.

## Estado

Experimental, en desarrollo local y aún sin publicar. Código abierto con licencia MIT.
