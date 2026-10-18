# lit-robust/lifecycle-super

📝 Require Lit lifecycle overrides to call their `super` implementation.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit-robust#configs-and-rules).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

## Rule Details

`ReactiveElement` does real work in these callbacks: registering the element,
applying attribute changes, committing the render. An override that skips
`super` silently removes that work. The symptom is never a stack trace: the
component just stops reacting to attributes, or never renders, and the cause
looks unrelated to the method you edited.

- Only six methods are checked: `connectedCallback`, `disconnectedCallback`,
  `attributeChangedCallback`, `adoptedCallback`, `update`, `performUpdate`.
- `willUpdate`, `firstUpdated`, `updated`, `shouldUpdate`, and `render` are
  deliberately excluded. Their base implementations are empty hooks meant to be
  replaced, so requiring `super` there would flag idiomatic code.
- The `super` call may be anywhere in the body, including nested inside `if` or
  `try`. A conditional call satisfies the rule.
- The call must chain to the same method. `connectedCallback()` calling
  `super.disconnectedCallback()` still fires.
- Only classes that extend `LitElement` or `ReactiveElement` are checked.
- A suggestion inserts `super.<name>(…)` at the start of the body, forwarding
  the parameters; where the call belongs is your decision.
- [`lifecycle-allowlist`](lifecycle-allowlist.md) bans these overrides outright.
  The two do not conflict: one says "if you override, chain to super", the other
  says "do not override".

Examples of **incorrect** code for this rule:

```ts
class El extends LitElement {
  connectedCallback() {
    this.setup();
  }
}
```

Examples of **correct** code for this rule:

```ts
class El extends LitElement {
  connectedCallback() {
    super.connectedCallback();
    this.setup();
  }
}
```

## When Not To Use It

If you intentionally replace Lit's behavior in one of these callbacks, turn it
off for that class.
