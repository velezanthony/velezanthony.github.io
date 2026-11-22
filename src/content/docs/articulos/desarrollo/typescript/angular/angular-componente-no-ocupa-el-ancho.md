---
seo:
  title: "Angular: width 100% no funciona"
  description: "Por qué tu componente de Angular ignora width y margin: el elemento host, :host con display: block y cómo encaja en flex/grid."
  schema:
    - '@type': TechArticle
      headline: "Tu componente de Angular no ocupa el ancho (y no es culpa de tu CSS)"
      description: "Por qué tu componente de Angular ignora width y margin: el elemento host, :host con display: block y cómo encaja en flex/grid."
      inLanguage: es
      datePublished: '2026-11-21'
      dateModified: '2026-11-22'
      author:
        '@type': Person
        '@id': https://velezanthony.github.io/#anthony
        name: Anthony Velez Tapia
        url: https://velezanthony.github.io/
---

# Tu componente de Angular no ocupa el ancho (y no es culpa de tu CSS)

Le pones `width: 100%` a tu componente y no se estira. Le pones un margen y no separa. Pruebas con
más especificidad, con `!important`… y nada. El CSS está bien: el problema es **a qué elemento** se
lo estás aplicando.

## El síntoma

Una tarjeta sencilla, tal como la genera `ng generate component card`:

::::tabs
:::tab[card.ts]
```ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-card',
  templateUrl: './card.html',
  styleUrl: './card.css',
})
export class Card {}
```
:::
:::tab[card.html]
```html
<div class="card">
  <ng-content />
</div>
```
:::
:::tab[card.css]
```css
.card {
  padding: 1rem;
  border: 1px solid #ddd;
}
```
:::
::::

La usas en una página y quieres que cada tarjeta ocupe todo el ancho y deje aire debajo:

::::tabs
:::tab[dashboard.html]
```html
<app-card class="full">Pedidos</app-card>
<app-card class="full">Clientes</app-card>
```
:::
:::tab[dashboard.css]
```css
.full {
  width: 100%;
  margin-bottom: 1.5rem;
}
```
:::
::::

Las tarjetas se quedan del ancho de su texto y pegadas una a otra.

## Lo que ves en DevTools

Abres las herramientas del navegador, pestaña **Elements**:

```html
<app-card class="full">
  <div class="card">Pedidos</div>
</app-card>
```

Hay un `<app-card>` envolviendo tu plantilla. En el panel **Computed** tiene `display: inline`.

## Por qué pasa

Ese `<app-card>` es el **elemento host**: el elemento que coincide con el selector del componente.
Angular no lo sustituye por tu plantilla; lo deja en el DOM y pinta la plantilla **dentro**.

El navegador no conoce la etiqueta `app-card`, así que no le da ningún estilo y se queda con el valor
inicial de `display`: **`inline`**. Y un elemento en línea ignora `width`, `height` y los márgenes
verticales. Tu clase `.full` se aplicaba, pero a una caja que no la respeta.

Lo mismo pasa con flex y grid: el hijo del contenedor es el host, no tu `div.card`. Un `flex: 1`
dentro del componente no hace nada, porque no está en el elemento que el flex reparte.

## El arreglo: `:host { display: block; }`

En los estilos del componente, `:host` selecciona el elemento host. Basta con decirle qué es, en
`card.css`:

```css
:host {
  display: block;
}

.card {
  padding: 1rem;
  border: 1px solid #ddd;
}
```

Ahora `<app-card>` es una caja de bloque y el `width` y el margen funcionan. Si el componente va en
un flex y quieres que crezca, el `flex: 1` también va en `:host`.

Es tan habitual que el CLI lo hace por ti: `ng generate component card --display-block`.

:::tip[Si usas el atributo `hidden`]

Con `display: block`, `<app-card hidden>` se sigue viendo, porque tu regla pisa la del navegador.
Añade `:host([hidden]) { display: none; }`.

:::

## Dos formas de evitar el envoltorio

Si te molesta tener una caja de más, hay dos salidas:

- **Que el host sea la tarjeta.** Si la tarjeta usa una clase global de tu sistema de diseño
  (`card`), la propiedad `host` se la pone al propio host y el `div` interior sobra:

::::tabs
:::tab[card.ts]
```ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-card',
  templateUrl: './card.html',
  styleUrl: './card.css',
  host: { class: 'card' },
})
export class Card {}
```
:::
:::tab[card.html]
```html
<ng-content />
```
:::
:::tab[card.css]
```css
:host {
  display: block;
}
```
:::
::::

- **Un selector de atributo sobre un elemento nativo.** Con `selector: 'button[appButton]'`, el
  host es el propio `<button>`, que ya se comporta como el navegador espera. Es la misma idea que
  cuento en [Directiva o componente para un input en Angular](angular-directivas-o-componentes.md):
  trabajar sobre el elemento nativo en lugar de envolverlo.

## ¿Y en otros frameworks?

Angular es el gran framework donde esto pasa siempre:

| Framework | ¿Añade un elemento envoltorio? |
|---|---|
| **Angular** | Sí: el host |
| **React** | No. Si devuelves varios elementos, un Fragment (`<>…</>`) los agrupa sin añadir nada |
| **Vue 3** | No. Un componente puede tener varios nodos raíz |
| **Astro** | No en sus componentes `.astro` |
| **Web Components / Lit** | Sí: el componente es un elemento personalizado, y se estiliza con `:host` como en Angular |

## En resumen

- Cada componente de Angular tiene un **elemento host** que envuelve su plantilla.
- El navegador no lo conoce y lo trata como **`inline`**: ignora `width`, `height` y los márgenes
  verticales, y es él quien está en el flex o el grid.
- Arreglo: **`:host { display: block; }`** en el componente, o `--display-block` al generarlo.

## Referencias

- [Angular: elementos host](https://angular.dev/guide/components/host-elements)
- [Angular: estilos de componentes](https://angular.dev/guide/components/styling)
- [Angular: selectores de componentes](https://angular.dev/guide/components/selectors)
- [Angular: `ng generate component`](https://angular.dev/cli/generate/component)
- [MDN: `display`](https://developer.mozilla.org/es/docs/Web/CSS/display)
- [MDN: `:host`](https://developer.mozilla.org/es/docs/Web/CSS/:host)
- [React: `Fragment`](https://react.dev/reference/react/Fragment)
- [Vue 3: fragments](https://v3-migration.vuejs.org/new/fragments.html)
