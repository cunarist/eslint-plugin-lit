# lit-robust/no-invalid-html

📝 Disallow template markup that is not valid HTML.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit-robust#configs-and-rules).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

## Rule Details

Lit parses templates as HTML and builds the DOM from the parse result, not from
what you wrote. A stray `<` becomes text, a truncated tag swallows everything
after it, and an unclosed element absorbs its following siblings as children.
None of this raises an error at runtime: the component renders, just with the
wrong tree, and CSS and event listeners then miss their targets.

- Unclosed elements are detected structurally, not as a parse error: an element
  with a start tag, no end tag, that is neither void nor self-closing.
- Void elements (`br`, `hr`, `img`, `input`, …) need no end tag.
- Elements whose end tag HTML makes optional (`li`, `td`, `tr`, `option`,
  `p`, …) are not flagged, so `<ul><li>a<li>b</ul>` passes.
- Duplicate attributes are a parse error too, but they are left to
  [`no-duplicate-template-bindings`](no-duplicate-template-bindings.md) and not
  reported here.
- Diagnostic positions are clamped so end-of-input errors still land on visible
  text.
- A stray `<` comes with a suggestion to escape it as `&lt;`.

Examples of **incorrect** code for this rule:

```ts
const t = html`<div><span></div>`;
const t2 = html`<div>a < b</div>`;
```

Examples of **correct** code for this rule:

```ts
const t = html`<div><span></span></div>`;
const t2 = html`<div>a &lt; b</div>`;
```

## When Not To Use It

If you rely on HTML's error recovery on purpose, for example to leave an element
open across templates, this rule reports it. That is rare enough to disable
inline.
