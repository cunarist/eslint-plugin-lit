# lit-robust/no-camelcase-attribute

📝 Disallow uppercase letters and underscores in `html` template attribute names.

💼 This rule is enabled in the 🔤 `naming` [config](https://github.com/cunarist/eslint-plugin-lit-robust#configs-and-rules).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

## Rule Details

This rule reports an attribute name in an `html` template that is not
kebab-case: one with uppercase letters or an underscore.

The HTML parser lowercases every attribute name before Lit ever sees it, so
`myProp=${v}` sets an attribute called `myprop`. A component declaring `myProp`
never observes it, and the binding does nothing at all: no error, no warning.

Either use the kebab-case attribute the component actually exposes, or bind the
property directly, which is case-sensitive. `snake_case` is rejected for the
same reason kebab-case is required: one attribute style, no `my_prop` sitting
beside `my-prop`.

- The three sigils are exempt. `.myProp=`, `@myEvent=` and `?myFlag=` are
  resolved by Lit rather than by the HTML parser and keep their case.
- Foreign content is exempt: SVG genuinely has `viewBox`, `gradientUnits` and
  friends. An `svg` tagged template is skipped entirely.
- `className` and `htmlFor` belong to `no-jsx-attribute-names`, which gives a
  more specific message; they are skipped here.
- The report highlights the attribute name.
- Suggestions offer the lowercase name, a `.` property binding when the value
  is a single binding, or the kebab-case name for `snake_case`. Which one is
  right depends on what the component exposes, so none is an autofix.

Examples of **incorrect** code for this rule:

```ts
const a = html`<x-y myProp=${this.v}></x-y>`;
const b = html`<x-y item_count="3"></x-y>`;
```

Examples of **correct** code for this rule:

```ts
const a = html`<x-y .myProp=${this.v}></x-y>`;
const b = html`<x-y item-count="3"></x-y>`;
```

## When Not To Use It

If your templates target elements whose attributes are deliberately
`snake_case`, turn this rule off.
