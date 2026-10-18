# lit-robust/no-unsafe-html

📝 Disallow the `unsafeHTML` and `unsafeSVG` directives.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit-robust#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

Every ordinary Lit binding is inserted as text or as an attribute value, so a
string can never become markup. `unsafeHTML` and `unsafeSVG` exist to break
that guarantee: they hand the string to the HTML parser and splice the result
into the DOM. Whatever produced the string, a CMS field, a Markdown renderer, a
server response, or a URL parameter, becomes an injection point, and an
`onerror` or `<script>` payload from any of them runs with the page's origin.

The value being "trusted today" is not a property the code can keep. Build the
markup as a nested `html` template instead, so structure comes from the source
file and only the data is interpolated.

- A used import reports twice: once on the specifier, once on each call.
- Renamed imports are followed: `import { unsafeHTML as raw }` flags `raw` at
  its call sites too.
- Only the Lit directive modules count as the source: `lit/directives/…` and
  `lit-html/directives/…`, with or without the `.js` extension. An
  `unsafeHTML` imported from your own module is left alone.
- Detection is import-based, so a dynamic `import()` of the directive is not
  seen.

Examples of **incorrect** code for this rule:

```ts
import { unsafeHTML } from "lit/directives/unsafe-html.js";

const view = html`<div>${unsafeHTML(this.description)}</div>`;
```

Examples of **correct** code for this rule:

```ts
const view = html`<div>${this.description}</div>`;
```

## When Not To Use It

If you render markup that is sanitised before it reaches the directive and you
accept auditing every such call, you can turn this rule off.
