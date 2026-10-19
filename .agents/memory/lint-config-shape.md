---
description: vite.config.ts lint turns every Oxlint category but nursery on at error (blacklist), names no rule itself, and spreads configs from the plugins and scripts/project-lint.ts
---

The lint config is short and category-driven (user decisions 2026-10-14/15):
turn on whole categories, then list only what parity or a real need adds.

```ts
lint: {
  plugins: ["typescript", "unicorn", "oxc", "import"],
  jsPlugins: ["eslint-plugin-explicit-types", "./scripts/project-lint.ts"],
  categories: { correctness, suspicious, pedantic, perf, style, restriction }, // all "error"
  rules: { ...explicitTypes.configs.concrete.rules, ...projectLint.configs.project.rules },
  ignorePatterns: ["src/generated/**"], // generated files only, see below
  options: { typeAware: true, typeCheck: true, maxWarnings: 0, reportUnusedDisableDirectives: "error" },
},
```

- **Categories (blacklist, user decision 2026-10-19):** `correctness`,
  `suspicious`, `pedantic`, `perf`, `style`, and `restriction` at `error`;
  `nursery` off. `configs.project` holds only the repo's own rules, offs
  (each with a one-line reason: "collides with ...", "too much churn",
  "Node code"), and option tweaks; never a hand-set `"error"` a category
  already turns on. New limits (`max-statements` 25, `max-params` 4,
  `unicorn/max-nested-calls` 4) sit at the smallest values the code passed
  when they were turned on.
- **Default limits stay** (2026-10-16): pedantic's `max-lines` 300,
  `max-lines-per-function` 50, `max-classes-per-file` 1,
  `max-dependencies` 10, `max-params` 3, `complexity` 20. Don't raise them to
  make code pass; refactor (see [[lint-overrides-policy]]). `max-lines` stays
  at 300 everywhere, `scripts/` included, with no override: split a large
  file into flat themed files (2026-10-16). `configs.project` turns off only
  `typescript/prefer-readonly-parameter-types` and
  `typescript/no-unsafe-enum-comparison`, because AST visitors fight them;
  other offs follow the blacklist lists in the user's lint policy.
  `max-lines-per-function` is on at 50 (user decision 2026-10-17): split a
  long `create()` or visitor into module-level helpers (`checkElement`,
  `reportUppercase(context, attribute)`) that take `context`, the template
  source, and plain data explicitly; bundle extra arguments into one object
  to stay within `max-params`.
- **`vite.config.ts` names no rule.** Every rule id, built-in ones included,
  lives in `configs.project` of `scripts/project-lint.ts`
  ([[project-lint-plugin]]). `vite.config.ts` only spreads configs.
- **Published plugins are consumed through their configs**: ESLint flat config
  uses `plugin.configs.<name>`; Oxlint lists the package in `jsPlugins` and
  spreads `plugin.configs.<name>.rules`, since Oxlint plugins carry no configs.
  Use the configs equivalent to what the repo enabled under Deno.
- **`maxWarnings: 0`** keeps Deno's "every diagnostic fails" behaviour.
- **`ignorePatterns`** is only for generated files (compiled output, codegen).
  Hand-written code is never ignored.
- **No lint disable comments**: [[lint-no-disable-comments]].
- **Parity:** [[lint-parity-never-shrinks]]. **Naming:** [[naming-id-match]].
- Don't add a second import sorter; the import-structure plugin's `enforce-import-order` is
  the only one, and Oxfmt's `sortImports` stays off.

`perf` came last: in the template it flagged nine `.includes` on constant
arrays, fixed as `ReadonlySet` + `.has()` rather than by turning a rule off.
That is the expected response to any new rule: change the code.
