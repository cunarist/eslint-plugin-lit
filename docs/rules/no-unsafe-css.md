# @cunarist/lit/no-unsafe-css

📝 Disallow `unsafeCSS` from Lit.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

`css` refuses to interpolate anything that is not already a sanitised
`CSSResult`, which is what stops a value from a template, a config file, or user
input from becoming stylesheet text. `unsafeCSS` exists purely to defeat that
check. Once a string can reach the stylesheet, it can close the current rule and
open its own, which is enough to restyle the page or leak data through attribute
selectors and background URLs.

- A used import reports twice: once on the specifier, once on each call.
- Renamed imports are followed: `import { unsafeCSS as raw } from "lit"` flags
  `raw` at its call sites too.
- Only `lit`, `lit-html`, and `lit-element` count as the source. An
  `unsafeCSS` imported from your own module is a different function and is left
  alone.

Examples of **incorrect** code for this rule:

```ts
import { css, unsafeCSS } from "lit";

const styles = css`
  p {
    color: ${unsafeCSS(theme.accent)};
  }
`;
```

Examples of **correct** code for this rule:

```ts
import { css } from "lit";

const styles = css`
  p {
    color: var(--accent);
  }
`;
```

## When Not To Use It

If every string you pass to `unsafeCSS` is a build-time constant you control and
you accept reviewing each call by hand, you can turn this rule off.
