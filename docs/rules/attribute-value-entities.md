# lit-robust/attribute-value-entities

📝 Require HTML entities for `&`, `<`, `>`, and `"` in template attribute values.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit-robust#configs-and-rules).

🔧💡 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix) and manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

## Rule Details

The characters are `&`, `<`, `>`, and `"`, inside a static attribute value in an
`html` template.

These characters are significant to the HTML parser. An unescaped `"` ends the
attribute value early, so the rest of the text becomes stray attributes. A bare
`&` is parsed as the start of a character reference and can swallow the
following word. The template still parses, so the damage shows up as garbled
rendered output rather than an error. Writing the entity says exactly which
character is meant.

- Bindings are excluded. Each `${…}` is replaced by a placeholder before the
  scan, so `title=${this.a && this.b}` and `title="${this.a > this.b}"` are
  fine. Static text around a binding is still checked.
- A well-formed character reference is accepted, whether named (`&amp;`),
  decimal (`&#38;`), or hex (`&#x26;`). Only a `&` that does not start one is
  flagged.
- Valueless attributes are skipped, and so are templates not tagged with Lit's
  `html` or `svg`.
- The fix writes the entity. An `&` followed by a letter, digit, or `#` may
  already decode as a reference without its `;` (`&copy x`), so escaping it
  could change the value; that one gets a suggestion instead.

Examples of **incorrect** code for this rule:

```ts
const t = html`<a title="a & b"></a>`;
```

Examples of **correct** code for this rule:

```ts
const t = html`<a title="a &amp; b"></a>`;
```

## When Not To Use It

If you rely on the browser's error recovery for bare `&`, `<`, and `>` in
attribute values and accept the risk around `"` and references, turn it off.
