At the start of every new session, run `damem recall` in the terminal and treat
its output as the context for this repository. If the `damem` command is not
found, read [INSTALL.md](https://github.com/cunarist/damem/blob/main/INSTALL.md)
and follow it before reasoning or responding.

# AGENTS.md

## Project

- **eslint-plugin-lit-robust**: lint rules for Lit web components. One
  ESLint plugin that also runs under Oxlint. Namespace `lit-robust`, 83
  rules in five presets (`core`, `strict`, `dom-ref`, `reactive-controller`,
  `naming`).
- The package's only export is the default one, the plugin. Configs live at
  `plugin.configs`: the five presets and `all` (every rule, built from the
  rule registry). No `recommended`, no named exports.
- Runs on Node.js 22.18+; Bun is not a supported target. Built with Vite+ (`vp`):
  Oxlint, Oxfmt, type checking, Vitest, tsdown.
- Ported from the Deno package `jsr:@cunarist/deno-lint-plugin-lit`. The
  published plugin keeps all 82 of its rules, same names and behavior; flag
  anything that cannot be 1:1 to the user. Rules added since the port
  (`no-render-root-escape`) need the user's approval and are listed in
  `ADDED_GROUPS` in `tests/configs.test.ts`.
  Status and open questions: `port-from-deno`.

## Rules

- `vp check`, `vp test`, and `vp pack` must all pass. `vp check --fix` formats.
- The only config files are `package.json`, `tsconfig.json`, and
  `vite.config.ts`, plus `package-lock.json`. Only `.ts` source files, configs
  included; there are no `.js`, `.mjs`, `.cjs`, `.jsx`, or `.tsx` files.
- Entry files are `index.ts` only. `scripts/` is flat, with no subfolders and
  no `index.ts`. Every rule lives flat in
  `src/rules/<rule-id>.ts`, tested in `src/rules/<rule-id>.test.ts` and
  registered in `src/rules/index.ts`. There are no per-preset folders.
- Each rule file has one named export with a `Rule` suffix, e.g.
  `export const noUnsafeHtmlRule`. The package's only default export is the plugin
  in `src/plugin/index.ts`; `scripts/project-lint.ts` default-exports its own.
- Configs are lists of rule ids in `src/plugin/index.ts`, since a rule can belong to
  several. `all` is built from the registry.
- A `package.json` `imports` alias may point anywhere and owns its target: a
  folder's `index.ts` owns that folder and everything below it, any other file
  owns only that file. No file is owned by 2 aliases. Outside an area, only
  the exact alias reaches it (no deeper alias specifier, no relative path);
  inside it, relative imports of siblings and subfolders are free. `../` is
  banned in every file. Files no alias owns import `./` siblings and
  subfolders freely. No `/*` patterns; `jsPlugins` entries stay path strings.
  See `imports-aliases-barrels`. Our own files are `.ts` only; `.js`, `.mts`, and `.mjs` imports are
  package subpaths (`lit/decorators.js`); `project/no-asset-imports` fails any other
  extension in the last path segment (CSS, JSON, SVG, ...), a query suffix
  like `?raw`, or import attributes. Bare package names, `#` aliases, and
  `node:` builtins pass.
- Local convention, stricter than the general alias rule and kept out of
  plugin code and docs: in this repo, `imports` aliases point only at a
  direct subfolder of `src/` (`"#helpers": "./src/helpers/index.ts"`). Code
  outside `src/` imports its own files by `./` relative paths. See
  `imports-aliases-barrels`.
- `meta.name` and `meta.version` are written out in `src/plugin/index.ts`; a release
  bumps them with `package.json`, and `tests/package-meta.test.ts` checks both.
- Rules use ESLint's standard `create` API, typed `LitRule`, with every
  visitor's node parameter annotated. Runtime dependencies are only
  `@eslint/core` (types), `parse5`, `oxc-parser`, and `oxc-resolver`, in
  `dependencies` and never bundled.
- No rule uses type information. Lit detection (`isLitComponent`,
  `isTaggedWith`, `tagRegistrations`, `runtimeImports` in `#helpers`) follows
  imports into other files and packages; it is accurate or silent. See
  `cross-file-detection` and `registration-index`.
- Unit tests sit next to the code as `*.test.ts`. Regression and integration
  tests go in the top-level `tests/` and import the code only through `#`
  aliases (`import plugin from "#plugin"`), never `../`; `tests/` has no lint
  override. `tests/configs.test.ts` pins the rule list and configs. Multi-file
  fixtures are written at test time with `writeProject` from `#testing`,
  never committed.
- Every rule test runs under both ESLint's and Oxlint's `RuleTester` through
  `testRule`, called exactly once per rule file with every case in its `valid`
  and `invalid` lists. Write cases once, in ESLint's shape and 1-based columns.
- Rules this repo enforces on itself but does not publish live in
  `scripts/project-lint.ts`, a repo-local plugin named `project` loaded by
  `vite.config.ts`. Its custom rules, each in a flat `scripts/project-lint-*.ts`
  file, are `no-disable-comments`, `prefer-ascii`, `no-asset-imports`, and
  ports of the hugoalh `recommended` rules Oxlint lacks (`no-nan`,
  `no-unsafe-number`, `no-duplicate-types`, ...). Naming is Oxlint's built-in `id-match`, set in its
  `configs.project`.
  `scripts/` is never packed or published.
- `scripts/` is repo tooling, not production code: no tests.
- The repo lints itself with its own rules. Lint disable and enable comments
  (`eslint-*` or `oxlint-*`, any form) fail `vp check`; fix the source. Three
  checks enforce it together: `project/no-disable-comments`,
  `unicorn/no-abusive-eslint-disable` (a directive naming no rule), and
  `reportUnusedDisableDirectives` (a directive naming
  `project/no-disable-comments`, which that rule skips). Keep all three.
- `vite.config.ts` lists no rule by name: its `rules` spreads
  `configs.all.rules` from `src/plugin/index.ts` and `configs.project.rules` from
  `scripts/project-lint.ts`, which holds the repo's own rule list (parity rules,
  extras, opt-outs, built-in ids included). `vite.config.ts` sets exactly
  `overrides: projectOverrides`, the whole list exported by
  `scripts/project-lint.ts`: the Node code entry first, then per-file
  exceptions, each with a why-comment (no rule takes an `allowFiles`
  option). Its one exception (`import/max-dependencies` off for the
  `src/rules/index.ts` registry) is the only source exception allowed;
  `ignorePatterns` is only for generated output. See `lint-config`.
- Enum-like string values are UPPER_SNAKE wherever this repo owns the format;
  external formats are converted at the boundary. See
  `naming-upper-snake-values`.
- Every file stays under Oxlint's default `max-lines` of 300, `scripts/`
  included; there is no `max-lines` override. Split a growing file into flat
  themed files (`src/helpers/bindings.ts` beside `modules.ts`; in `scripts/`,
  `project-lint-<theme>.ts` beside `project-lint.ts`).
- Lint coverage never shrinks. Check
  `lint-parity-with-deno` before removing anything from `configs.project`.
- Every rule has a `docs/rules/<rule>.md` in the ESLint core layout: Rule
  Details, incorrect/correct examples, and When Not To Use It.
- CI runs every rule test, ESLint and Oxlint halves alike, on node@22.18.0 and
  node@latest. Bun is not tested and not supported.
- `package.json` keys follow Oxfmt's standard sorting (`vp check --fix`).
  There is no `packageManager` field; npm is detected from `package-lock.json`.
- Only CI publishes, from a published GitHub release `vX.Y.Z` that matches
  `package.json`. Use the `release` skill and ask the user first.
- Release notes live only on GitHub releases. There is no `CHANGELOG.md`; never
  add one.
