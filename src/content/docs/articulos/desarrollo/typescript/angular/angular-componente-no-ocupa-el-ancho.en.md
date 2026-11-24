---
slug: articles/development/typescript/angular/angular-component-not-full-width
seo:
  title: "Angular: width 100% not working"
  description: "Why your Angular component ignores width and margin: the host element, :host with display: block, and how it fits into flex and grid layouts."
  image:
    src: /og/articles/development/typescript/angular/angular-component-not-full-width.png
    alt: "Angular: width 100% not working"
  schema:
    - '@type': TechArticle
      headline: "Your Angular component does not fill the width (and it is not your CSS's fault)"
      description: "Why your Angular component ignores width and margin: the host element, :host with display: block, and how it fits into flex and grid layouts."
      image: https://velezanthony.github.io/og/articles/development/typescript/angular/angular-component-not-full-width.png
      inLanguage: en
      datePublished: '2026-11-22'
      dateModified: '2026-11-22'
      author:
        '@type': Person
        '@id': https://velezanthony.github.io/#anthony
        name: Anthony Velez Tapia
        url: https://velezanthony.github.io/
---

# Your Angular component does not fill the width (and it is not your CSS's fault)

You give your component `width: 100%` and it does not stretch. You give it a margin and it does not
add any space. You try more specificity, `!important`… and nothing. The CSS is fine: the problem is
**which element** you are applying it to.

## The symptom

A simple card, just as `ng generate component card` generates it:

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

You use it on a page and want each card to fill the full width and leave some space below:

::::tabs
:::tab[dashboard.html]
```html
<app-card class="full">Orders</app-card>
<app-card class="full">Customers</app-card>
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

The cards stay as wide as their text and stuck to each other.

## What you see in DevTools

You open the browser's developer tools, **Elements** tab:

```html
<app-card class="full">
  <div class="card">Orders</div>
</app-card>
```

There is an `<app-card>` wrapping your template. In the **Computed** panel it has `display: inline`.

## Why it happens

That `<app-card>` is the **host element**: the element that matches the component's selector.
Angular does not replace it with your template; it leaves it in the DOM and renders the template
**inside** it.

The browser does not know the `app-card` tag, so it gives it no styles and it keeps the initial
value of `display`: **`inline`**. And an inline element ignores `width`, `height` and vertical
margins. Your `.full` class was being applied, but to a box that does not respect it.

The same happens with flex and grid: the container's child is the host, not your `div.card`. A
`flex: 1` inside the component does nothing, because it is not on the element the flex layout
distributes.

## The fix: `:host { display: block; }`

In the component's styles, `:host` selects the host element. All you need is to tell it what it is,
in `card.css`:

```css
:host {
  display: block;
}

.card {
  padding: 1rem;
  border: 1px solid #ddd;
}
```

Now `<app-card>` is a block box and the `width` and margin work. If the component sits in a flex
container and you want it to grow, the `flex: 1` also goes on `:host`.

It is so common that the CLI does it for you: `ng generate component card --display-block`.

:::tip[If you use the `hidden` attribute]

With `display: block`, `<app-card hidden>` is still visible, because your rule overrides the
browser's. Add `:host([hidden]) { display: none; }`.

:::

## Two ways to avoid the wrapper

If having an extra box bothers you, there are two ways out:

- **Make the host the card.** If the card uses a global class from your design system (`card`), the
  `host` property puts it on the host itself and the inner `div` is no longer needed:

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

- **An attribute selector on a native element.** With `selector: 'button[appButton]'`, the host is
  the `<button>` itself, which already behaves the way the browser expects. It is the same idea I
  describe in [Directive or component for an input in Angular](angular-directivas-o-componentes.md):
  working on the native element instead of wrapping it.

## What about other frameworks?

Angular is the major framework where this always happens:

| Framework | Does it add a wrapper element? |
|---|---|
| **Angular** | Yes: the host |
| **React** | No. If you return several elements, a Fragment (`<>…</>`) groups them without adding anything |
| **Vue 3** | No. A component can have several root nodes |
| **Astro** | Not in its `.astro` components |
| **Web Components / Lit** | Yes: the component is a custom element, and it is styled with `:host` as in Angular |

## In summary

- Every Angular component has a **host element** that wraps its template.
- The browser does not know it and treats it as **`inline`**: it ignores `width`, `height` and
  vertical margins, and it is the one sitting in the flex or grid layout.
- Fix: **`:host { display: block; }`** in the component, or `--display-block` when generating it.

## References

- [Angular: host elements](https://angular.dev/guide/components/host-elements)
- [Angular: component styling](https://angular.dev/guide/components/styling)
- [Angular: component selectors](https://angular.dev/guide/components/selectors)
- [Angular: `ng generate component`](https://angular.dev/cli/generate/component)
- [MDN: `display`](https://developer.mozilla.org/en-US/docs/Web/CSS/display)
- [MDN: `:host`](https://developer.mozilla.org/en-US/docs/Web/CSS/:host)
- [React: `Fragment`](https://react.dev/reference/react/Fragment)
- [Vue 3: fragments](https://v3-migration.vuejs.org/new/fragments.html)
