# @cunarist/lit/require-accessor-with-decorators

📝 Require `accessor` on fields decorated with `@property` or `@state`.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

## Rule Details

Under standard (TC39) decorators, a field decorator can replace the field's
initialiser but cannot turn the field into a getter and setter pair. `@property`
therefore has nothing to hook: the field stays a plain data property, writes to
it never call `requestUpdate`, and the component stops re-rendering when the
value changes. Nothing errors; the property still holds the right value, so the
bug looks like a rendering problem rather than a declaration problem.

`accessor` gives the decorator the getter and setter it needs, and the
declaration then works under both decorator modes.

- The right answer depends on the project's decorator mode, which a lint rule
  cannot see. Under TypeScript's legacy `experimentalDecorators`, a plain field
  is the correct form and `accessor` is what breaks. Under standard decorators,
  the mode Lit 3 targets, `accessor` is required.
- Scope is instance fields of a Lit component decorated with `@property` or
  `@state`. `static properties` is a different declaration style and is not
  checked.
- Fields already declared `accessor` are never reported.
- The rule suggests adding `accessor`, except on a `readonly`, `declare`, or
  computed-key field.

Examples of **incorrect** code for this rule:

```ts
class PathBar extends LitElement {
  @property({ type: String })
  name = "";
}
```

Examples of **correct** code for this rule:

```ts
class PathBar extends LitElement {
  @property({ type: String })
  accessor name = "";
}
```

## When Not To Use It

Turn this rule off in a project compiled with `experimentalDecorators`: there it
is wrong on every reactive property.
