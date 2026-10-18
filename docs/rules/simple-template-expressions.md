# lit-robust/simple-template-expressions

📝 Enforce plain names and member chains as template bindings.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit-robust#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

A template that only interpolates names reads as markup, so you can see the
shape of the DOM without evaluating anything. Inline arrows and `.bind(this)`
allocate a new function on every render, which forces Lit to tear down and
re-attach the listener each time. Calls, conditionals, and `.map(…)` chains hide
real logic inside a string literal where it cannot be named, typed at a glance,
or tested. Moving all of it above the `return` costs one local and makes both
halves legible.

Directives get no exemption. `repeat(…)` is a call like any other and is
hoisted into a local before the `return`, exactly like `this.label()` would be.
The message names the directive, but the fix is the same hoist.

The rule also checks the expression `render()` returns: it may not be a
conditional. An early `return` inside an `if` is the intended alternative.

- Each offending binding is reported separately, with a message naming its
  shape: call, directive call, arrow, function expression, `.bind`, `.map`,
  nested tagged template, conditional, logical, template literal, object
  literal, array literal, `await`, computed member access, binary, or `new`.
- Member chains of any depth are fine (`this.a.b.c.d`). Only _computed_ access
  (`this.items[0]`) is rejected.
- Only Lit's `html` and `svg` tagged templates are checked.
- A conditional returned from any method other than `render()` is not checked.

Examples of **incorrect** code for this rule:

```ts
html`<div>${repeat(this.items, k, v)}</div>`;
html`<div @click=${() => this.go()}></div>`;
html`<div @click=${this.go.bind(this)}></div>`;
html`<ul>
  ${this.items.map((i) => i.name)}
</ul>`;
html`<div>${cond ? a : b}</div>`;
html`<div>${this.items[0]}</div>`;

class Bad extends LitElement {
  render() {
    return this.open ? html`<a></a>` : html`<b></b>`;
  }
}
```

Examples of **correct** code for this rule:

```ts
const renderedItems = repeat(this.items, (i) => this.itemId(i), this.#renderNode);
html`<div>${renderedItems}</div>`;
html`<div>${this.a.b.c.d}</div>`;
html`<div @click=${this.#onClick}></div>`;

class Good extends LitElement {
  render() {
    if (this.open) {
      return html`<a></a>`;
    }
    return html`<b></b>`;
  }
}
```

## When Not To Use It

If your team prefers inline expressions in templates and accepts the extra
listener churn of inline functions, this rule reports nearly every template.
