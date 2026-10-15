# @cunarist/lit/directive-allowlist

📝 Disallow Lit directive imports other than `ref` and `repeat`.

💼 This rule is enabled in the 🔒 `strict` [config](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

This rule allows only two Lit directive modules, `lit/directives/ref.js` and
`lit/directives/repeat.js`, and reports an import from any other Lit
`directives/` module.

Directives put control flow and state inside the template. `when` and `choose`
are conditionals written where you cannot read them as code; `classMap` and
`styleMap` are object construction hidden in an attribute; `unsafeHTML` is an
injection hole; `live`, `guard`, and `until` each add a caching or scheduling
rule that only shows up as a bug. Computing the value before the `return` makes
all of it ordinary TypeScript that the type checker and the debugger can see.
`ref` and `repeat` stay because neither has a plain-code equivalent: `ref` is
how you get an element, `repeat` is how you get keyed reconciliation.

- The check is on the module specifier, so anything under `lit/directives/`,
  `lit-html/directives/`, or `lit-element/directives/` is matched. Only the
  two exact `lit/…` paths pass; the legacy `lit-html/directives/ref.js` is
  reported, so use the `lit` path.
- A directive of your own from a local path is not touched.
- Importing `repeat` does not grant it a place inside a template.
  [`simple-template-expressions`](simple-template-expressions.md) still
  requires the `repeat(...)` call to be hoisted above the `return`.
- The allowlist is fixed; the rule takes no options.
- `ifDefined` is implemented as `value ?? nothing`. Write that yourself and
  hoist it: `const src = this.src ?? nothing;`.

Examples of **incorrect** code for this rule:

```ts
import { classMap } from "lit/directives/class-map.js";
import { when } from "lit/directives/when.js";
```

Examples of **correct** code for this rule:

```ts
import { ref } from "lit/directives/ref.js";
import { repeat } from "lit/directives/repeat.js";
```

## When Not To Use It

If you rely on directives such as `classMap`, `styleMap`, or `until` and do not
want to compute those values in plain code before the template, turn this rule
off. There is no way to allow a different set of directives.
