# lit-robust/no-jsx-attribute-names

📝 Disallow the JSX attribute names `className` and `htmlFor` in templates.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit-robust#configs-and-rules).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

## Rule Details

JSX renames `class` and `for` because they are reserved words in JavaScript. A
Lit template is real HTML, so no rename is needed, and the JSX spellings are set
verbatim as attributes named `classname` and `htmlfor`, which no browser does
anything with. The element goes unstyled or the label stops targeting its
control.

- Property bindings are left alone. `.className=` and `.htmlFor=` name real DOM
  properties and work correctly.
- [`no-camelcase-attribute`](no-camelcase-attribute.md) deliberately skips
  these two names so the two rules do not double-report.
- The diagnostic highlights the attribute name, and a suggestion renames it to
  its HTML spelling.

Examples of **incorrect** code for this rule:

```ts
const t = html`<div className=${this.classes}></div>`;
const t2 = html`<label htmlFor=${this.id}></label>`;
```

Examples of **correct** code for this rule:

```ts
const t = html`<div class=${this.classes}></div>`;
const t2 = html`<label for=${this.id}></label>`;
```

## When Not To Use It

If an element you render genuinely defines attributes named `classname` or
`htmlfor`, this rule reports them. Turn it off for that template.
