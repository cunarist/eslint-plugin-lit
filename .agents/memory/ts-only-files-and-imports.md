---
description: Every file is .ts (no js/mjs/cjs/jsx/tsx, configs included); imports are .ts or package .js/.mts/.mjs subpaths, never assets; JSON/SVG become .ts modules
---

The user's rule, from the Deno days and restated for Node (2026-10-12): "No
JS, not even JSX/TSX, only TS." Source, scripts, tests, and configs are all
plain `.ts`. Build output in a gitignored folder is the only JS.

`tsconfig.json`: no `allowJs`, no `jsx`, `"strict": true` written out (Deno
was strict; user decision 2026-10-17), and the template's strict flags
(`verbatimModuleSyntax`, `erasableSyntaxOnly`, `allowImportingTsExtensions`,
`isolatedDeclarations` in packages, `exactOptionalPropertyTypes`,
`noUncheckedIndexedAccess`). If a tool or framework seems to need a JS or TSX
file, stop and flag it instead of adding one.

## No asset imports (2026-10-16, widened 2026-10-17)

`project/no-asset-imports` (in `scripts/project-lint.ts`, renamed from
`no-non-ts-imports`) fails:

- a relative, absolute, `#`, or package-subpath specifier whose last segment
  has an extension other than `.ts`, `.js`, `.mts`, or `.mjs`: `.css`,
  `.json`, `.svg`, `.jsx`, `.tsx`, `.cjs`, and every other asset;
- any `?query` suffix (`?raw`, `?url`, `?inline`);
- any import attributes (`with { type: "json" }`, `with { type: "text" }`).

`.js`, `.mts`, and `.mjs` are allowed (user decision, 2026-10-17) for package
subpaths such as `lit/decorators.js` or `pdfjs-dist/legacy/build/pdf.mjs`;
this repo's own files are still `.ts` only. `.jsx` and `.tsx` stay banned. Bare
packages (`lit`, `@types/json-schema`, `lodash.debounce`), `#` aliases, and
`node:` builtins pass. `@fortawesome/x/svgs/a.svg` fails.

```ts
import "./theme.css"; // no
import data from "./scenes.json" with { type: "json" }; // no
import icon from "./lock.svg?raw"; // no
import { scenes } from "#data/scenes"; // yes: scenes.ts
import { customElement } from "lit/decorators.js"; // yes: a package subpath
```

## What to do instead

- **CSS:** load it from HTML with `<link rel="stylesheet" href="...">`. Never
  import CSS from TS, not even for Vite. (This also removes most of the
  `import/no-unassigned-import` hits the `suspicious` category reports.)
- **JSON data:** turn it into a `.ts` module exporting a typed constant.
- **SVG:** a `.ts` module exporting a Lit template.
- **`package.json` fields at runtime:** never `import pkg from
  "./package.json"` and there is no `#package` alias. Write the value out in
  `.ts` and add a test that reads `package.json` with `node:fs`
  and fails on drift (the plugin repos do this for `meta.name`/`meta.version` in
  `tests/package-meta.test.ts`).
- **Reading a file is not importing it.** `readFileSync` + `JSON.parse` is
  fine in tooling and tests.
- **A tool's CLI:** prefer the package entry or spawning the package's bin
  over importing its `.js` CLI file.
