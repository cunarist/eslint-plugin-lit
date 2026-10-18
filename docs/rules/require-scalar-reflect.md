# lit-robust/require-scalar-reflect

📝 Require reflected properties to declare a scalar type.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit-robust#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

Reflection writes the property back out to the attribute on every change, using
the converter's `toAttribute`. For `Object` and `Array` that is
`JSON.stringify`, so the DOM fills with long quote-escaped blobs that re-parse
into a new object on the way back in: a fresh identity on every update, and an
update loop whenever the round trip is not exactly lossless. Values holding
functions, `undefined`, `Map`s, or cycles do not survive the trip at all.
Reflect scalars; keep structured data on the property only.

- Reflection is accepted only when the options say the value is a scalar:
  `type: String`, `Number`, or `Boolean`, or a `converter` of your own.
- `reflect: true` with no `type` is reported. That is the default converter,
  which writes `[object Object]` into the DOM for anything but a string.
- A `type` the rule cannot read, such as `type: TYPES.obj` or a variable, is
  reported too, since nothing in the options establishes a scalar.
- Both declaration styles are checked: a `@property({…})` options object and an
  entry of `static properties`.
- Only a literal `reflect: true` fires the rule. `reflect: someFlag` is not
  evaluated.
- The report points at the `reflect: true` entry, since that is the part to
  delete. If the attribute really is needed, reflect a scalar derived from the
  structure instead: a count, an id, or a presence flag.

Examples of **incorrect** code for this rule:

```ts
class El extends LitElement {
  @property({ type: Object, reflect: true })
  accessor data = {};
}
```

Examples of **correct** code for this rule:

```ts
class El extends LitElement {
  @property({ type: Object })
  accessor data = {};

  @property({ type: Boolean, reflect: true })
  accessor empty = false;
}
```

## When Not To Use It

If a property's `type` is a scalar written through a constant the rule cannot
read, this rule reports it; supply the type by name or turn the rule off there.
