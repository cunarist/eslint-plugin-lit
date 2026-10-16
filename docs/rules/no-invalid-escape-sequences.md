# @cunarist/lit/no-invalid-escape-sequences

📝 Disallow malformed `\x` and `\u` escapes in templates.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

## Rule Details

A tagged template makes malformed escapes legal to write: the raw strings stay
accessible, so there is no syntax error. But the cooked string for that part of
the template becomes `undefined`. Lit renders from the cooked value, so the text
around the bad escape disappears from the output. In markup this is always a
typo, or a regex pasted where it does not belong.

- Only `\x` and `\u` are checked. Every other escape is valid, if redundant,
  so `\d` and `\w` inside an inline `pattern` attribute are left alone.
- Accepted forms: `\x` plus exactly two hex digits, `\u` plus exactly four hex
  digits, or `\u{…}` with at least one hex digit.
- An escaped backslash (`\\x`) consumes the next character and is not flagged.
- Every part of the template is scanned, including the parts after a binding.
- A suggestion escapes the backslash, which keeps the sequence as literal text.

Examples of **incorrect** code for this rule:

```ts
const t = html`<div>\xZZ</div>`;
```

Examples of **correct** code for this rule:

```ts
const t = html`<div>A</div>`;
```

## When Not To Use It

There is no case where Lit renders a malformed escape usefully. Turn it off only
if your templates are processed by a tag that reads the raw strings instead.
