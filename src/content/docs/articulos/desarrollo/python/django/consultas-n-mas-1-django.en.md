---
slug: articles/development/python/django/django-n-plus-1-queries
seo:
  title: "Django N+1 queries: from 101 to 1"
  description: "How to find and fix N+1 queries in Django step by step: from 101 queries to 1 with debug-toolbar, select_related, prefetch_related and annotate."
---

# N+1 queries in Django: from 101 queries to 1

On one project I worked on, the home page took about 12 seconds to load. After reviewing the
queries, it went down to between 1 and 2. The cause was the most common one in Django: **N+1
queries**.

Here I explain how I would fix it today, step by step, with a counter that keeps going down: the
number of queries the page makes.

:::note[What you need]

- **[django-debug-toolbar](https://django-debug-toolbar.readthedocs.io/)** installed in development.
  It is the only thing you really need.
- Three example models: a seller, their products and each product's images.

```python
class Seller(models.Model):
    name = models.CharField(max_length=100)


class Product(models.Model):
    name = models.CharField(max_length=200)
    seller = models.ForeignKey(Seller, on_delete=models.CASCADE, related_name="products")


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    url = models.URLField()
```

:::

## 1. The symptom: a slow list

A view that lists 50 products with their seller and how many images each one has:

```python
products = Product.objects.all()[:50]
for product in products:
    print(product.name, product.seller.name, product.images.count())
```

Reading it, nothing looks wrong. That is why reading is not enough: you have to **count**.

## 2. Look: open debug-toolbar

Open the page and look at debug-toolbar's **SQL** panel. It shows how many queries the request
made and which ones, and it groups the ones that repeat:

- **Similar**: the same SQL with different parameters. This is the signature of N+1.
- **Duplicated**: the same SQL with the same parameters. You are reading the same thing twice.

In our example you will see something like this:

| Query | Times |
|---|---|
| `SELECT … FROM product LIMIT 50` | 1 |
| `SELECT … FROM seller WHERE id = %s` | 50 (similar) |
| `SELECT COUNT(*) FROM productimage WHERE product_id = %s` | 50 (similar) |

**Counter: 101 queries.**

## 3. Understand: why it happens

Django's ORM is **lazy**: a relation is not loaded until you touch it. You ask for 50 products
(the "1") and, inside the loop, every `product.seller` and every `product.images.count()` goes to
the database on its own (the "N").

Each query is fast, but the round trips add up. With templates that touch several relations, the
number shoots up.

### Why you don't notice it locally

To understand this, you need to know what happens when you ask the database for data. Three things
come into play:

| Concept | What it is | Analogy |
|---|---|---|
| **Latency** | The time a round trip takes: the query goes out, the database replies | How long a car takes to get there and back |
| **IOPS** | How many read or write operations the disk can do per second. Each one reads a small block (in PostgreSQL, 8 kB pages) | How many cars can set off per second |
| **Throughput (MiB/s)** | How much data the disk can move per second, in total | How many lanes the road has |

On top of that, the database keeps the data it uses often in **memory (RAM)**. If what you ask for
is there, it doesn't even touch the disk. If not, it has to read it from disk, and that is where
IOPS and MiB/s rule.

#### On your machine

Django and the database are on the same computer. The query never goes out to a network: latency
is almost zero. And with the little data you have in development, everything fits in RAM, so the
disk doesn't even take part.

You make 101 queries and each one is resolved instantly. You notice nothing.

#### In the cloud

The application and the database are **different machines** inside the same private network. All
three costs appear:

1. **Latency on every trip.** Each query crosses the network and comes back. It is little per trip
   (in a Google test between two machines in the same zone, around 0.1 ms; more between zones or
   with a proxy in between), but N+1 multiplies it: 101 queries are 101 trips.
2. **The data no longer fits in RAM.** With real production data, the database has to go to disk
   more often, and the disk has an IOPS limit: many small scattered reads, exactly what N+1
   causes, end up queuing.
3. **Throughput has a ceiling.** If you ask for a lot of data at once, the MiB/s limit rules. For
   example, 80,000 rows taking up 800 MiB, on a disk limited to 300 MiB/s, need about
   **2.7 seconds** just to be read (800 ÷ 300). On your machine, with that data already in RAM, it
   would be a matter of milliseconds.

That is why N+1 hides in development and shows up in production: the code doesn't change, what
changes is **where the data lives and how much it costs to reach it**.

:::note[The limits depend on the instance]

In managed services, IOPS and MiB/s are set by the provider according to the machine type, the
disk type and its size. In Google Cloud SQL, for example, a **Hyperdisk Balanced** disk of 20 to
256 GB starts at 4,000 IOPS and 170 MiB/s; classic SSD and HDD disks have other limits. It is worth
checking the ones for your instance: they are your database's real ceiling.

:::

## 4. First fix: `select_related` for the seller

Each product has **one** seller. For "to-one" relations (foreign key or one-to-one),
`select_related` brings it in the same query with a JOIN:

```python
products = Product.objects.select_related("seller")[:50]
```

The 50 seller queries disappear.

**Counter: 51 queries.**

## 5. Second fix: `prefetch_related` for the images

Each product has **many** images. A JOIN would repeat the product for every image, so
`prefetch_related` runs a separate query with `IN (…)` and distributes the results in Python:

```python
products = Product.objects.select_related("seller").prefetch_related("images")[:50]
```

Now `product.images.count()` doesn't go to the database: Django counts what it already prefetched.

**Counter: 2 queries.** It makes no difference whether there are 5 products or 500.

### And if you only need the number: `annotate`

In this example we don't use the images, only how many there are. So there is no need to fetch
them: let the database count them.

```python
from django.db.models import Count

products = Product.objects.select_related("seller").annotate(image_count=Count("images"))[:50]
for product in products:
    print(product.name, product.seller.name, product.image_count)
```

**Counter: 1 query.**

:::tip[What to use in each case]

| You need… | Use |
|---|---|
| One related object (FK, one-to-one) | `select_related` |
| Several related objects (reverse, many-to-many) | `prefetch_related` |
| Just a number or an aggregate | `annotate` |

:::

## 6. Make sure it doesn't happen again

Fixing it is easy. The hard part is making sure nobody breaks it next week. I use two things.

### A test that counts queries

`assertNumQueries` turns the counter into a contract. If someone touches a relation without
prefetching it, the test fails. This one requests the URL of the `seller_products` view, which you
will see in the next section:

```python
from django.test import TestCase
from django.urls import reverse

from sales.models import Product, Seller


class SellerProductsTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.seller = Seller.objects.create(name="Ana")
        Product.objects.bulk_create(
            Product(name=f"Product {i}", seller=cls.seller) for i in range(5)
        )

    def test_seller_products_makes_one_query(self):
        url = reverse("seller_products", args=[self.seller.pk])
        with self.assertNumQueries(1):
            self.client.get(url)
```

The `1` assumes an **anonymous** request: with no session cookie, neither the session nor the user
goes to the database. If the view requires login, count those queries as well (with `force_login`
there are usually two more: the session and the user).

### Queries in one place: `selectors.py`

I organise every project with **one app per domain** (for example, `sales`) and, inside it, the
reusable reads in `selectors.py`: small functions that return a `QuerySet` with the prefetching
already decided.

```python
# sales/selectors.py
from django.db.models import Count, QuerySet

from sales.models import Product


def products_for_listing() -> QuerySet[Product]:
    return Product.objects.select_related("seller").annotate(image_count=Count("images"))
```

The view uses it and only adds its own bits:

```python
# sales/views.py
def seller_products(request, seller_id):
    products = products_for_listing().filter(seller_id=seller_id).order_by("name")
    return render(request, "sales/products.html", {"products": products})
```

The advantage: the loading strategy lives in **a single function**. If tomorrow the list shows
another relation, I add it to the selector and every view that uses it is fixed. Writes
(`services.py`) and server-side validated forms (`forms.py`) complete the structure; I explain them
in [REST API and SPA vs a monolith with HTMX and Alpine](../../conceptos/api-rest-spa-vs-htmx.md).

## 7. Common traps

- **Filtering a prefetched relation.** `product.images.filter(...)` is a new query and throws the
  prefetch away. If you need a subset, prefetch it with
  `Prefetch("images", queryset=..., to_attr="...")`.
- **`.first()` on an unordered prefetched relation.** Django adds `order_by("pk")` and queries
  again. `.count()` and `.exists()`, on the other hand, do use the prefetch.
- **The template.** You prefetch in the view and the template touches another relation. This is
  where most N+1s appear, because nobody reads a template thinking about SQL.
- **Nested serialisers** (Django REST Framework): the view's `queryset` must prefetch everything
  the serialiser touches.
- **`only()` and `defer()`.** Reading fewer columns is fine, but accessing a deferred field later
  fires one query per object: another N+1.

## Summary

1. Don't read the code: **count the queries** with debug-toolbar.
2. A "to-one" relation → `select_related`. "To-many" → `prefetch_related`. Just a number →
   `annotate`.
3. Pin it down with `assertNumQueries` and keep the query in a selector so nobody breaks it.

## References

- [QuerySet API: `select_related`, `prefetch_related` and `Prefetch`](https://docs.djangoproject.com/en/stable/ref/models/querysets/)
- [Database access optimisation](https://docs.djangoproject.com/en/stable/topics/db/optimization/)
- [Aggregation and `annotate()`](https://docs.djangoproject.com/en/stable/topics/db/aggregation/)
- [Testing tools: `assertNumQueries`](https://docs.djangoproject.com/en/stable/topics/testing/tools/)
- [django-debug-toolbar: panels](https://django-debug-toolbar.readthedocs.io/en/latest/panels.html)
- [django-debug-toolbar: change log (similar and duplicated queries)](https://django-debug-toolbar.readthedocs.io/en/latest/changes.html)
- [Google Cloud: measuring network latency with netperf and ping](https://cloud.google.com/blog/products/networking/using-netperf-and-ping-to-measure-network-latency)
- [Cloud SQL: storage options, IOPS and throughput](https://docs.cloud.google.com/sql/docs/postgres/storage-options-overview)
- [Compute Engine: network bandwidth](https://docs.cloud.google.com/compute/docs/network-bandwidth)
