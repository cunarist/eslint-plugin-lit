# lit-robust/no-request-update-in-updated

📝 Disallow calling `requestUpdate()` in `updated()` or `firstUpdated()`.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit-robust#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

`requestUpdate()` unconditionally schedules another update cycle, and
`updated()` runs at the end of every cycle. Calling one from the other is an
infinite loop: the requested update commits, calls `updated()`, and requests
another. Unlike a reactive property write there is no dirty check to stop it, so
nothing converges and the component re-renders forever. If a second pass really
is needed, work out why before the update and make the first pass correct.

- Only `this.requestUpdate()` and a bare `requestUpdate()` are flagged. A call
  through another object, such as `this.host.requestUpdate()` from a
  controller, is a different component's cycle and is allowed.
- Nested blocks and callbacks count: a call guarded by an `if` still fires,
  because the rule cannot know the guard ever becomes false.

Examples of **incorrect** code for this rule:

```ts
class El extends LitElement {
  updated() {
    this.width = this.offsetWidth;
    this.requestUpdate();
  }
}
```

Examples of **correct** code for this rule:

```ts
class El extends LitElement {
  @state()
  accessor width = 0;

  set measurer(value: Measurer) {
    this.width = value.width;
  }
}
```

## When Not To Use It

If a guarded `requestUpdate()` in `updated()` is the only way to react to a
value that becomes known after layout, this rule reports it. Disable it for that
line.
