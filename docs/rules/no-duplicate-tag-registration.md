# lit-robust/no-duplicate-tag-registration

📝 Disallow registering the same custom element tag twice in one file.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit-robust#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

`customElements.define` throws `NotSupportedError` when the tag is already in
the registry, and `@customElement` is a thin wrapper around it. Two
registrations of one tag is a copy-paste slip that takes the entire module down
at import time, before anything has rendered, and usually with a stack trace
pointing at whichever module happened to import it first rather than at the
duplicate.

- Decorator registrations and `customElements.define("x-y", ...)` calls are
  collected together, so a decorator plus a matching `define` is flagged too.
- Registrations are ordered by position in the file, so the first one is left
  alone and every later one is reported.
- Only one file is visible. The same tag registered from two different modules
  still throws at runtime and this rule cannot see it.
- A computed tag, as in `customElements.define(tag, X)`, is skipped.

Examples of **incorrect** code for this rule:

```ts
@customElement("cl-panel")
class Panel extends LitElement {}

@customElement("cl-panel")
class OtherPanel extends LitElement {}
```

Examples of **correct** code for this rule:

```ts
@customElement("cl-panel")
class Panel extends LitElement {}

@customElement("cl-side-panel")
class SidePanel extends LitElement {}
```

## When Not To Use It

If the registrations are guarded so that only one runs, such as behind a
`customElements.get` check, turn it off for that file.
