---
description: The repo lints itself from src/index.ts as a jsPlugin, with nothing excluded
---

`vite.config.ts` loads `./src/index.ts` as a `jsPlugins` entry and spreads
`plugin.configs.all.rules`, so a new rule applies at once to the code that
implements it. Oxlint strips the types itself on Node 24, `#` imports
included; no build runs first.

When a rule fires here, fix the source. The user banned every lint disable
comment: `eslint-` or `oxlint-` `disable`, `disable-line`, `disable-next-line`,
or `enable`, line or block, must fail `vp check`. Oxlint 1.87 has no
`noInlineConfig` (`respectEslintDisableDirectives: false` only ignores
`eslint-*` ones) and no `eslint-comments` rules, so `scripts/project-lint.ts`
has `project/no-disable-comments`. A directive can silence the report on
itself, so two built-ins close the gaps, and none of the three is redundant:
`unicorn/no-abusive-eslint-disable` fails one naming no rule, and the custom
rule skips one naming it, which then silences nothing and fails
`reportUnusedDisableDirectives`. Every form was probed failing.

No file carries a disable comment: rule records are `Map`s keyed by rule id, because a record is
a lookup and ids belong in value position; `Object.fromEntries` turns one into the object a plugin needs.
Visitor objects stay literals: their keys are PascalCase AST node names.
