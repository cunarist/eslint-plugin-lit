---
description: The lint config must keep every lint check Deno ran; camelcase is Oxlint's id-match; five eslint-plugin-modules rules are open gaps
---

The user requires lint coverage never to shrink below the Deno setup:
`recommended` and `jsr` tags, the include list (`camelcase`, `eqeqeq`,
`guard-for-in`, `no-console`, `no-const-assign`, `no-eval`,
`no-non-null-asserted-optional-chain`, `no-non-null-assertion`,
`no-throw-literal`, `verbatim-module-syntax`), this package's rules, and
`@cunarist/deno-import-check`. Formatting may change.

The rule-by-rule table is in the porting PR,
cunarist/eslint-plugin-explicit-types#1. This repo's Deno setup was the same
(`deno.json` lint: `recommended` and `jsr` tags, the same include list, and
`deno-import-check`), so `configs.project` is copied from there unchanged.
In short, each of the 97 Deno rules is
one of:

- the same rule in `configs.project` of `scripts/project-lint.ts`, set to
  `error`;
- a renamed equivalent (`no-new-symbol` → `no-new-native-nonconstructor`,
  `no-window` → `no-restricted-globals: window`, `ban-untagged-ignore` →
  `unicorn/no-abusive-eslint-disable`, `ban-unused-ignore` and
  `ban-unknown-rule-code` → `options.reportUnusedDisableDirectives`; beyond
  Deno, `project/no-disable-comments` bans every directive);
- caught by the parser or `typeCheck` (`no-dupe-args`, `no-octal`,
  `no-await-in-sync-fn`, `no-import-assertions` TS2880, `no-sloppy-imports`
  TS2835, `verbatim-module-syntax` TS1484);
- `no-slow-types`: `isolatedDeclarations`, enforced by `vp pack` (TS9010), not
  `vp check`;
- vacuous: JSX rules (no `.tsx` exists) and Deno-only rules.

`maxWarnings: 0` keeps Deno's every-diagnostic-fails behaviour.

`camelcase`, which Oxlint lacks, is the built-in `id-match` in `configs.project`
(see [[repo-only-rules]]): pattern `^_*[^_]*_*$|^[^a-z]*$` (Deno's
`is_underscored`: no `_` once edge underscores are trimmed, or no lowercase
ASCII), `properties: false`, `classFields: false`, `onlyDeclarations: false`,
`ignoreDestructuring: true`. No autofix. Against `deno_lint`'s 130 test cases
it misses 9: unquoted object-literal keys (`{ bar_baz: 1 }`, `{ bar_baz }`),
shorthand destructuring in parameters (`function f({ no_camel })`, with or
without a default, nested too), a same-name alias (`{ a_b: a_b }`), and a
defaulted alias (`{ foo: bar_baz = 1 }`). It over-reports 17: a non-renamed
import (`import { or_middle }`), unresolved global references and assignments
(`first_name = 1`, `x = snake_cased`, `{ [category_id]: y }`), and the 11
ambient `declare` cases. Beyond Deno it also checks type parameters, interface
and type-literal members, class methods, and labels.

Open gaps until the modules plugin is on npm: its `prefer-alias-import`,
`no-barrel-bypass`, `no-relative-bypass`, `enforce-layer-order`, and
`enforce-import-order` (the Deno repo's deno-import-check 0.7.0 already had
the last two). A probe with the 0.10.0 tarball (2026-10-18, `package.json`
aliases in layer order) still reports 9 `enforce-layer-order` errors (tests
in `src/helpers/` importing `#testing` and `#helpers`) and 17
`enforce-import-order` errors (blank lines between package imports, name
order inside braces); fix them when lit adopts the plugin. Its 77
`no-duplicate-import-source` reports flag a type-only import next to a
value import from the same source, which the Deno rule allows (it did not
exist in 0.7.0); settle that in the modules plugin first. After publishing, lit adds
`@cunarist/eslint-plugin-modules` and `@cunarist/eslint-plugin-explicit-types`
from npm as devDependencies and lints itself with them (plugin chain,
2026-10-17), which closes these. Its `no-self-import`,
`no-absolute-import`, and `no-parent-import` map to `import/*` rules, and
`import/no-cycle` stands in for its CLI's cycle check.

The rule list lives in `configs.project` of `scripts/project-lint.ts`;
`vite.config.ts` only spreads it (user decision: no rule listed one by one
there). Before removing a line from it, find what else covers it.
