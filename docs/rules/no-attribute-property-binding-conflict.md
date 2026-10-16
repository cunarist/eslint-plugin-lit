# @cunarist/lit/no-attribute-property-binding-conflict

📝 Disallow binding one name as both an attribute and a property on an element.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

## Rule Details

For a reactive property the attribute is not an independent channel: it feeds
the property. Binding both means two sources write the same field, and which one
survives depends on the order Lit commits them in. Reordering the bindings, or
changing whether one of them updates on a given render, silently changes the
result. One of the two is always redundant, and it is not obvious which.

- Only the attribute/property pair conflicts. `?foo` and `@foo` address separate
  things and may coexist with either.
- Names are compared case-insensitively, since the HTML parser lowercases
  attribute names.
- The diagnostic highlights whichever of the two comes second, and a suggestion
  removes that one.
- Duplicates within a single namespace are
  [`no-duplicate-template-bindings`](no-duplicate-template-bindings.md).

Examples of **incorrect** code for this rule:

```ts
const t = html`<x-y foo=${this.a} .foo=${this.b}></x-y>`;
```

Examples of **correct** code for this rule:

```ts
const t = html`<x-y .foo=${this.b}></x-y>`;
```

## When Not To Use It

If the element's attribute and property of the same name are genuinely
independent, as on a non-Lit element, turn it off for that template.
