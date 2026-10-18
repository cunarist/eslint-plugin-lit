# lit-robust/no-self-closing-non-void

📝 Disallow self-closing syntax on non-void HTML elements in templates.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit-robust#configs-and-rules).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

## Rule Details

HTML has no self-closing tags. The parser reads `<div />` as an ordinary start
tag and throws the slash away, so the element stays open and everything after
it becomes a child instead of a sibling. Nothing errors; the layout is just
wrong, often far from the line that caused it.

- Void elements are exempt: `<br />`, `<img />`, `<input />` and the rest have
  no end tag anyway, so the slash is decorative.
- SVG and MathML content is exempt, since foreign content really does support
  self-closing syntax. An `svg` tagged template is skipped entirely.
- A trailing slash that an unquoted attribute value has swallowed is not
  self-closing and is not reported.
- The diagnostic highlights the whole start tag, and a suggestion closes the
  element right away. It is not an autofix: what followed the tag stops being
  its children, which changes the rendered tree.

Examples of **incorrect** code for this rule:

```ts
const t = html`<div />`;
const t2 = html`<my-el .foo=${this.a} />`;
```

Examples of **correct** code for this rule:

```ts
const t = html`<div></div>`;
const t2 = html`<my-el .foo=${this.a}></my-el>`;
```

## When Not To Use It

If you use `/>` on purpose to open an element whose content follows, this rule
reports it. Writing the start tag without the slash says the same thing plainly.
