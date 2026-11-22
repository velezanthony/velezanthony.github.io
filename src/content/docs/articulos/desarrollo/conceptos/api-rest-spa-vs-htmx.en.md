---
slug: articles/development/concepts/rest-api-spa-vs-htmx
seo:
  title: "REST API and SPA vs htmx and Alpine"
  description: "REST API with a SPA versus a Django monolith with htmx and Alpine, aspect by aspect: code, deployment, debugging, state, validation and errors."
  schema:
    - '@type': TechArticle
      headline: "REST API and SPA vs a monolith with htmx and Alpine"
      description: "REST API with a SPA versus a Django monolith with htmx and Alpine, aspect by aspect: code, deployment, debugging, state, validation and errors."
      inLanguage: en
      datePublished: '2026-11-22'
      dateModified: '2026-11-22'
      author:
        '@type': Person
        '@id': https://velezanthony.github.io/#anthony
        name: Anthony Velez Tapia
        url: https://velezanthony.github.io/
---

# REST API and SPA vs a monolith with htmx and Alpine

When a web project with Django starts, one of the first decisions is how the frontend gets built.
I have worked with both options and both have their place. Here I compare them aspect by aspect.
I am not looking for which one is better: you can get to the same result with either. I am looking
for **which one makes each thing simpler**.

A warning before we start: **the size of the application does not decide**. A large application
can be a monolith and a small one can be a SPA. What decides is how much reactivity you need on the
client, what your team looks like and how many consumers the backend will have.

:::note[The two contenders]

| | REST API and SPA | Monolith with htmx and Alpine |
|---|---|---|
| **Backend** | Django REST Framework returns **JSON** | Django returns already rendered **HTML** |
| **Frontend** | A separate application in Angular or React | Django templates |
| **Requests to the server** | The SPA's HTTP client | **htmx**: requests HTML fragments and places them in the page |
| **Reactivity in the browser** | The framework's own (Angular, React) | **Alpine.js** |

:::

## The two pieces of the monolith, in a minute

Before comparing, it is worth being clear about what each piece of the monolith does, because they
do not do the same thing.

**htmx is not reactive.** Any HTML element can make a request (`hx-get`, `hx-post`…) and replace
part of the page with the HTML the server returns. Every change is a round trip to the server:

```html
<input
  type="search"
  name="q"
  hx-get="{% url 'catalog:search' %}"
  hx-trigger="input changed delay:300ms"
  hx-target="#results"
/>
<div id="results"></div>
```

The view is a normal Django view that renders a fragment:

```python
def search(request):
    products = products_matching(request.GET.get("q", ""))
    return render(request, "catalog/_results.html", {"products": products})
```

**Alpine is reactive.** It is a lightweight framework with the same idea as Vue or React, but
written in the HTML itself. Everything that happens only in the browser belongs to it. For example,
an order line that recalculates the total as you type, without going to the server:

```html
<div x-data="{ price: 12.5, quantity: 1, get total() { return this.price * this.quantity } }">
  <input type="number" min="1" x-model.number="quantity" />
  <p>Total: <span x-text="total.toFixed(2)"></span> €</p>
</div>
```

htmx brings HTML from the server; Alpine brings to life what is already on the page.

## Aspect by aspect

### 1. Amount of code

| REST API and SPA | Monolith with htmx and Alpine |
|---|---|
| Serialisers in the backend; HTTP services, models and state in the frontend. Every new field is touched in several places | One view and one template. No serialisers, no HTTP client, no duplicated types in TypeScript |

**Simpler with the monolith.**

### 2. Deployment

| REST API and SPA | Monolith with htmx and Alpine |
|---|---|
| Two applications that are deployed separately and must stay compatible | A single codebase and a single deployment |

**Simpler with the monolith**, unless there are separate teams that want to deploy at their own
pace.

### 3. Debugging

| REST API and SPA | Monolith with htmx and Alpine |
|---|---|
| A bug can be in the client, the network or the API. You have to look at both applications | You follow it end to end in a single process: request, view, query and template |

**Simpler with the monolith.** For me, it is its biggest advantage.

### 4. State and reactivity in the browser

| REST API and SPA | Monolith with htmx and Alpine |
|---|---|
| Natural: the framework is designed for it, even for offline applications | Alpine covers almost everything (see the table below). Complex logic goes into separate `.js` modules |

What Alpine gives you:

| You need… | Alpine gives it with… |
|---|---|
| Reactive state for a component | `x-data` |
| Two-way binding of a form field | `x-model` |
| Rendering lists and conditions | `x-for`, `x-if`, `x-show` |
| Computed values | *getters* inside the component |
| Reacting to changes | `x-effect`, `$watch` |
| Communication between components | events with `$dispatch` |
| Global state (theme, basket, user) | `Alpine.store` |
| Transitions | `x-transition` |
| Input masks, saving to `localStorage`, drag-to-sort… | official plugins (`mask`, `persist`, `sort`…) |

When the logic grows, I move it out of the HTML into a module and register it with `Alpine.data`.
The template only names the component, and the logic can be tested like any other JavaScript:

::::tabs
:::tab[components/order-line.js]
```js
export default (price) => ({
  price,
  quantity: 1,
  get total() {
    return this.price * this.quantity;
  },
});
```
:::
:::tab[main.js]
```js
import Alpine from "alpinejs";
import orderLine from "./components/order-line.js";

Alpine.data("orderLine", orderLine);
Alpine.start();
```
:::
:::tab[template.html]
```html
<div x-data="orderLine(12.5)">…</div>
```
:::
::::

That `import Alpine from "alpinejs"` needs a *bundler* (Vite, esbuild) or an *import map* that tells
the browser where `alpinejs` comes from. Without a build step, you load Alpine from a CDN and
register the components on the `alpine:init` event, which fires before Alpine walks the page. The
components script goes before the Alpine one:

::::tabs
:::tab[base.html]
```html
<script src="{% static 'js/components.js' %}"></script>
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
```
:::
:::tab[components.js]
```js
document.addEventListener("alpine:init", () => {
  Alpine.data("orderLine", (price) => ({
    price,
    quantity: 1,
    get total() {
      return this.price * this.quantity;
    },
  }));
});
```
:::
:::tab[template.html]
```html
<div x-data="orderLine(12.5)">…</div>
```
:::
::::

**It depends on how much reactivity you need.** If it is the reactivity of forms, listings and
panels, Alpine is enough. If the application lives on the client (lots of state, real-time editing,
offline mode), it is simpler with a SPA.

### 5. Components and mental model

| REST API and SPA | Monolith with htmx and Alpine |
|---|---|
| Components are the foundation of the framework. State lives in **a single place**: the client | Components come from external libraries; the one I like most is [Django Cotton](https://django-cotton.com). But state lives in **two moments**: when the server renders and afterwards on the client |

This is the hardest part of the monolith. A Cotton component is resolved on the server, when the
HTML is generated: that is where you decide what data it has. But, once in the browser, part of
that component is reactive with Alpine and has its own state. To work well you need to know at all
times what the server writes, when it writes it, what state it leaves with and what state it has
afterwards on the client.

In a SPA you only think about the client: the server returns data and that is it.

**Simpler with the SPA.** State lives in a single place, and with a large team it lets you create
and share components freely.

### 6. Team

| REST API and SPA | Monolith with htmx and Alpine |
|---|---|
| Frontend and backend work in parallel, each with its own code, components and pace, joined by the API contract | Everyone touches the same code: views, templates and components. Very agile with few people; with many, they tread on each other's toes |

**Simpler with the SPA if the team is large** and wants to move fast on both fronts at once.

### 7. Form validation

| REST API and SPA | Monolith with htmx and Alpine |
|---|---|
| Duplicated: you validate on the client for the user experience, but the validation that counts is still on the server | In a single place: the Django form validates and, if there are errors, the view returns the fragment with the errors, which htmx swaps in |

In each app I split the work into three files:

- **`forms.py`** validates. It is a normal Django form; if there are errors, the view re-renders the
  same fragment with the form and its messages, and htmx swaps it into the page.
- **`services.py`** writes. Functions that receive already validated data and save inside
  `transaction.atomic()`, so that a failure halfway through does not leave the database half done.
- **`selectors.py`** reads, with the prefetching already decided. I explain it in
  [N+1 queries in Django](../python/django/consultas-n-mas-1-django.md).

::::tabs
:::tab[sales/forms.py]
```python
class ProductForm(forms.Form):
    name = forms.CharField(max_length=200)
```
:::
:::tab[sales/services.py]
```python
def create_product(*, seller: Seller, name: str) -> Product:
    with transaction.atomic():
        product = Product.objects.create(seller=seller, name=name)
        # ...any other write that must succeed or fail together
    return product
```
:::
:::tab[sales/views.py]
```python
def new_product(request, seller_id):
    seller = get_object_or_404(Seller, pk=seller_id)
    form = ProductForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        create_product(seller=seller, name=form.cleaned_data["name"])
        return render(request, "sales/_product_created.html")
    status = 422 if form.errors else 200
    return render(request, "sales/_product_form.html", {"form": form, "seller": seller}, status=status)
```
:::
:::tab[sales/_product_form.html]
```html
<form hx-post="{% url 'sales:new_product' seller.pk %}" hx-swap="outerHTML">
  {% csrf_token %}
  {{ form }}
  <button>Save</button>
</form>
```
:::
::::

With errors, the view responds **422** (*Unprocessable Content*), which tells the truth about the
response. But htmx 2 does not render 4xx responses by default: you have to tell it that 422 should
be swapped, with an entry in `htmx.config.responseHandling` or with the `htmx:beforeSwap` event
(both are in the errors section). If you would rather not touch the configuration, you can respond
200 with the errors: it works the same, but the status code no longer distinguishes a valid
submission from an invalid one.

**Simpler with the monolith.**

### 8. Authentication and security

| REST API and SPA | Monolith with htmx and Alpine |
|---|---|
| Tokens or cross-domain cookies, CORS, session renewal and CSRF if you use cookies | Django's session and CSRF protection; with htmx you only need to send the token |

The token has a catch: htmx sends the fields of the form that contains the element, so inside a
`<form>` with `{% csrf_token %}` there is nothing else to do. But an `hx-post` on a button outside a
form sends no token, and Django responds 403. The htmx documentation suggests sending it as a header
with `hx-headers` on `<body>`, which every request inherits. With Django, the header it expects is
`X-CSRFToken`:

```html
<body hx-headers='{"X-CSRFToken": "{{ csrf_token }}"}'>
```

**Simpler to maintain with the monolith.** A SPA can be just as secure, but it has more pieces to
configure and watch: tokens, CORS, cross-domain cookies. In the monolith, Django already has almost
everything solved.

### 9. Multiple consumers and mobile

| REST API and SPA | Monolith with htmx and Alpine |
|---|---|
| The same API serves the web, a mobile app and third-party integrations. And the frontend can be taken to mobile: [React Native](https://reactnative.dev/) with React; with Angular, [NativeScript](https://docs.nativescript.org/), [Ionic with Capacitor](https://capacitorjs.com/) or the recent [Angular Native](https://ng-native.com) | The HTML only serves the browser: if a mobile app arrives, the API has to be built |

With Angular, the mature and proven option is **Ionic with Capacitor**: your Angular application is
packaged as an iOS and Android app, with access to the device's native features. It is the one I
would choose today.

Angular Native is the newest: it renders Angular components as native views on top of Expo, with
no web view. But it is in alpha and does not come from the official Angular team, so for now I
would keep an eye on it rather than use it in production.

**Simpler with the SPA.** Although they are not mutually exclusive: the monolith can expose an API
later on with Django REST Framework, reusing the same selectors and services.

### 10. Errors: the one I ran into with htmx

| REST API and SPA | Monolith with htmx and Alpine |
|---|---|
| It does not show anything by default either: `fetch` does not reject the promise on a 4xx or a 5xx (you have to check `response.ok`), and an Angular `HttpClient` error that nobody handles only reaches the console. You have to think about it in every call | **htmx does not swap 4xx and 5xx responses by default**: if you do nothing, the error is invisible |

In htmx 2 this is decided by `htmx.config.responseHandling`, which by default treats `[45]..` codes
as errors that are not rendered. If the server returns a 500 or a 403, the button does nothing and
the error only appears in the console. The minimum is to listen to the error events:

```js
document.body.addEventListener("htmx:responseError", (event) => {
  const status = event.detail.xhr.status;
  showToast(`Something went wrong (${status}). Please try again.`);
});

document.body.addEventListener("htmx:sendError", () => {
  showToast("Could not reach the server.");
});
```

`htmx:responseError` fires with an HTTP error response; `htmx:sendError`, when the request does not
even arrive. `showToast` is the application's own function.

If you want a specific code to be rendered, for example the form's 422 with its errors, the most
direct way is to add it to `htmx.config.responseHandling`. The list is walked in order and the first
match wins, so 422 goes before the `[45]..` rule (the rest are the htmx 2 defaults):

```js
htmx.config.responseHandling = [
  { code: "204", swap: false },
  { code: "[23]..", swap: true },
  { code: "422", swap: true },
  { code: "[45]..", swap: false, error: true },
  { code: "...", swap: false },
];
```

Or, without touching the configuration, with the `htmx:beforeSwap` event:

```js
document.body.addEventListener("htmx:beforeSwap", (event) => {
  if (event.detail.xhr.status === 422) {
    event.detail.shouldSwap = true;
    event.detail.isError = false;
  }
});
```

**A draw**: neither shows the error to the user by default. The SPA forces you to think about it in
every call; htmx needs a global configuration, just once, and if you forget it the failure is more
silent.

## Comparison summary

| Aspect | Simpler with… |
|---|---|
| Amount of code | Monolith |
| Deployment | Monolith |
| Debugging | Monolith |
| State and reactivity | It depends: SPA if the application lives on the client |
| Components and mental model | SPA |
| Team | SPA if the team is large |
| Validation | Monolith |
| Authentication and security | Monolith (the same security is possible with a SPA, but it costs more to maintain) |
| Multiple consumers and mobile | SPA |
| Errors | A draw: the SPA asks for it in every call; htmx, one global configuration |

## How I decide

Three questions, in this order:

| Question | If the answer is yes |
|---|---|
| Will there be more than one consumer (mobile app, third-party integrations)? | REST API, and probably a SPA |
| Do you need a lot of reactivity on the client? | SPA |
| Do you have a large team that wants to work on frontend and backend in parallel? | REST API and SPA |

If all three answers are no (**the web is the only consumer, the reactivity is that of forms and
listings, and the team is small**), I go straight to server-side rendering with htmx and Alpine.
The savings in code, deployment and debugging are huge, and between htmx on the server and Alpine
in the browser almost everything is covered.

## In summary

- **The size of the application does not decide.** Reactivity on the client, the team and the
  consumers decide.
- **htmx** brings already rendered HTML from the server. **Alpine** provides reactivity in the
  browser and covers almost everything; complex logic goes into `.js` components with
  `Alpine.data`.
- It is not about which one is better, but which one makes it simpler.
- With the monolith, code, deployment, debugging, validation and keeping things secure are simpler.
- With the SPA, the mental model (state lives in a single place), working with large teams and
  serving multiple consumers or mobile are simpler.
- Errors do not show up on their own in either: in the SPA you handle them in every call; with
  htmx, listen to `htmx:responseError` and `htmx:sendError` from day one or your errors will be
  invisible.

## References

- [htmx: documentation (response handling)](https://htmx.org/docs/)
- [htmx: events and configuration reference](https://htmx.org/reference/)
- [Alpine.js: documentation](https://alpinejs.dev/start-here)
- [Alpine.js: `Alpine.data`](https://alpinejs.dev/globals/alpine-data)
- [Alpine.js: `Alpine.store`](https://alpinejs.dev/globals/alpine-store)
- [Django Cotton](https://django-cotton.com)
- [React Native](https://reactnative.dev/)
- [NativeScript](https://docs.nativescript.org/)
- [Capacitor](https://capacitorjs.com/)
- [Angular Native](https://ng-native.com)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Django: forms](https://docs.djangoproject.com/en/stable/topics/forms/)
- [Django: CSRF protection](https://docs.djangoproject.com/en/stable/ref/csrf/)
- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)
