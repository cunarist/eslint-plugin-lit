---
description: scripts/project-lint.ts is the repo-local plugin "project" holding the repo's rule list (typed DummyRuleMap) and repo-only rules; never published, no tests
---

Every repo has `scripts/project-lint.ts`, copied from
`cunarist/eslint-plugin-explicit-types` and extended. It is a repo-local
Oxlint plugin with `meta.name` `"project"`, loaded through `jsPlugins` in
`vite.config.ts`. It holds:

- **`configs.project.rules`**: the repo's whole rule list beyond the published
  plugin configs: parity rules, extras, per-rule options, and opt-outs,
  built-in Oxlint ids included (`curly`, `id-match`, `import/no-cycle`, ...).
- **Custom rules**, enabled as `project/<rule>`. Every repo has
  `no-disable-comments`, `no-asset-imports`, `prefer-ascii`, and the
  hugoalh ports (2026-10-19, see [[lint-config]]).

The custom rules live in flat themed files sharing the prefix, the same
layout as `cunarist/eslint-plugin-explicit-types`, which `project-lint.ts`
imports; never `scripts/rules/` or `scripts/index.ts`:
`project-lint-types.ts` (`ProjectRule`), `project-lint-source.ts`
(`no-disable-comments`, `prefer-ascii`), `project-lint-modules.ts`
(`no-asset-imports`), `project-lint-hugoalh.ts` and
`project-lint-hugoalh-types.ts` (the hugoalh ports). `project-lint.ts`
itself holds only the rule list, `projectOverrides`, and the plugin object.

```ts
import type { DummyRuleMap } from "vite-plus/lint";

const rules: DummyRuleMap = {
  "id-match": ["error", "^_*[^_]*_*$|^[^a-z]*$", {/* ... */}],
  curly: "error",
  "project/no-disable-comments": "error",
};

const plugin = {
  meta: { name: "project" },
  rules: { "no-disable-comments": noDisableCommentsRule /* ... */ },
  configs: { project: { rules } },
};
export default plugin;
```

## Why `DummyRuleMap` and an unannotated plugin (decided 2026-10-15)

- `DummyRuleMap` (re-exported by `vite-plus/lint`) is Oxlint's type for
  `OxlintConfig.rules`. Despite the name it lists every built-in rule with its
  options, so a typo in a rule id or option is a type error, not just a CI
  failure. Without it, TypeScript widens `"error"` to `string`; `as const`
  doesn't help because Oxlint wants mutable tuples.
- `@eslint/core`'s `Plugin` is too loose to read back: `configs` is optional,
  any key may be missing, and a config may be an array, so
  `projectLint.configs.project.rules` fails in `vite.config.ts` (and `!` is
  banned). Optional chaining still leaves the array case.
- Oxlint's own `Plugin` type (`vite-plus/lint/plugins`) has no `configs`.
- Two hand-written interfaces worked but were dropped as noise; a plain
  config object was rejected because custom rules need the plugin form anyway
  and every repo should look the same.

`scripts/` is tooling, not production code: never packed or published, and
no tests. Narrow `overrides` for `scripts/**` are allowed when a script truly
needs one (e.g. `no-console`); see [[lint-config]].
