---
slug: articles/development/typescript/angular/angular-directive-or-component
seo:
  title: "Angular: directive or component?"
  description: "Why, with Angular Reactive Forms, I prefer a directive on the native input over wrapping it in a component with ControlValueAccessor, and when I don't."
---

# Directive or component for an input in Angular

When a form field needs more than typing and reading, the temptation is to create a component:
`<app-reference-input>` with the `<input>` inside. Whenever I can, I leave the native `<input>` as
it is and add a **directive** to it. `ControlValueAccessor` only when it is strictly necessary. I
have worked this way since the first versions of Reactive Forms; only the syntax has changed.

## The problem

An order form has a **reference** field. Users type it however they like (`  ab-1234 `,
`AB-1234`…) and we want two things:

1. When leaving the field, **normalise it**: no surrounding spaces and in upper case.
2. If it is empty and the user has already touched it, **mark it in red**.

The starting form:

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

That `<input formControlName="reference">` already works without you writing anything. Why?
Because between the `FormControl` and the element there is a bridge, the
**`ControlValueAccessor`**, and Angular already ships one for each native element:
`DefaultValueAccessor` for text and `<textarea>`, and others for `number`, `checkbox`, `radio`,
`range`, `<select>` and `<select multiple>`.

That is the key to the whole article: **as long as you work on the native element, the bridge is
already built.**

## Solution 1: a directive on the native input

A directive adds behaviour to an element that already exists, with no template of its own. This one
asks for the `NgControl` of the same `<input>` (the `formControlName` directive) and, through it,
reaches the `FormControl`:

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

In the form you only import `NormalizeDirective` in `order-form.ts` and add the attribute:

```html
<!-- order-form.html -->
<form [formGroup]="form">
  <input formControlName="reference" appNormalize />
</form>
```

And that is it. The `DefaultValueAccessor` keeps reading and writing the value, and `placeholder`,
`maxlength` or `aria-*` are written on the `<input>` as always.

I use the `host` property instead of `@HostListener` and `@HostBinding` because it is what the
Angular documentation recommends; with the old syntax, the idea is the same.

## Solution 2: a component that wraps the input

Now the same thing with a component. The `formControlName` moves onto `<app-reference-input>`,
which is not a native element, so **the bridge breaks**: you have to build it yourself,
implementing the four `ControlValueAccessor` methods and registering it with `NG_VALUE_ACCESSOR`.

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

It works, but look at what it cost:

- **More code for the same thing.** Four methods, two callbacks and a provider with `forwardRef`
  just so the form does again what the native input already did.
- **It still does not mark the error.** For that the component needs the `NgControl`, but injecting
  it while it registers itself as `NG_VALUE_ACCESSOR` creates a circular dependency: each one needs
  the other to be created. The way out, the one the Angular Material guide suggests, is to remove
  the provider and assign `ngControl.valueAccessor = this` by hand.
- **The attributes are left outside.** `placeholder` or `maxlength` go on
  `<app-reference-input>`, not on the `<input>`, and you have to forward them one by one.
- **One more element in the DOM.** `<app-reference-input>` is the component's *host*, inline by
  default; that is why it needs that `:host { display: block; }`. I explain it in
  [Your Angular component does not fill the width](angular-componente-no-ocupa-el-ancho.md).

## When the component is worth it

When there is no native input to decorate, because the control has **its own template and logic**:
a select with search, a date picker or a phone field with prefix and number. There the component
exists anyway and the four methods are a small part of its code.

## How I decide

| You need… | Use… |
|---|---|
| To format, normalise or restrict what is typed | Directive on the native input |
| Error styles or `aria-*` based on the control's state | Directive that injects `NgControl` |
| A control with its own template (list, calendar, several elements) | Component with `ControlValueAccessor` |

My rule: **if it is a native element without much logic, a directive; if it has its own template
and substantial logic, a component.** With the directive it is simpler to write, use and maintain;
with the component it is simpler to encapsulate a complex control.

:::tip[What about Signal Forms?]

Angular also has **Signal Forms**, stable since version 22, with a different integration model
(`[formField]` and `FormValueControl` instead of `ControlValueAccessor`). This article is about
Reactive Forms.

:::

## In summary

- Native elements already talk to Reactive Forms: Angular ships their `ControlValueAccessor`.
- A **directive** on the native input adds behaviour without touching that bridge.
- A **component** that wraps the input breaks the bridge and forces you to rebuild it. It is only
  worth it when the control has its own template and logic.

## References

- [Angular: Reactive forms](https://angular.dev/guide/forms/reactive-forms)
- [Angular: `ControlValueAccessor`](https://angular.dev/api/forms/ControlValueAccessor)
- [Angular: `NG_VALUE_ACCESSOR`](https://angular.dev/api/forms/NG_VALUE_ACCESSOR)
- [Angular: `DefaultValueAccessor`](https://angular.dev/api/forms/DefaultValueAccessor)
- [Angular: `NgControl`](https://angular.dev/api/forms/NgControl)
- [Angular: attribute directives](https://angular.dev/guide/directives/attribute-directives)
- [Angular: host elements](https://angular.dev/guide/components/host-elements)
- [Angular Material: creating a custom form field control (circular dependency)](https://material.angular.dev/guide/creating-a-custom-form-field-control)
- [Angular: Signal Forms](https://angular.dev/guide/forms/signals/overview)
