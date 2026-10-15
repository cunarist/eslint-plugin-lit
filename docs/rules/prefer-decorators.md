# @cunarist/lit/prefer-decorators

📝 Enforce `@property` and `@state` decorators over `static properties`.

💼 This rule is enabled in the 🔒 `strict` [config](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

This rule reports a `static properties` declaration on a Lit component.

`static properties` lists property names in one place and the fields
themselves in another. The two drift: a renamed field leaves a dead entry, a new
field silently fails to be reactive, and neither mistake produces an error.
`@property()` on the field keeps the declaration, the initializer, and the
TypeScript type together, so there is nothing to keep in sync.

- Both forms are reported: the static field and `static get properties()`. The
  report points at the `properties` name.
- Only `static` members of Lit components are checked. A non-static field named
  `properties` is left alone.

Examples of **incorrect** code for this rule:

```ts
class El extends LitElement {
  static properties = { name: {}, open: { state: true } };
}
```

Examples of **correct** code for this rule:

```ts
class El extends LitElement {
  @property({ type: String })
  accessor name = "";
  @state()
  accessor open = false;
}
```

## When Not To Use It

If your build cannot enable decorators, `static properties` is the only way to
declare reactive properties, so turn this rule off.
