# @cunarist/lit/no-dom-query

📝 Disallow `querySelector` and `querySelectorAll` inside a Lit component.

💼 This rule is enabled in the 🔗 `dom-ref` [config](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

This rule reports `querySelector` and `querySelectorAll` calls inside a Lit
component.

A selector is a string that duplicates the template. Rename a class, swap a
`<div>` for a `<span>`, or wrap something in a conditional, and the selector
silently returns `null` — no compile error, no lint error, just a crash at
runtime or, worse, a feature that quietly stops working. The `ref` directive
carries the element reference from the template itself, so the link breaks at
the template when you change the template.

- Only fires inside a Lit component class body, `ReactiveElement` subclasses
  included. Querying from a controller or a plain module is not this rule's
  business.
- Any receiver counts inside a component, not just the render root:
  `document.querySelector(...)` in a component is reported too.
- The report highlights the callee, e.g. `this.renderRoot.querySelector`.
- Pairs with [`no-query-decorators`](no-query-decorators.md), which bans the
  decorator form of the same idea, and [`prefer-create-ref`](prefer-create-ref.md),
  which turns a bare stash callback into a `createRef`.

Examples of **incorrect** code for this rule:

```ts
class El extends LitElement {
  focusInput() {
    this.renderRoot.querySelector("input").focus();
  }
}
```

Examples of **correct** code for this rule:

```ts
class El extends LitElement {
  #input = createRef<HTMLInputElement>();

  focusInput() {
    this.#input.value?.focus();
  }

  render() {
    const inputRef = ref(this.#input);
    return html`<input ${inputRef} />`;
  }
}
```

## When Not To Use It

If a component has to find elements it did not render itself, such as nodes a
third-party script inserts or slotted content found by selector, a `ref` cannot
reach them. Turn this rule off where that lookup is the point.
