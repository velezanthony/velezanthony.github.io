---
slug: articles/development/php/symfony/doctrine-dynamic-queries
seo:
  title: "Dynamic queries with Doctrine"
  description: "Optional filters with Doctrine's QueryBuilder in Symfony: conditions built from filters, parameters against SQL injection, joins without N+1, pagination."
---

# Dynamic queries with Doctrine's QueryBuilder in Symfony

The product listing in the admin panel has a search box, a category selector and a date range. All
optional. The temptation is one repository method per combination of filters and an `if` that
picks which one to call. With three filters that is already eight combinations, and every new
filter doubles them.

What I need is **a single query that is built from the filters that arrive**. That is what the
QueryBuilder is for.

## DQL and QueryBuilder

Doctrine queries with **DQL**: a language similar to SQL, but over entities and their properties
(`p.category`), not tables and columns. You can write it as a string, or build it piece by piece
with the **QueryBuilder**, which ends up generating the same DQL.

The rule I follow:

- **A DQL string** when the query is fixed: always the same conditions, perhaps with a subquery.
  You read it at a glance.
- **The QueryBuilder** when parts of the query depend on the data: optional filters, sorting chosen
  by the user, joins that are only needed sometimes. Concatenating DQL fragments with `if` ends in
  stray spaces and `AND`s.
- **`findBy()`** when you only compare equalities. It does not support `LIKE`, ranges or joins.

## The filters as an object

Before the repository, I gather the filters into an object. That way the method takes one parameter
instead of six, and adding a filter does not change its signature:

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

From the controller, the call looks like this:

```php
$page = $productRepository->search(
    new ProductFilters(search: 'table', categoryIds: [3, 7]),
    page: 2,
);
```

## How the query is built

The base is always the same: products with their category, sorted. Then each filter that arrives
adds its condition with `andWhere()`, and one that does not arrive adds nothing. You do not need to
know which one comes first: `andWhere()` works the same even if there is no condition before it.

Two details that have saved me some scares:

- **Check with `!== null` and `!== []`**, not with `if ($filters->search)`. With PHP's "falsy"
  check, a search for `"0"` would be ignored.
- **Group the `OR`s** with `$qb->expr()->orX()`. Name or SKU is a single condition, and this way it
  is clear that it goes in brackets against the other `AND`s.

The date range uses `< next day` instead of `<= day`. If the user picks "up to the 15th",
`createdTo` arrives as the 15th at 00:00, and `<=` would leave out everything created that day.
With the limit on the next day, the whole day counts.

## Parameters, never concatenation

Every value from the user goes in as a **parameter** (`:search`, `:categoryIds`) with
`setParameter()`. What you never do:

```php
// Never: the user's text becomes part of the query
$qb->andWhere("p.name LIKE '%".$filters->search."%'");
```

If someone types a quote into the search box, that text becomes part of the query: that is **SQL
injection**. With parameters, the query and the values travel separately and the database never
interprets the value as code.

`setParameter()` also infers the type: a `DateTimeImmutable` is converted to a date, and an array of
integers to a list for `IN`, so `IN (:categoryIds)` just works.

## The join and N+1

The `join('p.category', 'c')` lets me filter by category. But a join only **filters**: if the
template then renders `product.category.name`, Doctrine fires a query per product to load its
category, one for each distinct category on the page. That is the **N+1** problem: one query for
the list and one more for each relationship the view touches.

The `addSelect('c')` avoids it. It tells Doctrine to also fetch the categories in the same query
and assign them to each product. It is what Doctrine calls a *fetch join*. It is exactly the same
problem I describe in [N+1 queries in Django](../../python/django/consultas-n-mas-1-django.md),
where the equivalent solution is `select_related`.

## Pagination

`OffsetPaginator` takes the QueryBuilder and a window (page and size) and returns the page with its
products. If I need the total in the view, `getTotalCount()` fires a separate `COUNT` query only
when I ask for it.

Why not just `setMaxResults()`? With the join to a single category it would make no difference, but
the day you add a join to a collection (the product's tags, for example), the SQL `LIMIT` will count
rows, not products, and a page could end up half full. The paginator solves it by first fetching
the identifiers for the page. Also, the sorting ends with `p.id`, so that the order is stable across
pages even if two products have the same date.

:::note[Versions]

`OffsetPaginator` and `Window` exist since Doctrine ORM 3.7. In earlier versions, the class is
`Doctrine\ORM\Tools\Pagination\Paginator`.

:::

## Before signing off the query

| Check | Why |
|---|---|
| Each optional filter adds its `andWhere()` only if it arrives | One query for every combination |
| All user values go through `setParameter()` | SQL injection |
| The `OR`s go inside `orX()` | Precedence against the `AND`s |
| The relationships the view renders have `addSelect()` | N+1 |
| The sorting ends with a unique column | Stable pages |

## In summary

- For optional filters, the QueryBuilder with one `andWhere()` per filter present; for fixed
  queries, it is simpler with a DQL string.
- Values always as parameters, never concatenated.
- `join()` filters; `join()` with `addSelect()` also loads the relationship and avoids N+1.
- Paginate with Doctrine's paginator, not just with `setMaxResults()`.

## References

- [Symfony: databases and Doctrine](https://symfony.com/doc/current/doctrine.html)
- [Doctrine ORM: QueryBuilder](https://www.doctrine-project.org/projects/doctrine-orm/en/current/reference/query-builder.html)
- [Doctrine ORM: DQL](https://www.doctrine-project.org/projects/doctrine-orm/en/current/reference/dql-doctrine-query-language.html)
- [Doctrine ORM: pagination](https://www.doctrine-project.org/projects/doctrine-orm/en/current/tutorials/pagination.html)
