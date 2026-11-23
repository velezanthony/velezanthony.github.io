---
seo:
  title: "Alpine.js: el proxy y las librerías"
  description: "Por qué Leaflet o Chart.js van lentos o fallan dentro de Alpine.js: el proxy reactivo y el MutationObserver, medidos con DevTools, y cómo evitarlo."
  schema:
    - '@type': TechArticle
      headline: "Alpine.js y las librerías pesadas: de 1,8 segundos a milisegundos"
      description: "Por qué Leaflet o Chart.js van lentos o fallan dentro de Alpine.js: el proxy reactivo y el MutationObserver, medidos con DevTools, y cómo evitarlo."
      inLanguage: es
      datePublished: '2026-11-23'
      dateModified: '2026-11-23'
      author:
        '@type': Person
        '@id': https://velezanthony.github.io/#anthony
        name: Anthony Velez Tapia
        url: https://velezanthony.github.io/
---

# Alpine.js y las librerías pesadas: de 1,8 segundos a milisegundos

Alpine.js va de maravilla para desplegables, pestañas o modales. El problema llega cuando metes en
su estado el objeto de una librería pesada, como un mapa de Leaflet o un gráfico de Chart.js: según
la librería, va lento o falla.

Me pasó con las dos. Tenía un mapa con unos 1.500 puntos en clusters dentro de un componente de
Alpine, y cada zoom lo dejaba congelado **casi dos segundos**. Al final tardaba **milisegundos**.

Lo cuento paso a paso con un contador que mide siempre lo mismo en una página de pruebas: **cargar
2.000 puntos** y **hacer 20 zooms**.

:::::note[Alpine.js en un minuto]{collapsed}

Alpine es a JavaScript lo que Tailwind es a CSS: escribes el comportamiento en el propio HTML.

- **`x-data`** guarda el estado del componente: los datos que enseña la interfaz.
- **`x-init`** ejecuta código cuando el componente arranca.
- **`Alpine.data`** registra un componente con nombre, dentro de un `<script>`. Si tiene un método
  `init()`, Alpine lo llama solo.

::::tabs
:::tab[En el HTML]
```html
<div x-data="{ open: false }">
  <button @click="open = !open">Filtros</button>
  <div x-show="open">…</div>
</div>
```
:::
:::tab[Con Alpine.data]
```html
<div x-data="filters">
  <button @click="toggle">Filtros</button>
  <div x-show="open">…</div>
</div>

<script>
  document.addEventListener('alpine:init', () => {
    Alpine.data('filters', () => ({
      open: false,
      toggle() {
        this.open = !this.open;
      },
    }));
  });
</script>
```
:::
::::

:::::

## 1. El punto de partida

Lo natural es guardar el mapa en el estado, como cualquier otro dato:

```js
Alpine.data('map', () => ({
  map: null,
  init() {
    this.map = L.map(this.$el).setView([40.4, -3.7], 6);
    for (const point of points) L.marker(point).addTo(this.map);
  },
}));
```

**Contador: cargar 2.503 ms · 20 zooms 535 ms.** Sin Alpine: 33 ms y 49 ms.

El panel **Performance** de Chrome DevTools dice dónde se va el tiempo:

| Dónde se va el tiempo | Mapa en Alpine | Sin Alpine |
|---|---|---|
| Leaflet revisando sus suscripciones a eventos (`_listens`) | 1.331 ms | 11 ms |
| Funciones internas de Alpine (`get`, `createReactiveObject`, `isRef`) | 1.167 ms | — |

La misma función de Leaflet tarda 120 veces más, y Alpine trabaja aunque el HTML no use el mapa.

## 2. Primer culpable: el proxy

Para saber qué repintar, Alpine envuelve el estado en un
[`Proxy`](https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Global_Objects/Proxy):
un recepcionista por el que pasa cada lectura y escritura, y que apunta quién lee qué. Todo lo que
cuelga del estado pasa por él.

Al añadir cada punto, Leaflet repasa la lista de suscripciones del mapa para no repetir ninguna.
Con 2.000 puntos son 2.000 repasos de una lista cada vez más larga, y con el mapa en el estado cada
elemento de la lista pasa por el recepcionista. Por eso el coste se dispara con los puntos: con 500,
15 veces más lento que sin Alpine; con 10.000, 166 veces, más de un minuto congelado.

:::note[¿Es como el DOM virtual de React?]{collapsed}

No. React repinta el componente en memoria y compara. Alpine, gracias a lo que apunta el
recepcionista, toca solo lo que depende del dato cambiado. Usa el mismo motor de reactividad que Vue.

:::

### El arreglo: el mapa, fuera del estado

El mapa no es un dato de la interfaz, así que no necesita recepcionista. Basta con una variable
fuera del objeto que devuelve `Alpine.data`: Alpine solo vigila ese objeto.

::::tabs
:::tab[Antes]
```js
Alpine.data('map', () => ({
  map: null,
  init() {
    this.map = L.map(this.$el).setView([40.4, -3.7], 6);
    for (const point of points) L.marker(point).addTo(this.map);
  },
}));
```
:::
:::tab[Después]
```js
Alpine.data('map', () => {
  let map; // Alpine no la vigila

  return {
    init() {
      map = L.map(this.$el).setView([40.4, -3.7], 6);
      for (const point of points) L.marker(point).addTo(map);
    },
  };
});
```
:::
::::

**Contador: cargar 42 ms · 20 zooms 200 ms.** La carga ya va bien, pero los zooms siguen costando
cuatro veces más que sin Alpine. Queda otra cosa.

:::tip[¿Y `Alpine.raw`?]{collapsed}

`Alpine.raw(this.map)` es igual de rápido, pero hay que usarlo **cada vez** que tocas el mapa. Con
la variable no hay nada que recordar.

:::

## 3. Segundo culpable: el vigilante

Alpine vigila **toda la página** con un
[`MutationObserver`](https://developer.mozilla.org/es/docs/Web/API/MutationObserver), que anota
cada cambio en el HTML. Leaflet pone cada punto como un elemento propio y en cada zoom los recoloca
todos: 2.000 cambios que anotar. Y no se le puede decir que ignore el mapa.

Sí se le puede dar menos trabajo, sin quitar puntos, **dibujándolos de otra forma**: como un póster
con 2.000 puntos impresos en lugar de 2.000 pósits que recolocar.

### El arreglo: un canvas o clusters

**Con un canvas**, todos los puntos se pintan en un único `<canvas>`. Se siguen viendo y pulsando,
pero no hay elementos que mover:

```js
const renderer = L.canvas();

for (const point of points) {
  L.circleMarker(point, { renderer, radius: 4 }).addTo(map);
}
```

**Contador: cargar 13 ms · 20 zooms 29 ms.** Igual que sin Alpine.

Es una optimización de Leaflet, no de Alpine, pero con Alpine se gana mucho más:

| 20 zooms, 2.000 puntos | Como elementos | En canvas |
|---|---|---|
| Sin Alpine | 49 ms | 30 ms |
| Con Alpine (mapa en una variable) | 200 ms | 29 ms |

Ojo: necesita el primer arreglo. Con el mapa aún en el estado, el canvas tarda 606 ms.

**Con clusters**, [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster) junta
los puntos cercanos en burbujas que se abren al acercarte. Mantienes los iconos, que el canvas no
tiene, y en pantalla quedan pocos elementos. Mi mapa necesitaba iconos, así que fue por aquí.

:::note[`preferCanvas` no sirve para esto]{collapsed}

Solo afecta a círculos, polígonos y líneas, no a `L.marker`. Y en Leaflet 2.0, en beta, desaparece:
se usa `renderer: new Canvas()`.

:::

## 4. Cómo quedó mi mapa

Junto al mapa había un listado de tarjetas que resaltaba su punto al pasar el ratón. Como media
página hablaba con el mapa, lo saqué a un módulo aparte:

```js
window.PointsMap = (() => {
  let map;
  let cluster;
  const markersById = {};

  function init(el, points) {
    map = L.map(el).setView([40.4, -3.7], 6);
    cluster = L.markerClusterGroup();
    const markers = points.map((point) => {
      const marker = L.marker([point.lat, point.lng]);
      markersById[point.id] = marker;
      return marker;
    });
    cluster.addLayers(markers); // todos de golpe, no uno a uno
    map.addLayer(cluster);
  }

  function highlight(id) {
    const marker = markersById[id];
    if (marker) cluster.zoomToShowLayer(marker, () => marker.openPopup());
  }

  return { init, highlight };
})();
```

Alpine se quedó con las pestañas y los filtros; las tarjetas solo llaman al módulo:

```html
<article @mouseenter="PointsMap.highlight({{ point.id }})">…</article>
```

:::tip[¿Variable dentro del componente o módulo aparte?]{collapsed}

Para la velocidad da igual. Cambia dónde vive el código:

| | Variable en `Alpine.data` | Módulo aparte |
|---|---|---|
| Arranque y limpieza | Los hace Alpine | Los haces tú, también si htmx sustituye el HTML |
| Quién puede usarlo | Solo el componente | Cualquier parte de la página |

Mapa pequeño en un componente: variable. Mapa con el que habla media página: módulo.

:::

**Un tercer problema, este de Leaflet.** Al principio añadía los puntos al cluster uno a uno con
`addLayer`, y el cluster se recalculaba con cada punto. Con `addLayers`, todos de golpe, se calcula
una vez: con 2.340 puntos, la carga bajó de unos **3,6 segundos a 0,8**.

**Resultado: cada zoom, de 1,8 segundos a milisegundos.** En la página de pruebas, con 1.500 puntos
en clusters, los 20 zooms bajan de 1.332 ms a 137 ms (97 ms sin Alpine). Menos que en el mapa real,
con popups y animaciones, pero en la misma proporción.

## 5. No es solo Leaflet: Chart.js

Con Chart.js el problema aparece de dos formas.

### Un gráfico en el estado se rompe

Si guardas el gráfico en el estado de Alpine, como el mapa, no llega a actualizarse: la primera vez
que cambian los datos, la página lanza el error `Maximum call stack size exceeded`. Da igual que
tenga 1.000 puntos o 20.000.

La causa es el recepcionista otra vez. Chart.js tiene **los suyos propios** para leer sus opciones, y
dentro del estado los de Alpine y los de Chart.js se envuelven entre sí. Alpine intenta llegar al
objeto original quitando envoltorios, pero siempre encuentra otro. En DevTools, la pila del error es
su función `toRaw`, la que quita envoltorios, repetida cientos de veces.

El arreglo es el del mapa: el gráfico en una variable. Con eso funciona y va igual de rápido que sin
Alpine. Para medirlo, redibujé un gráfico de 5.000 puntos 20 veces con datos nuevos (tiempo total,
menos es mejor):

| Dónde está el gráfico | 20 redibujados |
|---|---|
| Sin Alpine | 196 ms |
| Con Alpine, en una variable | 200 ms |
| Con Alpine, en el estado | error |

### Muchos gráficos en tiempo real van a tirones

El segundo caso es un panel con muchos gráficos que se mueven sin parar, como un monitor en tiempo
real: cada gráfico pierde su punto más antiguo y recibe uno nuevo, continuamente.

Aquí lo que importa es la fluidez, que se mide en **fotogramas por segundo**: cuántas veces por
segundo se actualiza la pantalla. 60 se ve fluido; por debajo de 30 se nota a saltos. Con 24
gráficos de 1.000 puntos, durante 5 segundos (más es mejor):

| Dónde están los datos | Fotogramas por segundo |
|---|---|
| Sin Alpine | 26 |
| Con Alpine, en variables | 26 |
| Con Alpine, en el estado | **17** |
| Con Alpine, en el estado y usados directamente por el gráfico | error |

Con los datos fuera del estado, Alpine no cuesta nada. Dentro, el panel pierde un tercio de su
fluidez, porque en cada cambio Alpine hace dos trabajos de más:

- **Recolocar la lista por el recepcionista.** Quitar el primer punto obliga a mover los otros 999 un
  puesto, y cada movimiento pasa por él.
- **Copiar la lista para compararla.** El `$watch` que avisa al gráfico no sabe qué ha cambiado, así
  que convierte los datos enteros a texto en cada cambio.

Y si el gráfico usa directamente la lista del estado, se rompe: Chart.js y Alpine modifican los dos
la forma en que la lista quita y añade puntos, y cada uno llama al del otro sin fin.

Con un panel pequeño (12 gráficos de 500 puntos) apenas se nota: de 60 a 56 fotogramas. Es al crecer
cuando duele.

El arreglo: datos y gráficos en variables, y en Alpine solo la interfaz, como un botón de pausa.

```js
Alpine.data('dashboard', () => {
  const charts = []; // fuera del estado
  const series = []; // fuera del estado

  return {
    paused: false, // esto sí es interfaz
    init() {
      for (const canvas of this.$el.querySelectorAll('canvas')) {
        const data = [];
        series.push(data);
        charts.push(new Chart(canvas, { type: 'line', data: { datasets: [{ data }] } }));
      }
    },
    push(index, value) {
      if (this.paused) return;
      const data = series[index];
      data.shift(); // quita el punto más antiguo
      data.push(value); // añade el nuevo
      charts[index].update('none');
    },
  };
});
```

## 6. Entonces, ¿uso Alpine o no?

Sí. En desplegables, pestañas o formularios ni el recepcionista ni el vigilante se notan. El problema
es darles a vigilar el objeto de una librería, o miles de elementos que cambian a la vez.

| En el estado de Alpine | Fuera, en JavaScript plano |
|---|---|
| Lo que enseña la interfaz: abierto o cerrado, la pestaña activa, el filtro elegido | Objetos de librerías: un mapa, un gráfico, un editor |
| Datos pequeños que cambian con el usuario | Listas grandes o que cambian sin parar |

:::note[Además de lento, frágil]{collapsed}

La documentación de Vue, cuyo motor usa Alpine, desaconseja meter en el estado objetos de librerías
complejas: mezclar el original con su versión envuelta da errores difíciles de seguir, como el de
Chart.js. Con Vue 3 y Leaflet también hay casos reportados al hacer zoom.

:::

## En resumen

| Paso | Cargar 2.000 puntos | 20 zooms |
|---|---|---|
| Mapa en el estado de Alpine | 2.503 ms | 535 ms |
| 1. Mapa fuera del estado (adiós al recepcionista) | 42 ms | 200 ms |
| 2. Puntos en canvas (el vigilante, sin trabajo) | 13 ms | 29 ms |

- **El proxy** hace pasar cada acceso de la librería por un intermediario. Arreglo: el objeto en
  JavaScript plano.
- **El `MutationObserver`** anota cada elemento que se mueve. Arreglo: canvas o clusters.
- **Con Chart.js**, el gráfico en el estado se rompe, y con muchos gráficos en tiempo real los datos
  en el estado cuestan un tercio de los fotogramas.
- **Aparte de Alpine**, añade los puntos al cluster de golpe con `addLayers`.

Alpine para lo que enseña la interfaz; lo que pesa, en JavaScript plano.

## Las cifras completas

Para quien quiera los detalles. Leaflet 1.9.4, Chart.js 4.4.7 y Alpine 3.17.5 en Chrome, con puntos de tipo
`divIcon` y sin el fondo del mapa, para medir solo el código. Cada cifra es la mediana de tres
ejecuciones, en milisegundos.

::::tabs
:::tab[Cargar]
| Puntos | Sin Alpine | Variable | `Alpine.raw` | Estado de Alpine |
|---|---|---|---|---|
| 500 | 12 | 11 | 15 | 178 |
| 1.000 | 19 | 23 | 21 | 636 |
| 2.000 | 33 | 42 | 44 | 2.503 |
| 5.000 | 109 | 134 | 140 | 15.492 |
| 10.000 | 387 | 442 | 454 | 64.274 |
:::
:::tab[20 zooms]
| Puntos | Sin Alpine | Variable | `Alpine.raw` | Estado de Alpine |
|---|---|---|---|---|
| 500 | 15 | 54 | 53 | 133 |
| 1.000 | 27 | 105 | 103 | 264 |
| 2.000 | 49 | 200 | 202 | 535 |
| 5.000 | 119 | 515 | 503 | 1.344 |
| 10.000 | 231 | 1.011 | 1.007 | 2.820 |
:::
:::tab[Con canvas]
| Puntos | Operación | Sin Alpine | Variable | Estado de Alpine |
|---|---|---|---|---|
| 2.000 | Cargar | 13 | 13 | 47 |
| 2.000 | 20 zooms | 30 | 29 | 606 |
| 10.000 | Cargar | 24 | 26 | 179 |
| 10.000 | 20 zooms | 116 | 117 | 3.417 |
:::
:::tab[Con clusters]
| Prueba | Sin Alpine | Variable | Estado de Alpine |
|---|---|---|---|
| 1.500 puntos, 20 zooms | 97 | 137 | 1.332 |
| 2.340 puntos, cargar uno a uno (`addLayer`) | 84 | — | — |
| 2.340 puntos, cargar de golpe (`addLayers`) | 31 | — | — |
:::
:::tab[Chart.js]
Un gráfico redibujado 20 veces con datos nuevos (tiempo total en ms, menos es mejor):

| Puntos | Sin Alpine | Gráfico en una variable | Datos en Alpine, gráfico en una variable | Gráfico en el estado |
|---|---|---|---|---|
| 1.000 | 65 | 63 | 66 | error |
| 5.000 | 196 | 200 | 218 | error |
| 20.000 | 644 | 646 | 719 | error |

Panel en tiempo real durante 5 segundos (fotogramas por segundo, más es mejor):

| Gráficos × puntos | Sin Alpine | Datos en variables | Datos en el estado | Datos en el estado, usados por el gráfico |
|---|---|---|---|---|
| 12 × 500 | 60 | 60 | 56 | error |
| 24 × 1.000 | 26 | 26 | 17 | error |
:::
::::

**Cómo sé que el segundo culpable es el vigilante.** Con el mapa en una variable, DevTools carga el
tiempo de más en las dos funciones de Leaflet que cambian el estilo de los puntos (`setTransform` y
`_updateZIndex`): 227 ms, frente a 45 ms sin Alpine. Para confirmarlo, añadí a la versión sin Alpine
un `MutationObserver` configurado igual que el de Alpine: los 20 zooms con 2.000 puntos pasaron de
52 ms a 207 ms, lo mismo que con Alpine.

## Referencias

- [Alpine.js: reactividad](https://alpinejs.dev/advanced/reactivity)
- [Alpine.js: `x-data`](https://alpinejs.dev/directives/data)
- [Alpine.js: `Alpine.data`](https://alpinejs.dev/globals/alpine-data)
- [Alpine.js: el `MutationObserver` en su código fuente](https://github.com/alpinejs/alpine/blob/main/packages/alpinejs/src/mutation.js)
- [Vue: `markRaw` y los objetos de librerías externas](https://vuejs.org/api/reactivity-advanced.html#markraw)
- [MDN: `Proxy`](https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
- [MDN: `MutationObserver`](https://developer.mozilla.org/es/docs/Web/API/MutationObserver)
- [Leaflet: `Canvas`](https://leafletjs.com/reference.html#canvas)
- [Leaflet: `CircleMarker`](https://leafletjs.com/reference.html#circlemarker)
- [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster)
- [Chart.js: actualizar un gráfico](https://www.chartjs.org/docs/latest/developers/updates.html)
- [Chrome DevTools: analizar el rendimiento](https://developer.chrome.com/docs/devtools/performance)
- [Leaflet y Vue 3: error al hacer zoom con el mapa en estado reactivo](https://gis.stackexchange.com/questions/429698/leaflet-vue-3-issue-uncaught-typeerror-cannot-read-properties-of-null-this-m)
