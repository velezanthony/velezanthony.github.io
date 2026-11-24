---
slug: articles/development/python/organising-a-django-or-flask-project
seo:
  title: "Organising a Django or Flask project"
  description: "The structure I use for Django and Flask projects that grow: domain, services, selectors and use cases to serve HTML and JSON at the same time."
  schema:
    - '@type': TechArticle
      headline: "How I organise a growing Python project: the same structure in Django and Flask"
      description: "The structure I use for Django and Flask projects that grow: domain, services, selectors and use cases to serve HTML and JSON at the same time."
      inLanguage: en
      datePublished: '2026-11-23'
      dateModified: '2026-11-23'
      author:
        '@type': Person
        '@id': https://velezanthony.github.io/#anthony
        name: Anthony Velez Tapia
        url: https://velezanthony.github.io/
---

# How I organise a growing Python project: the same structure in Django and Flask

I have worked on several Django projects and several Flask ones. They all start the same way: a few
views that query, validate and save, all in the same place. It works until the project grows and
every change means hunting for the same rule in five views.

Over time I have settled on a structure I use in both. Here I explain what it looks like, what I
like about it, what its limitations are and how I solve them, and the piece I add when the project
has to serve more than one client, for example the website and an Angular or mobile app.

Every example comes in two tabs: **Django**, with its ORM, and **Flask**, with SQLAlchemy. Pick
yours: the structure is the same.

## 1. Everything in its place

The idea is that each file has one job, and only one:

| File | What it does | What it never does |
|---|---|---|
| `views.py` | Reads the request, calls whoever knows and responds | Business logic |
| `forms.py` | Validates a screen's input: types, required fields, lengths | Business rules: those belong to the service |
| `schemas.py` | Validates the API's input and types what it returns | Query the database |
| `services.py` | Writes: creates, changes, deletes, and applies the rules | Read to render a screen |
| `selectors.py` | Reads: returns an entity or a dataclass | Write, or return a loose dict |
| `models.py` | The data | Know about screens |

It is like a restaurant: the view is the waiter, who takes the order and serves the dish; the
services are the kitchen and the *selectors*, the pantry. The waiter does not cook, and the kitchen
does not come out to the dining room.

The domain folder knows nothing about screens, and the templates live apart, following the
interface:

::::tabs
:::tab[Django]
```text
apps/
├── core/                ← the domain: one folder per entity, no views or routes
│   └── orders/
│       ├── models.py    ← the data
│       ├── forms.py     ← a screen's input
│       ├── schemas.py   ← the API's input and output
│       ├── services.py  ← writes and applies the rules
│       ├── selectors.py ← reads
│       ├── queries.py   ← standalone conditions, in large projects
│       └── use_cases.py ← orchestrates, when there are several clients
└── portals/             ← the interface, one folder per audience
    ├── backoffice/      ← the team that manages the orders
    │   ├── urls.py      ← the routes of both, kept apart
    │   ├── views.py     ← the SSR views: render the screen
    │   └── api.py       ← the API views: respond with JSON
    └── storefront/      ← the shop, for customers
templates/               ← follows the interface, not the domain
└── cotton/              ← the components: atoms, molecules and layouts
```
:::
:::tab[Flask]
```text
apps/
├── core/                ← the domain: one folder per entity, no views or routes
│   └── orders/
│       ├── models.py    ← the data
│       ├── forms.py     ← a screen's input
│       ├── schemas.py   ← the API's input and output
│       ├── services.py  ← writes and applies the rules
│       ├── selectors.py ← reads
│       ├── queries.py   ← standalone conditions, in large projects
│       └── use_cases.py ← orchestrates, when there are several clients
└── portals/             ← the interface, one folder per audience
    ├── backoffice/      ← the team that manages the orders
    │   ├── __init__.py  ← creates both blueprints
    │   ├── views.py     ← the SSR views, with their route in the decorator
    │   └── api.py       ← the API views, with their route in the decorator
    └── storefront/      ← the shop, for customers
templates/               ← follows the interface, not the domain
└── components/          ← the Jinja macros: atoms, molecules and layouts
```
:::
::::

The tree is the same, and in both the SSR views and the API views live in separate files. Only the
way routes are declared changes: in Django, in `urls.py`; in Flask, in each view's decorator, with
one *blueprint* for the screens and another for the API.

:::note[In Flask, forms are installed separately]

Django ships a closed set: ORM, migrations, forms, CSRF, users, translations and the admin. Flask
ships the routes and the templates; you choose and install the rest, or write it by hand. For forms,
the usual choice is [Flask-WTF](https://flask-wtf.readthedocs.io/), which combines WTForms and CSRF
protection. Doing it by hand with `request.form` also works, but you repeat the type conversion,
the required fields and the error messages in every view. What I install to get the same as Django
is in [Setting up your Flask](flask/flask-dependencias.md).

:::

## 2. Writing and reading, kept apart

Services write and apply the rules; *selectors* read. Keeping them apart avoids the most common
problem: a read that creates rows along the way, and nobody expects it.

::::tabs
:::tab[Django]
```python
# services.py
def create_order(order: Order) -> Order:
    if order.quantity > order.product.stock:
        raise OrderError("Not enough stock")
    order.save()
    return order  # the owner of the operation opens the transaction


# selectors.py
def pending_orders(*, customer_id: int) -> QuerySet[Order]:
    return (
        Order.objects.filter(customer_id=customer_id, status=OrderStatus.PENDING)
        .select_related("product")
        .order_by("-created_at")
    )
```
:::
:::tab[Flask]
```python
# services.py
def create_order(order: Order) -> Order:
    if order.quantity > order.product.stock:
        raise OrderError("Not enough stock")
    db.session.add(order)
    return order  # the owner of the operation opens the transaction


# selectors.py
def pending_orders(*, customer_id: int) -> Sequence[Order]:
    stmt = (
        select(Order)
        .where(Order.customer_id == customer_id, Order.status == OrderStatus.PENDING)
        .options(joinedload(Order.product))
        .order_by(Order.created_at.desc())
    )
    return db.session.scalars(stmt).all()
```
:::
::::

The service receives the unsaved instance and, if something does not add up, raises an exception.
Whoever calls it translates it to their context: a message on screen, a 422 in the API, an error in
a command.

To hesitate less about where something goes, one question: **would anything other than a view call
it?** If a command or a scheduled task would need it, it goes in a service.

## 3. Who validates what

Validating is not one step but three, as at an airport: security checks that your documents are in
order, the desk decides whether you can board **that** flight, and the boarding pass comes out the
same for everyone.

| Step | Where | What it checks |
|---|---|---|
| The input | `forms.py` (screen) or `schemas.py` (API) | The shape: types, required fields, lengths |
| The rules | `services.py` | What depends on state: "a paid order cannot be cancelled" |
| The output | `schemas.py` | What the API promises to return, typed |

A screen's input goes in a form:

::::tabs
:::tab[Django]
```python
# forms.py
class OrderForm(forms.Form):
    product_id = forms.IntegerField()
    quantity = forms.IntegerField(min_value=1, max_value=99)
```
:::
:::tab[Flask]
```python
# forms.py
class OrderForm(FlaskForm):
    product_id = IntegerField(validators=[InputRequired()])
    quantity = IntegerField(validators=[InputRequired(), NumberRange(min=1, max=99)])
```
:::
::::

The API's input, and its output, go in [Pydantic](https://docs.pydantic.dev/) *schemas*, the same in
both frameworks:

```python
# schemas.py
class OrderIn(BaseModel):
    product_id: int
    quantity: int = Field(ge=1, le=99)


class OrderOut(BaseModel):
    id: int
    status: OrderStatus
    total: Decimal
```

The view responds with `OrderOut.model_validate(order, from_attributes=True)` and never with a
hand-built `dict`: if someone adds a field to the model, it does not leak into the API by accident,
and the front end knows exactly what it receives.

The rules, on the other hand, live only once, in the service, because they apply equally to the
screen, the API and a command:

```python
# services.py
def cancel_order(order: Order) -> Order:
    if order.status == OrderStatus.PAID:
        raise OrderError("A paid order cannot be cancelled")
    ...
```

The form and the *schema* say whether the data **makes sense**; the service, whether it **can be
done**.

## 4. What I like, and what it costs

I like it because every change has a single place. If a rule changes, I touch a service; if a
screen is slow, I look at its *selector*. And the tests write themselves: a service is tested
without spinning up any view.

But it has two limitations, and both can be fixed:

| Limitation | How I solve it |
|---|---|
| **More files and more ceremony.** In a small project, three files for one query is overkill | Layers are added when they are needed, not before. A small project starts with services and *selectors*; the rest comes with size |
| **It decays on its own.** One view with a query "just this once" is enough | Something that watches it in CI (in point 7) |

And no junk drawers: no `utils/`, no `helpers.py`. A drawer is a postponed decision, and in a year
nobody knows what is inside. When a file grows, it becomes a folder with the same name:
`services.py` becomes `services/billing.py`, `services/refunds.py`…

## 5. When there are two clients: use cases

This is the piece I add when the project calls for it. In one of my Flask projects, the same
application served the screens as HTML (SSR) and, at the same time, a JSON API for another client:
a separate front end and a mobile app. Every screen had a JSON twin. What each of these is, SSR, SPA
or API, I explain in [SSR, SPA, SSG, PWA and API](../conceptos/ssr-spa-ssg-pwa-api.md).

With the logic in the views, every fix had to be made twice. The solution is one more file,
`use_cases.py`, with one rule: **the use case does not know about the request**. It receives data
that is already clean, orchestrates the operation and returns a result. Each view reads its input,
calls it and translates the result to its own format.

In the restaurant, the use case is the recipe: it does not know whether the order came in at the
counter or by phone.

```python
@dataclass(frozen=True)
class OnCallOutcome:
    ok: bool
    name: str | None = None
    error: str | None = None


def assign_on_call(*, week_start: date, user_id: int, actor_id: int) -> OnCallOutcome:
    """Assigns the week's on-call shift. It does not know who asks: a screen or the API."""
    ...
```

::::tabs
:::tab[Django · SSR]
```python
# views.py
@require_POST
def on_call_submit(request: HttpRequest) -> HttpResponse:
    form = OnCallForm(request.POST)
    if not form.is_valid():
        return render(request, "on_call/board.html", {"form": form}, status=422)
    outcome = assign_on_call(
        week_start=form.cleaned_data["week_start"],
        user_id=form.cleaned_data["user_id"],
        actor_id=request.user.id,
    )
    if outcome.ok:
        messages.success(request, f"On-call shift assigned to {outcome.name}")
    else:
        messages.error(request, outcome.error)
    return redirect("on_call:board")
```
:::
:::tab[Django · API]
```python
# api.py
@require_POST
def on_call_api(request: HttpRequest) -> JsonResponse:
    data = OnCallIn.model_validate_json(request.body)
    outcome = assign_on_call(**data.model_dump(), actor_id=request.user.id)
    if not outcome.ok:
        return JsonResponse({"error": outcome.error}, status=422)
    return JsonResponse({"user_id": data.user_id, "name": outcome.name})
```
:::
:::tab[Flask · SSR]
```python
# views.py
@bp.post("/on-call")
def on_call_submit() -> ResponseReturnValue:
    form = OnCallForm(request.form)
    if not form.validate():
        return render_template("on_call/board.html", form=form), 422
    outcome = assign_on_call(
        week_start=form.week_start.data,
        user_id=form.user_id.data,
        actor_id=current_user.id,
    )
    if outcome.ok:
        flash(f"On-call shift assigned to {outcome.name}", "success")
    else:
        flash(outcome.error, "error")
    return redirect(url_for("on_call.board"))
```
:::
:::tab[Flask · API]
```python
# api.py
@api.post("/on-call")
def on_call_api() -> ResponseReturnValue:
    data = OnCallIn.model_validate_json(request.get_data())
    outcome = assign_on_call(**data.model_dump(), actor_id=current_user.id)
    if not outcome.ok:
        return {"error": outcome.error}, 422
    return {"user_id": data.user_id, "name": outcome.name}
```
:::
::::

The views are thin and different, and they have to be: one redirects with a message and the other
responds with a 422. The rule for who can be on call lives only once. In that project, a change to
who can see what reached the screen and its JSON twin in the same commit, without touching two
places.

:::note[Who commits to the database?]

Whoever owns the whole operation. If the use case combines several services, the commit is its own
and the services do not commit: either everything is saved, or nothing. In Django, the use case
carries `@transaction.atomic`; in Flask, it calls `db.session.commit()` at the end.

:::

If the project has only one client, I do not add this layer: the view calls the service and the
*selector* directly.

## 6. In large projects: reads as atoms and molecules

When the project is large, many reads repeat the same condition: "pending order", "active user".
Copying it into every query is the surest way for two screens to count differently one day. So I
split the reads into two levels, borrowing the idea of Atomic Design:

- **`queries.py` holds the atoms:** standalone conditions that do not query anything.
- **`selectors.py` holds the molecules:** they combine atoms and run the query.

::::tabs
:::tab[Django]
```python
# queries.py
def is_pending() -> Q:
    return Q(status=OrderStatus.PENDING, cancelled_at__isnull=True)


# selectors.py
def pending_orders(*, customer_id: int) -> QuerySet[Order]:
    return Order.objects.filter(queries.is_pending(), customer_id=customer_id).order_by(
        "-created_at"
    )
```
:::
:::tab[Flask]
```python
# queries.py
def is_pending() -> ColumnElement[bool]:
    return and_(Order.status == OrderStatus.PENDING, Order.cancelled_at.is_(None))


# selectors.py
def pending_orders(*, customer_id: int) -> Sequence[Order]:
    stmt = select(Order).where(queries.is_pending(), Order.customer_id == customer_id)
    return db.session.scalars(stmt.order_by(Order.created_at.desc())).all()
```
:::
::::

An atom is only extracted when **two or more** reads use it. If only one uses it, it stays in its
*selector*: extracting it would be ceremony. In a medium-sized project, `selectors.py` is enough.

## 7. The interface and the watchdog

**The UI follows the same idea.** The components, with [Django Cotton](https://django-cotton.com/)
in Django or with Jinja macros in Flask, are split into atoms, molecules and layouts: a button, a
field, a modal, the page. And the colours and typography come from a single tokens file, Tailwind's
`@theme`: no component carries a hand-written colour.

**And something that watches it.** In one of the Flask projects, a custom auditor walks through the
code and counts, layer by layer, what is where it should not be: a `commit()` in a service, a query
in a view, a `redirect` in a use case. It compares the count against a baseline that **can only go
down**, so whoever adds one too many sees the test turn red. If you do not want to write your own,
[import-linter](https://import-linter.readthedocs.io/) does the basics: forbidding one layer from
importing from another.

## In short

| Piece | When I use it |
|---|---|
| Services and *selectors* | Always: writing and reading, kept apart |
| Forms and *schemas* | Always: the shape of the data on the way in; *schemas* also on the API's way out |
| Domain separate from the interface | Always: the domain knows nothing about screens |
| Use cases | When there is more than one client: web and API, Angular or mobile |
| Atoms (`queries.py`) | In large projects, when two or more reads use a condition |
| A watchdog in CI | As soon as more than one person works on it |

The structure is the same in Django and in Flask. What changes is where each framework puts it, not
the idea.

## References

- [Django: database transactions](https://docs.djangoproject.com/en/5.2/topics/db/transactions/)
- [Django: `Q` objects](https://docs.djangoproject.com/en/5.2/topics/db/queries/#complex-lookups-with-q-objects)
- [Pydantic](https://docs.pydantic.dev/)
- [Flask-WTF](https://flask-wtf.readthedocs.io/)
- [Flask: blueprints](https://flask.palletsprojects.com/en/stable/blueprints/)
- [SQLAlchemy: column expressions](https://docs.sqlalchemy.org/en/20/core/sqlelement.html)
- [Django Cotton](https://django-cotton.com/)
- [Tailwind CSS: `@theme`](https://tailwindcss.com/docs/theme)
- [Atomic Design, by Brad Frost](https://atomicdesign.bradfrost.com/)
- [import-linter](https://import-linter.readthedocs.io/)
