---
seo:
  title: "Consultas dinámicas con Doctrine"
  description: "Filtros opcionales con el QueryBuilder de Doctrine en Symfony: condiciones según los filtros, parámetros contra la inyección SQL, joins sin N+1 y paginación."
  schema:
    - '@type': TechArticle
      headline: "Consultas dinámicas con el QueryBuilder de Doctrine en Symfony"
      description: "Filtros opcionales con el QueryBuilder de Doctrine en Symfony: condiciones según los filtros, parámetros contra la inyección SQL, joins sin N+1 y paginación."
      inLanguage: es
      datePublished: '2026-11-21'
      dateModified: '2026-11-22'
      author:
        '@type': Person
        '@id': https://velezanthony.github.io/#anthony
        name: Anthony Velez Tapia
        url: https://velezanthony.github.io/
---

# Consultas dinámicas con el QueryBuilder de Doctrine en Symfony

El listado de productos del panel de administración tiene un buscador, un selector de categorías y
un rango de fechas. Todos opcionales. La tentación es un método del repositorio por cada
combinación de filtros y un `if` que elige cuál llamar. Con tres filtros ya son ocho
combinaciones, y cada filtro nuevo las duplica.

Lo que necesito es **una sola consulta que se construye según los filtros que llegan**. Para eso
está el QueryBuilder.

## DQL y QueryBuilder

Doctrine consulta con **DQL**: un lenguaje parecido a SQL, pero sobre entidades y sus propiedades
(`p.category`), no sobre tablas y columnas. Puedes escribirlo como un texto, o construirlo pieza a
pieza con el **QueryBuilder**, que al final genera el mismo DQL.

La regla que sigo:

- **Una cadena de DQL** cuando la consulta es fija: siempre las mismas condiciones, quizá con una
  subconsulta. Se lee de un vistazo.
- **El QueryBuilder** cuando partes de la consulta dependen de los datos: filtros opcionales,
  ordenación elegida por el usuario, joins que solo hacen falta a veces. Concatenar trozos de DQL
  con `if` acaba en espacios y `AND` sueltos.
- **`findBy()`** cuando solo comparas igualdades. No admite `LIKE`, rangos ni joins.

## Los filtros como objeto

Antes del repositorio, junto los filtros en un objeto. Así el método recibe un parámetro en lugar
de seis, y añadir un filtro no cambia su firma:

::::tabs
:::tab[src/Repository/ProductFilters.php]
```php
<?php

namespace App\Repository;

final readonly class ProductFilters
{
    /**
     * @param list<int> $categoryIds
     */
    public function __construct(
        public ?string $search = null,
        public array $categoryIds = [],
        public ?\DateTimeImmutable $createdFrom = null,
        public ?\DateTimeImmutable $createdTo = null,
    ) {
    }
}
```
:::
:::tab[src/Repository/ProductRepository.php]
```php
<?php

namespace App\Repository;

use App\Entity\Product;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\Tools\Pagination\OffsetPaginator;
use Doctrine\ORM\Tools\Pagination\Window;
use Doctrine\ORM\Tools\Pagination\WindowPage;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Product>
 */
class ProductRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Product::class);
    }

    public function search(ProductFilters $filters, int $page = 1, int $perPage = 25): WindowPage
    {
        $qb = $this->createQueryBuilder('p')
            ->join('p.category', 'c')
            ->addSelect('c')
            ->orderBy('p.createdAt', 'DESC')
            ->addOrderBy('p.id', 'DESC');

        if ($filters->search !== null && $filters->search !== '') {
            $qb->andWhere($qb->expr()->orX('p.name LIKE :search', 'p.sku LIKE :search'))
                ->setParameter('search', '%'.$filters->search.'%');
        }

        if ($filters->categoryIds !== []) {
            $qb->andWhere('c.id IN (:categoryIds)')
                ->setParameter('categoryIds', $filters->categoryIds);
        }

        if ($filters->createdFrom !== null) {
            $qb->andWhere('p.createdAt >= :from')
                ->setParameter('from', $filters->createdFrom);
        }

        if ($filters->createdTo !== null) {
            // Up to the end of that day: strictly before the next one
            $qb->andWhere('p.createdAt < :to')
                ->setParameter('to', $filters->createdTo->modify('+1 day'));
        }

        return (new OffsetPaginator())->paginate($qb, Window::fromPageNumberAndSize($page, $perPage));
    }
}
```
:::
::::

Desde el controlador, la llamada queda así:

```php
$page = $productRepository->search(
    new ProductFilters(search: 'mesa', categoryIds: [3, 7]),
    page: 2,
);
```

## Cómo se construye la consulta

La base es siempre la misma: productos con su categoría, ordenados. Después, cada filtro que llega
añade su condición con `andWhere()`, y el que no llega no añade nada. No hace falta saber cuál es
el primero: `andWhere()` funciona igual aunque no haya ninguna condición antes.

Dos detalles que me han ahorrado sustos:

- **Comprobar con `!== null` y `!== []`**, no con `if ($filters->search)`. Con la comprobación
  «falsa» de PHP, una búsqueda de `"0"` se ignoraría.
- **Agrupar los `OR`** con `$qb->expr()->orX()`. El nombre o el SKU es una sola condición, y así
  queda claro que va entre paréntesis frente a los demás `AND`.

El rango de fechas usa `< día siguiente` en lugar de `<= día`. Si el usuario elige «hasta el 15»,
`createdTo` llega como el 15 a las 00:00, y `<=` dejaría fuera todo lo creado ese día. Con el
límite en el día siguiente, el día entero cuenta.

## Parámetros, nunca concatenación

Cada valor del usuario va como **parámetro** (`:search`, `:categoryIds`) con `setParameter()`. Lo
que no se hace nunca:

```php
// Never: the user's text becomes part of the query
$qb->andWhere("p.name LIKE '%".$filters->search."%'");
```

Si alguien escribe una comilla en el buscador, ese texto pasa a ser parte de la consulta: es una
**inyección SQL**. Con parámetros, la consulta y los valores viajan por separado y la base de datos
nunca interpreta el valor como código.

`setParameter()` además deduce el tipo: un `DateTimeImmutable` se convierte en fecha, y un array de
enteros en una lista para `IN`, así que `IN (:categoryIds)` funciona sin más.

## El join y el N+1

El `join('p.category', 'c')` me permite filtrar por categoría. Pero un join solo **filtra**: si
después la plantilla pinta `product.category.name`, Doctrine lanza una consulta por cada producto
para cargar su categoría, una por cada categoría distinta de la página. Es el problema **N+1**: una
consulta para la lista y otra más por cada relación que la vista toca.

El `addSelect('c')` lo evita. Le dice a Doctrine que traiga también las categorías en la misma
consulta y las asigne a cada producto. Es lo que Doctrine llama un *fetch join*. Es exactamente el
mismo problema que cuento en [Consultas N+1 en Django](../../python/django/consultas-n-mas-1-django.md), donde la
solución equivalente es `select_related`.

## La paginación

`OffsetPaginator` recibe el QueryBuilder y una ventana (página y tamaño) y devuelve la página con
sus productos. Si en la vista necesito el total, `getTotalCount()` lanza una consulta `COUNT` aparte
solo cuando lo pido.

¿Por qué no `setMaxResults()` y ya? Con el join a una sola categoría daría igual, pero el día que
añadas un join a una colección (las etiquetas del producto, por ejemplo), el `LIMIT` de SQL contará
filas, no productos, y una página podría quedarse a medias. El paginador lo resuelve buscando
primero los identificadores de la página. Además, la ordenación termina en `p.id`, para que el orden sea
estable entre páginas aunque dos productos tengan la misma fecha.

:::note[Versiones]

`OffsetPaginator` y `Window` existen desde Doctrine ORM 3.7. En versiones anteriores, la clase es
`Doctrine\ORM\Tools\Pagination\Paginator`.

:::

## Antes de dar la consulta por buena

| Comprobación | Por qué |
|---|---|
| Cada filtro opcional añade su `andWhere()` solo si llega | Una consulta para todas las combinaciones |
| Todos los valores del usuario van con `setParameter()` | Inyección SQL |
| Los `OR` van dentro de `orX()` | Precedencia frente a los `AND` |
| Las relaciones que pinta la vista llevan `addSelect()` | N+1 |
| La ordenación termina en una columna única | Páginas estables |

## En resumen

- Para filtros opcionales, el QueryBuilder con un `andWhere()` por filtro presente; para consultas
  fijas, es más sencillo con una cadena de DQL.
- Los valores siempre como parámetros, nunca concatenados.
- `join()` filtra; `join()` con `addSelect()` además carga la relación y evita el N+1.
- Pagina con el paginador de Doctrine, no solo con `setMaxResults()`.

## Referencias

- [Symfony: bases de datos y Doctrine](https://symfony.com/doc/current/doctrine.html)
- [Doctrine ORM: QueryBuilder](https://www.doctrine-project.org/projects/doctrine-orm/en/current/reference/query-builder.html)
- [Doctrine ORM: DQL](https://www.doctrine-project.org/projects/doctrine-orm/en/current/reference/dql-doctrine-query-language.html)
- [Doctrine ORM: paginación](https://www.doctrine-project.org/projects/doctrine-orm/en/current/tutorials/pagination.html)
