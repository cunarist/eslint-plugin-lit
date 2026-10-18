# lit-robust/no-duplicate-template-bindings

📝 Disallow binding the same attribute, property, or event twice on one element.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit-robust#configs-and-rules).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

## Rule Details

The bindings are attribute, property, boolean, and event bindings, repeated on
one element.

The HTML parser keeps the first occurrence and silently drops the rest. So the
second binding, usually the one you just added, does nothing, with no error
anywhere. It is always a bug: either a copy-paste leftover, or an edit applied
to the wrong line.

- The four sigils are separate namespaces. `foo`, `.foo`, `?foo`, and `@foo` may
  all coexist on one element; only a repeat within a namespace is flagged.
- The diagnostic points at the second occurrence, and a suggestion removes it.
- Duplicates on different elements are fine.
- [`no-invalid-html`](no-invalid-html.md) deliberately skips this parse error so
  the two rules do not double-report.

Examples of **incorrect** code for this rule:

```ts
const t = html`<x-y .foo=${this.a} .foo=${this.b}></x-y>`;
```

Examples of **correct** code for this rule:

```ts
const t = html`<x-y .foo=${this.a} .bar=${this.b}></x-y>`;
```

## When Not To Use It

The parser always drops the repeat, so keep it on.
