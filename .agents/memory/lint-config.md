---
description: Lint config shape and exceptions model - all categories but nursery on, plugins via `all`, repo-wide offs in configs.project.rules, per-file exceptions only in projectOverrides, ignorePatterns only for generated output
---

User decisions 2026-10-19 (blacklist policy, exceptions model), same in
every repo.

- **Categories:** `correctness`, `suspicious`, `pedantic`, `perf`, `style`,
  `restriction` at `error`; `nursery` stays off (no line for it).
- **Plugins** are enabled whole through their `all` config
  (`lit.configs.all.rules`), never rule by rule.
- **Blacklist:** `projectLint.configs.project.rules` in
  `scripts/project-lint.ts`, spread last in `rules`, holds only the repo's
  own rules, repo-wide offs (each with a one-line reason: collides with ...,
  too much churn, Node code), and option tweaks. Never a hand-set `"error"`
  a category already turns on. `vite.config.ts` names no rule.
- **Per-file exceptions** live only in `projectOverrides`, the whole
  `overrides` array exported by `scripts/project-lint.ts`: the Node-code
  entry (`vite.config.ts`, `scripts/**`) first, then one entry per
  exception with a why-comment. Here the only one is
  `import/max-dependencies` off for the `src/rules/index.ts` registry.
- **No `allowFiles`** option on any custom rule, and **no disable comments**
  ([[lint-no-disable-comments]]).
- **`ignorePatterns`** holds only generated or build output, never
  hand-written code. This repo has none (`dist/` is gitignored).
- **Precedence:** categories < `rules` (later spread wins) < `overrides`
  (later entry wins).
- Default limits stay (`max-lines` 300, `max-lines-per-function` 50,
  `max-dependencies` 10, ...); refactor instead of raising them or adding an
  exception: split files, extract helpers, import a barrel, pass one options
  object.

```ts
// vite.config.ts
lint: {
  plugins: ["typescript", "unicorn", "oxc", "import"],
  jsPlugins: ["./src/plugin/index.ts", "./scripts/project-lint.ts"],
  categories: { correctness: "error", suspicious: "error", pedantic: "error",
    perf: "error", style: "error", restriction: "error" },
  rules: { ...lit.configs.all.rules, ...projectLint.configs.project.rules },
  overrides: projectOverrides,
},

// scripts/project-lint.ts
export const projectOverrides: OxlintOverride[] = [
  // Node code: the Vite config and repo tooling run on Node, not in a browser.
  { files: ["vite.config.ts", "scripts/**"], rules: nodeRules },
  // The rule registry imports every rule module by design.
  { files: ["src/rules/index.ts"], rules: { "import/max-dependencies": "off" } },
];
```

## Rule decisions (user, 2026-10-19, all repos)

- **Off**, each with its reason in `scripts/project-lint.ts`:
  `typescript/switch-exhaustiveness-check` (TypeScript's type checking
  covers it; no `considerDefaultExhaustiveForUnions` anywhere),
  `consistent-return` (not type-aware; `noImplicitReturns` covers it),
  `no-await-in-loop` (sequential awaits are intentional; keep plain loops).
- **On** through the categories, never turned off:
  `init-declarations` (an uninitialized `let` becomes
  `let x: T | null = null;`, narrowed by assignment, no extra checks),
  `typescript/promise-function-async` with `require-await` and
  `typescript/return-await` (`async f() { const x = await g(); return x; }`),
  `no-use-before-define` with only `{ functions: false }` (move constants and
  classes above their first use), `unicorn/no-array-for-each` (use
  `for...of`), `unicorn/no-array-reduce` (use a loop),
  `unicorn/prefer-structured-clone`, `typescript/prefer-nullish-coalescing`
  (defaults; an explicit check only where `""` or `0` falling through would
  be a bug), `typescript/no-explicit-any` and every `no-unsafe-*` rule.
  `unknown` is allowed: untrusted data is `unknown` plus a type guard.
- **`project/*` rules:** `no-disable-comments`, `no-asset-imports`,
  `prefer-ascii` (source is ASCII: `-` not an em dash, `...` not an
  ellipsis), and the hugoalh ports `no-duplicate-interfaces`,
  `no-duplicate-typeofs`, `no-duplicate-types`, `no-empty-yield`,
  `no-modifier-private`, `no-nan` (no `NaN` sentinels: use `null`),
  `no-unsafe-number`, `no-useless-continue`, `no-useless-type`. They are
  copied from `cunarist/eslint-plugin-explicit-types`, retyped for
  `LitRuleTypes`. hugoalh's `no-enum` is not needed: `erasableSyntaxOnly`
  rejects enums.
- **Fixes stay minimal:** no file or function splitting just to satisfy a
  rule. Behavior may change only when the result is more modern, cleaner,
  and not more dangerous.

Related: [[project-lint-plugin]], [[lint-parity-never-shrinks]],
[[naming-id-match]], [[naming-upper-snake-values]].
