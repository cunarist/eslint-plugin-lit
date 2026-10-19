# lit-robust/no-legacy-template-syntax

📝 Disallow Polymer-style `[[...]]` and `{{...}}` bindings in templates.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit-robust#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

Lit only interpolates `${…}`. Polymer's binding syntax means nothing to it, so
the double brackets render as literal text: the user sees `[[this.name]]` on
the page. Nothing errors, and the value is never read.

- The scan runs on the raw template text rather than the parsed markup, because
  the internal binding placeholder is itself spelled with double braces.
- Single brackets and single braces are not flagged: `[ a ]` and `{ a }` are
  ordinary text.
- The delimiters must contain at least one character and no nested bracket of
  the same kind.

Examples of **incorrect** code for this rule:

```ts
const t = html`<div>[[this.name]]</div>`;
const t2 = html`<div title="{{name}}"></div>`;
```

Examples of **correct** code for this rule:

```ts
const t = html`<div>${this.name}</div>`;
const t2 = html`<div title=${this.name}></div>`;
```

## When Not To Use It

If a template is meant to show double brackets or braces as text, for example
in documentation of another template language, this rule reports it.
