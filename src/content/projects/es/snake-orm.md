---
slug: snake-orm
name: SnakeORM
headline: ORM en Python tipado para mypy y Pyright
tagline: "Un ORM en Python que grita en vez de adivinar: navegación de relaciones tipada de punta a punta, sin codegen ni plugin. mypy y Pyright lo leen nativos."
status: maintained
role: Autor
order: 1
now: false
featured: true
stack:
  - Python
  - Sistema de tipos
  - PostgreSQL
  - MySQL
  - SQLite
targets:
  - mypy
  - Pyright
  - Pylance
  - Django
  - Flask
  - FastAPI
compat:
  - 'Python ≥ 3.11'
  - 'PostgreSQL · MySQL/MariaDB · SQLite'
quality:
  - 'Validado contra mypy y pyright, los dos'
  - 'La suite corre contra los tres motores de verdad, no contra dobles'
  - 'Benchmarks propios'
  - 'Licencia MIT'
constraints:
  - 'Sin generación de código: nada de un paso de build que escriba stubs.'
  - 'Sin plugin de type-checker: mypy, Pyright y Pylance lo resuelven con lo que ya traen.'
  - 'Sin tipado en runtime: los tipos viven en las anotaciones, no en comprobaciones al ejecutar.'
  - 'Sin quejas de mypy ni de ruff en estricto.'
links:
  - label: Código
    href: https://github.com/velezanthony/snake-orm
  - label: PyPI
    href: https://pypi.org/project/snake-orm/
  - label: Documentación
    href: https://velezanthony.github.io/snake-orm/
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

Un ORM en Python cuyo objetivo es que la navegación de relaciones esté **tipada hasta el final de
la cadena**:

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
    book_authors: SnakeToMany[ExBookAuthor] = snake_to_many("author")
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

### Cómo lo resuelven los otros: con stubs y con plugins

Ésta es la comparación que da sentido a las restricciones, porque **los dos ORMs grandes de Python
necesitan ayuda externa para tipar** — o la necesitaban.

**Django no publica tipos.** No lleva `py.typed`, así que un type-checker no tiene de dónde
sacarlos: hay que instalar `django-stubs`, un paquete aparte, mantenido por otra gente, que va por
detrás de cada versión.

Y no es un detalle académico. En este mismo proyecto las demos usan Django, y lo medí:

```
las tres demos bajo pyright, SIN stubs:  382 errores
las tres demos bajo pyright, CON stubs:  132 errores
```

**Los 250 de diferencia no eran fallos de mi código: eran Django sin tipar.** Sin los stubs,
`request.POST.get()` sale `type[Empty] | Unknown | list[Unknown] | Any`, y `self.client.get()` sale
`WSGIRequest` — una petición donde hay una respuesta.

**SQLAlchemy hacía las dos cosas, y dejó de hacerlas.** La 1.x necesitaba stubs (`sqlalchemy-stubs`,
después `sqlalchemy2-stubs`) **y además un plugin de mypy**. La 2.0 tiró los dos. Su propia
documentación lo dice sin rodeos:

> *«The SQLAlchemy Mypy Plugin is **DEPRECATED**, and will be removed in the SQLAlchemy 2.1
> release.»*
>
> *«No stubs should be installed and packages like `sqlalchemy-stubs` and `sqlalchemy2-stubs`
> should be **fully uninstalled**.»*

¿Qué se lo permitió? Exactamente la pieza de arriba: `dataclass_transform`. En cuanto el lenguaje
supo expresar «este decorador se comporta como `@dataclass`», el plugin y los stubs dejaron de hacer
falta.

**Ése es el camino que sigue SnakeORM, y desde el primer día.** Sin stubs, sin plugin, sin codegen:
el tipo está escrito en la anotación y lo lee cualquier checker con lo que ya trae de serie. El
precio es la verbosidad de la sección anterior — y es un precio, no un descuido.


### El catálogo que revienta al importar

**Contexto.** Un ORM multi-motor tiene que saber qué NO puede hacer cada motor. Los dos grandes lo
resuelven con banderas, y las dos implementaciones **fallan en abierto**: lo medí en su código.

```
SQLAlchemy  SuiteRequirements, 250 propiedades
            114 devuelven exclusions.closed() POR DEFECTO
            -> un dialecto que olvida declarar una capacidad hereda «no soportado»
               y sus tests SE SALTAN en silencio. Nada compara tu clase con el catálogo.

Django      BaseDatabaseFeatures, ~161 banderas, ~137 booleanos planos
            cero NotImplementedError, cero ABC, cero comprobación
            -> un backend que no contesta hereda el valor por defecto
```

**Decisión.** El dialecto contesta al catálogo **entero** —`Full()`, `Degraded(motivo)` o
`Nope(motivo)`— y **olvidarse de una revienta al importar**. Falla en cerrado.

**Por qué no una bandera con valor por defecto.** Porque el defecto es una respuesta que nadie ha
dado. La diferencia entre «este motor no puede» y «nadie se acordó de mirarlo» es justo la que
decide si un test comprueba algo, y una bandera con defecto borra esa diferencia para siempre.

**Precio.** Añadir una capacidad nueva rompe los tres dialectos a la vez, y hay que ir a los tres a
contestarla. Es deliberado: ese trabajo es el que garantiza que nadie hereda una respuesta que no
ha pensado.

**Y de ahí sale algo que ninguno de los dos da**: como el catálogo está completo, la sesión puede
recorrerlo y avisar al arrancar de lo que tu motor no va a poder hacer con los modelos que has
declarado. En Django `connection.features` no lo reporta ningún comando; en SQLAlchemy no hay API
que enumere capacidades.

### Lo que decidí NO construir

**Contexto.** SQLAlchemy trae identity map, unit of work y carga perezosa. Son la mitad de lo que la
gente usa de su `Session`, así que no incluirlos es la decisión más cara del proyecto y la que más
usuarios me cuesta.

**Decisión.** Ninguna de las tres entra.

**Por qué.** Las tres comparten una propiedad: **arreglan tu problema sin decírtelo**. La carga
perezosa convierte un bucle en N consultas y te enteras en producción. El unit of work reordena y
agrupa tus escrituras, así que el SQL que se ejecuta no es el que escribiste. El identity map hace
que dos consultas devuelvan el mismo objeto, lo cual es cómodo hasta el día que no lo entiendes.

La regla del ORM es **grita, nunca arregles por tu cuenta**. Esas tres son exactamente lo contrario,
y meterlas habría sido tener dos doctrinas peleándose dentro del mismo paquete.

**Precio.** Sin identity map, dos consultas a la misma fila devuelven dos objetos: `a == b` es
`True` por clave primaria, pero `a is b` es `False`. Está escrito en la página de límites, porque un
límite que el usuario descubre solo es un bug con otro nombre.

**Consecuencia buena.** El N+1 silencioso deja de ser posible por construcción, no por disciplina.

### Dos ejes que nunca se mezclan

**Contexto.** Soportar varios motores se suele resolver con condicionales repartidos por el emisor.
Eso funciona con dos y se pudre con tres.

**Decisión.** Separar **dialecto** (cómo se *escribe* el SQL: placeholders, quoting, `LIMIT`,
`RETURNING`, upsert) de **driver** (cómo se *ejecuta*: la librería, la conexión, la transacción).
Dos `Protocol` distintos que no se tocan, y un grafo de metadata **100% agnóstico del motor**.

**La predicción, que es lo que hace verificable la decisión.** Si la costura estaba bien puesta, un
motor nuevo tenía que ser **un fichero nuevo en `dialects/` y otro en `drivers/`, nunca un
refactor**. Se escribió antes de tener el segundo motor.

**Resultado.** Se cumplió con MySQL/MariaDB y se cumplió con SQLite. Y la misma costura absorbió el
color asíncrono: la generación de SQL no ejecuta, así que **no tiene color** y se reutiliza tal
cual — `AsyncSession` entró sin tocar ni el compilador ni el dialecto.

Acertar una separación cuando todavía no tienes el segundo caso es la parte difícil. Con tres
motores delante, la línea la ve cualquiera.

### El `IN` compuesto: por qué la solución obvia era la mala

**Contexto.** Si las claves primarias compuestas son de primera clase, pedir un conjunto de ellas es
la consulta de cada día. Con clave simple es `User.id.in_([7, 12, 30])` y ya está. Con clave
compuesta, lo único que la API dejaba escribir era un `in_()` por columna:

```sql
WHERE warehouse_id IN (7, 9) AND product_id IN (3, 1)
```

Pides dos filas —`(7,3)` y `(9,1)`— y te llegan cuatro. Eso es el **producto cartesiano**: has
cruzado «los almacenes que me interesan» con «los productos que me interesan», que es otra pregunta.
Y en un fixture pequeño las dos respuestas coinciden, así que se pasa sin verlo.

**El primer diseño, y las dos mediciones que lo tiraron.** Lo natural es una tupla posicional:

```python
snake_tuple(Stock.warehouse_id, Stock.product_id).in_([(7, 3)])
```

1. **Cuando las dos columnas son del mismo tipo, el swap es invisible.** `[(3, 7)]` en vez de
   `[(7, 3)]` pasa mypy **y** pyright sin una queja, y devuelve las filas equivocadas en silencio.
   Con los tipos iguales, la posición es la única información y el checker no tiene nada que
   comparar.
2. **Tiene techo.** Una firma posicional necesita **una sobrecarga por aridad**: una para dos
   columnas, otra para tres, otra para cuatro, escritas a mano hasta donde uno se canse. Y en este
   ORM las relaciones identificantes ensanchan la clave nivel a nivel —2, 3, 4, N—, o sea que el
   techo cae justo encima del caso habitual.

**Decisión.** Que no haya posiciones.

```python
snake_keys(Stock).in_([
    snake_key(Stock).set(Stock.warehouse_id, 7).set(Stock.product_id, 3),
])
# WHERE (warehouse_id, product_id) IN ((?, ?))
```

Cada valor va pegado a su columna. **El swap deja de ser un error que hay que detectar y pasa a ser
una frase que no se puede escribir.** Y `set()` es UNA firma llamada N veces, así que la aridad no
vive en el tipo: no hay número máximo escrito en ninguna parte. Verificado en mypy y pyright con
claves de 2, 3, 4 y 6 columnas.

Colar una columna de otro modelo lo caza la **invarianza** de `SnakeKey[M]`, sin meter el modelo
dentro de la expresión — que habría rechazado expresiones legítimas de dos tablas en un `join`.

**Precio.** Es más largo de escribir que una tupla. Asumido: en una API pública la verbosidad se
paga una vez al escribir y se cobra cada vez que alguien la lee.

**Lo que el sistema de tipos NO puede hacer, y por tanto va a error en ejecución.** No sabe contar:
una clave con dos columnas y otra con tres son las dos `SnakeKey[M]`. Eso revienta antes de emitir,
nunca con un aviso — un warning se ignora, y lo que viene después de ignorarlo no es un fallo, son
filas equivocadas.

**Y un límite que decidí NO imponer.** Medí el techo de parámetros contra los tres motores, y a dos
anchuras distintas de clave, porque con una sola no se distinguen las dos leyes que hay:

```
PostgreSQL  ancho 2:  8.184 claves / 16.368 params -> muere
            ancho 4:  8.184 claves / 32.736 params -> muere   <- mismas CLAVES, doble de params
SQLite      ancho 2: 16.383 claves / 32.766 params -> muere
            ancho 4:  8.191 claves / 32.764 params -> muere   <- mismos PLACEHOLDERS
```

En Postgres manda el número de claves —es la profundidad del parser—; en SQLite, el de placeholders.
Aplico el de SQLite, que es exacto y ya estaba declarado. **El de Postgres no lo pre-rechazo**,
porque sale de `max_stack_depth`, que es una opción del servidor: cortar por una cifra copiada de
UNA configuración prohibiría, en un servidor afinado, lo que allí la base de datos sí permite.

Y hay un test que aserta **las dos mitades**: que pasarse del límite exacto revienta, y que ocho mil
claves en Postgres **se emiten** — o sea, que el ORM no se inventa un techo que no le consta.

### Fallar en vez de adivinar

Acceder a una relación que no se ha cargado no dispara una consulta a escondidas: lanza
`SnakeRelationshipNotLoaded`. Lo mismo con `SnakeUnsupportedFeature` y `SnakeEmitError`.

No es un fallo, es una decisión: **un N+1 silencioso es peor que un error ruidoso**.

Y la regla se extiende a los motores. Cada dialecto contesta al catálogo de capacidades **entero**
—`Full`, `Degraded(motivo)` o `Nope(motivo)`— y **olvidarse de una revienta al importar**. Un tipo
sin equivalente cae a `TEXT` y funciona; lo que se degrada es la semántica —ordenar, comparar— y
eso se avisa una vez.

Lo que no se hace nunca es guardar peor y callarse.

## Lo que salió mal

### El bug que no podía fallar

SQLite no acepta paréntesis alrededor de las ramas de un `UNION`, así que las lee de izquierda a
derecha. Con un compuesto anidado, eso **cambia el significado**:

```
a.union(b.except_(c))

Postgres y MySQL  ->  []
SQLite            ->  [1, 4]
```

La misma línea de Python devolviendo dos conjuntos distintos según el motor. SQL válido, cero
errores, ninguna capa se queja.

Y lo que lo hace interesante para mí: **un test que compare cadenas de SQL no lo ve jamás**, porque
el SQL que se emite es correcto. Sólo aparece ejecutando la misma expresión contra los tres motores
y comparando las **filas**.

### Una creencia mía, derribada por una medición mía

El ORM llevaba años diciendo, en su propio docstring: *«si el árbol puede tener ciclos, ponle un
`limit()`»*. Lo medí contra Postgres con un ciclo de tres filas:

```
UNION ALL + limit(3), sin order:   OK          <- funcionaba por accidente
UNION ALL + order_by + limit(3):   NO VUELVE
```

El consejo sólo servía cuando el motor consume el resultado en streaming. Con `order_by()` —o sea la
forma normal de pedir una jerarquía— la ordenación tiene que producir todas las filas antes de
emitir una, y el límite no llega nunca a su turno.

El arreglo no fue corregir la frase: fue **exponer el operador** para que quien tenga ciclos pueda
elegir. Un aviso te dice que tienes un problema; un parámetro te lo resuelve.

### El defecto que ningún test mío podía ver

Alguien migró un producto real encima: Django 6.0 con PostGIS, 60 tablas, y las funciones de datos
portadas una a una comparando cada resultado contra el ORM al que sustituían. De ahí salieron
dieciséis hallazgos. El peor no daba ningún error.

Navegar una relación que puede no tener pareja emitía `INNER JOIN`. Las filas con la clave a `NULL`
desaparecían — incluidas las que casaban la consulta por otra rama de un `OR`:

```
django    :  16 filas
snake-orm :   7 filas
```

Ninguna excepción, ningún aviso. Menos filas.

Y lo que lo hace hermano de los dos de arriba: **ningún dominio de mi suite declaraba una relación
opcional**. Todas las que había tenían siempre pareja a los dos lados, así que el tipo de JOIN
equivocado y el correcto devolvían exactamente las mismas filas en cada fixture que yo había
escrito. La red estaba verde porque no podía ver el color.

Un defecto que un dominio de prueba **no puede expresar** es un defecto que ningún test puede cazar.

Arreglarlo costó una tarde. Descubrir que mi suite no podía verlo costó el producto de otro.

## Qué hay dentro

Más de lo que suele caber en un proyecto de una sola persona: **tres motores de primera clase**
—PostgreSQL, MySQL/MariaDB y SQLite—, compilador de consultas, expresiones y funciones, migraciones
con `diff`, herencia de modelos, prefetch de relaciones, CLI y benchmarks.

Los tres entraron **sin refactorizar nada**, y ésa era la apuesta: el dialecto (cómo se *escribe* el
SQL) y el driver (cómo se *ejecuta*) son dos ejes que nunca se mezclan, así que cada motor fue un
fichero nuevo en `dialects/` y otro en `drivers/`. Lo mismo con el asíncrono: **la generación de SQL
no tiene color** —no ejecuta—, así que `AsyncSession` entró sin tocar ni el compilador ni el
dialecto.

`examples/tour.py` es un recorrido ejecutable contra un Postgres real que imprime, para cada
operación, **el SQL emitido y el resultado que devuelve la base de datos**. Documentación que no
puede quedarse desfasada porque se ejecuta.

## Las demos no son un escaparate: son el banco de pruebas

Un ORM se usa desde dentro de un framework, así que probarlo solo desde `pytest` deja fuera la mitad
que el usuario toca. Hay **cuatro aplicaciones** funcionando sobre el mismo dominio y el mismo
modelo de datos:

- **Django, Flask y FastAPI**, cada una sirviendo las mismas páginas en HTML y **la misma API en
  JSON** — `/api/algo` es el espejo de `/algo`.
- **Un cliente React** que se pinta él solo, lleva su propio enrutado y habla con **cualquiera de
  los tres** backends sin cambiar una línea.

Y ése cuarto es el que convierte la paridad en algo comprobable: **si un solo cliente puede apuntar
a los tres indistintamente, es que las tres APIs son de verdad la misma.** Dicho en un README no
significa nada; con un cliente que se cambia de backend, sí.

De paso, tres frameworks son tres formas distintas de integrarse —WSGI, ASGI y el middleware de
Django—, así que la costura de integración se prueba en las tres a la vez en vez de en la que yo
usara ese día.

### El panel de depuración, y por qué son cinco canales y no uno

Lo interesante no es que haya panel: es que **el canal se elige por las herramientas que tiene quien
mira**, y ésa fue la decisión.

| canal | para quién |
|---|---|
| `ssr` | un panel HTML inyectado en la página, cuando lo que vuelve es HTML |
| `envelope` | un bloque en el JSON y una tabla en texto, para quien está en Postman **sin herramientas** |
| `timing` | una cabecera `Server-Timing`, para quien **sí** tiene las devtools del navegador |
| `sidecar` | un token y su propia página, para cuando no se puede tocar la respuesta |
| `otel` | spans por OTLP a un **Jaeger** o un Grafana, para quien ya tiene un trazador de verdad |

El de HTML tiene una restricción que decide su implementación entera: **se inyecta en la página de
otro**. Así que no puede pedir un solo recurso externo —todo va en línea, CSS y JavaScript— ni
ensuciar el DOM de nadie: entra como un único contenedor propio justo antes de `</body>`, y ese
marcador es el **contrato de inyección** que los tests verifican en las tres integraciones.

Que un panel de depuración no pueda depender de la red es de esas cosas que parecen un detalle hasta
que lo despliegas detrás de una CSP.

## Límites

**Es mucho más verboso que Django.** No es un efecto secundario que se pueda pulir: es la
consecuencia directa de las restricciones. Si quieres el tipo sin generar código y sin plugin, el
tipo lo escribes tú. Quien venga de Django lo va a notar en el primer modelo.

**Está publicado como beta, y lo mantengo yo solo.**

Ése es el riesgo de usarlo, y prefiero decirlo así que venderlo como otra cosa. No que esté a
medias —funciona, y la suite lo demuestra contra los tres motores de verdad—, sino que la superficie
que cubre es la de una persona: al lado de Django o SQLAlchemy se nota en cuanto pides algo que no
está.

Lo que sí tiene: una suite que **corre contra los tres motores de verdad**, con dos interruptores
que convierten «saltado por falta de servidor» en fallo — porque sin ellos una parte grande se salta
y la suite sale verde igual. Y cada solución escrita desde cero.

Y con «desde cero» no quiero decir en el vacío: **me apoyé en investigar cómo lo resuelven otros**,
porque para escribirlo había que entenderlo primero. No es un fork de nada, pero tampoco salió de
la nada — salió de leer, probar y aprender a hacerlo.

## Qué aprendí

**Leer no encuentra bugs. Ejecutar sí.** Audité la superficie del compositor de consultas leyéndola
entera y salía limpia. Ejecutar la matriz de operadores contra los tres motores sacó tres defectos
de corrupción silenciosa. Desde entonces, en este repositorio **una revisión por lectura no cuenta
como verificación**.

**Comparar motores tiene un punto ciego.** Esa misma red no podía ver un cuarto bug: el ORM emitía
el **mismo SQL erróneo** en los tres, así que los tres coincidían — y «los tres coinciden» era el
criterio. El testigo bueno era otro: qué significa la misma expresión en una consulta plana. **Cada
bug necesita su propio oráculo independiente.**

**El síntoma de una regla mal puesta no es el test rojo.** Es que **pide algo que nadie sabe
justificar**. Una guarda mía obligaba a una migración de un dominio a declarar una vista de otro
dominio distinto. Eso chirriaba antes de que nada fallara, y lo leí como «falta un dato» en vez de
«el criterio está mal».

**Escribir de más es deuda.** Cada frase de un comentario es una afirmación que hay que mantener
verdadera. Cuando el código se desfasa, un test se pone rojo; cuando la prosa se desfasa, **no pasa
nada** — sigue ahí, con la misma autoridad, mintiendo.

Y el hilo que une todo: en una base de código madura el fallo no suele ser la ausencia, sino la
**afirmación falsa con autoridad**. Un test cuyo nombre promete más de lo que su cuerpo comprueba.
Una guía que enseña un camino que ya no funciona. Una puerta que mide otra cosa y dice *Success*.

## Estado

Publicado en PyPI como beta —`pip install --pre snake-orm`— y en desarrollo activo. No ha corrido
en producción todavía. Código abierto con licencia MIT.
