---
description: Every file is .ts (no js/mjs/cjs/jsx/tsx, configs included) and source imports only .ts; CSS comes from HTML, JSON/SVG become .ts modules
---

The user's rule, from the Deno days and restated for Node (2026-10-12): "No
JS, not even JSX/TSX, only TS." Source, scripts, tests, and configs are all
plain `.ts`. Build output in a gitignored folder is the only JS.

`tsconfig.json`: no `allowJs`, no `jsx`, and the template's strict flags
(`verbatimModuleSyntax`, `erasableSyntaxOnly`, `allowImportingTsExtensions`,
`isolatedDeclarations` in packages, `exactOptionalPropertyTypes`,
`noUncheckedIndexedAccess`). If a tool or framework seems to need a JS or TSX
file, stop and flag it instead of adding one.

## Only `.ts` imports (2026-10-14)

`project/no-non-ts-imports` (in `scripts/project-lint.ts`) fails:

- a relative, absolute, `#`, or package-subpath specifier whose last segment
  has a non-`.ts` extension: `.css`, `.json`, `.svg`, `.js`, `.mjs`, `.tsx`;
- any `?query` suffix (`?raw`, `?url`, `?inline`);
- any import attributes (`with { type: "json" }`, `with { type: "text" }`).

Bare packages (`lit`, `@types/json-schema`, `lodash.debounce`), `#` aliases,
and `node:` builtins pass. `@fortawesome/x/svgs/a.svg` fails.

```ts
import "./theme.css"; // no
import data from "./scenes.json" with { type: "json" }; // no
import icon from "./lock.svg?raw"; // no
import { scenes } from "#data/scenes"; // yes: scenes.ts
```

## What to do instead

- **CSS:** load it from HTML with `<link rel="stylesheet" href="...">`. Never
  import CSS from TS, not even for Vite. (This also removes most of the
  `import/no-unassigned-import` hits the `suspicious` category reports.)
- **JSON data:** turn it into a `.ts` module exporting a typed constant.
- **SVG:** a `.ts` module exporting a Lit template; see [[icons-memona-style]].
- **`package.json` fields at runtime:** never `import pkg from
  "./package.json"` and there is no `#package` alias. Write the value out in
  `.ts` and add a test in `tests/` that reads `package.json` with `node:fs`
  and fails on drift (the plugin repos do this for `meta.name`/`meta.version`).
- **Reading a file is not importing it.** `readFileSync` + `JSON.parse` is
  fine in tooling and tests.
- **A tool's `.js` entry:** don't `import("pkg/cli.js")`; use the package
  entry or spawn the package's bin ([[lit-analyzer-ts6]]).
