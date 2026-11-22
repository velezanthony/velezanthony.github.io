---
seo:
  title: "API REST y SPA vs HTMX y Alpine"
  description: "API REST con SPA frente a monolito Django con htmx y Alpine, aspecto por aspecto: código, despliegue, depuración, estado, validación y errores."
---

# API REST y SPA vs monolito con HTMX y Alpine

Cuando empieza un proyecto web con Django, una de las primeras decisiones es cómo se construye el
frontend. He trabajado con las dos opciones y las dos tienen su sitio. Aquí las comparo aspecto por
aspecto. No busco cuál es mejor: con las dos se puede llegar a lo mismo. Busco **con cuál es más
sencillo** cada cosa.

Un aviso antes de empezar: **el tamaño de la aplicación no decide**. Una aplicación grande puede
ser un monolito y una pequeña puede ser una SPA. Lo que decide es cuánta reactividad necesitas en
el cliente, cómo es tu equipo y cuántos consumidores va a tener el backend.

:::note[Los dos contendientes]

| | API REST y SPA | Monolito con HTMX y Alpine |
|---|---|---|
| **Backend** | Django REST Framework devuelve **JSON** | Django devuelve **HTML** ya renderizado |
| **Frontend** | Una aplicación aparte en Angular o React | Las plantillas de Django |
| **Peticiones al servidor** | El cliente HTTP de la SPA | **htmx**: pide fragmentos de HTML y los coloca en la página |
| **Reactividad en el navegador** | La del framework (Angular, React) | **Alpine.js** |

:::

## Las dos piezas del monolito, en un minuto

Antes de comparar conviene tener claro qué hace cada pieza del monolito, porque no hacen lo mismo.

**htmx no es reactivo.** Cualquier elemento HTML puede hacer una petición (`hx-get`, `hx-post`…) y
sustituir parte de la página con el HTML que devuelve el servidor. Cada cambio es un viaje al
servidor:

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

La vista es una vista de Django normal que renderiza un fragmento:

```python
def search(request):
    products = products_matching(request.GET.get("q", ""))
    return render(request, "catalog/_results.html", {"products": products})
```

**Alpine sí es reactivo.** Es un framework ligero con la idea de Vue o React, pero escrito en el
propio HTML. Todo lo que ocurre solo en el navegador es suyo. Por ejemplo, una línea de pedido que
recalcula el total mientras escribes, sin ir al servidor:

```html
<div x-data="{ price: 12.5, quantity: 1, get total() { return this.price * this.quantity } }">
  <input type="number" min="1" x-model.number="quantity" />
  <p>Total: <span x-text="total.toFixed(2)"></span> €</p>
</div>
```

htmx trae HTML del servidor; Alpine da vida a lo que ya está en la página.

## Aspecto por aspecto

### 1. Cantidad de código

| API REST y SPA | Monolito con HTMX y Alpine |
|---|---|
| Serializadores en el backend; servicios HTTP, modelos y estado en el frontend. Cada campo nuevo se toca en varios sitios | Una vista y una plantilla. Sin serializadores, sin cliente HTTP, sin tipos duplicados en TypeScript |

**Más sencillo con el monolito.**

### 2. Despliegue

| API REST y SPA | Monolito con HTMX y Alpine |
|---|---|
| Dos aplicaciones que se despliegan por separado y deben seguir siendo compatibles | Un único código y un único despliegue |

**Más sencillo con el monolito**, salvo que haya equipos separados que quieran desplegar a su ritmo.

### 3. Depuración

| API REST y SPA | Monolito con HTMX y Alpine |
|---|---|
| Un fallo puede estar en el cliente, en la red o en la API. Hay que mirar las dos aplicaciones | Se sigue de punta a punta en un solo proceso: petición, vista, consulta y plantilla |

**Más sencillo con el monolito.** Es, para mí, su mayor ventaja.

### 4. Estado y reactividad en el navegador

| API REST y SPA | Monolito con HTMX y Alpine |
|---|---|
| Natural: el framework está pensado para ello, incluso para aplicaciones sin conexión | Alpine cubre casi todo (ver la tabla de abajo). Lo complejo se lleva a módulos `.js` aparte |

Lo que da Alpine:

| Necesitas… | Alpine lo da con… |
|---|---|
| Estado reactivo de un componente | `x-data` |
| Enlazar un campo de formulario en los dos sentidos | `x-model` |
| Pintar listas y condiciones | `x-for`, `x-if`, `x-show` |
| Valores calculados | *getters* dentro del componente |
| Reaccionar a cambios | `x-effect`, `$watch` |
| Comunicar componentes | eventos con `$dispatch` |
| Estado global (tema, carrito, usuario) | `Alpine.store` |
| Transiciones | `x-transition` |
| Máscaras de entrada, guardar en `localStorage`, ordenar arrastrando… | plugins oficiales (`mask`, `persist`, `sort`…) |

Cuando la lógica crece, la saco del HTML a un módulo y la registro con `Alpine.data`. La plantilla
solo nombra el componente, y la lógica se puede probar como cualquier JavaScript:

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
:::tab[plantilla.html]
```html
<div x-data="orderLine(12.5)">…</div>
```
:::
::::

Ese `import Alpine from "alpinejs"` necesita un *bundler* (Vite, esbuild) o un *import map* que
diga al navegador de dónde sale `alpinejs`. Sin paso de build, cargas Alpine desde un CDN y
registras los componentes en el evento `alpine:init`, que salta antes de que Alpine recorra la
página. El script de los componentes va antes que el de Alpine:

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
:::tab[plantilla.html]
```html
<div x-data="orderLine(12.5)">…</div>
```
:::
::::

**Depende de cuánta reactividad necesites.** Si es la de formularios, listados y paneles, Alpine
basta. Si la aplicación vive en el cliente (mucho estado, edición en tiempo real, modo sin
conexión), es más sencillo con una SPA.

### 5. Componentes y modelo mental

| API REST y SPA | Monolito con HTMX y Alpine |
|---|---|
| Los componentes son la base del framework. El estado vive en **un solo sitio**: el cliente | Los componentes llegan con librerías externas; la que más me gusta es [Django Cotton](https://django-cotton.com). Pero el estado vive en **dos momentos**: cuando el servidor renderiza y después en el cliente |

Esta es la parte más difícil del monolito. Un componente de Cotton se resuelve en el servidor, en
el momento de generar el HTML: ahí decides qué datos tiene. Pero, una vez en el navegador, parte de
ese componente es reactiva con Alpine y tiene su propio estado. Para trabajar bien tienes que saber
en todo momento qué escribe el servidor, cuándo lo escribe, con qué estado sale y qué estado tiene
después en el cliente.

En una SPA solo piensas en el cliente: el servidor devuelve datos y punto.

**Más sencillo con la SPA.** El estado vive en un solo sitio, y con un equipo grande permite crear y compartir
componentes con libertad.

### 6. Equipo

| API REST y SPA | Monolito con HTMX y Alpine |
|---|---|
| Frontend y backend trabajan en paralelo, cada uno con su código, sus componentes y su ritmo, unidos por el contrato de la API | Todos tocan el mismo código: vistas, plantillas y componentes. Muy ágil con pocas personas; con muchas, se pisan |

**Más sencillo con la SPA si el equipo es grande** y quiere avanzar rápido en los dos frentes a la vez.

### 7. Validación de formularios

| API REST y SPA | Monolito con HTMX y Alpine |
|---|---|
| Duplicada: validas en el cliente para la experiencia de usuario, pero la que cuenta sigue en el servidor | En un solo sitio: el formulario de Django valida y, si hay errores, la vista devuelve el fragmento con los errores, que htmx sustituye |

En cada app reparto el trabajo en tres ficheros:

- **`forms.py`** valida. Es un formulario de Django normal; si hay errores, la vista vuelve a
  renderizar el mismo fragmento con el formulario y sus mensajes, y htmx lo sustituye en la página.
- **`services.py`** escribe. Funciones que reciben datos ya validados y guardan dentro de
  `transaction.atomic()`, para que un fallo a mitad no deje la base de datos a medias.
- **`selectors.py`** lee, con la precarga ya decidida. Lo explico en
  [Consultas N+1 en Django](../python/django/consultas-n-mas-1-django.md).

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
  <button>Guardar</button>
</form>
```
:::
::::

Con errores, la vista responde **422** (*Unprocessable Content*), que dice la verdad sobre la
respuesta. Pero htmx 2 no pinta los 4xx por defecto: hay que decirle que el 422 sí se sustituye,
con una entrada en `htmx.config.responseHandling` o con el evento `htmx:beforeSwap` (los dos están
en el apartado de errores). Si prefieres no tocar la configuración, puedes responder 200 con los
errores: funciona igual, pero el código de estado ya no distingue un envío válido de uno inválido.

**Más sencillo con el monolito.**

### 8. Autenticación y seguridad

| API REST y SPA | Monolito con HTMX y Alpine |
|---|---|
| Tokens o cookies entre dominios, CORS, renovación de sesiones y CSRF si usas cookies | La sesión y la protección CSRF de Django; con htmx solo hay que enviar el token |

Lo del token tiene un matiz: htmx envía los campos del formulario que contiene el elemento, así que
dentro de un `<form>` con `{% csrf_token %}` no hay nada más que hacer. Pero un `hx-post` en un botón
fuera de un formulario no envía ningún token, y Django responde 403. La documentación de htmx
propone enviarlo como cabecera con `hx-headers` en `<body>`, que heredan todas las peticiones. Con
Django, la cabecera que espera es `X-CSRFToken`:

```html
<body hx-headers='{"X-CSRFToken": "{{ csrf_token }}"}'>
```

**Más sencillo de mantener con el monolito.** Una SPA puede ser igual de segura, pero tiene más
piezas que configurar y vigilar: tokens, CORS, cookies entre dominios. En el monolito, Django ya trae
resuelto casi todo.

### 9. Varios consumidores y móvil

| API REST y SPA | Monolito con HTMX y Alpine |
|---|---|
| La misma API sirve a la web, a una app móvil y a integraciones de terceros. Y el frontend se puede llevar al móvil: [React Native](https://reactnative.dev/) con React; con Angular, [NativeScript](https://docs.nativescript.org/), [Ionic con Capacitor](https://capacitorjs.com/) o el reciente [Angular Native](https://ng-native.com) | El HTML solo sirve al navegador: si llega una app móvil, la API hay que construirla |

Con Angular, la opción madura y probada es **Ionic con Capacitor**: tu aplicación Angular se
empaqueta como app de iOS y Android, con acceso a las funciones nativas del dispositivo. Es la que
elegiría hoy.

Angular Native es lo más nuevo: renderiza componentes de Angular como vistas nativas sobre Expo, sin
web view. Pero está en alfa y no es del equipo oficial de Angular, así que de momento lo vigilaría
más que lo usaría en producción.

**Más sencillo con la SPA.** Aunque no son excluyentes: el monolito puede exponer una API más adelante con
Django REST Framework, reutilizando los mismos selectores y servicios.

### 10. Errores: el que me he encontrado con htmx

| API REST y SPA | Monolito con HTMX y Alpine |
|---|---|
| Tampoco enseña nada por defecto: `fetch` no rechaza la promesa con un 4xx o un 5xx (hay que mirar `response.ok`), y un error de `HttpClient` en Angular que nadie gestiona solo llega a la consola. Hay que pensarlo en cada llamada | **htmx no sustituye las respuestas 4xx y 5xx por defecto**: si no haces nada, el error es invisible |

En htmx 2 lo decide `htmx.config.responseHandling`, que por defecto trata los códigos `[45]..` como
errores que no se pintan. Si el servidor devuelve un 500 o un 403, el botón no hace nada y el error
solo aparece en la consola. Lo mínimo es escuchar los eventos de error:

```js
document.body.addEventListener("htmx:responseError", (event) => {
  const status = event.detail.xhr.status;
  showToast(`Algo ha fallado (${status}). Inténtalo de nuevo.`);
});

document.body.addEventListener("htmx:sendError", () => {
  showToast("No se ha podido contactar con el servidor.");
});
```

`htmx:responseError` salta con una respuesta HTTP de error; `htmx:sendError`, cuando la petición ni
siquiera llega. `showToast` es una función propia de la aplicación.

Si quieres que un código concreto sí se pinte, por ejemplo el 422 del formulario con sus errores,
lo más directo es añadirlo a `htmx.config.responseHandling`. La lista se recorre en orden y gana la
primera coincidencia, así que el 422 va antes de la regla de `[45]..` (el resto son los valores por
defecto de htmx 2):

```js
htmx.config.responseHandling = [
  { code: "204", swap: false },
  { code: "[23]..", swap: true },
  { code: "422", swap: true },
  { code: "[45]..", swap: false, error: true },
  { code: "...", swap: false },
];
```

O, sin tocar la configuración, con el evento `htmx:beforeSwap`:

```js
document.body.addEventListener("htmx:beforeSwap", (event) => {
  if (event.detail.xhr.status === 422) {
    event.detail.shouldSwap = true;
    event.detail.isError = false;
  }
});
```

**Empate**: ninguno enseña el error al usuario por defecto. La SPA te obliga a pensarlo en cada
llamada; htmx necesita una configuración global, una sola vez, y si se olvida el fallo es más
silencioso.

## Resumen de la comparación

| Aspecto | Más sencillo con… |
|---|---|
| Cantidad de código | Monolito |
| Despliegue | Monolito |
| Depuración | Monolito |
| Estado y reactividad | Depende: SPA si la aplicación vive en el cliente |
| Componentes y modelo mental | SPA |
| Equipo | SPA si el equipo es grande |
| Validación | Monolito |
| Autenticación y seguridad | Monolito (la misma seguridad es posible con una SPA, pero cuesta más mantenerla) |
| Varios consumidores y móvil | SPA |
| Errores | Empate: la SPA lo pide en cada llamada; htmx, una configuración global |

## Cómo decido

Tres preguntas, por este orden:

| Pregunta | Si la respuesta es sí |
|---|---|
| ¿Habrá más de un consumidor (app móvil, integraciones de terceros)? | API REST, y probablemente SPA |
| ¿Necesitas mucha reactividad en el cliente? | SPA |
| ¿Tienes un equipo grande que quiere trabajar frontend y backend en paralelo? | API REST y SPA |

Si las tres respuestas son no (**la web es el único consumidor, la reactividad es la de
formularios y listados, y el equipo es pequeño**), voy directamente a renderizar en el servidor con
HTMX y Alpine. El ahorro en código, despliegue y depuración es
enorme, y entre htmx en el servidor y Alpine en el navegador se cubre casi todo.

## En resumen

- **El tamaño de la aplicación no decide.** Deciden la reactividad en el cliente, el equipo y los
  consumidores.
- **htmx** trae HTML ya renderizado del servidor. **Alpine** da la reactividad en el navegador y
  cubre casi todo; lo complejo, en componentes `.js` con `Alpine.data`.
- No se trata de cuál es mejor, sino de cuál lo hace más sencillo.
- Con el monolito es más sencillo el código, el despliegue, la depuración, la validación y mantener la
  seguridad.
- Con la SPA es más sencillo el modelo mental (el estado vive en un solo sitio), trabajar con equipos
  grandes y servir a varios consumidores o al móvil.
- Los errores no se ven solos en ninguno de los dos: en la SPA se gestionan en cada llamada; con
  htmx, escucha `htmx:responseError` y `htmx:sendError` desde el primer día o tus errores serán
  invisibles.

## Referencias

- [htmx: documentación (manejo de respuestas)](https://htmx.org/docs/)
- [htmx: referencia de eventos y configuración](https://htmx.org/reference/)
- [Alpine.js: documentación](https://alpinejs.dev/start-here)
- [Alpine.js: `Alpine.data`](https://alpinejs.dev/globals/alpine-data)
- [Alpine.js: `Alpine.store`](https://alpinejs.dev/globals/alpine-store)
- [Django Cotton](https://django-cotton.com)
- [React Native](https://reactnative.dev/)
- [NativeScript](https://docs.nativescript.org/)
- [Capacitor](https://capacitorjs.com/)
- [Angular Native](https://ng-native.com)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Django: formularios](https://docs.djangoproject.com/en/stable/topics/forms/)
- [Django: protección CSRF](https://docs.djangoproject.com/en/stable/ref/csrf/)
- [MDN: CORS](https://developer.mozilla.org/es/docs/Web/HTTP/Guides/CORS)
