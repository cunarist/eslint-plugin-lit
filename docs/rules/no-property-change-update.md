# @cunarist/lit/no-property-change-update

📝 Disallow changing a reactive property in `update()`.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

Assigning a reactive property schedules an update. Doing it from inside
`update()` schedules another one, which assigns again: the component loops
forever and the page hangs. `willUpdate()` runs before the update is committed
and does not re-trigger the cycle, so the same work belongs there.

- Only reactive properties are flagged. Assigning a plain field such as
  `this.#cache` inside `update()` is fine.
- Both assignments and increments (`this.count++`) are caught.
- Nested callbacks count. An assignment inside a `forEach` callback declared in
  `update()` still fires.
- Properties from `static properties` are recognized alongside decorated ones.
- `updated()` is not checked by this rule; see
  [`no-property-change-in-updated`](no-property-change-in-updated.md).

Examples of **incorrect** code for this rule:

```ts
class El extends LitElement {
  @property()
  name = "";
  update(changed) {
    this.name = "x";
    super.update(changed);
  }
}
```

Examples of **correct** code for this rule:

```ts
class El extends LitElement {
  @property({ type: String })
  accessor name = "";

  @state()
  accessor upper = "";

  set source(value: string) {
    this.upper = value.toUpperCase();
  }
}
```

## When Not To Use It

If an assignment in `update()` is guarded so it settles after one extra pass,
this rule still reports it. Moving it to `willUpdate()` is almost always
simpler than disabling the rule.
