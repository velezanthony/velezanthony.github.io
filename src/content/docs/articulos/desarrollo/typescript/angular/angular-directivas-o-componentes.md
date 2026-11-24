---
seo:
  title: "Directiva o componente en Angular"
  description: "Por qué en Angular con Reactive Forms prefiero una directiva sobre el input nativo a envolverlo en un componente con ControlValueAccessor, y cuándo no."
  image:
    src: /og/articulos/desarrollo/typescript/angular/angular-directivas-o-componentes.png
    alt: "Directiva o componente en Angular"
  schema:
    - '@type': TechArticle
      headline: "Directiva o componente para un input en Angular"
      description: "Por qué en Angular con Reactive Forms prefiero una directiva sobre el input nativo a envolverlo en un componente con ControlValueAccessor, y cuándo no."
      image: https://velezanthony.github.io/og/articulos/desarrollo/typescript/angular/angular-directivas-o-componentes.png
      inLanguage: es
      datePublished: '2026-11-21'
      dateModified: '2026-11-22'
      author:
        '@type': Person
        '@id': https://velezanthony.github.io/#anthony
        name: Anthony Velez Tapia
        url: https://velezanthony.github.io/
---

# Directiva o componente para un input en Angular

Cuando un campo de formulario necesita algo más que escribir y leer, la tentación es crear un
componente: `<app-reference-input>` y dentro el `<input>`. Yo, siempre que puedo, dejo el `<input>`
nativo tal cual y le añado una **directiva**. `ControlValueAccessor`, solo cuando es justo y
necesario. Trabajo así desde las primeras versiones de Reactive Forms; solo ha cambiado la sintaxis.

## El problema

Un formulario de pedido tiene un campo **referencia**. Los usuarios la escriben como quieren
(`  ab-1234 `, `AB-1234`…) y queremos dos cosas:

1. Al salir del campo, **normalizarla**: sin espacios a los lados y en mayúsculas.
2. Si está vacía y el usuario ya la ha tocado, **marcarla en rojo**.

El formulario de partida:

::::tabs
:::tab[order-form.ts]
```ts
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-order-form',
  imports: [ReactiveFormsModule],
  templateUrl: './order-form.html',
  styleUrl: './order-form.css',
})
export class OrderForm {
  readonly form = new FormGroup({
    reference: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
}
```
:::
:::tab[order-form.html]
```html
<form [formGroup]="form">
  <input formControlName="reference" />
</form>
```
:::
:::tab[order-form.css]
```css
.is-invalid {
  border-color: crimson;
}
```
:::
::::

Ese `<input formControlName="reference">` ya funciona sin que escribas nada. ¿Por qué? Porque entre
el `FormControl` y el elemento hay un puente, el **`ControlValueAccessor`**, y Angular ya trae uno
para cada elemento nativo: `DefaultValueAccessor` para el texto y `<textarea>`, y otros para
`number`, `checkbox`, `radio`, `range`, `<select>` y `<select multiple>`.

Esa es la clave de todo el artículo: **mientras trabajes sobre el elemento nativo, el puente ya
está hecho.**

## Solución 1: una directiva sobre el input nativo

Una directiva añade comportamiento a un elemento que ya existe, sin plantilla propia. Esta pide el
`NgControl` del mismo `<input>` (la directiva `formControlName`) y, a través de él, llega al
`FormControl`:

```ts
// normalize.directive.ts
import { Directive, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: 'input[appNormalize]',
  host: {
    '(blur)': 'normalize()',
    '[class.is-invalid]': 'ngControl.invalid && ngControl.touched',
    '[attr.aria-invalid]': 'ngControl.invalid && ngControl.touched',
  },
})
export class NormalizeDirective {
  protected readonly ngControl = inject(NgControl, { self: true });

  protected normalize(): void {
    const control = this.ngControl.control;
    if (!control || typeof control.value !== 'string') {
      return;
    }
    const normalized = control.value.trim().toUpperCase();
    if (normalized !== control.value) {
      control.setValue(normalized);
    }
  }
}
```

En el formulario solo importas `NormalizeDirective` en `order-form.ts` y añades el atributo:

```html
<!-- order-form.html -->
<form [formGroup]="form">
  <input formControlName="reference" appNormalize />
</form>
```

Y ya está. El `DefaultValueAccessor` sigue leyendo y escribiendo el valor, y `placeholder`,
`maxlength` o `aria-*` se escriben en el `<input>` como siempre.

Uso la propiedad `host` en lugar de `@HostListener` y `@HostBinding` porque es lo que recomienda la
documentación de Angular; con la sintaxis antigua, la idea es la misma.

## Solución 2: un componente que envuelve el input

Ahora lo mismo con un componente. El `formControlName` pasa a estar sobre `<app-reference-input>`,
que no es un elemento nativo, así que **el puente se rompe**: tienes que construirlo tú,
implementando los cuatro métodos de `ControlValueAccessor` y registrándolo con `NG_VALUE_ACCESSOR`.

::::tabs
:::tab[reference-input.ts]
```ts
import { Component, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-reference-input',
  templateUrl: './reference-input.html',
  styleUrl: './reference-input.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ReferenceInput),
      multi: true,
    },
  ],
})
export class ReferenceInput implements ControlValueAccessor {
  protected readonly value = signal('');
  protected readonly disabled = signal(false);

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  // The form writes a value into the control
  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  // The form hands over the callback to report changes
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  // ...and the one to report that the field was touched
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected onInput(raw: string): void {
    this.value.set(raw);
    this.onChange(raw);
  }

  protected onBlur(): void {
    const normalized = this.value().trim().toUpperCase();
    if (normalized !== this.value()) {
      this.value.set(normalized);
      this.onChange(normalized);
    }
    this.onTouched();
  }
}
```
:::
:::tab[reference-input.html]
```html
<input
  [value]="value()"
  [disabled]="disabled()"
  (input)="onInput($any($event.target).value)"
  (blur)="onBlur()"
/>
```
:::
:::tab[reference-input.css]
```css
:host {
  display: block;
}
```
:::
::::

Funciona, pero mira lo que ha costado:

- **Más código para lo mismo.** Cuatro métodos, dos callbacks y un proveedor con `forwardRef` solo
  para que el formulario vuelva a hacer lo que el input nativo ya hacía.
- **Aún no marca el error.** Para eso el componente necesita el `NgControl`, pero inyectarlo
  mientras se registra como `NG_VALUE_ACCESSOR` crea una dependencia circular: cada uno necesita al
  otro para crearse. La salida, la que propone la guía de Angular Material, es quitar el proveedor
  y asignar `ngControl.valueAccessor = this` a mano.
- **Los atributos se quedan fuera.** `placeholder` o `maxlength` se ponen en
  `<app-reference-input>`, no en el `<input>`, y hay que reenviarlos uno a uno.
- **Un elemento más en el DOM.** `<app-reference-input>` es el *host* del componente, inline por
  defecto; por eso necesita ese `:host { display: block; }`. Lo explico en
  [Tu componente de Angular no ocupa el ancho](angular-componente-no-ocupa-el-ancho.md).

## Cuándo el componente sí compensa

Cuando no hay un input nativo que decorar, porque el control tiene **plantilla y lógica propias**:
un select con buscador, un selector de fechas o un teléfono con prefijo y número. Ahí el componente
existe de todas formas y los cuatro métodos son una parte pequeña de su código.

## Cómo decido

| Necesitas… | Usa… |
|---|---|
| Formatear, normalizar o limitar lo que se escribe | Directiva sobre el input nativo |
| Estilos de error o `aria-*` según el estado del control | Directiva que inyecta `NgControl` |
| Un control con plantilla propia (lista, calendario, varios elementos) | Componente con `ControlValueAccessor` |

Mi regla: **si es un elemento nativo sin mucha lógica, directiva; si tiene plantilla propia y lógica
de peso, componente.** Con la directiva es más sencillo escribir, usar y mantener; con el
componente es más sencillo encapsular un control complejo.

:::tip[¿Y Signal Forms?]

Angular tiene también **Signal Forms**, estables desde la versión 22, con otro modelo de
integración (`[formField]` y `FormValueControl` en lugar de `ControlValueAccessor`). Este artículo
trata de Reactive Forms.

:::

## En resumen

- Los elementos nativos ya hablan con Reactive Forms: Angular trae su `ControlValueAccessor`.
- Una **directiva** sobre el input nativo añade comportamiento sin tocar ese puente.
- Un **componente** que envuelve el input rompe el puente y te obliga a reconstruirlo. Compensa solo
  cuando el control tiene plantilla y lógica propias.

## Referencias

- [Angular: Reactive forms](https://angular.dev/guide/forms/reactive-forms)
- [Angular: `ControlValueAccessor`](https://angular.dev/api/forms/ControlValueAccessor)
- [Angular: `NG_VALUE_ACCESSOR`](https://angular.dev/api/forms/NG_VALUE_ACCESSOR)
- [Angular: `DefaultValueAccessor`](https://angular.dev/api/forms/DefaultValueAccessor)
- [Angular: `NgControl`](https://angular.dev/api/forms/NgControl)
- [Angular: directivas de atributo](https://angular.dev/guide/directives/attribute-directives)
- [Angular: elementos host](https://angular.dev/guide/components/host-elements)
- [Angular Material: crear un control de formulario propio (dependencia circular)](https://material.angular.dev/guide/creating-a-custom-form-field-control)
- [Angular: Signal Forms](https://angular.dev/guide/forms/signals/overview)
