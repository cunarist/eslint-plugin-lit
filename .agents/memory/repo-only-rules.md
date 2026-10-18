---
description: The published plugin is the Deno package's 82 rules plus no-self-sync and no-sync-in-render, pinned by tests/configs.test.ts; scripts/project-lint.ts is explicit-types' copy retyped for Lit
---

The published plugin contains the 82 rules of
`cunarist/deno-lint-plugin-lit` ([[plugin-port-exact-deno-rules]]) plus
`no-self-sync` and `no-sync-in-render`, added in 0.9.0;
`tests/configs.test.ts` pins that list.

Everything this repo enforces only on itself lives in
`scripts/project-lint.ts` ([[project-lint-plugin]]): its custom rules are
`no-disable-comments` ([[lint-no-disable-comments]]) and `no-asset-imports`
([[ts-only-files-and-imports]]), and Deno's `camelcase` is the built-in
`id-match` ([[naming-id-match]], [[lint-parity-with-deno]]).

Specific to this repo: the file is copied from
`cunarist/eslint-plugin-explicit-types` as is, only retyped against this
repo's `LitRuleTypes`; keep the two in step. It may import `#helpers`.
`vite.config.ts` loads `./src/plugin/index.ts` itself as a `jsPlugins` entry, so a
new rule applies at once to the code that implements it; Oxlint strips the
types itself, `#` imports included, with no build first.
