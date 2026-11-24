---
slug: articles/development/javascript/alpine-js-proxy-libraries
seo:
  title: "Alpine.js: the proxy and libraries"
  description: "Why Leaflet or Chart.js get slow or break inside Alpine.js: the reactive proxy and the MutationObserver, measured with DevTools, and how to avoid it."
  image:
    src: /og/articles/development/javascript/alpine-js-proxy-libraries.png
    alt: "Alpine.js: the proxy and libraries"
  schema:
    - '@type': TechArticle
      headline: "Alpine.js and heavy libraries: from 1.8 seconds to milliseconds"
      description: "Why Leaflet or Chart.js get slow or break inside Alpine.js: the reactive proxy and the MutationObserver, measured with DevTools, and how to avoid it."
      image: https://velezanthony.github.io/og/articles/development/javascript/alpine-js-proxy-libraries.png
      inLanguage: en
      datePublished: '2026-11-23'
      dateModified: '2026-11-23'
      author:
        '@type': Person
        '@id': https://velezanthony.github.io/#anthony
        name: Anthony Velez Tapia
        url: https://velezanthony.github.io/
---

# Alpine.js and heavy libraries: from 1.8 seconds to milliseconds

Alpine.js is great for dropdowns, tabs or modals. The trouble starts when you put the object of a
heavy library in its state, such as a Leaflet map or a Chart.js chart: depending on the library, it
gets slow or it breaks.

It happened to me with both. I had a map with about 1,500 clustered points inside an Alpine
component, and every zoom froze it for **almost two seconds**. In the end it took **milliseconds**.

I tell it step by step, with a counter that always measures the same thing on a test page: **loading
2,000 points** and **doing 20 zooms**.

:::::note[Alpine.js in one minute]{collapsed}

Alpine is to JavaScript what Tailwind is to CSS: you write the behaviour in the HTML itself.

- **`x-data`** holds the component's state: the data the interface shows.
- **`x-init`** runs code when the component starts.
- **`Alpine.data`** registers a named component inside a `<script>`. If it has an `init()` method,
  Alpine calls it for you.

::::tabs
:::tab[In the HTML]
```html
<div x-data="{ open: false }">
  <button @click="open = !open">Filters</button>
  <div x-show="open">…</div>
</div>
```
:::
:::tab[With Alpine.data]
```html
<div x-data="filters">
  <button @click="toggle">Filters</button>
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

## 1. The starting point

The natural thing is to keep the map in the state, like any other piece of data:

```js
Alpine.data('map', () => ({
  map: null,
  init() {
    this.map = L.map(this.$el).setView([40.4, -3.7], 6);
    for (const point of points) L.marker(point).addTo(this.map);
  },
}));
```

**Counter: load 2,503 ms · 20 zooms 535 ms.** Without Alpine: 33 ms and 49 ms.

The **Performance** panel in Chrome DevTools shows where the time goes:

| Where the time goes | Map in Alpine | Without Alpine |
|---|---|---|
| Leaflet checking its event subscriptions (`_listens`) | 1,331 ms | 11 ms |
| Alpine internals (`get`, `createReactiveObject`, `isRef`) | 1,167 ms | — |

The same Leaflet function takes 120 times longer, and Alpine keeps working even though the HTML
never uses the map.

## 2. First culprit: the proxy

To know what to repaint, Alpine wraps the state in a
[`Proxy`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy):
a receptionist that every read and write goes through, and that notes down who reads what.
Everything hanging from the state goes through it.

When adding each point, Leaflet goes through the map's list of subscriptions so it does not repeat
any. With 2,000 points that is 2,000 passes over an ever-longer list, and with the map in the state,
every item on the list goes through the receptionist. That is why the cost shoots up with the number
of points: with 500, 15 times slower than without Alpine; with 10,000, 166 times, over a minute
frozen.

:::note[Is it like React's virtual DOM?]{collapsed}

No. React repaints the component in memory and compares. Alpine, thanks to what the receptionist
noted down, only touches what depends on the changed data. It uses the same reactivity engine as Vue.

:::

### The fix: the map, out of the state

The map is not interface data, so it does not need a receptionist. A variable outside the object
that `Alpine.data` returns is enough: Alpine only watches that object.

::::tabs
:::tab[Before]
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
:::tab[After]
```js
Alpine.data('map', () => {
  let map; // Alpine does not watch it

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

**Counter: load 42 ms · 20 zooms 200 ms.** Loading is fine now, but zooms still cost four times
more than without Alpine. Something else is left.

:::tip[What about `Alpine.raw`?]{collapsed}

`Alpine.raw(this.map)` is just as fast, but you have to use it **every time** you touch the map. With
the variable there is nothing to remember.

:::

## 3. Second culprit: the watchman

Alpine watches **the whole page** with a
[`MutationObserver`](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver), which
notes down every change to the HTML. Leaflet adds each point as its own element and moves them all
on every zoom: 2,000 changes to note down. And you cannot tell it to ignore the map.

You can give it less work, without removing any point, by **drawing the points differently**: like
a poster with 2,000 printed dots instead of 2,000 sticky notes to move around.

### The fix: a canvas or clusters

**With a canvas**, all the points are painted on a single `<canvas>`. You can still see and click
them, but there are no elements to move:

```js
const renderer = L.canvas();

for (const point of points) {
  L.circleMarker(point, { renderer, radius: 4 }).addTo(map);
}
```

**Counter: load 13 ms · 20 zooms 29 ms.** Same as without Alpine.

It is a Leaflet optimisation, not an Alpine one, but with Alpine you gain much more:

| 20 zooms, 2,000 points | As elements | On a canvas |
|---|---|---|
| Without Alpine | 49 ms | 30 ms |
| With Alpine (map in a variable) | 200 ms | 29 ms |

Careful: it needs the first fix. With the map still in the state, the canvas takes 606 ms.

**With clusters**, [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster) groups
nearby points into bubbles that open as you zoom in. You keep the icons, which the canvas lacks, and
only a few elements are left on screen. My map needed icons, so that was the way.

:::note[`preferCanvas` does not help here]{collapsed}

It only affects circles, polygons and lines, not `L.marker`. And in Leaflet 2.0, in beta, it goes
away: you use `renderer: new Canvas()`.

:::

## 4. How my map ended up

Next to the map there was a list of cards that highlighted their point on hover. Since half the page
talked to the map, I moved it to a separate module:

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
    cluster.addLayers(markers); // all at once, not one by one
    map.addLayer(cluster);
  }

  function highlight(id) {
    const marker = markersById[id];
    if (marker) cluster.zoomToShowLayer(marker, () => marker.openPopup());
  }

  return { init, highlight };
})();
```

Alpine kept the tabs and the filters; the cards only call the module:

```html
<article @mouseenter="PointsMap.highlight({{ point.id }})">…</article>
```

:::tip[A variable in the component or a separate module?]{collapsed}

For speed it makes no difference. What changes is where the code lives:

| | Variable in `Alpine.data` | Separate module |
|---|---|---|
| Start-up and clean-up | Alpine does them | You do them, also when htmx swaps the HTML |
| Who can use it | Only the component | Any part of the page |

A small map in a component: a variable. A map half the page talks to: a module.

:::

**A third problem, this one from Leaflet.** At first I added the points to the cluster one by one
with `addLayer`, and the cluster recalculated itself with every point. With `addLayers`, all at once,
it is calculated once: with 2,340 points, loading went down from about **3.6 seconds to 0.8**.

**Result: every zoom went from 1.8 seconds to milliseconds.** On the test page, with 1,500 clustered
points, the 20 zooms drop from 1,332 ms to 137 ms (97 ms without Alpine). Less than in the real map,
which had popups and animations, but in the same proportion.

## 5. It is not just Leaflet: Chart.js

With Chart.js the problem shows up in two ways.

### A chart in the state breaks

If you keep the chart in Alpine's state, like the map, it never gets to update: the first time the
data changes, the page throws `Maximum call stack size exceeded`. It does not matter whether it has
1,000 points or 20,000.

The receptionist is to blame again. Chart.js has **receptionists of its own** to read its options,
and inside the state Alpine's and Chart.js's end up wrapped in each other. Alpine tries to reach the
original object by removing wrappers, but it always finds another one. In DevTools, the error's stack
is its `toRaw` function, the one that removes wrappers, repeated hundreds of times.

The fix is the same as for the map: the chart in a variable. With that it works and is as fast as
without Alpine. To measure it, I redrew a 5,000-point chart 20 times with new data (total time,
lower is better):

| Where the chart lives | 20 redraws |
|---|---|
| Without Alpine | 196 ms |
| With Alpine, in a variable | 200 ms |
| With Alpine, in the state | error |

### Many real-time charts stutter

The second case is a dashboard with many charts that never stop moving, like a real-time monitor:
each chart drops its oldest point and gets a new one, continuously.

What matters here is smoothness, measured in **frames per second**: how many times per second the
screen updates. 60 looks smooth; below 30 you notice the jumps. With 24 charts of 1,000 points, for
5 seconds (higher is better):

| Where the data lives | Frames per second |
|---|---|
| Without Alpine | 26 |
| With Alpine, in variables | 26 |
| With Alpine, in the state | **17** |
| With Alpine, in the state and used directly by the chart | error |

With the data out of the state, Alpine costs nothing. Inside, the dashboard loses a third of its
smoothness, because on every change Alpine does two extra jobs:

- **Moving the list through the receptionist.** Removing the first point means shifting the other
  999 one place, and every move goes through it.
- **Copying the list to compare it.** The `$watch` that tells the chart to redraw does not know what
  changed, so it turns the whole data into text on every change.

And if the chart uses the state's list directly, it breaks: Chart.js and Alpine both change the way
the list removes and adds points, and each one calls the other's, endlessly.

With a small dashboard (12 charts of 500 points) you barely notice: from 60 to 56 frames. It hurts as
it grows.

The fix: data and charts in variables, and only the interface in Alpine, such as a pause button.

```js
Alpine.data('dashboard', () => {
  const charts = []; // out of the state
  const series = []; // out of the state

  return {
    paused: false, // this one is interface
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
      data.shift(); // drops the oldest point
      data.push(value); // adds the new one
      charts[index].update('none');
    },
  };
});
```

## 6. So, should I use Alpine or not?

Yes. In dropdowns, tabs or forms neither the receptionist nor the watchman are noticeable. The
problem is handing them a library's object to watch, or thousands of elements changing at once.

| In Alpine's state | Outside, in plain JavaScript |
|---|---|
| What the interface shows: open or closed, the active tab, the chosen filter | Library objects: a map, a chart, an editor |
| Small data that changes with the user | Large lists, or lists that never stop changing |

:::note[Not only slow, but fragile]{collapsed}

The Vue documentation, whose engine Alpine uses, advises against putting objects from complex
libraries in reactive state: mixing the original with its wrapped version leads to errors that are
hard to follow, like the Chart.js one. With Vue 3 and Leaflet there are also reported cases when
zooming.

:::

## Summary

| Step | Load 2,000 points | 20 zooms |
|---|---|---|
| Map in Alpine's state | 2,503 ms | 535 ms |
| 1. Map out of the state (goodbye, receptionist) | 42 ms | 200 ms |
| 2. Points on a canvas (the watchman, out of work) | 13 ms | 29 ms |

- **The proxy** sends every access the library makes through a middleman. Fix: the object in plain
  JavaScript.
- **The `MutationObserver`** notes down every element that moves. Fix: a canvas or clusters.
- **With Chart.js**, a chart in the state breaks, and with many real-time charts, data in the state
  costs a third of the frames.
- **Apart from Alpine**, add the points to the cluster all at once with `addLayers`.

Alpine for what the interface shows; whatever is heavy, in plain JavaScript.

## The full figures

For those who want the details. Leaflet 1.9.4, Chart.js 4.4.7 and Alpine 3.17.5 in Chrome, with
`divIcon` points and no map background, to measure only the code. Each figure is the median of three
runs, in milliseconds.

::::tabs
:::tab[Load]
| Points | Without Alpine | Variable | `Alpine.raw` | Alpine state |
|---|---|---|---|---|
| 500 | 12 | 11 | 15 | 178 |
| 1,000 | 19 | 23 | 21 | 636 |
| 2,000 | 33 | 42 | 44 | 2,503 |
| 5,000 | 109 | 134 | 140 | 15,492 |
| 10,000 | 387 | 442 | 454 | 64,274 |
:::
:::tab[20 zooms]
| Points | Without Alpine | Variable | `Alpine.raw` | Alpine state |
|---|---|---|---|---|
| 500 | 15 | 54 | 53 | 133 |
| 1,000 | 27 | 105 | 103 | 264 |
| 2,000 | 49 | 200 | 202 | 535 |
| 5,000 | 119 | 515 | 503 | 1,344 |
| 10,000 | 231 | 1,011 | 1,007 | 2,820 |
:::
:::tab[With canvas]
| Points | Operation | Without Alpine | Variable | Alpine state |
|---|---|---|---|---|
| 2,000 | Load | 13 | 13 | 47 |
| 2,000 | 20 zooms | 30 | 29 | 606 |
| 10,000 | Load | 24 | 26 | 179 |
| 10,000 | 20 zooms | 116 | 117 | 3,417 |
:::
:::tab[With clusters]
| Test | Without Alpine | Variable | Alpine state |
|---|---|---|---|
| 1,500 points, 20 zooms | 97 | 137 | 1,332 |
| 2,340 points, loaded one by one (`addLayer`) | 84 | — | — |
| 2,340 points, loaded all at once (`addLayers`) | 31 | — | — |
:::
:::tab[Chart.js]
A chart redrawn 20 times with new data (total time in ms, lower is better):

| Points | Without Alpine | Chart in a variable | Data in Alpine, chart in a variable | Chart in the state |
|---|---|---|---|---|
| 1,000 | 65 | 63 | 66 | error |
| 5,000 | 196 | 200 | 218 | error |
| 20,000 | 644 | 646 | 719 | error |

Real-time dashboard for 5 seconds (frames per second, higher is better):

| Charts × points | Without Alpine | Data in variables | Data in the state | Data in the state, used by the chart |
|---|---|---|---|---|
| 12 × 500 | 60 | 60 | 56 | error |
| 24 × 1,000 | 26 | 26 | 17 | error |
:::
::::

**How I know the second culprit is the watchman.** With the map in a variable, DevTools puts the
extra time in the two Leaflet functions that change the points' style (`setTransform` and
`_updateZIndex`): 227 ms, against 45 ms without Alpine. To confirm it, I added to the version without
Alpine a `MutationObserver` configured like Alpine's: the 20 zooms with 2,000 points went from 52 ms
to 207 ms, the same as with Alpine.

## References

- [Alpine.js: reactivity](https://alpinejs.dev/advanced/reactivity)
- [Alpine.js: `x-data`](https://alpinejs.dev/directives/data)
- [Alpine.js: `Alpine.data`](https://alpinejs.dev/globals/alpine-data)
- [Alpine.js: the `MutationObserver` in its source code](https://github.com/alpinejs/alpine/blob/main/packages/alpinejs/src/mutation.js)
- [Vue: `markRaw` and objects from external libraries](https://vuejs.org/api/reactivity-advanced.html#markraw)
- [MDN: `Proxy`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
- [MDN: `MutationObserver`](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)
- [Leaflet: `Canvas`](https://leafletjs.com/reference.html#canvas)
- [Leaflet: `CircleMarker`](https://leafletjs.com/reference.html#circlemarker)
- [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster)
- [Chart.js: updating charts](https://www.chartjs.org/docs/latest/developers/updates.html)
- [Chrome DevTools: analyze runtime performance](https://developer.chrome.com/docs/devtools/performance)
- [Leaflet and Vue 3: zoom error with the map in reactive state](https://gis.stackexchange.com/questions/429698/leaflet-vue-3-issue-uncaught-typeerror-cannot-read-properties-of-null-this-m)
