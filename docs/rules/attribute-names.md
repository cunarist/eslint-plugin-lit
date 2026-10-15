# @cunarist/lit/attribute-names

📝 Require an explicit `attribute` option on camelCase reactive properties.

💼 This rule is enabled in the 🔤 `naming` [config](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

## Rule Details

This rule reports a camelCase reactive property that does not declare an
explicit `attribute` option.

HTML attribute names are ASCII case-insensitive, so Lit lowercases them. A
property named `myProp` is observed as the attribute `myprop`, not `myProp` and
not `my-prop`. Someone writing `<my-el my-prop="x">` in markup gets no error and
no effect; the property just never updates. Saying what the attribute is, or
that there is none, makes the mapping explicit.

- `attribute: false` is not the same fix. It silences the rule by removing the
  attribute, so `<my-el my-prop="x">` stops working. Reach for it only when the
  property is never set from markup; otherwise name the attribute.
- All-lowercase names are fine as they are; only names containing uppercase are
  checked.
- `@state` and undecorated fields are ignored, since they have no attribute.
- Other options do not satisfy the rule.
  `@property({ type: Boolean, reflect: true }) isOpen` still fires, because none
  of those options name the attribute.
- Entries of a `static properties` object are checked the same way.
- A spread inside the options object is assumed to carry `attribute`, so it is
  not flagged.
- A suggestion adds the kebab-case `attribute` option. It is not an autofix:
  it changes which attribute the property observes.

Examples of **incorrect** code for this rule:

```ts
class El extends LitElement {
  @property()
  accessor myProp = "";
}
```

Examples of **correct** code for this rule:

```ts
class El extends LitElement {
  @property({ type: String, attribute: "my-prop" })
  accessor myProp = "";
}
```

## When Not To Use It

If your components are never configured from markup, or you accept the
lowercased attribute names Lit derives, turn this rule off.
