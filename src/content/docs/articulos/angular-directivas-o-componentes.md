---
seo:
  title: "Directiva o componente en Angular"
  description: "Por qué en Angular con Reactive Forms prefiero una directiva sobre el input nativo a envolverlo en un componente con ControlValueAccessor, y cuándo no."
---

# Directiva o componente para un input en Angular

Cuando un campo de formulario necesita algo más que escribir y leer, la primera tentación en
Angular es crear un componente: `<app-reference-input>` y dentro el `<input>`. Yo, siempre que
puedo, hago otra cosa: dejo el `<input>` nativo tal cual y le añado una **directiva** con el
comportamiento extra. Y reservo `ControlValueAccessor` para cuando es justo y necesario.

No es una moda reciente: trabajo así desde las primeras versiones de **Reactive Forms**. Las
directivas, `NgControl` y los accesores de valor existen desde entonces; lo único que ha cambiado
es la sintaxis con la que se escriben.

Aquí cuento por qué, con el mismo problema resuelto de las dos formas, y cuándo sí merece la pena
el componente.

:::note[Lo que necesitas]

- Lo básico de **Reactive Forms**: `FormGroup`, `FormControl` y `formControlName`.
- **Cualquier versión de Angular con Reactive Forms.** Los ejemplos usan la sintaxis actual
  (directivas standalone, `inject()`, la propiedad `host` y signals; hoy la versión activa es la
  22), pero la idea es la misma con la sintaxis antigua: inyección por el constructor y
  `@HostListener`.

:::

## El problema: un código de referencia

Un formulario de pedido tiene un campo **referencia**. Los usuarios la escriben como quieren:
`  ab-1234 `, `AB-1234`, `ab-1234  `. Queremos dos cosas:

1. Al salir del campo, el valor se **normaliza**: sin espacios a los lados y en mayúsculas.
2. Si el campo es obligatorio y está vacío, se **marca en rojo** cuando el usuario ya lo ha tocado.

El formulario es el mismo en las dos soluciones:

```ts
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-order-form',
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <input formControlName="reference" />
    </form>
  `,
})
export class OrderForm {
  readonly form = new FormGroup({
    reference: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
}
```

## Dos conceptos antes de empezar

**Una directiva** añade comportamiento a un elemento que ya existe. No tiene plantilla propia: se
engancha a su elemento (el *host*), escucha sus eventos y cambia sus clases o atributos.

**Un componente** es una directiva con plantilla. Crea su propio trozo de DOM y lo pinta donde lo
pongas.

La diferencia que importa aquí es cómo habla cada uno con el formulario. Para eso existe el
**`ControlValueAccessor`**: el puente entre un `FormControl` y un elemento del DOM. Es una interfaz
con cuatro métodos:

| Método | Para qué |
|---|---|
| `writeValue(obj)` | El formulario escribe un valor en el elemento. |
| `registerOnChange(fn)` | El formulario te da la función a la que avisar cuando el usuario cambia el valor. |
| `registerOnTouched(fn)` | Lo mismo, para avisar de que el campo se ha tocado (normalmente en `blur`). |
| `setDisabledState(isDisabled)` | Opcional. El formulario activa o desactiva el elemento. |

Lo importante: **los elementos nativos ya tienen el suyo**. Angular trae `DefaultValueAccessor` para
`<input>` de texto y `<textarea>`, y accesores para `number`, `checkbox`, `radio`, `range` y
`<select>`. Por eso `<input formControlName="reference">` funciona sin que escribas nada.

## Solución 1: una directiva sobre el input nativo

La directiva se pone sobre el `<input>` de siempre. Pide el `NgControl` del mismo elemento (la
directiva `formControlName`) y, a través de él, llega al `FormControl`:

```ts
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

En la plantilla del formulario solo cambian dos cosas: importar `NormalizeDirective` y añadir el
atributo.

```html
<form [formGroup]="form">
  <input formControlName="reference" appNormalize />
</form>
```

Fíjate en lo que **no** he tenido que hacer:

- Nada de `ControlValueAccessor`. El `DefaultValueAccessor` sigue leyendo y escribiendo el valor.
- `control.setValue()` actualiza el modelo y el propio accesor lo pinta en el input.
- `disabled`, `placeholder`, `maxlength`, `autocomplete` o `aria-*` se escriben en el `<input>` como
  siempre. No hay que reenviarlos.

He usado la propiedad `host` en lugar de `@HostListener` y `@HostBinding`. La documentación de
Angular lo dice claro: hay que preferir `host`, porque los decoradores existen solo por
compatibilidad.

## Solución 2: un componente que envuelve el input

Ahora lo mismo con un componente. En cuanto el `<input>` vive dentro de otra plantilla, el
`formControlName` se pone sobre `<app-reference-input>`, que no es un elemento nativo. El
formulario ya no sabe cómo leerlo ni escribirlo: hay que implementar el `ControlValueAccessor` a
mano y registrarlo con el proveedor `NG_VALUE_ACCESSOR`.

```ts
import { Component, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-reference-input',
  template: `
    <input
      [value]="value()"
      [disabled]="disabled()"
      (input)="onInput($any($event.target).value)"
      (blur)="onBlur()"
    />
  `,
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

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

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

```html
<form [formGroup]="form">
  <app-reference-input formControlName="reference" />
</form>
```

Funciona, pero mira el precio:

- **Más código para lo mismo.** Cuatro métodos, dos callbacks y un proveedor con `forwardRef` y
  `multi: true` solo para que el formulario vuelva a hacer lo que el input nativo ya hacía.
- **Aún no marca el error.** Para saber si el control es inválido, el componente necesita el
  `NgControl`. Inyectarlo mientras se registra como `NG_VALUE_ACCESSOR` provoca una dependencia
  circular, y el patrón habitual es quitar el proveedor y asignar `ngControl.valueAccessor = this`
  a mano. Otra cosa más que saber.
- **Los atributos se quedan fuera.** `placeholder`, `maxlength` o `aria-describedby` se ponen en
  `<app-reference-input>`, no en el `<input>`. Cada uno que quieras hay que declararlo como
  `input()` y reenviarlo.
- **Un elemento más en el DOM.** `<app-reference-input>` es el *host* del componente: una etiqueta
  que el navegador no conoce y trata como `inline`. Si el campo no ocupa el ancho que esperas o no
  se coloca bien en un flex, es por él. Lo explico en
  [Tu componente de Angular no ocupa el ancho](angular-componente-no-ocupa-el-ancho.md). Con la
  directiva sobre el `<input>` nativo, ese elemento no existe.

Es fricción para quien crea el componente y para quien lo usa, y es peso que vive en el componente
cuando una directiva habría bastado.

## Cuándo el componente sí es la opción

El `ControlValueAccessor` compensa cuando el control tiene **plantilla y lógica propias** que no
caben en un elemento nativo. Por ejemplo:

- Un **select con buscador**: un campo de texto, una lista filtrada, navegación con teclado y el
  valor real (un `id`) distinto de lo que se ve (un nombre).
- Un **selector de fechas** con su calendario.
- Un **control compuesto**: un teléfono con prefijo y número, dos elementos que el formulario ve
  como un solo valor.

En esos casos no hay un input nativo que decorar. El componente tiene que existir de todas formas,
y los cuatro métodos son una parte pequeña de su código. Ahí sí lo implemento.

## Cómo decido

| Necesitas… | Usa… |
|---|---|
| Formatear, normalizar o limitar lo que se escribe en un input | Directiva sobre el input nativo |
| Estilos de error, `aria-*` o clases según el estado del control | Directiva que inyecta `NgControl` |
| Un control con plantilla propia (lista, calendario, varios elementos) | Componente con `ControlValueAccessor` |
| Que el valor del formulario sea distinto de lo que ve el usuario, con lógica para traducirlo | Componente con `ControlValueAccessor` |

Mi regla: **si es un input (o cualquier elemento nativo) sin mucha lógica, directiva; si tiene
plantilla propia y lógica de peso, componente**. Con la directiva es más sencillo de escribir, de
usar y de mantener; con el componente es más sencillo encapsular un control complejo.

:::tip[¿Y Signal Forms?]

Angular tiene también **Signal Forms** (`@angular/forms/signals`), estables desde la versión 22.
Usan otro modelo de integración, con la directiva `[formField]` y la interfaz `FormValueControl` en
lugar de `ControlValueAccessor`. Este artículo trata solo de Reactive Forms.

:::

## En resumen

- Los elementos nativos ya hablan con Reactive Forms gracias a los accesores que trae Angular.
- Una **directiva** sobre el input nativo añade comportamiento sin romper ese puente: inyecta
  `NgControl` y usa `host` para escuchar eventos y enlazar clases.
- Envolver el input en un **componente** obliga a implementar `ControlValueAccessor` y registrar
  `NG_VALUE_ACCESSOR`, y a reenviar atributos que antes eran gratis.
- El componente compensa cuando el control tiene plantilla y lógica propias: un select con
  buscador, un calendario, un control compuesto.

## Referencias

- [Angular: Reactive forms](https://angular.dev/guide/forms/reactive-forms)
- [Angular: `ControlValueAccessor`](https://angular.dev/api/forms/ControlValueAccessor)
- [Angular: `NG_VALUE_ACCESSOR`](https://angular.dev/api/forms/NG_VALUE_ACCESSOR)
- [Angular: `DefaultValueAccessor`](https://angular.dev/api/forms/DefaultValueAccessor)
- [Angular: `NgControl`](https://angular.dev/api/forms/NgControl)
- [Angular: directivas de atributo](https://angular.dev/guide/directives/attribute-directives)
- [Angular: elementos host](https://angular.dev/guide/components/host-elements)
- [Angular: Signal Forms](https://angular.dev/guide/forms/signals/overview)
- [Angular: versiones y soporte](https://angular.dev/reference/releases)
