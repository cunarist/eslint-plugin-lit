---
description: Rules live flat in src/rules/<rule-id>.ts with a Rule-suffixed named export, a colocated test, a docs page, and one registry src/rules/index.ts
---

Layout decided 2026-10-14, the template for every cunarist plugin repo:

```
src/index.ts                         the plugin, its meta, and its configs
src/rules/index.ts                   the registry: a Map of every rule by id
src/rules/no-keyof.ts                export const noKeyofRule
src/rules/no-keyof.test.ts           one testRule call
src/helpers/index.ts                 #helpers: shared AST and rule code
src/testing/index.ts                 #testing: testRule, spanOf
docs/rules/no-keyof.md               the rule's docs page
tests/configs.test.ts                regression tests via #plugin
tests/package-meta.test.ts           meta vs package.json
scripts/project-lint.ts              repo-local lint plugin, never published
```

- **Flat `src/rules/`**, no folder per preset, because a rule can belong to
  several configs. Everything under `src/` is kebab-case and a rule's file
  name is its rule id, so a diagnostic maps straight to a file.
- **Each rule file has one named export with a `Rule` suffix**
  (`noUtilityTypesRule`). The only default exports are the plugin in
  `src/index.ts` and the plugin in `scripts/project-lint.ts`.
- **Rule records are `Map`s** keyed by rule id (`Object.fromEntries` turns one
  into the object a plugin needs), which keeps naming rules satisfied without
  disable comments.
- **Registry override:** `src/rules/index.ts` must import every rule and
  breaks pedantic `import/max-dependencies` (10). Its per-file override in
  `vite.config.ts` is the **only** `overrides` entry allowed in source, and
  only in plugin repos:

  ```ts
  overrides: [{ files: ["src/rules/index.ts"], rules: { "import/max-dependencies": "off" } }],
  ```

- Rules use ESLint's standard `create(context)` API, never Oxlint's
  `createOnce`. Each repo types them with its own alias (`ExplicitRule`,
  `LitRule`): `@eslint/core`'s `RuleDefinition` with `TSESTree` nodes from
  `@typescript-eslint/types`. ESLint's visitor type is loose, so **annotate
  every visitor's node parameter** (`TSTypeOperator(node:
  TSESTree.TSTypeOperator): void`); a missing one becomes `any` and the
  type-aware `no-unsafe-*` rules fail.
- `vp pack` builds only `src/index.ts`; `files` is `["dist"]`; `scripts/`
  and tests never ship. `tsconfig` sets `isolatedDeclarations`, checked by
  `vp pack` only.
