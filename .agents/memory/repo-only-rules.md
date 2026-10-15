---
description: Published plugin = the Deno package's 82 rules exactly; repo-only rules live in scripts/project-lint.ts (no-disable-comments, no-non-ts-imports; camelcase is id-match)
---

The published plugin contains exactly the 82 rules of
`cunarist/deno-lint-plugin-lit`, same names and behavior, nothing added or
removed (the rule the user set for every port). `tests/configs.test.ts` pins
that list. Anything that cannot be ported 1:1 is flagged to the user, never
decided here.

A rule this repo needs only for its own lint parity goes in
`scripts/project-lint.ts`: a repo-local plugin, `meta.name` `project`, loaded in
`vite.config.ts` `jsPlugins` and turned on as `project/<rule>`. Its
`configs.project` is the repo's whole rule list beyond `configs.all`: Deno
parity, extras, pedantic opt-outs and per-rule options, built-in Oxlint ids
included. `vite.config.ts` spreads it and names no rule itself; only the
`overrides` entry, a file glob, stays there. Its custom rules are
`no-disable-comments` (see [[self-lint-from-source]]) and `no-non-ts-imports`.
It may import `#helpers`. `scripts/` is
repo tooling, not production code: no tests.

`scripts/project-lint.ts` is copied from `cunarist/eslint-plugin-explicit-types`
as is, only retyped against this repo's `LitRuleTypes`; keep the two in step.
Deno's `camelcase` is Oxlint's built-in `id-match` there (see
[[lint-parity-with-deno]]). Rules and plugin stay in this one file.

`no-non-ts-imports` (user decision) flags import/export sources and dynamic
`import("...")` literals whose last segment has a non-`.ts` extension (`.css`,
`.json`, `.svg`, `.js`, `.mjs`, `.tsx`), any `?query` suffix, and any import
attributes. Extensions count only for relative, absolute, `#` and package
subpath specifiers, so `@fortawesome/x/svgs/a.svg` fails while
`@types/json-schema`, `lodash.debounce`, `lit`, `node:fs` pass.

`scripts/` never ships: `files` is `["dist"]` and `vp pack` builds only
`src/index.ts`, which never imports from `scripts/`.
