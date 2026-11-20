---
seo:
  title: "Angular: width 100% no funciona"
  description: "Por qué tu componente de Angular ignora width y margin: el elemento host, :host con display: block y cómo encaja en flex/grid."
---

# Tu componente de Angular no ocupa el ancho (y no es culpa de tu CSS)

Cuando empiezas con Angular, hay un contenedor que nadie te presenta. Está en todas las páginas,
envuelve cada componente que escribes y tiene sus propias reglas de CSS. Como no sabes que existe,
la interfaz «no hace lo que le dices»: pones un ancho y no se aplica, pones un margen y no separa,
pones `flex: 1` y no crece.

Aquí lo cuento como me gustaría que me lo hubieran contado: desde el síntoma, mirando el DOM y
arreglándolo de la forma más sencilla a la más avanzada.

:::note[Lo que necesitas]

- Lo básico de los **componentes de Angular** y de **CSS** (bloque, en línea, flex y grid).
- **Cualquier versión de Angular.** Los ejemplos usan la sintaxis actual (componentes standalone,
  signals y la propiedad `host`), pero la idea es la misma con la sintaxis antigua:
  `@HostBinding` en lugar de `host`.

:::

## 1. El síntoma: una tarjeta que no obedece

Tienes un componente tarjeta. Su plantilla y sus estilos son lo que esperarías:

```ts
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-card',
  template: `
    <div class="card">
      <h3>{{ title() }}</h3>
      <ng-content />
    </div>
  `,
  styles: `
    .card {
      padding: 1rem;
      border: 1px solid #ddd;
      border-radius: 0.5rem;
    }
  `,
})
export class Card {
  readonly title = input.required<string>();
}
```

Y lo usas en una barra lateral, dándole un ancho y separación desde el padre:

```html
<aside>
  <app-card class="sidebar-card" title="Pedidos">…</app-card>
  <app-card class="sidebar-card" title="Clientes">…</app-card>
</aside>
```

```css
.sidebar-card {
  width: 18rem;
  margin-bottom: 1.5rem;
}
```

El ancho no se aplica y las tarjetas no se separan. Pruebas con `!important`, con más
especificidad, con `ViewEncapsulation.None`… y nada.

Segundo intento, en una barra de herramientas con flex. Quieres que el buscador ocupe todo el hueco
libre, así que dentro del componente pones:

```css
/* search.css, inside the component */
.search {
  flex: 1;
}
```

Y tampoco crece. El CSS está bien escrito. El problema es **a qué elemento** se lo estás aplicando.

## 2. Mirar: abrir DevTools

No hay que leer el CSS: hay que **mirar el DOM**. Abres las herramientas del navegador, pestaña
**Elements** (o **Inspector**), y ves esto:

```html
<aside>
  <app-card class="sidebar-card" title="Pedidos">
    <div class="card">
      <h3>Pedidos</h3>
      …
    </div>
  </app-card>
  …
</aside>
```

Hay un `<app-card>` que tú nunca escribiste como HTML: envuelve tu plantilla. Si lo seleccionas y
miras el panel **Computed**, verás `display: inline`.

## 3. Entender: el elemento host

Ese `<app-card>` es el **elemento host** del componente. La documentación de Angular lo define así:
el elemento del DOM que coincide con el selector del componente. Angular no lo sustituye por tu
plantilla: lo deja en el DOM y pinta la plantilla **dentro**.

¿Y por qué es `inline`? Porque el navegador no conoce la etiqueta `app-card`. No tiene ningún
estilo por defecto para ella, así que se queda con el valor inicial de `display` en CSS, que es
`inline`. Un `<div>` es bloque porque el navegador trae esa regla; tu componente no trae ninguna.

Con eso se explica todo lo de antes:

- **`width` y `height` no se aplican** a un elemento en línea, ni los márgenes de arriba y abajo
  lo separan del resto. Por eso `.sidebar-card` no hacía nada.
- **El hijo del flex o del grid es el host, no tu `div`.** En la barra de herramientas, el elemento
  que el contenedor flex reparte es `<app-search>`. Ponerle `flex: 1` a `.search`, que está un
  nivel más abajo, no tiene efecto.
- **Los selectores del padre tampoco llegan.** Una regla como `.grid > .card` no coincide, porque
  el hijo directo de `.grid` es `<app-card>`.

## 4. Arreglos, del más sencillo al más avanzado

### `:host { display: block; }`

Lo más sencillo: decirle al navegador qué es el host. En los estilos del componente, `:host`
selecciona el elemento host:

```css
/* card.css */
:host {
  display: block;
}
```

Con esto `<app-card>` es una caja de bloque: `width`, `height` y los márgenes que le ponga el padre
funcionan. Si el componente va dentro de un flex y quieres que crezca, el `flex: 1` también va en
`:host`, no en el `div` interior. Y si es un flex en sí mismo, `:host { display: flex; }`.

Es tan habitual que el propio CLI tiene una opción para ello: `ng generate component card
--display-block` añade esa regla al crear el componente.

:::warning[El atributo `hidden`]

`hidden` oculta un elemento gracias a una regla del navegador que pone `display: none`. Cualquier
`display` que escribas tú la sustituye, así que con `:host { display: block; }` un
`<app-card hidden>` se sigue viendo. Si usas `hidden` sobre tus componentes, añade:

```css
:host([hidden]) {
  display: none;
}
```

:::

### Clases en el host con la propiedad `host`

A veces no quieres escribir CSS en `:host`, sino aplicar al host clases que ya existen (de tu
sistema de diseño, o de una librería). Para eso está la propiedad `host` del decorador:

```ts
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-card',
  host: {
    class: 'card',
    '[class.is-selected]': 'selected()',
  },
  template: `
    <h3>{{ title() }}</h3>
    <ng-content />
  `,
})
export class Card {
  readonly title = input.required<string>();
  readonly selected = input(false);
}
```

Fíjate en que el `div.card` ha desaparecido: el host **es** la tarjeta. Un elemento menos en el
DOM y nada que coordinar entre el envoltorio y lo de dentro.

Antes esto se escribía con `@HostBinding('class.is-selected')`. La documentación de Angular pide
preferir siempre la propiedad `host`: los decoradores `@HostBinding` y `@HostListener` existen solo
por compatibilidad.

### Componentes con selector de atributo

Si el componente es, en el fondo, un elemento nativo con algo más (un botón, un enlace, una
celda), no hace falta un host nuevo. Un selector de atributo convierte el elemento nativo en el
host:

```ts
import { Component, input } from '@angular/core';

@Component({
  selector: 'button[appButton]',
  host: {
    class: 'btn',
    '[class.btn-primary]': "variant() === 'primary'",
  },
  template: `<ng-content />`,
})
export class Button {
  readonly variant = input<'primary' | 'secondary'>('secondary');
}
```

```html
<button appButton variant="primary" type="submit">Guardar</button>
```

No aparece ningún `<app-button>`: el host es el propio `<button>`, que ya es lo que el navegador
espera. `type`, `disabled` o `aria-label` se escriben como siempre, sin reenviarlos. La
documentación de Angular recomienda este enfoque precisamente para componentes sobre elementos
nativos. Es la misma filosofía que cuento en
[Directiva o componente para un input en Angular](angular-directivas-o-componentes.md): trabajar
sobre el elemento nativo en lugar de envolverlo.

El aviso de la documentación: si olvidas importar el componente, Angular no da error por un
atributo desconocido. Simplemente verás un botón sin estilos.

### `display: contents` en el host

Hay casos en los que quieres que el host no exista para la maquetación: que los hijos de tu
plantilla sean directamente los hijos del grid del padre.

```css
:host {
  display: contents;
}
```

Con `display: contents`, el host no genera caja propia y sus hijos se colocan como si estuvieran
en su lugar. Tiene dos precios:

- **El host deja de ser una caja.** No le puedes dar ancho, márgenes, borde ni fondo: no hay nada
  a lo que aplicárselos.
- **Accesibilidad.** MDN avisa de que algunos navegadores quitan del árbol de accesibilidad el
  elemento con `display: contents` (sus hijos se quedan), algo que la especificación considera
  incorrecto. Si el host lleva un `role` o atributos `aria-*`, no uses esta opción, y si la usas,
  compruébala con un lector de pantalla.

Lo reservo para componentes que solo agrupan, sin semántica propia.

### `ng-container` cuando no necesitas un componente

Por último, a veces el componente sobraba. Si solo querías reutilizar un trozo de plantilla dentro
de un grid o de una lista, `<ng-container>` agrupa sin añadir ningún elemento al DOM:

```html
<ng-template #row let-label="label" let-value="value">
  <dt>{{ label }}</dt>
  <dd>{{ value }}</dd>
</ng-template>

<dl class="specs">
  <ng-container *ngTemplateOutlet="row; context: { label: 'Peso', value: weight() }" />
  <ng-container *ngTemplateOutlet="row; context: { label: 'Alto', value: height() }" />
</dl>
```

Cada `<dt>` y cada `<dd>` queda como hijo directo de `<dl class="specs">`, que es lo que necesita
su grid. Un componente `<app-spec-row>` metería su host en medio. (Recuerda importar
`NgTemplateOutlet` en el componente que tenga esta plantilla.)

## ¿Y en otros frameworks?

Angular es el principal framework mainstream en el que esto pasa siempre. En el resto, depende:

| Framework | ¿Añade un elemento envoltorio? |
|---|---|
| **Angular** | Sí, siempre: el host (salvo con selectores de atributo, donde el host es el elemento nativo). |
| **React** | No. Un componente devuelve sus elementos; si son varios, un Fragment (`<>…</>`) los agrupa sin añadir nada al DOM. |
| **Vue 3** | No. Un componente puede tener varios nodos raíz. En Vue 2 tenía que tener uno solo, y a menudo era un `<div>` extra. |
| **Astro** | Sus componentes `.astro` no. Las islas de otros frameworks que se hidratan en el cliente van dentro de un `<astro-island>`, que Astro marca con `display: contents`. |
| **Web Components / Lit** | Sí: el componente es un elemento personalizado, y ese elemento es su host. Se estiliza con `:host`, igual que en Angular. |

Si vienes de React o de Vue, el host es justo lo que no esperas. Si vienes de Web Components, es
lo que ya conocías.

## En resumen

- Cada componente de Angular tiene un **elemento host**: el que coincide con su selector. Se queda
  en el DOM y envuelve tu plantilla.
- El navegador no conoce esa etiqueta, así que es **`display: inline`**: ignora `width`, `height`
  y los márgenes verticales, y es él, no tu `div`, el hijo del flex o del grid.
- Lo más sencillo: **`:host { display: block; }`** (o `--display-block` al generarlo), con
  `:host([hidden])` si usas `hidden`.
- Para clases en el host, la propiedad **`host`**. Para envolver un elemento nativo, un
  **selector de atributo**. Para que el host no cuente en la maquetación, **`display: contents`**,
  con cuidado. Y si no necesitabas un componente, **`ng-container`**.

## Referencias

- [Angular: elementos host](https://angular.dev/guide/components/host-elements)
- [Angular: estilos de componentes](https://angular.dev/guide/components/styling)
- [Angular: selectores de componentes](https://angular.dev/guide/components/selectors)
- [Angular: `ng generate component`](https://angular.dev/cli/generate/component)
- [Angular: `ng-container`](https://angular.dev/api/core/ng-container)
- [MDN: `display`](https://developer.mozilla.org/es/docs/Web/CSS/display)
- [MDN: atributo `hidden`](https://developer.mozilla.org/es/docs/Web/HTML/Global_attributes/hidden)
- [MDN: `:host`](https://developer.mozilla.org/es/docs/Web/CSS/:host)
- [React: `Fragment`](https://react.dev/reference/react/Fragment)
- [Vue 3: fragments](https://v3-migration.vuejs.org/new/fragments.html)
- [Astro: islas](https://docs.astro.build/es/concepts/islands/)
- [Lit: estilos y `:host`](https://lit.dev/docs/components/styles/)
