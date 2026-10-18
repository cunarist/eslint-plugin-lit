# lit-robust/no-duplicate-property-declaration

📝 Disallow declaring a reactive property both by decorator and in `static properties`.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit-robust#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

`@property()` and `static properties` are two spellings of the same call: both
end up in `ReactiveElement.createProperty`. Declaring one property both ways
means one options object silently wins, whichever the decorator transform and
the static initializer happen to apply last. The `type`, `reflect`, and
`converter` written in the losing declaration have no effect while still reading
as though they do, so the class documents behavior it does not have.

- `@state` counts as a decorator declaration, so a `@state` name repeated in
  `static properties` is reported too.
- The diagnostic points at the `static properties` key, which is usually the
  redundant one, but either declaration can be the one to remove.
- Disjoint names across the two styles are fine. Mixing styles in one class is
  not itself an error here; only the overlap is.
- Only classes that extend `LitElement` or `ReactiveElement` are checked.

Examples of **incorrect** code for this rule:

```ts
class El extends LitElement {
  static properties = { count: { type: Number } };

  @property({ type: Number })
  accessor count = 0;
}
```

Examples of **correct** code for this rule:

```ts
class El extends LitElement {
  @property({ type: Number })
  accessor count = 0;
}
```

## When Not To Use It

There is no case where both declarations take effect, so keep it on.
