# lit-robust/value-after-constraints

📝 Enforce setting `value` after every validity constraint attribute.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit-robust#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

Lit applies bindings in source order. If the value is set before `min`, `max`,
`pattern`, or the rest, the browser validates it against the constraints in
force at that moment, which is none. The control can end up reporting itself
valid when it is not, and the stale validity persists until something else
triggers a check.

- Constraint attributes checked: `min`, `max`, `step`, `pattern`,
  `maxlength`, `minlength`, `required`. A constraint written with a `?` or
  `.` prefix is recognized too.
- Both spellings of the value binding are checked, `value` and `.value`.
- Only `input`, `select`, and `textarea` are checked: the elements with
  constraint validation.
- At most one report per element, even when the value precedes several
  constraints.

Examples of **incorrect** code for this rule:

```ts
const t = html`<input .value=${this.v} min="1" />`;
```

Examples of **correct** code for this rule:

```ts
const t = html`<input min="1" .value=${this.v} />`;
```

## When Not To Use It

A value set before its constraints is never needed, since moving it last changes
nothing but the validation result. There is no case for turning this rule off.
