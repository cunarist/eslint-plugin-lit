# @cunarist/lit/no-legacy-imports

📝 Disallow Lit 1 module paths and the names Lit 2 removed.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

## Rule Details

Lit 1 shipped as two packages; Lit 2 and later ship as `lit`. In a mixed install
both still resolve, so the old path keeps working and nothing warns you. The
result is two copies of lit-html in the bundle with separate template caches:
templates created by one are not recognized by the other, and elements
re-render from scratch instead of updating.

- Subpaths are matched on the package segment, so
  `lit-html/directives/repeat.js` is flagged too.
- Two renamed exports are checked wherever they are imported from a Lit core
  path: `UpdatingElement` is now `ReactiveElement`, and `internalProperty` is
  now `state`.
- A legacy name imported from a legacy path produces two diagnostics, one for
  the path and one for the name.
- The names are only flagged on Lit imports. `internalProperty` from
  `./local.ts` is left alone.
- Suggestions switch a bare `lit-html` or `lit-element` to `lit`, and import
  the replacement name under the old local name. A legacy subpath gets no
  suggestion, since its module may have moved.

Examples of **incorrect** code for this rule:

```ts
import { html } from "lit-html";
import { repeat } from "lit-html/directives/repeat.js";
import { internalProperty } from "lit";
```

Examples of **correct** code for this rule:

```ts
import { html } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { state } from "lit/decorators.js";
```

## When Not To Use It

If the project is still on Lit 1, every import is a legacy one. Turn this rule
off until the upgrade.
