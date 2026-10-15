# @cunarist/lit/no-boolean-property-default-true

📝 Disallow a `type: Boolean` reactive property whose default is not literal `false`.

💼 This rule is enabled in the 🔒 `strict` [config](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

## Rule Details

This rule reports a `@property({ type: Boolean })` reactive property whose
default is anything other than literal `false`.

Lit's `Boolean` converter follows the HTML rule: an attribute's presence is
`true` and its absence is `false`. No markup says false: `disabled="false"` and
`disabled=""` both parse as `true`. So a boolean property defaulting to `true`
can never be turned off from a template; the only way to unset it is imperative
property access, which defeats the point of having an attribute. Name the
property for its non-default state and default it to `false`.

- Two defaults are accepted: literal `false`, and no initializer at all.
  Anything else is reported, including `= DEFAULTS.open` and `= !!1`, since a
  computed default can be `true`.
- Only `type: Boolean` makes a property boolean here. A field merely annotated
  `: boolean` gets Lit's String converter, so it has no boolean attribute.
- `attribute: false` is accepted, since such a property is never set from
  markup. `@state` is never checked, for the same reason.
- The `static properties` form is checked by matching each entry against the
  class field of the same name, which holds the default.
- The rule suggests defaulting the property to `false`. That changes its
  initial value, so invert the property's name and meaning along with it.

Examples of **incorrect** code for this rule:

```ts
class El extends LitElement {
  @property({ type: Boolean })
  accessor enabled = true;
}
```

Examples of **correct** code for this rule:

```ts
class El extends LitElement {
  @property({ type: Boolean })
  accessor disabled = false;
}
```

## When Not To Use It

If a boolean property is only ever set from code, never from markup, mark it
`attribute: false` instead of turning the rule off. Turn it off if you accept
boolean attributes that markup cannot unset.
