# lit-robust/no-multiple-default-slots

📝 Disallow more than one default `<slot>` in a template.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit-robust#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

Light DOM children with no `slot` attribute all go to the **first** default
slot. Any further unnamed slot renders its fallback content and never receives
anything, so it reads as a second insertion point that silently does nothing.

- `name=""` counts as a default slot; it is how the default slot is named
  explicitly.
- A bound name (`name=` with a `${…}`) may or may not be empty at runtime, so
  such a slot is neither counted nor reported.
- Each template is checked on its own: one default slot per shadow root.
- Every default slot after the first is reported, wherever it sits in the tree.

Examples of **incorrect** code for this rule:

```ts
const t = html`<slot></slot><slot></slot>`;
```

Examples of **correct** code for this rule:

```ts
const t = html`<slot></slot><slot name="footer"></slot>`;
```

## When Not To Use It

If a second default slot exists only to show its fallback content, this rule
reports it. Render that content directly instead, or turn the rule off.
