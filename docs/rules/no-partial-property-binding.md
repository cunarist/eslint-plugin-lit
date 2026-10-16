# @cunarist/lit/no-partial-property-binding

📝 Disallow property, event, and boolean bindings that are not the whole attribute value.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

Lit can interleave literal text with bindings only for plain attributes, where
the result is a string. For the `.`, `@`, and `?` sigils there is nothing to
concatenate, since a handler function or an object has no meaningful string
form, so Lit refuses and throws while preparing the template:

> Property, event, boolean and element bindings must consist of a single
> expression.

That is a hard failure at render time, but it fires from inside Lit rather than
from the template that caused it. Computing the composed value before the
template and binding it by name avoids it.

- Plain attributes may still compose freely; a quoted value mixing text and
  bindings is fine.
- A static literal such as a quoted `.prop="hello"` is a legitimate one-off
  assignment and is not reported.
- An unquoted binding followed by a second one is reported too. The value stops
  at the whitespace, so the trailing binding lands in attribute-name position
  where nothing can bind it.

Examples of **incorrect** code for this rule:

```ts
const t = html`<x-y .prop="x${this.a}"></x-y>`;
const t2 = html`<x-y ?open="${this.a}!"></x-y>`;
```

Examples of **correct** code for this rule:

```ts
const t = html`<x-y .prop=${this.prefixed}></x-y>`;
const t2 = html`<x-y ?open=${this.isOpen}></x-y>`;
```

## When Not To Use It

Lit throws on every case this rule reports, so there is no reason to turn it
off.
