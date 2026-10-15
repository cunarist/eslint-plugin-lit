# @cunarist/lit/no-this-in-static-styles

📝 Disallow `this` inside `static styles`.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

`static styles` is evaluated once, on the class, when the module loads. There is
no instance in that scope, so `this` is the constructor rather than a component,
and every instance field read through it is `undefined`. Lit also adopts the
resulting stylesheet once per class and shares it across every instance, so even
a readable value could not vary per component. A CSS custom property set from
the template carries anything instance-specific.

- Arrow functions inside the initializer inherit the static `this`, so they are
  flagged too. A non-arrow `function` rebinds `this` and is not.
- Only a member literally named `styles` and declared `static` is checked. A
  `this` reference in an instance field initializer is legitimate.

Examples of **incorrect** code for this rule:

```ts
class El extends LitElement {
  static styles = css`
    :host {
      color: ${this.color};
    }
  `;
}
```

Examples of **correct** code for this rule:

```ts
class El extends LitElement {
  static styles = css`
    :host {
      color: var(--el-color);
    }
  `;
}
```

## When Not To Use It

If `static styles` reads a static member through `this` on purpose, such as a
shared color defined on the class, this rule reports it. Reference the class by
name instead.
