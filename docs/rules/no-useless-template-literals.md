# lit-robust/no-useless-template-literals

📝 Disallow an `html` template that holds only a single binding.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit-robust#configs-and-rules).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

## Rule Details

A template that is nothing but `${x}` produces no elements, no text, and no
attributes. It wraps the value in a `TemplateResult` for no reason, costing a
template instantiation and a diff on every render. Use the value directly; the
rule suggests that replacement.

- Only the exact shape fires: two empty strings around a single binding. A
  template with surrounding markup, with surrounding text, or with two bindings
  is fine.
- An empty `html` template is allowed: it is a legitimate way to render nothing,
  alongside Lit's `nothing` sentinel.
- Only Lit's `html` and `svg` tagged templates are checked.

Examples of **incorrect** code for this rule:

```ts
const t = html`${this.body}`;
```

Examples of **correct** code for this rule:

```ts
const t = this.body;
```

## When Not To Use It

If an API you call requires a `TemplateResult` rather than any renderable value,
the wrapper is needed and this rule will flag it.
