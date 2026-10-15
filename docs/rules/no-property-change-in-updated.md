# @cunarist/lit/no-property-change-in-updated

📝 Disallow changing a reactive property in `updated()` or `firstUpdated()`.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

`updated()` and `firstUpdated()` run at the end of an update, after the DOM has
been committed. Writing a reactive property there marks the component dirty
again, so Lit schedules a second update, which calls `updated()` again, which
writes again. Even when a guard breaks the loop, the component renders twice for
every change, and the intermediate frame is visible. Computing the value in the
setter that receives the input makes one pass enough.

- Only reactive properties are flagged: those declared with `@property` or
  `@state`, or listed in `static properties`. Writing a plain field is fine.
- Increments (`this.count++`) count as assignments.
- [`no-property-change-update`](no-property-change-update.md) is the same check
  for `update()`.
- Reading DOM measurements in `updated()` is the hook's purpose; only the
  write-back to a reactive property loops.

Examples of **incorrect** code for this rule:

```ts
class El extends LitElement {
  @state()
  label = "";

  updated() {
    this.label = this.name.toUpperCase();
  }
}
```

Examples of **correct** code for this rule:

```ts
class El extends LitElement {
  @state()
  accessor label = "";

  set name(value: string) {
    this.label = value.toUpperCase();
  }
}
```

## When Not To Use It

If a second render pass is deliberate, for example to apply a value that can
only be measured after layout, this rule reports it. Disable it for that line
and keep the guard that stops the loop.
