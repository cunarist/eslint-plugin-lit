# lit-robust/no-duplicate-slot-names

📝 Disallow two slots with the same name in one template.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit-robust#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

Slot assignment matches each light-DOM child against the **first** slot whose
name it requests. A second slot with that name is valid markup, renders its
fallback content, and stays permanently empty, so the duplicate reads as a
second insertion point that silently never fills. Nothing warns at runtime.

- Each template is checked on its own. The same slot name in two different
  templates is fine: they are different shadow roots.
- A bound name (`name=` with a `${…}`) is unknowable statically and is skipped
  rather than guessed at.
- Every slot after the first with a given name is reported, so three duplicates
  produce two diagnostics.
- The diagnostic highlights the offending `name="…"` attribute, not the whole
  tag.

Examples of **incorrect** code for this rule:

```ts
const t = html`<slot name="a"></slot><slot name="a"></slot>`;
```

Examples of **correct** code for this rule:

```ts
const t = html`<slot name="a"></slot><slot name="b"></slot>`;
```

## When Not To Use It

If two same-named slots are rendered on mutually exclusive branches of one
template, only one exists at a time; turn it off there.
