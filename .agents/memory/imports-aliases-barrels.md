---
description: An alias owns its target (folder index.ts = folder and below, any other file = that file); no overlap; outside an area only the exact alias reaches it; ../ is banned in every file; no folder names in the rule
---

## `#` aliases own their targets

Shared code is imported through Node subpath imports declared in
`package.json` `imports`. Node, TypeScript, Vite, Vite+'s config bundler, and
Oxlint's plugin loader all resolve them natively, so `.ts` source runs
unbuilt. `vp pack` inlines them, so they never reach package consumers.

One rule for every file, never tied to folder or file names (user rule
2026-10-17; it replaces the earlier "aliases only point at direct `src/`
subfolders" rule and the "modules plugin checks only aliased folders" scope):

- **An alias may point anywhere** and owns its target. An alias to a
  folder's `index.ts` owns that folder and everything below it; an alias to
  any other file owns only that file.
- **No overlap.** No file may be owned by 2 aliases: no alias inside another
  alias's area, and no 2 aliases with the same target. the modules plugin's
  `enforce-layer-order` reports it once at the top of every file 2 aliases
  claim. Fix by merging the aliases or moving files apart.
- **Outside an area, only the exact alias reaches it.** A deeper alias
  specifier (`#a/one.ts`, `no-barrel-bypass`) and a relative path into the
  area (`./a/one.ts`, `no-relative-bypass`; `./b/f.ts` to a file alias,
  `prefer-alias-import`, fixed to the alias) are bypasses.
- **Inside an area, relative imports of siblings and subfolders are free.**
- **`../` is banned in every file**, owned or not (`no-parent-import`).
  Anything above a file needs an alias.
- **Files no alias owns** need no `index.ts` and no alias, and import `./`
  siblings and subfolders freely.
- Unchanged: no `/*` subpath patterns, the key order of `imports` is the
  layer order `enforce-layer-order` checks (add a new alias at the right
  layer), and entry files are `index.ts` only.

```jsonc
"imports": {
  "#a": "./a/index.ts",      // owns a/**
  "#f": "./b/f.ts",          // owns only b/f.ts
  "#a-sub": "./a/sub/index.ts", // no: inside #a
  "#a2": "./a/index.ts"      // no: same target as #a
}
```

```ts
// in main.ts, which no alias owns
import { a } from "#a"; // yes
import { one } from "#a/one.ts"; // no: deeper alias specifier
import { one } from "./a/one.ts"; // no: relative path into #a
import { f } from "#f"; // yes
import { f } from "./b/f.ts"; // no: relative path to a file alias
import { g } from "./b/g.ts"; // yes: unowned
// in a/one.ts, owned by #a
import { two } from "./two.ts"; // yes: sibling
import { deep } from "./sub/deep.ts"; // yes: subfolder of the same area
import { x } from "../x.ts"; // no: no ../ anywhere
```

- Aliases point at `.ts` files only. There is no `#package` alias
  ([[ts-only-files-and-imports]]).
- Lint `jsPlugins` entries in `vite.config.ts` stay path strings, even when
  the file has an alias; its `import` of the plugin goes through `#plugin`.
- Keep test-only helpers in their own alias (e.g. `#testing`) so they never
  land in a bundle.

## Barrels

- An area used from outside exposes its API through its alias target, and
  callers import the alias (`#ui`), not files inside it.
- Barrels are also the standard fix for `import/max-dependencies`: one barrel
  import replaces many direct ones ([[lint-overrides-policy]]).
- `import/no-cycle` is on; a barrel must not create a cycle.

Relative imports are written with the `.ts` extension.

## What checks it in this repo

This repo does not lint itself with eslint-plugin-modules (plugin repos don't depend
on each other; see [[lint-parity-with-deno]]). `import/no-relative-parent-imports`
fails `../` in every file, and TypeScript fails a deeper alias specifier
(there are no `/*` patterns). Relative paths into an area and overlapping
aliases are not machine-checked here: keep them out by hand. A probe on
2026-10-17 with a local eslint-plugin-modules 0.10.0 build caught every form, and the
repo itself was clean apart from the modules plugin's layer-order and import-order
rules, which this repo never adopted.
