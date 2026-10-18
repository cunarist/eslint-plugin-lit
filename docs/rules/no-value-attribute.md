# lit-robust/no-value-attribute

📝 Disallow a bound `value` attribute on a form control.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit-robust#configs-and-rules).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

## Rule Details

`value=` sets the HTML attribute, which browsers treat as the control's
_default_ value only. Once the user has typed into the field, the attribute no
longer drives what is displayed. The binding keeps firing and the DOM keeps
updating, but the visible value stays whatever the user last typed, so
programmatic resets silently do nothing. The property binding `.value=${…}`
sets what the control shows.

- Only bound values are flagged. A static `value="5"` is a legitimate default.
- Checked elements: `button`, `data`, `input`, `li`, `meter`, `option`,
  `output`, `param`, `progress`, `select`, `textarea`. Everything else,
  custom elements included, is ignored.
- When the attribute holds exactly one binding, the rule suggests the property
  binding. It offers nothing when the binding is only part of the value.

Examples of **incorrect** code for this rule:

```ts
const t = html`<input value=${this.v} />`;
```

Examples of **correct** code for this rule:

```ts
const t = html`<input .value=${this.v} />`;
```

## When Not To Use It

If you deliberately bind only the default value of a control, for example to
reset it through a form's `reset()`, this rule flags that binding.
