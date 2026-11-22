---
slug: articles/development/concepts/orm-code-first-vs-database-first
seo:
  title: "ORM: Code First vs Database First"
  description: "Code First or Database First: how to decide, and how EF Core, Hibernate, Doctrine, Django, Eloquent and SQLAlchemy handle composite primary keys."
  schema:
    - '@type': TechArticle
      headline: "Code First or Database First: composite keys in six ORMs"
      description: "Code First or Database First: how to decide, and how EF Core, Hibernate, Doctrine, Django, Eloquent and SQLAlchemy handle composite primary keys."
      inLanguage: en
      datePublished: '2026-11-22'
      dateModified: '2026-11-22'
      author:
        '@type': Person
        '@id': https://velezanthony.github.io/#anthony
        name: Anthony Velez Tapia
        url: https://velezanthony.github.io/
---

# Code First or Database First: composite keys in six ORMs

You design the order lines table the way the theory says: a line does not exist without its order,
so the primary key is `(order_id, line_number)`. No auto-increment `id` that adds nothing. Then you
open the ORM to map it and find it does not know what to do with it: either it does not support it,
or it half supports it, or it asks you to add an `id` column "just because". And you end up
changing the database to fit the tool, when it should be the other way round.

## What an ORM is

An ORM (*Object-Relational Mapper*) translates between the rows of a relational database and the
objects of your language. You work with classes, properties and relationships; the ORM generates
the SQL, loads the results and keeps track of changes so it can save them. The price is that
between your code and your tables there is a layer with its own opinions on what a table should
look like.

## Code First and Database First

The question is who is in charge: the code or the database.

- **Code First.** You write the classes and the ORM derives the schema. **Migrations** compare the
  model with the database and generate the SQL to bring them in line: `dotnet ef migrations add`,
  `makemigrations` in Django, `migrations:diff` with Doctrine Migrations, Alembic with SQLAlchemy.
- **Database First.** You design the schema in SQL and the code adapts to it. The tools do
  **reverse engineering**: they read tables, columns and keys and generate the classes
  (*scaffolding*), or build them at runtime by reading the catalogue (*reflection*).

I am not wedded to either. Each has a price, and what matters is knowing which one you are paying:

- **Code First saves you managing the database separately.** The schema lives in the code,
  migrations version it alongside everything else and anyone on the team can spin up an identical
  database with one command. It is a huge help. The price: you only use what the ORM can express.
- **Database First lets you get the most out of the database.** Composite keys, `CHECK`
  constraints, foreign keys with the right action, precise types, indexes designed for your
  queries. It is what I like most about working this way: an optimised database. The price: the
  schema is managed separately and the code has to adapt to it.

The problem is that ORMs are born Code First. Their object model is the source of truth, and the
database's capabilities arrive late, halfway or never. Composite primary keys are the clearest
example: they have been standard SQL forever, and even so each ORM handles them differently.

## The comparison

| ORM | Language / framework | Composite keys | Database First (tool) | Migrations (Code First) | Notes |
|---|---|---|---|---|---|
| **EF Core** | C# / .NET | Yes, full support | `dotnet ef dbcontext scaffold` (official) | `dotnet ef migrations add` | `HasKey` or the `[PrimaryKey]` attribute (since EF Core 7) |
| **Hibernate / JPA** | Java | Yes, with `@IdClass` or `@EmbeddedId` | Hibernate Tools, `hbm2java` (built into Hibernate ORM since 7.4) | Schema generation; versioned migrations with separate tools | The key is a class, which can be a `record` |
| **Doctrine ORM 3** | PHP / Symfony | Yes, native, including foreign keys inside the key | No official command: 3.0 removed `orm:convert-mapping` and `orm:generate:entities` | Doctrine Migrations (`migrations:diff`) | Its documentation warns of a performance cost compared with a surrogate key |
| **Django ORM** | Python / Django | Yes since 5.2, with limits | `inspectdb` (generates `CompositePrimaryKey`) | `makemigrations` | A `ForeignKey` cannot point to a model with a composite key; not supported in the admin |
| **Eloquent** | PHP / Laravel | No | No official one | Hand-written migrations | `$primaryKey` is a single column |
| **SQLAlchemy** | Python | Yes, full support | *Reflection* and `automap` (official); `sqlacodegen` (third party) | Alembic | Several columns with `primary_key=True` |

The same table, `order_line` with key `(order_id, line_number)`, in each one:

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

Some nuances the table does not capture:

- **EF Core** is the one that comes closest to what I ask for, and it is what I like most about it.
  Once the database is designed, the official *scaffold* generates **all the classes and their
  configuration**, composite keys included: you do not write a single one by hand, the code adapts
  to the schema. Other ORMs have reverse engineering, but not all of them and not always complete.
  And if you regenerate the code, partial classes let you add your own bits without losing them.
- **Hibernate** solves it from JPA: the key is a class of its own. It is more ceremony, but
  `find()` takes an `OrderLineId` and it is clear what identifies the row.
- **Doctrine** even allows the foreign key to be part of the key, which is exactly the
  `order_line` case. In exchange, 3.0 dropped entity generation from the database, so with Database
  First you write the mapping yourself. For day-to-day work with its QueryBuilder, there is
  [dynamic queries with Doctrine](../php/symfony/doctrine-consultas-dinamicas.md).
- **Django** has had them since 5.2, but its own documentation admits that support in
  relationships and in the admin is still in progress, and migrations cannot turn a simple key into
  a composite one once the table has been created. `inspectdb` does generate the
  `CompositePrimaryKey`. For performance, what weighs most in Django is still something else:
  [N+1 queries](../python/django/consultas-n-mas-1-django.md).
- **Eloquent** says it plainly in its documentation: composite keys are not supported, and it
  suggests adding multi-column unique indexes in addition to a single-column key. It was requested
  in 2015 in an issue that was closed without implementing it, and in 2023 someone asked again why,
  with no answer from the team.
- **SQLAlchemy** never forced an `id` column: you mark several columns as the key and that is it.
  And it can work directly against an existing schema with *reflection*.

:::note[Versions]

Checked in November 2026 against the documentation for EF Core 10, Hibernate ORM 7.4,
Doctrine ORM 3.8, Django 6.1, Laravel 13 and SQLAlchemy 2.1.

:::

## How I decide

The question that weighs most is not technical: **how many clients access this database?**

- **Just one**, your backend, with nobody else reading or writing: the database is an internal
  detail of that application. Code First fits: let the ORM manage it and make use of its
  migrations.
- **Several**: other backends, data processes, reports, integrations. The database no longer
  belongs to one application; it is a shared contract. Database First fits: the schema is designed
  for everyone and each application adapts to it.
- **When the ORM falls short**: **stored procedures**. It is another way of working, without
  depending on what your ORM supports. The logic that touches those tables lives in the database
  and the backend only calls the procedure; any ORM can run SQL. It fits if you are forced to work
  Database First with an ORM that does not respect your schema, such as Eloquent with composite
  keys. The price: part of the logic lives in the database, which is harder to version and test
  than code.

Then, the trade-off:

| If you choose… | You gain | You pay |
|---|---|---|
| **Code First** | Schema versioned with the code, automatic migrations, less SQL | Only what the ORM can express; in Django, for example, a table with a composite key cannot be the target of a `ForeignKey` |
| **Database First** | Everything the database offers, an optimised and shareable schema | Managing the schema separately and depending on your ORM being able to read it |

And here the ORM does matter. My projects with composite keys have been in .NET, because they came
from databases designed first, and EF Core respected them without a fight. With Django it can be
done, but you lose a lot along the way.

You might think of choosing an ORM that can read your schema, such as EF Core, SQLAlchemy or
Hibernate. But choosing the ORM means choosing the language and the stack, and that is almost never
decided by the ORM. So my recommendation is this:

1. **By default, Code First**, and pay its price knowing what it is.
2. **If you need Database First**, make the most of what your ORM supports and lean on stored
   procedures for whatever it cannot reach.
3. **Or do a Database First your ORM can handle**: design the schema by scaling it down to what the
   ORM can manage. For example, unless you work with EF Core, do not use composite primary keys: a
   surrogate key plus a unique index does the same job and no ORM fights it.

## In summary

- **Code First** derives the schema from the code and saves you managing the database; **Database
  First** derives the code from the schema and lets you use everything the database offers.
  Neither is better: each has its price.
- The criterion that weighs most is **how many clients access the database**: just one, Code
  First; several, Database First, with stored procedures when the ORM does not support what you
  need.
- Composite keys show how much an ORM respects the database: EF Core, Hibernate, Doctrine and
  SQLAlchemy support them; Django, with limits; Eloquent, not at all.
- Choosing the ORM means choosing the stack. By default, Code First; if you need Database First,
  lean on stored procedures or design the schema to fit what your ORM can handle.

## References

- [EF Core: keys](https://learn.microsoft.com/en-us/ef/core/modeling/keys)
- [EF Core: `PrimaryKeyAttribute`](https://learn.microsoft.com/en-us/dotnet/api/microsoft.entityframeworkcore.primarykeyattribute)
- [EF Core: reverse engineering (*scaffolding*)](https://learn.microsoft.com/en-us/ef/core/managing-schemas/scaffolding/)
- [Hibernate ORM: introduction (composite identifiers)](https://docs.hibernate.org/orm/7.0/introduction/html_single/Hibernate_Introduction.html)
- [Hibernate Tools](https://hibernate.org/tools/)
- [Doctrine ORM: composite primary keys](https://www.doctrine-project.org/projects/doctrine-orm/en/current/tutorials/composite-primary-keys.html)
- [Doctrine ORM: upgrade notes to 3.0](https://github.com/doctrine/orm/blob/3.0.0/UPGRADE.md)
- [Django: composite primary keys](https://docs.djangoproject.com/en/stable/topics/composite-primary-key/)
- [Django: `inspectdb`](https://docs.djangoproject.com/en/stable/ref/django-admin/#inspectdb)
- [Laravel: Eloquent, primary keys](https://laravel.com/docs/13.x/eloquent#primary-keys)
- [Laravel: migrations, indexes](https://laravel.com/docs/13.x/migrations#creating-indexes)
- [laravel/framework#5355: Eloquent should support composite keys](https://github.com/laravel/framework/issues/5355)
- [laravel/framework discussion #48152: Eloquent Composite Key Support](https://github.com/laravel/framework/discussions/48152)
- [SQLAlchemy: constraints (`PrimaryKeyConstraint`)](https://docs.sqlalchemy.org/en/21/core/constraints.html)
- [SQLAlchemy: table reflection](https://docs.sqlalchemy.org/en/21/core/reflection.html)
- [SQLAlchemy: `automap`](https://docs.sqlalchemy.org/en/21/orm/extensions/automap.html)
