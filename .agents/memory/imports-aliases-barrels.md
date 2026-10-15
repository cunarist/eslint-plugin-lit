---
description: Shared code comes through # aliases in package.json imports, each directory's entry is index.ts, barrels keep imports few; never ../ out of a directory
---

## `#` aliases

Shared code is imported through Node subpath imports declared in
`package.json` `imports`, never by a relative path that climbs out of a
directory:

```jsonc
"imports": {
  "#helpers": "./src/helpers/index.ts",
  "#components/*": "./src/components/*"
}
```

```ts
import { typeNameTail } from "#helpers"; // yes
import { typeNameTail } from "../helpers/ast.ts"; // no: import/no-relative-parent-imports
```

Node, TypeScript, Vite, Vite+'s config bundler, and Oxlint's plugin loader
all resolve them natively, so `.ts` source runs unbuilt. `vp pack` inlines them,
so they never reach package consumers.

- Deno's trailing-slash mappings (`"#components/"`) don't exist in Node; they
  become patterns, `"#components/*": "./src/components/*"`.
- Aliases point at `.ts` files only. There is no `#package` alias
  ([[ts-only-files-and-imports]]).
- In repos linted by import-check, the key order of `imports` is the layer
  order `enforce-layer-order` checks; add a new alias at the right layer.
- Keep test-only helpers in their own alias (e.g. `#testing`) so they never
  land in a bundle.

## `index.ts` entries and barrels

- Every directory's entry file is `index.ts`, never `mod.ts` (decided
  2026-10-12; import-check's `enforce-mod-file` now requires `index.ts`).
- A directory used from outside exposes its API through its `index.ts`
  barrel, and callers import the barrel (`#ui`), not files inside it
  (`no-barrel-bypass`).
- Barrels are also the standard fix for `import/max-dependencies`: one barrel
  import replaces many direct ones ([[lint-overrides-policy]]).
- `import/no-cycle` is on; a barrel must not create a cycle.

Relative imports inside one directory (`./sibling.ts`) are fine, with the
`.ts` extension written out.
