# lit-robust/no-light-dom

📝 Disallow `createRenderRoot()` returning `this` in a Lit component.

💼 This rule is enabled in the 🔒 `strict` [config](https://github.com/cunarist/eslint-plugin-lit-robust#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

This rule reports a `createRenderRoot()` override in a Lit component that
returns `this`, which renders the component into the light DOM.

Returning `this` turns off the shadow root for the whole component.
`static styles` stops being scoped, so the component's CSS leaks out and the
page's CSS leaks in. Internals become reachable by outside selectors, so a
refactor of your own markup can break someone else's stylesheet.

- Only a returned `this` is reported, directly or from either branch of a
  conditional, in any branch of the method except inside a nested function or
  a `catch` or `finally` block.
- Overriding `createRenderRoot` for other reasons, such as adjusting the shadow
  root or adopting a stylesheet, keeps the shadow root and is left alone.
- Only Lit components are checked.

Examples of **incorrect** code for this rule:

```ts
class El extends LitElement {
  createRenderRoot() {
    return this;
  }
}
```

Examples of **correct** code for this rule:

```ts
class El extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
  `;
}
```

## When Not To Use It

Light DOM is a real Lit feature with real uses, such as form participation or
inheriting a design system's global styles. If your components need it, turn
this rule off.
