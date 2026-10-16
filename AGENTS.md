At the start of every new session, run `damem recall` in the terminal and treat
its output as the context for this repository. If the `damem` command is not
found, read [INSTALL.md](https://github.com/cunarist/damem/blob/main/INSTALL.md)
and follow it before reasoning or responding.

# AGENTS.md

## Project

- **@cunarist/eslint-plugin-lit**: lint rules for Lit web components. One
  ESLint plugin that also runs under Oxlint. Namespace `@cunarist/lit`, 82
  rules in five presets (`core`, `strict`, `dom-ref`, `reactive-controller`,
  `naming`).
- The package's only export is the default one, the plugin. Configs live at
  `plugin.configs`: the five presets and `all` (every rule, built from the
  rule registry). No `recommended`, no named exports.
- Runs on Node.js 22+; Bun is not a supported target. Built with Vite+ (`vp`):
  Oxlint, Oxfmt, type checking, Vitest, tsdown.
- Ported from the Deno package `jsr:@cunarist/deno-lint-plugin-lit`. The
  published plugin mirrors exactly its 82 rules, same names and behavior,
  nothing added or removed; flag anything that cannot be 1:1 to the user.
  Status and open questions: `port-from-deno`.

## Rules

- `vp check`, `vp test`, and `vp pack` must all pass. `vp check --fix` formats.
- The only config files are `package.json`, `tsconfig.json`, and
  `vite.config.ts`, plus `package-lock.json`. Only `.ts` source files, configs
  included; there are no `.js`, `.mjs`, `.cjs`, `.jsx`, or `.tsx` files.
- Every directory's entry file is `index.ts`. Every rule lives flat in
  `src/rules/<rule-id>.ts`, tested in `src/rules/<rule-id>.test.ts` and
  registered in `src/rules/index.ts`. There are no per-preset folders.
- Each rule file has one named export with a `Rule` suffix, e.g.
  `export const noUnsafeHtmlRule`. The package's only default export is the plugin
  in `src/plugin/index.ts`; `scripts/project-lint.ts` default-exports its own.
- Configs are lists of rule ids in `src/plugin/index.ts`, since a rule can belong to
  several. `all` is built from the registry.
- Shared code comes through `#helpers`, `#rules`, and `#testing`, never a relative path
  out of a directory. A `package.json` `imports` alias may point only at a
  direct subfolder of `src/` (`#helpers` → `./src/helpers/index.ts`): never
  at `src/` itself, a deeper folder, or anything outside `src/` (`scripts/`,
  root files). Code outside `src/` (`vite.config.ts`, `scripts/`) imports
  relatively. Source imports only `.ts` files, never JSON;
  `project/no-non-ts-imports` fails any other extension in the last path
  segment, a query suffix like `?raw`, or import attributes. Bare package
  names, `#` aliases, and `node:` builtins pass.
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
  `vite.config.ts`. Its custom rules are `no-disable-comments` and
  `no-non-ts-imports`. Deno's `camelcase` is Oxlint's built-in `id-match`, set
  in its `configs.project`.
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
  `scripts/project-lint.ts`, which holds the repo's own rule list (Deno parity,
  extras, opt-outs, built-in ids included). Only `overrides`, being file globs,
  stays in `vite.config.ts`.
- Lint coverage never drops below what Deno enforced. Check
  `lint-parity-with-deno` before removing anything from `configs.project`.
- Every rule has a `docs/rules/<rule>.md` in the ESLint core layout: Rule
  Details, incorrect/correct examples, and When Not To Use It.
- CI runs every rule test, ESLint and Oxlint halves alike, on node@22 and
  node@latest. Bun is not tested and not supported.
- `package.json` keys stay in hand-written order (metadata, then `scripts`,
  `exports`, `imports`, dependencies); `fmt.sortPackageJson` is off. There is
  no `packageManager` field; npm is detected from `package-lock.json`.
- Only CI publishes, from a published GitHub release `vX.Y.Z` that matches
  `package.json`. Use the `release` skill and ask the user first.
- Release notes live only on GitHub releases. There is no `CHANGELOG.md`; never
  add one.
