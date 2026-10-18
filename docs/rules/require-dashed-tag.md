# lit-robust/require-dashed-tag

📝 Require custom element names that the registry accepts.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit-robust#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

`customElements.define()` throws on an invalid name, so the component is never
registered. Nothing renders, and the tag sits in the DOM as an
`HTMLUnknownElement`, with no clue in the markup.

The rules come from the HTML spec: the name must contain a hyphen, start with a
lowercase letter, contain no uppercase, and not be one of a handful of reserved
names.

- Four rejections are reported: no hyphen, a first character that is not a
  lowercase letter, any uppercase letter, and the spec's reserved names
  (`annotation-xml`, `color-profile`, the `font-face*` family,
  `missing-glyph`).
- Only a string literal passed to `@customElement` on a Lit component is
  checked. A tag built at runtime is not read.

Examples of **incorrect** code for this rule:

```ts
@customElement("editor")
class Editor extends LitElement {}
```

Examples of **correct** code for this rule:

```ts
@customElement("cl-editor")
class Editor extends LitElement {}
```

## When Not To Use It

There is no valid reason to register a name the registry rejects; keep this rule
on.
