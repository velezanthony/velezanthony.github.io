---
seo:
  title: "Code First o Database First en ORMs"
  description: "Code First o Database First: cómo decidir y cómo tratan las claves compuestas EF Core, Hibernate, Doctrine, Django, Eloquent y SQLAlchemy."
  schema:
    - '@type': TechArticle
      headline: "Code First o Database First: claves compuestas en seis ORMs"
      description: "Code First o Database First: cómo decidir y cómo tratan las claves compuestas EF Core, Hibernate, Doctrine, Django, Eloquent y SQLAlchemy."
      inLanguage: es
      datePublished: '2026-11-21'
      dateModified: '2026-11-22'
      author:
        '@type': Person
        '@id': https://velezanthony.github.io/#anthony
        name: Anthony Velez Tapia
        url: https://velezanthony.github.io/
---

# Code First o Database First: claves compuestas en seis ORMs

Diseñas la tabla de líneas de pedido como manda la teoría: una línea no existe sin su pedido, así
que la clave primaria es `(order_id, line_number)`. Sin un `id` autoincremental que no aporta nada.
Luego abres el ORM para mapearla y descubres que no sabe qué hacer con ella: o no la admite, o la
admite a medias, o te pide añadir una columna `id` «porque sí». Y acabas cambiando la base de datos
para que encaje en la herramienta, cuando debería ser al revés.

## Qué es un ORM

Un ORM (*Object-Relational Mapper*) traduce entre las filas de una base de datos relacional y los
objetos de tu lenguaje. Tú trabajas con clases, propiedades y relaciones; el ORM genera el SQL,
carga los resultados y sigue la pista de los cambios para guardarlos. El precio es que entre tu
código y tus tablas hay una capa con sus propias opiniones sobre cómo debe ser una tabla.

## Code First y Database First

La pregunta es quién manda: el código o la base de datos.

- **Code First.** Escribes las clases y el ORM deduce el esquema. Las **migraciones** comparan el
  modelo con la base de datos y generan el SQL para igualarlas: `dotnet ef migrations add`,
  `makemigrations` en Django, `migrations:diff` con Doctrine Migrations, Alembic con SQLAlchemy.
- **Database First.** Diseñas el esquema en SQL y el código se adapta a él. Las herramientas son
  de **ingeniería inversa**: leen tablas, columnas y claves y generan las clases
  (*scaffolding*), o las construyen en ejecución leyendo el catálogo (*reflection*).

No me caso con ninguno. Cada uno tiene un precio, y lo importante es saber cuál estás pagando:

- **Code First te ahorra gestionar la base de datos por separado.** El esquema vive en el código,
  las migraciones lo versionan junto a todo lo demás y cualquiera del equipo levanta una base de
  datos idéntica con un comando. Es una ayuda enorme. El precio: solo usas lo que el ORM sabe
  expresar.
- **Database First te deja exprimir la base de datos.** Claves compuestas, restricciones `CHECK`,
  claves foráneas con la acción correcta, tipos precisos, índices pensados para tus consultas. Es lo
  que más me gusta de trabajar así: una base de datos optimizada. El precio: el esquema se gestiona
  aparte y el código tiene que adaptarse a él.

El problema es que los ORMs nacen Code First. Su modelo de objetos es la fuente de verdad, y las
capacidades de la base de datos llegan tarde, a medias o nunca. Las claves primarias compuestas
son el ejemplo más claro: son SQL estándar desde siempre, y aun así cada ORM las trata de una
manera distinta.

## La comparativa

| ORM | Lenguaje / framework | Claves compuestas | Database First (herramienta) | Migraciones (Code First) | Notas |
|---|---|---|---|---|---|
| **EF Core** | C# / .NET | Sí, completas | `dotnet ef dbcontext scaffold` (oficial) | `dotnet ef migrations add` | `HasKey` o el atributo `[PrimaryKey]` (desde EF Core 7) |
| **Hibernate / JPA** | Java | Sí, con `@IdClass` o `@EmbeddedId` | Hibernate Tools, `hbm2java` (integrado en Hibernate ORM desde 7.4) | Generación de esquema; migraciones versionadas con herramientas aparte | La clave es una clase, que puede ser un `record` |
| **Doctrine ORM 3** | PHP / Symfony | Sí, nativas, también con claves foráneas dentro de la clave | Sin comando oficial: la 3.0 eliminó `orm:convert-mapping` y `orm:generate:entities` | Doctrine Migrations (`migrations:diff`) | Su documentación advierte de un coste de rendimiento frente a una clave sustituta |
| **Django ORM** | Python / Django | Sí desde 5.2, con límites | `inspectdb` (genera `CompositePrimaryKey`) | `makemigrations` | Una `ForeignKey` no puede apuntar a un modelo con clave compuesta; no entra en el admin |
| **Eloquent** | PHP / Laravel | No | Ninguna oficial | Migraciones escritas a mano | `$primaryKey` es una sola columna |
| **SQLAlchemy** | Python | Sí, completas | *Reflection* y `automap` (oficial); `sqlacodegen` (de terceros) | Alembic | Varias columnas con `primary_key=True` |

La misma tabla, `order_line` con clave `(order_id, line_number)`, en cada uno:

::::tabs
:::tab[EF Core]
```csharp
[PrimaryKey(nameof(OrderId), nameof(LineNumber))]
public class OrderLine
{
    public int OrderId { get; set; }
    public int LineNumber { get; set; }
    public int Quantity { get; set; }

    public Order Order { get; set; } = null!;
}

// Or with the Fluent API, in OnModelCreating:
// modelBuilder.Entity<OrderLine>().HasKey(l => new { l.OrderId, l.LineNumber });
```
:::
:::tab[Hibernate]
```java
@Embeddable
record OrderLineId(Long orderId, Integer lineNumber) {}

@Entity
@Table(name = "order_line")
class OrderLine {
    @EmbeddedId
    OrderLineId id;

    int quantity;
}
```
:::
:::tab[Doctrine]
```php
#[ORM\Entity]
#[ORM\Table(name: 'order_line')]
class OrderLine
{
    // The foreign key is part of the primary key
    #[ORM\Id]
    #[ORM\ManyToOne(targetEntity: Order::class)]
    #[ORM\JoinColumn(name: 'order_id', referencedColumnName: 'id')]
    private Order $order;

    #[ORM\Id]
    #[ORM\Column(name: 'line_number', type: 'integer')]
    private int $lineNumber;

    #[ORM\Column(type: 'integer')]
    private int $quantity;
}
```
:::
:::tab[Django]
```python
class OrderLine(models.Model):
    pk = models.CompositePrimaryKey("order_id", "line_number")
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    line_number = models.PositiveIntegerField()
    quantity = models.PositiveIntegerField()

    class Meta:
        db_table = "order_line"


# No other model can have a ForeignKey to OrderLine,
# and OrderLine cannot be registered in the admin.
```
:::
:::tab[Eloquent]
```php
// The migration can create the composite key...
Schema::create('order_line', function (Blueprint $table) {
    $table->id();
    $table->foreignId('order_id')->constrained();
    $table->unsignedInteger('line_number');
    $table->unsignedInteger('quantity');
    // ...with $table->primary(['order_id', 'line_number']),
    // but the model could not use it, so: surrogate id + unique index
    $table->unique(['order_id', 'line_number']);
});

class OrderLine extends Model
{
    protected $table = 'order_line';

    // A single column: there is no way to list two
    protected $primaryKey = 'id';
}
```
:::
:::tab[SQLAlchemy]
```python
class OrderLine(Base):
    __tablename__ = "order_line"

    order_id: Mapped[int] = mapped_column(ForeignKey("order.id"), primary_key=True)
    line_number: Mapped[int] = mapped_column(primary_key=True)
    quantity: Mapped[int]
```
:::
::::

Algunos matices que la tabla no recoge:

- **EF Core** es el que más se acerca a lo que pido, y es lo que más me gusta de él. Una vez
  diseñada la base de datos, el *scaffold* oficial genera **todas las clases y su configuración**,
  claves compuestas incluidas: no escribes ni una a mano, el código se adapta al esquema. Otros ORMs
  tienen ingeniería inversa, pero no todos y no siempre completa. Y si vuelves a generar el código,
  las clases parciales te dejan añadir lo tuyo sin perderlo.
- **Hibernate** lo resuelve desde JPA: la clave es una clase propia. Es más ceremonia, pero
  `find()` recibe un `OrderLineId` y queda claro qué identifica a la fila.
- **Doctrine** admite incluso que la clave foránea sea parte de la clave, que es justo el caso de
  `order_line`. A cambio, la 3.0 retiró la generación de entidades desde la base de datos, así que
  en Database First el mapeo lo escribes tú. Para el día a día con su QueryBuilder, tienes
  [consultas dinámicas con Doctrine](../php/symfony/doctrine-consultas-dinamicas.md).
- **Django** las tiene desde la 5.2, pero su propia documentación reconoce que el soporte en
  relaciones y en el admin sigue en desarrollo, y las migraciones no saben convertir una clave
  simple en compuesta una vez creada la tabla. `inspectdb` sí genera el `CompositePrimaryKey`.
  Para el rendimiento, lo que más pesa en Django sigue siendo otra cosa: las
  [consultas N+1](../python/django/consultas-n-mas-1-django.md).
- **Eloquent** lo dice claramente en su documentación: las claves compuestas no están soportadas, y
  propone añadir índices únicos de varias columnas además de una clave de una sola columna. Se
  pidió en 2015 en una incidencia que acabó cerrada sin implementarlo, y en 2023 se volvió a
  preguntar por qué, sin respuesta del equipo.
- **SQLAlchemy** nunca obligó a una columna `id`: marcas varias columnas como clave y listo. Y
  puede trabajar directamente contra un esquema existente con *reflection*.

:::note[Versiones]

Comprobado en noviembre de 2026 con la documentación de EF Core 10, Hibernate ORM 7.4,
Doctrine ORM 3.8, Django 6.1, Laravel 13 y SQLAlchemy 2.1.

:::

## Cómo decido

La pregunta que más pesa no es técnica: **¿cuántos clientes acceden a esta base de datos?**

- **Uno solo**, tu backend, sin nadie más leyendo ni escribiendo: la base de datos es un detalle
  interno de esa aplicación. Code First encaja: que el ORM la gestione y aprovechas sus migraciones.
- **Varios**: otros backends, procesos de datos, informes, integraciones. La base de datos ya no es
  de una aplicación, es un contrato compartido. Database First encaja: el esquema se diseña para
  todos y cada aplicación se adapta a él.
- **Cuando el ORM no llega**: **procedimientos almacenados**. Es otra forma de trabajar, sin
  depender de lo que tu ORM soporte. La lógica que toca esas tablas vive en la base de datos y el
  backend solo llama al procedimiento; cualquier ORM sabe ejecutar SQL. Encaja si estás obligado a
  trabajar Database First con un ORM que no respeta tu esquema, como Eloquent con claves compuestas.
  El precio: parte de la lógica vive en la base de datos, más difícil de versionar y de probar que
  el código.

Después, la balanza:

| Si eliges… | Ganas | Pagas |
|---|---|---|
| **Code First** | Esquema versionado con el código, migraciones automáticas, menos SQL | Solo lo que el ORM sabe expresar; en Django, por ejemplo, una tabla con clave compuesta no puede ser destino de un `ForeignKey` |
| **Database First** | Todo lo que ofrece la base de datos, un esquema optimizado y compartible | Gestionar el esquema aparte y depender de que tu ORM sepa leerlo |

Y aquí el ORM sí importa. Mis proyectos con claves compuestas han sido en .NET, porque venían de
bases de datos diseñadas primero, y EF Core las respetaba sin pelear. Con Django se puede, pero
pierdes mucho por el camino.

Podrías pensar en elegir un ORM que sepa leer tu esquema, como EF Core, SQLAlchemy o Hibernate.
Pero elegir el ORM es elegir el lenguaje y el stack, y eso casi nunca se decide por el ORM. Así que
mi recomendación es esta:

1. **Por defecto, Code First**, y paga su precio sabiendo cuál es.
2. **Si necesitas Database First**, aprovecha lo que tu ORM soporte y apóyate en procedimientos
   almacenados para lo que no llegue.
3. **O haz un Database First que tu ORM pueda gestionar**: diseña el esquema bajando a lo que el
   ORM sabe manejar. Por ejemplo, salvo que trabajes con EF Core, no uses claves primarias
   compuestas: una clave sustituta más un índice único hace el mismo trabajo y ningún ORM se
   pelea con ella.

## En resumen

- **Code First** deriva el esquema del código y te ahorra gestionar la base de datos; **Database
  First** deriva el código del esquema y te deja usar todo lo que la base de datos ofrece. Ninguno
  es mejor: cada uno tiene su precio.
- El criterio que más pesa es **cuántos clientes acceden a la base de datos**: uno solo, Code
  First; varios, Database First, y procedimientos almacenados cuando el ORM no soporta lo que necesitas.
- Las claves compuestas muestran cuánto respeta un ORM la base de datos: EF Core, Hibernate,
  Doctrine y SQLAlchemy las soportan; Django, con límites; Eloquent, no.
- Elegir el ORM es elegir el stack. Por defecto, Code First; si necesitas Database First, apóyate
  en procedimientos almacenados o diseña el esquema a la medida de lo que tu ORM sabe manejar.

## Referencias

- [EF Core: claves](https://learn.microsoft.com/en-us/ef/core/modeling/keys)
- [EF Core: `PrimaryKeyAttribute`](https://learn.microsoft.com/en-us/dotnet/api/microsoft.entityframeworkcore.primarykeyattribute)
- [EF Core: ingeniería inversa (*scaffolding*)](https://learn.microsoft.com/en-us/ef/core/managing-schemas/scaffolding/)
- [Hibernate ORM: introducción (identificadores compuestos)](https://docs.hibernate.org/orm/7.0/introduction/html_single/Hibernate_Introduction.html)
- [Hibernate Tools](https://hibernate.org/tools/)
- [Doctrine ORM: claves primarias compuestas](https://www.doctrine-project.org/projects/doctrine-orm/en/current/tutorials/composite-primary-keys.html)
- [Doctrine ORM: notas de actualización a 3.0](https://github.com/doctrine/orm/blob/3.0.0/UPGRADE.md)
- [Django: claves primarias compuestas](https://docs.djangoproject.com/en/stable/topics/composite-primary-key/)
- [Django: `inspectdb`](https://docs.djangoproject.com/en/stable/ref/django-admin/#inspectdb)
- [Laravel: Eloquent, claves primarias](https://laravel.com/docs/13.x/eloquent#primary-keys)
- [Laravel: migraciones, índices](https://laravel.com/docs/13.x/migrations#creating-indexes)
- [laravel/framework#5355: Eloquent should support composite keys](https://github.com/laravel/framework/issues/5355)
- [laravel/framework discusión #48152: Eloquent Composite Key Support](https://github.com/laravel/framework/discussions/48152)
- [SQLAlchemy: restricciones (`PrimaryKeyConstraint`)](https://docs.sqlalchemy.org/en/21/core/constraints.html)
- [SQLAlchemy: reflexión de tablas](https://docs.sqlalchemy.org/en/21/core/reflection.html)
- [SQLAlchemy: `automap`](https://docs.sqlalchemy.org/en/21/orm/extensions/automap.html)
